# P0 模块跨评审：统一设计方案

> 综合三个独立 Agent 的设计输出，消解冲突，统一优先级，形成可执行的实施路径

---

## 1. 冲突与重叠分析

### 1.1 药品主数据模型冲突（Agent 1 vs Agent 2）

两个 Agent 独立定义了药品目录模型，存在命名和职责冲突：

| 维度 | Agent 1: `Drug` | Agent 2: `DrugCatalog` | 冲突等级 |
|------|-----------------|------------------------|----------|
| 核心字段 | standardName, genericName, specification, manufacturer, approvalNumber | drugName, specification, manufacturer, unit | 高 |
| 搜索能力 | pinyinInitial + searchCode | 无 | 中 |
| 医保分类 | insuranceCategory (A/B/C/self) | 无 | 中 |
| 批号/库存 | 无 | batchNo, quantity, expireDate | 高 |
| 过敏关联 | DrugIngredient → Allergen → PatientAllergy | 无 | 低 |

**决议：采用 Agent 1 的 `Drug` 模型为核心主数据表，将 Agent 2 的批号/库存字段拆分到新表 `DrugBatch`。**

理由：
- Agent 1 的模型更完整（搜索码、医保分类、过敏成分关联）
- 批号/库存与药品主数据是不同生命周期（主数据稳定，库存动态变化）
- 支持 FIFO 配药和多批号管理

### 1.2 处方状态机冲突（Agent 2 vs Agent 3）

| Agent | 新增状态 | 说明 |
|-------|----------|------|
| Agent 2 (Pharmacy) | `dispensing`（配药中）、`dispensed`（已配药） | 插入 approved 和 delivering 之间 |
| Agent 3 (Signature) | 不新增状态，仅扩展签名记录 | 无冲突 |

**决议：采用 Agent 2 的状态扩展。** 更新后的状态机：

```
draft → pending → approved → dispensing → dispensed → delivering → received
              ↘ rejected → pending (resubmit)
                       approved → pending (revoke, 30min 内)
              dispensing → returned (exception)
              dispensed → delivering (courier handover)
              delivering → returned (exception)
                       returned → dispensing (redeliver)
```

签名时机闭环：
- `pending → approved`：医生签名（审批签）
- `dispensed → delivering`：药剂师签名（配药签 + 交接签）
- `delivering → received`：快递员 + 患者签名（签收签）

### 1.3 无冲突的独立模块

以下部分互不冲突，可直接合并：

| 模块 | 来源 Agent | 说明 |
|------|-----------|------|
| 过敏原管理系统 | Agent 1 | DrugIngredient + Allergen + PatientAllergy + 三层告警 |
| 药品相互作用检查 | Agent 1 | DrugInteraction 表 + 哈希表查询 |
| 签名与审计日志 | Agent 3 | AuditLog + PrescriptionVersion + SignatureDialog |
| 处方有效期 | Agent 3 | expiresAt = approvedAt + 3天 |
| 日志保留策略 | Agent 3 | hot 1年 → warm 5年 → cold 15年，定时归档 |

---

## 2. 统一数据模型

### 2.1 新增/修改表汇总

```
Drug                    # 药品主数据（Agent 1 设计，含搜索码+医保分类）
DrugIngredient          # 药品-过敏原成分关联
Allergen                # 过敏原字典
PatientAllergy          # 患者-过敏原关联（替代自由文本 allergyHistory）
DrugInteraction         # 药品相互作用矩阵
DrugBatch               # 药品批号+库存（Agent 2 的库存部分拆分出来）
PrescriptionItem        # 扩展字段：drugId FK, pharmacistNote
AuditLog                # 审计日志（Agent 3）
PrescriptionVersion     # 处方版本快照（Agent 3）

User                    # 扩展：pharmacist 角色 + department 字段
Prescription            # 扩展：dispensing/dispensed 状态 + pharmacistId + expiresAt
SmsVerification         # 扩展：支持配药交接验证
```

### 2.2 核心模型 ER 精简

```
User ──< Prescription ──< PrescriptionItem >── Drug
                │                               │
                │                    ┌──────────┼──────────┐
                │                    │          │          │
         PrescriptionVersion   DrugIngredient  DrugBatch  DrugInteraction
                                    │
                                 Allergen
                                    │
                              PatientAllergy >── Patient

Prescription ──< AuditLog
Prescription ──< PrescriptionTimeline  (keep existing)
```

---

## 3. 统一实施路径

### Phase 1: 基础设施（1-2天） — 优先级：P0

**目标：所有三个模块依赖的共享能力**

| 任务 | 文件 | 说明 |
|------|------|------|
| 1.1 数据库迁移 | `prisma/schema.prisma` | 新增 Drug, DrugIngredient, Allergen, PatientAllergy, DrugInteraction, DrugBatch, AuditLog, PrescriptionVersion 模型 |
| 1.2 User 模型扩展 | `prisma/schema.prisma` | 新增 pharmacist 角色，department 字段 |
| 1.3 Prescription 扩展 | `prisma/schema.prisma` | 新增 dispensing/dispensed 状态，pharmacistId, expiresAt |
| 1.4 种子数据 | `prisma/seed.ts` | 插入 50 个常见药品 + 10 个过敏原 + 2 个药剂师用户 |
| 1.5 运行迁移 | `npx prisma migrate dev` | 生成迁移文件 |

### Phase 2: 药品主数据（3-4天） — 优先级：P0

**目标：独立可运行的药品目录系统**

| 任务 | 文件 | 说明 |
|------|------|------|
| 2.1 药品 CRUD Service | `backend/src/services/drugService.ts` | listDrugs, getDrug, createDrug, updateDrug, toggleActive, searchByKeyword |
| 2.2 药品路由 | `backend/src/routes/drugs.ts` | GET/POST/PUT /api/drugs |
| 2.3 过敏检查服务 | `backend/src/services/allergyService.ts` | checkAllergy(drugIds, patientId) → Alert[] |
| 2.4 相互作用检查 | `backend/src/services/interactionService.ts` | checkInteractions(drugIds) → InteractionAlert[] |
| 2.5 DrugSelector 组件 | `frontend/src/components/DrugSelector.vue` | 拼音搜索 + 医保标签 + 过敏风险标识 |
| 2.6 处方表单集成 | `frontend/src/views/PrescriptionFormView.vue` | 替换现有自由文本药品输入为 DrugSelector |
| 2.7 处方审核增强 | `frontend/src/views/PrescriptionDetailView.vue` | 审核视图集成过敏/交互检查结果 |

### Phase 3: 药房角色与配药（3-4天） — 优先级：P0

**目标：药剂师角色的完整配药流程**

| 任务 | 文件 | 说明 |
|------|------|------|
| 3.1 药剂师路由守卫 | `frontend/src/router/index.ts` | pharmacist 角色路由权限 |
| 3.2 PharmacyDashboard | `frontend/src/views/PharmacyDashboardView.vue` | 药剂师工作台：待配药队列 + 库存概览 |
| 3.3 DispensingView | `frontend/src/views/DispensingView.vue` | 配药详情：FIFO 批号选择 + 药品核对 |
| 3.4 InventoryView | `frontend/src/views/InventoryView.vue` | 库存管理：库存预警 + 入库/出库 |
| 3.5 配药 Service | `backend/src/services/dispensingService.ts` | startDispensing, completeDispensing, FIFO batch selection |
| 3.6 库存 Service | `backend/src/services/inventoryService.ts` | checkStock, reserveBatch, releaseBatch, lowStockAlert |
| 3.7 配药路由 | `backend/src/routes/dispensing.ts` | POST /api/dispensing/start, /complete, inventory CRUD |
| 3.8 状态流转集成 | `backend/src/services/prescriptionService.ts` | 新增 dispensing → dispensed → delivering 流转函数 |
| 3.9 QR 交接码 | `frontend/src/components/HandoverQR.vue` | 药剂师-快递员交接扫描 |

### Phase 4: 电子签名与审计（2-3天） — 优先级：P0

**目标：全流程签名闭环 + 完整审计追踪**

| 任务 | 文件 | 说明 |
|------|------|------|
| 4.1 SignatureDialog | `frontend/src/components/SignatureDialog.vue` | 密码二次确认弹窗 + SHA256 内容摘要展示 |
| 4.2 签名 Service | `backend/src/services/signatureService.ts` | sign(contentToSign, password), verifySignature |
| 4.3 审计日志 Service | `backend/src/services/auditService.ts` | 统一日志记录入口，所有关键操作自动写入 AuditLog |
| 4.4 签名路由 | `backend/src/routes/signatures.ts` | POST /api/signatures/sign, GET /api/signatures/verify |
| 4.5 审批签名集成 | `frontend/src/views/PrescriptionDetailView.vue` | 医生审批按钮触发签名 |
| 4.6 配药签名集成 | `frontend/src/views/DispensingView.vue` | 配药完成 + 交接触发签名 |
| 4.7 签收签名集成 | `frontend/src/views/DeliveryListView.vue` | 快递员送达 + 患者签收触发签名 |
| 4.8 审计日志页面 | `frontend/src/views/AuditLogView.vue` | 审计日志查询页面（按用户/操作/时间筛选） |
| 4.9 版本快照 | `backend/src/services/prescriptionService.ts` | 每次签名时自动创建 PrescriptionVersion 快照 |
| 4.10 日志归档 | `backend/src/cron/archiveLogs.ts` | node-cron 定时任务，warm→cold 归档 |

---

## 4. 前后端文件变更清单

### 后端新增文件

```
backend/prisma/migrations/XXXXXX_p0_unified/
backend/src/services/drugService.ts
backend/src/services/allergyService.ts
backend/src/services/interactionService.ts
backend/src/services/dispensingService.ts
backend/src/services/inventoryService.ts
backend/src/services/signatureService.ts
backend/src/services/auditService.ts
backend/src/routes/drugs.ts
backend/src/routes/dispensing.ts
backend/src/routes/signatures.ts
backend/src/routes/audit.ts
backend/src/cron/archiveLogs.ts
backend/src/utils/hash.ts              # SHA256 内容摘要工具
```

### 后端修改文件

```
backend/prisma/schema.prisma           # 8 个新模型 + User/Prescription/PrescriptionItem 扩展
backend/prisma/seed.ts                 # 种子数据扩展
backend/src/index.ts                   # 注册新路由
backend/src/services/prescriptionService.ts  # 新增状态流转函数
backend/src/routes/prescriptions.ts    # 新增配药/签名端点
```

### 前端新增文件

```
frontend/src/views/PharmacyDashboardView.vue
frontend/src/views/DispensingView.vue
frontend/src/views/InventoryView.vue
frontend/src/views/AuditLogView.vue
frontend/src/components/DrugSelector.vue
frontend/src/components/SignatureDialog.vue
frontend/src/components/HandoverQR.vue
frontend/src/composables/useAllergyCheck.ts
frontend/src/api/drugs.ts
frontend/src/api/dispensing.ts
frontend/src/api/signatures.ts
frontend/src/api/audit.ts
```

### 前端修改文件

```
frontend/src/router/routes.ts                    # 新页面路由 + meta.roles 更新
frontend/src/views/PrescriptionFormView.vue       # DrugSelector 替换自由文本输入
frontend/src/views/PrescriptionDetailView.vue     # 集成签名 + 过敏/交互检查
frontend/src/views/DeliveryListView.vue           # 集成签名
frontend/src/components/AppLayout.vue             # 侧栏菜单新增入口
frontend/src/components/SidebarMenu.vue           # 药剂师菜单项
frontend/src/stores/user.ts                       # pharmacist 角色支持
frontend/src/stores/prescription.ts               # 新状态处理
```

---

## 5. 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| Agent 1 Drug 模型与 Agent 2 DrugCatalog 合并后 Prisma migration 复杂 | 数据丢失 | 先在 dev 环境验证完整 migration 链，seed 数据覆盖所有边界 |
| 状态机扩展（+2 状态）导致现有流转逻辑失效 | 流程阻塞 | 状态流转函数使用 switch 全分支覆盖 + 单元测试 |
| 过敏检查误报率高影响医生效率 | 用户体验差 | 兼容模式（黄色）仅提示不阻止；严重告警（红色）才阻止 |
| 签名 SHA256 哈希依赖密码明文 | 安全风险 | 密码仅在内存中用于哈希，不存储，传输走 HTTPS |
| 库存 FIFO 逻辑在并发下可能超卖 | 库存不准 | 使用 Prisma transaction + 行级锁（select for update） |
| 现有 `allergyHistory` 自由文本到结构化 PatientAllergy 的迁移 | 数据不完整 | 保留原字段，双写兼容期 ≥ 1 个月 |

---

## 6. 估计总工期

| 阶段 | 内容 | 人天 |
|------|------|------|
| Phase 1 | 基础设施（数据库 + 种子） | 2 |
| Phase 2 | 药品主数据（CRUD + DrugSelector + 过敏/交互） | 4 |
| Phase 3 | 药房角色（配药流程 + 库存 + QR交接） | 4 |
| Phase 4 | 电子签名（签名闭环 + 审计 + 归档） | 3 |
| **合计** | | **13 人天** |

---

## 7. 审批门控

每个 Phase 完成后的验收标准：

- **Phase 1**：`prisma migrate dev` 成功，`npm run db:seed` 成功，所有新表可查询
- **Phase 2**：DrugSelector 可搜索选择药品，过敏检查返回正确告警级别，处方提交时过敏信息展示完整
- **Phase 3**：药剂师可登入 → 查看待配药队列 → 选择处方配药 → FIFO 批号扣库存 → 生成 QR 交接码
- **Phase 4**：医生审批需签名确认，药剂师配药完成需签名确认，患者签收需 SMS 验证码，所有操作记录在 AuditLog
