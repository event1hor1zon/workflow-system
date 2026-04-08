# 企业工作流系统 — 握手协同SOP工作闭环全景图

> 中国移动通信集团包头分公司 网络条线数字化协同项目

**版本**: v2.0.0
**技术栈**: Vue 3 + Vite + Vue Router + Node.js + PostgreSQL
**后端端口**: 3000
**前端端口**: 8080

---

## 项目介绍

企业工作流系统是移动包头分公司网络条线的**握手协同SOP工作闭环全景图**可视化平台，旨在消除部门壁垒、实现资源整合、问题共解和效能提升。

系统包含完整的前端展示界面和后端API服务，支持工单流转、AI智能判断、审批流程等功能。

## 核心功能

### 1. 全景图首页
- 可视化展示网络条线三大核心部门的握手协同关系
- 三个中心节点：工程建设部（🏗️）、网络部（🌐）、客响中心（📞）
- 上下双向握手：向上握手（市场经营部/政企客户部/客户服务中心）→ 向下握手（各旗县分公司）
- 点击任意节点弹出详情弹窗，展示SOP工作流程
- 主题切换（明/暗）

### 2. 业务需求工单流转系统
- **三个Tab页面**: 新建需求 / 草稿待流转 / 正在流转
- 工单卡片展示：ID、标题、发起人、部门、类型、创建时间
- 新建表单弹窗：支持需求标题/类型/部门/联系人/描述/优先级
- 工单详情页：含动态拓扑图展示流转节点

### 3. AI智能判断
- 基于知识库的AI自动判断工单类型和优先级
- 智能分配责任部门
- 自动识别无效需求并提示

### 4. 审批流程
- 创建人审批
- 部门负责人审批
- 两级审批确认机制

### 5. 闭环动态拓扑图
- 可视化展示工单在各部门间的流转路径
- 节点状态：已完成（绿色）/ 处理中（橙色脉冲）/ 待接收（灰色）/ 已解决（蓝色）
- 点击节点查看：责任人、总时长、已用时、是否解决、剩余流转、风险因素

## 技术栈

### 前端
| 层级 | 技术 |
|------|------|
| 框架 | Vue 3 (Composition API + `<script setup>`) |
| 构建 | Vite 8.x |
| 路由 | Vue Router 4.x |
| 样式 | 原生 CSS（CSS Variables 主题变量） |

### 后端
| 层级 | 技术 |
|------|------|
| 运行时 | Node.js 20 |
| 框架 | Express.js |
| 数据库 | PostgreSQL |
| ORM | Prisma |
| 进程管理 | PM2 |

### 部署
| 组件 | 技术 |
|------|------|
| Web服务 | Nginx |
| 容器化 | Docker (可选) |

## 组织架构（握手关系）

```
        ┌──────────────────────────────────────────┐
        │  市场经营部  │  政企客户部  │  客户服务中心 │
        └──────────────┴──────────────┴──────────────┘
                          ↑ 向上握手
                          │
              ┌───────────┼───────────┐
              │    横向握手（三部门协同）   │
        ┌─────▼─────┬─────▼─────┬─────▼─────┐
        │ 工程建设部 │   网络部   │  客响中心  │
        │   🏗️     │   🌐     │   📞     │
        └───────────┴───────────┴───────────┘
                          ↓ 向下握手
                    各旗县分公司 (A县/B县/C县)
```

## 数据库表结构

### users（用户表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | VARCHAR(50) | 主键 |
| username | VARCHAR(100) | 用户名 |
| password | VARCHAR(255) | 密码（bcrypt hash） |
| name | VARCHAR(100) | 姓名 |
| dept | VARCHAR(100) | 部门 |
| role | VARCHAR(20) | 角色 |

### counties（县级表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | VARCHAR(50) | 主键 |
| name | VARCHAR(100) | 县名 |

### departments（部门表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | VARCHAR(50) | 主键 |
| name | VARCHAR(100) | 部门名 |
| type | VARCHAR(50) | 类型 |
| layer | ENUM | 层级 (upper/hub/lower) |

### orders（工单表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | VARCHAR(50) | 主键 |
| title | VARCHAR(255) | 标题 |
| creator_id | VARCHAR(100) | 创建人ID |
| status | ENUM | 状态 |
| county_id | VARCHAR(50) | 县级ID |
| priority | VARCHAR(20) | 优先级 |

### order_history（流转记录表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| order_id | VARCHAR(50) | 工单ID |
| action | ENUM | 操作类型 |
| operator | VARCHAR(100) | 操作人 |

### order_approvals（审批记录表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| order_id | VARCHAR(50) | 工单ID |
| approver_id | VARCHAR(50) | 审批人ID |
| approver_type | VARCHAR(20) | 审批类型 |
| status | VARCHAR(20) | 审批状态 |

## API文档

### 认证
```
POST /api/auth/login     - 用户登录
POST /api/auth/register   - 用户注册
GET  /api/auth/me        - 获取当前用户信息
```

### 用户管理
```
GET    /api/users        - 获取用户列表
GET    /api/users/:id   - 获取用户详情
POST   /api/users        - 创建用户
PUT    /api/users/:id   - 更新用户
DELETE /api/users/:id   - 删除用户
```

### 工单管理
```
GET    /api/orders           - 获取工单列表
GET    /api/orders/:id       - 获取工单详情
POST   /api/orders           - 创建工单
PUT    /api/orders/:id       - 更新工单
DELETE /api/orders/:id       - 删除工单
POST   /api/orders/:id/submit - 提交工单
POST   /api/orders/:id/approve - 审批工单
```

### 部门管理
```
GET    /api/departments      - 获取部门列表
GET    /api/departments/:id  - 获取部门详情
```

### 县级管理
```
GET    /api/counties         - 获取县级列表
GET    /api/counties/:id     - 获取县级详情
```

### 知识库
```
GET    /api/knowledge        - 获取知识库列表
POST   /api/knowledge/classify - AI分类判断
```

### 通知
```
GET    /api/notifications     - 获取通知列表
PUT    /api/notifications/:id/read - 标记已读
```

## 测试账号

| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| admin | 123456 | 管理员 | 系统管理员，拥有所有权限 |
| super_admin | 123456 | 最高权限人 | 最高权限人 |
| zhang_gongjian | 123456 | 部门负责人 | 工程建设部负责人 |
| li_wangluo | 123456 | 部门负责人 | 网络部负责人 |
| wang_kexiang | 123456 | 部门负责人 | 客户响应中心负责人 |
| a_xian_jingban | 123456 | 县级经办人 | A县经办人 |
| b_xian_jingban | 123456 | 县级经办人 | B县经办人 |
| c_xian_jingban | 123456 | 县级经办人 | C县经办人 |
| zhao_staff | 123456 | 普通员工 | 普通员工 |

## 部署说明

### 方式一：一键部署（推荐）

```bash
# 进入项目目录
cd /path/to/workflow

# 运行一键部署脚本
chmod +x scripts/deploy.sh
sudo ./scripts/deploy.sh
```

### 方式二：手动部署

#### 1. 安装依赖

```bash
# 安装 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 安装 PostgreSQL
apt install -y postgresql postgresql-contrib

# 安装 Nginx
apt install -y nginx

# 安装 PM2
npm install -g pm2
```

#### 2. 配置数据库

```bash
# 启动 PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# 创建数据库和用户
sudo -u postgres psql -c "CREATE DATABASE workflow;"
sudo -u postgres psql -c "CREATE USER workflow_user WITH ENCRYPTED PASSWORD 'workflow_pass_2024';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE workflow TO workflow_user;"

# 初始化数据库
sudo -u postgres psql -d workflow -f scripts/init-db.sql
sudo -u postgres psql -d workflow -f scripts/seed-data.sql
```

#### 3. 部署后端

```bash
cd backend
npm install

# 创建环境变量文件
cat > .env << EOF
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=workflow_user
DB_PASSWORD=workflow_pass_2024
DB_DATABASE=workflow
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
PORT=3000
EOF

npm run build
pm2 start dist/main.js --name workflow-api
pm2 save
pm2 startup
```

#### 4. 部署前端

```bash
cd frontend
npm install
npm run build

# 复制到 Nginx 目录
mkdir -p /var/www/workflow
cp -r dist /var/www/workflow/
```

#### 5. 配置 Nginx

```bash
# 复制 Nginx 配置
cp configs/nginx.conf /etc/nginx/sites-available/workflow
ln -sf /etc/nginx/sites-available/workflow /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

## 目录结构

```
workflow/
├── backend/                    # 后端代码
│   ├── src/
│   │   ├── controllers/        # 控制器
│   │   ├── models/            # 数据模型
│   │   ├── routes/            # 路由
│   │   ├── middlewares/       # 中间件
│   │   ├── services/          # 业务逻辑
│   │   └── utils/             # 工具函数
│   ├── prisma/
│   │   └── schema.prisma      # 数据库Schema
│   ├── dist/                  # 构建产物
│   ├── .env                   # 环境变量
│   └── package.json
├── frontend/                   # 前端代码
│   ├── src/
│   │   ├── App.vue           # 根组件
│   │   ├── main.js           # 入口文件
│   │   ├── style.css         # 全局样式
│   │   ├── components/       # 组件
│   │   ├── views/            # 视图
│   │   └── router/           # 路由配置
│   ├── dist/                 # 构建产物
│   └── package.json
├── scripts/                    # 部署脚本
│   ├── deploy.sh             # 一键部署脚本
│   ├── init-db.sql           # 数据库初始化
│   └── seed-data.sql         # 种子数据
├── configs/                    # 配置文件
│   └── nginx.conf            # Nginx配置
├── public/                     # 静态资源
├── package.json               # 根项目配置
├── README.md                   # 项目文档
└── 项目架构书.md               # 架构文档
```

## SOP闭环机制

### 全闭环工作流程（8步）
1. 需求发起 → 2. 需求汇总 → 3. 任务分配 → 4. 协同执行 → 5. 进度管控 → 6. 交付验收 → 7. 客户响应 → 8. 闭环销号

### 联席会商机制
- **总联席会**：每月1次，分管副总牵头
- **日常会商**：随时协调，2小时内响应

### 分级处置
- 一般问题：2个工作日
- 复杂问题：7个工作日
- 重大问题：15个工作日

## 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| v2.0.0 | 2026-04-08 | 前后端分离架构，支持完整工单流程 |
| v1.0.0 | 2026-04-01 | 初版上线，纯前端版本 |

## 团队

- **建设单位**: 中国移动包头分公司网络条线/工建部门
- **技术实现**: JVS AI 三角协作团队
