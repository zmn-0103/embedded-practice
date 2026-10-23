# M1 第四批验证证据

日期：2026-10-20。Windows 11 家庭版 x64（10.0.26200），Node.js 24.19.0，npm 11.17.0；Electron 42.11.15 / better-sqlite3 12.11.1，应用 0.1.0，依赖与锁文件未改。

| 文件 | 实际结果与范围 |
|---|---|
| [check-output.txt](check-output.txt) | 最终类型与格式检查通过 |
| [unit-tests.json](unit-tests.json)、[unit-output.txt](unit-output.txt) | 正式 15 个文件、299 项通过，无失败/跳过；新增比较 13、预览 19、协议反例 5 |
| [development-tests.json](development-tests.json)、[development-output.txt](development-output.txt) | 开发构建与 Electron 14/14 通过，原有 8 项 + 本批 6 项 |
| [package-output.txt](package-output.txt) | Windows x64 解包构建成功，原生模块重建与 ASAR 打包；未制作新 NSIS |
| [packaged-tests.json](packaged-tests.json)、[packaged-output.txt](packaged-output.txt) | 解包 EXE 14/14 通过，子进程 PATH 仅 System32 |
| [开发首次导入](development-library-roundtrip.json)、[解包首次导入](packaged-library-roundtrip.json) | 80 题、三图、摘要与确认结果一致、重复确认仅一回执；预览后来源已移动 |
| [开发重开](development-library-reopened.json)、[解包重开](packaged-library-reopened.json) | 独立进程重开，80 个题干/答案/引用定义/指纹逐项对应，三图字节哈希/尺寸一致；旧令牌失效 |
| [开发变更](development-library-changes.json)、[解包变更](packaged-library-changes.json) | 元数据与内容版本、同路径换图、收藏/旧自评/测试旧版本引用保留、归档恢复、其他专题保持、修订号冲突及外键保护 |
| [开发回滚](development-library-rollback.json)、[解包回滚](packaged-library-rollback.json) | 第二专题触发故障后全库相关计数/修订号与回执不变，同快照重试成功；唯一诊断错误为主动注入故障 |
| 两份完整 Playwright 报告 | 还包含旧 M0 v1 升级/一致性备份、阻塞备份目录时原库逐字节保持、DDL 冲突事务回滚，以及原有 8 项回归 |
| [package-inspection.json](package-inspection.json) | 当前 ASAR 中 JS/HTML/CSS 与 out 逐字节比较；与真实运行分别记录 |
| [static-checks.json](static-checks.json)、[manifest.json](manifest.json) | 编码、文档链接、变更代码复查覆盖、原计划书/题库/依赖保持、源码与证据/产物哈希 |

上述 library JSON 从对应 Playwright 原报告附件原样解码。真实写入、迁移、来源改动与清理仅在测试生成的独立临时目录；没有读写默认正式/开发目录。

失败过程也保留：[首次开发失败](development-fixture-failure.json)和[输出](development-fixture-failure.txt)为两个测试夹具缺图，补充夹具后通过；[测试发现修正前报告](unit-discovery-before-fix.json)与[输出](unit-discovery-before-fix.txt)包含 tmp 恢复副本，561 项不作为当前结果；[配置类型失败](configuration-type-failure.txt)发生在打包前置检查，改用本地实际导出类型后最终通过。

复现顺序：`npm run check`、`npm test`、`npm run test:desktop`、`npm run pack:dir`、`npm run test:packaged`。测试脚本不会连接默认数据库。静态 ASAR 比对使用项目已有 @electron/asar 的只读提取，未手改生成文件。

边界：只验证内部服务和持久化字节，没有导入窗口、受控资源展示、真实练习/作答历史或性能验收。数据库历史引用测试表明确为夹具，不表示历史功能存在。图片仍仅头部检查。旧 NSIS 安装包保持 M0，未重装或发布；没有创建提交或推送。M1 整阶段仍需后续窗口流程验收。
