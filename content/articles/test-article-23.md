---
title: "测试文章 23 - TypeScript 5.0 高级特性"
date: "2026-02-19"
tags: ["TypeScript", "教程", "编程"]
summary: "探索 TypeScript 5.0 的新特性和高级用法。"
---

# TypeScript 5.0 高级特性

TypeScript 5.0 带来了许多强大的新特性。

## 装饰器

现在装饰器已经是稳定特性：

```typescript
function logged(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const original = descriptor.value;
  descriptor.value = function(...args: any[]) {
    console.log(`Calling ${propertyKey}`, args);
    return original.apply(this, args);
  };
}

class Calculator {
  @logged
  add(a: number, b: number) {
    return a + b;
  }
}
```

## 泛型改进

更灵活的泛型约束：

```typescript
type Readonly<T, K extends keyof T = keyof T> = {
  readonly [P in K]: T[P];
};
```

## 类型收窄

更智能的类型收窄机制。

## 总结

TypeScript 5.0 让类型系统更加强大。
