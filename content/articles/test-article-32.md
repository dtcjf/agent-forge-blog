---
title: "测试文章 32 - React Hooks 深入理解"
date: "2026-02-10"
tags: ["React", "Hooks", "教程"]
summary: "深入理解 React Hooks 的工作原理和最佳实践。"
---

# React Hooks 深入理解

本文深入探讨 React Hooks 的机制。

## Hooks 规则

1. 只在顶层调用 Hooks
2. 只在 React 函数中调用

## 常用 Hooks

### useState

```jsx
const [count, setCount] = useState(0);
```

### useEffect

```jsx
useEffect(() => {
  const subscription = api.subscribe(id);
  return () => subscription.unsubscribe();
}, [id]);
```

### useContext

```jsx
const theme = useContext(ThemeContext);
```

### useReducer

```jsx
const [state, dispatch] = useReducer(reducer, initialState);
```

## 自定义 Hook

```jsx
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}
```

## 总结

熟练掌握 Hooks 可以写出更优雅的 React 代码。
