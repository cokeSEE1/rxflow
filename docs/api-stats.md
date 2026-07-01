# 统计概览 API

> **Base URL**：`http://localhost:3000`  
> 需携带 JWT Token（Header: `Authorization: Bearer <token>`）

## GET /api/patient-allergies/stats

返回全量过敏档案的统计聚合数据，用于统计概览页面的卡片和图表展示。后端通过 `groupBy` 聚合查询，不受分页限制。

### 权限

`assistant` / `doctor` / `pharmacist`

### 响应示例

```json
{
  "severe": 1,
  "moderate": 2,
  "mild": 2,
  "total": 5,
  "topAllergens": [
    { "name": "青霉素", "count": 1 },
    { "name": "阿司匹林", "count": 1 },
    { "name": "对乙酰氨基酚", "count": 1 },
    { "name": "乳胶", "count": 1 },
    { "name": "布洛芬", "count": 1 }
  ]
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `severe` | number | 重度过敏档案数 |
| `moderate` | number | 中度过敏档案数 |
| `mild` | number | 轻度过敏档案数 |
| `total` | number | 过敏档案总数 |
| `topAllergens` | array | 过敏原分布 Top 8，按数量降序 |
| `topAllergens[].name` | string | 过敏原名称 |
| `topAllergens[].count` | number | 该过敏原关联的档案数 |

### 调用示例

```bash
curl http://localhost:3001/api/patient-allergies/stats \
  -H "Authorization: Bearer <accessToken>"
```

### 前端调用

```typescript
import { getAllergyStats, type AllergyStats } from '@/api/allergies'

const stats: AllergyStats = await getAllergyStats()

// stats 用于统计卡片
// { severe, moderate, mild, total }

// stats.topAllergens 用于过敏原分布图表
// [{ name, count }, ...]
```

### 数据流

```
AllergyListView.vue (统计概览 Tab)
  │
  ├─ fetchStats()
  │    └─ GET /api/patient-allergies/stats
  │         └─ Prisma groupBy 全量聚合
  │              ├─ severe / moderate / mild  → 统计卡片 + 环形图
  │              └─ topAllergens (Top 8)      → 柱状图
  │
  └─ 图表 (ECharts)
       ├─ 横向柱状图: 过敏原分布 Top 8
       └─ 环形图:     严重程度分布
```

### 错误响应

| 状态码 | 响应体 | 场景 |
|--------|--------|------|
| 401 | `{"error":"未登录或 Token 已过期"}` | 未认证 |
| 403 | `{"error":"无权限访问"}` | 角色无权限 |
