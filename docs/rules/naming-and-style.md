# 文件命名规范与代码风格

本文档定义文件命名规范和代码风格规则。

[← 返回编码规范主页](./CODING_STANDARDS.md)

---

## 文件命名规范

### 🔴 核心规则：所有文件统一使用 camelCase

**包括组件文件、页面文件、配置文件等所有 TypeScript/JavaScript 文件**

```
✅ 正确示例：
- layout.tsx         // 组件文件
- home.tsx           // 页面文件
- chat.tsx           // 页面文件
- app.tsx            // 应用根组件
- themeStore.ts      // Store 文件
- rootStore.ts       // Store 文件
- userService.ts     // 服务文件
- chatHistory.ts     // 工具文件
- utils.ts           // 工具文件

❌ 错误示例：
- Layout.tsx         // ❌ 不使用 PascalCase
- Home.tsx           // ❌ 不使用 PascalCase
- theme-store.ts     // ❌ 不使用 kebab-case
- theme_store.ts     // ❌ 不使用 snake_case
- ThemeStore.ts      // ❌ 不使用 PascalCase
```

### 文件夹命名

**使用 camelCase**

```
✅ 正确：
- components/layout/
- pages/home/
- pages/chat/
- stores/
- lib/

❌ 错误：
- components/Layout/
- pages/Home/
- Components/
```

### 文件夹结构

**每个页面放在独立文件夹中**

```
✅ 正确结构：
pages/
├── home/
│   └── home.tsx
├── chat/
│   └── chat.tsx
└── about/
    └── about.tsx

❌ 错误结构：
pages/
├── home.tsx
├── chat.tsx
└── about.tsx
```

---

## 代码风格

### 1. 导入顺序

**ESLint 已配置自动检查和修复导入顺序**

导入分组规则（按顺序）：

1. **builtin** - Node.js 内置模块（如 `node:path`, `node:fs`）
2. **external** - 第三方库（如 `react`, `react-router-dom`, `lucide-react`）
3. **internal** - 项目内部使用 `@/` 别名的导入（**已配置**）
4. **parent** - 父级目录相对路径（`../`）
5. **sibling** - 同级目录相对路径（`./`）
6. **index** - index 文件（`./index`）

```typescript
// 1. Node.js 内置模块（如果使用）
import path from 'node:path';

// 2. 第三方库（external）
import { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { Link } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';

// 3. 项目内部导入 - @/ 别名（internal）
import { useStore } from '@/stores/rootStore';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/button';

// 4. 相对路径导入 - 同级或子级（sibling）
import App from './app';
import './index.css';

// 5. 类型导入（使用 type 关键字，遵循上述分组规则）
import type { User } from '@/types';
```

**注意：**

- 在每个 import 语句内部，成员按字母顺序排序（如 `import { Link, Outlet, useLocation }`）
- ESLint 会自动检查并提示违反导入顺序的情况
- 使用 `pnpm lint --fix` 可以自动修复大部分顺序问题

### 2. 使用路径别名

**必须使用 `@/` 别名引用 src 目录**

```typescript
✅ 正确：
import { useStore } from '@/stores/rootStore';
import Layout from '@/components/layout/layout';
import Home from '@/pages/home/home';

❌ 错误：
import { useStore } from '../../stores/rootStore';
import Layout from '../components/layout/layout';
```

### 3. 组件导出

```typescript
// 默认导出（推荐用于页面和主要组件）
function MyComponent() {
  return <div>Content</div>;
}
export default MyComponent;

// 命名导出（用于工具函数、Hooks、多个导出）
export function useCustomHook() { /* ... */ }
export const utils = { /* ... */ };
```

---

## 相关文档

- [组件规范与状态管理](./components-and-state.md)
- [样式规范与 TypeScript](./styling-and-typescript.md)
- [开发流程与工作规范](./development-workflow.md)
