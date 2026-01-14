# 构建配置与依赖说明

本文档详细说明项目的构建配置文件和依赖包。

[← 返回项目结构主页](../PROJECT_STRUCTURE.md)

---

## 构建配置文件

### `vite.config.ts`

```typescript
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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
      '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), './src'),
    },
  },
});
```

**关键配置：**

- React Compiler 插件（性能优化）
- 路径别名 `@` → `./src`
- 使用 `fileURLToPath` 替代 `__dirname`（ESM 兼容）

### `tailwind.config.js`

```javascript
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
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

**关键配置：**

- 暗黑模式：基于 class
- 扫描路径：包含 index.html 和 src 目录
- shadcn/ui 主题色系统

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

### `postcss.config.js`

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

**说明：**

- Tailwind CSS 处理
- Autoprefixer 自动添加浏览器前缀

### `components.json`

shadcn/ui 配置文件。

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "registries": {
    "@prompt-kit": "https://www.prompt-kit.com/c/{name}.json"
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

**说明：**

- 指定 Tailwind 配置路径
- 定义路径别名
- shadcn/ui CLI 使用此配置
- `rsc: false` - 不使用 React Server Components（Vite 项目）
- `registries` - 配置第三方组件注册表

### prompt-kit 注册表

[prompt-kit](https://www.prompt-kit.com/) 是专为 AI 聊天界面设计的 shadcn/ui 组件库，包含 23 个组件：

**UI 组件（21 个）：**

| 组件                | 说明                 |
| ------------------- | -------------------- |
| `prompt-input`      | 聊天输入框           |
| `code-block`        | 代码块（语法高亮）   |
| `markdown`          | Markdown 渲染        |
| `message`           | 聊天消息             |
| `chat-container`    | 聊天容器（自动滚动） |
| `scroll-button`     | 滚动到底部按钮       |
| `loader`            | 加载指示器           |
| `prompt-suggestion` | 提示建议             |
| `response-stream`   | 流式文本输出         |
| `reasoning`         | AI 推理展示          |
| `file-upload`       | 文件上传             |
| `jsx-preview`       | JSX 预览             |
| `tool`              | 工具调用展示         |
| `source`            | 引用来源展示         |
| `image`             | 图片展示             |
| `steps`             | 步骤序列             |
| `system-message`    | 系统消息             |
| `chain-of-thought`  | 思维链展示           |
| `text-shimmer`      | 文字闪烁效果         |
| `thinking-bar`      | AI 思考状态          |
| `feedback-bar`      | 用户反馈             |

**完整示例（2 个）：**

| 组件           | 说明                        |
| -------------- | --------------------------- |
| `chatbot`      | 完整聊天机器人（AI SDK V5） |
| `tool-calling` | 带工具调用的聊天机器人      |

**安装命令：**

```bash
# 安装单个组件
pnpm dlx shadcn@latest add @prompt-kit/message

# 安装多个组件
pnpm dlx shadcn@latest add @prompt-kit/chat-container @prompt-kit/message @prompt-kit/prompt-input

# 查看所有可用组件
pnpm dlx shadcn@latest search @prompt-kit
```

---

## 依赖说明

### 核心依赖 (`dependencies`)

```json
{
  "@mlc-ai/web-llm": "^0.2.80", // 浏览器 LLM 推理引擎
  "class-variance-authority": "^0.7.1", // 变体样式管理（shadcn/ui）
  "clsx": "^2.1.1", // 类名工具
  "lucide-react": "^0.562.0", // 图标库
  "mobx": "^6.15.0", // 状态管理核心
  "mobx-react-lite": "^4.1.1", // MobX React 集成
  "react": "^19.2.0", // React 框架
  "react-dom": "^19.2.0", // React DOM
  "react-router-dom": "^7.12.0", // 路由管理
  "tailwind-merge": "^3.4.0" // Tailwind 类名合并
}
```

**依赖说明：**

- **@mlc-ai/web-llm**: 在浏览器中运行 LLM，无需服务器
- **class-variance-authority**: 管理组件变体样式（shadcn/ui 使用）
- **clsx**: 条件类名拼接
- **lucide-react**: 现代 SVG 图标库
- **mobx**: 响应式状态管理
- **mobx-react-lite**: MobX 与 React 函数组件集成
- **tailwind-merge**: 智能合并 Tailwind 类名，解决冲突

### 开发依赖 (`devDependencies`)

```json
{
  "@types/node": "^24.10.1",
  "@types/react": "^19.2.5",
  "@types/react-dom": "^19.2.3",
  "@vitejs/plugin-react": "^5.1.1", // Vite React 插件
  "autoprefixer": "^10.4.23", // PostCSS 插件
  "babel-plugin-react-compiler": "^1.0.0", // React 编译器
  "postcss": "^8.5.6", // CSS 处理工具
  "tailwindcss": "^3.4.19", // Tailwind CSS v3
  "typescript": "~5.9.3", // TypeScript
  "vite": "^7.2.4" // Vite 构建工具
}
```

**依赖说明：**

- **@vitejs/plugin-react**: 支持 React Fast Refresh 和 JSX
- **autoprefixer**: 自动添加 CSS 浏览器前缀
- **babel-plugin-react-compiler**: React 19 编译器（自动优化性能）
- **postcss**: CSS 预处理工具
- **tailwindcss v3**: 必须使用 v3（v4 与 shadcn/ui 不兼容）
- **vite**: 快速开发构建工具

---

## 版本要求

### 重要版本约束

- **Tailwind CSS**: 必须使用 v3.x（不支持 v4.x）
- **React**: v19.x
- **TypeScript**: v5.9.x
- **Node.js**: >= 24.1.0

---

## 相关文档

- [packages/web-app 目录结构](./web-app.md)
- [开发工作流与扩展指南](./development.md)
