import type { AppData, AuditLog, KnowledgeItem, QualityRecord } from "../types";

const STORAGE_KEY = "process-kb-demo:data";

const dataFiles: Record<keyof AppData, string> = {
  users: "users.json",
  parts: "parts.json",
  processes: "processes.json",
  knowledge: "knowledge.json",
  resources: "resources.json",
  qualityRecords: "qualityRecords.json",
  equipmentConditions: "equipmentConditions.json",
  recommendationRules: "recommendationRules.json",
  optimizationRecords: "optimizationRecords.json",
  auditLogs: "auditLogs.json",
  modelCases: "modelCases.json"
};

async function fetchJson<T>(file: string): Promise<T[]> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/${file}`);
  if (!response.ok) {
    throw new Error(`无法加载数据文件：${file}`);
  }
  return response.json();
}

async function loadBundledData(): Promise<AppData> {
  const entries = await Promise.all(
    Object.entries(dataFiles).map(async ([key, file]) => [key, await fetchJson(file)])
  );
  return Object.fromEntries(entries) as AppData;
}

export async function loadInitialData(): Promise<AppData> {
  const local = window.localStorage.getItem(STORAGE_KEY);
  if (local) {
    try {
      const parsed = JSON.parse(local) as Partial<AppData>;
      const missingKeys = Object.keys(dataFiles).filter((key) => !Array.isArray(parsed[key as keyof AppData]));
      if (!missingKeys.length) {
        return parsed as AppData;
      }
      const bundled = await loadBundledData();
      const migrated = { ...bundled, ...parsed } as AppData;
      saveData(migrated);
      return migrated;
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }

  const data = await loadBundledData();
  saveData(data);
  return data;
}

export function saveData(data: AppData) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export async function resetData(): Promise<AppData> {
  window.localStorage.removeItem(STORAGE_KEY);
  return loadInitialData();
}

export function addAudit(data: AppData, log: Omit<AuditLog, "id" | "createdAt">): AppData {
  const entry: AuditLog = {
    id: `AUD-${Date.now()}`,
    createdAt: new Date().toISOString().slice(0, 19).replace("T", " "),
    ...log
  };
  return {
    ...data,
    auditLogs: [entry, ...data.auditLogs]
  };
}

export function upsertKnowledge(data: AppData, item: KnowledgeItem): AppData {
  const exists = data.knowledge.some((entry) => entry.id === item.id);
  const knowledge = exists
    ? data.knowledge.map((entry) => (entry.id === item.id ? item : entry))
    : [item, ...data.knowledge];
  return { ...data, knowledge };
}

export function upsertQualityRecord(data: AppData, item: QualityRecord): AppData {
  const exists = data.qualityRecords.some((entry) => entry.id === item.id);
  const qualityRecords = exists
    ? data.qualityRecords.map((entry) => (entry.id === item.id ? item : entry))
    : [item, ...data.qualityRecords];
  return { ...data, qualityRecords };
}

export function parseCsv(text: string): string[][] {
  return text
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const result: string[] = [];
      let current = "";
      let quoted = false;
      for (let index = 0; index < line.length; index += 1) {
        const char = line[index];
        const next = line[index + 1];
        if (char === '"' && quoted && next === '"') {
          current += '"';
          index += 1;
        } else if (char === '"') {
          quoted = !quoted;
        } else if (char === "," && !quoted) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    });
}
