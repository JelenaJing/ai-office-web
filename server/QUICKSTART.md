# 快速开始指南

## 前置要求

1. Python 3.8+
2. Node.js 16+
3. DeepSeek API密钥
4. （可选）OpenAlex 邮箱（用于论文检索）

## 安装步骤

### 1. 后端设置

```bash
cd backend

# 安装Python依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑.env文件，填入：
# - DEEPSEEK_API_KEY=your-api-key
# - DEEPSEEK_BASE_URL=https://api.deepseek.com
# - OPENALEX_EMAIL=your-email@example.com
# 端口配置：
# - 后端端口：8020
# - 前端端口：8021
```

### 2. 前端设置

```bash
cd frontend

# 安装依赖
npm install

# 配置API地址（用于局域网访问，可选）
# 创建 .env.local 文件，配置后端API地址
# 例如：VITE_API_BASE_URL=http://10.20.4.57:8020
# 如果不配置，默认使用 http://localhost:8020（仅本地访问）
```

### 3. 启动服务

**方式1：分别启动**

```bash
# 终端1：启动后端
cd backend
python -m app.main
# 或
uvicorn app.main:app --host 0.0.0.0 --port 8020 --reload

# 终端2：启动前端
cd frontend
npm run dev
```

**方式2：使用启动脚本**

```bash
./start.sh
```

## 使用流程

1. **上传论文**
   - 本地访问：http://localhost:8021
   - 局域网访问：http://<服务器IP>:8021（需要配置前端 .env.local）
   - 点击上传按钮，选择PDF或文本文件
   - 系统自动创建项目文件夹

2. **选择文本**
   - 在编辑器中选择文本段落
   - 或在PDF预览中选择文本

3. **执行Remake**
   - 在侧边栏选择功能（如"检查内容和Reference"）
   - 等待处理完成
   - 查看结果

4. **应用更改**
   - 查看Remake结果
   - 确认后应用到论文

## 项目文件夹

每个论文项目自动创建在 `data/projects/` 目录下：

```
data/projects/{timestamp}_{project_id}/
├── paper.pdf              # 原始PDF
├── paper_meta.json        # 项目元数据
├── remakes/              # Remake结果
├── data/                 # 数据和图表
└── ...
```

## 故障排除

### 后端无法启动

- 检查Python版本：`python --version`
- 检查依赖：`pip install -r requirements.txt`
- 检查环境变量：确保`.env`文件配置正确

### 前端无法启动

- 检查Node.js版本：`node --version`
- 检查依赖：`npm install`
- 检查端口：确保8021端口未被占用

### 局域网无法访问

- **后端无法访问**：
  - 确认后端启动时使用了 `--host 0.0.0.0`（已默认配置）
  - 检查防火墙是否允许8020端口
  - 确认服务器IP地址是否正确

- **前端无法访问**：
  - 确认前端启动时Vite配置了 `host: '0.0.0.0'`（已默认配置）
  - 检查防火墙是否允许8021端口
  - 如果前端能访问但无法连接后端，需要创建 `frontend/.env.local` 文件：
    ```
    VITE_API_BASE_URL=http://<服务器IP>:8020
    ```

### PDF预览不显示

- 检查后端服务是否运行
- 检查API地址配置
- 检查浏览器控制台错误

### Remake功能失败

- 检查DeepSeek API密钥配置
- 检查OpenAlex服务可用性
- 查看后端日志

## API文档

启动后端后，访问 http://localhost:8020/docs 查看完整的API文档。

## 下一步

- 查看 [PLAN.md](PLAN.md) 了解详细功能
- 查看 [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) 了解实现细节
