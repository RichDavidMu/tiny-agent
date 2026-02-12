# tiny-agent 项目结构文档

## 项目概述

**tiny-agent** 是一个完全前端驱动的 AI Agent 项目，无需服务器资源。它是一个基于浏览器的 AI 助手，使用 WebLLM 技术完全在客户端浏览器中运行。

## 技术栈

- **前端框架**: React 19 + TypeScript + Vite
- **UI 组件**: Radix UI + Tailwind CSS + shadcn/ui
- **状态管理**: MobX
- **AI/LLM**: @mlc-ai/web-llm (浏览器端 LLM 推理)
- **包管理器**: pnpm (workspace monorepo)
- **构建工具**: Vite with React Compiler

## Monorepo 结构

项目采用 **pnpm workspace monorepo** 架构，包含 5 个主要包：

```
tiny-agent/
├── packages/
│   ├── web-app/              # 主 Web 应用
│   ├── agent-core/           # 核心 AI Agent 逻辑
│   ├── mcp-bridge-extension/ # 浏览器扩展（MCP 桥接）
│   ├── web-llm/              # WebLLM 自定义版本
│   └── utils/                # 共享工具库
├── docs/                     # 项目文档
├── package.json              # 根配置
├── pnpm-workspace.yaml       # Workspace 配置
└── .mcp.json                 # MCP 服务器配置
```

## 包详细说明

### 1. packages/web-app

主 Web 应用，使用 React + Vite 构建。

**目录结构**:

```
web-app/
├── src/
│   ├── components/          # UI 组件
│   │   ├── chat/           # 聊天相关组件
│   │   ├── ui/             # shadcn/ui 组件
│   │   └── mcp-settings-dialog/ # MCP 设置对话框
│   ├── pages/              # 应用页面
│   │   ├── home/           # 首页
│   │   └── chat/           # 聊天页面
│   ├── stores/             # MobX 状态管理
│   ├── hooks/              # React Hooks
│   ├── lib/                # 工具函数
│   ├── stream/             # 流式处理
│   └── App.tsx             # 应用入口
├── public/                 # 静态资源
└── vite.config.ts          # Vite 配置
```

**主要功能**:

- 聊天界面和交互
- Session 管理
- MCP 设置界面
- 响应式布局

### 2. packages/agent-core

核心 AI Agent 逻辑和编排。

**目录结构**:

```
agent-core/
├── src/
│   ├── core/               # 核心逻辑
│   │   ├── controller.ts   # 控制器
│   │   ├── state-machine.ts # 状态机
│   │   ├── tool-actor.ts   # 工具执行器
│   │   └── policy/         # 策略管理
│   ├── llm/                # LLM 集成
│   │   ├── prompt/         # 提示词处理
│   │   └── llm-client.ts   # LLM 客户端
│   ├── mcp/                # Model Context Protocol
│   │   ├── bridge/         # MCP 桥接
│   │   ├── client/         # MCP 客户端
│   │   └── host/           # MCP 主机
│   ├── tools/              # 内置工具
│   │   ├── code-expert/    # 代码专家工具
│   │   ├── js-executor/    # JavaScript 执行器
│   │   └── writing-expert/ # 写作专家工具
│   ├── storage/            # 数据持久化
│   └── service/            # 服务层
└── package.json
```

**核心概念**:

- **Controller**: 协调整个 Agent 的执行流程
- **State Machine**: 管理 Agent 的状态转换
- **Tool Actor**: 执行各种工具调用
- **MCP Integration**: 支持 Model Context Protocol 扩展

### 3. packages/mcp-bridge-extension

浏览器扩展，用于桥接 MCP 连接并绕过 CORS 限制。

**目录结构**:

```
mcp-bridge-extension/
├── src/
│   ├── background.ts       # 扩展后台脚本
│   ├── content.ts          # 内容脚本
│   └── page-bridge.ts      # 页面级桥接
├── manifest.json           # 扩展清单
└── package.json
```

**功能**:

- 使 Web 应用能够与 MCP 服务器通信
- 绕过浏览器 CORS 限制
- 提供安全的消息传递机制

### 4. packages/web-llm

自定义的 @mlc-ai/web-llm 版本，用于浏览器端 LLM 推理。

**功能**:

- 使用 WebGPU 在浏览器中运行大型语言模型
- 提供高性能的本地推理能力
- 支持模型缓存和加载

### 5. packages/utils

共享工具包，包含调试工具和通用函数。

## 关键配置文件

### package.json (根目录)

- 定义 workspace 脚本
- ESLint、Prettier 配置
- Git hooks 配置（simple-git-hooks + lint-staged）

### pnpm-workspace.yaml

```yaml
packages:
  - 'packages/*'
```

### .mcp.json

MCP 服务器配置，定义可用的 MCP 服务器。

### eslint.config.js

整个 workspace 的 ESLint 配置。

### .prettierrc

代码格式化规则。

## 架构特点

### 1. 完全客户端化

- 无需后端服务器
- 所有 AI 处理在浏览器中完成
- 数据完全本地化，保护隐私

### 2. MCP 集成

- 支持 Model Context Protocol
- 可扩展的工具集成
- 通过浏览器扩展桥接实现

### 3. 模块化设计

- UI (web-app) 与核心逻辑 (agent-core) 分离
- 清晰的职责划分
- 易于维护和扩展

### 4. 内置工具

- **Code Expert**: 代码分析和生成
- **JavaScript Executor**: 执行 JavaScript 代码
- **Writing Expert**: 写作辅助

## 开发流程

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
# 启动 web-app
cd packages/web-app
pnpm dev

# 构建扩展
cd packages/mcp-bridge-extension
pnpm build
```

### 代码质量

- **ESLint**: 代码检查
- **Prettier**: 代码格式化
- **Git Hooks**: 提交前自动检查和格式化

### 提交规范

项目使用 simple-git-hooks 和 lint-staged 确保代码质量：

- 提交前自动运行 Prettier 格式化
- 自动运行 ESLint 检查和修复

## 数据流

```
用户输入 → Web App (React)
    ↓
Session Store (MobX)
    ↓
Agent Core Controller
    ↓
LLM Client (WebLLM) ← → Tool Actor
    ↓                      ↓
State Machine          MCP Bridge
    ↓                      ↓
响应流式输出 ← ← ← ← ← MCP Tools
    ↓
UI 更新
```

## 存储机制

- **Session 数据**: 存储在浏览器 IndexedDB
- **模型缓存**: 存储在浏览器 Cache API
- **配置数据**: 存储在 localStorage

## 性能优化

1. **WebGPU 加速**: 使用 WebGPU 进行模型推理
2. **模型缓存**: 首次下载后缓存模型文件
3. **流式输出**: 实时显示 LLM 生成结果
4. **代码分割**: Vite 自动进行代码分割
5. **React Compiler**: 使用 React 19 编译器优化

## 浏览器兼容性

- **必需**: 支持 WebGPU 的现代浏览器
- **推荐**: Chrome/Edge 113+, Firefox 115+
- **不支持**: Safari (WebGPU 支持有限)

## 许可证

Apache-2.0
