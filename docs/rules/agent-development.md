# Agent 开发规范

本文档定义 Agent 核心模块的开发规范和最佳实践。

[← 返回编码规范主页](./CODING_STANDARDS.md)

---

## Agent 架构概览

### 三层架构

```
┌─────────────────────────────────────────────────────────┐
│                      UI 层 (web-app)                     │
│   展示：消息、Plan结构、思考过程、执行状态、最终结果      │
├─────────────────────────────────────────────────────────┤
│                   Agent 层 (agent-core)                  │
│   规划 → 执行 → 反思                                     │
│   暴露给UI层：工具执行结果、step完成状态、思考/反思过程   │
├─────────────────────────────────────────────────────────┤
│                    工具层 (MCP + 内置工具)                │
│   LLM生成、JS执行、MCP远程工具                           │
└─────────────────────────────────────────────────────────┘
```

### 核心模块

| 模块           | 职责               | 文件位置                       |
| -------------- | ------------------ | ------------------------------ |
| Agent          | 入口类，协调各模块 | `src/agent.ts`                 |
| PlanAndRethink | 规划与反思引擎     | `src/planAndRethink/planer.ts` |
| LLM            | WebLLM 封装        | `src/llm/llm.ts`               |
| ToolBase       | 工具定义基类       | `src/tools/toolBase.ts`        |
| ToolCall       | 工具调用抽象类     | `src/tools/toolCall.ts`        |
| MCPClient      | MCP 客户端         | `src/mcp/client.ts`            |
| MCPClientHost  | MCP 服务器管理     | `src/mcp/host.ts`              |

---

## 工具开发规范

### 1. 工具定义（ToolBase）

继承 `ToolBase` 定义工具的 schema（遵循 MCP 标准）。

```typescript
// ✅ 正确示例
class MyToolBase extends ToolBase {
  schema = {
    name: 'my_tool', // 工具名（snake_case）
    description: '工具功能描述', // 清晰的功能说明
    inputSchema: {
      type: 'object',
      properties: {
        param1: {
          type: 'string',
          description: '参数1的说明',
        },
        param2: {
          type: 'number',
          description: '参数2的说明',
        },
      },
      required: ['param1'], // 必填参数
    },
  };
}
```

**规范要求：**

- 工具名使用 `snake_case`
- 描述要清晰准确，LLM 依赖描述理解工具用途
- 参数类型使用 JSON Schema 格式
- 必须声明 `required` 字段

### 2. 工具实现（ToolCall）

继承 `ToolCall` 实现工具的执行逻辑。

```typescript
// ✅ 正确示例
export class MyTool extends ToolCall {
  tool = new MyToolBase();

  async executeTool(toolCall: ToolCallResponse, _tool: ToolBase): Promise<CallToolResult> {
    try {
      // 1. 解析参数
      const args = toolCall.function.arguments;

      // 2. 执行工具逻辑
      const result = await this.doWork(args.param1, args.param2);

      // 3. 返回成功结果
      return {
        content: [{ type: 'text', text: result }],
      };
    } catch (error) {
      // 4. 返回错误结果
      return {
        content: [{ type: 'text', text: error.message }],
        isError: true,
      };
    }
  }

  private async doWork(param1: string, param2?: number): Promise<string> {
    // 实际业务逻辑
    return 'result';
  }
}
```

**规范要求：**

- 必须处理异常，返回 `isError: true`
- 不要在 `executeTool` 中直接 throw
- 结果使用 `content` 数组格式

### 3. 注册工具

在 `PlanAndRethink` 中注册内置工具：

```typescript
// src/planAndRethink/planer.ts
private builtinTools: ToolCall[] = [
  new LLMGenerator(),
  new JavascriptExecutor(),
  new MyTool(),  // 添加新工具
];
```

---

## LLM 使用规范

### 1. 内存管理

WebLLM 模型占用大量 GPU 内存，必须遵循按需加载策略：

```typescript
// ✅ 正确：使用后释放
await toolLLM.reload();
const result = await doSomething();
await toolLLM.unload();

// ❌ 错误：长时间占用
await toolLLM.reload();
// ... 长时间操作 ...
// 忘记 unload
```

### 2. 流式输出

对于长文本生成，必须使用流式输出：

```typescript
// ✅ 正确：使用流式
const result = await llm.askLLM({
  messages: [...],
  stream: true,  // 启用流式
});

// ⚠️ 仅在短文本时禁用流式
const result = await llm.askLLM({
  messages: [...],
  stream: false,
});
```

### 3. 提示词规范

提示词定义在 `prompt.ts` 文件中：

```typescript
// src/llm/prompt.ts
export const SystemPrompt = `
你是一个智能助手...
`;

export const ToolCallSystemPrompt = (tool: string) => `
你需要决定是否调用工具：${tool}
`;
```

**规范要求：**

- 系统提示词使用模板字符串
- 动态内容使用函数生成
- 提示词要简洁明确

---

## MCP 集成规范

### 1. 添加 MCP 服务器

```typescript
// ✅ 正确示例
await agent.mcpHost.addServer({
  name: 'my-server', // 服务器名称
  url: 'https://api.example.com/mcp', // MCP 端点
});

// 刷新工具列表
const tools = agent.mcpHost.getToolCalls();
agent.planer.setMCPTools(tools);
```

### 2. MCP 工具调用

MCP 工具自动适配为 `ToolCall`，无需额外代码：

```typescript
// MCPToolCall 自动处理
// - 参数序列化
// - 请求发送
// - 响应解析
// - 错误处理
```

### 3. CORS 处理

浏览器环境需要通过扩展桥接：

```typescript
// 检测扩展
if (!isExtensionInstalled()) {
  console.warn('MCP Bridge extension not installed');
  // 降级处理或提示用户安装
}

// 使用桥接发送请求
const response = await bridgeFetch(url, options);
```

---

## UI 层数据协议

### 1. 暴露给 UI 层的数据

Agent 核心需要向 UI 层暴露以下信息：

```typescript
// Plan 结构
interface PlanInfo {
  tasks: TaskInfo[];
}

interface TaskInfo {
  task_id: string;
  task_goal: string;
  steps: StepInfo[];
}

interface StepInfo {
  step_id: string;
  step_goal: string;
  tool_name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: ToolResult;
}
```

### 2. 思考过程

```typescript
interface ThinkingInfo {
  step_id: string;
  thinking: string;
  tool_decision: {
    should_call: boolean;
    tool_name?: string;
    arguments?: Record<string, unknown>;
  };
}
```

### 3. 反思过程

```typescript
interface ReflectionInfo {
  step_id: string;
  reflection: string;
  should_retry: boolean;
  retry_reason?: string;
}
```

### 4. Agent 状态

```typescript
type AgentState =
  | 'idle' // 空闲
  | 'planning' // 规划中
  | 'executing' // 执行中
  | 'reflecting' // 反思中
  | 'completed' // 完成
  | 'failed'; // 失败
```

### 5. 事件通知（TODO）

```typescript
// 事件类型
type AgentEvent =
  | { type: 'plan_started'; plan: PlanInfo }
  | { type: 'step_started'; step: StepInfo }
  | { type: 'step_thinking'; thinking: ThinkingInfo }
  | { type: 'step_completed'; step: StepInfo; result: ToolResult }
  | { type: 'step_failed'; step: StepInfo; error: Error }
  | { type: 'plan_completed'; result: string }
  | { type: 'reflection'; reflection: ReflectionInfo };

// 事件监听
interface AgentEventListener {
  onEvent(event: AgentEvent): void;
}
```

---

## 最佳实践

### 1. 错误处理

```typescript
// ✅ 正确：详细的错误信息
return {
  content: [
    {
      type: 'text',
      text: `工具执行失败: ${error.message}\n堆栈: ${error.stack}`,
    },
  ],
  isError: true,
};

// ❌ 错误：模糊的错误信息
return {
  content: [{ type: 'text', text: '出错了' }],
  isError: true,
};
```

### 2. 工具描述

```typescript
// ✅ 正确：详细的描述
description: '搜索网页内容，返回相关结果。支持关键词搜索，返回标题、摘要和链接。';

// ❌ 错误：模糊的描述
description: '搜索工具';
```

### 3. 参数验证

```typescript
// ✅ 正确：验证参数
async executeTool(toolCall: ToolCallResponse): Promise<CallToolResult> {
  const args = toolCall.function.arguments;

  // 验证必填参数
  if (!args.query || typeof args.query !== 'string') {
    return {
      content: [{ type: 'text', text: '参数 query 必须是非空字符串' }],
      isError: true,
    };
  }

  // 继续执行...
}
```

### 4. 日志记录

```typescript
// ✅ 正确：关键步骤记录日志
console.log(`[MyTool] 开始执行: ${JSON.stringify(args)}`);
const result = await this.doWork(args);
console.log(`[MyTool] 执行完成: ${result.length} 条结果`);
```

---

## 禁止事项

### ❌ 绝对禁止

1. **在工具中直接 throw 异常** - 必须捕获并返回错误结果
2. **长时间占用 LLM 不释放** - 必须及时 unload
3. **硬编码 API 密钥** - 使用环境变量或配置
4. **工具名使用 camelCase** - 必须使用 snake_case
5. **忽略 MCP 协议规范** - 必须遵循 MCP 标准

### ⚠️ 避免

1. 过于复杂的工具（拆分为多个小工具）
2. 模糊的工具描述
3. 未验证的参数
4. 缺少错误处理的代码

---

## 相关文档

- [agent-core 核心架构](../structure/agent-core.md)
- [项目结构主页](../PROJECT_STRUCTURE.md)
- [编码规范主页](./CODING_STANDARDS.md)
