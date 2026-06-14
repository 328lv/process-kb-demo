import { Card, Col, Descriptions, Drawer, Input, Row, Select, Space, Statistic, Table, Tag, Typography } from "antd";
import ReactECharts from "echarts-for-react";
import { useMemo, useState } from "react";
import type { PageProps } from "../App";
import type { QualityRecord } from "../types";

const gradeColors: Record<string, string> = {
  合格: "green",
  关注: "gold",
  返修: "red"
};

export default function QualityTrace({ data }: PageProps) {
  const [keyword, setKeyword] = useState("");
  const [grade, setGrade] = useState<string>();
  const [issue, setIssue] = useState<string>();
  const [detail, setDetail] = useState<QualityRecord | null>(null);

  const issueOptions = [...new Set(data.qualityRecords.map((item) => item.issue))];
  const rows = useMemo(
    () =>
      data.qualityRecords
        .filter((item) => {
          const text = `${item.partNo}${item.operationNo}${item.equipmentCode}${item.toolCode}${item.issue}${item.action}`;
          return (
            (!keyword || text.toLowerCase().includes(keyword.toLowerCase())) &&
            (!grade || item.grade === grade) &&
            (!issue || item.issue === issue)
          );
        })
        .slice(0, 180),
    [data.qualityRecords, grade, issue, keyword]
  );

  const abnormalCount = data.qualityRecords.filter((item) => item.grade !== "合格").length;
  const reworkCount = data.qualityRecords.filter((item) => item.grade === "返修").length;
  const avgProfile =
    data.qualityRecords.reduce((sum, item) => sum + item.profileError, 0) / Math.max(data.qualityRecords.length, 1);
  const trendRows = rows.slice(0, 28).reverse();

  const relatedKnowledge = detail
    ? data.knowledge
        .filter((item) => item.partNo === detail.partNo || item.operationNo === detail.operationNo || item.tags.includes(detail.issue))
        .slice(0, 5)
    : [];

  return (
    <>
      <div className="page-title">
        <h2>质量追溯</h2>
        <p>按零件、工序、设备和刀具追踪检测结果，联动质量问题、处置建议和关联知识。</p>
      </div>

      <div className="metric-grid">
        <Card><Statistic title="质量记录" value={data.qualityRecords.length} suffix="条" /></Card>
        <Card><Statistic title="异常记录" value={abnormalCount} suffix="条" valueStyle={{ color: "#a56a17" }} /></Card>
        <Card><Statistic title="返修记录" value={reworkCount} suffix="条" valueStyle={{ color: "#b83232" }} /></Card>
        <Card><Statistic title="平均齿形偏差" value={avgProfile.toFixed(3)} suffix="mm" /></Card>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={10}>
          <Card title="偏差趋势">
            <ReactECharts
              style={{ height: 280 }}
              option={{
                tooltip: { trigger: "axis" },
                legend: { top: 0, data: ["齿形偏差", "齿距误差", "螺旋线偏差"] },
                grid: { left: 36, right: 20, top: 42, bottom: 28 },
                xAxis: { type: "category", data: trendRows.map((item) => item.partNo) },
                yAxis: { type: "value", name: "mm" },
                series: [
                  { name: "齿形偏差", type: "line", smooth: true, data: trendRows.map((item) => item.profileError) },
                  { name: "齿距误差", type: "line", smooth: true, data: trendRows.map((item) => item.pitchError) },
                  { name: "螺旋线偏差", type: "line", smooth: true, data: trendRows.map((item) => item.leadError) }
                ]
              }}
            />
          </Card>
        </Col>
        <Col xs={24} xl={14}>
          <Card title="检测记录">
            <Space className="toolbar">
              <Input.Search
                allowClear
                placeholder="搜索零件、设备、刀具、问题"
                style={{ width: 280 }}
                onChange={(event) => setKeyword(event.target.value)}
              />
              <Select
                allowClear
                placeholder="结论"
                style={{ width: 120 }}
                options={["合格", "关注", "返修"].map((value) => ({ value }))}
                onChange={setGrade}
              />
              <Select
                allowClear
                showSearch
                placeholder="问题类型"
                style={{ width: 180 }}
                options={issueOptions.map((value) => ({ value }))}
                onChange={setIssue}
              />
              <Tag color="blue">显示 {rows.length} / {data.qualityRecords.length}</Tag>
            </Space>
            <Table
              rowKey="id"
              size="small"
              dataSource={rows}
              onRow={(record) => ({ onClick: () => setDetail(record) })}
              columns={[
                { title: "零件号", dataIndex: "partNo", width: 110 },
                { title: "工序", dataIndex: "operationNo", width: 88 },
                { title: "设备", dataIndex: "equipmentCode", width: 110 },
                { title: "问题", dataIndex: "issue" },
                { title: "齿形", dataIndex: "profileError", width: 86 },
                { title: "齿距", dataIndex: "pitchError", width: 86 },
                { title: "结论", dataIndex: "grade", width: 86, render: (value) => <Tag color={gradeColors[value]}>{value}</Tag> }
              ]}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Col>
      </Row>

      <Drawer title="质量记录详情" open={!!detail} onClose={() => setDetail(null)} width={760}>
        {detail && (
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="零件号">{detail.partNo}</Descriptions.Item>
              <Descriptions.Item label="工序">{detail.operationNo}</Descriptions.Item>
              <Descriptions.Item label="设备">{detail.equipmentCode}</Descriptions.Item>
              <Descriptions.Item label="刀具">{detail.toolCode}</Descriptions.Item>
              <Descriptions.Item label="齿形偏差">{detail.profileError} mm</Descriptions.Item>
              <Descriptions.Item label="齿距误差">{detail.pitchError} mm</Descriptions.Item>
              <Descriptions.Item label="螺旋线偏差">{detail.leadError} mm</Descriptions.Item>
              <Descriptions.Item label="检测时间">{detail.inspectedAt}</Descriptions.Item>
              <Descriptions.Item label="问题">{detail.issue}</Descriptions.Item>
              <Descriptions.Item label="结论"><Tag color={gradeColors[detail.grade]}>{detail.grade}</Tag></Descriptions.Item>
              <Descriptions.Item label="处置建议" span={2}>{detail.action}</Descriptions.Item>
              <Descriptions.Item label="复检状态" span={2}>{detail.reinspect}</Descriptions.Item>
            </Descriptions>
            <Card size="small" title="关联知识">
              {relatedKnowledge.length ? (
                <Space direction="vertical" style={{ width: "100%" }}>
                  {relatedKnowledge.map((item) => (
                    <Typography.Text key={item.id}>
                      <Tag color={item.riskLevel === "高" ? "red" : "blue"}>{item.category}</Tag>
                      {item.title}
                    </Typography.Text>
                  ))}
                </Space>
              ) : (
                <Typography.Text type="secondary">未匹配到直接关联知识。</Typography.Text>
              )}
            </Card>
          </Space>
        )}
      </Drawer>
    </>
  );
}
