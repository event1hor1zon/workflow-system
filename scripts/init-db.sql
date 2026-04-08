-- 企业工作流系统 数据库初始化脚本
-- 运行方式: psql -U postgres -d postgres -f init-db.sql

-- 创建数据库
CREATE DATABASE workflow;

-- 切换到数据库
\c workflow;

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
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_creator ON orders(creator_id);
CREATE INDEX idx_orders_handler ON orders(current_handler);
CREATE INDEX idx_orders_county ON orders(county_id);
CREATE INDEX idx_history_order ON order_history(order_id);
CREATE INDEX idx_approvals_order ON order_approvals(order_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- ============================================
-- 授权
-- ============================================
-- GRANT ALL PRIVILEGES ON DATABASE workflow TO workflow_user;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO workflow_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO workflow_user;

\echo '数据库初始化完成！';
