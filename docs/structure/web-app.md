# packages/web-app 目录结构

本文档详细说明 web-app 包的目录结构和核心文件。

[← 返回项目结构主页](../PROJECT_STRUCTURE.md)

---

## 完整目录树

```
packages/web-app/
├── public/                        # 静态资源
│   └── vite.svg
├── src/                           # 源代码
│   ├── components/                # 可复用组件
│   │   ├── layout/               # 布局组件
│   │   │   └── layout.tsx        # 主布局（Header + Outlet）
│   │   ├── chat/                 # 聊天相关组件
│   │   │   └── components/
│   │   │       ├── content/      # 消息展示区
│   │   │       │   ├── content.tsx
│   │   │       │   └── components/
│   │   │       │       └── footer/
│   │   │       │           └── footer.tsx
│   │   │       └── sidebar/      # 侧边栏
│   │   │           └── sidebar.tsx
│   │   └── ui/                   # UI 组件库（shadcn/ui + prompt-kit）
│   ├── lib/                      # 工具函数
│   │   ├── utils.ts              # cn() 等工具函数
│   │   └── async.ts              # 异步工具（createTask）
│   ├── pages/                    # 页面组件
│   │   ├── home/                 # 首页
│   │   │   └── home.tsx
│   │   └── chat/                 # 聊天页面
│   │       └── chat.tsx
│   ├── stores/                   # MobX 状态管理
│   │   ├── themeStore.ts         # 主题 Store
│   │   ├── inputStore.ts         # 输入/聊天状态（集成 Agent）
│   │   └── rootStore.ts          # 根 Store（统一管理）
│   ├── app.tsx                   # 应用根组件（路由配置）
│   ├── main.tsx                  # 应用入口
│   └── index.css                 # 全局样式（Tailwind + 主题变量）
├── components.json                # shadcn/ui 配置
├── index.html                    # HTML 入口
├── package.json                  # 包配置
├── tsconfig.json                 # TypeScript 配置（入口）
├── tsconfig.app.json             # 应用 TypeScript 配置
├── tsconfig.node.json            # Node 工具 TypeScript 配置
└── vite.config.ts                # Vite 构建配置
```

---

## 核心目录详解

### 1. `src/components/`

存放可复用的 React 组件。

#### `src/components/layout/`

布局相关组件。

**layout.tsx**

- 应用主布局组件
- 包含：Toaster（通知提示）、Outlet（页面内容）
- 使用 MobX observer

```typescript
// 示例
import Layout from '@/components/layout/layout';
```

#### `src/components/chat/`

聊天功能相关组件。

**content.tsx** - 消息展示区

- 显示聊天消息列表
- 展示 Agent 执行状态
- 加载指示器

**footer.tsx** - 输入区域

- PromptInput 组件
- 发送按钮
- 加载状态显示

#### `src/components/ui/`

基于 shadcn/ui 和 prompt-kit 的 UI 组件库（按需添加）。

```
ui/
├── button.tsx          # 按钮
├── card.tsx            # 卡片
├── dialog.tsx          # 对话框
├── input.tsx           # 输入框
├── textarea.tsx        # 多行输入
├── sidebar.tsx         # 侧边栏
├── message.tsx         # 消息组件（prompt-kit）
├── loader.tsx          # 加载指示器（prompt-kit）
├── prompt-input.tsx    # 聊天输入框（prompt-kit）
├── markdown.tsx        # Markdown 渲染（prompt-kit）
├── code-block.tsx      # 代码块（prompt-kit）
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
- 集成 Agent 核心
- 消息展示
- 侧边栏（对话历史）

```typescript
const Chat = observer(() => {
  return (
    <SidebarProvider>
      <Sidebar />
      <Content />
    </SidebarProvider>
  );
});
```

---

### 3. `src/stores/`

MobX 状态管理层，与 Agent 核心集成。

#### inputStore.ts（核心：与 Agent 集成）

```typescript
import { Agent } from '@anthropic/agent-core';
import { createTask } from '@/lib/async';

export class InputStore {
  input: string = '';
  messages: ChatMessage[] = [];
  agent = new Agent(); // Agent 核心实例
  loading = false;

  constructor() {
    makeAutoObservable(this);
  }

  setInput(text: string) {
    this.input = text;
  }

  async handleSend() {
    if (!this.input.trim() || this.loading) return;

    // 1. 等待 LLM 模型加载就绪
    const [ready, resolve] = createTask<boolean>();
    const timer = setInterval(() => {
      if (this.agent.llm.ready) {
        resolve(true);
        clearInterval(timer);
      }
    }, 1000);
    await ready;

    // 2. 添加用户消息
    const userMessage: ChatMessage = {
      role: 'user',
      content: this.input,
    };
    this.messages.push(userMessage);

    // 3. 调用 Agent 规划器执行任务
    this.loading = true;
    const plan = await this.agent.planer.plan(this.input);

    // 4. 添加 Agent 响应
    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: plan,
    };
    this.messages.push(assistantMessage);

    this.loading = false;
    this.input = '';
  }
}
```

#### themeStore.ts

```typescript
export class ThemeStore {
  theme: Theme = 'dark';

  constructor() {
    makeAutoObservable(this);
    this.loadTheme();
  }

  private loadTheme() {
    const saved = localStorage.getItem('theme') as Theme;
    if (saved) this.theme = saved;
    this.applyTheme();
  }

  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', this.theme);
    this.applyTheme();
  }

  private applyTheme() {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(this.theme);
  }
}
```

#### rootStore.ts

```typescript
export class RootStore {
  themeStore: ThemeStore;
  inputStore: InputStore;

  constructor() {
    this.themeStore = new ThemeStore();
    this.inputStore = new InputStore();
  }
}

const rootStore = new RootStore();
const RootStoreContext = createContext<RootStore>(rootStore);

export const useStore = () => {
  return useContext(RootStoreContext);
};

export const RootStoreProvider = RootStoreContext.Provider;
export default rootStore;
```

---

### 4. `src/lib/`

工具函数库。

#### utils.ts

```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Tailwind 类名合并工具
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

#### async.ts

```typescript
// 创建可外部 resolve 的 Promise
export function createTask<T>(): [Promise<T>, (value: T) => void] {
  let resolve: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return [promise, resolve!];
}
```

---

### 5. 配置文件

#### `src/index.css`

全局样式和主题配置（Tailwind CSS v4 CSS-first）。

```css
@import 'tailwindcss';
@import 'tw-animate-css';

@custom-variant dark (&:is(.dark *));

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  /* 更多主题变量... */
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  /* 暗色主题变量... */
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  /* 映射到 Tailwind 颜色... */
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

## UI 层需要展示的 Agent 信息

UI 层需要从 Agent 核心获取并展示以下信息：

### 1. 消息列表

```typescript
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
```

### 2. Plan 结构（TODO: 增强展示）

```typescript
interface PlanDisplay {
  tasks: {
    task_id: string;
    task_goal: string;
    steps: StepDisplay[];
  }[];
}

interface StepDisplay {
  step_id: string;
  step_goal: string;
  tool_name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
}
```

### 3. 思考过程（TODO: 增强展示）

```typescript
interface ThinkingDisplay {
  step_id: string;
  thinking: string;
  tool_decision: string;
}
```

### 4. 工具执行结果（TODO: 增强展示）

```typescript
interface ToolResultDisplay {
  step_id: string;
  tool_name: string;
  result: string;
  isError: boolean;
}
```

### 5. Agent 状态

```typescript
type AgentStatus = 'idle' | 'planning' | 'executing' | 'completed' | 'failed';
```

---

## 组件状态流

```
用户输入
    ↓
Footer (PromptInput)
    ↓ inputStore.setInput()
InputStore.input
    ↓ inputStore.handleSend()
Agent.task()
    ↓
InputStore.messages += userMessage
InputStore.loading = true
    ↓
Agent.planer.plan()
    ↓
InputStore.messages += assistantMessage
InputStore.loading = false
    ↓
Content (observer)
    ↓ 自动重渲染
显示更新的消息列表
```

---

## 相关文档

- [agent-core 核心架构](./agent-core.md)
- [构建配置与依赖](./configuration.md)
- [开发工作流与扩展指南](./development.md)
