---
title: "测试文章 38 - 算法复杂度分析"
date: "2026-02-04"
tags: ["算法", "复杂度", "数据结构"]
summary: "算法时间复杂度和空间复杂度的分析。"
---

# 算法复杂度分析

本文介绍算法复杂度的分析方法。

## 时间复杂度

### 常见复杂度

| 复杂度 | 名称 | 示例 |
|--------|------|------|
| O(1) | 常数时间 | 数组访问 |
| O(log n) | 对数时间 | 二分查找 |
| O(n) | 线性时间 | 遍历数组 |
| O(n log n) | 线性对数 | 快速排序 |
| O(n²) | 平方时间 | 冒泡排序 |
| O(2ⁿ) | 指数时间 | 递归斐波那契 |

### 分析方法

```javascript
// O(n)
function sum(arr) {
  let total = 0;
  for (let i = 0; i < arr.length; i++) {
    total += arr[i];
  }
  return total;
}

// O(n²)
function bubbleSort(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
}
```

## 空间复杂度

考虑额外空间的使用。

## 总结

理解复杂度有助于选择合适的算法。
