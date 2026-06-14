from pathlib import Path
import json
import unittest


ROOT = Path(__file__).resolve().parents[1]


class ReactKnowledgeBaseProjectTest(unittest.TestCase):
    def test_project_structure_and_deployment_files_exist(self):
        required = [
            "package.json",
            "vite.config.ts",
            "index.html",
            "src/App.tsx",
            "src/main.tsx",
            "src/services/dataService.ts",
            "src/pages/RecommendationWorkbench.tsx",
            ".github/workflows/deploy.yml",
            "README.md",
        ]
        for rel in required:
            self.assertTrue((ROOT / rel).exists(), rel)

    def test_package_declares_expected_stack(self):
        package = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
        deps = package.get("dependencies", {})
        dev_deps = package.get("devDependencies", {})
        for name in ["@vitejs/plugin-react", "vite", "typescript"]:
            self.assertIn(name, dev_deps)
        for name in ["react", "react-dom", "antd", "react-router-dom", "echarts", "echarts-for-react"]:
            self.assertIn(name, deps)
        self.assertEqual(package["scripts"]["build"], "tsc -b && vite build")

    def test_data_files_exist_and_have_planned_scale(self):
        data_dir = ROOT / "public" / "data"
        required = [
            "parts.json",
            "processes.json",
            "knowledge.json",
            "resources.json",
            "qualityRecords.json",
            "equipmentConditions.json",
            "recommendationRules.json",
            "optimizationRecords.json",
            "auditLogs.json",
            "users.json",
        ]
        total = 0
        sizes = {}
        for name in required:
            path = data_dir / name
            self.assertTrue(path.exists(), name)
            data = json.loads(path.read_text(encoding="utf-8"))
            self.assertIsInstance(data, list, name)
            sizes[name] = len(data)
            total += len(data)
        self.assertGreaterEqual(total, 5000)
        self.assertGreaterEqual(sizes["knowledge.json"], 2200)
        self.assertGreaterEqual(sizes["qualityRecords.json"], 1000)

    def test_app_contains_planned_modules_and_roles(self):
        app_text = (ROOT / "src" / "App.tsx").read_text(encoding="utf-8")
        expected_modules = [
            "综合看板",
            "方案推荐工作台",
            "基础数据",
            "工艺流程",
            "工艺知识",
            "设备工况",
            "质量追溯",
            "数据导入导出",
            "系统对接 / API",
            "安全审计与运维",
        ]
        for text in expected_modules:
            self.assertIn(text, app_text)
        for role in ["系统管理员", "工艺管理员", "普通查询用户", "接口调用方"]:
            self.assertIn(role, app_text)

    def test_vite_base_matches_github_pages_repo(self):
        vite_config = (ROOT / "vite.config.ts").read_text(encoding="utf-8")
        self.assertIn('base: "/process-kb-demo/"', vite_config)
        workflow = (ROOT / ".github" / "workflows" / "deploy.yml").read_text(encoding="utf-8")
        self.assertIn("actions/deploy-pages", workflow)


if __name__ == "__main__":
    unittest.main()
