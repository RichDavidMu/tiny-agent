<h1 align="center">
Tiny-agent
</h1>

<div align="center">

**A Completely Frontend-Driven AI Agent Project, No Server Required**

English | [简体中文](./README.md)

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6.svg)](https://www.typescriptlang.org/)
[![WebLLM](https://img.shields.io/badge/WebLLM-Latest-orange.svg)](https://github.com/mlc-ai/web-llm)

[🌐 Official Website](https://renbaicai.site/) | [📖 Documentation](./docs) | [🚀 Quick Start](#-installation-and-usage)

</div>

## 📺 Demo Video

[Watch Demo Video](http://cdn.agent.renbaicai.site/video/intro.mp4)

> Complete demonstration video showcasing tiny-agent executing complex tasks

## ✨ Features

### 🌐 Fully Browser-Based

- **Zero Server Dependency**: All AI inference runs entirely in the browser using WebLLM and WebGPU
- **No API Key Required**: No third-party APIs needed, zero cost to use
- **Complete Privacy**: All data stays on your local device, never uploaded

### 🏗️ Advanced Agent Architecture

- **Planning Agent Pattern**: Complete planning-execution-rethinking loop
- **State Machine Controller**: IDLE → PLANNING → EXECUTING → RETHINKING → DONE
- **UI and Agent Layer Separation**: Clear architectural boundaries, easy to maintain and extend
- **Dual LLM System**: Separate LLM instances for planning and tool execution

### 💾 Data Persistence

- **IndexedDB Storage**: Conversation history, file attachments, and tool results all persisted locally
- **Session Management**: Complete multi-turn conversation support
- **File Attachment System**: Support for attaching generated files in responses

### 🔌 MCP Protocol Support

- **Model Context Protocol**: Full support for MCP protocol
- **MCP Bridge Extension**: Chrome extension to solve CORS limitations
- **Extensible Tool System**: Easily add new tools and capabilities

### ⚡ Performance Optimization

- **WebGPU Acceleration**: Hardware acceleration for near-native performance
- **Streaming Responses**: Real-time streaming output with instant feedback
- **React 19 Compiler**: Automatic optimization for faster rendering
- **Web Workers**: LLM inference runs in separate threads, non-blocking UI

### 🛠️ Built-in Tools

- **Code Expert**: Code generation and software engineering tasks
- **JavaScript Executor**: Execute JavaScript in a sandboxed environment
- **Writing Expert**: Writing and content creation assistance

## 🏛️ Project Architecture

```
tiny-agent/
├── app/
│   └── web-app/              # React 19 + Vite frontend application
│       ├── src/
│       │   ├── components/   # UI components
│       │   ├── stores/       # MobX state management
│       │   ├── pages/        # Page components
│       │   └── stream/       # Streaming processing
│       └── public/           # Static assets
├── packages/
│   ├── agent-core/           # Agent core logic
│   │   ├── src/
│   │   │   ├── core/         # State machine controller
│   │   │   ├── service/      # Service layer
│   │   │   ├── storage/      # IndexedDB storage
│   │   │   └── tools/        # Built-in tools
│   ├── web-llm/              # Custom @mlc-ai/web-llm fork
│   ├── mcp-bridge-extension/ # Chrome extension (MCP CORS solution)
│   └── utils/                # Shared utilities
└── docs/                     # Project documentation
```

### Core Architecture Highlights

1. **Monorepo Design**: Multi-package project managed with pnpm workspaces
2. **State Machine Pattern**: Agent execution follows strict state transitions
3. **Streaming Architecture**: End-to-end streaming from LLM to UI
4. **Type Safety**: TypeScript strict mode with complete type definitions
5. **Modular Tool System**: Easy to extend through clear interfaces

## 🚀 Tech Stack

### Frontend

- **React 19** - Latest React version with React Compiler support
- **TypeScript 5.9** - Type-safe development experience
- **Vite 7** - Next-generation frontend build tool
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality UI components
- **Radix UI** - Accessible UI primitives
- **MobX** - Simple, scalable state management

### AI/LLM

- **@mlc-ai/web-llm** - Browser-based LLM inference (custom fork)
- **WebGPU** - Hardware-accelerated graphics and compute API
- **Web Workers** - Multi-threaded LLM inference

### Infrastructure

- **pnpm** - Fast, disk space efficient package manager
- **Turbo** - High-performance build system
- **IndexedDB** - Browser-side database
- **Chrome Extension (Manifest V3)** - MCP CORS solution

## 📦 Installation and Usage

### Prerequisites

- Node.js >= 18
- pnpm >= 8
- Modern browser with WebGPU support (Chrome/Edge 113+)

### Install Dependencies

```bash
# Clone the repository
git clone https://github.com/RichDavidMu/tiny-agent.git
cd tiny-agent

# Install dependencies
pnpm install
```

### Development Mode

```bash
# Start development server
pnpm dev

# Or start only web-app
cd app/web-app
pnpm dev
```

### Build for Production

```bash
# Build all packages
pnpm build

# Or build only web-app
cd app/web-app
pnpm build
```

### Install MCP Bridge Extension (Optional)

If you need to use MCP features:

1. Build the extension:

```bash
cd packages/mcp-bridge-extension
pnpm build
```

2. Load the extension in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `packages/mcp-bridge-extension/dist` directory

## 🎯 Usage Guide

1. **First Use**: On first launch, the LLM model will automatically download and cache in your browser (approximately 2-4GB)
2. **Start Chatting**: Enter your questions or tasks in the chat interface
3. **Agent Execution**: The agent will automatically plan, execute tasks, and provide real-time feedback
4. **View Results**: After task completion, you can view generated files and detailed execution process

## 🔧 Configuration

### Debug Logging

Enable debug logging in general settings:

- **Web App Logs**: Frontend application debug information
- **Agent Core Logs**: Agent core logic debug information

Logs are controlled via the `localStorage.debug` field (format: `web-app*,agent-core*`)

### Theme

Supports light and dark themes, switchable in general settings.

## 📝 Roadmap

- [ ] **Context Management**: Smarter context window management and compression
- [ ] **More Tools**: Expand built-in tool set
- [ ] **Model Selection**: Support switching between multiple LLM models
- [ ] **Export Features**: Export conversation history and generated files

## 🤝 Contributing

Contributions are welcome! Feel free to submit Issues or Pull Requests.

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- [WebLLM](https://github.com/mlc-ai/web-llm) - Browser-based LLM inference engine
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Radix UI](https://www.radix-ui.com/) - Accessible UI primitives

## 📮 Contact

- GitHub: [@RichDavidMu](https://github.com/RichDavidMu)
- Project URL: [https://github.com/RichDavidMu/tiny-agent](https://github.com/RichDavidMu/tiny-agent)

---

<div align="center">
Made with ❤️ by the tiny-agent team
</div>
