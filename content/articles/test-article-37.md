---
title: "测试文章 37 - 正则表达式实战"
date: "2026-02-05"
tags: ["正则表达式", "编程", "教程"]
summary: "正则表达式的实用技巧和常见模式。"
---

# 正则表达式实战

本文介绍正则表达式的实用技巧。

## 常用模式

### 邮箱验证

```regex
^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$
```

### URL 匹配

```regex
https?://[^\s]+
```

### 手机号

```regex
^1[3-9]\d{9}$
```

## JavaScript 中的使用

```javascript
// 测试匹配
const pattern = /^\d{4}-\d{2}-\d{2}$/;
pattern.test('2026-01-01'); // true

// 提取分组
const date = '2026-01-15';
const [, year, month, day] = date.match(/(\d{4})-(\d{2})-(\d{2})/);

// 替换
const result = 'hello world'.replace(/\b\w/g, c => c.toUpperCase());
// Result: Hello World
```

## 常见技巧

1. 使用字符类 `[a-z]` 代替 `a|z`
2. 使用量词 `+`, `*`, `?`
3. 使用锚点 `^`, `$`, `\b`

## 总结

正则表达式是处理文本的利器。
