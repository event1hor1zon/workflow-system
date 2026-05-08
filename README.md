# 企业工作流系统

企业内部工单流转平台，支持按工号登录鉴权、角色分权、公司网络部审核、市级三部门定级处理、协同部门派单、处理完成回传、普通/紧急/重大事件确认，以及首页控制台与个人中心工作台联动展示。

## 当前版本

- 前端：Vue 3 + Vite + Axios
- 后端：NestJS + TypeORM + PostgreSQL
- 默认前端开发端口：`5173`
- 默认后端端口：`3000`
- 生产部署：`Nginx + PM2`

## 功能概览

- 所有已登录角色都可以发起工单，提单时只填写详情描述
- 系统按员工档案自动识别所属公司，工单先流转到对应公司网络部负责人
- 公司网络部负责人可驳回工单，或提交到 `市网络部 / 市客户响应中心 / 市工程建设部`
- 市级部门负责人接单后必须选择 `普通 / 紧急 / 重大` 级别，并可勾选一个或多个协同部门后派单，协同部门也可以不选
- 协同部门负责人可看到对应工单，并点击“处理完成”
- 单部门工单在当前部门处理完成后直接回到发起人确认
- 多部门协同工单需要所有协同部门都点“处理完成”后，才回到发起人确认
- 普通/紧急工单只需发起人确认
- 重大工单需要发起人和最高领导双签确认
- 最高领导可查看全部工单
- 首页控制台突出“新建工单”，工单详情与所有操作全部收拢到个人中心
- 创建工单和工单详情都支持附件上传，问题附件和处理证明分别记录

## 角色说明

| 角色 | 说明 | 主要操作 |
| --- | --- | --- |
| `user` | 普通员工 | 发起工单、确认处理结果 |
| `county_handler` | 公司网络部负责人 | 审核本公司工单、驳回或提交到市级部门 |
| `department_head` | 市级部门负责人 | 接单定级、协同派单、处理完成 |
| `top_leader` | 最高领导 | 查看全部工单、确认重大事件 |
| `admin` | 管理员 | 查看全部工单、辅助排障和验证 |

## 工单状态机

```text
pending -> processing -> waiting_confirm -> completed
    └---------------------------> rejected
```

- `pending`：员工已发起，等待所属公司网络部负责人审核
- `processing`：已进入市级部门处理阶段
- `waiting_confirm`：等待发起人或双签确认
- `completed`：工单闭环完成
- `rejected`：工单被驳回

## 附件规则

- 创建工单时可上传问题附件，例如文档、图片、截图
- 工单详情页可继续上传处理证明，例如处理结果截图、回单、现场照片
- 附件统一通过后端上传接口保存到 `uploads` 目录，由前端以静态资源方式访问

## 目录结构

```text
工作流/
├── backend/              # NestJS 后端
├── src/                  # Vue 前端源码
├── public/               # 前端静态资源
├── configs/nginx.conf    # Nginx 模板
├── scripts/deploy.sh     # 一键部署脚本
├── scripts/init-db.sql   # 可选的手动数据库初始化脚本
├── scripts/seed-data.sql # 当前版本的种子说明脚本
├── 接口文档.md
├── 项目架构书.md
└── 项目书.md
```

## 本地开发

### 1. 准备 PostgreSQL

创建数据库后，把后端环境变量写入 `backend/.env`，可以直接从 [backend/.env.example](/Users/a1234/Desktop/工作流/backend/.env.example) 复制。

推荐默认值：

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=workflow_user
DB_PASSWORD=workflow_pass_2026
DB_DATABASE=workflow_db
DB_SYNCHRONIZE=true
SEED_DATA=true
JWT_SECRET=change-me
PORT=3000
FRONTEND_URL=http://localhost:5173
```

前端环境变量可选，默认就是 `/api`，如需显式指定可创建根目录 `.env`：

```env
VITE_API_URL=/api
```

### 2. 安装依赖

```bash
npm install
cd backend && npm install
```

### 3. 启动后端

```bash
cd backend
npm run start:dev
```

首次启动时会自动：

- 根据实体同步数据库表结构
- 写入测试旗县、核心部门和测试账号

### 4. 启动前端

```bash
npm run dev
```

开发环境下，Vite 会把 `/api` 自动代理到 `http://localhost:3000`。

## 构建命令

前端：

```bash
npm run build
```

后端：

```bash
cd backend
npm run build
```

## 测试账号

默认密码全部为 `123456`。

| 用户名 | 角色 |
| --- | --- |
| `admin` | 管理员 |
| `leader` | 最高领导 |
| `a_county_handler` | A县经办人 |
| `b_county_handler` | B县经办人 |
| `c_county_handler` | C县经办人 |
| `network_head` | 网络部负责人 |
| `maintenance_head` | 客户响应中心负责人 |
| `engineering_head` | 工程建设部负责人 |
| `user_a1` | A县员工 |
| `user_a2` | A县员工 |
| `user_b1` | B县员工 |
| `user_c1` | C县员工 |

## 生产部署

### 一键部署

在 Ubuntu / Debian 服务器上执行：

```bash
chmod +x scripts/deploy.sh
sudo ./scripts/deploy.sh
```

脚本会自动完成以下事情：

- 安装 Node.js、Nginx、PostgreSQL、PM2
- 创建数据库和用户
- 写入后端 `.env`
- 安装并构建前后端
- 发布前端到 `/var/www/workflow`
- 生成 Nginx 配置并重载
- 通过 PM2 启动后端服务

可通过环境变量覆盖默认部署参数：

```bash
sudo DB_NAME=workflow_db \
  DB_USER=workflow_user \
  DB_PASSWORD=workflow_pass_2026 \
  BACKEND_PORT=3000 \
  WEB_ROOT=/var/www/workflow \
  ./scripts/deploy.sh
```

## 手动部署

1. 安装 PostgreSQL、Nginx、Node.js 20、PM2
2. 执行 `scripts/init-db.sql` 创建数据库和账号
3. 按本地开发方式配置 `backend/.env`
4. 运行前后端构建命令
5. 将前端 `dist/` 发布到 Nginx 静态目录
6. 使用 [configs/nginx.conf](/Users/a1234/Desktop/工作流/configs/nginx.conf) 生成站点配置
7. 在 `backend/` 目录执行 `pm2 start ecosystem.config.js --only workflow-api`

## 相关文档

- [UI设计文档.md](/Users/a1234/Desktop/工作流/UI设计文档.md)
- [接口文档.md](/Users/a1234/Desktop/工作流/接口文档.md)
- [项目架构书.md](/Users/a1234/Desktop/工作流/项目架构书.md)
- [项目书.md](/Users/a1234/Desktop/工作流/项目书.md)
