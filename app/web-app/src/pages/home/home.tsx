import { Link } from 'react-router-dom';
import {
  Bot,
  Globe,
  Lock,
  Zap,
  Database,
  Cpu,
  Code,
  Layers,
  GitBranch,
  Workflow,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

function Home() {
  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center space-y-4 py-24 text-center md:py-32">
        <h1 className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-4xl font-extrabold text-transparent sm:text-5xl md:text-6xl lg:text-7xl">
          tiny-agent
        </h1>
        <p className="max-w-[750px] text-lg text-muted-foreground sm:text-xl">
          完全前端驱动的 AI Agent，基于 WebLLM 技术
        </p>
        <p className="max-w-[600px] text-muted-foreground">
          在浏览器中体验大语言模型的强大能力。无需服务器，完全隐私，闪电般的响应速度。
        </p>
        <Button asChild size="lg">
          <Link to="/chat">开始对话</Link>
        </Button>
      </section>

      {/* Demo Video Section */}
      <section className="space-y-6 py-12 md:py-16">
        <h2 className="text-center text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
          演示视频
        </h2>
        <div className="mx-auto max-w-4xl">
          <div className="overflow-hidden rounded-xl border bg-card shadow-lg">
            <video controls className="w-full" width="894" height="645">
              <source src="http://cdn.agent.renbaicai.site/video/intro.mp4" type="video/mp4" />
              您的浏览器不支持视频播放。
            </video>
          </div>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            完整演示视频展示了 tiny-agent 执行复杂任务的全过程
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="space-y-6 py-12 md:py-16">
        <h2 className="text-center text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
          核心特性
        </h2>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 md:gap-8">
          <div className="group relative overflow-hidden rounded-xl border bg-card p-6 transition-all hover:shadow-md">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-bold">100% 隐私</h3>
            <p className="text-sm text-muted-foreground">
              所有处理都在浏览器中进行，数据永不离开您的设备。
            </p>
          </div>

          <div className="group relative overflow-hidden rounded-xl border bg-card p-6 transition-all hover:shadow-md">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-bold">闪电般快速</h3>
            <p className="text-sm text-muted-foreground">
              基于 WebGPU 的硬件加速，实现接近原生的性能。
            </p>
          </div>

          <div className="group relative overflow-hidden rounded-xl border bg-card p-6 transition-all hover:shadow-md">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-bold">无需服务器</h3>
            <p className="text-sm text-muted-foreground">
              完全前端驱动，无需后端、API Key，零成本使用。
            </p>
          </div>

          <div className="group relative overflow-hidden rounded-xl border bg-card p-6 transition-all hover:shadow-md">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-bold">强大的模型</h3>
            <p className="text-sm text-muted-foreground">在浏览器中直接运行最先进的大语言模型。</p>
          </div>

          <div className="group relative overflow-hidden rounded-xl border bg-card p-6 transition-all hover:shadow-md">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Workflow className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-bold">Planning Agent</h3>
            <p className="text-sm text-muted-foreground">
              完整的规划-执行-反思循环，智能完成复杂任务。
            </p>
          </div>

          <div className="group relative overflow-hidden rounded-xl border bg-card p-6 transition-all hover:shadow-md">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Database className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-bold">数据持久化</h3>
            <p className="text-sm text-muted-foreground">
              使用 IndexedDB 本地存储对话历史和文件附件。
            </p>
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section className="space-y-6 py-12 md:py-16">
        <h2 className="text-center text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
          架构亮点
        </h2>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 md:gap-8">
          <div className="rounded-xl border bg-card p-6 transition-all hover:shadow-md">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Layers className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-bold">UI 与 Agent 层分离</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              清晰的架构边界，UI 层和 Agent 核心逻辑完全解耦，易于维护和扩展。
            </p>
          </div>

          <div className="rounded-xl border bg-card p-6 transition-all hover:shadow-md">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <GitBranch className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-bold">状态机控制器</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Agent 执行遵循严格的状态转换：IDLE → PLANNING → EXECUTING → RETHINKING → DONE
            </p>
          </div>

          <div className="rounded-xl border bg-card p-6 transition-all hover:shadow-md">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Cpu className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-bold">双 LLM 系统</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              分别用于规划和工具执行的 LLM 实例，动态加载/卸载以管理内存。
            </p>
          </div>

          <div className="rounded-xl border bg-card p-6 transition-all hover:shadow-md">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Code className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-bold">MCP 协议支持</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              完整支持 Model Context Protocol，通过 Chrome 扩展解决 CORS 限制。
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="space-y-6 py-12 md:py-16">
        <h2 className="text-center text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
          工作原理
        </h2>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
              1
            </div>
            <h3 className="text-xl font-bold">加载模型</h3>
            <p className="text-sm text-muted-foreground">
              首次使用时，AI 模型会下载并缓存在浏览器中（约 2-4GB）。
            </p>
          </div>

          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
              2
            </div>
            <h3 className="text-xl font-bold">开始对话</h3>
            <p className="text-sm text-muted-foreground">
              通过聊天界面与 AI 自然交互，Agent 会自动规划和执行任务。
            </p>
          </div>

          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
              3
            </div>
            <h3 className="text-xl font-bold">获得结果</h3>
            <p className="text-sm text-muted-foreground">
              所有处理都在本地使用 WebGPU 加速完成，实时流式输出结果。
            </p>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="space-y-6 py-12 md:py-16">
        <h2 className="text-center text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
          技术栈
        </h2>
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border bg-card p-4 transition-all hover:shadow-md">
            <div className="font-bold text-primary">WebLLM</div>
            <div className="text-sm text-muted-foreground">浏览器中的高性能 LLM 推理</div>
          </div>

          <div className="rounded-xl border bg-card p-4 transition-all hover:shadow-md">
            <div className="font-bold text-primary">React 19</div>
            <div className="text-sm text-muted-foreground">最新的 React + Compiler</div>
          </div>

          <div className="rounded-xl border bg-card p-4 transition-all hover:shadow-md">
            <div className="font-bold text-primary">TypeScript 5.9</div>
            <div className="text-sm text-muted-foreground">类型安全的开发体验</div>
          </div>

          <div className="rounded-xl border bg-card p-4 transition-all hover:shadow-md">
            <div className="font-bold text-primary">Vite 7</div>
            <div className="text-sm text-muted-foreground">下一代前端构建工具</div>
          </div>

          <div className="rounded-xl border bg-card p-4 transition-all hover:shadow-md">
            <div className="font-bold text-primary">WebGPU</div>
            <div className="text-sm text-muted-foreground">硬件加速的图形和计算</div>
          </div>

          <div className="rounded-xl border bg-card p-4 transition-all hover:shadow-md">
            <div className="font-bold text-primary">MobX</div>
            <div className="text-sm text-muted-foreground">简单可扩展的状态管理</div>
          </div>

          <div className="rounded-xl border bg-card p-4 transition-all hover:shadow-md">
            <div className="font-bold text-primary">Tailwind CSS</div>
            <div className="text-sm text-muted-foreground">实用优先的 CSS 框架</div>
          </div>

          <div className="rounded-xl border bg-card p-4 transition-all hover:shadow-md">
            <div className="font-bold text-primary">shadcn/ui</div>
            <div className="text-sm text-muted-foreground">高质量的 UI 组件</div>
          </div>

          <div className="rounded-xl border bg-card p-4 transition-all hover:shadow-md">
            <div className="font-bold text-primary">IndexedDB</div>
            <div className="text-sm text-muted-foreground">浏览器端数据持久化</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="flex flex-col items-center justify-center space-y-4 py-12 text-center md:py-16">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
          准备好开始了吗？
        </h2>
        <p className="max-w-[600px] text-muted-foreground">
          无需注册，无需配置，立即体验完全本地化的 AI Agent。
        </p>
        <div className="flex gap-4">
          <Button asChild size="lg">
            <Link to="/chat">开始对话</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a
              href="https://github.com/RichDavidMu/tiny-agent"
              target="_blank"
              rel="noopener noreferrer"
            >
              查看源码
            </a>
          </Button>
        </div>
      </section>
    </div>
  );
}

export default Home;
