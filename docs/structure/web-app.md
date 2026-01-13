# packages/web-app 目录结构

本文档详细说明 web-app 包的目录结构和核心文件。

[← 返回项目结构主页](../PROJECT_STRUCTURE.md)

---

## 完整目录树

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

export const useStore = () => {
  /* ... */
};
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

<div className={cn('base-class', isActive && 'active-class', className)}>Content</div>;
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

#### `src/main.tsx`

应用入口，初始化 React 和状态管理。

```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import rootStore, { RootStoreProvider } from '@/stores/rootStore';
import App from './app';
import './index.css';

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

## 相关文档

- [构建配置与依赖](./configuration.md)
- [开发工作流与扩展指南](./development.md)
