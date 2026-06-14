import { Card, Col, Progress, Row, Table, Tag } from "antd";
import ReactECharts from "echarts-for-react";
import type { PageProps } from "../App";

const stateColors: Record<string, string> = { 运行: "green", 待机: "blue", 预警: "orange", 维护: "red" };

export default function EquipmentConditions({ data }: PageProps) {
  const latest = data.equipmentConditions.slice(0, 160);
  const running = data.equipmentConditions.filter((item) => item.state === "运行").length;
  const warning = data.equipmentConditions.filter((item) => item.state === "预警").length;

  return (
    <>
      <div className="page-title">
        <h2>设备工况</h2>
        <p>展示滚齿机运行状态、主轴负载、实时参数、报警信息和当前加工任务。</p>
      </div>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}><Card><Progress type="dashboard" percent={Math.round((running / data.equipmentConditions.length) * 100)} /><p>运行占比</p></Card></Col>
        <Col xs={24} lg={8}><Card><Progress type="dashboard" percent={Math.round((warning / data.equipmentConditions.length) * 100)} status="exception" /><p>预警占比</p></Card></Col>
        <Col xs={24} lg={8}>
          <Card title="主轴负载趋势">
            <ReactECharts
              style={{ height: 220 }}
              option={{
                xAxis: { type: "category", data: latest.slice(0, 30).map((item) => item.id) },
                yAxis: { type: "value" },
                series: [{ type: "line", smooth: true, data: latest.slice(0, 30).map((item) => item.spindleLoad), areaStyle: {} }]
              }}
            />
          </Card>
        </Col>
      </Row>
      <Card title="滚齿机工况列表" style={{ marginTop: 16 }}>
        <Table
          rowKey="id"
          size="small"
          dataSource={latest}
          columns={[
            { title: "设备", dataIndex: "equipmentCode" },
            { title: "状态", dataIndex: "state", render: (v) => <Tag color={stateColors[v]}>{v}</Tag> },
            { title: "加工任务", dataIndex: "taskPartNo" },
            { title: "主轴负载", dataIndex: "spindleLoad", render: (v) => <Progress percent={v} size="small" /> },
            { title: "转速", dataIndex: "rpm", render: (v) => `${v} r/min` },
            { title: "进给", dataIndex: "feed", render: (v) => `${v} mm/r` },
            { title: "温度", dataIndex: "temperature", render: (v) => `${v}°C` },
            { title: "报警", dataIndex: "alarm" },
            { title: "采集时间", dataIndex: "collectedAt" }
          ]}
        />
      </Card>
    </>
  );
}
