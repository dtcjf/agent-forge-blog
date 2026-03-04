---
title: "测试文章 33 - OAuth 2.0 认证流程"
date: "2026-02-09"
tags: ["OAuth", "安全", "认证"]
summary: "详细解释 OAuth 2.0 授权流程和实现方式。"
---

# OAuth 2.0 认证流程

本文介绍 OAuth 2.0 的授权流程。

## 授权流程

### 1. 授权码模式

最安全的授权方式：

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│  用户   │────▶│ 客户端  │────▶│ 授权服务器 │
└─────────┘     └─────────┘     └─────────┘
      │            │            │
      │◀───────────│◀───────────│
      │    授权码   │            │
      │───────────▶│───────────▶│
      │            │   授权码   │
      │            │◀───────────│
      │            │  访问令牌  │
```

### 代码示例

```javascript
// 重定向到授权页面
const authUrl = `https://auth.example.com/authorize?
  client_id=${CLIENT_ID}&
  redirect_uri=${REDIRECT_URI}&
  response_type=code&
  scope=read`;

window.location.href = authUrl;

// 交换授权码获取令牌
const tokenResponse = await fetch('/token', {
  method: 'POST',
  body: JSON.stringify({
    grant_type: 'authorization_code',
    code: authCode,
    client_id: CLIENT_ID,
  })
});
```

## 总结

OAuth 2.0 是现代应用授权的标准。
