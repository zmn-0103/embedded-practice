# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: content-updates-window.spec.ts >> 仅图片变化仍可看两版入库图片，来源移走仍完整，不误称文字同即内容同
- Location: tests\e2e\content-updates-window.spec.ts:16:5

# Error details

```
Error: page.evaluate: TypeError: Failed to fetch
    at eval (eval at evaluate (:370:30), <anonymous>:1:82)
    at Array.map (<anonymous>)
    at eval (eval at evaluate (:370:30), <anonymous>:1:26)
    at UtilityScript.evaluate (<anonymous>:372:16)
    at UtilityScript.<anonymous> (<anonymous>:1:44)
```