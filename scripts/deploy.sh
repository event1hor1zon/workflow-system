#!/usr/bin/env bash

set -euo pipefail

DB_NAME="${DB_NAME:-workflow_db}"
DB_USER="${DB_USER:-workflow_user}"
DB_PASSWORD="${DB_PASSWORD:-workflow_pass_2026}"
BACKEND_PORT="${BACKEND_PORT:-3000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:5173}"
WEB_ROOT="${WEB_ROOT:-/var/www/workflow}"
SITE_NAME="${SITE_NAME:-workflow}"
APP_USER="${APP_USER:-$(whoami)}"

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$PROJECT_DIR"
BACKEND_DIR="$PROJECT_DIR/backend"

log_step() {
  printf '\n[STEP] %s\n' "$1"
}

log_info() {
  printf '[INFO] %s\n' "$1"
}

log_step "安装系统依赖"
apt-get update
apt-get install -y curl git nginx postgresql postgresql-contrib build-essential rsync

if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2
fi

log_step "初始化 PostgreSQL"
systemctl enable postgresql
systemctl start postgresql

sudo -u postgres psql <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASSWORD}';
  ELSE
    ALTER ROLE ${DB_USER} WITH LOGIN PASSWORD '${DB_PASSWORD}';
  END IF;
END
\$\$;
SQL

if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1; then
  sudo -u postgres createdb -O "${DB_USER}" "${DB_NAME}"
fi

sudo -u postgres psql -d "${DB_NAME}" <<SQL
GRANT ALL ON SCHEMA public TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${DB_USER};
SQL

log_step "写入后端环境变量"
mkdir -p "${BACKEND_DIR}/logs"
cat > "${BACKEND_DIR}/.env" <<EOF
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_DATABASE=${DB_NAME}
DB_SYNCHRONIZE=true
DB_LOGGING=false
SEED_DATA=true
JWT_SECRET=$(openssl rand -hex 32)
JWT_EXPIRES_IN=7d
PORT=${BACKEND_PORT}
FRONTEND_URL=${FRONTEND_URL}
EOF

log_step "安装前端依赖并构建"
cd "${FRONTEND_DIR}"
npm ci
npm run build

log_step "安装后端依赖并构建"
cd "${BACKEND_DIR}"
npm ci
npm run build

log_step "发布前端静态文件"
mkdir -p "${WEB_ROOT}"
rsync -a --delete "${FRONTEND_DIR}/dist/" "${WEB_ROOT}/"
chown -R "${APP_USER}":"${APP_USER}" "${WEB_ROOT}"

log_step "配置 Nginx"
sed \
  -e "s#__WEB_ROOT__#${WEB_ROOT}#g" \
  -e "s#__BACKEND_PORT__#${BACKEND_PORT}#g" \
  "${PROJECT_DIR}/configs/nginx.conf" > "/etc/nginx/sites-available/${SITE_NAME}.conf"

ln -sfn "/etc/nginx/sites-available/${SITE_NAME}.conf" "/etc/nginx/sites-enabled/${SITE_NAME}.conf"
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

log_step "启动后端服务"
cd "${BACKEND_DIR}"
pm2 delete workflow-api >/dev/null 2>&1 || true
pm2 start ecosystem.config.js --only workflow-api --update-env
pm2 save

log_info "部署完成"
log_info "前端目录: ${WEB_ROOT}"
log_info "后端端口: ${BACKEND_PORT}"
log_info "访问地址: http://$(hostname -I | awk '{print $1}')/"
