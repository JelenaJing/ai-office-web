#!/bin/bash
# 启动脚本 - 同时启动后端和前端，以及deepsyn-app服务

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

# 清理端口的函数
cleanup_port() {
    local port=$1
    if [ -z "$port" ]; then
        return
    fi
    
    # 查找占用端口的进程
    local pid=$(lsof -ti:$port 2>/dev/null || fuser $port/tcp 2>/dev/null | awk '{print $1}')
    
    if [ -n "$pid" ]; then
        echo "   清理端口 $port (PID: $pid)..."
        kill -9 $pid 2>/dev/null || true
        sleep 1
    fi
}

echo "启动论文Remake服务..."
echo "工作目录: $SCRIPT_DIR"

# 清理可能占用的端口
echo ""
echo "清理端口..."
cleanup_port 8020  # paper-remake-service 后端
cleanup_port 8021  # paper-remake-service 前端
cleanup_port 5002  # deepsyn-app 后端
echo "端口清理完成"

# 启动DeepSyn App服务（如果存在）
DEEPSYN_DIR="$SCRIPT_DIR/../deepsyn-app"
if [ -d "$DEEPSYN_DIR" ]; then
    echo ""
    echo "启动DeepSyn App服务..."
    cd "$DEEPSYN_DIR/backend" || exit 1
    
    # 检查是否安装了依赖（使用conda环境）
    if [ -f "requirements.txt" ]; then
        echo "   检查 Python 依赖..."
        pip install -q -r requirements.txt 2>/dev/null || echo "   依赖安装跳过（可能已安装）"
    fi
    
    echo "   启动 Flask 服务器 (端口 5002, 监听 0.0.0.0)..."
    python app.py &
    DEEPSYN_BACKEND_PID=$!
    
    # 等待DeepSyn后端启动
    sleep 3
    
    cd "$SCRIPT_DIR" || exit 1
else
    echo ""
    echo "警告: 未找到DeepSyn App目录 ($DEEPSYN_DIR)"
    echo "      将跳过DeepSyn App的启动"
    DEEPSYN_BACKEND_PID=""
fi

# 启动后端（后台）
cd "$SCRIPT_DIR/backend" || exit 1
if [ ! -f ".env" ]; then
    echo "警告: .env文件不存在，请先配置环境变量"
    echo "复制 .env.example 到 .env 并填入配置"
fi

# 使用conda环境，不处理venv
echo "   使用Python环境: $(which python)"

# 检查是否安装了uvicorn
if ! python -m uvicorn --version >/dev/null 2>&1; then
    echo "   安装 uvicorn..."
    pip install -q uvicorn[standard]
fi

echo "启动后端服务 (端口 8020)..."
python -m uvicorn app.main:app --host 0.0.0.0 --port 8020 &
BACKEND_PID=$!

# 等待后端启动
sleep 3

# 启动前端
cd "$SCRIPT_DIR/frontend" || exit 1
echo "启动前端服务 (端口 8021)..."
npm run dev &
FRONTEND_PID=$!

# 获取本机IP地址
LOCAL_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "=========================================="
echo "服务已启动！"
echo ""
echo "本地访问："
echo "  后端: http://localhost:8020"
echo "  前端: http://localhost:8021"
echo "  API文档: http://localhost:8020/docs"
if [ -n "$DEEPSYN_BACKEND_PID" ]; then
    echo "  DeepSyn后端: http://localhost:5002"
fi
echo ""
echo "局域网访问："
echo "  后端: http://${LOCAL_IP}:8020"
echo "  前端: http://${LOCAL_IP}:8021"
echo "  API文档: http://${LOCAL_IP}:8020/docs"
if [ -n "$DEEPSYN_BACKEND_PID" ]; then
    echo "  DeepSyn后端: http://${LOCAL_IP}:5002"
fi
echo ""
echo "提示：如果前端无法连接后端，请在前端目录创建 .env.local 文件："
echo "  VITE_API_BASE_URL=http://${LOCAL_IP}:8020"
echo ""
echo "按 Ctrl+C 停止所有服务"
echo "=========================================="

# 等待用户中断
trap "echo '正在停止所有服务...'; kill $BACKEND_PID $FRONTEND_PID $DEEPSYN_BACKEND_PID 2>/dev/null; exit" INT TERM

if [ -n "$DEEPSYN_BACKEND_PID" ]; then
    wait $BACKEND_PID $FRONTEND_PID $DEEPSYN_BACKEND_PID
else
wait $BACKEND_PID $FRONTEND_PID
fi
