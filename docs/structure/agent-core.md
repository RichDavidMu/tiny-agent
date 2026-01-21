# Agent Core 核心架构

本文档详细说明 agent-core 包的架构设计和核心模块。

[← 返回项目结构主页](../PROJECT_STRUCTURE.md)

---

## 目录结构

```
packages/agent-core/
├── src/
│   ├── agent.ts                  # Agent 主类（规划/执行入口）
│   ├── index.ts                  # 导出接口
│   ├── llm/                      # LLM 模块
│   │   ├── llm.ts               # LLM 引擎（WebLLM 封装）
│   │   ├── schema.ts            # 类型定义（ToolChoice, AgentState）
│   │   ├── prompt.ts            # LLM 提示词模板
│   │   └── exceptions.ts        # 异常定义
│   ├── planAndRethink/          # 规划与反思模块
│   │   ├── planer.ts            # 规划执行器
│   │   └── prompt.ts            # 规划提示词
│   ├── tools/                   # 工具框架
│   │   ├── toolBase.ts          # 工具基类
│   │   ├── toolCall.ts          # 工具调用抽象类
│   │   ├── llmGenerator.ts      # LLM 生成工具
│   │   └── javascriptExecutor.ts # JS 执行工具
│   ├── mcp/                     # MCP 客户端
│   │   ├── client.ts            # MCP 客户端实现
│   │   ├── host.ts              # MCP 服务器管理器
│   │   ├── bridge.ts            # 浏览器扩展桥接
│   │   ├── toolWrapper.ts       # MCP 工具适配器
│   │   ├── types.ts             # MCP 类型定义
│   │   └── index.ts             # MCP 导出
│   └── types/
│       ├── planer.ts            # 规划 Schema 类型
│       ├── llm.ts               # LLM 类型定义
│       └── agentProtocol.ts     # Agent 协议类型
└── package.json
```

---

## 核心概念

### Agent 执行流程

```
┌─────────────────────────────────────────────────────────────┐
│                        Agent.task(input)                     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   PlanAndRethink.plan(input)                 │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  1. 构建工具列表                                         ││
│  │  2. LLM 分析任务 → 生成规划                              ││
│  │  3. 解析 <plan>JSON</plan>                               ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      执行 Steps 循环                         │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  FOR EACH step in plan.tasks[0].steps:                   ││
│  │    ├─ toolLLM.reload()                                   ││
│  │    ├─ tool = findTool(step.tool_name)                    ││
│  │    ├─ result = tool.step(step.step_goal)                 ││
│  │    │   ├─ THINK: LLM 决策工具调用参数                    ││
│  │    │   └─ ACT: 执行工具，返回结果                        ││
│  │    └─ toolLLM.unload()                                   ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                       返回执行结果                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Agent 主类

**文件**: `src/agent.ts`

Agent 是整个系统的入口点，负责初始化和协调各模块。

```typescript
export class Agent {
  llm = planLLM; // 规划用 LLM 实例
  planer = new PlanAndRethink(); // 规划执行器
  mcpHost = new MCPClientHost(); // MCP 服务器管理

  // 初始化 Agent
  async init() {
    await this.initMcp();
  }

  // 初始化 MCP 服务
  async initMcp() {
    await this.mcpHost.addServer({
      name: 'ddgs-search',
      url: 'https://renbaicai.site/ddgs/mcp',
    });
    const tools = this.mcpHost.getToolCalls();
    this.planer.setMCPTools(tools);
  }

  // 执行任务
  async task(input: string) {
    return await this.planer.plan(input);
  }
}
```

### Agent 生命周期

1. **初始化**: `agent.init()` → 加载 MCP 服务器
2. **任务执行**: `agent.task(input)` → 规划并执行
3. **资源释放**: LLM 在每个 step 后自动 unload

---

## 规划与反思模块 (PlanAndRethink)

**文件**: `src/planAndRethink/planer.ts`

### 核心类设计

```typescript
export class PlanAndRethink {
  step: number = 0;
  llm: LLM = planLLM;
  plans: PlanSchema | null = null;

  // 内置工具
  private builtinTools: ToolCall[] = [
    new LLMGenerator(), // 大模型生成工具
    new JavascriptExecutor(), // JS 代码执行工具
  ];

  // MCP 外部工具
  private mcpTools: ToolCall[] = [];

  // 所有可用工具
  get tools(): ToolCall[] {
    return [...this.builtinTools, ...this.mcpTools];
  }

  // 设置 MCP 工具
  setMCPTools(tools: ToolCall[]) {
    this.mcpTools = tools;
  }
}
```

### 规划算法 (plan 方法)

```typescript
async plan(input: string): Promise<string> {
  // 1. 构建可用工具列表
  const availableTools = this.tools
    .map((t) => `- ${t.tool.name}: ${t.tool.description}`)
    .join('\n');

  // 2. 调用 LLM 进行规划
  const res = await this.llm.askLLM({
    messages: [
      { role: 'system', content: SystemPrompt },
      { role: 'user', content: PlanPrompt(input, availableTools) },
    ],
  });

  // 3. 解析 LLM 返回的 <plan>JSON</plan>
  const plantext = /<plan>\s*([\s\S]*?)\s*<\/plan>/.exec(res)?.[1];
  this.plans = JSON.parse(plantext);

  // 4. 执行所有步骤
  for (const step of this.plans.tasks[0].steps) {
    await toolLLM.reload();
    const tool = this.tools.find(t => t.tool.name === step.tool_name)!;
    const result = await tool.step(step.step_goal);
    console.log('工具调用结果\n', result);
    await toolLLM.unload();
  }

  return res;
}
```

### PlanSchema 类型

**文件**: `src/types/planer.ts`

```typescript
export interface PlanSchema {
  tasks: {
    task_id: string;
    task_goal: string;
    steps: StepSchema[];
  }[];
}

export interface StepSchema {
  step_id: string;
  step_goal: string;
  tool_name: string; // 要调用的工具名
  tool_intent: string; // 工具调用意图
  expected_output: string; // 预期输出
}
```

---

## LLM 模块

**文件**: `src/llm/llm.ts`

### LLM 类核心功能

```typescript
export class LLM {
  model_id: string = 'Qwen3-4B-q4f16_1-MLC';
  client: MLCEngine | null = null;
  ready = false;
  progressText = '';

  // 1. 加载模型
  async load(): Promise<void> {
    this.client = await CreateMLCEngine(
      this.model_id,
      {
        initProgressCallback: (progress) => {
          this.progressText = progress.text;
        },
      },
      { context_window_size: 32768 },
    );
    await this.unload();
    this.ready = true;
  }

  // 2. 重新加载（执行工具前调用）
  async reload(): Promise<void> {
    await this.client.reload(this.model_id);
  }

  // 3. 卸载（执行工具后释放内存）
  async unload(): Promise<void> {
    await this.client.unload();
  }

  // 4. 对话 API
  async askLLM({ messages, stream = true }): Promise<string> {
    await this.reload();
    const response = await this.client.chat.completions.create({
      messages,
      stream,
    });
    // 处理流式响应...
    await this.unload();
    return fullResponse;
  }

  // 5. 工具调用决策
  async toolCall({ task, tool }): Promise<ToolCallResponse> {
    const messages = [
      { role: 'system', content: ToolCallSystemPrompt(JSON.stringify(tool)) },
      { role: 'user', content: ToolCallUserPrompt(task) },
    ];
    const response = await this.client.chat.completions.create({ messages });
    return JSON.parse(toolCall);
  }
}

// 全局实例
export const planLLM = new LLM();
export const toolLLM = planLLM;
```

### 内存管理策略

WebLLM 模型占用大量 GPU 内存，采用按需加载策略：

1. **初始化时**: 加载模型后立即 unload
2. **执行工具前**: reload 加载模型
3. **执行工具后**: unload 释放内存
4. **规划时**: askLLM 内部自动管理

---

## 工具框架

### ToolBase（工具基类）

**文件**: `src/tools/toolBase.ts`

```typescript
abstract class ToolBase {
  // MCP 标准工具定义
  abstract schema: Tool;

  get name(): string {
    return this.schema.name;
  }

  get description(): string {
    return this.schema.description || '';
  }

  // 转换为 LLM 可用的格式
  toParams(): ChatCompletionTool {
    return {
      type: 'function',
      function: {
        name: this.schema.name,
        description: this.schema.description,
        parameters: this.schema.inputSchema,
      },
    };
  }
}
```

### ToolCall（工具调用抽象类）

**文件**: `src/tools/toolCall.ts`

```typescript
export abstract class ToolCall {
  abstract tool: ToolBase;
  llm: LLM = toolLLM;
  toolCall: ToolCallResponse | null = null;

  // 执行步骤：思考 → 行动
  async step(task: string): Promise<CallToolResult> {
    const shouldAct = await this.think(task);
    if (shouldAct) {
      return await this.act(this.toolCall!);
    }
    return [];
  }

  // 思考：让 LLM 决策工具调用参数
  private async think(task: string): Promise<boolean> {
    const toolCall = await this.llm.toolCall({
      task,
      tool: this.tool.toParams(),
    });
    this.toolCall = toolCall;
    return true;
  }

  // 行动：执行工具
  private async act(toolCall: ToolCallResponse): Promise<CallToolResult> {
    return await this.executeTool(toolCall, this.tool);
  }

  // 具体执行逻辑（由子类实现）
  abstract executeTool(toolCall: ToolCallResponse, tool: ToolBase): Promise<CallToolResult>;
}
```

### 内置工具

#### LLMGenerator（LLM 生成工具）

**文件**: `src/tools/llmGenerator.ts`

```typescript
class LLMGeneratorTool extends ToolBase {
  schema = {
    name: 'llm_generator',
    description: '使用大模型生成自然语言、总结文本、翻译文本等',
    inputSchema: {
      type: 'object',
      properties: {
        task: { type: 'string', description: '任务描述' },
      },
      required: ['task'],
    },
  };
}

export class LLMGenerator extends ToolCall {
  tool = new LLMGeneratorTool();

  async executeTool(toolCall: ToolCallResponse): Promise<CallToolResult> {
    const args = toolCall.function.arguments;
    const res = await this.llm.askLLM({
      messages: [{ role: 'user', content: args.task }],
      stream: true,
    });
    return {
      content: [{ type: 'text', text: res }],
    };
  }
}
```

#### JavascriptExecutor（JS 执行工具）

**文件**: `src/tools/javascriptExecutor.ts`

```typescript
class JSExecuteTool extends ToolBase {
  schema = {
    name: 'javascript_execute',
    description: '执行一段 JavaScript 代码，并返回运行结果',
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: '需要执行的代码' },
      },
      required: ['code'],
    },
  };
}

export class JavascriptExecutor extends ToolCall {
  tool = new JSExecuteTool();

  async executeTool(toolCall: ToolCallResponse): Promise<CallToolResult> {
    try {
      const args = toolCall.function.arguments;
      const fn = new Function(args.code);
      const result = Promise.resolve(fn());
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: error.message }],
        isError: true,
      };
    }
  }
}
```

---

## MCP 集成

### MCPClient（MCP 客户端）

**文件**: `src/mcp/client.ts`

```typescript
export class MCPClient {
  private serverConfig: MCPServerConfig;
  private _tools: Tool[] = [];
  private connected: boolean = false;
  private sessionId: string | null = null;

  // 连接 MCP 服务器
  async connect(): Promise<void> {
    // 1. 发送 initialize 请求
    const initResult = await this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {} },
      clientInfo: this.options,
    });

    // 2. 发送 initialized 通知
    await this.sendNotification('notifications/initialized');

    // 3. 获取工具列表
    this.connected = true;
    await this.refreshTools();
  }

  // 获取工具列表
  async refreshTools(): Promise<Tool[]> {
    const response = await this.sendRequest<{ tools: Tool[] }>('tools/list');
    this._tools = response.tools;
    return this._tools;
  }

  // 调用工具
  async callTool(name: string, args: Record<string, unknown>): Promise<CallToolResult> {
    return await this.sendRequest<CallToolResult>('tools/call', {
      name,
      arguments: args,
    });
  }

  // 获取该客户端的所有工具的 ToolCall 包装
  getToolCall(): ToolCall[] {
    return this.tools.map((tool) => new MCPToolCall(this, tool));
  }
}
```

### MCPClientHost（MCP 服务器管理器）

**文件**: `src/mcp/host.ts`

```typescript
export class MCPClientHost {
  private clients: Map<string, MCPClient> = new Map();

  // 添加 MCP 服务器
  async addServer(config: MCPServerConfig): Promise<MCPClient> {
    const client = new MCPClient(config);
    await client.connect();
    this.clients.set(config.name, client);
    return client;
  }

  // 获取所有工具（跨所有服务器）
  getAllTools(): { serverName: string; tool: Tool }[] {
    const allTools: { serverName: string; tool: Tool }[] = [];
    for (const client of this.clients.values()) {
      for (const tool of client.tools) {
        allTools.push({ serverName: client.serverName, tool });
      }
    }
    return allTools;
  }

  // 获取所有工具的 ToolCall 包装
  getToolCalls(): ToolCall[] {
    const allTools: ToolCall[] = [];
    for (const client of this.clients.values()) {
      for (const tool of client.getToolCall()) {
        allTools.push(tool);
      }
    }
    return allTools;
  }
}
```

### MCPToolCall（MCP 工具包装器）

**文件**: `src/mcp/toolWrapper.ts`

```typescript
export class MCPToolCall extends ToolCall {
  tool: ToolBase;
  private mcpClient: MCPClient;
  private readonly toolName: string;

  constructor(mcpClient: MCPClient, mcpTool: Tool) {
    super();
    this.mcpClient = mcpClient;
    this.toolName = mcpTool.name;
    this.tool = new MCPToolAdapter(mcpTool);
  }

  async executeTool(toolCall: ToolCallResponse): Promise<CallToolResult> {
    try {
      const args = toolCall.function.arguments;
      return await this.mcpClient.callTool(this.toolName, args);
    } catch (error) {
      return {
        content: [{ type: 'text', text: error.message }],
        isError: true,
      };
    }
  }
}
```

### 浏览器扩展桥接

**文件**: `src/mcp/bridge.ts`

浏览器有 CORS 限制，无法直接调用远程 MCP 服务器。通过浏览器扩展作为代理解决：

```typescript
// 检测扩展是否安装
export function isExtensionInstalled(): boolean {
  const bridge = getBridge();
  return bridge?.installed === true;
}

// 等待扩展就绪
export async function waitForExtension(timeout = 1000): Promise<boolean> {
  return new Promise((resolve) => {
    if (isExtensionInstalled()) {
      resolve(true);
      return;
    }
    // 监听扩展 ready 事件...
  });
}

// 通过扩展发送请求（绕过 CORS）
export async function bridgeFetch(url: string, options: RequestInit = {}): Promise<Response> {
  if (!isExtensionInstalled()) {
    throw new Error('MCP Bridge extension is not installed');
  }

  const id = generateRequestId();
  const request: MCPBridgeRequest = {
    type: 'MCP_BRIDGE_REQUEST',
    id,
    url,
    method: options.method || 'GET',
    headers: options.headers as Record<string, string>,
    body: options.body as string,
  };

  const response = await new Promise<MCPBridgeResponse>((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject });
    sendMessage(request);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}
```

---

## 暴露给 UI 层的接口

### AgentProtocol（Agent 协议类型）

**文件**: `src/types/agentProtocol.ts`

UI 层需要展示的信息：

```typescript
// Plan 结构
export interface PlanInfo {
  tasks: TaskInfo[];
}

export interface TaskInfo {
  task_id: string;
  task_goal: string;
  steps: StepInfo[];
}

export interface StepInfo {
  step_id: string;
  step_goal: string;
  tool_name: string;
  tool_intent: string;
  expected_output: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: ToolResult;
}

// 工具执行结果
export interface ToolResult {
  content: ContentBlock[];
  isError?: boolean;
}

export interface ContentBlock {
  type: 'text' | 'image' | 'resource';
  text?: string;
  data?: string;
  mimeType?: string;
}

// 思考过程
export interface ThinkingInfo {
  step_id: string;
  thinking: string; // LLM 思考内容
  tool_decision: {
    should_call: boolean;
    tool_name?: string;
    arguments?: Record<string, unknown>;
  };
}

// 反思过程（TODO: 待实现）
export interface ReflectionInfo {
  step_id: string;
  reflection: string; // 反思内容
  should_retry: boolean; // 是否需要重试
  retry_reason?: string; // 重试原因
}

// Agent 状态
export type AgentState =
  | 'idle' // 空闲
  | 'planning' // 规划中
  | 'executing' // 执行中
  | 'reflecting' // 反思中
  | 'completed' // 完成
  | 'failed'; // 失败
```

### 事件通知机制（TODO: 待实现）

```typescript
// Agent 事件类型
export type AgentEvent =
  | { type: 'plan_started'; plan: PlanInfo }
  | { type: 'step_started'; step: StepInfo }
  | { type: 'step_thinking'; thinking: ThinkingInfo }
  | { type: 'step_completed'; step: StepInfo; result: ToolResult }
  | { type: 'step_failed'; step: StepInfo; error: Error }
  | { type: 'plan_completed'; result: string }
  | { type: 'reflection'; reflection: ReflectionInfo };

// 事件监听器
export interface AgentEventListener {
  onEvent(event: AgentEvent): void;
}
```

---

## 扩展指南

### 添加新的内置工具

1. 创建工具定义类（继承 ToolBase）

```typescript
// src/tools/myTool.ts
class MyToolBase extends ToolBase {
  schema = {
    name: 'my_tool',
    description: '工具描述',
    inputSchema: {
      type: 'object',
      properties: {
        param1: { type: 'string', description: '参数1' },
      },
      required: ['param1'],
    },
  };
}
```

2. 创建工具调用类（继承 ToolCall）

```typescript
export class MyTool extends ToolCall {
  tool = new MyToolBase();

  async executeTool(toolCall: ToolCallResponse): Promise<CallToolResult> {
    const args = toolCall.function.arguments;
    // 实现工具逻辑
    return {
      content: [{ type: 'text', text: 'result' }],
    };
  }
}
```

3. 在 PlanAndRethink 中注册

```typescript
private builtinTools: ToolCall[] = [
  new LLMGenerator(),
  new JavascriptExecutor(),
  new MyTool(), // 添加新工具
];
```

### 添加新的 MCP 服务器

```typescript
const agent = new Agent();
await agent.init();

// 添加额外的 MCP 服务器
await agent.mcpHost.addServer({
  name: 'my-mcp-server',
  url: 'https://my-server.com/mcp',
});

// 刷新工具列表
const tools = agent.mcpHost.getToolCalls();
agent.planer.setMCPTools(tools);
```

---

## 相关文档

- [项目结构主页](../PROJECT_STRUCTURE.md)
- [packages/web-app 目录结构](./web-app.md)
- [Agent 开发规范](../rules/agent-development.md)
