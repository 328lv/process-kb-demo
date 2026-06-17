import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Input,
  InputNumber,
  List,
  Progress,
  Row,
  Select,
  Space,
  Steps,
  Table,
  Tag,
  Typography,
  Upload
} from "antd";
import { CloudUploadOutlined, FileSearchOutlined, SaveOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { useMemo, useState } from "react";
import type { UploadProps } from "antd";
import type { PageProps } from "../App";
import { addAudit } from "../services/dataService";
import type { ModelCase, Part, RecommendationRule } from "../types";

type RecognitionValues = {
  partType: string;
  material: string;
  module: number;
  teeth: number;
  width: number;
  accuracy: string;
  heatTreatment: string;
  structureFeatures: string;
};

type GenerationResult = {
  routeName: string;
  equipmentCode: string;
  toolCode: string;
  rpmRange: [number, number];
  feedRange: [number, number];
  depthRange: [number, number];
  coolant: string;
  similarParts: Array<Part & { score: number }>;
  knowledgeRows: PageProps["data"]["knowledge"];
  riskRows: PageProps["data"]["qualityRecords"];
  basis: string;
};

function assetUrl(path: string) {
  return `${import.meta.env.BASE_URL}${path}`.replace(/\/{2,}/g, "/").replace("http:/", "http://").replace("https:/", "https://");
}

function valuesFromCase(item: ModelCase): RecognitionValues {
  return {
    partType: item.partType,
    material: item.material,
    module: item.module,
    teeth: item.teeth,
    width: item.width,
    accuracy: item.accuracy,
    heatTreatment: item.heatTreatment,
    structureFeatures: item.structureFeatures.join("、")
  };
}

function matchRule(rules: RecommendationRule[], values: RecognitionValues) {
  return (
    rules.find(
      (rule) =>
        rule.material === values.material &&
        values.module >= rule.moduleMin &&
        values.module <= rule.moduleMax &&
        rule.accuracy === values.accuracy &&
        rule.heatTreatment === values.heatTreatment
    ) ??
    rules.find((rule) => rule.material === values.material && values.module >= rule.moduleMin && values.module <= rule.moduleMax) ??
    rules[0]
  );
}

function scorePart(part: Part, values: RecognitionValues) {
  let score = 0;
  if (part.material === values.material) score += 30;
  if (part.type === values.partType) score += 15;
  if (Math.abs(part.module - values.module) <= 1) score += 24;
  if (Math.abs(part.teeth - values.teeth) <= 10) score += 16;
  if (part.accuracy === values.accuracy) score += 10;
  if (part.heatTreatment === values.heatTreatment) score += 5;
  return score;
}

function buildGeneratedResult(data: PageProps["data"], values: RecognitionValues): GenerationResult {
  const rule = matchRule(data.recommendationRules, values);
  const similarParts = data.parts
    .map((part) => ({ ...part, score: scorePart(part, values) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
  const anchorPart = similarParts[0] ?? data.parts[0];
  const route = data.processes.find((item) => item.partNo === anchorPart.partNo) ?? data.processes[0];
  const knowledgeRows = data.knowledge
    .filter((item) => item.material === values.material || item.tags.some((tag) => values.structureFeatures.includes(tag)))
    .slice(0, 6);
  const riskRows = data.qualityRecords
    .filter((item) => item.partNo === anchorPart.partNo || item.issue.includes("毛刺") || item.issue.includes("波纹"))
    .slice(0, 6);

  return {
    routeName: route.operationName,
    equipmentCode: route.equipmentCode,
    toolCode: route.toolCode,
    rpmRange: rule.rpmRange,
    feedRange: rule.feedRange,
    depthRange: rule.depthRange,
    coolant: rule.coolant,
    similarParts,
    knowledgeRows,
    riskRows,
    basis: rule.basis
  };
}

export default function ModelProcessGenerator({ data, setData, currentUser, messageApi }: PageProps) {
  const [form] = Form.useForm<RecognitionValues>();
  const [currentCase, setCurrentCase] = useState<ModelCase>(data.modelCases[0]);
  const [fileName, setFileName] = useState(currentCase.fileName);
  const [preview, setPreview] = useState(assetUrl(currentCase.previewImage));
  const [confidence, setConfidence] = useState(currentCase.confidence);
  const [missingFields, setMissingFields] = useState(currentCase.missingFields);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const canSave = currentUser.role === "admin" || currentUser.role === "process";

  const materialOptions = useMemo(() => [...new Set(data.parts.map((part) => part.material))].map((value) => ({ value })), [data.parts]);
  const typeOptions = useMemo(() => [...new Set(data.parts.map((part) => part.type).concat(data.modelCases.map((item) => item.partType)))].map((value) => ({ value })), [data.modelCases, data.parts]);

  const loadCase = (item: ModelCase) => {
    setCurrentCase(item);
    setFileName(item.fileName);
    setPreview(assetUrl(item.previewImage));
    setConfidence(item.confidence);
    setMissingFields(item.missingFields);
    setResult(null);
    form.setFieldsValue(valuesFromCase(item));
  };

  const beforeUpload: UploadProps["beforeUpload"] = (file) => {
    const selected = data.modelCases.find((item) => item.fileName.toLowerCase().includes(file.name.toLowerCase())) ?? currentCase;
    setFileName(file.name);
    setConfidence(Math.max(72, selected.confidence - 8));
    setMissingFields(["材料牌号", "热处理状态", "精度等级"]);
    setResult(null);
    form.setFieldsValue(valuesFromCase(selected));

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setPreview(String(reader.result));
      reader.readAsDataURL(file);
    } else {
      setPreview(assetUrl(selected.previewImage));
    }
    messageApi.success("文件已读取，识别字段已预填，可继续修正后生成方案。");
    return false;
  };

  const generate = async () => {
    const values = await form.validateFields();
    const next = buildGeneratedResult(data, values);
    setResult(next);
    messageApi.success("工艺方案已生成，请复核推荐依据和风险提示。");
  };

  const saveGenerated = async () => {
    const values = await form.validateFields();
    const nextResult = result ?? buildGeneratedResult(data, values);
    const anchor = nextResult.similarParts[0];
    const next = addAudit(
      {
        ...data,
        optimizationRecords: [
          {
            id: `OPT-MODEL-${Date.now()}`,
            partNo: anchor?.partNo ?? currentCase.id,
            baseline: `模型解析：${fileName}`,
            recommended: `${nextResult.routeName}，${nextResult.rpmRange[0]}-${nextResult.rpmRange[1]} r/min，${nextResult.feedRange[0]}-${nextResult.feedRange[1]} mm/r`,
            adopted: true,
            result: "模型解析方案已进入工艺复核队列",
            createdAt: new Date().toISOString().slice(0, 10)
          },
          ...data.optimizationRecords
        ]
      },
      {
        user: currentUser.name,
        action: "保存模型生成方案",
        targetType: "model-generation",
        targetId: fileName,
        result: "成功"
      }
    );
    setData(next);
    setResult(nextResult);
    messageApi.success("生成方案已保存到本地工作记录。");
  };

  return (
    <>
      <div className="page-title">
        <h2>模型解析与工艺生成</h2>
        <p>从齿轮模型或三维图样中提取关键特征，联动知识库生成工艺路线、参数建议和风险提示。</p>
      </div>

      <div className="model-generator-layout">
        <Card title="上传模型文件" className="model-upload-card">
          <Upload.Dragger beforeUpload={beforeUpload} showUploadList={false} accept=".step,.stp,.png,.jpg,.jpeg">
            <p className="ant-upload-drag-icon"><CloudUploadOutlined /></p>
            <p className="ant-upload-text">选择 STEP / STP / 图片文件</p>
            <p className="ant-upload-hint">文件只在浏览器本地读取，用于预填识别字段。</p>
          </Upload.Dragger>
          <Typography.Text className="muted">当前文件：{fileName}</Typography.Text>
          <div className="sample-case-list">
            <Typography.Text strong>使用内置样例</Typography.Text>
            <Space wrap>
              {data.modelCases.map((item) => (
                <Button key={item.id} size="small" onClick={() => loadCase(item)} type={item.id === currentCase.id ? "primary" : "default"}>
                  {item.name}
                </Button>
              ))}
            </Space>
          </div>
          <img className="model-preview-image" src={preview} alt="齿轮模型预览" />
        </Card>

        <Card title="识别结果">
          <Steps
            size="small"
            current={2}
            items={[
              { title: "文件读取" },
              { title: "特征提取" },
              { title: "字段复核" },
              { title: "方案生成" }
            ]}
          />
          <div className="recognition-score">
            <Progress type="dashboard" percent={confidence} />
            <div>
              <Typography.Text strong>识别置信度</Typography.Text>
              <Typography.Paragraph type="secondary">置信度用于提示复核优先级，不替代工艺人员确认。</Typography.Paragraph>
            </div>
          </div>
          <Alert
            type={missingFields.length ? "warning" : "success"}
            showIcon
            message="需人工确认项"
            description={missingFields.length ? missingFields.join("、") : "关键字段已具备生成条件。"}
            style={{ marginBottom: 16 }}
          />
          <Form form={form} layout="vertical" initialValues={valuesFromCase(currentCase)}>
            <Row gutter={12}>
              <Col span={12}><Form.Item label="零件类型" name="partType" rules={[{ required: true }]}><Select options={typeOptions} /></Form.Item></Col>
              <Col span={12}><Form.Item label="材料" name="material" rules={[{ required: true }]}><Select options={materialOptions} /></Form.Item></Col>
              <Col span={8}><Form.Item label="模数" name="module" rules={[{ required: true }]}><InputNumber min={0.5} step={0.5} style={{ width: "100%" }} /></Form.Item></Col>
              <Col span={8}><Form.Item label="齿数" name="teeth" rules={[{ required: true }]}><InputNumber min={8} style={{ width: "100%" }} /></Form.Item></Col>
              <Col span={8}><Form.Item label="齿宽" name="width" rules={[{ required: true }]}><InputNumber min={5} style={{ width: "100%" }} /></Form.Item></Col>
              <Col span={12}><Form.Item label="精度等级" name="accuracy" rules={[{ required: true }]}><Select options={["6级", "7级", "8级", "9级"].map((value) => ({ value }))} /></Form.Item></Col>
              <Col span={12}><Form.Item label="热处理状态" name="heatTreatment" rules={[{ required: true }]}><Select options={["渗碳淬火", "调质", "正火"].map((value) => ({ value }))} /></Form.Item></Col>
              <Col span={24}><Form.Item label="结构特征" name="structureFeatures"><Input /></Form.Item></Col>
            </Row>
          </Form>
          <Space>
            <Button type="primary" icon={<ThunderboltOutlined />} onClick={generate}>生成工艺方案</Button>
            <Button icon={<SaveOutlined />} onClick={saveGenerated} disabled={!canSave}>保存生成方案</Button>
          </Space>
        </Card>
      </div>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} xl={10}>
          <Card title="推荐工艺路线">
            {result ? (
              <Descriptions bordered column={1} size="small">
                <Descriptions.Item label="工艺路线">{result.routeName}</Descriptions.Item>
                <Descriptions.Item label="设备">{result.equipmentCode}</Descriptions.Item>
                <Descriptions.Item label="刀具">{result.toolCode}</Descriptions.Item>
                <Descriptions.Item label="参数建议">
                  {result.rpmRange[0]}-{result.rpmRange[1]} r/min，{result.feedRange[0]}-{result.feedRange[1]} mm/r，切深 {result.depthRange[0]}-{result.depthRange[1]} mm
                </Descriptions.Item>
                <Descriptions.Item label="冷却方式">{result.coolant}</Descriptions.Item>
                <Descriptions.Item label="推荐依据">{result.basis}</Descriptions.Item>
              </Descriptions>
            ) : (
              <Typography.Text type="secondary">完成字段复核后点击生成工艺方案。</Typography.Text>
            )}
          </Card>
        </Col>
        <Col xs={24} xl={14}>
          <Card title="参数建议与知识依据">
            <div className="inline-panel-grid">
              <section className="inline-panel">
                <div className="inline-panel-title">相似零件案例</div>
                <Table
                  rowKey="partNo"
                  size="small"
                  pagination={false}
                  dataSource={result?.similarParts ?? []}
                  columns={[
                    { title: "零件号", dataIndex: "partNo" },
                    { title: "匹配", dataIndex: "score", render: (value) => `${value}%` }
                  ]}
                />
              </section>
              <section className="inline-panel">
                <div className="inline-panel-title">引用知识</div>
                <List
                  size="small"
                  dataSource={result?.knowledgeRows ?? []}
                  renderItem={(item) => (
                    <List.Item>
                      <Tag color={item.riskLevel === "高" ? "red" : "blue"}>{item.category}</Tag>
                      {item.title}
                    </List.Item>
                  )}
                />
              </section>
              <section className="inline-panel">
                <div className="inline-panel-title">质量风险</div>
                <List
                  size="small"
                  dataSource={result?.riskRows ?? []}
                  renderItem={(item) => (
                    <List.Item>
                      <Tag color={item.grade === "返修" ? "red" : "orange"}>{item.grade}</Tag>
                      {item.issue}
                    </List.Item>
                  )}
                />
              </section>
            </div>
          </Card>
        </Col>
      </Row>

      <Alert
        style={{ marginTop: 16 }}
        type="info"
        showIcon
        icon={<FileSearchOutlined />}
        message="流程说明"
        description="当前模块体现模型特征识别、知识匹配和工艺推荐的协同流程；最终参数仍需结合图纸技术要求、设备状态和工艺人员复核。"
      />
    </>
  );
}
