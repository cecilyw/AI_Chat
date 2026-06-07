// 流式数据解析器类
class StreamParser {
  constructor() {
    // SSE(Server-Sent Events)数据缓冲区，用于处理不完整的SSE数据行
    this.sseBuffer = "";
    // 渲染缓冲区，用于存储待显示的文本内容
    this.renderBuffer = "";
    // UTF-8文本解码器，支持流式解码
    this.textDecoder = new TextDecoder("utf-8", { stream: true });
    // 请求中止控制器，用于中止正在进行的请求
    this.abortController = null;
    // 定时器，用于定时刷新渲染缓冲区
    this.flushInterval = null;
    // 是否正在刷新的标志
    this.isFlushing = false;
    // 当前处理数据块的回调函数
    this.currentOnChunk = null;
  }

  // 发起流式请求并处理响应
  async fetchStream(messages, onChunk, onError, onComplete) {
    // 初始化中止控制器
    this.abortController = new AbortController();
    // 清空缓冲区
    this.sseBuffer = "";
    this.renderBuffer = "";
    this.isFlushing = false;
    // 保存当前的数据块处理回调
    this.currentOnChunk = onChunk;

    try {
      // 发送POST请求到后端API
      const response = await fetch("http://localhost:3001/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages }),
        signal: this.abortController.signal, // 关联中止信号
      });

      // 检查HTTP响应状态
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // 获取响应体的读取器
      const reader = response.body.getReader();

      // 循环读取流式数据
      while (true) {
        const { done, value } = await reader.read();

        // 读取完成
        if (done) {
          this.flushAll(); // 清空所有缓冲区
          onComplete(); // 调用完成回调
          this.stopFlush(); // 停止刷新
          break;
        }

        // 解码二进制数据为文本
        const chunk = this.textDecoder.decode(value, { stream: true });
        this.sseBuffer += chunk; // 追加到SSE缓冲区

        // 按行分割数据
        const lines = this.sseBuffer.split("\n");
        this.sseBuffer = lines.pop() || ""; // 保存最后一行不完整的数据

        // 处理每一行数据
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim(); // 提取数据部分

            // 检查是否是结束标记
            if (data === "[DONE]") {
              this.flushAll();
              onComplete();
              this.stopFlush();
              return;
            }

            try {
              const json = JSON.parse(data); // 解析JSON数据

              // 处理错误信息
              if (json.error) {
                this.stopFlush();
                onError(new Error(json.error));
                return;
              }

              // 提取AI生成的内容
              if (json.choices && json.choices.length > 0) {
                const delta = json.choices[0].delta;
                const content = delta?.content || "";

                if (content) {
                  this.addToRenderBuffer(content); // 添加到渲染缓冲区
                }
              }
            } catch (jsonError) {
              console.error("JSON parse error:", jsonError);
            }
          }
        }
      }
    } catch (error) {
      // 处理请求中止的情况
      if (error.name === "AbortError") {
        console.log("Stream aborted");
        this.flushAll(); // 清空剩余内容
      } else {
        this.stopFlush();
        onError(error); // 调用错误回调
      }
    }
  }

  // 添加内容到渲染缓冲区
  addToRenderBuffer(content) {
    this.renderBuffer += content;

    // 如果没有正在刷新，则启动刷新
    if (!this.isFlushing) {
      this.startFlush();
    }
  }

  // 开始定时刷新
  startFlush() {
    this.isFlushing = true;
    // 每50毫秒刷新一次，实现打字机效果
    this.flushInterval = setInterval(() => {
      this.flushChunk();
    }, 50);
  }

  // 停止刷新
  stopFlush() {
    this.isFlushing = false;
    if (this.flushInterval) {
      clearInterval(this.flushInterval); // 清除定时器
      this.flushInterval = null;
    }
  }

  // 刷新一个数据块
  flushChunk() {
    if (this.renderBuffer.length === 0) {
      return;
    }

    // 每次最多取8个字符，实现平滑的打字机效果
    const chunkSize = Math.min(8, this.renderBuffer.length);
    const chunk = this.renderBuffer.substring(0, chunkSize);
    this.renderBuffer = this.renderBuffer.substring(chunkSize);

    // 调用回调函数处理数据块
    if (this.currentOnChunk) {
      this.currentOnChunk(chunk);
    }
  }

  // 刷新所有剩余内容
  flushAll() {
    while (this.renderBuffer.length > 0) {
      this.flushChunk();
    }
  }

  // 中止请求
  abort() {
    this.stopFlush();
    if (this.abortController) {
      this.abortController.abort(); // 中止HTTP请求
    }
  }

  // 重置解析器状态
  reset() {
    this.stopFlush();
    this.sseBuffer = "";
    this.renderBuffer = "";
    this.textDecoder = new TextDecoder("utf-8", { stream: true });
    this.abortController = null;
    this.isFlushing = false;
    this.currentOnChunk = null;
  }
}

// 导出StreamParser的单例实例
export default new StreamParser();
