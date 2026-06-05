# RxFlow 前端项目开发规范

> 基于 [VUE前端项目规范——大模型辅助开发使用约束](https://www.cnblogs.com/dawenyang/p/19293272) 结合本项目技术栈定制。

---

## 一、通用要求

| 要求 | 说明 |
|------|------|
| **语言** | 思考过程与输出内容一律使用中文 |
| **上下文引用** | 每次对话必须明确引用项目中的 `README.md` 相关内容，确保开发行为与项目目标一致 |
| **项目架构** | 基于 Vue 3 + Element Plus + Vue Router + Pinia + Axios + TypeScript 的前端架构 |
| **文档位置** | 项目文档统一存放在 `/docs` 目录下，使用 `.md` 格式编写 |
| **Git 提交规范** | 所有代码提交必须遵循本文档中的 Git 提交规范 |

---

## 二、代码风格

- 保持统一的代码风格：2 个空格缩进、**不使用分号**、单引号、行尾换行
- 遵循 Vue.js 官方风格指南和 ESLint 规范（本项目使用 ESLint flat config + `@stylistic/eslint-plugin`）
- 优先保障代码的可读性，避免过度压缩或炫技式写法
- **必须使用 `<script setup lang="ts">`** 编写 Vue SFC，不使用 Options API

---

## 三、命名规范

### 3.1 变量与函数

- **变量名、函数名**：小驼峰命名法（camelCase）
- **常量**：全大写加下划线（UPPER_SNAKE_CASE），如 `API_BASE_URL`
- **布尔变量**：以 `is`、`has`、`can`、`should` 开头，如 `isLoading`、`hasPermission`

```typescript
// ✅ 正确
const userName = ref('')
const MAX_RETRY_COUNT = 3
const isLoading = ref(false)

function getUserInfo() { /* ... */ }

// ❌ 错误
const user_name = ref('')
const maxRetryCount = 3  // 常量应全大写
function GetUserInfo() { /* ... */ }
```

### 3.2 组件与文件

| 类型 | 命名规则 | 示例 |
|------|---------|------|
| Vue 组件文件 | 大驼峰（PascalCase） | `UserList.vue`、`PrescriptionDetail.vue` |
| 页面级组件 | 大驼峰 + `View` 后缀 | `DashboardView.vue`、`LoginView.vue` |
| 布局组件 | 大驼峰 + `Layout` 后缀 | `AppLayout.vue` |
| TypeScript 工具文件 | 小驼峰（camelCase） | `formatDate.ts`、`usePermission.ts` |
| 样式文件 | 短横线分隔（kebab-case） | `global.scss`、`user-list.scss` |
| 目录名 | 全小写，复数形式 | `components/`、`composables/`、`stores/` |

### 3.3 类型与接口

- **接口/类型**：大驼峰（PascalCase），如 `UserInfo`、`PrescriptionItem`
- **枚举**：大驼峰，成员全大写加下划线

```typescript
enum OrderStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
}
```

### 3.4 CSS 类名

- 使用短横线分隔（kebab-case），如 `user-list-item`、`stat-card`

---

## 四、注释规范

### 4.1 基本要求

- 所有函数、组件、关键逻辑块必须附带**清晰、准确、简洁的中文注释**
- 注释应说明"**为什么**"而不仅是"做什么"
- 使用 `/** */` 格式的 JSDoc 风格注释

### 4.2 @author 与 @since

- `@author` 格式：`username / useremail`（从 Git 配置获取）
- `@since` 格式：`yyyy-MM-dd HH:mm:ss`（代码生成时的时间戳）

### 4.3 Vue 组件注释示例

```vue
<!--
  处方详情页面
  展示处方完整信息，支持状态流转操作
-->
<template>
  <div class="prescription-detail">
    <!-- 处方基本信息 -->
    <el-descriptions :column="2" border>
      <el-descriptions-item label="处方编号">
        {{ prescription.id }}
      </el-descriptions-item>
    </el-descriptions>
  </div>
</template>

<script setup lang="ts">
/**
 * 根据处方状态计算可用的操作按钮
 * 不同角色在不同状态下有不同的操作权限
 * @param status 当前处方状态
 * @param role 当前用户角色
 * @author zhangsan / zhangsan@example.com
 * @since 2025-01-15 14:30:25
 */
function getAvailableActions(status: string, role: string) {
  // ...
}
</script>
```

---

## 五、编码规范

### 5.1 Vue 组件规范

| 规则 | 说明 |
|------|------|
| 单个函数长度 | 不超过 50 行，超出时应考虑拆分或重构 |
| 组件文件行数 | 不超过 300 行，超出时应拆分为多个子组件 |
| 组件模板 | 避免在 template 中写复杂表达式，使用 computed 处理复杂逻辑 |
| Props 定义 | 必须使用 TypeScript 定义类型和默认值 |
| Emits 定义 | 必须使用 TypeScript 显式声明 |
| 全局变量 | 禁止使用，优先使用 Pinia 状态管理或 props/emit 传递数据 |
| 模块导入 | 使用 ES6 import/export 语法，避免 require |
| 组件销毁 | 在 `onUnmounted` 中清理定时器和事件监听器 |

```typescript
// ✅ 正确的 Props/Emits 定义
interface Props {
  userId: number
  userName?: string
  role: 'doctor' | 'pharmacist' | 'assistant'
}

const props = withDefaults(defineProps<Props>(), {
  userName: '',
})

const emit = defineEmits<{
  update: [id: number, data: Record<string, unknown>]
  delete: [id: number]
}>()
```

### 5.2 TypeScript 规范

- 使用 ES6+ 语法（箭头函数、解构赋值、模板字符串等）
- 优先使用 `const`，其次 `let`，**禁止使用 `var`**
- 函数参数不超过 3 个，超出时使用对象参数
- 避免深层嵌套，最多 3 层
- **禁止使用 `any` 类型**（ESLint 已开启 `@typescript-eslint/no-explicit-any: warn`）
- 充分利用类型推断，避免冗余类型标注

```typescript
// ✅ 正确：对象参数
interface SearchParams {
  keyword: string
  page: number
  pageSize: number
}

function searchUsers(params: SearchParams) { /* ... */ }

// ❌ 错误：参数过多
function searchUsers(keyword: string, page: number, pageSize: number, sortBy: string) { /* ... */ }
```

### 5.3 Pinia 状态管理规范

- 统一使用 **Setup Store 模式**（`defineStore('id', () => { ... })`）
- Store 文件以业务领域命名，如 `user.ts`、`prescription.ts`
- 导出的 store 函数以 `use` 开头，如 `useUserStore()`
- 在 Store 内部直接调用 API 模块，不在组件中直接调用 API

```typescript
// ✅ 正确的 Setup Store 模式
export const useDrugStore = defineStore('drug', () => {
  const searchResults = ref<Drug[]>([])
  const searchLoading = ref(false)

  async function search(keyword: string) {
    searchLoading.value = true
    try {
      searchResults.value = await drugApi.search(keyword)
    } finally {
      searchLoading.value = false
    }
  }

  return { searchResults, searchLoading, search }
})
```

### 5.4 路由规范

- 路由名称使用大驼峰（PascalCase），如 `PrescriptionDetail`
- 路由路径使用短横线分隔（kebab-case），如 `/prescriptions/:id`
- 页面级组件懒加载（除核心页面外），使用动态 import
- 路由 meta 中明确声明 `roles` 权限数组

```typescript
{
  path: '/prescriptions',
  name: 'PrescriptionList',
  component: () => import('@/views/PrescriptionListView.vue'),
  meta: { roles: ['assistant', 'doctor', 'patient', 'pharmacist'] },
}
```

---

## 六、样式规范

### 6.1 SCSS 规范

- 使用 SCSS 预处理器，支持变量和嵌套（嵌套不超过 3 层）
- 类名使用短横线分隔命名法（kebab-case）
- 避免使用 `!important`，通过提高选择器权重解决优先级问题
- 合理使用 CSS 变量定义主题色彩（本项目已在 `global.scss` 中定义）
- 组件样式统一使用 `scoped` 属性，避免全局污染

```vue
<style scoped lang="scss">
.prescription-card {
  border-radius: 8px;
  box-shadow: var(--shadow-sm);

  &__header {
    padding: 16px;
    border-bottom: 1px solid var(--warm-200);
  }

  &__body {
    padding: 20px;
  }
}
</style>
```

### 6.2 Element Plus 使用规范

- 优先使用 Element Plus 组件，避免重复造轮子
- 自定义样式时使用 `scoped` 避免全局污染
- 主题定制通过 CSS 变量覆盖（在 `global.scss` 中统一管理 `--el-color-*`）
- 响应式布局使用 Element Plus 栅格系统

### 6.3 响应式设计

- 使用 Element Plus 的栅格系统实现响应式布局
- 移动端适配使用媒体查询
- 图片使用相对单位，支持高分辨率屏幕

---

## 七、目录结构规范

```
frontend/
├── public/                # 静态资源（不经过构建处理）
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── api/               # API 请求封装（按业务模块拆分）
│   │   ├── client.ts      # Axios 实例 + 拦截器
│   │   ├── auth.ts
│   │   └── prescriptions.ts
│   ├── assets/            # 静态资源（经过构建处理：图片、字体等）
│   ├── components/        # 全局公共组件
│   │   ├── AppLayout.vue  # 布局组件
│   │   ├── StatusTag.vue  # 业务组件
│   │   └── ...
│   ├── composables/       # 组合式函数（以 use 前缀命名）
│   │   ├── useDraft.ts
│   │   └── usePermission.ts
│   ├── directives/        # 自定义指令
│   │   └── permission.ts
│   ├── router/            # 路由配置
│   │   ├── index.ts       # 路由实例 + 导航守卫
│   │   └── routes.ts      # 路由定义
│   ├── stores/            # Pinia 状态管理
│   │   ├── user.ts
│   │   └── prescription.ts
│   ├── styles/            # 全局样式
│   │   └── global.scss    # CSS 变量 + Element Plus 主题覆盖
│   ├── types/             # TypeScript 类型定义（如需要）
│   ├── views/             # 页面级组件（以 View 后缀命名）
│   │   ├── DashboardView.vue
│   │   ├── PrescriptionListView.vue
│   │   └── ...
│   ├── App.vue            # 根组件
│   └── main.ts            # 应用入口
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── eslint.config.js
└── package.json
```

---

## 八、测试要求

### 8.1 单元测试

- 为核心业务逻辑和工具函数编写单元测试
- 使用 Vitest + Vue Test Utils 进行组件测试
- 测试覆盖率不低于 **70%**（考虑前端项目特点）
- 测试用例需覆盖正常路径、边界条件和异常场景

### 8.2 E2E 测试

- 关键业务流程编写端到端测试
- 使用 Playwright 进行自动化测试
- 覆盖主要用户操作路径（登录、处方创建、审核、发药等）

### 8.3 手动测试

- 新功能开发完成后进行浏览器兼容性测试（Chrome、Edge、Safari）
- 测试不同屏幕尺寸的响应式效果（1920px、1366px、768px）
- 验证不同角色的权限边界

---

## 九、代码优化与重构

- 优化需**基于性能瓶颈或可维护性问题**，避免无意义的"提前优化"
- 任何优化后必须通过完整测试验证，确保功能正确性
- 在性能与可读性之间**优先保障可读性**，除非性能是明确瓶颈
- 重构前需明确目标（提升可读性、消除重复、改善结构等）
- 重构后必须通过全部现有测试，并补充必要新测试
- 重构不得降低代码可读性或引入隐式复杂度

---

## 十、文档要求

- 所有模块、接口、关键算法必须配套详细的技术文档
- 文档应包含：功能说明、使用示例、输入/输出定义、依赖关系等
- 文档需与代码同步更新，避免"文档腐化"
- 文档统一存放在项目根目录 `/docs` 目录下

---

## 十一、开发工具与配置

### 11.1 VS Code 配置

**推荐安装插件：**

| 插件 | 用途 |
|------|------|
| [Vue - Official (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) | Vue 3 语法高亮、类型检查 |
| [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) | 代码检查 |
| [EditorConfig](https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig) | 编辑器统一配置 |

### 11.2 保存自动格式化

已在 `.vscode/settings.json` 中配置保存时自动 ESLint 修复：

```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

### 11.3 ESLint 核心规则

本项目使用 ESLint flat config，核心规则：

| 规则 | 设置 | 说明 |
|------|------|------|
| `semi` | `error`, never | 不使用分号 |
| `quotes` | `error`, single | 单引号 |
| `comma-dangle` | `error`, always-multiline | 多行尾逗号 |
| `indent` | `error`, 2 | 2 空格缩进 |
| `arrow-parens` | `error`, always | 箭头函数始终加括号 |
| `no-trailing-spaces` | `error` | 禁止尾随空格 |
| `eol-last` | `error`, always | 文件以换行结尾 |
| `no-multiple-empty-lines` | `error`, max 1 | 最多 1 个空行 |

---

## 十二、Git 提交规范

### 12.1 提交格式

```
[任务编号] type subject

- 变更项1
- 变更项2
```

### 12.2 提交类型

| type | 说明 | 使用场景 |
|------|------|---------|
| `feat` | 新功能 | 新增页面、组件、业务功能 |
| `fix` | 缺陷修复 | 修复 Bug、样式问题、逻辑错误 |
| `refactor` | 代码重构 | 重构组件、优化代码结构（不改变功能） |
| `docs` | 文档变更 | 修改 README、注释、开发文档 |
| `style` | 样式调整 | CSS/SCSS 样式修改、UI 调整 |
| `perf` | 性能优化 | 优化加载速度、减少包体积 |
| `test` | 测试代码 | 新增或修改单元测试、E2E 测试 |
| `build` | 构建调整 | Vite 配置、依赖管理、打包优化 |
| `chore` | 其他变更 | 配置文件、开发工具配置 |

### 12.3 提交示例

```
[RX-001] feat 新增处方管理页面

- 新增 PrescriptionListView.vue 处方列表组件
- 实现处方查询、新增、编辑功能
- 添加处方状态管理和权限控制
- 集成 Element Plus 表格和分页组件
```

### 12.4 AI 助手职责

当开发人员请求生成 Git 提交信息时，AI 助手必须：

1. **自动分析代码变更**：执行 `git status` 和 `git diff` 查看变更
2. **生成规范提交信息**：遵循 `[任务编号] type subject` 格式
3. **主动询问**：生成提交信息后，必须主动询问是否需要执行 git 提交并推送

---

## 十三、API 请求规范

- 所有 API 请求封装在 `src/api/` 目录，按业务模块拆分
- 统一使用 `src/api/client.ts` 中的 Axios 实例（已配置 baseURL、超时、Token 注入）
- API 函数命名：`get` 获取、`create` 创建、`update` 更新、`remove` 删除
- 使用 TypeScript 定义请求参数和响应类型

```typescript
// api/prescriptions.ts
import client from './client'
import type { Prescription, PrescriptionCreateParams } from '@/types'

export function getPrescriptionList(params: { page: number; pageSize: number }) {
  return client.get<{ data: Prescription[]; total: number }>('/prescriptions', { params })
}

export function createPrescription(data: PrescriptionCreateParams) {
  return client.post<Prescription>('/prescriptions', data)
}
```

---

## 十四、类型定义规范

- 项目公共类型定义在 `src/types/` 目录（按需创建）
- 组件专用类型可直接定义在组件文件内
- Store 中的类型定义在对应 store 文件内

```typescript
// src/types/prescription.ts
export interface Prescription {
  id: number
  patientName: string
  status: PrescriptionStatus
  createdAt: string
}

export type PrescriptionStatus = 'draft' | 'pending' | 'approved' | 'dispensing' | 'delivering' | 'completed' | 'rejected'
```
