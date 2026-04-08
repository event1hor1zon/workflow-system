-- 企业工作流系统 种子数据
-- 运行方式: psql -U postgres -d workflow -f seed-data.sql

-- ============================================
-- 县级数据
-- ============================================
INSERT INTO counties (id, name, description) VALUES
('CTY-001', 'A县', 'A县分公司，负责属地化运营'),
('CTY-002', 'B县', 'B县分公司，负责属地化运营'),
('CTY-003', 'C县', 'C县分公司，负责属地化运营')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 部门数据
-- ============================================
INSERT INTO departments (id, name, type, icon, color, layer, functions) VALUES
-- 上级部门
('DEPT-UPPER-001', '市场经营部', 'market', '📊', 'blue', 'upper', '负责市场经营、客户需求收集'),
('DEPT-UPPER-002', '政企客户部', 'enterprise', '🏢', 'purple', 'upper', '负责政企客户拓展、业务需求对接'),
('DEPT-UPPER-003', '客户服务中心', 'service', '📞', 'green', 'upper', '负责客户服务、投诉处理'),
-- 中心部门（Hub）
('DEPT-001', '网络部', 'network', '🌐', 'purple', 'hub', '负责网络规划、资源调配、网络运维'),
('DEPT-002', '客户响应中心', 'maintenance', '📞', 'green', 'hub', '负责客户响应、故障处理、服务交付'),
('DEPT-003', '工程建设部', 'engineering', '🏗️', 'blue', 'hub', '负责网络工程建设、基站建设、室分覆盖'),
-- 下级部门
('DEPT-LOWER-001', '各旗县分公司', 'county', '📍', 'gray', 'lower', '负责属地化运营、客户服务落地')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 用户数据（密码都是 123456，bcrypt hash）
-- ============================================
-- 注意：以下密码hash为示例，实际应用中请使用真实的bcrypt(123456) hash
-- 示例hash: $2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36ZyLP0LqO1JqJ9L0zLrZ8.

-- 管理员
INSERT INTO users (id, username, password, name, dept, role) VALUES
('USR-ADMIN-001', 'admin', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36ZyLP0LqO1JqJ9L0zLrZ8.', '系统管理员', '网络部', 'admin')
ON CONFLICT (id) DO NOTHING;

-- 最高权限人
INSERT INTO users (id, username, password, name, dept, role) VALUES
('USR-SUPER-001', 'super_admin', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36ZyLP0LqO1JqJ9L0zLrZ8.', '最高权限人', '网络部', 'super')
ON CONFLICT (id) DO NOTHING;

-- 部门负责人（每个部门一个）
INSERT INTO users (id, username, password, name, dept, role) VALUES
('USR-LEAD-001', 'zhang_gongjian', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36ZyLP0LqO1JqJ9L0zLrZ8.', '张领导(工建)', '工程建设部', 'leader'),
('USR-LEAD-002', 'li_wangluo', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36ZyLP0LqO1JqJ9L0zLrZ8.', '李领导(网络)', '网络部', 'leader'),
('USR-LEAD-003', 'wang_kexiang', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36ZyLP0LqO1JqJ9L0zLrZ8.', '王领导(客响)', '客户响应中心', 'leader')
ON CONFLICT (id) DO NOTHING;

-- 县级经办人
INSERT INTO users (id, username, password, name, dept, role) VALUES
('USR-CTY-001', 'a_xian_jingban', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36ZyLP0LqO1JqJ9L0zLrZ8.', 'A县经办人', 'A县', 'county'),
('USR-CTY-002', 'b_xian_jingban', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36ZyLP0LqO1JqJ9L0zLrZ8.', 'B县经办人', 'B县', 'county'),
('USR-CTY-003', 'c_xian_jingban', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36ZyLP0LqO1JqJ9L0zLrZ8.', 'C县经办人', 'C县', 'county')
ON CONFLICT (id) DO NOTHING;

-- 普通员工
INSERT INTO users (id, username, password, name, dept, role) VALUES
('USR-USER-001', 'zhao_staff', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36ZyLP0LqO1JqJ9L0zLrZ8.', '赵员工', '网络部', 'user'),
('USR-USER-002', 'sun_staff', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36ZyLP0LqO1JqJ9L0zLrZ8.', '孙员工', '工程建设部', 'user'),
('USR-USER-003', 'zhou_staff', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36ZyLP0LqO1JqJ9L0zLrZ8.', '周员工', '客户响应中心', 'user'),
('USR-USER-004', 'wu_staff', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36ZyLP0LqO1JqJ9L0zLrZ8.', '吴员工', '市场经营部', 'user'),
('USR-USER-005', 'zheng_staff', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36ZyLP0LqO1JqJ9L0zLrZ8.', '郑员工', '政企客户部', 'user')
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

\echo '种子数据导入完成！';
