# 组件规范与状态管理

本文档定义 React 组件编写规范和 MobX 状态管理模式。

[← 返回编码规范主页](./CODING_STANDARDS.md)

---

## 组件规范

### 1. 组件结构

```typescript
import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/stores/rootStore';
import { cn } from '@/lib/utils';

// 类型定义
interface Props {
  title: string;
  onClose?: () => void;
}

// 组件定义
const MyComponent = observer(({ title, onClose }: Props) => {
  // 1. Hooks
  const { themeStore } = useStore();
  const [isOpen, setIsOpen] = useState(false);

  // 2. 事件处理函数
  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  // 3. 渲染
  return (
    <div className="flex items-center space-x-4">
      <h2 className="text-2xl font-bold">{title}</h2>
      <button onClick={handleClick} className="btn">
        Toggle
      </button>
    </div>
  );
});

export default MyComponent;
```

### 2. MobX 组件观察

**需要响应 MobX store 变化的组件必须使用 `observer`**

```typescript
✅ 正确：
const Header = observer(() => {
  const { themeStore } = useStore();
  return <div>{themeStore.theme}</div>;
});

❌ 错误（不会响应变化）：
const Header = () => {
  const { themeStore } = useStore();
  return <div>{themeStore.theme}</div>;
};
```

### 3. 函数组件命名

**组件函数名使用 PascalCase，但文件名使用 camelCase**

```typescript
// 文件：components/layout/layout.tsx
function Layout() {  // ✅ 函数名用 PascalCase
  return <div>Layout</div>;
}
export default Layout;

// 文件：pages/home/home.tsx
function Home() {  // ✅ 函数名用 PascalCase
  return <div>Home</div>;
}
export default Home;
```

---

## 状态管理

### 1. MobX Store 结构

```typescript
import { makeAutoObservable } from 'mobx';

export class MyStore {
  // 可观察状态
  count = 0;
  name = '';

  constructor() {
    makeAutoObservable(this);
  }

  // Actions (修改状态的方法)
  increment() {
    this.count++;
  }

  setName(name: string) {
    this.name = name;
  }

  // Computed values (派生状态)
  get doubleCount() {
    return this.count * 2;
  }

  // Private 方法
  private validate() {
    return this.name.length > 0;
  }
}
```

### 2. RootStore 模式

**所有 stores 通过 RootStore 统一管理**

```typescript
// stores/rootStore.ts
import { createContext, useContext } from 'react';
import { ThemeStore } from './themeStore';
import { UserStore } from './userStore';

export class RootStore {
  themeStore: ThemeStore;
  userStore: UserStore;

  constructor() {
    this.themeStore = new ThemeStore();
    this.userStore = new UserStore();
  }
}

const rootStore = new RootStore();
const RootStoreContext = createContext<RootStore>(rootStore);

export const useStore = () => {
  const context = useContext(RootStoreContext);
  if (!context) {
    throw new Error('useStore must be used within RootStoreProvider');
  }
  return context;
};

export const RootStoreProvider = RootStoreContext.Provider;
export default rootStore;
```

### 3. Store 使用规范

```typescript
// ✅ 正确：在组件中使用
const MyComponent = observer(() => {
  const { themeStore, userStore } = useStore();

  const handleToggle = () => {
    themeStore.toggleTheme();
  };

  return <div onClick={handleToggle}>{themeStore.theme}</div>;
});

// ❌ 错误：直接导入 store 实例
import rootStore from '@/stores/rootStore';
const theme = rootStore.themeStore.theme; // ❌ 不推荐
```

---

## 相关文档

- [文件命名规范与代码风格](./naming-and-style.md)
- [样式规范与 TypeScript](./styling-and-typescript.md)
- [开发流程与工作规范](./development-workflow.md)
