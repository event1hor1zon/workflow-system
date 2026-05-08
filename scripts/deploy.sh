#!/bin/bash

# ============================================================
# 企业工作流系统 - 一键部署脚本
# 使用方法: chmod +x deploy.sh && sudo ./deploy.sh
# ============================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 默认配置（可通过环境变量覆盖）
DB_NAME="${DB_NAME:-workflow_db}"
DB_USER="${DB_USER:-workflow_user}"
DB_PASSWORD="${DB_PASSWORD:-workflow_pass_2026}"
BACKEND_PORT="${BACKEND_PORT:-3000}"
FRONTEND_PORT="${FRONTEND_PORT:-80}"
WEB_ROOT="${WEB_ROOT:-/var/www/workflow}"

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"
BACKEND_DIR="$PROJECT_DIR/backend"

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     企业工作流系统 - 一键部署脚本          ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""

# ============================================================
# 函数定义
# ============================================================

log_step() {
    echo -e "\n${GREEN}[步骤 $1/6] $2${NC}"
}

log_info() {
    echo -e "  ${YELLOW}→${NC} $1"
}

log_success() {
    echo -e "  ${GREEN}✓${NC} $1"
}

log_error() {
    echo -e "  ${RED}✗${NC} $1"
}

# ============================================================
# 检测系统
# ============================================================

detect_os() {
    if [ -f /etc/debian_version ]; then
        PKG_MANAGER="apt-get"
        NODE_SETUP="curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs"
    elif [ -f /etc/redhat-release ]; then
        PKG_MANAGER="yum"
        NODE_SETUP="curl -fsSL https://rpm.nodesource.com/setup_20.x | bash - && yum install -y nodejs"
    else
        echo -e "${RED}错误: 不支持的操作系统${NC}"
        exit 1
    fi
    log_info "检测到 Linux 系统，使用 $PKG_MANAGER"
}

# ============================================================
# 步骤1: 安装基础依赖
# ============================================================

install_dependencies() {
    log_step "1" "安装基础依赖..."

    # 更新包列表
    $PKG_MANAGER update -y

    # 安装基础工具
    $PKG_MANAGER install -y curl git nginx rsync sudo

    # 安装 Node.js
    if ! command -v node &> /dev/null; then
        log_info "安装 Node.js 20..."
        eval "$NODE_SETUP"
    fi
    log_success "Node.js $(node -v)"

    # 安装 PM2
    if ! command -v pm2 &> /dev/null; then
        log_info "安装 PM2..."
        npm install -g pm2
    fi
    log_success "PM2 $(pm2 --version)"

    # 安装 PostgreSQL
    if ! command -v psql &> /dev/null; then
        log_info "安装 PostgreSQL..."
        $PKG_MANAGER install -y postgresql postgresql-contrib
    fi
    log_success "PostgreSQL 已安装"
}

# ============================================================
# 步骤2: 配置数据库
# ============================================================

setup_database() {
    log_step "2" "配置数据库..."

    # 启动 PostgreSQL
    if command -v systemctl &> /dev/null; then
        systemctl start postgresql
        systemctl enable postgresql
    else
        service postgresql start
    fi
    sleep 2

    # 创建数据库用户
    log_info "创建数据库用户: $DB_USER"
    sudo -u postgres psql -c "DROP USER IF EXISTS $DB_USER;" 2>/dev/null || true
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"

    # 创建数据库
    log_info "创建数据库: $DB_NAME"
    sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null || true
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

    # 授权
    sudo -u postgres psql -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $DB_USER;"
    sudo -u postgres psql -d "$DB_NAME" -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;"
    sudo -u postgres psql -d "$DB_NAME" -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;"

    log_success "数据库配置完成"
    log_info "  数据库: $DB_NAME"
    log_info "  用户: $DB_USER"
    log_info "  密码: $DB_PASSWORD"
}

# ============================================================
# 步骤3: 配置后端
# ============================================================

setup_backend() {
    log_step "3" "配置后端..."

    # 创建日志目录
    mkdir -p "$BACKEND_DIR/logs"

    # 获取服务器 IP
    SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")

    # 创建 .env 文件
    log_info "创建后端配置文件..."
    cat > "$BACKEND_DIR/.env" << EOF
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_DATABASE=${DB_NAME}
DB_SYNCHRONIZE=true
DB_LOGGING=false
SEED_DATA=true
JWT_SECRET=workflow-jwt-$(openssl rand -hex 16)
JWT_EXPIRES_IN=7d
PORT=${BACKEND_PORT}
FRONTEND_URL=http://${SERVER_IP}
EOF

    # 安装依赖
    log_info "安装后端依赖..."
    cd "$BACKEND_DIR"
    npm install
    npm run build

    # 启动服务
    log_info "启动后端服务..."
    pm2 delete workflow-api 2>/dev/null || true
    pm2 start ecosystem.config.js --name workflow-api
    pm2 save

    log_success "后端已启动 (端口 $BACKEND_PORT)"
    log_info "  API 地址: http://${SERVER_IP}:${BACKEND_PORT}"
}

# ============================================================
# 步骤4: 配置前端
# ============================================================

setup_frontend() {
    log_step "4" "配置前端..."

    SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")

    # 创建环境变量
    cat > "$PROJECT_DIR/.env" << EOF
VITE_API_URL=http://${SERVER_IP}:${BACKEND_PORT}/api
EOF

    # 安装依赖并构建
    log_info "安装前端依赖..."
    cd "$PROJECT_DIR"
    npm install

    log_info "构建前端..."
    npm run build

    # 复制到 Web 目录
    log_info "发布前端文件..."
    sudo rm -rf "$WEB_ROOT"
    sudo mkdir -p "$WEB_ROOT"
    sudo cp -r "$PROJECT_DIR/dist/." "$WEB_ROOT/"
    sudo chown -R www-data:www-data "$WEB_ROOT"

    log_success "前端已发布 (端口 $FRONTEND_PORT)"
}

# ============================================================
# 步骤5: 配置 Nginx
# ============================================================

setup_nginx() {
    log_step "5" "配置 Nginx..."

    SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")

    # 创建 Nginx 配置
    sudo tee /etc/nginx/sites-available/workflow > /dev/null << EOF
server {
    listen 80;
    server_name _;

    root ${WEB_ROOT};
    index index.html;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml;

    # 前端路由（支持 SPA）
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # API 反向代理
    location /api {
        proxy_pass http://127.0.0.1:${BACKEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

    # 启用站点
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo ln -sf /etc/nginx/sites-available/workflow /etc/nginx/sites-enabled/workflow

    # 测试并重启
    if sudo nginx -t; then
        sudo systemctl reload nginx
        log_success "Nginx 已配置并启动"
    else
        log_error "Nginx 配置错误"
        exit 1
    fi
}

# ============================================================
# 步骤6: 完成
# ============================================================

finish() {
    log_step "6" "部署完成!"

    SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")

    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║           部署成功！                        ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  访问地址: ${BLUE}http://${SERVER_IP}${NC}"
    echo ""
    echo -e "  ${YELLOW}测试账号:${NC}"
    echo -e "    管理员:     admin / 123456"
    echo -e "    最高领导:   leader / 123456"
    echo -e "    县级经办人: a_county_handler / 123456"
    echo -e "    普通员工:   user_a1 / 123456"
    echo ""
    echo -e "  ${YELLOW}常用命令:${NC}"
    echo -e "    查看日志:   ${BLUE}pm2 logs workflow-api${NC}"
    echo -e "    重启服务:   ${BLUE}pm2 restart workflow-api${NC}"
    echo -e "    查看状态:   ${BLUE}pm2 status${NC}"
    echo ""
}

# ============================================================
# 主程序
# ============================================================

main() {
    detect_os
    install_dependencies
    setup_database
    setup_backend
    setup_frontend
    setup_nginx
    finish
}

main "$@"