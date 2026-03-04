---
title: "测试文章 34 - Redis 缓存策略"
date: "2026-02-08"
tags: ["Redis", "缓存", "性能"]
summary: "探索 Redis 缓存的设计策略和最佳实践。"
---

# Redis 缓存策略

本文介绍 Redis 缓存的实现策略。

## 缓存模式

### 1. Cache-Aside

应用直接管理缓存：

```javascript
async function getUser(id) {
  // 先查缓存
  let user = await redis.get(`user:${id}`);
  if (user) return JSON.parse(user);

  // 缓存未命中，查数据库
  user = await db.users.find(id);

  // 存入缓存
  await redis.setex(`user:${id}`, 3600, JSON.stringify(user));
  return user;
}
```

### 2. Read-Through

缓存自动加载数据。

### 3. Write-Through

写入时同步更新缓存。

## 数据结构选择

| 数据类型 | 适用场景 |
|---------|---------|
| String | 简单值 |
| Hash | 对象 |
| List | 队列 |
| Set | 去重 |
| Sorted Set | 排行榜 |

## 总结

合理的缓存策略可以显著提升系统性能。
