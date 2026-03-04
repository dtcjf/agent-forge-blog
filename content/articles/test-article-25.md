---
title: "测试文章 25 - MCP 协议详解"
date: "2026-02-17"
tags: ["MCP", "AI", "协议"]
summary: "深入了解 Model Context Protocol 协议的工作原理。"
---

# MCP 协议详解

MCP (Model Context Protocol) 是一个用于 AI 模型与外部系统交互的协议。

## 协议架构

MCP 采用客户端-服务器架构：

- **MCP Client**: 运行在 AI 应用中
- **MCP Server**: 提供工具和数据

## 核心概念

### 1. 工具 (Tools)

AI 可以调用的函数：

```json
{
  "name": "get_weather",
  "description": "获取天气信息",
  "parameters": {
    "type": "object",
    "properties": {
      "city": { "type": "string" }
    }
  }
}
```

### 2. 资源 (Resources)

AI 可以读取的数据：

```json
{
  "uri": "file:///config.json",
  "name": "应用配置"
}
```

### 3. 提示 (Prompts)

预定义的提示模板。

## 实际应用

MCP 可以用于：
- 文件系统操作
- API 调用
- 数据库查询
- 代码执行

## 总结

MCP 是 AI Agent 的重要基础设施。
