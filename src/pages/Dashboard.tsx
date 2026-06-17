import { Alert, Button, Card, Col, Input, Progress, Row, Space, Statistic, Table, Tag, Typography } from "antd";
import ReactECharts from "echarts-for-react";
import { useNavigate } from "react-router-dom";
import type { PageProps } from "../App";

export default function Dashboard({ data }: PageProps) {
  const navigate = useNavigate();
  const total = Object.values(data).reduce((sum, list) => sum + list.length, 0);
  const warningEquipments = data.equipmentConditions.filter((item) => item.state === "预警").length;
  const rework = data.qualityRecords.filter((item) => item.grade === "返修").length;
  const adopted = data.optimizationRecords.filter((item) => item.adopted).length;

  const issueCount = data.qualityRecords.slice(0, 600).reduce<Record<string, number>>((acc, item) => {
    acc[item.issue] = (acc[item.issue] ?? 0) + 1;
    return acc;
  }, {});
  const issueTop = Object.entries(issueCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const quickEntries = [
    { title: "模型解析", desc: "从模型特征生成工艺建议", path: "/model-generator" },
    { title: "工艺推荐", desc: "按零件条件生成参数方案", path: "/recommend" },
    { title: "质量知识", desc: "查看异常处置和追溯记录", path: "/quality" },
    { title: "知识维护", desc: "沉淀经验和参数规则", path: "/knowledge" }
  ];

  return (
    <>
      <div className="page-title">
        <h2>综合看板</h2>
        <p>面向工艺知识检索、模型解析、方案生成、质量风险和设备状态的统一工作入口。</p>
      </div>
      <div className="knowledge-portal">
        <section className="knowledge-search-panel">
          <Typography.Title level={4} style={{ marginTop: 0 }}>知识检索与工艺应用</Typography.Title>
          <Typography.Paragraph type="secondary">
            输入零件号、材料、质量问题、工艺关键词或模型特征，快速定位知识、案例和推荐任务。
          </Typography.Paragraph>
          <Input.Search size="large" placeholder="搜索工艺知识、质量问题、设备或零件" />
          <div className="quick-category-grid">
            {quickEntries.map((entry) => (
              <button className="quick-category" key={entry.path} onClick={() => navigate(entry.path)}>
                <strong>{entry.title}</strong>
                <span>{entry.desc}</span>
              </button>
            ))}
          </div>
        </section>
        <Card title="近期知识更新">
          <Table
            rowKey="id"
            size="small"
            pagination={false}
            dataSource={data.knowledge.slice(0, 5)}
            columns={[
              { title: "标题", dataIndex: "title", ellipsis: true },
              { title: "分类", dataIndex: "category", width: 110 },
              { title: "风险", dataIndex: "riskLevel", width: 70, render: (v) => <Tag color={v === "高" ? "red" : "blue"}>{v}</Tag> }
            ]}
          />
        </Card>
      </div>
      <div className="metric-grid">
        <Card><Statistic title="结构化数据总量" value={total} suffix="条" /></Card>
        <Card><Statistic title="知识条目" value={data.knowledge.length} suffix="条" /></Card>
        <Card><Statistic title="质量记录" value={data.qualityRecords.length} suffix="条" /></Card>
        <Card><Statistic title="设备预警" value={warningEquipments} suffix="项" valueStyle={{ color: warningEquipments ? "#a56a17" : "#417a45" }} /></Card>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card
            title="工艺应用入口"
            extra={<Space><Button onClick={() => navigate("/model-generator")}>模型解析</Button><Button type="primary" onClick={() => navigate("/recommend")}>方案推荐</Button></Space>}
          >
            <Alert
              type="info"
              showIcon
              message="知识驱动流程"
              description="通过模型特征、零件条件或质量问题触发知识匹配，联动工艺路线、相似案例、质量风险、设备工况和参数规则，形成可复核的加工建议。"
              style={{ marginBottom: 16 }}
            />
            <Space direction="vertical" style={{ width: "100%" }}>
              <Typography.Text strong>数据完整率</Typography.Text>
              <Progress percent={92} />
              <Typography.Text strong>知识关联率</Typography.Text>
              <Progress percent={86} strokeColor="#217c75" />
              <Typography.Text strong>推荐采纳率</Typography.Text>
              <Progress percent={Math.round((adopted / data.optimizationRecords.length) * 100)} strokeColor="#417a45" />
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="常见质量问题 TOP6">
            <ReactECharts
              style={{ height: 270 }}
              option={{
                grid: { left: 8, right: 8, top: 18, bottom: 24, containLabel: true },
                xAxis: { type: "value" },
                yAxis: { type: "category", data: issueTop.map(([name]) => name).reverse() },
                series: [{ type: "bar", data: issueTop.map(([, count]) => count).reverse(), itemStyle: { color: "#1f4e79" } }]
              }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="近期质量异常">
            <Table
              rowKey="id"
              size="small"
              pagination={false}
              dataSource={data.qualityRecords.filter((item) => item.grade !== "合格").slice(0, 6)}
              columns={[
                { title: "零件号", dataIndex: "partNo" },
                { title: "问题", dataIndex: "issue" },
                { title: "等级", dataIndex: "grade", render: (v) => <Tag color={v === "返修" ? "red" : "orange"}>{v}</Tag> }
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="近期审计动态">
            <Table
              rowKey="id"
              size="small"
              pagination={false}
              dataSource={data.auditLogs.slice(0, 6)}
              columns={[
                { title: "用户", dataIndex: "user" },
                { title: "动作", dataIndex: "action" },
                { title: "结果", dataIndex: "result", render: (v) => <Tag color={v === "成功" ? "green" : "red"}>{v}</Tag> }
              ]}
            />
          </Card>
        </Col>
      </Row>
    </>
  );
}
