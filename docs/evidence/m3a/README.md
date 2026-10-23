# M3 第一批证据：搜索、组合筛选与收藏

日期：2026-10-21。Windows 11 x64（10.0.26200）、Node.js 24.19.0、npm 11.17.0、Electron 42.11.15、better-sqlite3 12.11.1，数据库结构 3。实际版本和改前副本见[环境](environment.json)，范围见[本批行为](../../M3第一批行为与验收.md)。本批完成 M3 第一项任务，不认定 M3 全部或完整人工验收通过。

## 检查与结果

| 检查 | 实际结果 | 原始证据 |
|---|---|---|
| 类型与格式 | 通过；首轮类型通过、两个文件格式未同步，使用原格式工具修正后通过 | [首轮](check-first.log)、[最终](check.log) |
| 单元检查 | 21 文件、418/418，零失败/跳过 | [报告](unit-first.json)、[输出](unit-first.log) |
| 当前源码构建 | 通过 | [输出](build.log) |
| 新增定向 Electron | 5/5 通过 | [报告](focused-tests.json)、[输出](focused-first.log) |
| 完整开发构建回归 | 54/54，零失败/跳过/重试 | [报告](development-tests.json)、[输出](development.log)、[截图](development-search-filter.png) |
| Windows 解包构建 | 通过，重新构建原生模块与 EXE/ASAR | [输出](package.log) |
| 完整 Windows 解包 EXE 回归 | 54/54，零失败/跳过/重试；子进程 PATH 仅 System32 | [报告](packaged-tests.json)、[输出](packaged.log)、[截图](packaged-search-filter.png) |
| 包内容核对 | 13 个 JS/HTML/CSS 和 6 个许可文件逐字节一致；旧 M0 NSIS 哈希未变 | [核对](package-inspection.json) |

[汇总](results-summary.json)从原始报告读取数量和状态。两种完整回归均包含原有全部 49 项 M2 场景，保持双击跳过/上一题、长按键、图片自动保存、草稿失败、正常退出与强制终止恢复等验证。解包程序位于 `release/win-unpacked/embedded-practice.exe`；旧 NSIS 未重新制作或安装。

## 新增真实窗口与 SQLite 场景

测试使用两专题共 27 道生成题目和显式临时目录，文件选择边界使用明确替身；解析、预览确认、筛选、收藏、练习和数据库都走实际程序。故障触发器和丢失响应只注入测试库/进程，不增加生产测试入口。

| 行为 | 实际断言 | 解包证据（开发报告也含相同附件） |
|---|---|---|
| 搜索、组合与分页 | 标题/题干/标签均可搜，英文大小写不敏感；百分号/下划线/引号/反斜线按字面匹配，注入串不扩大结果；专题+精确标签+难度取交集，未分级可筛；页码收敛，搜索答案专有字符串为零，响应无正文/答案列且页面与无障碍树无答案 | [搜索响应](packaged-search-boundaries.json)、[开发响应](development-search-boundaries.json) |
| 收藏与恢复 | 100ms 双击仍为收藏，同目标重复设置保持一个收藏且不改导入修订；首页从匹配 0 变 1，建轮只含该题；正常关窗后独立进程恢复收藏及可继续轮 | [重开快照](packaged-favorite-reopened.json)、[开发快照](development-favorite-reopened.json) |
| 收藏故障与响应丢失 | 真实写入触发器报错时数据库整体快照不变、按钮保持未收藏；移除故障后丢弃一次真实成功响应，重试仍设置 true；收藏页取消后收敛为 0 题、1/1 页 | [失败与重试结果](packaged-favorite-failure-retry.json)、[开发结果](development-favorite-failure-retry.json) |
| 筛选队列和语义 | 题库与新轮同条件得到 q-02/q-04；未访问队列不算练习，揭晓后未自评与掌握区分；无匹配替换请求返回 NO_QUESTIONS，全部会话/记录/回执不变；取消收藏后仍可继续原题，跳过不算已练习 | [队列与状态](packaged-filtered-queue-state.json)、[开发状态](development-filtered-queue-state.json) |
| 版本与归档恢复 | 仅标签变化保留当前自评；答案更新后旧自评不计新版掌握、收藏保留；归档可查收藏且新轮排除，恢复同身份后收藏仍在；继续旧轮读取旧答案/自评，队列内容版本不变，外键通过 | [前后快照](packaged-version-archive-restore.json)、[开发快照](development-version-archive-restore.json) |

截图已目视检查筛选字段、详情收藏和答案展开入口，不代表 Windows 系统 DPI 或完整人工体验。先前 M2 原生微软拼音/文件框/系统剪贴板局部证据保留于原目录，本次未把测试替身当作新的系统体验验收。

文档核对首轮在生成报告前检查其自身链接，报告文件当时尚不存在，产生一项[自引用失败](documents-static-first.json)；生成后再次检查全部实际文件通过，未修改应用或放宽链接规则。

## 范围和文件核对

数据库结构与迁移、依赖/锁文件、原始计划书和题库保持；旧请求可省略筛选字段，不改变原回执哈希输入。收藏仅修改独立状态，题库列表/计数与练习共用绑定参数条件。逐文件两轮检查见[代码复查记录](../../代码复查记录.md)。改前副本含 487 个原文件，位置见环境；最终[改动清单](change-audit.json)、[哈希清单](source-manifest.json)和[UTF-8/本地链接核对](documents-static.json)记录实际范围。

M3 随机队列、单题历史、内容更新待复习展示及主题/字号仍待开发，完整阶段尚未通过。M2 人工项、正式题库审阅、Windows DPI、组合输入及完整系统能力、新安装升级、完整备份恢复、压力性能和长期试用仍待原计划后续检查。当前环境可继续开发和桌面验证，没有连接默认开发或正式学习数据库，没有提交、推送、创建新 NSIS 或发布。
