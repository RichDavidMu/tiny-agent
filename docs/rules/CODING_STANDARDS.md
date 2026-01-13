# OpenManusWeb 编码规范

本文档是 OpenManusWeb 项目编码规范的主索引。

**🔴 重要：每次更新代码或规范后，必须同步更新本文档和项目结构文档！**

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

## 规范文档索引

### 📝 [文件命名规范与代码风格](./naming-and-style.md)

- 文件和文件夹命名规则（camelCase）
- 导入顺序和路径别名规范
- 组件导出规范

### 🧩 [组件规范与状态管理](./components-and-state.md)

- React 组件结构和命名
- MobX observer 使用规范
- Store 结构和 RootStore 模式

### 🎨 [样式规范与 TypeScript](./styling-and-typescript.md)

- Tailwind CSS 使用规范
- shadcn/ui 设计系统
- TypeScript 类型定义规范

### 🛠️ [开发流程与工作规范](./development-workflow.md)

- 文档维护规范
- Git 提交规范
- 工具配置说明
- 最佳实践和禁止事项

---

## 快速参考

### 文件命名

```
✅ 所有文件使用 camelCase
- layout.tsx
- home.tsx
- themeStore.ts
- rootStore.ts
```

### 导入顺序

```typescript
// 1. Node.js 内置模块
// 2. 第三方库
// 3. @/ 别名（internal）
// 4. 相对路径
```

### 组件结构

```typescript
const Component = observer(() => {
  // 1. Hooks
  // 2. 事件处理
  // 3. 渲染
});
```

### 样式方案

```typescript
// ✅ 只使用 Tailwind CSS
<div className="flex items-center">

// ❌ 禁止其他方案
<div style={{}} />  // 禁止
<div className={styles.xxx} />  // 禁止
```

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

- ✅ 拆分文档为多个子文档（防止上下文过长）
- ✅ 统一所有文件使用 camelCase 命名
- ✅ 更改默认 AI 模型为 Qwen2.5-0.5B-Instruct
- ✅ 增加文档维护规范
- ✅ 增加禁止事项清单
- ✅ 完善 TypeScript 规范
- ✅ 完善样式规范
- ✅ 配置 ESLint：`@/` 开头的路径归类为 internal 导入
- ✅ 完善导入顺序规范，详细说明 6 类导入分组规则

### 初始版本

- ✅ 建立基础编码规范
- ✅ 定义技术栈
- ✅ 定义文件命名规范
