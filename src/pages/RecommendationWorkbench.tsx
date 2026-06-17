import { Button, Card, Col, Descriptions, Form, InputNumber, Row, Select, Space, Table, Tag, Typography } from "antd";
import type { PageProps } from "../App";
import { addAudit } from "../services/dataService";
import type { Part, RecommendationRule } from "../types";

type FormValues = {
  partNo?: string;
  material: string;
  module: number;
  teeth: number;
  width: number;
  accuracy: string;
  heatTreatment: string;
  equipmentType: string;
  toolType: string;
};

function scorePart(part: Part, values: FormValues) {
  let score = 0;
  if (part.material === values.material) score += 35;
  if (Math.abs(part.module - values.module) <= 1) score += 25;
  if (Math.abs(part.teeth - values.teeth) <= 12) score += 15;
  if (part.accuracy === values.accuracy) score += 15;
  if (part.heatTreatment === values.heatTreatment) score += 10;
  return score;
}

function matchRule(rules: RecommendationRule[], values: FormValues) {
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

export default function RecommendationWorkbench({ data, setData, currentUser, messageApi }: PageProps) {
  const [form] = Form.useForm<FormValues>();
  const selectedPartNo = Form.useWatch("partNo", form);
  const values = (Form.useWatch([], form) ?? {}) as Partial<FormValues>;

  const selectedPart = data.parts.find((part) => part.partNo === selectedPartNo) ?? data.parts[0];
  const currentValues: FormValues = {
    material: selectedPart.material,
    module: selectedPart.module,
    teeth: selectedPart.teeth,
    width: selectedPart.width,
    accuracy: selectedPart.accuracy,
    heatTreatment: selectedPart.heatTreatment,
    equipmentType: "YK3150E",
    toolType: "TiAlN涂层滚刀",
    ...values
  };
  const rule = matchRule(data.recommendationRules, currentValues);
  const similarParts = data.parts
    .map((part) => ({ ...part, score: scorePart(part, currentValues) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  const route = data.processes.find((item) => item.partNo === selectedPart.partNo) ?? data.processes[0];
  const relatedKnowledge = data.knowledge
    .filter((item) => item.material === currentValues.material || item.partNo === selectedPart.partNo)
    .slice(0, 5);
  const qualityRisks = data.qualityRecords
    .filter((item) => item.partNo === selectedPart.partNo || item.issue.includes("毛刺") || item.issue.includes("波纹"))
    .slice(0, 5);
  const condition = data.equipmentConditions.find((item) => item.equipmentCode === route.equipmentCode) ?? data.equipmentConditions[0];
  const canAdopt = currentUser.role === "admin" || currentUser.role === "process";
  const adoptedRecord = data.optimizationRecords.find((item) => item.partNo === selectedPart.partNo && item.adopted);

  const fillPart = (partNo: string) => {
    const part = data.parts.find((entry) => entry.partNo === partNo);
    if (!part) return;
    form.setFieldsValue({
      partNo,
      material: part.material,
      module: part.module,
      teeth: part.teeth,
      width: part.width,
      accuracy: part.accuracy,
      heatTreatment: part.heatTreatment
    });
  };

  const adoptRecommendation = () => {
    if (!canAdopt) {
      messageApi.warning("当前角色仅可查看推荐结果。");
      return;
    }
    const record = {
      id: `OPT-${Date.now()}`,
      partNo: selectedPart.partNo,
      baseline: `${route.spindleRpm} r/min, ${route.feed} mm/r, ${route.depth} mm`,
      recommended: `${rule.rpmRange[0]}-${rule.rpmRange[1]} r/min, ${rule.feedRange[0]}-${rule.feedRange[1]} mm/r, ${rule.depthRange[0]}-${rule.depthRange[1]} mm`,
      adopted: true,
      result: "推荐方案已进入工艺复核队列",
      createdAt: new Date().toISOString().slice(0, 10)
    };
    const next = addAudit(
      { ...data, optimizationRecords: [record, ...data.optimizationRecords] },
      {
        user: currentUser.name,
        action: "采纳推荐方案",
        targetType: "recommendation",
        targetId: selectedPart.partNo,
        result: "成功"
      }
    );
    setData(next);
    messageApi.success("推荐方案已记录为采纳，数据保存到本地工作记录。");
  };

  return (
    <>
      <div className="page-title">
        <h2>方案推荐工作台</h2>
        <p>以待加工零件为入口，联动工艺、知识、质量、设备工况和规则，形成可解释加工建议。</p>
      </div>
      <div className="workbench-grid">
        <Card title="输入加工条件">
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              partNo: selectedPart.partNo,
              material: selectedPart.material,
              module: selectedPart.module,
              teeth: selectedPart.teeth,
              width: selectedPart.width,
              accuracy: selectedPart.accuracy,
              heatTreatment: selectedPart.heatTreatment,
              equipmentType: "YK3150E",
              toolType: "TiAlN涂层滚刀"
            }}
          >
            <Form.Item label="选择零件" name="partNo">
              <Select showSearch optionFilterProp="label" onChange={fillPart}>
                {data.parts.slice(0, 120).map((part) => (
                  <Select.Option key={part.partNo} value={part.partNo} label={`${part.partNo} ${part.name}`}>
                    {part.partNo} · {part.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Row gutter={12}>
              <Col span={12}><Form.Item label="材料" name="material"><Select options={[...new Set(data.parts.map((p) => p.material))].map((v) => ({ value: v }))} /></Form.Item></Col>
              <Col span={12}><Form.Item label="精度等级" name="accuracy"><Select options={["6级", "7级", "8级", "9级"].map((v) => ({ value: v }))} /></Form.Item></Col>
              <Col span={8}><Form.Item label="模数" name="module"><InputNumber min={0.5} step={0.5} style={{ width: "100%" }} /></Form.Item></Col>
              <Col span={8}><Form.Item label="齿数" name="teeth"><InputNumber min={10} style={{ width: "100%" }} /></Form.Item></Col>
              <Col span={8}><Form.Item label="齿宽" name="width"><InputNumber min={10} style={{ width: "100%" }} /></Form.Item></Col>
              <Col span={12}><Form.Item label="热处理状态" name="heatTreatment"><Select options={["渗碳淬火", "调质", "正火"].map((v) => ({ value: v }))} /></Form.Item></Col>
              <Col span={12}><Form.Item label="可用设备" name="equipmentType"><Select options={["YK3150E", "YKS3132", "YK3180", "Y31125", "YK3132C"].map((v) => ({ value: v }))} /></Form.Item></Col>
              <Col span={24}><Form.Item label="刀具条件" name="toolType"><Select options={["TiAlN涂层滚刀", "高速钢滚刀", "硬质合金滚刀", "重切滚刀", "修形滚刀"].map((v) => ({ value: v }))} /></Form.Item></Col>
            </Row>
          </Form>
        </Card>

        <Card title="推荐结果">
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="推荐工艺路线">{route.operationName} / {route.version}</Descriptions.Item>
            <Descriptions.Item label="推荐设备">{route.equipmentCode}</Descriptions.Item>
            <Descriptions.Item label="推荐刀具">{route.toolCode}</Descriptions.Item>
            <Descriptions.Item label="冷却方式">{rule.coolant}</Descriptions.Item>
            <Descriptions.Item label="主轴转速">{rule.rpmRange[0]} - {rule.rpmRange[1]} r/min</Descriptions.Item>
            <Descriptions.Item label="进给范围">{rule.feedRange[0]} - {rule.feedRange[1]} mm/r</Descriptions.Item>
            <Descriptions.Item label="切深建议">{rule.depthRange[0]} - {rule.depthRange[1]} mm</Descriptions.Item>
            <Descriptions.Item label="风险等级"><Tag color={rule.risk === "高" ? "red" : rule.risk === "中" ? "orange" : "green"}>{rule.risk}</Tag></Descriptions.Item>
            <Descriptions.Item label="采纳状态">
              {adoptedRecord ? <Tag color="green">已采纳</Tag> : <Tag>待复核</Tag>}
            </Descriptions.Item>
          </Descriptions>
          <Typography.Paragraph style={{ marginTop: 16 }}>
            <Typography.Text strong>推荐依据：</Typography.Text>{rule.basis}
          </Typography.Paragraph>
          <Space>
            <Tag color="blue">相似案例 {similarParts.length}</Tag>
            <Tag color="green">引用知识 {relatedKnowledge.length}</Tag>
            <Tag color="orange">质量风险 {qualityRisks.length}</Tag>
            <Tag color={condition.state === "预警" ? "red" : "cyan"}>设备状态 {condition.state}</Tag>
          </Space>
          <div style={{ marginTop: 16 }}>
            <Button type="primary" onClick={adoptRecommendation} disabled={!canAdopt}>
              采纳推荐方案
            </Button>
          </div>
        </Card>
      </div>

      <div className="evidence-grid" style={{ marginTop: 16 }}>
        <Card title="相似零件案例">
          <Table
            rowKey="partNo"
            size="small"
            pagination={false}
            dataSource={similarParts}
            columns={[
              { title: "零件号", dataIndex: "partNo" },
              { title: "材料", dataIndex: "material" },
              { title: "匹配度", dataIndex: "score", render: (value) => `${value}%` }
            ]}
          />
        </Card>
        <Card title="引用知识">
          <Table
            rowKey="id"
            size="small"
            pagination={false}
            dataSource={relatedKnowledge}
            columns={[
              { title: "标题", dataIndex: "title" },
              { title: "风险", dataIndex: "riskLevel", render: (value) => <Tag>{value}</Tag> }
            ]}
          />
        </Card>
        <Card title="质量与工况提示">
          <Table
            rowKey="id"
            size="small"
            pagination={false}
            dataSource={qualityRisks}
            columns={[
              { title: "问题", dataIndex: "issue" },
              { title: "等级", dataIndex: "grade", render: (value) => <Tag color={value === "返修" ? "red" : "orange"}>{value}</Tag> }
            ]}
          />
        </Card>
      </div>
    </>
  );
}
