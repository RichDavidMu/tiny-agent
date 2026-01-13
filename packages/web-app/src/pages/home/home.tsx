import { Link } from 'react-router-dom';
import { Bot, Globe, Lock, Zap } from 'lucide-react';

function Home() {
  return (
    <div className="container max-w-screen-2xl py-8">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center space-y-4 py-24 text-center md:py-32">
        <h1 className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-4xl font-extrabold text-transparent sm:text-5xl md:text-6xl lg:text-7xl">
          OpenManus
        </h1>
        <p className="max-w-[750px] text-lg text-muted-foreground sm:text-xl">
          A completely front-end driven AI agent, powered by WebLLM
        </p>
        <p className="max-w-[600px] text-muted-foreground">
          Experience the power of large language models running entirely in your browser. No server
          required, complete privacy, lightning fast responses.
        </p>
        <Link
          to="/chat"
          className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        >
          Start Chatting
        </Link>
      </section>

      {/* Features Section */}
      <section className="space-y-6 py-12 md:py-16">
        <h2 className="text-center text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
          Key Features
        </h2>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 md:gap-8">
          <div className="group relative overflow-hidden rounded-lg border bg-card p-6 transition-all hover:shadow-md">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-bold">100% Private</h3>
            <p className="text-sm text-muted-foreground">
              All processing happens in your browser. Your data never leaves your device.
            </p>
          </div>

          <div className="group relative overflow-hidden rounded-lg border bg-card p-6 transition-all hover:shadow-md">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-bold">Lightning Fast</h3>
            <p className="text-sm text-muted-foreground">
              Powered by WebGPU for near-native performance in your browser.
            </p>
          </div>

          <div className="group relative overflow-hidden rounded-lg border bg-card p-6 transition-all hover:shadow-md">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-bold">No Server Needed</h3>
            <p className="text-sm text-muted-foreground">
              Completely frontend-driven. No backend, no API keys, no costs.
            </p>
          </div>

          <div className="group relative overflow-hidden rounded-lg border bg-card p-6 transition-all hover:shadow-md">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-bold">Powerful Models</h3>
            <p className="text-sm text-muted-foreground">
              Run state-of-the-art language models directly in your browser.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="space-y-6 py-12 md:py-16">
        <h2 className="text-center text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
          How It Works
        </h2>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
              1
            </div>
            <h3 className="text-xl font-bold">Load the Model</h3>
            <p className="text-sm text-muted-foreground">
              The AI model downloads and caches in your browser on first use.
            </p>
          </div>

          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
              2
            </div>
            <h3 className="text-xl font-bold">Start Chatting</h3>
            <p className="text-sm text-muted-foreground">
              Interact with the AI naturally through a chat interface.
            </p>
          </div>

          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
              3
            </div>
            <h3 className="text-xl font-bold">Get Instant Responses</h3>
            <p className="text-sm text-muted-foreground">
              All processing happens locally using WebGPU acceleration.
            </p>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="space-y-6 py-12 md:py-16">
        <h2 className="text-center text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
          Built With
        </h2>
        <div className="mx-auto grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border bg-card p-4 transition-all hover:shadow-md">
            <div className="font-bold text-primary">WebLLM</div>
            <div className="text-sm text-muted-foreground">
              High-performance in-browser LLM inference
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4 transition-all hover:shadow-md">
            <div className="font-bold text-primary">React 19</div>
            <div className="text-sm text-muted-foreground">Modern UI framework</div>
          </div>

          <div className="rounded-lg border bg-card p-4 transition-all hover:shadow-md">
            <div className="font-bold text-primary">Vite</div>
            <div className="text-sm text-muted-foreground">Next-generation frontend tooling</div>
          </div>

          <div className="rounded-lg border bg-card p-4 transition-all hover:shadow-md">
            <div className="font-bold text-primary">TypeScript</div>
            <div className="text-sm text-muted-foreground">Type-safe development</div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
