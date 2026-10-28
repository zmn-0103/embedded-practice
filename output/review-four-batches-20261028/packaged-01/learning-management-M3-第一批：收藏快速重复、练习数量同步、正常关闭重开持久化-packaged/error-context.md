# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: learning-management.spec.ts >> M3 第一批：收藏快速重复、练习数量同步、正常关闭重开持久化
- Location: tests\e2e\learning-management.spec.ts:378:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: '导入预览', exact: true })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('heading', { name: '导入预览', exact: true }) with timeout 10000ms
  - waiting for getByRole('heading', { name: '导入预览', exact: true })

```

```yaml
- banner:
  - heading "嵌入式刷题本" [level=1]
  - paragraph: 思考有迹，积累有序
  - button "收起导航" [expanded]: ‹
- navigation "主要页面":
  - link "学习总览":
    - /url: "#overview"
  - link "知识板块":
    - /url: "#boards"
  - link "开始练习":
    - /url: "#practice"
  - link "题库":
    - /url: "#library"
  - link "学习记录":
    - /url: "#records"
  - link "设置与数据":
    - /url: "#settings"
- main:
  - text: 学习工作台
  - strong: 题库
  - text: 本地离线
  - group: 外观
  - region "题库导入":
    - strong: 题库工具
    - button "导入题库"
    - button "导出题库模板"
    - dialog "导入与模板":
      - heading "导入与模板" [level=2]
      - button "关闭导入工作区"
      - list "导入步骤":
        - listitem: 1. 选择文件
        - listitem: 2. 检查预览
        - listitem: 3. 确认导入
      - paragraph: 每个专题文件是完整快照；遗漏的现有题目将归档，题目及学习记录保留。未参与导入的专题不受影响。请持续核对本次将归档数量。
      - paragraph: 已取消本次导入。
  - region "题库尚未导入":
    - heading "题库尚未导入" [level=2]
    - paragraph: 选择一个或多个 Markdown 文件，先核对变更，再确认保存。
    - paragraph: 也可以导出模板，在程序外填写自己的专题。
    - group:
      - text: 分类与专题
      - navigation "题库分类导航":
        - text: 查找专题
        - searchbox "题库专题检索"
        - paragraph: 检索仅筛选导航；点击后应用范围。
        - button "全部分类（0题）" [pressed]
        - list:
          - listitem:
            - button "收起未分类" [expanded]
            - button "题库分类：未分类": 未分类（0题）
            - list:
              - listitem: 暂无专题
    - group: 勾选组卷与题单（0题）
    - group: 管理分类
  - status:
    - paragraph: 本地数据已就绪
- contentinfo: 离线使用 · 数据保存在本机 V0.0.2 测试版 · 构建 20261028.1-content-updates
```

```
Error: EBUSY: resource busy or locked, unlink 'C:\Users\pc\AppData\Local\Temp\embedded-practice-ktCq4C\lockfile'
```