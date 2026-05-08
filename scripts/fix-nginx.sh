#!/bin/bash

# ============================================================
# 企业工作流系统 - 一键修复 Nginx 访问问题
# ============================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Nginx 访问问题一键修复脚本              ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""

# 获取项目路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
WEB_ROOT="${PROJECT_DIR}/dist"

# ============================================================
# 步骤1：停止所有服务
# ============================================================
echo -e "${YELLOW}[1/5] 停止所有服务...${NC}"
sudo systemctl stop nginx 2>/dev/null || true
sudo pkill -9 nginx 2>/dev/null || true
sudo pkill -9 python3 2>/dev/null || true
sleep 1
echo -e "${GREEN}✓ 服务已停止${NC}"

# ============================================================
# 步骤2：清理 iptables 规则
# ============================================================
echo -e "${YELLOW}[2/5] 清理网络规则...${NC}"
sudo iptables -F 2>/dev/null || true
sudo iptables -X 2>/dev/null || true
sudo iptables -t nat -F 2>/dev/null || true
sudo iptables -t nat -X 2>/dev/null || true
sudo iptables -P INPUT ACCEPT 2>/dev/null || true
sudo iptables -P FORWARD ACCEPT 2>/dev/null || true
sudo iptables -P OUTPUT ACCEPT 2>/dev/null || true
echo -e "${GREEN}✓ 网络规则已清理${NC}"

# ============================================================
# 步骤3：配置极简 Nginx
# ============================================================
echo -e "${YELLOW}[3/5] 配置极简 Nginx...${NC}"

# 备份旧配置
sudo rm -f /etc/nginx/sites-enabled/default
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.bak 2>/dev/null || true

# 创建极简配置
sudo tee /etc/nginx/sites-available/default > /dev/null <<'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    root /var/www/html;
    index index.html;

    server_name _;

    location / {
        try_files $uri $uri/ =404;
    }
}
EOF

# 测试配置
if sudo nginx -t; then
    echo -e "${GREEN}✓ Nginx 配置正确${NC}"
else
    echo -e "${RED}✗ Nginx 配置错误${NC}"
    exit 1
fi

# ============================================================
# 步骤4：创建测试页面
# ============================================================
echo -e "${YELLOW}[4/5] 创建测试页面...${NC}"

sudo mkdir -p /var/www/html
sudo tee /var/www/html/index.html > /dev/null <<'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>工作流系统测试</title>
    <style>
        body { font-family: Arial; text-align: center; padding: 50px; }
        h1 { color: #3B82F6; }
        .success { color: #10B981; }
    </style>
</head>
<body>
    <h1>🎉 工作流系统 Nginx 测试成功！</h1>
    <p class="success">服务器网络正常，Nginx 运行正常。</p>
    <p>如果看到这个页面，说明可以从外部访问了。</p>
    <hr>
    <p>测试时间: $(date)</p>
</body>
</html>
EOF

sudo chown -R www-data:www-data /var/www/html

# ============================================================
# 步骤5：启动服务
# ============================================================
echo -e "${YELLOW}[5/5] 启动服务...${NC}"

# 启动 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

sleep 1

# 检查状态
if sudo systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓ Nginx 已启动${NC}"
else
    echo -e "${RED}✗ Nginx 启动失败${NC}"
    echo -e "${YELLOW}尝试直接启动...${NC}"
    sudo nginx
fi

# 获取服务器 IP
SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")

# ============================================================
# 完成
# ============================================================
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           修复完成！                        ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BLUE}测试地址: http://${SERVER_IP}${NC}"
echo ""
echo -e "  ${YELLOW}在另一台电脑上打开浏览器访问:${NC}"
echo -e "  ${BLUE}http://${SERVER_IP}${NC}"
echo ""
echo -e "  ${YELLOW}如果测试页面能打开，说明 Nginx 正常，${NC}"
echo -e "  ${YELLOW}然后运行以下命令启动完整工作流系统:${NC}"
echo ""
echo -e "  ${GREEN}cd ${PROJECT_DIR}${NC}"
echo -e "  ${GREEN}sudo ./scripts/deploy.sh${NC}"
echo ""

# 测试本地访问
echo -e "${YELLOW}测试本地访问...${NC}"
sleep 1
curl -s -o /dev/null -w "HTTP状态码: %{http_code}\n" http://localhost