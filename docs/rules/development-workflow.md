# 开发流程与工作规范

本文档定义文档维护、Git 提交、工具配置和开发最佳实践。

[← 返回编码规范主页](./CODING_STANDARDS.md)

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
| 命名规范    | `naming-and-style.md` + `PROJECT_STRUCTURE.md` |
| 目录结构    | `PROJECT_STRUCTURE.md`                         |
| 编码规则    | 相应的规范文档                                 |
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

## 相关文档

- [文件命名规范与代码风格](./naming-and-style.md)
- [组件规范与状态管理](./components-and-state.md)
- [样式规范与 TypeScript](./styling-and-typescript.md)
