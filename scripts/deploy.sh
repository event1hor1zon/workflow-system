#!/bin/bash

# ============================================
# 企业工作流系统 一键部署脚本
# ============================================
# 适用于: Ubuntu 20.04+ / Debian 11+
# 运行前请确保有 sudo 权限
# ============================================

set -e

echo "============================================"
echo "   企业工作流系统 - 一键部署脚本"
echo "============================================"
echo ""

# ============ 配置变量 ============
DB_NAME="${DB_NAME:-workflow}"
DB_USER="${DB_USER:-workflow_user}"
DB_PASS="${DB_PASS:-workflow_pass_2024}"
APP_PORT="${APP_PORT:-3000}"
WEB_PORT="${WEB_PORT:-8080}"

# 可通过环境变量覆盖
DB_PASSWORD="${DB_PASSWORD:-$DB_PASS}"
APP_USER="${APP_USER:-$(whoami)}"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# ============ 颜色定义 ============
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

# ============ 检查root ============
if [ "$EUID" -ne 0 ]; then
    log_warn "建议使用 root 权限运行此脚本 (sudo)"
fi

# ============ 步骤1: 安装基础依赖 ============
echo ""
log_step "步骤 1/7: 安装基础依赖..."
apt update
apt install -y curl git nginx postgresql postgresql-contrib build-essential

# ============ 步骤2: 安装 Node.js ============
echo ""
log_step "步骤 2/7: 安装 Node.js 20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi
log_info "Node.js 版本: $(node --version)"
log_info "npm 版本: $(npm --version)"

# ============ 步骤3: 配置 PostgreSQL ============
echo ""
log_step "步骤 3/7: 配置 PostgreSQL..."

systemctl start postgresql
systemctl enable postgresql

sudo -u postgres psql << EOF
-- 创建数据库
DROP DATABASE IF EXISTS $DB_NAME;
CREATE DATABASE $DB_NAME;

-- 创建用户
DROP USER IF EXISTS $DB_USER;
CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;

-- 授权
\c $DB_NAME;
GRANT ALL ON SCHEMA public TO $DB_USER;
ALTER USER $DB_USER WITH SUPERUSER;
EOF

log_info "PostgreSQL 配置完成"
log_info "  数据库: $DB_NAME"
log_info "  用户: $DB_USER"

# ============ 步骤4: 初始化数据库 ============
echo ""
log_step "步骤 4/7: 初始化数据库..."

sudo -u postgres psql -d "$DB_NAME" << 'EOF'
-- 创建扩展（用于UUID）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 用户表
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(50),
    dept VARCHAR(100),
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 县级表
-- ============================================
CREATE TABLE IF NOT EXISTS counties (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 部门表
-- ============================================
CREATE TYPE department_layer AS ENUM ('upper', 'hub', 'lower');

CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) DEFAULT 'network',
    icon VARCHAR(50),
    color VARCHAR(20),
    layer department_layer DEFAULT 'hub',
    handler_user_id VARCHAR(100),
    description TEXT,
    functions TEXT,
    is_active BOOLEAN DEFAULT true,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 工单表
-- ============================================
CREATE TYPE order_status AS ENUM (
    'draft', 'submitted', 'ai_checking', 'ai_passed',
    'ai_rejected', 'processing', 'pending_approval', 'resolved'
);

CREATE TYPE approval_status AS ENUM (
    'pending', 'creator_approved', 'leader_approved', 'both_approved'
);

CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    creator_id VARCHAR(100) NOT NULL,
    creator_name VARCHAR(100) NOT NULL,
    creator_dept VARCHAR(100) NOT NULL,
    county_id VARCHAR(50),
    county_name VARCHAR(100),
    type VARCHAR(50) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'normal',
    status order_status DEFAULT 'draft',
    ai_judge_result JSONB,
    current_handler VARCHAR(100),
    current_handler_user_id VARCHAR(50),
    handlers JSONB,
    start_time TIMESTAMP,
    reject_reason TEXT,
    approval_status approval_status,
    leader_id VARCHAR(50),
    creator_approved_at TIMESTAMP,
    leader_approved_at TIMESTAMP,
    resolve_note TEXT,
    process_note TEXT,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 工单历史表（流转记录）
-- ============================================
CREATE TYPE order_action AS ENUM (
    'create', 'submit', 'ai_check', 'ai_reject', 'assign',
    'process', 'submit_approval', 'creator_approve', 'leader_approve',
    'reject', 'resolve'
);

CREATE TABLE IF NOT EXISTS order_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id VARCHAR(50) REFERENCES orders(id) ON DELETE CASCADE,
    action order_action NOT NULL,
    from_status VARCHAR(50),
    to_status VARCHAR(50),
    operator VARCHAR(100),
    operator_id VARCHAR(100),
    dept VARCHAR(100),
    content TEXT,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 审批记录表
-- ============================================
CREATE TABLE IF NOT EXISTS order_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id VARCHAR(50) REFERENCES orders(id) ON DELETE CASCADE,
    approver_id VARCHAR(50) NOT NULL,
    approver_name VARCHAR(100) NOT NULL,
    approver_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    comment TEXT,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 知识库表
-- ============================================
CREATE TABLE IF NOT EXISTS knowledge_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(50),
    keywords TEXT[],
    content TEXT NOT NULL,
    is_reject BOOLEAN DEFAULT false,
    dept_hint VARCHAR(100),
    priority_hint VARCHAR(20),
    weight INTEGER DEFAULT 0,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- SOP流程表
-- ============================================
CREATE TABLE IF NOT EXISTS sop_flows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dept_id VARCHAR(50),
    direction VARCHAR(20),
    name VARCHAR(100),
    list JSONB,
    description TEXT,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 消息通知表
-- ============================================
CREATE TYPE notification_type AS ENUM (
    'order_assigned', 'approval_request', 'order_rejected',
    'order_resolved', 'order_processing'
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(50) REFERENCES users(id),
    type notification_type NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    order_id VARCHAR(50),
    is_read BOOLEAN DEFAULT false,
    is_email_sent BOOLEAN DEFAULT false,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 索引
-- ============================================
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_creator ON orders(creator_id);
CREATE INDEX IF NOT EXISTS idx_orders_handler ON orders(current_handler);
CREATE INDEX IF NOT EXISTS idx_orders_county ON orders(county_id);
CREATE INDEX IF NOT EXISTS idx_history_order ON order_history(order_id);
CREATE INDEX IF NOT EXISTS idx_approvals_order ON order_approvals(order_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
EOF

# 插入种子数据
sudo -u postgres psql -d "$DB_NAME" << 'EOF'
-- ============================================
-- 县级数据
-- ============================================
INSERT INTO counties (id, name, description) VALUES
('CTY-001', 'A县', 'A县分公司'),
('CTY-002', 'B县', 'B县分公司'),
('CTY-003', 'C县', 'C县分公司')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 部门数据
-- ============================================
INSERT INTO departments (id, name, type, icon, color, layer, functions) VALUES
('DEPT-001', '网络部', 'network', '🌐', 'purple', 'hub', '负责网络规划、资源调配、网络运维'),
('DEPT-002', '客户响应中心', 'maintenance', '📞', 'green', 'hub', '负责客户响应、故障处理、服务交付'),
('DEPT-003', '工程建设部', 'engineering', '🏗️', 'blue', 'hub', '负责网络工程建设、基站建设、室分覆盖'),
('DEPT-UPPER-001', '市场经营部', 'market', '📊', 'blue', 'upper', '负责市场经营、客户需求收集'),
('DEPT-UPPER-002', '政企客户部', 'enterprise', '🏢', 'purple', 'upper', '负责政企客户拓展、业务需求对接'),
('DEPT-LOWER-001', '各旗县分公司', 'county', '📍', 'gray', 'lower', '负责属地化运营、客户服务落地')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 用户数据（密码都是 123456，bcrypt hash）
-- ============================================
-- bcrypt(123456) 的示例hash，实际使用时请生成真实的hash
-- $2b$10$7KBWk8fH8/X8X8X8X8X8X8eG6Z2j1L2M3N4O5P6Q7R8S9T0U1V2
INSERT INTO users (id, username, password, name, dept, role) VALUES
-- 管理员
('USR-ADMIN-001', 'admin', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36ZyLP0LqO1JqJ9L0zLrZ8.', '系统管理员', '网络部', 'admin'),
-- 最高权限人
('USR-SUPER-001', 'super_admin', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36ZyLP0LqO1JqJ9L0zLrZ8.', '最高权限人', '网络部', 'super'),
-- 部门负责人（每个部门一个）
('USR-LEAD-001', 'zhang_gongjian', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36ZyLP0LqO1JqJ9L0zLrZ8.', '张领导(工建)', '工程建设部', 'leader'),
('USR-LEAD-002', 'li_wangluo', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36ZyLP0LqO1JqJ9L0zLrZ8.', '李领导(网络)', '网络部', 'leader'),
('USR-LEAD-003', 'wang_kexiang', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36ZyLP0LqO1JqJ9L0zLrZ8.', '王领导(客响)', '客户响应中心', 'leader'),
-- 县级经办人
('USR-CTY-001', 'a_xian_jingban', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36ZyLP0LqO1JqJ9L0zLrZ8.', 'A县经办人', 'A县', 'county'),
('USR-CTY-002', 'b_xian_jingban', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36ZyLP0LqO1JqJ9L0zLrZ8.', 'B县经办人', 'B县', 'county'),
('USR-CTY-003', 'c_xian_jingban', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36ZyLP0LqO1JqJ9L0zLrZ8.', 'C县经办人', 'C县', 'county'),
-- 员工
('USR-USER-001', 'zhao_staff', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36ZyLP0LqO1JqJ9L0zLrZ8.', '赵员工', '网络部', 'user'),
('USR-USER-002', 'sun_staff', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36ZyLP0LqO1JqJ9L0zLrZ8.', '孙员工', '工程建设部', 'user'),
('USR-USER-003', 'zhou_staff', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36ZyLP0LqO1JqJ9L0zLrZ8.', '周员工', '客户响应中心', 'user')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 知识库数据
-- ============================================
INSERT INTO knowledge_base (category, keywords, content, is_reject, dept_hint, priority_hint, weight) VALUES
-- 可提交类型
('网络建设', ARRAY['5G', '基站', '室分', '覆盖'], '5G基站建设、室分覆盖等网络基础设施需求', false, '工程建设部', 'normal', 10),
('网络建设', ARRAY['家宽', '宽带', '光纤'], '家庭宽带接入、光纤到户建设需求', false, '工程建设部', 'normal', 10),
('网络建设', ARRAY['专线', '政企'], '政企专线接入、MPLS VPN等需求', false, '网络部', 'normal', 10),
('网络维护', ARRAY['故障', '中断', '投诉'], '网络故障申告、投诉处理需求', false, '网络部', 'critical', 15),
('网络维护', ARRAY['维护', '优化'], '网络日常维护、优化需求', false, '网络部', 'normal', 5),
('客户服务', ARRAY['响应', '交付'], '客户响应、交付验收需求', false, '客户响应中心', 'normal', 5),
-- 退回类型
('无效需求', ARRAY['费用', '报销', '财务'], '费用报销、财务相关问题不属于本系统处理范围', true, NULL, NULL, 20),
('无效需求', ARRAY['人事', '招聘'], '人事招聘、员工管理问题不属于本系统处理范围', true, NULL, NULL, 20),
('无效需求', ARRAY['投诉', '其他'], '一般性客户投诉请通过客服系统处理', true, NULL, NULL, 15),
('无效需求', ARRAY['咨询'], '简单业务咨询请拨打客服热线', true, NULL, NULL, 10)
ON CONFLICT DO NOTHING;

-- ============================================
-- SOP流程数据
-- ============================================
INSERT INTO sop_flows (dept_id, direction, name, list, description) VALUES
-- 工程建设部 SOP
('DEPT-003', 'up', '对上握手-需求对接', '["需求对接", "资源评估", "方案制定", "进度同步"]'::jsonb, '与上级部门的需求对接流程'),
('DEPT-003', 'up', '对上握手-协同执行', '["任务接收", "资源协调", "执行落地"]'::jsonb, '与上级部门的协同执行流程'),
('DEPT-003', 'down', '对下握手-能力赋能', '["能力下沉", "技术支持", "培训指导"]'::jsonb, '对下级单位的能力赋能'),
('DEPT-003', 'cross', '横向握手-顺时针', '["接收工建需求", "进度反馈"]'::jsonb, '与网络部、客响中心的横向协作'),
-- 网络部 SOP
('DEPT-001', 'up', '对上握手-资源评估', '["网络资源评估", "带宽需求分析", "入网进度同步"]'::jsonb, '对上级的资源评估流程'),
('DEPT-001', 'down', '对下握手-运维下沉', '["存量资源保障", "故障排查", "运维能力下沉"]'::jsonb, '对下级的运维支撑'),
('DEPT-001', 'cross', '横向握手-双向联动', '["与工建协同", "与客响联动"]'::jsonb, '与各部门的横向协作'),
-- 客户响应中心 SOP
('DEPT-002', 'up', '对上握手-服务收集', '["客户服务需求收集", "投诉分析", "满意度调研"]'::jsonb, '对上级的服务需求收集'),
('DEPT-002', 'down', '对下握手-服务下沉', '["服务标准下沉", "属地化指导"]'::jsonb, '对下级的服务支撑'),
('DEPT-002', 'cross', '横向握手-逆时针', '["接收网络部工单", "发出至工建"]'::jsonb, '逆时针与各部门协作')
ON CONFLICT DO NOTHING;
EOF

log_info "数据库初始化完成"

# ============ 步骤5: 安装 Ollama (可选) ============
echo ""
log_step "步骤 5/7: 安装 Ollama (可选)..."
read -p "是否安装 Ollama AI 服务? (y/n, 默认n): " install_ollama
if [ "$install_ollama" = "y" ]; then
    curl -fsSL https://ollama.com/install.sh | sh
    ollama pull qwen2.5:7b
    log_info "Ollama 安装完成，模型已下载"
else
    log_warn "跳过 Ollama 安装，如需 AI 功能请手动安装"
fi

# ============ 步骤6: 部署后端 ============
echo ""
log_step "步骤 6/7: 部署后端服务..."

cd "$BACKEND_DIR"
npm install

# 创建环境变量文件
cat > "$BACKEND_DIR/.env" << ENVEOF
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_DATABASE=$DB_NAME
JWT_SECRET=workflow_jwt_secret_$(date +%s)
JWT_EXPIRES_IN=7d
PORT=$APP_PORT
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b
FRONTEND_URL=http://localhost:$WEB_PORT
ENVEOF

npm run build

# 安装 PM2
npm install -g pm2

# 启动后端
pm2 stop workflow-api 2>/dev/null || true
pm2 start dist/main.js --name workflow-api

# 保存 PM2 配置
pm2 save
pm2 startup

log_info "后端服务已启动 (端口 $APP_PORT)"

# ============ 步骤7: 部署前端 ============
echo ""
log_step "步骤 7/7: 部署前端..."

cd "$FRONTEND_DIR"
npm install
npm run build

# 创建前端发布目录
mkdir -p /var/www/workflow

# 复制构建产物
cp -r "$FRONTEND_DIR/dist" /var/www/workflow/

# 配置 Nginx
cat > /etc/nginx/sites-available/workflow << 'NGINXEOF'
server {
    listen 8080;
    server_name _;

    # 前端静态资源
    root /var/www/workflow/dist;
    index index.html;

    # Gzip压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # 前端路由
    location / {
        try_files $uri $uri/ /index.html;
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }

    # 后端API代理
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Ollama API代理（可选）
    location /ollama {
        proxy_pass http://127.0.0.1:11434;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
NGINXEOF

# 启用站点
ln -sf /etc/nginx/sites-available/workflow /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

log_info "前端已部署，Nginx 已配置 (端口 $WEB_PORT)"

# ============ 完成 ============
echo ""
echo "============================================"
echo -e "${GREEN}   部署完成！${NC}"
echo "============================================"
echo ""
echo "访问地址: http://服务器IP:$WEB_PORT"
echo ""
echo "测试账号:"
echo "  用户名: admin        密码: 123456  (管理员)"
echo "  用户名: super_admin  密码: 123456  (最高权限人)"
echo "  用户名: zhang_gongjian  密码: 123456  (部门负责人-工建)"
echo "  用户名: li_wangluo     密码: 123456  (部门负责人-网络)"
echo "  用户名: wang_kexiang   密码: 123456  (部门负责人-客响)"
echo "  用户名: a_xian_jingban  密码: 123456  (县级经办人)"
echo "  用户名: zhao_staff     密码: 123456  (普通员工)"
echo ""
echo "常用命令:"
echo "  查看后端日志: pm2 logs workflow-api"
echo "  重启后端: pm2 restart workflow-api"
echo "  查看 Nginx 状态: systemctl status nginx"
echo "  重载 Nginx: nginx -t && systemctl reload nginx"
echo ""
echo "数据库信息:"
echo "  数据库名: $DB_NAME"
echo "  数据库用户: $DB_USER"
echo "  API端口: $APP_PORT"
echo "  Web端口: $WEB_PORT"
echo ""
