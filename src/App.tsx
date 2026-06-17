import {
  ApiOutlined,
  AuditOutlined,
  BarChartOutlined,
  CloudServerOutlined,
  DatabaseOutlined,
  ExperimentOutlined,
  FileSearchOutlined,
  ImportOutlined,
  LogoutOutlined,
  PartitionOutlined,
  SafetyCertificateOutlined,
  SettingOutlined
} from "@ant-design/icons";
import { App as AntdApp, Button, Card, Form, Input, Layout, Menu, Select, Space, Spin, Tag, Typography } from "antd";
import type { MenuProps } from "antd";
import { HashRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import Dashboard from "./pages/Dashboard";
import ModelProcessGenerator from "./pages/ModelProcessGenerator";
import RecommendationWorkbench from "./pages/RecommendationWorkbench";
import BasicData from "./pages/BasicData";
import ProcessManagement from "./pages/ProcessManagement";
import KnowledgeManagement from "./pages/KnowledgeManagement";
import EquipmentConditions from "./pages/EquipmentConditions";
import QualityTrace from "./pages/QualityTrace";
import ImportExport from "./pages/ImportExport";
import ApiIntegration from "./pages/ApiIntegration";
import AuditOps from "./pages/AuditOps";
import { loadInitialData, resetData, saveData } from "./services/dataService";
import type { AppData, RoleKey, UserAccount } from "./types";

const { Header, Sider, Content } = Layout;

type PageProps = {
  data: AppData;
  setData: (data: AppData) => void;
  currentUser: UserAccount;
  messageApi: Pick<ReturnType<typeof AntdApp.useApp>["message"], "success" | "error" | "warning">;
};

export type { PageProps };

const roleMenus: Record<RoleKey, string[]> = {
  admin: ["dashboard", "model", "recommend", "basic", "process", "knowledge", "equipment", "quality", "import", "api", "audit"],
  process: ["dashboard", "model", "recommend", "basic", "process", "knowledge", "equipment", "quality", "import", "audit"],
  viewer: ["dashboard", "model", "recommend", "process", "knowledge", "equipment", "quality"],
  api: ["dashboard", "api", "audit"]
};

const roleNameFallbacks: Record<RoleKey, string> = {
  admin: "系统管理员",
  process: "工艺管理员",
  viewer: "普通查询用户",
  api: "接口调用方"
};

const allMenuItems = [
  { key: "dashboard", path: "/dashboard", label: "综合看板", icon: <BarChartOutlined /> },
  { key: "model", path: "/model-generator", label: "模型解析与工艺生成", icon: <FileSearchOutlined /> },
  { key: "recommend", path: "/recommend", label: "方案推荐工作台", icon: <ExperimentOutlined /> },
  { key: "basic", path: "/basic", label: "基础数据", icon: <DatabaseOutlined /> },
  { key: "process", path: "/process", label: "工艺流程", icon: <PartitionOutlined /> },
  { key: "knowledge", path: "/knowledge", label: "工艺知识", icon: <FileSearchOutlined /> },
  { key: "equipment", path: "/equipment", label: "设备工况", icon: <CloudServerOutlined /> },
  { key: "quality", path: "/quality", label: "质量追溯", icon: <SafetyCertificateOutlined /> },
  { key: "import", path: "/import", label: "数据导入导出", icon: <ImportOutlined /> },
  { key: "api", path: "/api", label: "系统对接 / API", icon: <ApiOutlined /> },
  { key: "audit", path: "/audit", label: "安全审计与运维", icon: <AuditOutlined /> }
];

function LoginPage({
  data,
  messageApi,
  onLogin
}: {
  data: AppData;
  messageApi: PageProps["messageApi"];
  onLogin: (user: UserAccount) => void;
}) {
  const [role, setRole] = useState<RoleKey>("admin");
  const selected = data.users.find((user) => user.role === role) ?? data.users[0];
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue({ username: selected.username, password: selected.password, role });
  }, [form, role, selected.password, selected.username]);

  const submit = (values: { username: string; password: string; role: RoleKey }) => {
    const user = data.users.find(
      (entry) => entry.username === values.username && entry.password === values.password && entry.role === values.role
    );
    if (!user) {
      messageApi.error("账号、密码或角色不匹配，请检查登录信息。");
      return;
    }
    onLogin(user);
  };

  return (
    <div className="login-page">
      <section className="login-visual-panel">
        <div>
          <Typography.Title level={1}>工艺知识库系统</Typography.Title>
          <p>
            面向制造工艺知识沉淀、工艺推荐、质量追溯与模型解析，构建统一的知识检索和方案生成工作入口。
          </p>
        </div>
        <div className="login-search-hero">
          <Input.Search size="large" placeholder="搜索工艺、模型、质量问题或知识条目" readOnly />
        </div>
        <img className="login-gear-image" src={`${import.meta.env.BASE_URL}assets/gear-model-preview.png`} alt="齿轮模型" />
        <div className="login-badges">
          <div className="login-badge"><strong>5000+</strong><span>结构化知识数据</span></div>
          <div className="login-badge"><strong>模型</strong><span>解析与方案生成</span></div>
          <div className="login-badge"><strong>质量</strong><span>追溯与风险提示</span></div>
          <div className="login-badge"><strong>权限</strong><span>角色化工作入口</span></div>
        </div>
      </section>
      <section className="login-card-wrap">
        <Card className="login-card">
          <Space align="center" style={{ marginBottom: 20 }}>
            <span className="brand-mark">齿</span>
            <div>
              <Typography.Title level={3} style={{ margin: 0 }}>工艺知识库系统</Typography.Title>
              <Typography.Text type="secondary">知识沉淀 · 工艺推荐 · 质量追溯</Typography.Text>
            </div>
          </Space>
          <Form form={form} layout="vertical" onFinish={submit}>
            <Form.Item label="登录角色" name="role" rules={[{ required: true }]}>
              <Select onChange={(value) => setRole(value)}>
                {data.users.map((user) => (
                  <Select.Option key={user.role} value={user.role}>{user.roleName || roleNameFallbacks[user.role]}</Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="账号" name="username" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item label="密码" name="password" rules={[{ required: true }]}>
              <Input.Password />
            </Form.Item>
            <Button type="primary" htmlType="submit" block size="large">进入系统</Button>
          </Form>
          <Typography.Paragraph type="secondary" style={{ marginTop: 16 }}>
            可切换角色查看不同工作范围，账号信息由系统管理员维护。
          </Typography.Paragraph>
        </Card>
      </section>
    </div>
  );
}

function Shell({ data, setData, currentUser, messageApi, onLogout }: PageProps & { onLogout: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const allowedKeys = roleMenus[currentUser.role];
  const visibleItems = useMemo(() => allMenuItems.filter((item) => allowedKeys.includes(item.key)), [allowedKeys]);
  const menuItems: MenuProps["items"] = visibleItems.map((item) => ({
    key: item.path,
    icon: item.icon,
    label: item.label
  }));
  const pageProps = { data, setData, currentUser, messageApi };

  const selectedKey = useMemo(() => {
    const matched = allMenuItems.find((item) => location.pathname.startsWith(item.path));
    return matched?.path ?? "/dashboard";
  }, [location.pathname]);

  useEffect(() => {
    const isAllowed = visibleItems.some((item) => location.pathname.startsWith(item.path));
    if (!isAllowed) {
      navigate(visibleItems[0]?.path ?? "/dashboard", { replace: true });
    }
  }, [location.pathname, navigate, visibleItems]);

  const onReset = async () => {
    const fresh = await resetData();
    setData(fresh);
    messageApi.success("已恢复初始数据。");
  };

  return (
    <Layout className="site-layout knowledge-shell">
      <Sider className="site-sider" width={248}>
        <div className="site-logo"><span className="brand-mark">知</span>工艺知识库</div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header className="site-header">
          <Space direction="vertical" size={0}>
            <Typography.Text strong>工艺知识库系统</Typography.Text>
            <Typography.Text type="secondary">数据规模 {Object.values(data).reduce((sum, list) => sum + list.length, 0)} 条 · 当前角色 {currentUser.roleName}</Typography.Text>
          </Space>
          <Space>
            <Tag color="blue">{currentUser.name}</Tag>
            <Button icon={<SettingOutlined />} onClick={onReset}>重置数据</Button>
            <Button icon={<LogoutOutlined />} onClick={onLogout}>退出登录</Button>
          </Space>
        </Header>
        <Content className="page-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard {...pageProps} />} />
            <Route path="/model-generator" element={<ModelProcessGenerator {...pageProps} />} />
            <Route path="/recommend" element={<RecommendationWorkbench {...pageProps} />} />
            <Route path="/basic" element={<BasicData {...pageProps} />} />
            <Route path="/process" element={<ProcessManagement {...pageProps} />} />
            <Route path="/knowledge" element={<KnowledgeManagement {...pageProps} />} />
            <Route path="/equipment" element={<EquipmentConditions {...pageProps} />} />
            <Route path="/quality" element={<QualityTrace {...pageProps} />} />
            <Route path="/import" element={<ImportExport {...pageProps} />} />
            <Route path="/api" element={<ApiIntegration {...pageProps} />} />
            <Route path="/audit" element={<AuditOps {...pageProps} />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

function AppInner() {
  const { message: messageApi } = AntdApp.useApp();
  const [data, setDataState] = useState<AppData | null>(null);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  useEffect(() => {
    loadInitialData().then(setDataState).catch((error) => messageApi.error(error.message));
  }, [messageApi]);

  const setData = (next: AppData) => {
    setDataState(next);
    saveData(next);
  };

  if (!data) {
    return <Spin fullscreen tip="正在加载知识库数据..." />;
  }

  if (!currentUser) {
    return <LoginPage data={data} messageApi={messageApi} onLogin={setCurrentUser} />;
  }

  return <Shell data={data} setData={setData} currentUser={currentUser} messageApi={messageApi} onLogout={() => setCurrentUser(null)} />;
}

export default function App() {
  return (
    <AntdApp>
      <HashRouter>
        <AppInner />
      </HashRouter>
    </AntdApp>
  );
}
