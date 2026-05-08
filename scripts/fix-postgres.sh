#!/bin/bash

# ============================================================
# PostgreSQL 权限修复脚本
# 使用方法: chmod +x fix-postgres.sh && sudo ./fix-postgres.sh
# ============================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "\n${YELLOW}[修复] PostgreSQL 权限问题${NC}"

# 获取 PostgreSQL 版本
PG_VERSION=$(ls /usr/lib/postgresql/ 2>/dev/null | grep -E '^[0-9]+$' | sort -V | tail -1)

if [ -z "$PG_VERSION" ]; then
    PG_VERSION="16"
fi

echo "检测到 PostgreSQL 版本: $PG_VERSION"

# 停止 PostgreSQL
echo -e "\n${YELLOW}停止 PostgreSQL 服务...${NC}"
sudo systemctl stop postgresql 2>/dev/null || true
sudo pkill -9 postgres 2>/dev/null || true
sleep 2

# 修复数据目录权限
PG_DATA_DIR=$(sudo -u postgres psql -t -c "SHOW data_directory;" 2>/dev/null | tr -d ' ' | head -1)

if [ -z "$PG_DATA_DIR" ] || [ "$PG_DATA_DIR" = "" ]; then
    PG_DATA_DIR="/var/lib/postgresql/$PG_VERSION/main"
fi

echo "数据目录: $PG_DATA_DIR"

# 修复目录权限
echo -e "\n${YELLOW}修复目录权限...${NC}"
sudo chown -R postgres:postgres "$PG_DATA_DIR"
sudo chmod 700 "$PG_DATA_DIR"
sudo chmod 700 "$PG_DATA_DIR"/* 2>/dev/null || true

# 修复日志目录
LOG_DIR="/var/log/postgresql"
sudo mkdir -p "$LOG_DIR"
sudo chown -R postgres:postgres "$LOG_DIR"
sudo chmod 700 "$LOG_DIR"

# 修复配置目录
CONF_DIR="/etc/postgresql/$PG_VERSION/main"
if [ -d "$CONF_DIR" ]; then
    sudo chown -R postgres:postgres "$CONF_DIR"
    sudo chmod 755 "$CONF_DIR"
fi

# 启动 PostgreSQL
echo -e "\n${YELLOW}启动 PostgreSQL 服务...${NC}"
sudo systemctl start postgresql
sudo systemctl enable postgresql

sleep 2

# 检查状态
if sudo systemctl is-active --quiet postgresql; then
    echo -e "${GREEN}✓ PostgreSQL 服务已启动${NC}"
else
    echo -e "${RED}✗ PostgreSQL 服务启动失败，尝试手动启动...${NC}"

    # 尝试手动启动
    sudo -u postgres /usr/lib/postgresql/$PG_VERSION/bin/pg_ctl -D "$PG_DATA_DIR" -l /var/log/postgresql/postgresql.log start
fi

# 测试连接
echo -e "\n${YELLOW}测试数据库连接...${NC}"
if sudo -u postgres psql -c "SELECT version();" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 数据库连接成功${NC}"
else
    echo -e "${RED}✗ 数据库连接失败${NC}"
    echo -e "${YELLOW}尝试重新初始化数据库...${NC}"

    # 重新初始化（危险，仅在必要时使用）
    read -p "是否重新初始化数据库？这将删除所有数据 (y/N): " confirm
    if [ "$confirm" = "y" ]; then
        echo -e "${RED}正在删除并重新初始化数据库...${NC}"

        sudo systemctl stop postgresql
        sudo rm -rf "$PG_DATA_DIR"
        sudo -u postgres /usr/lib/postgresql/$PG_VERSION/bin/initdb -D "$PG_DATA_DIR"
        sudo chown -R postgres:postgres "$PG_DATA_DIR"
        sudo chmod 700 "$PG_DATA_DIR"
        sudo systemctl start postgresql

        echo -e "${GREEN}✓ 数据库已重新初始化${NC}"
    fi
fi

# 创建数据库和用户
echo -e "\n${YELLOW}确保数据库和用户存在...${NC}"

DB_NAME="${DB_NAME:-workflow_db}"
DB_USER="${DB_USER:-workflow_user}"
DB_PASSWORD="${DB_PASSWORD:-workflow_pass_2026}"

# 创建用户（如果不存在则创建，已存在则更新密码）
sudo -u postgres psql -c "DROP USER IF EXISTS $DB_USER;" 2>/dev/null || true
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || true

# 创建数据库
sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

# 授权
sudo -u postgres psql -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $DB_USER;"
sudo -u postgres psql -d "$DB_NAME" -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;"
sudo -u postgres psql -d "$DB_NAME" -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;"

echo -e "${GREEN}✓ 数据库配置完成${NC}"
echo -e "  数据库: $DB_NAME"
echo -e "  用户: $DB_USER"

# 验证
echo -e "\n${YELLOW}验证连接...${NC}"
if sudo -u postgres psql -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 验证成功！数据库已就绪${NC}"
else
    echo -e "${RED}✗ 验证失败${NC}"
    exit 1
fi

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  PostgreSQL 修复完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\n现在可以运行部署脚本: sudo ./deploy.sh"