# OpenManusWeb 项目结构文档

本文档是 OpenManusWeb 项目结构的主索引。

---

## 项目概览

OpenManusWeb 是一个完全前端驱动的 AI Agent 项目，使用 WebLLM 在浏览器中运行大语言模型，无需服务器资源。

**核心特性：**

- 🚀 完全前端运行，无需后端服务器
- 🧠 使用 WebLLM 在浏览器中运行 Qwen2.5-0.5B 模型
- ⚡ React 19 + Vite 7 + TypeScript 5.9
- 🎨 Tailwind CSS + shadcn/ui 设计系统
- 📦 MobX 状态管理
- 🏗️ Monorepo 架构（pnpm workspaces）

---

## 根目录结构

```
OpenManusWeb/
├── .git/                      # Git 版本控制
├── .idea/                     # IDE 配置（WebStorm/IntelliJ）
├── docs/                      # 项目文档
│   ├── rules/                 # 编码规范（拆分为多个子文档）
│   │   ├── CODING_STANDARDS.md        # 主索引
│   │   ├── naming-and-style.md        # 命名与代码风格
│   │   ├── components-and-state.md    # 组件与状态管理
│   │   ├── styling-and-typescript.md  # 样式与 TypeScript
│   │   └── development-workflow.md    # 开发流程
│   ├── structure/             # 结构说明（拆分为多个子文档）
│   │   ├── web-app.md         # web-app 目录结构
│   │   ├── configuration.md   # 构建配置与依赖
│   │   └── development.md     # 开发工作流
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

## 结构文档索引

### 📁 [packages/web-app 目录结构](./structure/web-app.md)

详细说明 web-app 包的目录结构：

- 完整目录树
- `src/components/` - 可复用组件
- `src/pages/` - 页面组件
- `src/stores/` - MobX 状态管理
- `src/lib/` - 工具函数
- 配置文件说明

### ⚙️ [构建配置与依赖](./structure/configuration.md)

详细说明构建配置和依赖包：

- Vite 配置
- Tailwind CSS 配置
- TypeScript 配置
- PostCSS 配置
- shadcn/ui 配置
- 核心依赖说明
- 开发依赖说明

### 🛠️ [开发工作流与扩展指南](./structure/development.md)

详细说明开发流程和功能扩展：

- 路由结构
- 命名约定
- 开发命令（dev、build、lint）
- 添加新页面
- 添加新 Store
- 添加新组件
- 调试技巧

---

## 快速参考

### 目录组织

```
src/
├── components/   # 可复用组件
├── pages/        # 页面组件（每个页面独立文件夹）
├── stores/       # MobX 状态管理
├── lib/          # 工具函数
├── app.tsx       # 路由配置
├── main.tsx      # 应用入口
└── index.css     # 全局样式
```

### 文件命名

```
✅ 所有文件使用 camelCase
- layout.tsx      # 组件文件
- home.tsx        # 页面文件
- themeStore.ts   # Store 文件
- utils.ts        # 工具文件
```

### 导入路径

```typescript
// 使用 @/ 别名
import Layout from '@/components/layout/layout';
import { useStore } from '@/stores/rootStore';
import { cn } from '@/lib/utils';
```

### 路由结构

```
/         → Home (产品介绍)
/chat     → Chat (LLM 聊天)
```

---

## 技术栈

### 核心框架

- React 19
- TypeScript 5.9
- Vite 7
- React Router Dom 7

### 状态管理

- MobX 6
- mobx-react-lite

### UI 和样式

- Tailwind CSS 3（唯一样式方案）
- shadcn/ui
- lucide-react

### AI 功能

- @mlc-ai/web-llm
- Qwen2.5-0.5B-Instruct 模型（~400MB）

---

## 相关文档

### 编码规范

- [编码规范主页](./rules/CODING_STANDARDS.md)
- [文件命名规范与代码风格](./rules/naming-and-style.md)
- [组件规范与状态管理](./rules/components-and-state.md)
- [样式规范与 TypeScript](./rules/styling-and-typescript.md)
- [开发流程与工作规范](./rules/development-workflow.md)

### 外部资源

- [React 文档](https://react.dev/)
- [MobX 文档](https://mobx.js.org/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
- [shadcn/ui 文档](https://ui.shadcn.com/)
- [Vite 文档](https://vitejs.dev/)
- [WebLLM 文档](https://github.com/mlc-ai/web-llm)

---

## 更新日志

### 2026-01-13

- ✅ 拆分文档为多个子文档（防止上下文过长）
- ✅ 统一所有文件使用 camelCase 命名（小写开头驼峰）
- ✅ 更新所有代码示例和目录树以反映新的命名约定
- ✅ 明确说明：组件函数名使用 PascalCase，文件名使用 camelCase
- ✅ 完善文档结构，添加快速参考部分

### 初始版本

- ✅ 建立项目结构文档
- ✅ 详细说明目录组织
- ✅ 提供配置文件说明
