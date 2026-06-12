#!/bin/bash
cd "$(dirname "$0")"

# 检查并安装 flask
python3 -c "import flask" 2>/dev/null || {
    echo "正在安装 Flask..."
    pip3 install flask
}

echo "正在启动一隅..."
python3 server.py &
sleep 1
open http://localhost:5050
wait
