# 患者问诊链路 — 设计规格说明书

> 版本：v1.0 | 日期：2026-06-11 | 状态：设计评审通过

## 1. 背景与目标

RxFlow 当前链路从"医生助理创建处方"开始，缺少患者问诊环节。在真实医疗场景中，患者应先经过挂号→问诊→诊断→开方。本次设计在现有处方系统之上，新增问诊链路作为上游。

### 核心设计决策

| 决策 | 选择 |
|------|------|
| 问诊形式 | 线下记录模式（问诊在线下发生，医生在系统录入结果） |
| 角色分工 | 医助协作 — 医生写诊断，助理根据诊断建处方 |
| 数据粒度 | 分步录入（核心先填：主诉+诊断；按需补充：病史+检查+方案） |
| 集成方案 | 独立问诊实体，对现有处方系统零侵入 |

## 2. 数据模型

### 2.1 Registration（挂号记录）— 新增表

纯登记记录，无状态流转。Consultation 可独立存在不依赖挂号。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Int PK | 自增主键 |
| patientId | Int FK | 关联 Patient |
| doctorId | Int FK | 接诊医生（关联 User） |
| department | Varchar(50) | 科室 |
| registeredAt | DateTime | 挂号时间，默认 now() |
| createdAt | DateTime | 创建时间，默认 now() |
| updatedAt | DateTime | 更新时间 |

### 2.2 Consultation（问诊记录）— 新增表

核心实体。主诉+诊断为必填核心，其余字段分步补充。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Int PK | 自增主键 |
| registrationId | Int? FK | 关联挂号（可选） |
| patientId | Int FK | 关联 Patient |
| doctorId | Int FK | 问诊医生（关联 User） |
| chiefComplaint | Text | ★ 主诉（核心，必填） |
| presentIllness | Text? | 现病史 |
| pastHistory | Text? | 既往史 |
| physicalExam | Text? | 体格检查 |
| auxiliaryExam | Text? | 辅助检查 |
| diagnosis | Text | ★ 诊断结论（核心，必填） |
| icdCode | Varchar(20)? | ICD-10 编码 |
| treatmentPlan | Text? | 治疗方案/用药建议 |
| status | Varchar(20) | draft → in_progress → completed |
| stepsCompleted | Json | 步骤完成追踪，默认 `["chiefComplaint","diagnosis"]` |
| completedAt | DateTime? | 完诊时间 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

**关联关系：**
- Registration 1:1 Consultation（可选，Consultation 可独立存在）
- Consultation 1:N Prescription（一次问诊可产生多张处方）

### 2.3 Prescription 扩展 — 修改

在现有 Prescription 表新增一个可选外键：

| 字段 | 类型 | 说明 |
|------|------|------|
| consultationId | Int? FK | 关联 Consultation（可选，不影响现有独立处方） |

## 3. 状态流转

```
Registration: 无状态（纯记录）

Consultation:
  draft ──→ in_progress ──→ completed
  (填核心)   (补充病史检查)   (锁定，可开方)
```

- **draft**：仅要求 chiefComplaint + diagnosis 有值，其余可空
- **in_progress**：医生继续补充病史、检查等信息
- **completed**：锁定，助理可在新建处方时选择关联

## 4. 页面设计

### 4.1 ConsultationListView（问诊列表）— 医生视角

- 列表字段：患者姓名、主诉（截断）、诊断（截断）、状态标签、创建时间
- 筛选：状态（draft/in_progress/completed）、患者姓名、日期范围
- 操作：新建问诊、继续编辑（draft/in_progress）、查看详情

### 4.2 ConsultationFormView（问诊表单）— 医生填写

分步录入布局：

1. **步骤 1：核心信息**（必填，创建时填写）
   - 选择患者（复用现有 Patient 搜索组件）
   - 主诉 textarea
   - 诊断结论 textarea
   - ICD-10 编码（可选）
   - → 保存为 draft

2. **步骤 2：病史补充**（可选）
   - 现病史 textarea
   - 既往史 textarea
   - 体格检查 textarea
   - 辅助检查 textarea

3. **步骤 3：治疗方案**（可选）
   - 治疗方案/用药建议 textarea
   - → 标记为 completed

步骤指示器根据 `stepsCompleted` 字段渲染，已完成的步骤显示 ✓，未完成的显示灰色。

### 4.3 PrescriptionFormView 扩展 — 助理操作

在现有"新建处方"表单顶部增加：
- "关联问诊"选择器：搜索已完成的 Consultation，选中后自动带入 patient + diagnosis + treatmentPlan
- 不选也可以，保持现有独立建处方流程不变

### 4.4 DashboardView 扩展 — 医生视角

DashboardDoctorPanels 中增加统计卡片：
- 待问诊（draft 计数）
- 问诊中（in_progress 计数）
- 今日完诊（completed 计数）
- 快捷入口：新建问诊

### 4.5 PrescriptionDetailView 扩展

处方详情如果有关联 Consultation，展示"来源问诊"卡片，点击可跳转到问诊详情。

## 5. API 设计

### 5.1 Registration

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | /api/registrations | 新建挂号 | assistant, doctor |
| GET | /api/registrations | 挂号列表 | assistant, doctor |
| GET | /api/registrations/:id | 挂号详情 | assistant, doctor |

### 5.2 Consultation

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | /api/consultations | 新建问诊 | doctor |
| GET | /api/consultations | 问诊列表 | doctor（自己）, assistant（已完诊） |
| GET | /api/consultations/:id | 问诊详情 | doctor, assistant |
| PUT | /api/consultations/:id | 更新问诊 | doctor（自己的，非 completed） |
| POST | /api/consultations/:id/complete | 标记完诊 | doctor |
| GET | /api/consultations/:id/prescriptions | 关联处方列表 | doctor, assistant |

### 5.3 Prescription 扩展

| 变更 | 路径 | 说明 |
|------|------|------|
| POST/PUT 扩展 | /api/prescriptions | 支持 consultationId 可选参数 |
| GET 扩展 | /api/prescriptions/:id | 返回关联 consultation 摘要 |

## 6. 前端 Store

### useConsultationStore

```typescript
defineStore('consultation', () => {
  // state: list, current, loading, filters
  // actions: fetchList, fetchById, create, update, complete
  // 查询已完诊供关联：fetchCompletedForPatient(patientId)
})
```

## 7. 不变更的部分

- 现有 Prescription 状态机（7 状态）完全不变
- 现有路由和权限体系不变
- 现有 API 接口向后兼容（consultationId 为可选参数）
- 现有 4 角色定义不变，权限仅扩展 doctor/assistant

## 8. 实施估算

| 模块 | 预估工作量 |
|------|-----------|
| Prisma schema 变更 + 迁移 | 0.5 天 |
| 后端路由 + 服务 | 1.5 天 |
| 前端 ConsultationListView | 1 天 |
| 前端 ConsultationFormView | 1 天 |
| PrescriptionForm 扩展 + Dashboard 扩展 | 0.5 天 |
| 联调测试 | 0.5 天 |
| **合计** | **5 天** |
