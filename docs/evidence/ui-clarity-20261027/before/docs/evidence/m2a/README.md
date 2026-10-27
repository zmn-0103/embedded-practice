# M2 第一批验证证据

日期：2026-10-20。Windows 11 家庭版 x64（10.0.26200），Node.js 24.19.0、npm 11.17.0，Electron 42.11.15 / better-sqlite3 12.11.1；应用 0.1.0，数据库结构 3。依赖和锁文件未变。

| 文件 | 实际结果与范围 |
|---|---|
| [check-output.txt](check-output.txt) | 最终类型与格式检查通过 |
| [unit-tests.json](unit-tests.json)、[unit-output.txt](unit-output.txt) | 18 文件、375 项通过，无失败/跳过；新增 40 项练习契约/UTF-8/隐藏视图/统计检查 |
| [development-tests.json](development-tests.json)、[development-output.txt](development-output.txt) | 构建与开发 Electron 27/27 通过，原 19 项与新增练习/升级 8 项 |
| [package-output.txt](package-output.txt) | Windows x64 解包构建、原生模块重建成功，未制作新 NSIS |
| [packaged-tests.json](packaged-tests.json)、[packaged-output.txt](packaged-output.txt) | 解包 EXE 27/27 通过，子进程 PATH 仅 System32 |
| [开发生命周期](development-practice-lifecycle.json)、[解包生命周期](packaged-practice-lifecycle.json) | 顺序/数量/无空轮/单活动、修订冲突、有效游标但旧草稿拒绝、揭晓/自评/未评价/跳过/修改/结束、新轮默认状态 |
| [开发重开](development-practice-reopened.json)、[解包重开](packaged-practice-reopened.json) | 独立进程读回固定队列位置、已确认草稿与隐藏状态，外键检查为空 |
| [开发版本](development-practice-versions.json)、[解包版本](packaged-practice-versions.json) | 实际更新/归档后的本轮固定内容与图片、真实旧版作答/自评/收藏保留，新轮采用新版本 |
| [开发回滚](development-practice-rollback.json)、[解包回滚](packaged-practice-rollback.json) | 推进/回执/草稿/揭晓四种触发器故障，全部业务行与回执不变，可重试；诊断仅四个主动注入错误 |
| [开发持久化核实](development-practice-durability.json)、[解包持久化核实](packaged-practice-durability.json) | 真提交后响应异常能核实；提交后关闭测试连接时结果不明停写；重开读回/确认原回执，无重复推进；外层事务拒绝 |
| [开发限额](development-practice-limits.json)、[解包限额](packaged-practice-limits.json) | 中文精确 1MiB 持久化/超限不截断，非法输入与五类数据库约束实际拒绝 |
| 两份完整 Playwright 报告 | 另含 v2→v3 备份/保留/不重复升级、备份失败逐字节保持、DDL 回滚；原有 v1→当前结构、导入/窗口/线程/安全回归保持 |
| [package-inspection.json](package-inspection.json) | 13 个 ASAR 内 JS/HTML/CSS 与当前 out 逐字节一致，包含 practice 入口；旧 NSIS 哈希未改 |
| [static-checks.json](static-checks.json)、[manifest.json](manifest.json) | 编码/本地链接、10 个代码/配置文件两轮复查、原计划书/题库/依赖/渲染与预加载源码保持、源码/证据哈希 |

practice JSON 从最终 Playwright 原报告附件原样解码，未重新计算或摘要替代。仅使用明确生成的题库/图片小样本和临时目录，未接默认正式/开发数据库。生命周期统计不包含系统正确率，旧版本验证使用真实作答行，仍无历史查询界面。

复现：`npm run check`、`npm test`、`npm run test:desktop`、`npm run pack:dir`、`npm run test:packaged`。后续补充旧草稿随状态请求的四条拒绝断言后，重新运行最终两份 27 项报告。实际功能测试没有失败；静态复查处理外层事务与只读事务属性的测试包装边界。

本批新检查通过固定内部构建入口在真实 Electron/SQLite 执行，未创建练习 IPC/预加载/页面，也没有生产测试开关。故障注入包装实际提交或关闭测试连接，不能描述为真实断电测试。原有窗口回归的系统对话框/浏览器调用仍使用测试替身。

边界：未验证练习窗口、500ms 保存节奏、待保存输入的退出刷新、输入法/缩放、代码高亮/复制、图片放大、压力性能或新 NSIS 安装；正式题库审阅与人工体验仍待用户。M2 第一批完成，整阶段继续，未进入 M3。没有提交、推送或发布。
