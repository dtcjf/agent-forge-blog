---
title: "测试文章 27 - GitHub Actions 自动化"
date: "2026-02-15"
tags: ["GitHub", "DevOps", "CI/CD"]
summary: "使用 GitHub Actions 实现持续集成和部署。"
---

# GitHub Actions 自动化

学习如何使用 GitHub Actions 实现自动化工作流。

## 基本概念

- **Workflow**: 工作流配置文件
- **Job**: 作业单元
- **Step**: 步骤
- **Action**: 可重用的动作

## 示例工作流

```yaml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test
```

## 常用场景

1. **持续集成** - 自动运行测试
2. **持续部署** - 自动部署到生产环境
3. **自动化脚本** - 定期执行任务

## 总结

GitHub Actions 是现代开发不可或缺的工具。
