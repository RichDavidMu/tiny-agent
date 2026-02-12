# tiny-agent 编码规范

## 代码风格

### TypeScript/JavaScript

#### 命名规范

- **文件名**: 使用 kebab-case (例如: `session-store.ts`, `mcp-settings-dialog.tsx`)
- **组件名**: 使用 PascalCase (例如: `MySidebar`, `MCPSettingsDialog`)
- **变量/函数**: 使用 camelCase (例如: `handleNewSession`, `sessionStore`)
- **常量**: 使用 UPPER_SNAKE_CASE (例如: `MAX_RETRY_COUNT`)
- **类型/接口**: 使用 PascalCase (例如: `SessionData`, `MCPConfig`)

#### 代码组织

```typescript
// 1. 外部依赖导入
import { observer } from 'mobx-react-lite';
import { Plus, Settings } from 'lucide-react';

// 2. 内部组件/工具导入
import { Button } from '@/components/ui/button';
import rootStore from '@/stores/root-store';

// 3. 类型定义
interface Props {
  // ...
}

// 4. 组件/函数实现
export const MyComponent = observer(() => {
  // ...
});
```

#### React 组件规范

- 优先使用函数组件和 Hooks
- 使用 `observer` 包装需要响应 MobX 状态的组件
- Props 类型定义放在组件定义之前
- 使用解构赋值获取 props

```typescript
interface MyComponentProps {
  title: string;
  onClose: () => void;
}

export const MyComponent = observer(({ title, onClose }: MyComponentProps) => {
  // 组件逻辑
});
```

### CSS/样式

#### Tailwind CSS 使用规范

- 优先使用 Tailwind 工具类
- 按照逻辑顺序组织类名：布局 → 尺寸 → 间距 → 颜色 → 其他
- 使用 `className` 而不是 `class`

```tsx
<div className="flex items-center justify-between px-2 py-3 border-b border-sidebar-border">
  {/* 内容 */}
</div>
```

#### shadcn/ui 组件

- 使用 shadcn/ui 提供的组件作为基础
- 自定义样式通过 Tailwind 类名扩展
- 保持组件的可访问性特性

## 状态管理

### MobX 规范

#### Store 定义

```typescript
import { makeAutoObservable } from 'mobx';

export class SessionStore {
  sessionList: Session[] = [];
  sessionId?: string;

  constructor() {
    makeAutoObservable(this);
  }

  // Actions
  setSessionId(id: string) {
    this.sessionId = id;
  }

  // Computed values
  get currentSession() {
    return this.sessionList.find((s) => s.id === this.sessionId);
  }
}
```

#### 使用 Store

```typescript
import { observer } from 'mobx-react-lite';
import rootStore from '@/stores/root-store';

export const MyComponent = observer(() => {
  const { sessionStore } = rootStore;

  return <div>{sessionStore.sessionId}</div>;
});
```

## 工具和函数

### 纯函数优先

- 优先编写纯函数，避免副作用
- 函数应该单一职责
- 使用 TypeScript 类型确保类型安全

```typescript
// 好的例子
export function formatSessionName(name: string, maxLength: number): string {
  return name.length > maxLength ? `${name.slice(0, maxLength)}...` : name;
}

// 避免
let globalState = '';
export function formatSessionName(name: string) {
  globalState = name; // 副作用
  return name;
}
```

### 异步处理

- 使用 async/await 而不是 Promise 链
- 适当处理错误
- 使用 try-catch 包裹可能失败的操作

```typescript
async function loadSession(id: string): Promise<Session> {
  try {
    const session = await sessionService.getSession(id);
    return session;
  } catch (error) {
    console.error('Failed to load session:', error);
    throw error;
  }
}
```

## 错误处理

### 用户友好的错误提示

```typescript
import { toast } from 'sonner';

try {
  await performAction();
} catch (error) {
  toast.error('操作失败，请重试');
  console.error('Action failed:', error);
}
```

### 防御性编程

```typescript
// 检查必要的条件
if (!sessionId) {
  toast.warning('请先选择一个会话');
  return;
}

// 检查状态
if (stream.loading) {
  toast.info('当前正在处理，请稍候');
  return;
}
```

## 性能优化

### React 性能

- 使用 `useMemo` 缓存计算结果
- 使用 `useCallback` 缓存回调函数
- 避免在渲染函数中创建新对象/数组

```typescript
const memoizedValue = useMemo(() => {
  return expensiveComputation(data);
}, [data]);

const handleClick = useCallback(() => {
  // 处理点击
}, [dependency]);
```

### MobX 性能

- 使用 `computed` 缓存派生值
- 避免在 render 中直接修改 observable
- 使用 `runInAction` 批量更新

```typescript
class Store {
  @computed
  get filteredList() {
    return this.list.filter((item) => item.active);
  }

  updateMultiple() {
    runInAction(() => {
      this.field1 = value1;
      this.field2 = value2;
    });
  }
}
```

## 代码注释

### 何时添加注释

- 复杂的业务逻辑
- 非显而易见的实现细节
- 临时解决方案（使用 TODO/FIXME）
- 公共 API 和接口

```typescript
/**
 * 选择会话并加载相关数据
 * @param sessionId - 会话 ID，undefined 表示创建新会话
 */
export async function selectSession(sessionId?: string) {
  // TODO: 添加会话切换动画
  // FIXME: 处理并发切换的情况
}
```

### 避免无用注释

```typescript
// 不好的例子
// 设置 session id
setSessionId(id);

// 好的例子（代码自解释，无需注释）
setSessionId(id);
```

## 测试规范

### 单元测试

- 测试文件与源文件同目录，使用 `.test.ts` 后缀
- 测试纯函数和工具函数
- 使用描述性的测试名称

```typescript
describe('formatSessionName', () => {
  it('should truncate long names', () => {
    const result = formatSessionName('Very Long Session Name', 10);
    expect(result).toBe('Very Long ...');
  });

  it('should keep short names unchanged', () => {
    const result = formatSessionName('Short', 10);
    expect(result).toBe('Short');
  });
});
```

## Git 提交规范

### Commit Message 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整（不影响功能）
- `refactor`: 重构（不是新功能也不是修复）
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具相关

### 示例

```
feat(chat): add message streaming support

Implement real-time message streaming using WebLLM's
streaming API for better user experience.

Closes #123
```

## 文件组织

### 目录结构规范

```
src/
├── components/          # 可复用组件
│   ├── ui/             # 基础 UI 组件（shadcn/ui）
│   └── chat/           # 业务组件
├── pages/              # 页面组件
├── stores/             # MobX stores
├── hooks/              # 自定义 hooks
├── lib/                # 工具函数
├── types/              # TypeScript 类型定义
└── constants/          # 常量定义
```

### 导入路径

- 使用 `@/` 别名引用 src 目录
- 相对路径仅用于同目录或子目录

```typescript
// 好的例子
import { Button } from '@/components/ui/button';
import { formatDate } from './utils';

// 避免
import { Button } from '../../../components/ui/button';
```

## 类型安全

### 严格的 TypeScript 配置

- 启用 `strict` 模式
- 避免使用 `any`，使用 `unknown` 代替
- 为所有函数参数和返回值添加类型

```typescript
// 好的例子
function processData(data: unknown): ProcessedData {
  if (!isValidData(data)) {
    throw new Error('Invalid data');
  }
  return transformData(data);
}

// 避免
function processData(data: any) {
  return transformData(data);
}
```

### 类型定义

- 共享类型放在 `types/` 目录
- 组件 Props 类型定义在组件文件中
- 使用 `interface` 定义对象类型，`type` 定义联合类型

```typescript
// types/session.ts
export interface Session {
  id: string;
  name: string;
  createdAt: Date;
}

export type SessionStatus = 'active' | 'archived' | 'deleted';
```

## 可访问性 (a11y)

### 基本原则

- 使用语义化 HTML 标签
- 为交互元素添加适当的 ARIA 属性
- 确保键盘可访问性
- 提供足够的颜色对比度

```tsx
<button onClick={handleClick} aria-label="创建新会话" disabled={isLoading}>
  <Plus className="h-4 w-4" />
  <span>新建任务</span>
</button>
```

## 安全性

### 输入验证

- 验证所有用户输入
- 使用 TypeScript 类型系统作为第一道防线
- 对敏感操作进行二次确认

### XSS 防护

- React 默认转义内容
- 避免使用 `dangerouslySetInnerHTML`
- 如必须使用，先进行内容清理

## 代码审查清单

提交代码前检查：

- [ ] 代码符合命名规范
- [ ] 添加了必要的类型定义
- [ ] 处理了可能的错误情况
- [ ] 添加了适当的注释
- [ ] 通过了 ESLint 检查
- [ ] 通过了 Prettier 格式化
- [ ] 测试了主要功能
- [ ] 检查了可访问性
- [ ] 更新了相关文档

## 工具配置

### ESLint

项目使用 ESLint 进行代码检查，配置文件：`eslint.config.js`

### Prettier

项目使用 Prettier 进行代码格式化，配置文件：`.prettierrc`

### Git Hooks

使用 simple-git-hooks 和 lint-staged 在提交前自动检查和格式化代码。

## 持续改进

- 定期审查和更新编码规范
- 从代码审查中学习最佳实践
- 关注社区最新的最佳实践
- 保持文档与代码同步
