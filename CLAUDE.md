# RxFlow — 线上处方配送管理平台

> 教学项目：Vue 3 全栈应用，教师搭建框架 + 后端，学生完成 6 个业务页面

## 项目定位

面向中小型医疗机构的处方流转与配送管理平台。4 角色（医生助理、医生、快递员、患者）× 7 状态流转（draft → pending → approved → delivering → received，含 rejected / returned 分支）。

## 技术栈

| 层 | 前端 | 后端 |
|---|---|---|
| 框架 | Vue 3.5 + TypeScript 5.6 | Express 4.21 + TypeScript 5.6 |
| 构建 | Vite 6 | tsx (dev) / tsc (build) |
| UI | Element Plus 2.14 | — |
| 状态 | Pinia 3 | — |
| 路由 | Vue Router 4 | — |
| HTTP | Axios | — |
| 数据库 | — | MySQL 9.6 + Prisma 5.22 |
| 认证 | — | JWT (jsonwebtoken) + bcryptjs |
| 端口 | 5173 | 3000 |

## 项目结构

```
rxflow-workspace/
├── CLAUDE.md                  # 本文件
├── docs/
│   ├── requirements.md        # 需求规格说明书（含角色-页面矩阵、状态机）
│   ├── mockups/               # 10 个 HTML mockup 页面
│   └── superpowers/           # 计划文件
├── frontend/
│   ├── index.html             # Google Fonts 预加载（DM Serif Display + DM Sans）
│   ├── vite.config.ts         # @ 别名 → src/, /api 代理 → localhost:3000
│   └── src/
│       ├── main.ts            # 入口：createApp → Pinia → Router → ElementPlus → 全局CSS
│       ├── App.vue            # 裸 <router-view />
│       ├── router/
│       │   ├── index.ts       # createRouter + beforeEach 守卫
│       │   └── routes.ts      # RouteRecordRaw[]，懒加载，meta.roles
│       ├── stores/            # Pinia setup stores（useXxxStore）
│       │   ├── user.ts        # 登录/用户/MOCK 模式
│       │   ├── prescription.ts
│       │   ├── patient.ts
│       │   └── notification.ts
│       ├── api/
│       │   ├── client.ts      # axios 实例，拦截器，token 刷新
│       │   ├── auth.ts        # 类型导出（LoginParams, UserInfo 等）
│       │   └── prescriptions.ts, patients.ts, dashboard.ts, notifications.ts
│       ├── composables/
│       │   ├── usePermission.ts
│       │   └── useDraft.ts    # localStorage 草稿自动保存
│       ├── directives/
│       │   └── permission.ts  # v-permission 角色指令
│       ├── components/
│       │   ├── AppLayout.vue  # 侧栏 + 顶栏 + <router-view />
│       │   ├── SidebarMenu.vue
│       │   ├── HeaderBar.vue
│       │   ├── StatusTag.vue
│       │   └── NotificationBell.vue
│       ├── views/             # 页面组件（*View.vue）
│       │   ├── LoginView.vue
│       │   ├── DashboardView.vue
│       │   ├── PrescriptionListView.vue
│       │   ├── PrescriptionFormView.vue
│       │   ├── PrescriptionDetailView.vue
│       │   ├── PatientListView.vue
│       │   ├── DeliveryListView.vue
│       │   ├── NotificationCenterView.vue
│       │   ├── NotFoundView.vue
│       │   └── ForbiddenView.vue
│       └── styles/
│           └── global.css     # CSS 变量、Element Plus 主题覆盖、全局工具类
└── backend/
    ├── .env                   # DATABASE_URL, JWT_SECRET
    ├── prisma/
    │   ├── schema.prisma      # 10 个模型（User, Patient, Prescription, PrescriptionItem, PrescriptionTimeline, PrescriptionTemplate, Notification, SmsVerification, DeliveryException, RejectionTemplate）
    │   └── seed.ts            # 4 用户 + 2 患者 + 5 处方 + 5 驳回模板 + 3 通知
    ├── scripts/               # 4 角色验证脚本
    └── src/
        ├── index.ts           # Express 启动
        ├── config.ts          # 环境变量配置
        ├── middleware/
        │   ├── auth.ts        # JWT 验证 → req.user
        │   ├── role.ts        # requireRole('doctor') 工厂函数
        │   └── errorHandler.ts # AppError 类 + 全局错误中间件
        ├── routes/            # 路由层：参数提取 → service 委托
        │   ├── auth.ts        # /api/auth/*
        │   ├── prescriptions.ts # /api/prescriptions/*
        │   ├── patients.ts    # /api/patients/*
        │   ├── notifications.ts
        │   └── dashboard.ts   # /api/dashboard/stats
        ├── services/          # 业务逻辑层
        │   ├── authService.ts
        │   ├── prescriptionService.ts  # 15 个导出函数
        │   ├── patientService.ts
        │   ├── notificationService.ts
        │   └── dashboardService.ts
        └── utils/
            ├── jwt.ts         # TokenPayload, sign/verify
            └── prescriptionNo.ts

```

## 代码风格约定

### Vue SFC
- **所有组件**使用 `<script setup lang="ts">`，禁止 Options API
- Props：`defineProps<{ ... }>()`，纯类型声明，不用运行时验证
- 样式：全部 `<style scoped>`，穿透 Element Plus 用 `:deep()`
- 组件命名：多词 PascalCase（`PrescriptionFormView.vue`）
- 页面组件以 `*View.vue` 结尾，通用组件无后缀

### Pinia Store
- **统一使用 Setup Store 模式**：`defineStore('id', () => { ... return { ... } })`
- 状态用 `ref()`，派生用 `computed()`，操作用 `async function`
- Store ID 为短字符串（`'user'`, `'prescription'`）
- 常量 UPPER_SNAKE_CASE 放在模块顶部

### Mock 模式
```typescript
const USE_MOCK = true  // 放在 store 文件顶部
// 每个操作：
async function fetchXxx() {
  if (USE_MOCK) { /* 模拟数据 */ return }
  // 真实 API 调用
}
```
- 路由守卫在 DEV 模式下跳过登录/角色检查：`!import.meta.env.DEV`

### Express 后端
- 路由处理程序：`async (req, res, next) => { try { ... } catch (e) { next(e) } }`
- 错误通过 `throw new AppError(statusCode, message)` 抛出
- 静态路由必须在 `/:id` 参数化路由之前注册
- 服务文件顶层创建单例 `const prisma = new PrismaClient()`
- 状态流转函数：fetch → 验证 → update + timeline.create
- API 响应格式：列表 `{ data, total, page, pageSize }`，错误 `{ error: string }`
- 错误消息使用中文

### TypeScript
- 两端都 `strict: true`
- 类型名前缀：API 参数 `*Params`，结果 `*Result`，实体 `*Info`
- `interface` 用于数据形状，`type` 用于联合类型
- Express `req.user!` 非空断言（auth 中间件保证已设置）

### CSS 设计系统（Clinical Precision）
- 主色：teal `#0f766e`（`--teal-700`），深色 `#134e4a`（`--teal-900`）
- 强调色：coral `#f43f5e`
- 中性色：warm stone（`--warm-50` ~ `--warm-900`）
- 字体：DM Serif Display（品牌标题），DM Sans（正文 UI）
- 侧边栏：teal 渐变 220px 宽，顶栏 56px 白色
- 状态标签色：draft gray / pending orange / approved blue / delivering teal / received green / rejected red / returned coral

### 命名约定汇总

| 类别 | 约定 | 示例 |
|------|------|------|
| Vue 组件文件 | PascalCase | `SidebarMenu.vue` |
| 页面组件 | *View.vue | `DashboardView.vue` |
| 后端文件 | kebab-case | `errorHandler.ts` |
| Composable | use* | `useDraft.ts` |
| Pinia Store | `useXxxStore` | `useUserStore` |
| 后端函数 | camelCase | `submitForReview` |
| 常量 | UPPER_SNAKE_CASE | `USE_MOCK` |
| API 函数 | camelCase 动词+名词 | `listPrescriptions` |
| 数据库模型 | PascalCase | `PrescriptionItem` |
| 数据库字段 | camelCase | `approvedAt` |
| CSS 类名 | kebab-case 命名空间 | `.stat-card` |

## 关键命令

### 前端
```bash
cd frontend
npm run dev          # Vite 开发服务器 :5173
npm run build        # vue-tsc -b && vite build
```

### 后端
```bash
cd backend
npm run dev          # tsx watch src/index.ts :3000
npm run build        # tsc
npm run db:migrate   # prisma migrate dev
npm run db:seed      # tsx prisma/seed.ts
npm run db:reset     # prisma migrate reset --force
```

### MySQL
```bash
mysql -u root -proot123456
# 数据库：rxflow，端口 3306
```

## 处方状态机（7 状态）

```
draft → pending → approved → delivering → received
              ↘ rejected → pending (resubmit)
              approved → pending (revoke, 30min 内)
                       delivering → returned (exception)
              returned → approved (redeliver)
```

## 角色-权限矩阵

| 页面 | assistant | doctor | courier | patient |
|------|-----------|--------|---------|---------|
| 工作台 | 我的待办 | 审核概览 | 配送概览 | 我的处方 |
| 处方列表 | 我创建的 | 全部 | 待配送 | 我的 |
| 新建处方 | ✅ | ❌ | ❌ | ❌ |
| 处方详情 | ✅ | ✅（含审核） | ✅（配送） | ✅（只读） |
| 患者管理 | ✅ | ✅ | ❌ | ❌ |
| 配送管理 | ❌ | ❌ | ✅ | ❌ |

## 数据库核心表

- **User**: 四角色用户（phone 唯一，role 索引）
- **Patient**: 患者信息（phone 索引，createdBy 关联助理）
- **Prescription**: 处方主表（14 个时间戳字段，状态索引）
- **PrescriptionItem**: 药品明细（含 doctorAnnotation 批注）
- **PrescriptionTimeline**: 状态时间线（含 metadata JSON）
- **SmsVerification**: 签收短信验证（attempt 上限 3，5 分钟过期）
- **DeliveryException**: 配送异常（4 种类型，damaged 需照片）
- **RejectionTemplate**: 医生驳回模板（usageCount 统计）

## 重要约束

- 静态路由必须在 `/:id` 之前注册（Express 顺序匹配）
- Express 4 不自动捕获 async 错误，必须 `catch(e) { next(e) }`
- Vite `/api` 代理移除前缀：`/api/auth/login` → `http://localhost:3000/auth/login`
- 驳回理由 ≥ 10 字，撤回窗口 30 分钟（以 `approvedAt` 为准）
- SMS 验证码 3 次失败锁定，5 分钟过期
- 药品破损异常必须上传照片
