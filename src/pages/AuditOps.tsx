import { Alert, Button, Card, Input, Select, Space, Statistic, Table, Tag, Timeline, Typography } from "antd";
import ReactECharts from "echarts-for-react";
import { useMemo, useState } from "react";
import type { PageProps } from "../App";

const resultColors: Record<string, string> = {
  成功: "green",
  失败: "red",
  部分成功: "orange"
};

const opsItems = [
  { item: "数据备份", owner: "系统管理员", cycle: "每日", state: "模拟正常", note: "前端版以 JSON 和 localStorage 表达备份对象" },
  { item: "权限复核", owner: "系统管理员", cycle: "每月", state: "待复核", note: "正式版需接入统一身份和角色审批" },
  { item: "知识审核", owner: "工艺管理员", cycle: "每周", state: "运行中", note: "导入和编辑条目默认进入待审核状态" },
  { item: "接口巡检", owner: "接口调用方", cycle: "每日", state: "模拟正常", note: "后续对接 API 网关、调用限流和告警" },
  { item: "日志归档", owner: "运维管理员", cycle: "每月", state: "规划中", note: "正式版按内网审计要求保留日志" }
];

export default function AuditOps({ data, currentUser }: PageProps) {
  const [keyword, setKeyword] = useState("");
  const [result, setResult] = useState<string>();
  const rows = useMemo(
    () =>
      data.auditLogs
        .filter((item) => {
          const text = `${item.user}${item.action}${item.targetType}${item.targetId}${item.result}`;
          return (!keyword || text.toLowerCase().includes(keyword.toLowerCase())) && (!result || item.result === result);
        })
        .slice(0, 220),
    [data.auditLogs, keyword, result]
  );

  const failedCount = data.auditLogs.filter((item) => item.result === "失败").length;
  const editCount = data.auditLogs.filter((item) => item.action.includes("编辑") || item.action.includes("新增")).length;
  const importCount = data.auditLogs.filter((item) => item.action.includes("导入")).length;
  const actionStats = data.auditLogs.slice(0, 500).reduce<Record<string, number>>((acc, item) => {
    acc[item.action] = (acc[item.action] ?? 0) + 1;
    return acc;
  }, {});
  const topActions = Object.entries(actionStats).sort((a, b) => b[1] - a[1]).slice(0, 7);

  return (
    <>
      <div className="page-title">
        <h2>安全审计与运维</h2>
        <p>记录角色登录、知识维护、数据导入、接口访问和系统运维动作，支撑后续内网审计要求。</p>
      </div>

      <div className="metric-grid">
        <Card><Statistic title="审计日志" value={data.auditLogs.length} suffix="条" /></Card>
        <Card><Statistic title="维护动作" value={editCount} suffix="次" /></Card>
        <Card><Statistic title="导入动作" value={importCount} suffix="次" /></Card>
        <Card><Statistic title="失败记录" value={failedCount} suffix="条" valueStyle={{ color: failedCount ? "#b83232" : "#417a45" }} /></Card>
      </div>

      <Alert
        type={currentUser.role === "admin" ? "success" : "info"}
        showIcon
        style={{ marginBottom: 16 }}
        message={currentUser.role === "admin" ? "当前角色可查看完整审计与运维视图。" : "当前角色展示受限审计视图，正式版需按组织权限继续细分。"}
      />

      <div className="content-grid">
        <Card title="审计日志">
          <Space className="toolbar">
            <Input.Search
              allowClear
              placeholder="搜索用户、动作、对象、结果"
              style={{ width: 300 }}
              onChange={(event) => setKeyword(event.target.value)}
            />
            <Select
              allowClear
              placeholder="结果"
              style={{ width: 128 }}
              options={["成功", "失败", "部分成功"].map((value) => ({ value }))}
              onChange={setResult}
            />
            <Tag color="blue">显示 {rows.length}</Tag>
          </Space>
          <Table
            rowKey="id"
            size="small"
            dataSource={rows}
            columns={[
              { title: "时间", dataIndex: "createdAt", width: 150 },
              { title: "用户", dataIndex: "user", width: 95 },
              { title: "动作", dataIndex: "action", width: 120 },
              { title: "对象", dataIndex: "targetType", width: 110 },
              { title: "对象 ID", dataIndex: "targetId", ellipsis: true },
              { title: "结果", dataIndex: "result", width: 90, render: (value) => <Tag color={resultColors[value] ?? "default"}>{value}</Tag> }
            ]}
            pagination={{ pageSize: 10 }}
          />
        </Card>
        <Card title="操作分布">
          <ReactECharts
            style={{ height: 324 }}
            option={{
              tooltip: { trigger: "item" },
              series: [
                {
                  type: "pie",
                  radius: ["42%", "70%"],
                  data: topActions.map(([name, value]) => ({ name, value })),
                  label: { formatter: "{b}\n{d}%" }
                }
              ]
            }}
          />
        </Card>
      </div>

      <div className="content-grid" style={{ marginTop: 16 }}>
        <Card title="运维检查项">
          <Table
            rowKey="item"
            size="small"
            pagination={false}
            dataSource={opsItems}
            columns={[
              { title: "检查项", dataIndex: "item", width: 120 },
              { title: "责任角色", dataIndex: "owner", width: 120 },
              { title: "周期", dataIndex: "cycle", width: 80 },
              { title: "状态", dataIndex: "state", width: 100, render: (value) => <Tag color={value === "模拟正常" || value === "运行中" ? "green" : "orange"}>{value}</Tag> },
              { title: "说明", dataIndex: "note" }
            ]}
          />
        </Card>
        <Card title="正式化建设路线">
          <Timeline
            items={[
              { color: "green", children: "演示版：前端路由、角色菜单、JSON 数据和本地持久化" },
              { color: "blue", children: "试运行版：后端 API、数据库、导入任务、统一日志" },
              { color: "orange", children: "内网版：统一身份认证、权限审批、接口网关、备份策略" },
              { color: "gray", children: "运维版：监控告警、容灾恢复、数据质量巡检和审计报表" }
            ]}
          />
          <Typography.Paragraph type="secondary">
            当前页面只模拟安全和运维对象，正式系统需要由后端和基础设施共同保障。
          </Typography.Paragraph>
          <Button disabled={currentUser.role !== "admin"}>生成审计报告</Button>
        </Card>
      </div>
    </>
  );
}
