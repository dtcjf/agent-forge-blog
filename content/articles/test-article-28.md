---
title: "测试文章 28 - GraphQL vs REST API"
date: "2026-02-14"
tags: ["GraphQL", "REST", "API"]
summary: "比较 GraphQL 和 REST API 的优缺点。"
---

# GraphQL vs REST API

本文对比两种流行的 API 设计风格。

## REST API 特点

### 优点
- 简单直观
- 缓存友好
- 标准化程度高

### 缺点
- 过度获取
- 端点数量多
- 版本管理复杂

## GraphQL 特点

### 优点
- 精确获取数据
- 单一端点
- 强类型 schema

### 缺点
- 学习曲线
- 复杂查询性能
- 文件上传不便

## 选择建议

| 场景 | 推荐 |
|------|------|
| 简单 CRUD | REST |
| 复杂数据需求 | GraphQL |
| 移动端优先 | GraphQL |
| 公共 API | REST |

## 总结

选择合适的 API 风格取决于具体需求。
