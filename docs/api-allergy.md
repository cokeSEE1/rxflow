# 过敏档案管理 API 文档

> **Base URL**: `http://192.168.1.8:3000`（局域网网关，前后端共享）  
> 所有接口需携带 JWT Token（Header: `Authorization: Bearer <token>`）

## 测试账号

| 角色 | 手机号 | 密码 | 权限说明 |
|------|--------|------|----------|
| 助理 | `13800001111` | `123456` | 过敏档案 CRUD + 药品查询 |
| 医生 | `13800002222` | `123456` | 过敏档案 CRUD + 药品查询 |
| 药师 | `13800005555` | `123456` | 过敏档案只读 + 药品查询 |
| 患者 | `13800004444` | `123456` | 药品查询（无过敏档案权限） |

**登录示例**：

```bash
curl -X POST http://192.168.1.8:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800002222","password":"123456"}'
```

响应中取 `accessToken` 字段，后续请求放入 Header：`Authorization: Bearer <accessToken>`。

---

## 目录

1. [过敏原主数据](#1-过敏原主数据)
2. [患者过敏档案 CRUD](#2-患者过敏档案-crud)
3. [药品过敏风险检测](#3-药品过敏风险检测)
4. [数据模型](#4-数据模型)

---

## 1. 过敏原主数据

### 1.1 获取过敏原列表

```
GET /api/allergens
```

**权限**：assistant / doctor / pharmacist

**响应示例**：

```json
{
  "data": [
    {
      "id": 1,
      "name": "青霉素",
      "category": "antibiotic",
      "description": "青霉素类抗生素，常见过敏原",
      "createdAt": "2025-06-03T07:30:00.000Z"
    },
    {
      "id": 2,
      "name": "头孢菌素",
      "category": "antibiotic",
      "description": "头孢类抗生素，与青霉素有交叉过敏",
      "createdAt": "2025-06-03T07:30:00.000Z"
    }
  ]
}
```

**过敏原分类**：

| 分类 | 值 | 说明 |
|------|-----|------|
| antibiotic | 抗生素类 | 青霉素、头孢菌素、磺胺、链霉素 |
| antipyretic | 解热镇痛类 | 阿司匹林、布洛芬、对乙酰氨基酚 |
| enzyme | 酶类 | 胰岛素 |
| other | 其他 | 碘造影剂、乳胶 |

---

## 2. 患者过敏档案 CRUD

### 2.1 查询过敏档案列表

```
GET /api/patient-allergies
```

**权限**：assistant / doctor / pharmacist

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| patientName | string | 否 | 按患者姓名模糊搜索 |
| allergenName | string | 否 | 按过敏原名称模糊搜索 |
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页条数，默认 20 |

**响应示例**：

```json
{
  "data": [
    {
      "id": 1,
      "patientId": 1,
      "allergenId": 1,
      "severity": "severe",
      "remark": "服用后出现皮疹和呼吸困难",
      "source": "manual",
      "createdAt": "2025-06-15T10:30:00.000Z",
      "patient": {
        "id": 1,
        "name": "张三",
        "phone": "13800138001"
      },
      "allergen": {
        "id": 1,
        "name": "青霉素",
        "category": "antibiotic"
      }
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 20
}
```

### 2.2 获取单条过敏档案

```
GET /api/patient-allergies/:id
```

**权限**：assistant / doctor / pharmacist

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| id | number | 过敏档案记录 ID |

**响应示例**：同 2.1 中 `data` 数组的单条记录结构。

### 2.3 新增过敏档案

```
POST /api/patient-allergies
```

**权限**：assistant / doctor

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| patientId | number | 是 | 患者 ID |
| allergenId | number | 是 | 过敏原 ID |
| severity | string | 否 | 严重程度：`mild` / `moderate` / `severe` |
| remark | string | 否 | 备注说明（最多 500 字） |
| source | string | 否 | 来源，默认 `manual` |

**请求示例**：

```json
{
  "patientId": 1,
  "allergenId": 3,
  "severity": "moderate",
  "remark": "服用磺胺类药物后出现轻度皮疹",
  "source": "manual"
}
```

**响应**：`201 Created`，返回新创建的过敏档案（结构同 2.1 data 单条记录）。

**业务规则**：
- 同一患者 + 同一过敏原不可重复添加（数据库唯一约束）

### 2.4 更新过敏档案

```
PUT /api/patient-allergies/:id
```

**权限**：assistant / doctor

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| id | number | 过敏档案记录 ID |

**请求体**（所有字段可选）：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| patientId | number | 否 | 患者 ID |
| allergenId | number | 否 | 过敏原 ID |
| severity | string | 否 | 严重程度 |
| remark | string | 否 | 备注 |
| source | string | 否 | 来源 |

**响应**：返回更新后的完整过敏档案。

### 2.5 删除过敏档案

```
DELETE /api/patient-allergies/:id
```

**权限**：assistant / doctor

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| id | number | 过敏档案记录 ID |

**响应**：`200`，返回被删除的记录。

---

## 3. 药品过敏风险检测

药品搜索接口已集成过敏风险检测。当传入 `patientId` 时，自动标记每个药品对该患者的过敏风险等级。

### 3.1 药品搜索（含过敏风险）

```
GET /api/drugs/search?keyword=阿莫西林&patientId=1
```

**权限**：authenticated（所有登录用户）

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| keyword | string | 是 | 搜索关键词（支持中文名、拼音首字母、搜索码） |
| patientId | number | 否 | 患者 ID，传入则计算过敏风险 |
| pageSize | number | 否 | 返回条数，默认 20，最大 100 |

**响应示例**：

```json
{
  "data": [
    {
      "id": 5,
      "name": "阿莫西林胶囊",
      "genericName": "阿莫西林",
      "spec": "0.5g×24粒",
      "maker": "联邦制药",
      "insurance": "A",
      "price": 15.0,
      "unit": "盒",
      "dosageForm": "capsule",
      "pinyinInitial": "amxl",
      "searchCode": "amoxilin|amxl",
      "allergyRisk": "severe",
      "allergenName": "青霉素"
    }
  ],
  "total": 1
}
```

### 过敏风险等级说明

| 等级 | 值 | 颜色建议 | 说明 |
|------|-----|---------|------|
| 严重 | `severe` | 红色 | 患者有该成分的严重过敏记录，**禁止使用** |
| 中等 | `moderate` | 橙色 | 患者有该成分的中等过敏记录，**谨慎使用** |
| 轻微 | `compatible` | 黄色 | 患者有该成分的轻度过敏记录，可兼容使用 |
| 无风险 | `null` | — | 该药品成分不在患者过敏档案中 |

**检测逻辑**：药品通过 `DrugIngredient` 关联过敏原，遍历该药品的所有成分，以最严重的过敏等级返回。

---

## 4. 数据模型

### Allergen（过敏原主数据）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Int (PK) | 主键 |
| name | String(100) | 过敏原名称（唯一） |
| category | String(50) | 分类：antibiotic / antipyretic / enzyme / other |
| description | String (Text) | 说明 |
| createdAt | DateTime | 创建时间 |

### PatientAllergy（患者-过敏原关联）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Int (PK) | 主键 |
| patientId | Int (FK → Patient) | 患者 ID |
| allergenId | Int (FK → Allergen) | 过敏原 ID |
| severity | String(20) | 严重程度：mild / moderate / severe |
| remark | String(500) | 备注说明 |
| source | String(20) | 来源，默认 `manual` |
| createdAt | DateTime | 创建时间 |

**约束**：
- `@@unique([patientId, allergenId])` — 同一患者和过敏原组合唯一
- `onDelete: Cascade` — 删除患者时级联删除过敏档案

### DrugIngredient（药品-过敏原关联）

药品成分表将药品与过敏原关联，是过敏风险检测的核心桥梁：

```
Drug → DrugIngredient → Allergen → PatientAllergy → Patient
```

当搜索药品并传入 `patientId` 时，系统：
1. 查出该患者的所有 `PatientAllergy` 记录
2. 对每个搜索结果药品，遍历其 `DrugIngredient` 关联的过敏原
3. 匹配患者的过敏原，取最严重等级返回

---

## 5. 错误响应

所有接口遵循统一的错误响应格式：

```json
{
  "error": "错误描述信息"
}
```

常见 HTTP 状态码：

| 状态码 | 说明 |
|--------|------|
| 401 | 未登录 / Token 过期 |
| 403 | 角色无权限访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |
