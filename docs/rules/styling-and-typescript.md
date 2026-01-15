# 样式规范与 TypeScript 规范

本文档定义样式编写规范和 TypeScript 使用规范。

[← 返回编码规范主页](./CODING_STANDARDS.md)

---

## 样式规范

### 1. 唯一样式方案：Tailwind CSS v4

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

### Tailwind CSS v4 重要变化

**不再使用 `container` 类**

Tailwind v4 不再推荐使用 `container` 类，改用原生工具类组合：

```typescript
// ✅ v4 推荐写法
<div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">

// ❌ v3 旧写法（不推荐）
<div className="container">
```

**变换和滤镜类直接使用**

v4 中不再需要 `transform` 和 `filter` 前缀类：

```typescript
// ✅ v4 写法
<div className="rotate-180 scale-95 blur-sm">

// ❌ v3 旧写法（`transform` 和 `filter` 前缀可省略）
<div className="transform rotate-180 scale-95 filter blur-sm">
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

**使用 CSS 变量定义的主题色（oklch 格式）**

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
--chart-1 ~ --chart-5
--sidebar
--sidebar-foreground
--sidebar-primary
--sidebar-primary-foreground
--sidebar-accent
--sidebar-accent-foreground
--sidebar-border
--sidebar-ring
```

> **注意：** 颜色使用 oklch 格式定义，通过 `@theme inline` 映射到 Tailwind 颜色类。

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

## 相关文档

- [文件命名规范与代码风格](./naming-and-style.md)
- [组件规范与状态管理](./components-and-state.md)
- [开发流程与工作规范](./development-workflow.md)
