---
title: "测试文章 36 - 前端性能优化技巧"
date: "2026-02-06"
tags: ["性能", "前端", "优化"]
summary: "前端性能优化的实用技巧和策略。"
---

# 前端性能优化技巧

本文介绍前端性能优化的方法。

## 加载优化

### 1. 代码分割

```javascript
const Home = lazy(() => import('./Home'));
const About = lazy(() => import('./About'));
```

### 2. 懒加载图片

```html
<img loading="lazy" src="image.jpg" alt="...">
```

### 3. 预加载关键资源

```html
<link rel="preload" href="main.js" as="script">
```

## 渲染优化

### 使用 CSS Transform

```css
/* 避免使用 left/top */
.card {
  transform: translateX(100px); /* GPU 加速 */
}
```

### 减少重排重绘

- 使用 CSS class 切换
- 使用 documentFragment

## 资源优化

- 压缩 CSS/JS
- 优化图片
- 使用 CDN

## 总结

性能优化需要持续关注和迭代。
