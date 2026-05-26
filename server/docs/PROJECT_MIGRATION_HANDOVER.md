# 项目迁移交接说明

本文档用于把当前 paper-remake-service 整体复制到新位置时，快速完成交接、迁移与自检。

## 1. 当前项目事实

- 仓库根目录：/home/ywt/w/paper-remake-service
- 后端：FastAPI，默认端口 8020
- 前端：Vite + React，默认端口 8021
- 默认数据目录：仓库根目录下的 data/projects/
- 根启动脚本：start.sh，会尝试同时启动后端、前端，以及相邻目录的 ../deepsyn-app

代码依据：

- backend/app/config.py 将 PAPER_REMAKE_DATA_DIR 默认解析为仓库根目录下的 data
- backend/app/main.py 默认监听 0.0.0.0:8020
- frontend/vite.config.ts 默认监听 0.0.0.0:8021，并代理 /api 到 http://localhost:8020
- start.sh 会额外尝试启动 ../deepsyn-app/backend/app.py

## 2. 迁移时必须确认是否一并复制的内容

必须复制：

- backend/
- frontend/
- shared/
- docs/
- start.sh
- README.md、QUICKSTART.md、PLAN.md、PROJECT_STATUS.md 等根文档

按需复制：

- data/projects/
说明：如果需要保留历史项目、上传的 PDF、remake 结果、图表和缓存，必须一起带走。若只迁移代码、不保留历史数据，可以不复制 data。

- export/
说明：这是已导出的交付包与镜像材料，不影响主服务启动，但若这些产物仍要继续交接，则应保留。

通常不必复制：

- frontend/node_modules/
- frontend/dist/
- __pycache__/
- logs/
- 本地虚拟环境目录，如 venv/、.venv/

## 3. 不在版本控制中的关键内容

以下内容默认不会进 git，若要在新位置可用，必须手工复制或重建：

- backend/.env
- frontend/.env.local（如果前端需要固定访问远端后端）
- data/
- logs/

.gitignore 已忽略 .env、.env.local、data、logs、frontend/node_modules、frontend/dist。

## 4. 环境变量与外部依赖

后端核心环境变量：

- DEEPSEEK_API_KEY：必填，绝大多数 AI 能力依赖它
- DEEPSEEK_BASE_URL：默认 https://api.deepseek.com
- DEEPSEEK_MODEL：默认 deepseek-chat
- OPENALEX_EMAIL：建议填写，用于 OpenAlex polite pool
- PAPER_REMAKE_DATA_DIR：可选；不填时默认使用仓库根目录 data
- DEEPSYN_API_URL：实验可视化 / 机器配方链路依赖，默认 http://localhost:5002
- DRAW_GATEWAY_BASE_URL：领域生图、Introduction 时间线图依赖，默认 http://127.0.0.1:42000
- DRAW_GATEWAY_TIMEOUT_SECONDS
- DRAW_GATEWAY_POLL_INTERVAL_SECONDS

外部服务与网络依赖：

- DeepSeek：后端需能访问 DEEPSEEK_BASE_URL
- OpenAlex：涉及文献检索的功能需要访问 api.openalex.org
- grsai-draw-gateway：领域生成和部分图片链路需要
- deepsyn-app：实验提取后可视化、机器配方链路需要

注意：根目录 start.sh 默认假设 deepsyn-app 位于仓库同级目录 ../deepsyn-app。若新位置没有这个相邻仓库，start.sh 会跳过其启动，但相关功能仍会因 DEEPSYN_API_URL 不可达而失败。

## 5. 已上线功能与迁移影响

当前前后端已接入的主要能力包括：

- Idea 生成
- 内容检查 / 引用更新
- 实验设计
- 理论分析
- 全文检查
- 实验提取
- 实验可视化与机器配方
- 全文 CoRemake
- Introduction 顶刊重写
- Domain generation + image
- 数据绘图与拼图保存

这意味着迁移不能只验证最基础的上传和编辑，还应至少验证一条会访问外部服务的链路。

## 6. 推荐迁移步骤

1. 复制代码目录到新位置。
2. 决定是否迁移历史数据；若需要，复制 data/projects/。
3. 复制 backend/.env；如有前端固定后端地址配置，再复制 frontend/.env.local。
4. 在新环境安装依赖：

```bash
cd backend
pip install -r requirements.txt

cd ../frontend
npm install
```

5. 若需要图片链路，先确认 grsai-draw-gateway 可用。
6. 若需要实验可视化 / 配方链路，确认 deepsyn-app 可用，或修改 DEEPSYN_API_URL。
7. 启动服务：

```bash
# 方式一：分别启动
cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8020
cd frontend && npm run dev

# 方式二：根目录联动启动
./start.sh
```

## 7. 迁移后最小验证清单

基础验证：

- 打开 http://localhost:8020/health，返回 healthy
- 打开 http://localhost:8020/docs，Swagger 正常加载
- 打开 http://localhost:8021，前端可进入主界面
- 上传一个 PDF 后，data/projects/ 下能生成新项目目录

功能验证：

- 执行一次 Idea 或 Content Check，确认 DeepSeek 可用
- 执行一次 Introduction 重写或 Idea 检索，确认 OpenAlex 可用
- 如需图片链路，执行一次 Domain generation，确认 draw gateway 可用
- 如需实验链路，执行一次 extract-visualize 或 recipe-experiment，确认 deepsyn-app 可用

数据验证：

- 历史项目若已复制，应能在前端项目列表中看到
- 旧项目下的 PDF、remakes、plots、references 应能正常打开

## 8. 已知易错点

- 默认数据目录不是 backend/data，而是仓库根目录 data。若只搬 backend，会误以为数据丢失。
- 根 start.sh 不只启动本仓库，还会探测并尝试启动 ../deepsyn-app。
- 直接 git clone 到新机器时，不会带上 backend/.env、frontend/.env.local、data/。
- 若前端通过局域网访问后端，需要正确设置 frontend/.env.local 中的 VITE_API_BASE_URL。
- frontend/node_modules 和 frontend/dist 属于可重建产物，整仓复制时不建议原样携带。

## 9. 建议的交接口径

如果是“完整可运行迁移”，交接包至少应包含：

- 代码仓库
- backend/.env
- data/projects（如需保留历史）
- grsai-draw-gateway 的部署说明或服务地址
- deepsyn-app 的部署说明或服务地址

如果是“仅代码迁移”，则应明确说明：

- 历史项目数据未迁移
- 环境变量需重新填写
- 外部服务需在新环境单独准备

## 10. 本次迁移的落地方案

当前已确定的迁移前提：

- 迁移方式：仅迁移代码
- 目标机器：ywt@10.26.1.25
- 目标目录层级：/data/ywt/ai-class/

建议的目标路径：

- /data/ywt/ai-class/paper-remake-service

本次不迁移的内容：

- data/
- backend/.env
- frontend/.env.local
- frontend/node_modules/
- frontend/dist/
- logs/
- 各类本地虚拟环境目录

迁移后需要在目标机单独补齐：

- backend/.env
- Python 依赖安装
- frontend 依赖安装
- 如需实验链路：deepsyn-app 或可达的 DEEPSYN_API_URL
- 如需图片链路：grsai-draw-gateway 或可达的 DRAW_GATEWAY_BASE_URL

推荐复制命令：

```bash
rsync -av \
	--exclude '.git' \
	--exclude '__pycache__' \
	--exclude '*.pyc' \
	--exclude '.env' \
	--exclude '.env.local' \
	--exclude 'data' \
	--exclude 'logs' \
	--exclude 'frontend/node_modules' \
	--exclude 'frontend/dist' \
	--exclude 'backend/venv' \
	--exclude 'backend/.venv' \
	/home/ywt/w/paper-remake-service/ \
	ywt@10.26.1.25:/data/ywt/ai-class/paper-remake-service/
```

迁移后在目标机执行：

```bash
cd /data/ywt/ai-class/paper-remake-service/backend
pip install -r requirements.txt

cd /data/ywt/ai-class/paper-remake-service/frontend
npm install
```

如果只做代码交接而不立即运行，至少应把下面这些信息一起交给接手方：

- 当前仓库代码
- backend/.env.example
- 本文档
- 外部服务地址或部署说明

## 11. 本次核对结果

本次已修正一处容易误导迁移的文档问题：

- backend/.env.example 中的数据目录说明已改为仓库根目录 data/projects/
- backend/.env.example 中补充了 DEEPSYN_API_URL，并将 PLOT_AGENT_URL 标注为兼容旧代码保留项