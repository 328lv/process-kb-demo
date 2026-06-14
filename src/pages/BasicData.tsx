import { Card, Descriptions, Drawer, Input, Space, Table, Tabs, Tag } from "antd";
import { useMemo, useState } from "react";
import type { PageProps } from "../App";

export default function BasicData({ data }: PageProps) {
  const [keyword, setKeyword] = useState("");
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const includes = (row: Record<string, unknown>) => JSON.stringify(row).toLowerCase().includes(keyword.toLowerCase());
  const parts = useMemo(() => data.parts.filter((row) => includes(row as unknown as Record<string, unknown>)).slice(0, 120), [data.parts, keyword]);
  const resources = useMemo(() => data.resources.filter((row) => includes(row as unknown as Record<string, unknown>)).slice(0, 120), [data.resources, keyword]);

  return (
    <>
      <div className="page-title">
        <h2>基础数据</h2>
        <p>维护零件、材料、设备、刀具、工装和分类字典，是工艺流程、知识、质量和推荐的主键基础。</p>
      </div>
      <Card>
        <Space className="toolbar">
          <Input.Search placeholder="搜索零件号、材料、设备、刀具" allowClear onSearch={setKeyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: 360 }} />
          <Tag color="blue">零件 {data.parts.length}</Tag>
          <Tag color="green">资源 {data.resources.length}</Tag>
        </Space>
        <Tabs
          items={[
            {
              key: "parts",
              label: "零件",
              children: (
                <Table
                  rowKey="partNo"
                  size="small"
                  dataSource={parts}
                  onRow={(record) => ({ onClick: () => setDetail(record as unknown as Record<string, unknown>) })}
                  columns={[
                    { title: "零件号", dataIndex: "partNo" },
                    { title: "名称", dataIndex: "name" },
                    { title: "材料", dataIndex: "material" },
                    { title: "模数", dataIndex: "module" },
                    { title: "齿数", dataIndex: "teeth" },
                    { title: "精度", dataIndex: "accuracy" },
                    { title: "保密", dataIndex: "secretLevel", render: (v) => <Tag color={v === "内部敏感" ? "orange" : "default"}>{v}</Tag> }
                  ]}
                />
              )
            },
            {
              key: "resources",
              label: "设备/刀具/工装",
              children: (
                <Table
                  rowKey="id"
                  size="small"
                  dataSource={resources}
                  onRow={(record) => ({ onClick: () => setDetail(record as unknown as Record<string, unknown>) })}
                  columns={[
                    { title: "编码", dataIndex: "code" },
                    { title: "名称", dataIndex: "name" },
                    { title: "类型", dataIndex: "type" },
                    { title: "规格", dataIndex: "spec" },
                    { title: "范围", dataIndex: "validRange" },
                    { title: "状态", dataIndex: "status", render: (v) => <Tag color={v === "可用" ? "green" : "orange"}>{v}</Tag> }
                  ]}
                />
              )
            }
          ]}
        />
      </Card>
      <Drawer title="基础数据详情" open={!!detail} width={560} onClose={() => setDetail(null)}>
        {detail && (
          <Descriptions column={1} bordered size="small">
            {Object.entries(detail).map(([key, value]) => (
              <Descriptions.Item key={key} label={key}>{String(value)}</Descriptions.Item>
            ))}
          </Descriptions>
        )}
      </Drawer>
    </>
  );
}
