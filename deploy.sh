#!/bin/bash

# 企业工作流系统 - 一键部署脚本
# 使用方法: bash deploy.sh

set -e

echo "=========================================="
echo "  企业工作流系统 一键部署脚本"
echo "=========================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 获取当前用户名
CURRENT_USER=$(whoami)
PROJECT_DIR="/home/$CURRENT_USER/workflow-system"
PORT=3000

# 1. 安装 Node.js
log_info "安装 Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi
log_info "Node.js 版本: $(node -v)"
log_info "npm 版本: $(npm -v)"

# 2. 安装 PostgreSQL
log_info "安装 PostgreSQL..."
if ! command -v psql &> /dev/null; then
    sudo apt update
    sudo apt install -y postgresql postgresql-contrib
fi

# 启动 PostgreSQL
sudo systemctl enable postgresql
sudo systemctl start postgresql
log_info "PostgreSQL 已启动"

# 3. 创建数据库用户和数据库
log_info "配置数据库..."
sudo -u postgres psql -c "CREATE USER $CURRENT_USER WITH PASSWORD 'workflow_pass_2026';" 2>/dev/null || log_warn "用户已存在，跳过"
sudo -u postgres psql -c "CREATE DATABASE workflow_db OWNER $CURRENT_USER;" 2>/dev/null || log_warn "数据库已存在，跳过"
log_info "数据库配置完成"

# 4. 克隆/更新代码
log_info "克隆项目代码..."
cd ~
if [ -d "workflow-system" ]; then
    log_warn "项目已存在，更新代码..."
    cd workflow-system
    git pull origin main
else
    git clone https://github.com/event1hor1zon/workflow-system.git
    cd workflow-system
fi

# 5. 安装后端依赖并构建
log_info "构建后端..."
cd $PROJECT_DIR/backend
npm install
npm run build

# 6. 配置后端环境变量
log_info "配置环境变量..."
cat > .env << EOF
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=$CURRENT_USER
DB_PASSWORD=workflow_pass_2026
DB_DATABASE=workflow_db
DB_SYNCHRONIZE=true
DB_LOGGING=false
SEED_DATA=true
JWT_SECRET=your-super-secret-jwt-key-change-in-production-$(date +%s)
JWT_EXPIRES_IN=7d
PORT=$PORT
FRONTEND_URL=http://$(hostname -I | awk '{print $1}'):5173
EOF

# 7. 安装 PM2
log_info "安装 PM2..."
npm install -g pm2

# 8. 停止旧进程
log_info "停止旧进程..."
pm2 delete workflow-api 2>/dev/null || true
sudo pkill -f "node.*main" 2>/dev/null || true

# 9. 启动后端服务
log_info "启动后端服务..."
pm2 start dist/main.js --name workflow-api
pm2 save

# 10. 配置 Nginx
log_info "配置 Nginx..."
SERVER_IP=$(hostname -I | awk '{print $1}')

sudo tee /etc/nginx/sites-available/workflow << EOF
server {
    listen 80;
    server_name $SERVER_IP;

    # 前端静态文件
    root $PROJECT_DIR/dist;
    index index.html;

    # SPA 支持
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # API 反向代理
    location /api {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # 上传文件
    location /uploads {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF

# 启用站点
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/workflow /etc/nginx/sites-enabled/workflow

# 测试并重启 Nginx
sudo nginx -t
sudo systemctl reload nginx

# 11. 确保 Nginx 开机自启
sudo systemctl enable nginx

# 12. 显示部署信息
echo ""
echo "=========================================="
echo -e "${GREEN}  部署完成！${NC}"
echo "=========================================="
echo ""
echo "访问地址:"
echo -e "  前端: ${GREEN}http://$SERVER_IP/${NC}"
echo -e "  API:  ${GREEN}http://$SERVER_IP/api${NC}"
echo ""
echo "常用命令:"
echo "  查看状态: pm2 status"
echo "  查看日志: pm2 logs workflow-api"
echo "  重启服务: pm2 restart workflow-api"
echo "  更新代码: cd $PROJECT_DIR && git pull && cd backend && npm run build && pm2 restart workflow-api"
echo ""