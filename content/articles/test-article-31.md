---
title: "测试文章 31 - WebSocket 实时通信"
date: "2026-02-11"
tags: ["WebSocket", "实时", "教程"]
summary: "使用 WebSocket 实现实时双向通信。"
---

# WebSocket 实时通信

学习如何使用 WebSocket 实现实时功能。

## WebSocket 基础

WebSocket 提供了全双工通信能力。

### 建立连接

```javascript
const ws = new WebSocket('wss://example.com/socket');

ws.onopen = () => {
  console.log('Connected');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};

ws.send(JSON.stringify({ type: 'hello' }));
```

### 服务端实现

```javascript
const { WebSocketServer } = require('ws');
const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    // 处理消息
    ws.send('Message received');
  });
});
```

## 应用场景

- 实时聊天
- 股票行情
- 在线游戏
- 通知系统

## 总结

WebSocket 是实现实时功能的理想选择。
