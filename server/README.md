# 论文Remake服务

一个智能论文remake服务，支持PDF/文本输入，提供6个核心功能模块，用户可选择文本段落进行针对性remake。

## 功能特性

1. **生成新科研Idea** - 结合最新科研成果，生成新科研idea
2. **检查内容和Reference** - 检查内容问题，更新过时的reference
3. **重新设计实验** - 重新设计实验并生成详细配方
4. **数据绘图** - 接收数据并生成科研图表
5. **理论分析和公式推导** - 严谨的理论分析和数学公式推导
6. **全文整体检查** - 检查论文结构、逻辑、引用格式等

## 项目结构

```
paper-remake-service/
├── backend/          # FastAPI后端
├── frontend/         # React前端
└── README.md
```

## 快速开始

### 后端

1. 安装依赖：
```bash
cd backend
pip install -r requirements.txt
```

2. 配置环境变量：
```bash
cd backend
cp .env.example .env
# 编辑.env文件，填入DeepSeek API密钥等配置
# 必须配置：DEEPSEEK_API_KEY（从 https://platform.deepseek.com 获取）
# 可选配置：OPENALEX_EMAIL（用于搜索学术论文，建议设置）
```

3. 启动服务：
```bash
python -m app.main
# 或
uvicorn app.main:app --host 0.0.0.0 --port 8020
```

### 前端

1. 安装依赖：
```bash
cd frontend
npm install
```

2. （可选）配置API地址（用于局域网访问）：
```bash
# 创建 .env.local 文件
echo "VITE_API_BASE_URL=http://<服务器IP>:8020" > frontend/.env.local
# 例如：VITE_API_BASE_URL=http://10.20.4.57:8020
```

3. 启动开发服务器：
```bash
npm run dev
```

4. 访问：
   - 本地访问：http://localhost:8021
   - 局域网访问：http://<服务器IP>:8021

## 局域网访问配置

服务已配置为支持局域网访问：

- **后端**：默认监听 `0.0.0.0:8020`，局域网内可直接访问
- **前端**：默认监听 `0.0.0.0:8021`，局域网内可直接访问
- **CORS**：已配置为允许所有来源访问

**注意事项**：
- 如果从局域网其他设备访问前端，需要在前端目录创建 `.env.local` 文件，配置后端API地址：
  ```
  VITE_API_BASE_URL=http://<服务器IP>:8020
  ```
- 确保防火墙允许 8020 和 8021 端口的访问

## API文档

启动后端后，访问 http://localhost:8020/docs 或 http://<服务器IP>:8020/docs 查看Swagger API文档。

## 项目文件夹管理

每个上传的论文会自动创建一个项目文件夹，所有生成的内容都保存在其中：

```
projects/
└── {timestamp}_{project_id}/
    ├── paper.pdf              # 原始PDF
    ├── paper_meta.json        # 项目元数据
    ├── original/              # 原始内容
    ├── remakes/               # Remake结果
    ├── data/                  # 数据和图表
    ├── references/            # 参考文献
    ├── drafts/                # 草稿版本
    └── final/                 # 最终版本
```

## 依赖说明

### 后端
- FastAPI - Web框架
- pdfplumber/PyPDF2 - PDF解析
- OpenAI - LLM调用
- sympy - 符号计算
- requests - HTTP客户端

### 前端
- React + TypeScript
- Monaco Editor - 代码编辑器
- react-pdf - PDF预览
- KaTeX - 公式渲染
- axios - HTTP客户端

## 开发计划

详见 [PLAN.md](PLAN.md)

## 迁移交接

整仓复制迁移前，请先查看 [docs/PROJECT_MIGRATION_HANDOVER.md](docs/PROJECT_MIGRATION_HANDOVER.md)。

**Idea + 模板画图部署到 10.20.5.61**：见 [docs/IDEA_PLOT_DEPLOY_10_20_5_61.md](docs/IDEA_PLOT_DEPLOY_10_20_5_61.md)，执行 `bash scripts/deploy_idea_plot_to_10_20_5_61.sh`（需本机 SSH 密码）。
