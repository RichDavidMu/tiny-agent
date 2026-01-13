# OpenManusWeb 项目结构文档

本文档详细描述了 OpenManusWeb 项目的目录结构和文件组织方式。

## 项目概览

OpenManusWeb 是一个完全前端驱动的 AI Agent 项目，使用 WebLLM 在浏览器中运行大语言模型，无需服务器资源。

---

## 根目录结构

```
OpenManusWeb/
├── .git/                      # Git 版本控制
├── .idea/                     # IDE 配置（WebStorm/IntelliJ）
├── docs/                      # 项目文档
│   ├── rules/                 # 编码规范
│   │   └── CODING_STANDARDS.md
│   └── PROJECT_STRUCTURE.md   # 本文档
├── packages/                  # Monorepo 包目录
│   └── web-app/              # React 前端应用
├── .editorconfig             # 编辑器配置
├── .prettierrc               # Prettier 配置
├── eslint.config.js          # ESLint 配置（根）
├── package.json              # 根项目配置
├── pnpm-workspace.yaml       # pnpm 工作空间配置
├── pnpm-lock.yaml            # 依赖锁定文件
└── README.md                 # 项目说明
```

---

## packages/web-app 结构

### 完整目录树

```
packages/web-app/
├── public/                    # 静态资源
│   └── vite.svg
├── src/                       # 源代码
│   ├── components/            # 可复用组件
│   │   ├── layout/           # 布局组件
│   │   │   └── layout.tsx    # 主布局（Header + Outlet）
│   │   └── ui/               # UI 组件库（shadcn/ui）
│   ├── lib/                  # 工具函数
│   │   └── utils.ts          # cn() 等工具函数
│   ├── pages/                # 页面组件
│   │   ├── home/             # 首页
│   │   │   └── home.tsx
│   │   └── chat/             # 聊天页面
│   │       └── chat.tsx
│   ├── stores/               # MobX 状态管理
│   │   ├── themeStore.ts     # 主题 Store
│   │   └── rootStore.ts      # 根 Store（统一管理）
│   ├── app.tsx               # 应用根组件（路由配置）
│   ├── main.tsx              # 应用入口
│   └── index.css             # 全局样式（Tailwind + 主题变量）
├── components.json            # shadcn/ui 配置
├── index.html                # HTML 入口
├── package.json              # 包配置
├── postcss.config.js         # PostCSS 配置
├── tailwind.config.js        # Tailwind CSS 配置
├── tsconfig.json             # TypeScript 配置（入口）
├── tsconfig.app.json         # 应用 TypeScript 配置
├── tsconfig.node.json        # Node 工具 TypeScript 配置
└── vite.config.ts            # Vite 构建配置
```

---

## 核心目录详解

### 1. `src/components/`

存放可复用的 React 组件。

#### `src/components/layout/`

布局相关组件。

**layout.tsx**

- 应用主布局组件
- 包含：Header（导航栏）、Outlet（页面内容）
- 集成主题切换按钮
- 使用 MobX observer

```typescript
// 示例
import Layout from '@/components/layout/layout';
```

#### `src/components/ui/`

基于 shadcn/ui 的 UI 组件库（按需添加）。

```
ui/
├── button.tsx
├── card.tsx
├── dialog.tsx
└── ...
```

---

### 2. `src/pages/`

页面级组件，每个页面放在独立文件夹中。

#### `src/pages/home/`

**home.tsx**

- 产品介绍页面
- 功能特性展示
- 使用说明
- 技术栈介绍

#### `src/pages/chat/`

**chat.tsx**

- LLM 聊天交互页面
- 集成 @mlc-ai/web-llm
- 模型加载、对话管理
- 消息渲染

---

### 3. `src/stores/`

MobX 状态管理层。

**themeStore.ts**

```typescript
export class ThemeStore {
  theme: Theme = 'dark';

  toggleTheme() {
    /* ... */
  }
  setTheme(theme: Theme) {
    /* ... */
  }
}
```

**rootStore.ts**

```typescript
export class RootStore {
  themeStore: ThemeStore;
  // 其他 stores...

  constructor() {
    this.themeStore = new ThemeStore();
  }
}

export const useStore = () => { /* ... */ };
export const RootStoreProvider = /* ... */;
```

**使用方式：**

```typescript
import { observer } from 'mobx-react-lite';
import { useStore } from '@/stores/rootStore';

const Component = observer(() => {
  const { themeStore } = useStore();
  return <div>{themeStore.theme}</div>;
});
```

---

### 4. `src/lib/`

工具函数库。

**utils.ts**

```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Tailwind 类名合并工具
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**使用方式：**

```typescript
import { cn } from '@/lib/utils';

<div className={cn('base-class', isActive && 'active-class', className)}>
  Content
</div>
```

---

### 5. 配置文件

#### `src/index.css`

全局样式和 shadcn/ui 主题配置。

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    /* 更多主题变量... */
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* 更多主题变量... */
  }
}
```

#### `src/app.tsx`

应用根组件，配置路由。

```typescript
import { Routes, Route } from 'react-router-dom';
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

#### `src/main.tsx`

应用入口，初始化 React 和状态管理。

```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import rootStore, { RootStoreProvider } from '@/stores/rootStore';
import './index.css';
import App from './app';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootStoreProvider value={rootStore}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </RootStoreProvider>
  </StrictMode>,
);
```

---

## 构建配置文件

### `vite.config.ts`

```typescript
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**关键配置：**

- React Compiler 插件（性能优化）
- 路径别名 `@` → `./src`

### `tailwind.config.js`

```javascript
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        // 更多 shadcn/ui 颜色配置...
      },
    },
  },
};
```

### `tsconfig.app.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

**关键配置：**

- 路径别名：`@/*` → `./src/*`
- 严格模式：启用
- 目标：ES2022

### `components.json`

shadcn/ui 配置文件。

```json
{
  "style": "default",
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/index.css",
    "baseColor": "slate"
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui"
  }
}
```

---

## 依赖说明

### 核心依赖 (`dependencies`)

```json
{
  "@mlc-ai/web-llm": "^0.2.80", // 浏览器 LLM 推理
  "class-variance-authority": "^0.7.1", // 变体样式管理
  "clsx": "^2.1.1", // 类名工具
  "lucide-react": "^0.562.0", // 图标库
  "mobx": "^6.15.0", // 状态管理
  "mobx-react-lite": "^4.1.1", // MobX React 集成
  "react": "^19.2.0", // React 框架
  "react-dom": "^19.2.0", // React DOM
  "react-router-dom": "^7.12.0", // 路由管理
  "tailwind-merge": "^3.4.0" // Tailwind 类名合并
}
```

### 开发依赖 (`devDependencies`)

```json
{
  "@types/node": "^24.10.1",
  "@types/react": "^19.2.5",
  "@types/react-dom": "^19.2.3",
  "@vitejs/plugin-react": "^5.1.1",
  "autoprefixer": "^10.4.23", // PostCSS 插件
  "babel-plugin-react-compiler": "^1.0.0",
  "postcss": "^8.5.6", // CSS 处理
  "tailwindcss": "^3.4.19", // Tailwind CSS
  "typescript": "~5.9.3",
  "vite": "^7.2.4"
}
```

---

## 路由结构

```
/               → Home (产品介绍)
/chat           → Chat (LLM 聊天)
```

**路由配置在：** `src/App.tsx`

**Layout 布局应用于所有路由**

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
pnpm build
```

### 3. 代码检查

```bash
pnpm lint
```

### 4. 添加 shadcn/ui 组件

```bash
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add card
```

---

## 扩展指南

### 添加新页面

1. 在 `src/pages/` 创建新文件夹

```bash
mkdir src/pages/about
```

2. 创建页面组件

```typescript
// src/pages/about/about.tsx
function About() {
  return <div>About Page</div>;
}
export default About;
```

3. 在 `app.tsx` 添加路由

```typescript
import About from '@/pages/about/about';

<Route path="about" element={<About />} />
```

### 添加新 Store

1. 创建 Store 文件

```typescript
// src/stores/userStore.ts
import { makeAutoObservable } from 'mobx';

export class UserStore {
  user = null;

  constructor() {
    makeAutoObservable(this);
  }

  setUser(user) {
    this.user = user;
  }
}
```

2. 在 `rootStore.ts` 中集成

```typescript
export class RootStore {
  themeStore: ThemeStore;
  userStore: UserStore;

  constructor() {
    this.themeStore = new ThemeStore();
    this.userStore = new UserStore(); // 添加这里
  }
}
```

### 添加新组件

1. 在适当的目录创建组件

```bash
# UI 组件
src/components/ui/button.tsx

# 布局组件
src/components/layout/sidebar.tsx

# 页面特定组件
src/pages/chat/messageList.tsx
```

2. 使用 Tailwind CSS 编写样式

```typescript
function Button({ children, variant = 'primary' }) {
  return (
    <button className={cn(
      'px-4 py-2 rounded-md font-medium',
      variant === 'primary' && 'bg-primary text-primary-foreground'
    )}>
      {children}
    </button>
  );
}
```

---

## 参考文档

- [编码规范](./rules/CODING_STANDARDS.md)
- [React 文档](https://react.dev/)
- [MobX 文档](https://mobx.js.org/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
- [shadcn/ui 文档](https://ui.shadcn.com/)

---

## 更新日志

### 2026-01-13

- 统一所有文件使用 camelCase 命名（小写开头驼峰）
- 更新所有代码示例和目录树以反映新的命名约定
- 明确说明：组件函数名使用 PascalCase，文件名使用 camelCase
