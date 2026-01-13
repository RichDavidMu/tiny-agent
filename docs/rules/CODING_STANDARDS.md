# OpenManusWeb 编码规范

本文档定义了 OpenManusWeb 项目的编码规范和最佳实践。

**🔴 重要：每次更新代码或规范后，必须同步更新本文档和项目结构文档！**

## 目录

- [技术栈](#技术栈)
- [文件命名规范](#文件命名规范)
- [代码风格](#代码风格)
- [组件规范](#组件规范)
- [状态管理](#状态管理)
- [样式规范](#样式规范)
- [TypeScript 规范](#typescript-规范)
- [文档维护规范](#文档维护规范)

---

## 技术栈

### 核心框架

- **React 19** - UI 框架
- **TypeScript 5.9** - 类型安全
- **Vite 7** - 构建工具
- **React Router Dom 7** - 路由管理

### 状态管理

- **MobX 6** - 主状态管理工具
- **mobx-react-lite** - React 集成

### UI 和样式

- **Tailwind CSS 3** - 样式框架（**唯一样式解决方案**）
- **shadcn/ui** - UI 组件库风格指导
- **lucide-react** - 图标库
- **clsx + tailwind-merge** - 类名合并工具

### AI 功能

- **@mlc-ai/web-llm** - 浏览器内 LLM 推理
- **Qwen2.5-0.5B-Instruct** - 默认使用的模型（~400MB）

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

```typescript
// 1. React 相关
import { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';

// 2. 第三方库
import { Link } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';

// 3. 项目内部导入（使用 @ 别名）
import { useStore } from '@/stores/rootStore';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/button';

// 4. 类型导入（使用 type 关键字）
import type { User } from '@/types';
```

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

## 组件规范

### 1. 组件结构

```typescript
import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/stores/rootStore';
import { cn } from '@/lib/utils';

// 类型定义
interface Props {
  title: string;
  onClose?: () => void;
}

// 组件定义
const MyComponent = observer(({ title, onClose }: Props) => {
  // 1. Hooks
  const { themeStore } = useStore();
  const [isOpen, setIsOpen] = useState(false);

  // 2. 事件处理函数
  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  // 3. 渲染
  return (
    <div className="flex items-center space-x-4">
      <h2 className="text-2xl font-bold">{title}</h2>
      <button onClick={handleClick} className="btn">
        Toggle
      </button>
    </div>
  );
});

export default MyComponent;
```

### 2. MobX 组件观察

**需要响应 MobX store 变化的组件必须使用 `observer`**

```typescript
✅ 正确：
const Header = observer(() => {
  const { themeStore } = useStore();
  return <div>{themeStore.theme}</div>;
});

❌ 错误（不会响应变化）：
const Header = () => {
  const { themeStore } = useStore();
  return <div>{themeStore.theme}</div>;
};
```

### 3. 函数组件命名

**组件函数名使用 PascalCase，但文件名使用 camelCase**

```typescript
// 文件：components/layout/layout.tsx
function Layout() {  // ✅ 函数名用 PascalCase
  return <div>Layout</div>;
}
export default Layout;

// 文件：pages/home/home.tsx
function Home() {  // ✅ 函数名用 PascalCase
  return <div>Home</div>;
}
export default Home;
```

---

## 状态管理

### 1. MobX Store 结构

```typescript
import { makeAutoObservable } from 'mobx';

export class MyStore {
  // 可观察状态
  count = 0;
  name = '';

  constructor() {
    makeAutoObservable(this);
  }

  // Actions (修改状态的方法)
  increment() {
    this.count++;
  }

  setName(name: string) {
    this.name = name;
  }

  // Computed values (派生状态)
  get doubleCount() {
    return this.count * 2;
  }

  // Private 方法
  private validate() {
    return this.name.length > 0;
  }
}
```

### 2. RootStore 模式

**所有 stores 通过 RootStore 统一管理**

```typescript
// stores/rootStore.ts
import { createContext, useContext } from 'react';
import { ThemeStore } from './themeStore';
import { UserStore } from './userStore';

export class RootStore {
  themeStore: ThemeStore;
  userStore: UserStore;

  constructor() {
    this.themeStore = new ThemeStore();
    this.userStore = new UserStore();
  }
}

const rootStore = new RootStore();
const RootStoreContext = createContext<RootStore>(rootStore);

export const useStore = () => {
  const context = useContext(RootStoreContext);
  if (!context) {
    throw new Error('useStore must be used within RootStoreProvider');
  }
  return context;
};

export const RootStoreProvider = RootStoreContext.Provider;
export default rootStore;
```

### 3. Store 使用规范

```typescript
// ✅ 正确：在组件中使用
const MyComponent = observer(() => {
  const { themeStore, userStore } = useStore();

  const handleToggle = () => {
    themeStore.toggleTheme();
  };

  return <div onClick={handleToggle}>{themeStore.theme}</div>;
});

// ❌ 错误：直接导入 store 实例
import rootStore from '@/stores/rootStore';
const theme = rootStore.themeStore.theme; // ❌ 不推荐
```

---

## 样式规范

### 1. 唯一样式方案：Tailwind CSS

**严格禁止使用其他样式方案**

- ❌ 禁止使用 CSS Modules
- ❌ 禁止使用 Sass/SCSS/Less
- ❌ 禁止使用 styled-components
- ❌ 禁止使用 emotion
- ❌ 禁止使用内联样式（除非动态计算）

```typescript
✅ 正确：
<div className="flex items-center justify-between p-4 bg-background">
  <h1 className="text-2xl font-bold">Title</h1>
</div>

❌ 错误：
<div style={{ display: 'flex', padding: '16px' }}>
  <h1 style={{ fontSize: '24px' }}>Title</h1>
</div>
```

### 2. 遵循 shadcn/ui 设计规范

**使用 shadcn/ui 的组件风格和主题系统**

```typescript
// shadcn/ui 按钮风格
<button className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
  Click me
</button>
```

### 3. 使用 cn 工具函数

**合并类名时必须使用 `cn()` 函数**

```typescript
import { cn } from '@/lib/utils';

// ✅ 正确
<div
  className={cn(
    'base-class',
    isActive && 'active-class',
    isDisabled && 'disabled-class',
    className
  )}
>
  Content
</div>

// ❌ 错误
<div className={`base-class ${isActive ? 'active-class' : ''}`}>
  Content
</div>
```

### 4. 主题变量

**使用 CSS 变量定义的主题色**

```css
/* 可用的主题变量 */
--background
--foreground
--primary
--primary-foreground
--secondary
--secondary-foreground
--muted
--muted-foreground
--accent
--accent-foreground
--destructive
--destructive-foreground
--border
--input
--ring
--card
--card-foreground
--popover
--popover-foreground
```

```typescript
// 在 Tailwind 中使用
<div className="bg-background text-foreground">
  <div className="bg-primary text-primary-foreground">Primary</div>
  <div className="bg-secondary text-secondary-foreground">Secondary</div>
  <div className="border-border">Bordered</div>
</div>
```

### 5. 响应式设计

**使用 Tailwind 的响应式前缀**

```typescript
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
  <div className="p-4 sm:p-6 md:p-8">Responsive padding</div>
</div>
```

---

## TypeScript 规范

### 1. 类型定义

```typescript
// 使用 interface 定义对象类型
interface User {
  id: string;
  name: string;
  email: string;
  age?: number; // 可选属性
}

// 使用 type 定义联合类型和复杂类型
type Theme = 'light' | 'dark';
type Status = 'idle' | 'loading' | 'success' | 'error';
type UserWithPermissions = User & { permissions: string[] };
```

### 2. 类型导入

**必须使用 type 导入类型（ESLint 规则强制）**

```typescript
✅ 正确：
import type { User, Theme } from '@/types';
import { api } from '@/services/api';

❌ 错误：
import { User } from '@/types'; // User 是类型，应该用 type import
```

### 3. 避免 any

```typescript
✅ 推荐：
const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  console.log(event.target.value);
};

interface ApiResponse<T> {
  data: T;
  status: number;
}

⚠️ 避免（虽然允许，但应尽量避免）：
const handleChange = (event: any) => {
  console.log(event.target.value);
};
```

### 4. Props 类型定义

```typescript
// ✅ 使用 interface 定义 Props
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
  disabled?: boolean;
}

function Button({ children, variant = 'primary', onClick, disabled }: ButtonProps) {
  return <button onClick={onClick} disabled={disabled}>{children}</button>;
}

// ✅ 使用 type 也可以
type ButtonProps = {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
};
```

---

## 文档维护规范

### 🔴 每次更新后必须同步更新文档

**这是强制性要求！**

### 1. 需要更新文档的情况

以下任何变更都必须更新相关文档：

- ✅ 添加新的技术栈/依赖
- ✅ 修改文件命名规范
- ✅ 修改目录结构
- ✅ 添加新的编码规则
- ✅ 修改状态管理方式
- ✅ 修改样式方案
- ✅ 添加新页面/组件
- ✅ 修改配置文件
- ✅ 修改 AI 模型

### 2. 需要更新的文档

| 变更类型    | 需要更新的文档                                 |
| ----------- | ---------------------------------------------- |
| 技术栈/依赖 | `CODING_STANDARDS.md` + `PROJECT_STRUCTURE.md` |
| 命名规范    | `CODING_STANDARDS.md` + `PROJECT_STRUCTURE.md` |
| 目录结构    | `PROJECT_STRUCTURE.md`                         |
| 编码规则    | `CODING_STANDARDS.md`                          |
| 新增页面    | `PROJECT_STRUCTURE.md`                         |
| 配置修改    | `PROJECT_STRUCTURE.md`                         |
| AI 模型修改 | `CODING_STANDARDS.md` + `PROJECT_STRUCTURE.md` |

### 3. 文档更新流程

```bash
# 1. 修改代码
# 2. 测试代码
# 3. 更新相关文档
# 4. 提交时包含文档更新

git add .
git commit -m "feat: add new feature

- Implement feature X
- Update CODING_STANDARDS.md
- Update PROJECT_STRUCTURE.md

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

### 4. 文档检查清单

提交代码前检查：

- [ ] 代码符合命名规范
- [ ] 使用了正确的文件结构
- [ ] 导入路径使用 `@/` 别名
- [ ] 样式只使用 Tailwind CSS
- [ ] MobX 组件使用 `observer`
- [ ] 类型导入使用 `type` 关键字
- [ ] **已更新相关文档** 🔴

---

## Git 提交规范

### 提交信息格式

```
<type>: <subject>

<body>

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

### Type 类型

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式调整（不影响功能）
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具相关

### 提交示例

```bash
# 功能开发
git commit -m "feat: add user authentication

- Implement login/logout functionality
- Add userStore for state management
- Update CODING_STANDARDS.md with auth patterns

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"

# 文档更新
git commit -m "docs: update file naming conventions

- Change all files to camelCase
- Update CODING_STANDARDS.md
- Update PROJECT_STRUCTURE.md

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"

# 重构
git commit -m "refactor: rename components to camelCase

- Rename Layout.tsx to layout.tsx
- Rename Home.tsx to home.tsx
- Rename Chat.tsx to chat.tsx
- Update all import paths
- Update documentation

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## 工具配置

### ESLint

- 配置文件：`eslint.config.js`（根目录）
- 自动运行：`pnpm lint`
- Git 提交时自动检查（lint-staged）
- 支持 TypeScript、React、MobX

### Prettier

- 配置文件：`.prettierrc`
- 自动格式化：保存时（IDE 配置）
- Git 提交时自动格式化（lint-staged）
- printWidth: 100
- tabWidth: 2
- singleQuote: true

### TypeScript

- 配置：`tsconfig.app.json`（应用代码）
- 严格模式：启用
- 路径别名：`@/*` 映射到 `./src/*`
- 目标：ES2022

---

## 最佳实践

### 1. 组件设计

- ✅ 保持组件单一职责
- ✅ 优先使用函数组件和 Hooks
- ✅ 合理拆分大组件
- ✅ 复用逻辑通过自定义 Hook
- ✅ 使用 TypeScript 类型约束
- ✅ 使用 `observer` 包装 MobX 响应式组件

### 2. 性能优化

- ✅ MobX 的 `observer` 会自动优化重渲染
- ✅ 避免在渲染函数中创建新对象/函数
- ✅ 大列表使用虚拟滚动（如需要）
- ✅ 图片使用懒加载
- ✅ 使用 React Compiler（已配置）

### 3. 错误处理

- ✅ 使用 try-catch 处理异步错误
- ✅ 给用户友好的错误提示
- ✅ 记录错误日志（console.error）
- ✅ 提供错误边界（Error Boundary）

### 4. 可访问性

- ✅ 使用语义化 HTML
- ✅ 提供 aria 属性
- ✅ 确保键盘导航
- ✅ 适当的颜色对比度
- ✅ 使用 `sr-only` 类提供屏幕阅读器文本

### 5. 代码质量

- ✅ 保持函数简短（<50 行）
- ✅ 避免深层嵌套（<4 层）
- ✅ 使用有意义的变量名
- ✅ 添加必要的注释
- ✅ 遵循 DRY 原则

---

## 禁止事项

### ❌ 绝对禁止

1. **使用 Sass/SCSS/CSS Modules** - 只使用 Tailwind CSS
2. **忽略文档更新** - 修改代码必须更新文档
3. **使用 PascalCase 文件名** - 所有文件使用 camelCase
4. **直接修改 DOM** - 使用 React 方式
5. **在组件外部使用 useState** - 状态放在 MobX Store
6. **忽略 TypeScript 错误** - 必须修复所有类型错误
7. **不使用路径别名** - 必须使用 `@/` 别名

### ⚠️ 避免使用

1. 使用 `any` 类型
2. 使用内联样式
3. 创建过大的组件
4. 深层 prop drilling（使用 Context 或 Store）
5. 未测试的代码提交

---

## 参考资源

- [React 文档](https://react.dev/)
- [MobX 文档](https://mobx.js.org/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
- [shadcn/ui 文档](https://ui.shadcn.com/)
- [TypeScript 文档](https://www.typescriptlang.org/)
- [lucide-react 图标](https://lucide.dev/)
- [WebLLM 文档](https://github.com/mlc-ai/web-llm)

---

## 更新日志

### 2026-01-13

- ✅ 统一所有文件使用 camelCase 命名
- ✅ 更改默认 AI 模型为 Qwen2.5-0.5B-Instruct
- ✅ 增加文档维护规范
- ✅ 增加禁止事项清单
- ✅ 完善 TypeScript 规范
- ✅ 完善样式规范

### 初始版本

- ✅ 建立基础编码规范
- ✅ 定义技术栈
- ✅ 定义文件命名规范
