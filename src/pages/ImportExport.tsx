import {
  Alert,
  Button,
  Card,
  Divider,
  Form,
  Input,
  Radio,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Typography,
  Upload
} from "antd";
import { DownloadOutlined, InboxOutlined, ReloadOutlined } from "@ant-design/icons";
import { useMemo, useState } from "react";
import type { UploadProps } from "antd";
import type { PageProps } from "../App";
import { addAudit, parseCsv } from "../services/dataService";
import type { AppData, KnowledgeItem, QualityRecord } from "../types";

type ImportMode = "knowledge" | "quality";
type ErrorRow = {
  row: number;
  reason: string;
  source: string;
};
type ImportResult = {
  success: number;
  failed: number;
  errors: ErrorRow[];
};

const knowledgeSample =
  "标题,分类,关联零件,材料,工序,标签,内容,风险等级\n齿面波纹处置样例,质量问题,PRT-10001,20CrMnTi,OP-50,波纹|滚齿,检查主轴负载和滚刀磨损状态,中";
const qualitySample =
  "零件号,工序,设备,刀具,齿形偏差,齿距误差,螺旋线偏差,问题,结论,处置建议,检测时间\nPRT-10001,OP-50,HB-01,TOOL-001,0.018,0.021,0.015,齿面波纹,关注,复核刀具跳动并降低进给,2026-06-14 10:30";

function cell(row: string[], index: number) {
  return (row[index] ?? "").trim();
}

function importKnowledge(data: AppData, rows: string[][]): { data: AppData; result: ImportResult } {
  const errors: ErrorRow[] = [];
  const entries: KnowledgeItem[] = [];

  rows.slice(1).forEach((row, index) => {
    const rowNumber = index + 2;
    const [title, category, partNo, material, operationNo, tags, content, riskLevel] = [
      cell(row, 0),
      cell(row, 1),
      cell(row, 2),
      cell(row, 3),
      cell(row, 4),
      cell(row, 5),
      cell(row, 6),
      cell(row, 7)
    ];
    if (!title || !category || !content) {
      errors.push({ row: rowNumber, reason: "标题、分类、内容为必填字段", source: row.join(",") });
      return;
    }
    if (riskLevel && !["高", "中", "低"].includes(riskLevel)) {
      errors.push({ row: rowNumber, reason: "风险等级仅支持高、中、低", source: row.join(",") });
      return;
    }
    entries.push({
      id: `KNO-IMPORT-${Date.now()}-${rowNumber}`,
      title,
      category,
      partNo: partNo || "未关联",
      material: material || "未指定",
      operationNo: operationNo || "OP-50",
      tags: tags ? tags.split(/[|,，]/).filter(Boolean) : ["导入"],
      riskLevel: riskLevel || "中",
      status: "待审核",
      content,
      cause: "导入条目待补充原因分析",
      action: "导入条目待工艺管理员复核后发布",
      quoteCount: 0,
      updatedAt: new Date().toISOString().slice(0, 10)
    });
  });

  return {
    data: { ...data, knowledge: [...entries, ...data.knowledge] },
    result: { success: entries.length, failed: errors.length, errors }
  };
}

function importQuality(data: AppData, rows: string[][]): { data: AppData; result: ImportResult } {
  const errors: ErrorRow[] = [];
  const entries: QualityRecord[] = [];

  rows.slice(1).forEach((row, index) => {
    const rowNumber = index + 2;
    const partNo = cell(row, 0);
    const operationNo = cell(row, 1);
    const equipmentCode = cell(row, 2);
    const toolCode = cell(row, 3);
    const profileError = Number(cell(row, 4));
    const pitchError = Number(cell(row, 5));
    const leadError = Number(cell(row, 6));
    const issue = cell(row, 7);
    const grade = cell(row, 8) || "关注";
    const action = cell(row, 9);
    const inspectedAt = cell(row, 10) || new Date().toISOString().slice(0, 19).replace("T", " ");

    if (!partNo || !operationNo || !issue) {
      errors.push({ row: rowNumber, reason: "零件号、工序、问题为必填字段", source: row.join(",") });
      return;
    }
    if ([profileError, pitchError, leadError].some((value) => Number.isNaN(value))) {
      errors.push({ row: rowNumber, reason: "偏差字段必须为数字", source: row.join(",") });
      return;
    }
    if (!["合格", "关注", "返修"].includes(grade)) {
      errors.push({ row: rowNumber, reason: "结论仅支持合格、关注、返修", source: row.join(",") });
      return;
    }
    entries.push({
      id: `QLT-IMPORT-${Date.now()}-${rowNumber}`,
      partNo,
      operationNo,
      equipmentCode: equipmentCode || "未指定",
      toolCode: toolCode || "未指定",
      profileError,
      pitchError,
      leadError,
      issue,
      grade,
      action: action || "待质量工程师确认处置",
      reinspect: grade === "合格" ? "无需复检" : "待复检",
      inspectedAt
    });
  });

  return {
    data: { ...data, qualityRecords: [...entries, ...data.qualityRecords] },
    result: { success: entries.length, failed: errors.length, errors }
  };
}

function downloadFile(filename: string, text: string, type = "text/plain;charset=utf-8") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function ImportExport({ data, setData, currentUser, messageApi }: PageProps) {
  const [mode, setMode] = useState<ImportMode>("knowledge");
  const [text, setText] = useState(knowledgeSample);
  const [result, setResult] = useState<ImportResult | null>(null);

  const readonly = currentUser.role === "viewer" || currentUser.role === "api";
  const sample = mode === "knowledge" ? knowledgeSample : qualitySample;
  const recentImports = useMemo(
    () => data.auditLogs.filter((log) => log.action.includes("导入")).slice(0, 8),
    [data.auditLogs]
  );

  const beforeUpload: UploadProps["beforeUpload"] = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      setText(String(reader.result ?? ""));
      messageApi.success(`已读取文件：${file.name}`);
    };
    reader.readAsText(file, "utf-8");
    return false;
  };

  const runImport = () => {
    if (readonly) {
      messageApi.warning("当前角色仅可查看导入记录。");
      return;
    }
    const rows = parseCsv(text);
    if (rows.length < 2) {
      setResult({ success: 0, failed: 1, errors: [{ row: 1, reason: "CSV 至少需要表头和一行数据", source: text }] });
      return;
    }
    const imported = mode === "knowledge" ? importKnowledge(data, rows) : importQuality(data, rows);
    const next = addAudit(imported.data, {
      user: currentUser.name,
      action: mode === "knowledge" ? "导入工艺知识" : "导入质量记录",
      targetType: mode,
      targetId: `BATCH-${Date.now()}`,
      result: imported.result.failed ? "部分成功" : "成功"
    });
    setData(next);
    setResult(imported.result);
    messageApi.success(`导入完成：成功 ${imported.result.success} 条，失败 ${imported.result.failed} 条。`);
  };

  const exportJson = (key: keyof AppData) => {
    downloadFile(`${key}.json`, JSON.stringify(data[key], null, 2), "application/json;charset=utf-8");
  };

  return (
    <>
      <div className="page-title">
        <h2>数据导入导出</h2>
        <p>模拟知识条目和质量记录的离线导入、字段校验、批次记录与演示数据导出。</p>
      </div>

      <div className="metric-grid">
        <Card><Statistic title="知识条目" value={data.knowledge.length} suffix="条" /></Card>
        <Card><Statistic title="质量记录" value={data.qualityRecords.length} suffix="条" /></Card>
        <Card><Statistic title="导入批次" value={recentImports.length} suffix="批" /></Card>
        <Card><Statistic title="本地存储" value="localStorage" /></Card>
      </div>

      <div className="content-grid">
        <Card title="CSV 导入">
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <Radio.Group
              value={mode}
              onChange={(event) => {
                const value = event.target.value as ImportMode;
                setMode(value);
                setText(value === "knowledge" ? knowledgeSample : qualitySample);
                setResult(null);
              }}
              optionType="button"
              options={[
                { label: "工艺知识", value: "knowledge" },
                { label: "质量记录", value: "quality" }
              ]}
            />
            <Upload.Dragger beforeUpload={beforeUpload} showUploadList={false} accept=".csv,.txt">
              <p className="ant-upload-drag-icon"><InboxOutlined /></p>
              <p className="ant-upload-text">拖入 CSV 文件或点击选择</p>
            </Upload.Dragger>
            <Form layout="vertical">
              <Form.Item label="CSV 内容">
                <Input.TextArea rows={9} value={text} onChange={(event) => setText(event.target.value)} />
              </Form.Item>
            </Form>
            <Space>
              <Button type="primary" onClick={runImport} disabled={readonly}>执行导入</Button>
              <Button icon={<ReloadOutlined />} onClick={() => setText(sample)}>恢复示例</Button>
            </Space>
            {readonly && <Alert type="warning" showIcon message="当前角色没有导入权限。" />}
          </Space>
        </Card>

        <Card title="导入结果">
          {result ? (
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <Space>
                <Tag color="green">成功 {result.success}</Tag>
                <Tag color={result.failed ? "red" : "green"}>失败 {result.failed}</Tag>
              </Space>
              <Table
                rowKey={(row) => `${row.row}-${row.reason}`}
                size="small"
                pagination={false}
                dataSource={result.errors}
                columns={[
                  { title: "行号", dataIndex: "row", width: 80 },
                  { title: "原因", dataIndex: "reason" },
                  { title: "原始行", dataIndex: "source", ellipsis: true }
                ]}
                locale={{ emptyText: "无错误行" }}
              />
            </Space>
          ) : (
            <Typography.Text type="secondary">尚未执行本次导入。</Typography.Text>
          )}
          <Divider />
          <Tabs
            items={[
              {
                key: "batch",
                label: "批次日志",
                children: (
                  <Table
                    rowKey="id"
                    size="small"
                    pagination={false}
                    dataSource={recentImports}
                    columns={[
                      { title: "时间", dataIndex: "createdAt", width: 150 },
                      { title: "用户", dataIndex: "user", width: 90 },
                      { title: "动作", dataIndex: "action" },
                      { title: "结果", dataIndex: "result", width: 90 }
                    ]}
                  />
                )
              },
              {
                key: "export",
                label: "数据导出",
                children: (
                  <Space wrap>
                    <Button icon={<DownloadOutlined />} onClick={() => exportJson("knowledge")}>导出知识 JSON</Button>
                    <Button icon={<DownloadOutlined />} onClick={() => exportJson("qualityRecords")}>导出质量 JSON</Button>
                    <Button icon={<DownloadOutlined />} onClick={() => exportJson("auditLogs")}>导出审计 JSON</Button>
                  </Space>
                )
              }
            ]}
          />
        </Card>
      </div>
    </>
  );
}
