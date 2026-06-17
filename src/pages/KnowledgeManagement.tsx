import { Button, Card, Drawer, Form, Input, Modal, Select, Space, Table, Tag, Typography } from "antd";
import { useMemo, useState } from "react";
import type { PageProps } from "../App";
import { addAudit, upsertKnowledge } from "../services/dataService";
import type { KnowledgeItem } from "../types";

const riskColors: Record<string, string> = { 高: "red", 中: "orange", 低: "green" };

export default function KnowledgeManagement({ data, setData, currentUser, messageApi }: PageProps) {
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState<string>();
  const [risk, setRisk] = useState<string>();
  const [detail, setDetail] = useState<KnowledgeItem | null>(null);
  const [editing, setEditing] = useState<KnowledgeItem | null>(null);
  const [form] = Form.useForm<KnowledgeItem>();
  const canMaintain = currentUser.role === "admin" || currentUser.role === "process";

  const categories = [...new Set(data.knowledge.map((item) => item.category))];
  const rows = useMemo(
    () =>
      data.knowledge
        .filter((item) => {
          const text = `${item.title}${item.material}${item.tags.join("")}${item.content}${item.partNo}`;
          return (!keyword || text.toLowerCase().includes(keyword.toLowerCase())) && (!category || item.category === category) && (!risk || item.riskLevel === risk);
        })
        .slice(0, 160),
    [category, data.knowledge, keyword, risk]
  );

  const openEditor = (item?: KnowledgeItem) => {
    const value =
      item ??
      ({
        id: `KNO-${Date.now()}`,
        title: "",
        category: "工艺注意事项",
        partNo: data.parts[0].partNo,
        operationNo: "OP-50",
        material: data.parts[0].material,
        tags: ["滚齿"],
        riskLevel: "中",
        status: "待审核",
        content: "",
        cause: "",
        action: "",
        quoteCount: 0,
        updatedAt: new Date().toISOString().slice(0, 10)
      } as KnowledgeItem);
    setEditing(value);
    form.setFieldsValue(value);
  };

  const submit = (values: KnowledgeItem) => {
    const nextItem = { ...editing!, ...values, tags: Array.isArray(values.tags) ? values.tags : String(values.tags).split(/[|,，]/).filter(Boolean) };
    const next = addAudit(upsertKnowledge(data, nextItem), {
      user: currentUser.name,
      action: editing?.title ? "编辑知识" : "新增知识",
      targetType: "knowledge",
      targetId: nextItem.id,
      result: "成功"
    });
    setData(next);
    setEditing(null);
    messageApi.success("知识条目已保存到本地工作记录。");
  };

  return (
    <>
      <div className="page-title">
        <h2>工艺知识</h2>
        <p>沉淀滚齿经验、质量处置、刀具规则和参数优化结论，支持检索、筛选和本地编辑模拟。</p>
      </div>
      <Card>
        <Space className="toolbar">
          <Input.Search placeholder="搜索标题、材料、标签、内容" allowClear onChange={(e) => setKeyword(e.target.value)} style={{ width: 340 }} />
          <Select allowClear placeholder="分类" style={{ width: 170 }} options={categories.map((value) => ({ value }))} onChange={setCategory} />
          <Select allowClear placeholder="风险" style={{ width: 120 }} options={["高", "中", "低"].map((value) => ({ value }))} onChange={setRisk} />
          <Button type="primary" onClick={() => openEditor()} disabled={!canMaintain}>新增知识</Button>
          <Tag color="blue">显示 {rows.length} / 总量 {data.knowledge.length}</Tag>
        </Space>
        <Table
          rowKey="id"
          size="small"
          dataSource={rows}
          columns={[
            { title: "标题", dataIndex: "title", width: 320 },
            { title: "分类", dataIndex: "category" },
            { title: "材料", dataIndex: "material" },
            { title: "风险", dataIndex: "riskLevel", render: (v) => <Tag color={riskColors[v]}>{v}</Tag> },
            { title: "审核", dataIndex: "status" },
            { title: "引用", dataIndex: "quoteCount" },
            {
              title: "操作",
              render: (_, record) => (
                <Space>
                  <Button size="small" onClick={() => setDetail(record)}>详情</Button>
                  <Button size="small" onClick={() => openEditor(record)} disabled={!canMaintain}>编辑</Button>
                </Space>
              )
            }
          ]}
        />
      </Card>
      <Drawer title="知识详情" open={!!detail} onClose={() => setDetail(null)} width={720}>
        {detail && (
          <Space direction="vertical" size="middle">
            <Typography.Title level={4}>{detail.title}</Typography.Title>
            <Space wrap>{detail.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)}</Space>
            <Typography.Paragraph><strong>问题现象：</strong>{detail.content}</Typography.Paragraph>
            <Typography.Paragraph><strong>原因分析：</strong>{detail.cause}</Typography.Paragraph>
            <Typography.Paragraph><strong>处置建议：</strong>{detail.action}</Typography.Paragraph>
            <Typography.Paragraph><strong>关联对象：</strong>{detail.partNo} / {detail.operationNo} / {detail.material}</Typography.Paragraph>
          </Space>
        )}
      </Drawer>
      <Modal title="知识条目编辑" open={!!editing} onCancel={() => setEditing(null)} onOk={() => form.submit()} width={760}>
        <Form form={form} layout="vertical" onFinish={submit}>
          <Form.Item label="标题" name="title" rules={[{ required: true }]}><Input /></Form.Item>
          <Space style={{ width: "100%" }} align="start">
            <Form.Item label="分类" name="category" rules={[{ required: true }]}><Select style={{ width: 180 }} options={categories.map((value) => ({ value }))} /></Form.Item>
            <Form.Item label="风险" name="riskLevel" rules={[{ required: true }]}><Select style={{ width: 120 }} options={["高", "中", "低"].map((value) => ({ value }))} /></Form.Item>
            <Form.Item label="审核状态" name="status" rules={[{ required: true }]}><Select style={{ width: 150 }} options={["已审核", "待审核", "修订中"].map((value) => ({ value }))} /></Form.Item>
          </Space>
          <Form.Item label="标签" name="tags"><Select mode="tags" /></Form.Item>
          <Form.Item label="问题现象" name="content" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>
          <Form.Item label="原因分析" name="cause"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item label="处置建议" name="action"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}
