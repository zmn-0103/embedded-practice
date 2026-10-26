# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: probe.spec.ts >> 已提交版本：恢复目录创建故障保留真实诊断
- Location: tmp\merge-review-20261026\probe.spec.ts:44:5

# Error details

```
Error: page.evaluate: Error: {"ok":false,"error":{"code":"FILE_ERROR","message":"请选择运行数据目录以外的位置，避免覆盖正在使用的数据。"}}
    at eval (eval at evaluate (:370:30), <anonymous>:4:31)
    at async <anonymous>:396:30
```