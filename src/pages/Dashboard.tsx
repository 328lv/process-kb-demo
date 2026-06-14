import { Alert, Button, Card, Col, Progress, Row, Space, Statistic, Table, Tag, Typography } from "antd";
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

  return (
    <>
      <div className="page-title">
        <h2>综合看板</h2>
        <p>集中展示数据建设进度、知识覆盖、质量异常、设备工况和推荐优化效果。</p>
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
            title="生产决策入口"
            extra={<Button type="primary" onClick={() => navigate("/recommend")}>进入方案推荐工作台</Button>}
          >
            <Alert
              type="info"
              showIcon
              message="推荐主线"
              description="选择待加工零件或输入材料、模数、齿数、齿宽等条件，系统将联动工艺路线、相似案例、质量风险、设备工况和知识条目，形成可解释的加工建议。"
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
