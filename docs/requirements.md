# RxFlow — 线上处方配送管理平台 · 需求规格说明书

> 版本：v1.0 | 日期：2026-06-03 | 状态：需求评审通过

---

## 1. 项目概述

### 1.1 产品定位

RxFlow 是一个面向中小型医疗机构的线上处方流转与配送管理平台。核心解决"处方开出后"的协作问题——从医生助理录入、医生审核、药房配药、快递配送到患者签收，全链路数字化。

### 1.2 项目目标（教学视角）

- **后端**：由教师完整实现，提供 RESTful API + 鉴权 + 状态机
- **前端框架**：由教师搭建，包含路由骨架、权限守卫、Pinia Store、API 层、组件库、一个参考页面
- **学生任务**：在框架内完成 6 个业务页面，覆盖表格、动态表单、状态流转、条件渲染、数据可视化

### 1.3 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Vue 3 + TypeScript + Vite |
| 状态管理 | Pinia |
| 路由 | Vue Router 4 |
| UI 框架 | Element Plus |
| HTTP | Axios |
| 后端 | 教师自选（Node/Java/Python/Go） |
| 数据库 | 教师自选（MySQL/PostgreSQL） |

---

## 2. 角色与权限

### 2.1 角色定义

| 角色 | 标识 | 核心职责 | 权限等级 |
|---|---|---|---|
| 医生助理 | `assistant` | 新建处方、填写患者信息、提交审核、处理驳回 | 中 |
| 医生 | `doctor` | 审核处方（通过/驳回）、查看全部处方和患者 | 高 |
| 快递员 | `courier` | 查看待配送订单、更新配送状态、异常上报 | 低 |
| 病人 | `patient` | 查看自己的处方、追踪配送进度、确认签收 | 最低 |

### 2.2 角色-页面权限矩阵

| 页面 | assistant | doctor | courier | patient |
|---|---|---|---|---|
| 工作台 Dashboard | 我的待办 | 审核概览 | 配送概览 | 我的处方 |
| 处方列表 | 我创建的 | 全部 | 待配送 | 我的 |
| 新建处方 | ✅ | ❌ | ❌ | ❌ |
| 处方详情 | ✅ | ✅（含审核） | ✅（配送视角） | ✅（患者视角） |
| 患者管理 | ✅ | ✅ | ❌（仅配送信息） | ❌ |
| 配送管理 | ❌ | ❌ | ✅ | ❌ |
| 站内通知 | ✅ | ✅ | ✅ | ✅ |

---

## 3. 处方状态机

### 3.1 状态定义

```
┌──────┐   提交审核   ┌──────────┐   医生通过   ┌──────────┐
│ 草稿 │ ──────────→ │ 待审核   │ ──────────→ │ 已通过   │
│draft │ ←────────── │pending   │             │approved  │
└──────┘   保存草稿   └──────────┘             └──────────┘
                          │                        │
                     医生驳回                       │ 快递取件
                          ↓                        ↓
                    ┌──────────┐             ┌──────────┐
                    │ 已驳回   │             │ 配送中   │
                    │rejected  │             │delivering│
                    └──────────┘             └──────────┘
                          │                        │
                     助理修改重提                    ├── 患者签收 → ┌──────────┐
                          ↓                        │             │ 已签收   │
                    ┌──────────┐                   │             │ received │
                    │ 待审核   │                   │             └──────────┘
                    └──────────┘                   │
                                                   ├── 患者拒收 ──┐
                                                   ├── 联系不上 ──┤
                                                   └── 药品破损 ──┘
                                                          ↓
                                                    ┌──────────┐
                                                    │ 异常退回  │
                                                    │returned   │
                                                    └──────────┘
```

### 3.2 状态流转权限

| 当前状态 | 可操作角色 | 可触发动作 | 目标状态 |
|---|---|---|---|
| 草稿 | assistant | 提交审核 | 待审核 |
| 草稿 | assistant | 编辑/删除 | 草稿（原地） |
| 待审核 | doctor | 审核通过 | 已通过 |
| 待审核 | doctor | 驳回（必填理由） | 已驳回 |
| 已驳回 | assistant | 修改后重提 | 待审核 |
| 已通过 | courier | 确认取件 | 配送中 |
| 配送中 | courier | 确认签收（凭证） | 已签收 |
| 配送中 | courier | 上报异常 | 异常退回 |
| 异常退回 | assistant/doctor | 查看处理 | 已通过（重新配送） |
| 已通过 | doctor | 撤回审核（30min内） | 待审核 |

---

## 4. 模块与页面详细设计

### 4.1 模块总览

| 模块 | 页面数 | 负责 |
|---|---|---|
| 认证与权限 | 1（登录） | 教师 |
| 工作台 Dashboard | 1 | **学生** |
| 处方管理 | 3（列表/新建/详情审核） | **学生** |
| 患者管理 | 1 | **学生** |
| 配送管理 | 1 | **学生** |
| 站内通知 | 1（通知中心） | 教师写基础设施 + **学生写组件** |
| 参考示例页 | 1（处方列表简化版） | 教师 |

### 4.2 页面 1：登录页（教师写）

- 手机号 + 密码登录
- 登录后根据角色跳转到对应工作台
- Token 过期自动刷新

### 4.3 页面 2：角色工作台（学生写）

**医生助理视角**：
- 统计卡片行：我的草稿(N) | 待审核(N) | 已驳回(N) | 今日已通过(N)
- 待处理驳回列表（置顶，高亮）
- 今日提交的处方简要列表

**医生视角**：
- 统计卡片行：待审核(N) | 今日已审核(N) | 驳回(N)
- 待审核列表按等待时间排序，加急/超时红色标记
- 最近审核记录

**快递员视角**：
- 统计卡片行：待取件(N) | 配送中(N) | 已签收(N)
- 今日配送任务卡片流
- 异常退回待处理列表

**病人视角**：
- 我的处方状态卡片
- 配送中处方（地图占位 + 预计送达时间）
- 历史处方入口

### 4.4 页面 3：处方列表页（学生写）

**列表字段**：处方编号、患者姓名+电话、诊断摘要、药品数量、状态标签（彩色）、创建人、创建时间、等待时长

**筛选条件**：
- 状态（多选 checkbox，6 种状态 + 异常退回）
- 患者姓名（模糊搜索）
- 日期范围
- 仅 assistant 可见"我的草稿/我的提交"快捷切换

**排序规则**（医生视角待审核列表）：
- 默认按等待时长降序
- 等待 >24h 橙色标签，>48h 红色标签
- 驳回重提交处方带"重提"标签，优先展示

**批量操作**（勾选多行后出现工具栏）：
- assistant：批量提交审核（仅草稿态可操作）
- doctor：批量通过（仅低风险处方，需满足规则）

**技术点**：el-table 筛选/排序/分页、el-tag 状态颜色、v-permission 指令控制按钮、多选交互

### 4.5 页面 4：新建/编辑处方页（学生写）

**表单区块**：

1. **患者选择区**
   - 搜索下拉框：显示姓名 + 手机尾号(4位) + 身份证后4位
   - 选中后展示患者卡片：姓名、性别、年龄、电话、地址、过敏史（红色高亮）
   - "新增患者"按钮 → 弹出抽屉，录入姓名/电话/身份证/地址/过敏史

2. **诊断信息**
   - 诊断描述 textarea
   - "加载模板"下拉 → 选择常用诊断+药品组合，一键填入
   - "保存为模板"按钮

3. **药品清单**（核心复杂度）
   - 动态增删行：每行 = 药品名称(searchSelect) + 规格 + 用量 + 频次(qd/bid/tid/qn) + 天数 + 备注
   - 至少 1 行，最多 20 行
   - 校验：药品名必选、用量为正数、天数 1-90

4. **备注**

**草稿保护**：
- 每 30 秒自动存 localStorage
- 页面刷新/关闭时弹窗提醒恢复
- 提交失败回退到草稿态，不丢失数据

**模板功能**：
- "保存为处方模板"：保存诊断+药品清单
- "加载模板"：选择模板后自动填入
- 选择患者后，自动提示该患者历史处方可复用

**技术点**：动态表单嵌套校验、el-form validate、localStorage 草稿、composable 复用

### 4.6 页面 5：处方详情+审核页（学生写）

**信息展示区**：
- 处方基本信息（编号、创建人、创建时间、状态）
- 患者信息卡片（姓名、性别、年龄、电话、地址、过敏史）
- 诊断描述
- 药品清单表格
- 备注

**状态时间线**（el-timeline）：
- 创建 → 提交审核 → 医生通过/驳回 → 配药 → 取件 → 配送 → 签收
- 每节点显示：操作人、时间、备注
- 驳回节点显示驳回理由（红色）

**审核操作区**（仅医生可见 + 仅待审核态/重提交态可操作）：
- "通过"按钮（绿色，需二次确认）
- "驳回"按钮（红色，弹出驳回表单）：
  - 驳回类型：严重/一般/建议
  - 驳回理由：必填 ≥10 字，支持从模板库选择
  - 驳回模板库：剂量错误 / 诊断与用药不符 / 药物禁忌 / 缺少检查结果 / 患者信息不全
- 处方批注：在药品清单上逐行标注修改意见

**修改对比视图**（驳回重提交处方专属）：
- 左右对比：原驳回处方 vs 修改后处方
- 变更字段绿色高亮
- "仅看变更"切换开关

**配送信息区**（已通过/配送中/已签收态显示）：
- 快递单号、快递员姓名、电话（脱敏）
- 患者收件地址
- 配送状态 + 签收凭证（照片）

**技术点**：条件渲染（角色+状态双重判断）、Pinia 状态流转 action、el-timeline、动态表单

### 4.7 页面 6：患者管理页（学生写）

**列表**：姓名、性别、年龄、电话、地址、身份证（脱敏）、过敏史（红标）、创建时间

**搜索**：姓名、电话

**操作**：新增、编辑（弹窗 form）、删除（确认弹窗）、查看该患者全部处方

**新增/编辑表单**：
- 姓名（必填）、性别、年龄
- 电话（必填，校验格式）、地址（必填）
- 身份证号（选填，校验格式）
- 过敏史（重要，红色提示"必填"）

**技术点**：CRUD 表格、表单校验（电话正则、身份证校验）、弹窗/抽屉编辑

### 4.8 页面 7：配送管理页（学生写）

**快递员视角-配送列表**：
- 筛选：状态（待取件/配送中/已签收/异常退回）
- 列表字段：处方编号、患者姓名、地址、电话（脱敏）、药品数量、状态
- 一键拨号（tel: 链接）
- 操作：确认取件 / 开始配送 / 确认签收 / 上报异常

**确认取件**：
- 点击后状态从"已通过" → "配送中"
- 记录取件时间

**确认签收流程**：
- 第一步：展示药品核对清单（药品名 × 数量）
- 第二步：拍照上传（调起相机）或 输入短信验证码
- 第三步：确认签收 → 状态变为"已签收"

**异常上报**：
- 选择异常类型：患者拒收 / 地址错误 / 联系不上 / 药品破损
- 药品破损需上传照片
- 填写备注
- 提交后状态变为"异常退回"，通知药房

**技术点**：文件上传、状态更新、条件渲染、图片预览、异常状态机分支

### 4.9 站内通知组件（基础设施教师写 + UI 学生写）

**教师提供**：
- 通知 API（列表、标记已读、未读数）
- Pinia notificationStore（unreadCount, fetch, markRead）
- Header 通知图标 + 未读 badge

**学生实现**：
- 通知下拉面板（点击 Header 铃铛）
- 通知中心页面（全量通知列表 + 筛选）

---

## 5. 教师-学生分工清单

### 5.1 教师负责

| 内容 | 说明 |
|---|---|
| 数据库设计 | 用户表、处方表、处方药品表、患者表、配送记录表、通知表、处方模板表 |
| 后端 API | 全部 RESTful 接口，含鉴权中间件、角色校验、状态机校验 |
| 项目脚手架 | Vite + Vue 3 + TypeScript + Pinia + Vue Router + Element Plus |
| Layout | 侧栏导航（角色差异菜单）+ Header（通知铃铛 + 用户信息） |
| 登录页 | 完整登录/注册/Token 管理 |
| 路由骨架 | 全部路由定义 + meta.roles 权限守卫 + 404/403 页面 |
| Axios 封装 | 拦截器、Token 刷新、错误处理 |
| Pinia Store 骨架 | userStore、prescriptionStore、patientStore、deliveryStore、notificationStore |
| 参考示例页 | 处方列表页简化版（展示表格+筛选+分页的标准写法） |
| 通知基础设施 | API + Store + Header 铃铛 UI |

### 5.2 学生负责

| 页面 | 预估工作量 | 核心技能 |
|---|---|---|
| 角色工作台 | 2天 | 数据可视化、角色条件渲染、统计卡片 |
| 处方列表页 | 2天 | el-table 筛选排序分页、状态标签、批量操作、角色按钮 |
| 新建/编辑处方页 | 3天 | 动态表单校验、草稿自动保存、模板加载、患者搜索选择器 |
| 处方详情+审核页 | 3天 | 条件渲染、状态时间线、驳回表单+模板、修改对比视图 |
| 患者管理页 | 2天 | CRUD 表格、弹窗表单、电话/身份证校验 |
| 配送管理页 | 2天 | 状态更新、异常流程、签收凭证（拍照上传） |
| 站内通知组件 | 1天 | 通知面板、未读 badge |

---

## 6. 状态机实现要点（教师参考）

### 6.1 后端状态校验规则

```
助理操作限制：
  - 只能编辑草稿态的处方
  - 只能提交自己的草稿
  - 驳回后只能由原创建助理修改重提

医生操作限制：
  - 只能审核待审核态的处方
  - 驳回必须填写理由 ≥ 10 字
  - 通过后 30 分钟内可撤回（超时或已配送则不可撤回）

快递员操作限制：
  - 只能操作已通过态的处方（取件）
  - 只能操作配送中态的处方（签收/异常）
  - 签收必须有凭证（照片 URL 或验证码）

患者操作限制：
  - 只能查看自己的处方
  - 只能在配送中态确认签收（输入验证码）
```

### 6.2 前端 Pinia 处方状态流转

```typescript
// prescriptionStore 核心 actions
submitForReview(id)   // draft → pending
approve(id)           // pending → approved
reject(id, reason)    // pending → rejected
resubmit(id)          // rejected → pending
revokeApproval(id, reason) // approved → pending (30min window)
pickUp(id)            // approved → delivering
confirmDelivery(id, proof) // delivering → received
reportException(id, type, desc, photo?) // delivering → returned
```

---

## 7. API 设计概要（教师参考）

### 7.1 接口清单

| 模块 | 方法 | 路径 | 说明 |
|---|---|---|---|
| 认证 | POST | /api/auth/login | 登录 |
| 认证 | POST | /api/auth/refresh | 刷新 Token |
| 认证 | GET | /api/auth/me | 当前用户信息 |
| 处方 | GET | /api/prescriptions | 列表（角色+状态过滤） |
| 处方 | POST | /api/prescriptions | 新建 |
| 处方 | GET | /api/prescriptions/:id | 详情 |
| 处方 | PUT | /api/prescriptions/:id | 更新草稿 |
| 处方 | DELETE | /api/prescriptions/:id | 删除草稿 |
| 处方 | POST | /api/prescriptions/:id/submit | 提交审核 |
| 处方 | POST | /api/prescriptions/:id/approve | 审核通过 |
| 处方 | POST | /api/prescriptions/:id/reject | 驳回 |
| 处方 | POST | /api/prescriptions/:id/revoke | 撤回审核 |
| 处方 | POST | /api/prescriptions/:id/pickup | 确认取件 |
| 处方 | POST | /api/prescriptions/:id/deliver | 确认签收 |
| 处方 | POST | /api/prescriptions/:id/exception | 上报异常 |
| 处方 | GET | /api/prescriptions/:id/timeline | 状态时间线 |
| 处方 | POST | /api/prescriptions/templates | 保存模板 |
| 处方 | GET | /api/prescriptions/templates | 模板列表 |
| 患者 | GET | /api/patients | 列表 |
| 患者 | POST | /api/patients | 新增 |
| 患者 | GET | /api/patients/:id | 详情 |
| 患者 | PUT | /api/patients/:id | 编辑 |
| 患者 | DELETE | /api/patients/:id | 删除 |
| 通知 | GET | /api/notifications | 列表 |
| 通知 | PUT | /api/notifications/:id/read | 标记已读 |
| 通知 | GET | /api/notifications/unread-count | 未读数 |
| 统计 | GET | /api/dashboard/stats | 工作台统计 |

---

## 8. 数据表设计概要（教师参考）

### 8.1 核心表

**users** — id, name, phone, password_hash, role(enum), is_active, created_at

**patients** — id, name, gender, age, phone, address, id_card(encrypted), allergy_history, created_at

**prescriptions** — id, prescription_no, patient_id, doctor_id, assistant_id, diagnosis, status(enum), rejected_reason, rejected_type, courier_id, tracking_no, delivery_proof, created_at, updated_at

**prescription_items** — id, prescription_id, drug_name, specification, dosage, frequency, days, remark

**prescription_timeline** — id, prescription_id, action, operator_id, detail, created_at

**prescription_templates** — id, assistant_id, name, diagnosis, items(json), created_at

**notifications** — id, user_id, type, title, content, is_read, prescription_id, created_at

---

## 9. 非功能需求

- **草稿保护**：表单每 30 秒自动保存 localStorage，异常退出可恢复
- **Token 管理**：access token 过期自动 refresh，refresh 失败跳登录
- **权限守卫**：路由 meta.roles 白名单，无权限跳 403
- **错误处理**：Axios 拦截器统一处理 401/403/500，el-message 提示
- **隐私合规**：患者身份证号加密存储、电话脱敏展示、访问日志审计

---

## 10. 项目里程碑建议

| 阶段 | 内容 | 建议用时 |
|---|---|---|
| 1 | 教师搭建后端 API + 数据库 | 3-5 天 |
| 2 | 教师搭建前端脚手架 + 框架 + 参考页 | 3-5 天 |
| 3 | 学生完成工作台 + 处方列表页 | 4 天 |
| 4 | 学生完成新建处方页 + 患者管理页 | 5 天 |
| 5 | 学生完成处方详情审核页 + 配送管理页 | 5 天 |
| 6 | 学生完成通知组件 + 联调 + 验收 | 3 天 |

---

## 11. Mockup 实施进度

> 更新时间：2026-06-03 | 进度汇总：P0 全部完成，P1 部分完成，P2 待开始

---

### P0（已完成 ✅）

- [x] 仪表盘多角色视图 — `dashboard-mockup.html` 支持4角色标签切换（助理/医生/快递员/患者），每个角色有独立统计卡片和内容面板
- [x] 处方详情增强 — `detail-mockup.html` 新增：审核确认弹窗、助理重提交模式、驳回模板芯片点击填入、字数统计（最低10字）、30分钟撤回倒计时、药品行内批注、新旧处方对比视图、配送信息区
- [x] 处方列表增强 — `prescription-list-mockup.html` 新增：医生/助理视角切换、快捷筛选标签（全部/草稿/已提交）、批量操作栏（多选+批量提交）、8种完整状态筛选、超时标记（超24h/超48h）、重提标记
- [x] 处方表单增强 — `prescription-form-mockup.html` 新增：模板加载/保存、患者快速新建抽屉、药品行动态增删（最少1最多20）、备注列、草稿自动保存（30秒）
- [x] 患者端页面 — 新建 `patient-detail-mockup.html`（处方详情+签收确认+SMS验证+药品清单）、`patient-tracking-mockup.html`（4步配送进度+快递员位置+预计送达倒计时+签收确认）

### P1（进行中 🔄）

- [ ] 侧边栏角色适配 — 各页面侧边栏根据角色显示不同菜单项（处理中）
- [ ] 签收确认分步向导 — `delivery-mockup.html` 签收弹窗改为3步分步流程（处理中）
- [ ] 异常类型关联照片 — 仅"药品破损"类型显示照片上传（处理中）
- [ ] 重新配送按钮 — 异常单和已签收单增加重新配送功能（处理中）

### P2（待开始 ⬜）

- [ ] 配送进度标签文字化
- [ ] 地图占位替换
- [ ] 通知中心角色筛选

---

## 页面清单

| 页面 | 文件 | 大小 | 状态 |
|------|------|------|------|
| 登录 | `login-mockup.html` | 9KB | ✅ |
| 工作台 | `dashboard-mockup.html` | 22KB | ✅ P0增强 |
| 处方详情 | `detail-mockup.html` | 30KB | ✅ P0增强 |
| 处方列表 | `prescription-list-mockup.html` | 26KB | ✅ P0增强 |
| 新建处方 | `prescription-form-mockup.html` | 32KB | ✅ P0增强 |
| 患者管理 | `patient-list-mockup.html` | 14KB | ✅ |
| 患者处方详情 | `patient-detail-mockup.html` | 21KB | ✅ P0新建 |
| 配送追踪 | `patient-tracking-mockup.html` | 19KB | ✅ P0新建 |
| 配送管理 | `delivery-mockup.html` | 23KB | 🔄 P1增强中 |
| 通知中心 | `notification-mockup.html` | 10KB | ✅ |

---

## 附录：四角色走查原始发现索引

本需求文档综合了四个角色（医生助理、医生、快递员、病人）的全流程走查结果，28 项优化建议中采纳 23 项进入需求，5 项（移动端适配、虚拟号码、用药指导、慢病续方、收工日报）列为二期规划。
