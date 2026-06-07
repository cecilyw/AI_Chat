# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此仓库中工作时提供指导。

## 项目概述

yuan-Chat 是一个基于 React 18 + Node.js 构建的现代化 AI 聊天应用，对接讯飞星火 MaaS API，支持流式响应。提供逐字打字机效果、语音输入、多会话管理和智能自动滚动等功能。

## 常用命令

```bash
# 启动前端开发服务器（端口 5173）
npm run dev

# 启动后端服务器（端口 3001）- AI 聊天功能必须运行此服务
npm run server

# 构建生产版本
npm run build

# 代码检查
npm run lint

# 预览生产版本
npm run preview
```

两个服务器必须同时运行，应用才能正常工作。

## 架构设计

### 三层流式架构

流式输出系统采用三层设计，将网络速度与渲染速度解耦：

```
网络层 → streamParser.js（SSE 解析 + 双缓冲区）
         ↓
状态层 → Context.jsx（消息状态管理）
         ↓
渲染层 → Main.jsx（Virtuoso 虚拟列表 + MarkdownRenderer）
```

**`src/services/streamParser.js` 核心机制：**
- **双缓冲区设计**：SSE 解析缓冲区（`sseBuffer`）+ 渲染缓冲区（`renderBuffer`）
- **节奏控制**：每 50ms 从缓冲区 flush 8 个字符，实现平滑打字机效果
- **增量 UTF-8 解码**：使用 `TextDecoder({ stream: true })` 处理跨 chunk 的字符
- **AbortController**：支持随时中断正在进行的请求

### 后端（server.js）

Node.js HTTP 服务器，作为代理转发请求到讯飞星火 API：
- `POST /api/chat` - 接收 messages 数组，返回 SSE 流
- 使用 `maasRes.pipe(res)` 直接管道转发上游 SSE 响应
- 上游请求 30 秒超时

### 状态管理（src/context/Context.jsx）

单一 React Context 提供所有全局状态：
- 会话 CRUD（创建、切换、删除对话）
- 每个会话的消息列表
- 输入框状态、加载状态、语音输入状态
- 智能滚动逻辑：用户上滑时暂停自动滚动（距底部 >100px），1 秒后恢复

### 组件

- **Main.jsx** - 聊天主界面，包含欢迎卡片、消息列表（react-virtuoso）、输入区域、语音录制 UI
- **SideBar.jsx** - 可折叠侧边栏，显示会话历史和"新建对话"按钮
- **MarkdownRenderer.jsx** - Markdown 渲染，支持语法高亮（react-markdown + rehype-highlight + remark-gfm）

### 自定义 Hooks

- **useSpeechRecognition.js** - Web Speech API 封装，支持中文（zh-CN）语音输入，状态：idle/recording/processing

## 环境变量

`.env` 文件必需配置：
```
XUNFEI_API_KEY=your_api_key
XUNFEI_API_SECRET=your_api_secret
XUNFEI_API_PASSWORD=your_api_password
PORT=3001
```

## 关键设计决策

1. **使用 fetch + ReadableStream 而非 WebSocket** - 单向数据流（服务端→客户端）符合流式生成模式，部署更简单，兼容 HTTP/网关体系。

2. **streamParser 是单例** - 导出为 `new StreamParser()` 实例，同一时间只能有一个流处于活动状态。

3. **智能滚动阈值** - 仅当距离底部 100px 以内时才触发自动滚动，可在 Context.jsx 中调整。

4. **Flush 参数** - streamParser.js 中的 50ms 间隔 × 8 字符/块 控制视觉打字速度。

## API 接口规范

前端发送请求：
```json
POST /api/chat
{ "messages": [{ "role": "user", "content": "..." }] }
```

后端返回 SSE 流：
```
data: {"choices":[{"delta":{"content":"..."}}]}
data: [DONE]
```
