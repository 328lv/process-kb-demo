export type RoleKey = "admin" | "process" | "viewer" | "api";

export interface UserAccount {
  id: string;
  username: string;
  password: string;
  name: string;
  role: RoleKey;
  roleName: string;
  department: string;
}

export interface Part {
  id: string;
  partNo: string;
  name: string;
  type: string;
  material: string;
  drawingNo: string;
  module: number;
  teeth: number;
  width: number;
  accuracy: string;
  heatTreatment: string;
  secretLevel: string;
}

export interface ProcessRoute {
  id: string;
  partNo: string;
  operationNo: string;
  operationName: string;
  version: string;
  status: string;
  equipmentCode: string;
  toolCode: string;
  spindleRpm: number;
  feed: number;
  depth: number;
  coolant: string;
  ncProgram: string;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  category: string;
  partNo: string;
  operationNo: string;
  material: string;
  tags: string[];
  riskLevel: string;
  status: string;
  content: string;
  cause: string;
  action: string;
  quoteCount: number;
  updatedAt: string;
}

export interface ResourceItem {
  id: string;
  type: "equipment" | "tool" | "fixture";
  code: string;
  name: string;
  spec: string;
  status: string;
  validRange: string;
}

export interface QualityRecord {
  id: string;
  partNo: string;
  operationNo: string;
  equipmentCode: string;
  toolCode: string;
  profileError: number;
  pitchError: number;
  leadError: number;
  issue: string;
  grade: string;
  action: string;
  reinspect: string;
  inspectedAt: string;
}

export interface EquipmentCondition {
  id: string;
  equipmentCode: string;
  state: string;
  taskPartNo: string;
  spindleLoad: number;
  rpm: number;
  feed: number;
  temperature: number;
  alarm: string;
  collectedAt: string;
}

export interface RecommendationRule {
  id: string;
  material: string;
  moduleMin: number;
  moduleMax: number;
  accuracy: string;
  heatTreatment: string;
  equipmentType: string;
  toolType: string;
  rpmRange: [number, number];
  feedRange: [number, number];
  depthRange: [number, number];
  coolant: string;
  risk: string;
  basis: string;
}

export interface ModelCase {
  id: string;
  name: string;
  fileName: string;
  sampleFile: string;
  previewImage: string;
  partType: string;
  material: string;
  module: number;
  teeth: number;
  width: number;
  accuracy: string;
  heatTreatment: string;
  structureFeatures: string[];
  confidence: number;
  missingFields: string[];
  summary: string;
}

export interface OptimizationRecord {
  id: string;
  partNo: string;
  baseline: string;
  recommended: string;
  adopted: boolean;
  result: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  user: string;
  action: string;
  targetType: string;
  targetId: string;
  result: string;
  createdAt: string;
}

export interface AppData {
  users: UserAccount[];
  parts: Part[];
  processes: ProcessRoute[];
  knowledge: KnowledgeItem[];
  resources: ResourceItem[];
  qualityRecords: QualityRecord[];
  equipmentConditions: EquipmentCondition[];
  recommendationRules: RecommendationRule[];
  optimizationRecords: OptimizationRecord[];
  auditLogs: AuditLog[];
  modelCases: ModelCase[];
}
