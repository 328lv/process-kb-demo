import { Card, Descriptions, Drawer, Input, Space, Table, Tag } from "antd";
import { useMemo, useState } from "react";
import type { PageProps } from "../App";
import type { ProcessRoute } from "../types";

export default function ProcessManagement({ data }: PageProps) {
  const [keyword, setKeyword] = useState("");
  const [current, setCurrent] = useState<ProcessRoute | null>(null);
  const rows = useMemo(
    () =>
      data.processes
        .filter((item) => `${item.partNo}${item.operationName}${item.status}${item.ncProgram}`.toLowerCase().includes(keyword.toLowerCase()))
        .slice(0, 220),
    [data.processes, keyword]
  );

  return (
    <>
      <div className="page-title">
        <h2>工艺流程</h2>
        <p>管理滚齿工艺路线、工序版本、设备刀具、NC 程序编号和关键加工参数。</p>
      </div>
      <Card>
        <Space className="toolbar">
          <Input.Search placeholder="搜索零件号、工序、版本、NC程序" allowClear onChange={(e) => setKeyword(e.target.value)} style={{ width: 360 }} />
          <Tag color="blue">工序记录 {data.processes.length}</Tag>
        </Space>
        <Table
          rowKey="id"
          size="small"
          dataSource={rows}
          onRow={(record) => ({ onClick: () => setCurrent(record) })}
          columns={[
            { title: "零件号", dataIndex: "partNo" },
            { title: "工序号", dataIndex: "operationNo" },
            { title: "工序名称", dataIndex: "operationName" },
            { title: "版本", dataIndex: "version" },
            { title: "状态", dataIndex: "status", render: (v) => <Tag color={v === "优化版" ? "blue" : v === "量产版" ? "green" : "orange"}>{v}</Tag> },
            { title: "设备", dataIndex: "equipmentCode" },
            { title: "刀具", dataIndex: "toolCode" },
            { title: "转速", dataIndex: "spindleRpm", render: (v) => `${v} r/min` },
            { title: "进给", dataIndex: "feed", render: (v) => `${v} mm/r` },
            { title: "切深", dataIndex: "depth", render: (v) => `${v} mm` }
          ]}
        />
      </Card>
      <Drawer title="工艺路线详情" open={!!current} onClose={() => setCurrent(null)} width={620}>
        {current && (
          <Descriptions column={1} bordered size="small">
            {Object.entries(current).map(([key, value]) => (
              <Descriptions.Item key={key} label={key}>{String(value)}</Descriptions.Item>
            ))}
          </Descriptions>
        )}
      </Drawer>
    </>
  );
}
