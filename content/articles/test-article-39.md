---
title: "测试文章 39 - CI/CD 流水线设计"
date: "2026-02-03"
tags: ["CI/CD", "DevOps", "自动化"]
summary: "设计高效的持续集成和持续部署流水线。"
---

# CI/CD 流水线设计

本文介绍 CI/CD 流水线的设计。

## 流水线阶段

### 1. 代码检出

```yaml
- checkout: git@github.com:user/repo.git
```

### 2. 构建

```yaml
- run: npm ci
- run: npm run build
```

### 3. 测试

```yaml
- run: npm test
- run: npm run lint
- run: npm run type-check
```

### 4. 部署

```yaml
- run: npm run deploy
```

## 最佳实践

### 快速反馈

- 并行执行独立任务
- 缓存依赖
- 增量构建

### 安全扫描

```yaml
- run: npm audit
- run: security-scan
```

### 部署策略

- 蓝绿部署
- 金丝雀发布
- 滚动更新

## 总结

好的 CI/CD 流程可以显著提升开发效率。
