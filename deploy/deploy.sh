#!/bin/bash
# YingmuQiu-nas 云服务器一键部署脚本
# 用法: curl -sSL https://raw.githubusercontent.com/qiuyingmu/YingmuQiu-nas/main/deploy/deploy.sh | bash
# 或者直接: bash deploy.sh

set -e

echo "============================================"
echo "  YingmuQiu-nas 云服务器一键部署"
echo "============================================"
echo ""

# ---- 1. 检查环境 ----
echo "[1/5] 检查环境..."

# Check OS
if [ ! -f /etc/os-release ]; then
    echo "[FAIL] 仅支持 Ubuntu"
    exit 1
fi
. /etc/os-release
echo "  OS: $NAME $VERSION_ID"

# Check root
if [ "$EUID" -ne 0 ]; then
    echo "[FAIL] 请以 root 用户运行"
    exit 1
fi

# ---- 2. 安装 Docker ----
echo "[2/5] 安装 Docker..."

if ! command -v docker &> /dev/null; then
    apt-get update -qq
    apt-get install -y -qq ca-certificates curl
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
    chmod a+r /etc/apt/keyrings/docker.asc
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update -qq
    apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
    echo "  Docker installed"
else
    echo "  Docker already installed: $(docker --version)"
fi

# ---- 3. 克隆项目 ----
echo "[3/5] 克隆项目..."
PROJ_DIR="/opt/yingmuqiu-nas"
if [ -d "$PROJ_DIR" ]; then
    echo "  项目已存在，更新代码..."
    cd "$PROJ_DIR"
    git pull
else
    git clone https://github.com/qiuyingmu/YingmuQiu-nas.git "$PROJ_DIR"
    cd "$PROJ_DIR"
fi

# ---- 4. 配置环境变量 ----
echo "[4/5] 配置环境变量..."
ENV_FILE="$PROJ_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
    # 生成随机密钥
    JWT_SECRET=$(openssl rand -base64 32)
    DB_PASSWORD=$(openssl rand -base64 16 | tr -d '=+/')

    cat > "$ENV_FILE" << EOF
JWT_SECRET=$JWT_SECRET
DB_PASSWORD=$DB_PASSWORD
SERVER_DOMAIN=$SERVER_IP
APP_CORS_ORIGINS=http://$SERVER_IP
APP_WS_ORIGINS=http://$SERVER_IP
EOF
    chmod 600 "$ENV_FILE"
    echo "  环境变量已生成并保存"
else
    echo "  环境变量已存在"
fi

echo ""
echo "  环境变量已配置（密码信息不会再次显示）"
echo ""

# ---- 5. Docker 启动 ----
echo "[5/5] Docker 启动服务..."
cd "$PROJ_DIR"
docker compose -f deploy/docker-compose.yml --env-file .env up -d

# 等待服务就绪
echo "  等待服务就绪..."
for i in $(seq 1 30); do
    if curl -s http://localhost/ > /dev/null 2>&1; then
        echo "  [OK] 后端服务已就绪"
        break
    fi
    sleep 2
done

# ---- 完成 ----
SERVER_IP=$(curl -s http://ifconfig.me 2>/dev/null || curl -s http://ip.sb 2>/dev/null || echo "localhost")

echo ""
echo "============================================"
echo "  部署完成！"
echo "============================================"
echo ""
echo "  访问地址: http://$SERVER_IP"
echo "  (如果配置了域名，请设置 DNS 指向本服务器)"
echo ""
echo "  查看日志:"
echo "    docker compose -f $PROJ_DIR/deploy/docker-compose.yml logs -f"
echo ""
echo "  停止服务:"
echo "    docker compose -f $PROJ_DIR/deploy/docker-compose.yml down"
echo ""
echo "  升级更新:"
echo "    cd $PROJ_DIR && git pull && docker compose -f deploy/docker-compose.yml up -d --build"
echo ""
echo "============================================"
