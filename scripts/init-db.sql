-- 手动初始化 PostgreSQL（可选）
-- 推荐优先使用 scripts/deploy.sh
-- 使用方式:
--   sudo -u postgres psql -f init-db.sql

SELECT 'CREATE ROLE workflow_user LOGIN PASSWORD ''workflow_pass_2026'''
WHERE NOT EXISTS (
  SELECT 1 FROM pg_roles WHERE rolname = 'workflow_user'
)\gexec

SELECT 'ALTER ROLE workflow_user WITH LOGIN PASSWORD ''workflow_pass_2026'''
\gexec

SELECT 'CREATE DATABASE workflow_db OWNER workflow_user'
WHERE NOT EXISTS (
  SELECT 1 FROM pg_database WHERE datname = 'workflow_db'
)\gexec

\connect workflow_db

GRANT ALL ON SCHEMA public TO workflow_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO workflow_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO workflow_user;

\echo '数据库 workflow_db 已准备完成。启动后端后会自动建表并写入初始测试数据。'
