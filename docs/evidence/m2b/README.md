# M2 第二批验证证据

日期：2026-10-20。Windows 11 家庭版 x64（10.0.26200），Node.js 24.19.0、npm 11.17.0，Electron 42.11.15 / better-sqlite3 12.11.1；应用 0.1.0，数据库结构 3。新增 lowlight 3.3.0 / highlight.js 11.11.2，原生组合、数据库实现、原始计划书与题库保持。

| 文件 | 实际结果与范围 |
|---|---|
| [check-output.txt](check-output.txt) | 最终类型与格式检查通过 |
| [unit-tests.json](unit-tests.json)、[unit-output.txt](unit-output.txt) | 20 文件、405 项通过，无失败/跳过；新增控制器 15、练习 IPC 13、复制 2 项 |
| [development-tests.json](development-tests.json)、[development-output.txt](development-output.txt) | 最终开发构建/真实 Electron 34/34，通过原 27 项和新增 7 项窗口场景；含 C++/ARM 补齐后的重跑 |
| [package-output.txt](package-output.txt) | 最终 Windows x64 解包构建与原生模块重建成功，未制作新 NSIS |
| [packaged-tests.json](packaged-tests.json)、[packaged-output.txt](packaged-output.txt) | 当前解包 EXE 34/34，无失败/跳过/重试，子进程 PATH 仅 System32 |
| [开发本轮](development-practice-window-roundtrip.json)、[解包本轮](packaged-practice-window-roundtrip.json) | 实际输入/纯思考、500ms 状态、揭晓前 DOM/无障碍树隐藏、快速操作、同轮修改/完成、新轮默认状态 |
| [开发失败](development-practice-window-failures.json)、[解包失败](packaged-practice-window-failures.json) | 实际触发器拒绝保存/自评推进，输入保留不切题，移除故障后重试成功 |
| [开发正常关窗重开](development-practice-window-reopened.json)、[解包正常关窗重开](packaged-practice-window-reopened.json) | 未等定时器直接返回/正常关窗，等待应用 close 事件后独立进程读回最后文本、原位置、隐藏状态；外键为空 |
| [开发响应丢失重试](development-practice-window-retry.json)、[解包响应丢失重试](packaged-practice-window-retry.json) | 测试真实提交后主动丢一次响应，重试同 UUID，不再次推进或增加作答行 |
| 两份完整 Playwright 报告 | 另含关闭保存失败选择返回/保留输入/修复后退出，明确放弃只保留此前已保存文本；系统提示返回值为替身 |
| [开发明亮](development-practice-light.png)、[开发深色](development-practice-dark.png)、[开发图片](development-practice-image-zoom.png) | 最终开发 Electron 截图；原早期 `development-image-zoom.png` 仅作为过程产物保留 |
| [解包明亮](packaged-practice-light.png)、[解包深色](packaged-practice-dark.png)、[解包图片](packaged-practice-image-zoom.png) | 已逐张检查最终解包截图，ARM 高亮、长内容操作区与 150% 图片模态；图片夹具为 2×3 像素 |
| [开发生命周期](development-practice-lifecycle.json)、[解包生命周期](packaged-practice-lifecycle.json) | 原内部服务完整生命周期与旧草稿拒绝回归 |
| [开发重开](development-practice-reopened.json)、[解包重开](packaged-practice-reopened.json) | 原内部服务独立进程恢复回归，与正常窗口关窗证据分开 |
| [开发版本](development-practice-versions.json)、[解包版本](packaged-practice-versions.json) | 实际作答与固定旧版本/图片、新轮新版本回归 |
| [开发回滚](development-practice-rollback.json)、[解包回滚](packaged-practice-rollback.json) | 原四类事务中途故障与全部业务状态/回执保持 |
| [开发核实](development-practice-durability.json)、[解包核实](packaged-practice-durability.json) | 原真实提交后异常核实、核实失败停写与重开确认 |
| [开发限额](development-practice-limits.json)、[解包限额](packaged-practice-limits.json) | 原中文草稿精确 1MiB/不截断与数据库约束 |
| [package-inspection.json](package-inspection.json) | 13 个 ASAR 内 JS/HTML/CSS 与最终 out 逐字节一致，含 practice 入口；原许可与来源说明随包且逐字节一致，旧 NSIS SHA-256 保持 |
| [npm-audit.json](npm-audit.json)、[highlight-install-output.txt](highlight-install-output.txt) | 审计 8 项 moderate，无 high/critical，命令退出码 1；保留工具链报告，没有自动修复/升级/批准脚本 |
| [static-checks.json](static-checks.json)、[manifest.json](manifest.json) | 编码、本地链接、23 个变化代码/配置文件两轮复查；原计划书/题库/数据库/CSP 与许可副本核对；源码/证据哈希 |

practice JSON 从最终报告附件原样解码，未重新计算或以摘要替代。数据仅为明确生成的测试题目/小图片，所有启动、导入、SQL 故障与重开都使用显式独立临时目录，没有连接默认正式或开发数据库。

## 初次失败与修正

- [控制器首次报告](controller-expectation-before-fix.json)与[输出](controller-expectation-before-fix.txt)：14/15，一条测试误以为同时刷新时后等待者必须失败；改为允许两者确认同一已保存状态，并明确断言只产生两次必要写入。后续定向 15/15，最终全套 405/405。
- [窗口首次报告](window-first-tests.json)与[输出](window-first-output.txt)：4/7；三个关闭场景完成业务断言后，清理读取已释放的 Playwright process 句柄报错。以 close 事件和 WeakSet 记录已关闭应用，跳过该访问；未修改应用保存/退出逻辑。[修正重跑](window-corrected-tests.json)与[输出](window-corrected-output.txt)为 7/7。
- 原 27 项[接线基线报告](baseline-desktop-tests.json)与[输出](baseline-desktop-output.txt)保持通过；补 ARM 语法前全套[34 项报告](development-before-arm-tests.json)和[输出](development-before-arm-output.txt)亦通过。核对计划书后补齐 ARM/Thumb 及 C++/未知语言检查，最终两种运行形态重新各 34/34。
- 收尾补充许可随包，保留[清单调整前解包报告](packaged-before-notices-tests.json)与[输出](packaged-before-notices-output.txt)；只修改打包文件白名单，重新构建/核对 ASAR 与许可，再重跑解包全套。

复现：`npm run check`、`npm test`、`npm run test:desktop`、`npm run pack:dir`、`npm run test:packaged`。所有新增和实质修改的代码文件均完成 Bug/优化两轮复查，记录在[代码复查记录](../../代码复查记录.md)；静态复查不能替代运行结果。

## 证据边界

新增窗口测试走真实 React、预加载、IPC、生产服务和 SQLite。系统选择/保存/退出提示返回值、外部浏览器和剪贴板写入由测试主进程明确替换，不覆盖真实系统剪贴板；正常窗口界面没有测试开关。提交后响应丢失通过真实服务完成事务后测试主动抛错产生，不是断电实测。正常关闭场景等待真实应用关闭事件；其他场景使用 app.exit 的收尾不作为正常退出证据。

未人工验收真实对话框/剪贴板粘贴、中文输入法、多种系统缩放、热更新模式、系统强制关机、压力性能、全新电脑、新 NSIS 安装、正式题库审阅及长期体验。强制结束仅保证已确认保存状态，未提交按键没有恢复承诺。旧 NSIS 仍为不支持结构 3 的 M0，当前产物为完整 `release/win-unpacked/`。

本批顺序练习软件闭环通过对应自动化；M3 搜索/随机/收藏/历史及 M4 完整备份恢复未开始。没有提交、推送或发布。
