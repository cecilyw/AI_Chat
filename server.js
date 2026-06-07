// 引入Node.js内置模块
import http from "http";
import https from "https";
// 引入dotenv模块用于加载环境变量
import dotenv from "dotenv";

// 加载环境变量配置
dotenv.config();

// 从环境变量中获取API密钥和端口号
const API_KEY = process.env.XUNFEI_API_KEY;
const API_SECRET = process.env.XUNFEI_API_SECRET;
const API_PASSWORD = process.env.XUNFEI_API_PASSWORD;
const PORT = process.env.PORT || 3001;

// 创建HTTP服务器
const server = http.createServer((req, res) => {
  // 设置CORS跨域响应头
  // 允许所有来源访问，实际应用中应根据需要限制来源
  res.setHeader("Access-Control-Allow-Origin", "*");
  // 允许POST、GET、OPTIONS方法
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  // 允许前端在请求中携带请求头，如Content-Type
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // 处理预检OPTIONS请求
  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    res.end();
    return;
  }

  // 处理聊天API请求
  if (req.method === "POST" && req.url === "/api/chat") {
    let body = "";

    // 接收请求体数据
    req.on("data", (chunk) => {
      body += chunk;
    });

    // 请求体接收完成后处理
    req.on("end", () => {
      try {
        const requestData = JSON.parse(body);
        const { messages } = requestData;

        console.log("收到请求:", messages);
        // 调用流式请求处理函数
        handleStreamRequest(messages, res);
      } catch (error) {
        console.error("解析请求体错误:", error);
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "请求格式错误" }));
      }
    });
  }
  // 处理健康检查请求
  else if (req.method === "GET" && req.url === "/health") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({ status: "ok", message: "AI Chat API is running" }),
    );
  }
  // 处理其他未定义路由
  else {
    res.statusCode = 404;
    res.end();
  }
});

// 处理流式请求的核心函数
function handleStreamRequest(messages, res) {
  // 构建请求参数
  const requestBody = {
    model: "4.0Ultra",
    messages: messages,
    max_tokens: 4000,
    temperature: 0.7,
    stream: true,
  };

  // 配置MaaS API请求选项
  const options = {
    hostname: "spark-api-open.xf-yun.com",
    port: 443,
    path: "/v1/chat/completions",
    method: "POST",
    timeout: 30000,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_PASSWORD}`,
      "User-Agent": "Node.js-Client",
      Accept: "*/*",
    },
  };

  console.log("发送到MaaS的请求体:", JSON.stringify(requestBody, null, 2));

  // 发起HTTPS请求到MaaS API
  const maasReq = https.request(options, (maasRes) => {
    console.log("MaaS API 响应状态码:", maasRes.statusCode);

    // 设置SSE(Server-Sent Events)响应头
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    // 将MaaS API的响应流式传输给客户端
    maasRes.pipe(res);

    // 响应结束处理
    maasRes.on("end", () => {
      console.log("响应结束");
    });
  });

  // 处理请求错误
  maasReq.on("error", (error) => {
    console.error("请求错误:", error);

    res.write(`data: {"error": "流式请求失败：${error.message}"} \n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
  });

  // 处理请求超时
  maasReq.on("timeout", () => {
    console.error("请求超时");
    maasReq.destroy();

    res.write(`data: {"error": "请求超时"} \n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
  });

  // 发送请求体数据
  maasReq.write(JSON.stringify(requestBody));
  maasReq.end();

  console.log("请求已发送");
}

// 启动服务器监听指定端口
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
