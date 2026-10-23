# M3 第五批证据：显示设置与四个入口

日期：2026-10-21。范围见[第五批行为](../../M3第五批行为与验收.md)，实现见[显示设置与页面](../../architecture/M3显示设置与页面.md)。本批完成 M3 剩余的主题/字号与入口分离；M3 软件任务及五项关键自动化条件已有对应证据，完整人工体验和正式题库仍待验收，M4/M5 未开始。

## 环境与范围

- Windows 11 x64（10.0.26200），Node.js 24.19.0，npm 11.17.0，Electron 42.11.15，better-sqlite3 12.11.1，应用 0.1.0。改前 695 文件副本及哈希见 [environment.json](environment.json)。
- 13 个生产文件、19 个测试/夹具文件逐文件先 Bug 后可维护性复查，见[复查记录](../../代码复查记录.md)及 [code-change-audit.json](code-change-audit.json)。计划书、原题库、依赖/锁文件、构建配置与练习保存控制器保持；数据库升级到结构 5。
- 全部运行显式使用独立临时数据目录，数据库访问/清理前检查父目录和专用前缀；没有连接正式学习库。开发形态使用生产构建，解包形态使用重新生成的 Windows EXE 且 PATH 仅 System32。
- [产物核对](package-inspection.json)：13 个运行文件、6 个许可副本与源码构建逐字节一致，原生 SQLite 模块一致；旧 M0 NSIS 哈希保持，未生成或安装新 NSIS。旧程序不支持结构 5，使用时保留整个解包目录。

## 实际检查

| 检查 | 结果 | 原始记录 |
|---|---|---|
| 类型与格式 | 通过 | [最终检查](check-final.log) |
| 全部单元 | 24 文件、492/492；原 474 项按文件/标题多重集完整保留 | [报告](unit-tests.json)、[日志](unit-tests.log) |
| 源码构建 | 通过，包含关闭失败复位修复 | [日志](build-final.log) |
| Windows x64 解包构建 | 通过，未发布 | [日志](package.log) |
| 新 v4 迁移开发首轮 | 4/4 | [报告](migration-first-tests.json)、[日志](migration-first.log) |
| 页面适配后开发首轮完整 | 84/85，1 项遗漏切页，原失败保留 | [报告](navigation-first-tests.json)、[日志](navigation-first.log) |
| 新设置窗口开发首轮 | 6/7，真实检出关闭失败回窗遗留 closing | [报告](settings-first-tests.json)、[日志](settings-first.log) |
| 两项修正后定向 | 3/3，含关闭成功/失败及原练习流程 | [报告](fixes-tests.json)、[日志](fixes.log) |
| 最终完整开发构建 | 92/92，原 81 项逐项保留，新增 11 项 | [最终报告](final-full-tests.json)、[日志](final-full.log) |
| 最终完整 Windows 解包 EXE | 92/92，原 81 项逐项保留，新增 11 项 | 同上，projectName=packaged |
| 最终合计 | 184/184，零失败/跳过/flaky/自动重试 | [结果及场景比较](results-summary.json) |

实际执行 `npm run check`、`npm test -- --reporter=default --reporter=json --outputFile=docs/evidence/m3e/unit-tests.json`、`npm run build`、`npm run pack:dir`。完整回归命令如下；新增场景按对应 spec 在 development 先定向执行，原始失败不被最终通过覆盖。

```powershell
$env:PLAYWRIGHT_JSON_OUTPUT_NAME = 'docs/evidence/m3e/final-full-tests.json'
npx playwright test --reporter=list,json --output=tmp/m3e-final-full
```

前批 v3 成功升级场景标题仅从“至 v4”同步为“至 v5”，旧 v3 来源/备份与失败版本断言保持；比较报告明确记录这一映射，未删除旧覆盖。原收藏竞态的两个隐藏首页按钮只用于原就绪状态读取，题库详情始终挂载，所有交互针对可见控件；旧响应消费屏障、展开答案及业务行快照不放宽。

## 新增场景的证据

每种形态新增 4 项 v4 迁移和 7 项设置窗口场景。

| 场景 | 证明范围 | 实际数据 |
|---|---|---|
| v4 升级保留 | 从冻结旧 SQL 建立真实题库/旧会话/随机队列/草稿/自评/收藏/图片/回执，全部旧业务表逐字段保持；备份仍是 v4，当前是 v5，自定义会话索引/触发器保留；设置重开无二次升级 | [开发](development-settings-v4-preserved.json) / [解包](packaged-settings-v4-preserved.json) |
| 备份失败停止 | 备份路径阻断，旧数据库逐字节保持，未创建设置表或空库 | [开发](development-settings-v4-backup-blocked.json) / [解包](packaged-settings-v4-backup-blocked.json) |
| 表冲突回滚 | 新表名冲突时保留旧结构与旧行、保护性备份 | [开发](development-settings-v4-table-conflict.json) / [解包](packaged-settings-v4-table-conflict.json) |
| 坏外键回滚 | 不提交新结构或设置，保留旧数据与备份 | [开发](development-settings-v4-foreign-key.json) / [解包](packaged-settings-v4-foreign-key.json) |
| 主题/字号真实渲染 | 跟随系统媒体变化，手动优先；15/17/22px 实际正文/代码/表格/输入框及高亮颜色精确断言，保存不改学习快照 | [开发](development-appearance-rendering.json) / [解包](packaged-appearance-rendering.json) |
| 设置独立重开 | 正常关闭后 root 显示、草稿原文/位置、自评/收藏/全部历史保持，原轮未揭晓答案继续隐藏 | [开发](development-appearance-reopened.json) / [解包](packaged-appearance-reopened.json) |
| 写入失败与丢响应 | SQL 触发器制造真实写入失败；移除后真实提交但丢返回，再重试同一完整目标，旧显示/目标选择和学习行正确保持 | [开发](development-appearance-write-retries.json) / [解包](packaged-appearance-write-retries.json) |

另外四项窗口断言见完整报告：空库与四个独立入口/地址不变/无虚假恢复按钮；损坏设置行读取报错且不自动重置，修复后重读；保存中关闭成功与失败分别验证等待、原回执、回窗重试和练习控件可用。关闭成功分支走真实数据库提交，失败分支明确替换返回以验证协调；真实 SQL 失败由前一场景独立覆盖。

冻结 [schema-v4.sql](../../../tests/fixtures/schema-v4.sql) 来自改前真实构建在独立临时目录初始化，先核对 userData 和版本再关闭导出，来源/15 个对象/哈希见 [schema-v4-source.json](schema-v4-source.json)。不从新生产定义反推旧结构。系统文件框/提示框、返回时序与响应丢失由测试替身控制，其余经过真实桥接、SQLite、渲染和独立进程重开。

## 截图与静态核对

全部截图为 Electron capturePage 获取的完整可视窗口，等待字体和两帧绘制；开发与解包代表性窗口已目视检查。表格、代码、输入框字号另由实际计算样式断言证明，不能只看根元素属性。系统主题变化使用页面媒体模拟，不等于 Windows 系统 DPI 或完整人工体验。

| 窗口 | 开发 | Windows 解包 |
|---|---|---|
| 明色 15px 设置 | [图](development-settings-light-15.png) | [图](packaged-settings-light-15.png) |
| 跟随系统 17px 设置 | [图](development-settings-system-17.png) | [图](packaged-settings-system-17.png) |
| 暗色 22px 设置 | [图](development-settings-dark-22.png) | [图](packaged-settings-dark-22.png) |
| 暗色 22px 题库正文/代码 | [图](development-reading-dark-22.png) | [图](packaged-reading-dark-22.png) |
| 明色 15px 练习输入 | [图](development-practice-light-15.png) | [图](packaged-practice-light-15.png) |
| 暗色 22px 练习输入 | [图](development-practice-dark-22.png) | [图](packaged-practice-dark-22.png) |

[源码清单](source-manifest.json)、[变更检查](change-audit.json)、[文档静态检查](documents-static.json)记录中文 UTF-8 往返、文档链接/围栏、源码与原始计划/题库/依赖保持。首次完整格式检查发现迁移测试文件格式未统一，使用既有工具整理后通过。汇总工具初版用标题集合计数，参数化重名被合并；改按文件/标题多重集保留重复次数后，确认原 474 项全部保留，未改应用或测试断言。

## 修正与未验证项

首轮旧阅读场景仍在开始页找题库按钮而超时，只增加真实题库/开始页导航；原答案隐藏、草稿原文、自评/跳过/新轮断言保持。新设置场景真实检出保存失败后正常关闭返回窗口时 closing 没复位，最小修复为保存失败或回执失败均调用原 cancelClose；修复后练习模式恢复可用，原保存控制器未改。

历史单次键盘偏移与前批额外输入字符来源仍未知，本批通过不代表原因已定位或已修复。完整 Windows 人工体验、组合输入中切题/关闭、系统 DPI、外部编辑器双向剪贴板、系统浏览器、大图、正式题库审阅、新 NSIS/安装升级与性能未验收。完整备份恢复和数据位置操作未实现。未访问默认学习库、提交、推送或发布。
