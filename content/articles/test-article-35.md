---
title: "测试文章 35 - Kubernetes 入门指南"
date: "2026-02-07"
tags: ["Kubernetes", "容器", "DevOps"]
summary: "Kubernetes 基础概念和快速入门指南。"
---

# Kubernetes 入门指南

本文介绍 Kubernetes 的基础概念。

## 核心概念

### Pod

最小的部署单元：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-app
spec:
  containers:
  - name: app
    image: my-app:latest
    ports:
    - containerPort: 8080
```

### Deployment

管理 Pod 的副本：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: app
        image: my-app:latest
```

### Service

服务发现和负载均衡：

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-app
spec:
  selector:
    app: my-app
  ports:
  - port: 80
    targetPort: 8080
```

## 总结

Kubernetes 是容器编排的事实标准。
