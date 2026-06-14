# 滚齿工艺知识库系统演示版

面向滚齿加工单元的生产决策助手前端系统。当前版本为 React/Vite/TypeScript + Ant Design + ECharts 的可部署演示版，使用 JSON 仿真数据和浏览器 localStorage，不连接真实后端、数据库或涉密生产系统。

## 演示地址

预期 GitHub Pages 地址：

https://328lv.github.io/process-kb-demo/

## 演示账号

| 角色 | 账号 | 密码 | 说明 |
| --- | --- | --- | --- |
| 系统管理员 | admin | 123456 | 查看全部模块，维护数据和审计视图 |
| 工艺管理员 | process_admin | 123456 | 维护工艺、知识、推荐和导入数据 |
| 普通查询用户 | viewer | 123456 | 查询看板、工艺、知识、设备和质量信息 |
| 接口调用方 | api_client | 123456 | 查看接口设计、审计摘要和对接边界 |

## 系统模块

- 登录与多角色入口
- 综合看板
- 方案推荐工作台
- 基础数据
- 工艺流程
- 工艺知识
- 设备工况
- 质量追溯
- 数据导入导出
- 系统对接 / API
- 安全审计与运维

## 数据方案

初始数据位于 `public/data/*.json`，总量不少于 5000 条，其中知识条目约 2200 条、质量记录约 1000 条。系统启动后优先读取浏览器 localStorage；新增、编辑、导入和推荐采纳记录会写入本地存储。顶部“重置数据”可恢复 JSON 初始数据。

## 本地运行

```bash
npm install
npm run dev
```

## 构建验证

```bash
npm run verify
npm run build
```

## 部署

项目已按 GitHub Pages 配置：

- Vite `base` 为 `/process-kb-demo/`
- `.github/workflows/deploy.yml` 使用 GitHub Actions 构建并发布 Pages
- 仓库目标为 `328lv/process-kb-demo`

推送到 `main` 分支后，GitHub Actions 会自动构建 `dist` 并发布到 Pages。

## 正式系统升级方向

演示版用于确认业务模块、数据口径、交互流程和部署形态。后续内网正式系统建议升级为：

- 前端：保留 React/Ant Design 业务界面，接入真实登录和权限
- 后端：建设统一 API、导入任务、规则服务、审计服务
- 数据库：使用达梦 DM8 或内网指定数据库存储主数据、知识、质量和审计
- 集成：对接 MES、PLM/CAPP、质量检测系统、设备采集平台
- 运维：补齐备份、日志归档、监控告警、容灾和安全审计
