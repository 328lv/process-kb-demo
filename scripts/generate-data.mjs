import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const outDir = join(process.cwd(), "public", "data");

const materials = ["20CrMnTi", "42CrMo", "40Cr", "45钢", "QT500-7", "18CrNiMo7-6"];
const partTypes = ["中间轴齿轮", "从动齿轮", "小模数伺服齿轮", "大型齿圈", "试验台加载齿轮", "铸件过渡齿轮"];
const equipment = ["YK3150E", "YKS3132", "YK3180", "Y31125", "YK3132C", "YK3160"];
const tools = ["TiAlN涂层滚刀", "高速钢滚刀", "硬质合金滚刀", "重切滚刀", "修形滚刀"];
const issues = ["齿面毛刺", "齿距波动", "齿向波纹", "刀具磨损", "局部过切", "冷却不足", "切屑堵塞", "齿面撕裂"];
const categories = ["工艺注意事项", "故障排查", "加工经验", "刀具管理", "质量控制", "参数优化", "设备点检", "数据规范"];

function pick(list, index) {
  return list[index % list.length];
}

function pad(num, size = 4) {
  return String(num).padStart(size, "0");
}

function date(index) {
  const day = (index % 27) + 1;
  return `2026-06-${String(day).padStart(2, "0")} ${String(8 + (index % 10)).padStart(2, "0")}:30`;
}

const users = [
  { id: "U-001", username: "admin", password: "123456", name: "系统管理员", role: "admin", roleName: "系统管理员", department: "信息化" },
  { id: "U-002", username: "process", password: "123456", name: "工艺管理员", role: "process", roleName: "工艺管理员", department: "工艺室" },
  { id: "U-003", username: "viewer", password: "123456", name: "普通查询用户", role: "viewer", roleName: "普通查询用户", department: "车间" },
  { id: "U-004", username: "api", password: "123456", name: "接口调用方", role: "api", roleName: "接口调用方", department: "数字孪生平台" }
];

const parts = Array.from({ length: 320 }, (_, i) => {
  const module = Number((1 + (i % 14) * 0.5).toFixed(1));
  return {
    id: `PART-${pad(i + 1)}`,
    partNo: `GH-${2024 + (i % 3)}-${pad(i + 1)}`,
    name: `${pick(partTypes, i)}-${pad(i + 1, 3)}`,
    type: i % 3 === 0 ? "轴类齿轮" : "齿轮类零件",
    material: pick(materials, i),
    drawingNo: `DRW-GC-${pad(i + 1)}`,
    module,
    teeth: 18 + (i % 90),
    width: 18 + (i % 70),
    accuracy: `${6 + (i % 4)}级`,
    heatTreatment: i % 2 === 0 ? "渗碳淬火" : "调质",
    secretLevel: i % 11 === 0 ? "内部敏感" : "普通"
  };
});

const resources = [
  ...equipment.map((name, i) => ({
    id: `RES-EQ-${pad(i + 1, 3)}`,
    type: "equipment",
    code: `EQ-${pad(i + 1, 3)}`,
    name: `${name} 数控滚齿机`,
    spec: `模数 ${1 + i}-${8 + i}`,
    status: i === 2 ? "点检" : "可用",
    validRange: `m${1 + i}-m${8 + i}`
  })),
  ...tools.map((name, i) => ({
    id: `RES-TL-${pad(i + 1, 3)}`,
    type: "tool",
    code: `TL-${pad(i + 1, 3)}`,
    name,
    spec: `${i + 1}头 / ${i % 2 ? "AlCrN" : "TiAlN"}涂层`,
    status: "可用",
    validRange: `m${1 + i}-m${6 + i}`
  })),
  ...Array.from({ length: 80 }, (_, i) => ({
    id: `RES-FX-${pad(i + 1, 3)}`,
    type: "fixture",
    code: `FX-${pad(i + 1, 3)}`,
    name: `滚齿夹具-${pad(i + 1, 3)}`,
    spec: `适用直径 ${60 + i * 2}-${120 + i * 2}mm`,
    status: i % 9 === 0 ? "维护" : "可用",
    validRange: `外齿轮 / ${pick(materials, i)}`
  }))
];

const processes = Array.from({ length: 640 }, (_, i) => {
  const part = pick(parts, i);
  return {
    id: `PROC-${pad(i + 1)}`,
    partNo: part.partNo,
    operationNo: `OP-${50 + (i % 6) * 10}`,
    operationName: pick(["滚齿粗加工", "滚齿精加工", "去毛刺", "齿形检测", "参数优化复核"], i),
    version: `V${1 + (i % 5)}.${i % 9}`,
    status: pick(["试制版", "量产版", "优化版"], i),
    equipmentCode: `EQ-${pad((i % equipment.length) + 1, 3)}`,
    toolCode: `TL-${pad((i % tools.length) + 1, 3)}`,
    spindleRpm: 80 + (i % 300),
    feed: Number((0.35 + (i % 18) * 0.08).toFixed(2)),
    depth: Number((0.2 + (i % 12) * 0.18).toFixed(2)),
    coolant: i % 2 === 0 ? "乳化液充分冷却" : "高压冷却",
    ncProgram: `NC-GC-${pad(i + 1)}`
  };
});

const knowledge = Array.from({ length: 2300 }, (_, i) => {
  const part = pick(parts, i);
  const issue = pick(issues, i);
  return {
    id: `KNO-${pad(i + 1, 5)}`,
    title: `${part.material}${part.name}${issue}处置知识`,
    category: pick(categories, i),
    partNo: part.partNo,
    operationNo: `OP-${50 + (i % 6) * 10}`,
    material: part.material,
    tags: [issue, pick(["滚齿", "刀具", "质量", "设备", "参数"], i), part.accuracy],
    riskLevel: pick(["低", "中", "高"], i),
    status: pick(["已审核", "待审核", "修订中"], i),
    content: `适用于${part.material}、模数${part.module}的滚齿加工。出现${issue}时，应核对工艺参数、滚刀状态、夹持刚性、冷却覆盖和设备负载。`,
    cause: `${issue}通常与参数波动、刀具磨损、设备负载或齿坯基准偏差有关。`,
    action: `建议先复核齿坯跳动和滚刀刃口，再调整转速、进给、切深，并将复盘结论回写知识库。`,
    quoteCount: 3 + (i % 120),
    updatedAt: date(i)
  };
});

const qualityRecords = Array.from({ length: 1100 }, (_, i) => {
  const part = pick(parts, i * 2);
  const issue = pick(issues, i);
  return {
    id: `QLT-${pad(i + 1, 5)}`,
    partNo: part.partNo,
    operationNo: `OP-${50 + (i % 6) * 10}`,
    equipmentCode: `EQ-${pad((i % equipment.length) + 1, 3)}`,
    toolCode: `TL-${pad((i % tools.length) + 1, 3)}`,
    profileError: Number((0.01 + (i % 50) * 0.001).toFixed(3)),
    pitchError: Number((0.015 + (i % 55) * 0.001).toFixed(3)),
    leadError: Number((0.012 + (i % 45) * 0.001).toFixed(3)),
    issue,
    grade: pick(["合格", "关注", "返修"], i),
    action: `按${issue}处置流程复核参数，并关联知识条目KNO-${pad((i % 2300) + 1, 5)}。`,
    reinspect: i % 3 === 0 ? "已复检合格" : "待复检",
    inspectedAt: date(i)
  };
});

const equipmentConditions = Array.from({ length: 420 }, (_, i) => ({
  id: `COND-${pad(i + 1)}`,
  equipmentCode: `EQ-${pad((i % equipment.length) + 1, 3)}`,
  state: pick(["运行", "待机", "预警", "维护"], i),
  taskPartNo: pick(parts, i).partNo,
  spindleLoad: 30 + (i % 65),
  rpm: 70 + (i % 320),
  feed: Number((0.35 + (i % 16) * 0.07).toFixed(2)),
  temperature: 30 + (i % 28),
  alarm: i % 7 === 0 ? "主轴负载偏高，建议复核刀具磨损" : "无异常",
  collectedAt: date(i)
}));

const recommendationRules = Array.from({ length: 220 }, (_, i) => ({
  id: `RULE-${pad(i + 1, 4)}`,
  material: pick(materials, i),
  moduleMin: 1 + (i % 4),
  moduleMax: 4 + (i % 8),
  accuracy: `${6 + (i % 4)}级`,
  heatTreatment: pick(["渗碳淬火", "调质", "正火"], i),
  equipmentType: pick(equipment, i),
  toolType: pick(tools, i),
  rpmRange: [80 + (i % 120), 160 + (i % 260)],
  feedRange: [Number((0.4 + (i % 6) * 0.1).toFixed(2)), Number((0.9 + (i % 8) * 0.12).toFixed(2))],
  depthRange: [Number((0.2 + (i % 5) * 0.1).toFixed(2)), Number((0.8 + (i % 8) * 0.2).toFixed(2))],
  coolant: pick(["乳化液充分冷却", "高压冷却", "定向冷却"], i),
  risk: pick(["低", "中", "高"], i),
  basis: "由相似零件历史工艺、质量复盘和已审核知识条目形成的推荐规则。"
}));

const modelCases = [
  {
    id: "MODEL-001",
    name: "中间轴直齿轮模型",
    fileName: "shaft-gear-m2-36t.step",
    previewImage: "assets/gear-model-preview.png",
    partType: "轴类齿轮",
    material: "20CrMnTi",
    module: 2,
    teeth: 36,
    width: 32,
    accuracy: "7级",
    heatTreatment: "渗碳淬火",
    structureFeatures: ["外齿", "中心孔", "倒角边", "标准齿宽"],
    confidence: 92,
    missingFields: ["表面粗糙度", "批量信息"],
    summary: "模型具备典型轴类齿轮结构，可按中小模数齿轮路线生成初始工艺方案。"
  },
  {
    id: "MODEL-002",
    name: "从动齿轮模型",
    fileName: "driven-gear-m3-48t.stp",
    previewImage: "assets/gear-model-preview.png",
    partType: "齿轮类零件",
    material: "42CrMo",
    module: 3,
    teeth: 48,
    width: 42,
    accuracy: "8级",
    heatTreatment: "调质",
    structureFeatures: ["外齿", "轮毂", "中心孔", "双侧倒角"],
    confidence: 88,
    missingFields: ["键槽方向", "检测基准"],
    summary: "模型特征适合匹配中等模数滚齿路线，需要复核键槽与检测基准要求。"
  },
  {
    id: "MODEL-003",
    name: "小模数伺服齿轮模型",
    fileName: "servo-gear-m1-28t.step",
    previewImage: "assets/gear-model-preview.png",
    partType: "小模数齿轮",
    material: "40Cr",
    module: 1,
    teeth: 28,
    width: 18,
    accuracy: "6级",
    heatTreatment: "调质",
    structureFeatures: ["小模数", "薄壁", "高精度", "轻量化孔"],
    confidence: 84,
    missingFields: ["齿向修形", "最终热处理"],
    summary: "模型偏高精度小模数零件，推荐时需重点关注夹持变形和齿形稳定性。"
  },
  {
    id: "MODEL-004",
    name: "大型齿圈模型",
    fileName: "ring-gear-m5-72t.stp",
    previewImage: "assets/gear-model-preview.png",
    partType: "大型齿圈",
    material: "QT500-7",
    module: 5,
    teeth: 72,
    width: 56,
    accuracy: "9级",
    heatTreatment: "正火",
    structureFeatures: ["大直径", "外齿", "铸件毛坯", "多孔安装面"],
    confidence: 81,
    missingFields: ["毛坯余量", "装夹方案", "批量信息"],
    summary: "模型尺寸较大，推荐路线需优先考虑装夹刚性、毛坯余量和设备行程。"
  }
];

const optimizationRecords = Array.from({ length: 220 }, (_, i) => {
  const part = pick(parts, i);
  return {
    id: `OPT-${pad(i + 1, 4)}`,
    partNo: part.partNo,
    baseline: `rpm ${120 + (i % 140)}, feed ${(0.7 + (i % 5) * 0.1).toFixed(2)}`,
    recommended: `rpm ${150 + (i % 160)}, feed ${(0.55 + (i % 6) * 0.08).toFixed(2)}`,
    adopted: i % 3 !== 0,
    result: i % 3 !== 0 ? "齿面毛刺下降，节拍稳定" : "待工艺人员复核",
    createdAt: date(i)
  };
});

const auditLogs = Array.from({ length: 180 }, (_, i) => ({
  id: `AUD-${pad(i + 1, 4)}`,
  user: pick(users, i).name,
  action: pick(["登录", "查询知识", "导入数据", "编辑知识", "创建推荐", "查看接口"], i),
  targetType: pick(["knowledge", "quality", "process", "recommendation", "api"], i),
  targetId: `TGT-${pad(i + 1, 4)}`,
  result: i % 13 === 0 ? "失败" : "成功",
  createdAt: date(i)
}));

const files = {
  users,
  parts,
  processes,
  knowledge,
  resources,
  qualityRecords,
  equipmentConditions,
  recommendationRules,
  optimizationRecords,
  auditLogs,
  modelCases
};

await mkdir(outDir, { recursive: true });
for (const [name, data] of Object.entries(files)) {
  await writeFile(join(outDir, `${name}.json`), JSON.stringify(data, null, 2), "utf8");
}

console.log(`Generated ${Object.values(files).reduce((sum, data) => sum + data.length, 0)} records in ${outDir}`);
