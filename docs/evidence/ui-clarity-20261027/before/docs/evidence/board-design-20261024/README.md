# 题库板块设计证据

日期：2026-10-24。用户提供两套软件的5张截图，要求先设计板块、允许暂时没有题库。本批完成15基础板块、7拓展方向与127个待建设专题名称；交付[规划说明](../../题库板块规划与展示设计.md)、[维护清单](../../../question-banks/catalog/板块规划.json)及[独立预览](../../design/board-catalog.html)。没有接入程序默认分类或修改个人库。

## 设计与静态对应

- 用户参考：[第一套图1](references/reference-01.png)、[图2](references/reference-02.png)；[第二套图1](references/reference-03.png)、[图2](references/reference-04.png)、[图3](references/reference-05.png)。只参考知识覆盖和卡片组织，未采用参考软件题数作为本机数据。
- [规划核对](catalog-verification.json)：22个键/名称唯一、顺序完整；15基础/7拓展，127个待建名称。7份现有题库经Markdown AST计数和元数据核对，共118道候选题；推荐归属均指向有效规划键。题库本身未改，候选不等于审阅通过。
- [代码/格式/差异检查](script-checks.json)：新预览生成器语法、生成器/规划JSON格式以及按CRLF边界的工作区差异检查实际退出0；逐文件两轮自查见[代码复查记录](../../代码复查记录.md)。

## 浏览器实际检查

通过Playwright CLI的独立Chrome会话访问只绑定127.0.0.1的设计目录，未打开Electron程序或读取正式数据库。实际结果见[浏览器记录](browser-verification.json)。

| 场景 | 证据 |
| --- | --- |
| 0题C语言板块可展开，列出6个规划专题 | [可访问性快照](c-expanded.yml) |
| 搜索Linux只显示系统/应用与内核/驱动两块 | [搜索快照](search-linux.yml) |
| 不存在关键词得到0项和明确提示 | [无结果快照](search-empty.yml) |
| 显示拓展后搜索蓝牙定位无线与物联网 | [拓展快照](search-extension.yml) |
| 1360宽窗口显示15基础板块，无横向溢出 | [最终桌面图](../../../output/playwright/board-design-20261024/desktop-final.png) |
| 390宽暗色窗口无横向溢出，文字和控件可见 | [窄窗口图](../../../output/playwright/board-design-20261024/narrow-dark.png) |

浏览器会话已经关闭；回环预览服务由Ctrl+C结束（工具shell退出1），随后确认监听数量为0。浏览器视口/配色检查不代表Windows系统缩放、原生输入法、Electron回归、安装、硬件或用户体验验收。

## 首次工具问题与预览修正

- [首次打开记录](browser-open-01.json)：工具禁止file协议；没有关闭访问限制，改为只开放设计目录的回环HTTP预览。
- [默认图标404](browser-console-01.json)：首个HTML缺少favicon声明，浏览器请求默认路径。生成器补空data图标，无需外部文件；[首个HTML](preview-01.html)保留。
- [旧引用定位](browser-ref-01.json)：重载后元素引用增加f1前缀，一次点击仍使用旧e24；读取新快照后改用当前引用，没有修改预览绕过。
- 展开标签原用CSS伪文字替换，可访问性快照会拼接“查看专题收起专题”，过滤后仍有残留。改用原生toggle更新真实文字，最终展开及过滤快照不再残留；[修正前HTML](preview-02.html)与[原展开快照](c-expanded-before-label-fix.yml)保留。

## 范围与材料保护

[改前清单](before.json)记录本批开始时的真实工作区；7份可能修改的原文按原路径保存在before/。[范围核对](scope-verification.json)比较所有原文件、旧证据、完整程序目录与新输出；[本地链接核对](links-verification.json)检查当前文档和本批说明，排除冻结来源快照、旧证据、测试夹具及临时/生成目录。

[源文件清单](source-manifest.json)保存最终规划、生成器、预览和文档哈希；[证据清单](evidence-manifest.json)封存本目录材料（不含自身）。现有发布目录在本批开始前已有一个debug.log；原124个发布文件与该已存在日志分别按改前状态核对，不清理用户运行产生的文件。

本轮不生成新题、空Markdown或模拟题数，不修改题答/身份/旧学习记录。生产源码、依赖锁、数据库结构与EXE保持；未重跑607单元/404完整桌面、构建或发布。题目技术审阅和安装未验状态保持，VMware及相关排障继续按用户决定跳过。
