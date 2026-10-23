# M1 第二批验证证据

日期：2026-10-20。Windows 11 家庭版 x64（10.0.26200）、Node.js 24.19.0、npm 11.17.0；应用版本仍为 0.1.0。Electron 42.11.15 / better-sqlite3 12.11.1 未改，本批没有制作或安装新安装包。

| 文件 | 实际结果与范围 |
|---|---|
| [check-output.txt](check-output.txt) | `npm run check`：主进程/界面类型及代码/配置格式通过 |
| [unit-tests.json](unit-tests.json) | 10 个文件，212/212 通过；原有 168 项及新增 44 项，无失败或跳过 |
| [desktop-output.txt](desktop-output.txt) | `npm run test:desktop` 实际构建与开发 Electron 输出 |
| [desktop-tests.json](desktop-tests.json) | 原有 5/5 桌面场景通过：异常库保护、关闭重开、窗口隔离与内容策略 |
| [static-checks.json](static-checks.json) | UTF-8、本地文档链接、复查记录与原始计划书一致性 |
| [manifest.json](manifest.json) | 源码/依赖/夹具/模板/示例及报告哈希、环境与结果摘要 |

新增 44 项分别为：文件快照 5、真实图片 18、预算 7、完整批次 11、实际限额链路 3。所有修改/移动/超限样本与 Windows junction 均在新建的独立临时目录中执行；GPIO 题库、示例和模板只读，不连接正式数据库。

证据区分：真实文件读取和路径测试在 Node 中执行；来源变化与失败关闭使用真实句柄加故障注入；200MiB 边界为预算逻辑检查，未生成完整 200MiB 图片批次；两份合法专题的 10,001 题为实际文件链路。现有桌面测试不等于图片导入在 Electron 窗口中可用。

复现：`npm run check`、`npm test`、`npm run test:desktop`。测试夹具图片由 Pillow 12.3.0 自建生成（2×3 RGB），[来源说明](../../../tests/fixtures/images/README.md)；示例复制同一自建夹具。

逐文件复查补充了显式行列复制以避免图片 URL/alt 进入错误对象、选择列表快照、资源缓存类型复核、WebP 长度检查和测试失败时的保护性关闭。最终检查通过；图片只检查签名与头部尺寸，不宣称完整像素解码或所有损坏检测。工作线程、预览/提交、数据库版本与归档、图片入库和界面尚未实现，M1 未整阶段验收。
