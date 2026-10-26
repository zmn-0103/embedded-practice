# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: restore-window.spec.ts >> 全新目录从完整预览副本恢复全部业务数据并真实自动重启，源文件变化不影响确认内容
- Location: tests\e2e\restore-window.spec.ts:223:5

# Error details

```
Test timeout of 60000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - heading "嵌入式刷题本" [level=1] [ref=e6]
    - button "收起导航" [expanded] [ref=e7] [cursor=pointer]: ‹
  - navigation "主要页面" [ref=e8]:
    - link "学习总览" [ref=e9] [cursor=pointer]:
      - /url: "#overview"
    - link "知识板块" [ref=e12] [cursor=pointer]:
      - /url: "#boards"
    - link "开始练习" [ref=e15] [cursor=pointer]:
      - /url: "#practice"
    - link "题库" [ref=e18] [cursor=pointer]:
      - /url: "#library"
    - link "学习记录" [ref=e21] [cursor=pointer]:
      - /url: "#records"
    - link "设置与数据" [ref=e24] [cursor=pointer]:
      - /url: "#settings"
  - main [ref=e27]:
    - generic [ref=e28]:
      - generic [ref=e29]:
        - generic [ref=e30]: 学习工作台
        - strong [ref=e31]: 学习总览
      - generic [ref=e32]:
        - generic [ref=e33]: 本地离线
        - group [ref=e35]:
          - generic "外观" [ref=e36] [cursor=pointer]
          - option "松间绿"
          - option "晴空蓝" [selected]
          - option "暖沙金"
          - option "暮山紫"
          - option "Claude 风格"
    - region "学习总览工作区" [ref=e38]:
      - generic "学习总览" [ref=e39]:
        - generic [ref=e40]:
          - paragraph [ref=e41]: 从上次停下的地方继续
          - heading "继续你的嵌入式学习" [level=2] [ref=e42]
          - paragraph [ref=e43]: 先独立思考，再对照答案。每一轮积累都保存在本机。
        - region "当前练习概况" [ref=e44]:
          - generic [ref=e45]:
            - paragraph [ref=e46]: 继续原固定队列
            - heading "历史专题 A" [level=3] [ref=e47]
            - paragraph [ref=e48]: 当前位置 2 / 2 题
            - progressbar "本轮当前位置" [ref=e49]
            - paragraph [ref=e50]: 随机练习 · 已揭晓 1 题 · 已自评 1 题
          - generic [ref=e51]:
            - button "继续本轮" [ref=e52] [cursor=pointer]
            - button "配置新练习" [ref=e53] [cursor=pointer]
        - generic "有效题目当前版本统计" [ref=e54]:
          - generic [ref=e55]:
            - term [ref=e56]: 有效题目
            - definition [ref=e57]: "2"
          - generic [ref=e58]:
            - term [ref=e59]: 已揭晓
            - definition [ref=e60]: "0"
          - generic [ref=e61]:
            - term [ref=e62]: 已自评
            - definition [ref=e63]: "0"
          - generic [ref=e64]:
            - term [ref=e65]: 收藏
            - definition [ref=e66]: "1"
        - paragraph [ref=e67]: 全部有效题目，按题目身份和当前内容版本去重。自评是个人判断。
        - generic [ref=e68]:
          - region "本机知识板块" [ref=e69]:
            - generic [ref=e70]:
              - heading "知识板块" [level=3] [ref=e71]
              - button "查看全部板块" [ref=e72] [cursor=pointer]
            - generic [ref=e73]:
              - button "另一恢复板块 1 道有效题目" [ref=e74] [cursor=pointer]:
                - strong [ref=e75]: 另一恢复板块
                - generic [ref=e76]: 1 道有效题目
              - button "恢复板块新名称 1 道有效题目" [ref=e77] [cursor=pointer]:
                - strong [ref=e78]: 恢复板块新名称
                - generic [ref=e79]: 1 道有效题目
          - region "复习筛选入口" [ref=e80]:
            - heading "复习入口" [level=3] [ref=e81]
            - generic [ref=e82]:
              - button "不会 0 题 · 去筛选" [ref=e83] [cursor=pointer]:
                - strong [ref=e84]: 不会
                - generic [ref=e85]: 0 题 · 去筛选
              - button "不熟 0 题 · 去筛选" [ref=e86] [cursor=pointer]:
                - strong [ref=e87]: 不熟
                - generic [ref=e88]: 0 题 · 去筛选
              - button "内容更新待复习 2 题 · 去筛选" [ref=e89] [cursor=pointer]:
                - strong [ref=e90]: 内容更新待复习
                - generic [ref=e91]: 2 题 · 去筛选
            - paragraph [ref=e92]: 只填入题库筛选条件，不会自动开始或替换练习。
    - status [ref=e93]:
      - paragraph [ref=e95]: 本地数据已就绪
  - contentinfo [ref=e96]:
    - generic [ref=e97]: 离线使用 · 数据保存在本机
    - generic [ref=e98]: V42.11.15 测试版 · 构建 20261025.3-workbench-e
```