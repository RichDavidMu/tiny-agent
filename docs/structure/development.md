# 开发工作流与扩展指南

本文档说明路由结构、命名约定、开发工作流和功能扩展指南。

[← 返回项目结构主页](../PROJECT_STRUCTURE.md)

---

## 路由结构

```
/               → Home (产品介绍)
/chat           → Chat (LLM 聊天)
```

**路由配置在：** `src/app.tsx`

**Layout 布局应用于所有路由**

```typescript
// src/app.tsx
import { Route, Routes } from 'react-router-dom';
import Layout from '@/components/layout/layout';
import Home from '@/pages/home/home';
import Chat from '@/pages/chat/chat';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="chat" element={<Chat />} />
      </Route>
    </Routes>
  );
}
```

---

## 命名约定总结

### 文件命名

🔴 **重要：所有文件统一使用 camelCase 命名（小写开头驼峰）**

| 类型       | 命名格式  | 示例                                 |
| ---------- | --------- | ------------------------------------ |
| 组件文件   | camelCase | `layout.tsx`, `home.tsx`, `chat.tsx` |
| Store 文件 | camelCase | `themeStore.ts`, `rootStore.ts`      |
| 工具文件   | camelCase | `utils.ts`, `api.ts`                 |
| 页面文件夹 | camelCase | `home/`, `chat/`                     |
| 组件文件夹 | camelCase | `layout/`, `ui/`                     |

**注意：** 组件函数名使用 PascalCase（如 `function Layout()`），但文件名使用 camelCase（如 `layout.tsx`）。

### 导入路径

**始终使用 `@/` 别名**

```typescript
import Component from '@/components/Component';
import { useStore } from '@/stores/rootStore';
import { cn } from '@/lib/utils';
```

---

## 开发工作流

### 1. 启动开发服务器

```bash
cd packages/web-app
pnpm dev
```

访问：http://localhost:5173/

### 2. 构建生产版本

```bash
cd packages/web-app
pnpm build
```

构建产物输出到 `dist/` 目录。

### 3. 代码检查

```bash
# 从根目录运行（检查所有包）
pnpm lint

# 自动修复
pnpm lint --fix
```

### 4. 类型检查

```bash
cd packages/web-app
pnpm exec tsc --noEmit
```

### 5. 添加 shadcn/ui 组件

```bash
cd packages/web-app

# 添加单个组件
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add card
pnpm dlx shadcn@latest add dialog

# 查看所有可用组件
pnpm dlx shadcn@latest add
```

---

## 扩展指南

### 添加新页面

1. 在 `src/pages/` 创建新文件夹

```bash
mkdir -p packages/web-app/src/pages/about
```

2. 创建页面组件

```typescript
// src/pages/about/about.tsx
function About() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold">About Page</h1>
      <p className="mt-4">About content here...</p>
    </div>
  );
}

export default About;
```

3. 在 `app.tsx` 添加路由

```typescript
import About from '@/pages/about/about';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="chat" element={<Chat />} />
        <Route path="about" element={<About />} /> {/* 新增 */}
      </Route>
    </Routes>
  );
}
```

4. 在 Layout 导航栏添加链接（可选）

```typescript
// src/components/layout/layout.tsx
<nav className="flex items-center space-x-6">
  <Link to="/">Home</Link>
  <Link to="/chat">Chat</Link>
  <Link to="/about">About</Link> {/* 新增 */}
</nav>
```

---

### 添加新 Store

1. 创建 Store 文件

```typescript
// src/stores/userStore.ts
import { makeAutoObservable } from 'mobx';

export interface User {
  id: string;
  name: string;
  email: string;
}

export class UserStore {
  user: User | null = null;
  isLoading = false;

  constructor() {
    makeAutoObservable(this);
  }

  setUser(user: User) {
    this.user = user;
  }

  clearUser() {
    this.user = null;
  }

  async fetchUser(id: string) {
    this.isLoading = true;
    try {
      // 模拟 API 调用
      const response = await fetch(`/api/users/${id}`);
      const user = await response.json();
      this.setUser(user);
    } finally {
      this.isLoading = false;
    }
  }
}
```

2. 在 `rootStore.ts` 中集成

```typescript
// src/stores/rootStore.ts
import { createContext, useContext } from 'react';
import { ThemeStore } from './themeStore';
import { UserStore } from './userStore'; // 导入

export class RootStore {
  themeStore: ThemeStore;
  userStore: UserStore; // 添加类型

  constructor() {
    this.themeStore = new ThemeStore();
    this.userStore = new UserStore(); // 实例化
  }
}

// useStore 和 Provider 无需修改
```

3. 在组件中使用

```typescript
import { observer } from 'mobx-react-lite';
import { useStore } from '@/stores/rootStore';

const UserProfile = observer(() => {
  const { userStore } = useStore();

  if (userStore.isLoading) {
    return <div>Loading...</div>;
  }

  return <div>{userStore.user?.name}</div>;
});
```

---

### 添加新组件

1. 在适当的目录创建组件

```bash
# UI 组件（shadcn/ui 风格）
packages/web-app/src/components/ui/button.tsx

# 布局组件
packages/web-app/src/components/layout/sidebar.tsx

# 页面特定组件
packages/web-app/src/pages/chat/messageList.tsx
```

2. 使用 Tailwind CSS 编写样式

```typescript
// src/components/ui/button.tsx
import { cn } from '@/lib/utils';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

function Button({ children, variant = 'primary', onClick, disabled, className }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
        variant === 'primary' && 'bg-primary text-primary-foreground hover:bg-primary/90',
        variant === 'secondary' &&
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        variant === 'outline' &&
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        className,
      )}
    >
      {children}
    </button>
  );
}

export default Button;
```

---

### 添加新的工具函数

```typescript
// src/lib/formatting.ts
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US').format(date);
}

export function truncate(str: string, length: number): string {
  return str.length > length ? str.slice(0, length) + '...' : str;
}
```

使用：

```typescript
import { formatDate, truncate } from '@/lib/formatting';
```

---

## 调试技巧

### 1. React DevTools

安装浏览器扩展：

- [Chrome](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
- [Firefox](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/)

### 2. MobX DevTools

```typescript
// 开发环境启用 MobX 日志
import { configure } from 'mobx';

if (process.env.NODE_ENV === 'development') {
  configure({
    enforceActions: 'never',
    computedRequiresReaction: false,
    reactionRequiresObservable: false,
    observableRequiresReaction: false,
  });
}
```

### 3. Vite 热更新

Vite 默认开启 HMR（热模块替换），修改代码后自动刷新。

---

## 相关文档

- [packages/web-app 目录结构](./web-app.md)
- [构建配置与依赖](./configuration.md)
- [编码规范](../rules/CODING_STANDARDS.md)
