import { Alert, Card, Descriptions, Space, Statistic, Table, Tag, Timeline, Typography } from "antd";
import ReactECharts from "echarts-for-react";
import type { PageProps } from "../App";

const endpoints = [
  { key: "parts", method: "GET", path: "/api/v1/parts", object: "零件主数据", status: "设计完成", owner: "基础数据服务" },
  { key: "knowledge", method: "GET", path: "/api/v1/knowledge", object: "工艺知识检索", status: "设计完成", owner: "知识服务" },
  { key: "recommend", method: "POST", path: "/api/v1/recommendations", object: "方案推荐", status: "原型验证", owner: "推荐服务" },
  { key: "quality", method: "POST", path: "/api/v1/quality-records", object: "质量记录写入", status: "待联调", owner: "质量系统" },
  { key: "equipment", method: "POST", path: "/api/v1/equipment-conditions", object: "设备工况采集", status: "待联调", owner: "设备采集网关" },
  { key: "audit", method: "GET", path: "/api/v1/audit-logs", object: "审计日志查询", status: "设计完成", owner: "运维服务" }
];

const integrations = [
  { system: "MES", direction: "双向", data: "工单、工序、完工反馈", state: "规划中", frequency: "分钟级" },
  { system: "PLM/CAPP", direction: "接入", data: "零件、图号、工艺版本", state: "规划中", frequency: "日级同步" },
  { system: "质量检测系统", direction: "接入", data: "齿形、齿距、复检结果", state: "样例验证", frequency: "批次同步" },
  { system: "设备采集平台", direction: "接入", data: "负载、转速、报警、采集时间", state: "样例验证", frequency: "秒级/分钟级" },
  { system: "达梦 DM8", direction: "写入", data: "结构化知识库、审计日志", state: "后续建设", frequency: "实时" }
];

const statusColors: Record<string, string> = {
  设计完成: "green",
  原型验证: "blue",
  待联调: "orange",
  规划中: "default",
  样例验证: "blue",
  后续建设: "purple"
};

export default function ApiIntegration({ data, currentUser }: PageProps) {
  const apiUser = data.users.find((user) => user.role === "api");
  const requestTotal = data.auditLogs.filter((item) => item.targetType === "api").length + 1286;
  const successRate = 98.7;

  return (
    <>
      <div className="page-title">
        <h2>系统对接 / API</h2>
        <p>沉淀后续内网部署时的接口边界、数据交换对象、调用角色和联调状态。</p>
      </div>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="当前页面用于表达接口边界和对接对象，正式联调由后端服务统一承接。"
      />

      <div className="metric-grid">
        <Card><Statistic title="接口设计" value={endpoints.length} suffix="项" /></Card>
        <Card><Statistic title="对接系统" value={integrations.length} suffix="个" /></Card>
        <Card><Statistic title="模拟调用" value={requestTotal} suffix="次" /></Card>
        <Card><Statistic title="成功率" value={successRate} suffix="%" /></Card>
      </div>

      <div className="content-grid">
        <Card title="接口清单">
          <Table
            rowKey="key"
            size="small"
            pagination={false}
            dataSource={endpoints}
            columns={[
              { title: "方法", dataIndex: "method", width: 76, render: (value) => <Tag color={value === "GET" ? "green" : "blue"}>{value}</Tag> },
              { title: "路径", dataIndex: "path" },
              { title: "对象", dataIndex: "object" },
              { title: "状态", dataIndex: "status", width: 98, render: (value) => <Tag color={statusColors[value]}>{value}</Tag> }
            ]}
          />
        </Card>
        <Card title="调用概况">
          <ReactECharts
            style={{ height: 295 }}
            option={{
              tooltip: { trigger: "axis" },
              grid: { left: 42, right: 18, top: 28, bottom: 28 },
              xAxis: { type: "category", data: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"] },
              yAxis: { type: "value" },
              series: [
                { name: "查询调用", type: "bar", data: [182, 216, 245, 238, 286, 124, 96], itemStyle: { color: "#1f4e79" } },
                { name: "写入调用", type: "line", data: [32, 45, 51, 47, 58, 18, 12], itemStyle: { color: "#217c75" } }
              ]
            }}
          />
        </Card>
      </div>

      <div className="content-grid" style={{ marginTop: 16 }}>
        <Card title="系统对接矩阵">
          <Table
            rowKey="system"
            size="small"
            pagination={false}
            dataSource={integrations}
            columns={[
              { title: "系统", dataIndex: "system", width: 120 },
              { title: "方向", dataIndex: "direction", width: 86 },
              { title: "数据对象", dataIndex: "data" },
              { title: "频率", dataIndex: "frequency", width: 110 },
              { title: "状态", dataIndex: "state", width: 100, render: (value) => <Tag color={statusColors[value]}>{value}</Tag> }
            ]}
          />
        </Card>
        <Card title="接口调用方">
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="当前登录">{currentUser.roleName}</Descriptions.Item>
              <Descriptions.Item label="模拟账号">{apiUser?.username ?? "api_client"}</Descriptions.Item>
              <Descriptions.Item label="数据范围">零件、工艺、知识、质量、设备、审计摘要</Descriptions.Item>
              <Descriptions.Item label="鉴权方式">后续内网版建议接入统一身份认证与服务令牌</Descriptions.Item>
            </Descriptions>
            <Timeline
              items={[
                { color: "green", children: "第一阶段：前端工作台和数据口径确认" },
                { color: "blue", children: "第二阶段：后端 API、达梦 DM8、权限模型落地" },
                { color: "orange", children: "第三阶段：MES、质量系统、设备采集联调" },
                { color: "gray", children: "第四阶段：审计、备份、容灾和运维监控" }
              ]}
            />
            <Typography.Text type="secondary">
              页面用于表达系统边界和接口方向，正式部署时应由后端统一处理认证、鉴权、审计和数据校验。
            </Typography.Text>
          </Space>
        </Card>
      </div>
    </>
  );
}
