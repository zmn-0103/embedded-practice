# M1 第五批验证证据

日期：2026-10-20。Windows 11 家庭版 x64（10.0.26200），Node.js 24.19.0，npm 11.17.0，应用 0.1.0；Electron 42.11.15 / better-sqlite3 12.11.1 保持，数据库结构 2。新增展示/序列化依赖以根目录 npm 锁文件为准。

| 文件 | 实际结果与范围 |
|---|---|
| [check-output.txt](check-output.txt) | 最终类型与格式检查通过 |
| [unit-tests.json](unit-tests.json)、[unit-output.txt](unit-output.txt) | 17 文件、335 项通过，无失败/跳过；新增契约/URL/引用定义 23 项，IPC/图片响应 13 项 |
| [development-tests.json](development-tests.json)、[development-output.txt](development-output.txt) | 开发构建与真实 Electron 19/19 通过，原 14 项与新增窗口 5 项 |
| [package-output.txt](package-output.txt) | Windows x64 解包构建、原生依赖重建成功；没有新 NSIS |
| [packaged-tests.json](packaged-tests.json)、[packaged-output.txt](packaged-output.txt) | 解包 EXE 19/19 通过，子进程 PATH 仅 System32 |
| [开发题干](development-question-light.png)、[开发答案](development-answer-dark.png) | 真实 Electron 明暗界面截图，已查看，使用明确测试样本 |
| [解包题干](packaged-question-light.png)、[解包答案](packaged-answer-dark.png) | 当前解包程序明暗界面截图，已查看；2×3 小图是解码夹具 |
| [开发线程退出](development-window-worker-exit.json)、[解包线程退出](packaged-window-worker-exit.json) | 准备中正常退出时真实 Worker 创建/退出 ID 对应；5000 题为生成样本，不是性能实测 |
| [开发首次入库](development-library-roundtrip.json)、[解包首次入库](packaged-library-roundtrip.json) | 80 题/三图、预览后来源移动、确认幂等回归 |
| [开发重开](development-library-reopened.json)、[解包重开](packaged-library-reopened.json) | 独立进程逐项内容/图片哈希读回与旧令牌失效 |
| [开发版本变更](development-library-changes.json)、[解包版本变更](packaged-library-changes.json) | 元数据/内容版本、收藏/旧状态及测试历史引用、归档恢复、旧基线与外键回归 |
| [开发故障回滚](development-library-rollback.json)、[解包故障回滚](packaged-library-rollback.json) | 故障整批不生效，同快照重试成功；主动注入诊断错误与业务结果分开 |
| [package-inspection.json](package-inspection.json) | 10 个 ASAR 内 JS/HTML/CSS 与当前 out 逐字节匹配；旧 NSIS 哈希未改 |
| [npm-audit.json](npm-audit.json) | 当前工具链传递依赖 8 项 moderate、0 high/critical；未自动升级 |
| [static-checks.json](static-checks.json)、[manifest.json](manifest.json) | 编码/本地链接、两轮复查覆盖、原计划书/题库/原生版本/许可保持及源码/证据哈希 |

窗口五项真实测试覆盖：选择/预览/双击确认、来源移动后重开、三种图片解码及坏图提示、答案挂载/无障碍隐藏、错误定位/取消/放弃/重载、25 题分页、归档/恢复、外链/资源关联/模板/严格 CSP、准备中退出。原生文件/保存框返回及浏览器调用由测试主进程替换，其余使用实际预加载、IPC、工作线程、数据库与窗口。没有新增生产测试开关。

上述 library/worker JSON 从两份最终 Playwright 原报告附件原样解码，历史引用表明确为测试夹具。所有测试数据/导出/移动/清理仅在显式独立临时目录，未访问默认正式或开发库。

失败与过程保留：[初次构建路径失败](baseline-build-failure.txt)；路径修正后的[原 14 项桌面基线](baseline-desktop-tests.json)及[输出](baseline-desktop-output.txt)；窗口新增场景首次 18/19 通过的[图片路径失败报告](development-image-failure.json)与[输出](development-image-failure.txt)。最后一项通过既有单次解码规则修正 URI 编码匹配，随后两种运行形态全部通过。

复现顺序：`npm run check`、`npm test`、`npm run test:desktop`、`npm run pack:dir`、`npm run test:packaged`。静态 ASAR 检查使用已有 @electron/asar 只读提取，没有手改产物。备份位置和完整结果见[验收记录](../../验收记录.md)。

边界：软件导入链路与当前内容检查页已验证；原生对话框人工交互、真实外部浏览器、新 NSIS 安装、全新电脑/缩放、正式题库审阅与长期体验仍未验收。三种小图解码不代表导入器完成完整像素验证。未测最大批次耗时、窗口响应、内存峰值；未实现练习/草稿/自评/真实历史查询或完整备份恢复。未创建提交、推送或发布。
