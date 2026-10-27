# M1 第三批验证证据

日期：2026-10-20。Windows 11 家庭版 x64（10.0.26200）、Node.js 24.19.0、npm 11.17.0；应用版本 0.1.0，Electron 42.11.15 / better-sqlite3 12.11.1。没有新增依赖或修改锁文件。

| 文件 | 实际结果与范围 |
|---|---|
| [check-output.txt](check-output.txt) | 最终类型与源码/配置格式检查通过 |
| [unit-tests.json](unit-tests.json)、[unit-output.txt](unit-output.txt) | 13 个文件，262/262 通过，无失败或跳过；原有 212 项加协议 23、生命周期 9、故障 18 |
| [development-output.txt](development-output.txt)、[development-tests.json](development-tests.json) | 最终生产构建与开发 Electron 8/8 通过，包含新增 3 项真实线程场景 |
| [package-output.txt](package-output.txt) | `npm run pack:dir` 成功，重新构建 Windows x64 解包程序，未制作 NSIS 包或发布 |
| [packaged-output.txt](packaged-output.txt)、[packaged-tests.json](packaged-tests.json) | 解包 EXE 8/8 通过，应用子进程 PATH 仅含 Windows System32 |
| [开发快照](development-worker-snapshot.json)、[解包快照](packaged-worker-snapshot.json) | 两专题 80 题，PNG/JPEG/WebP 的字节/哈希/尺寸，主线程 ID 0、后台 ID 与退出一致 |
| [开发控制](development-worker-controls.json)、[解包控制](packaged-worker-controls.json) | 忙碌、缺失文件、重试得到 80 题、取消、期限；创建的四个线程均已退出 |
| [开发关闭](development-worker-shutdown.json)、[解包关闭](packaged-worker-shutdown.json) | 关闭服务取消任务，确认线程退出并拒绝新请求 |
| [package-inspection.json](package-inspection.json) | ASAR 内 10 个 JS/HTML/CSS 文件与本次 out 构建逐字节相同；这是静态检查，真实运行另有上述报告 |
| [development-eval-failure.json](development-eval-failure.json) | 首次真实测试 3 项失败：测试回调缺少全局 require，尚未进入导入服务；修正测试加载方式后全部通过 |
| [static-checks.json](static-checks.json) | 严格 UTF-8、本地文档链接、12 个本批代码/配置文件的两轮记录、原计划书与附件一致性 |
| [manifest.json](manifest.json) | 本次源文件、依赖、文档、样本、运行报告及产物 SHA-256；历史批次证据仍单独保留 |

真实线程测试复制题库与三张自建 2×3 图片到独立临时目录；来源移动、SQLite 启动记录和所有清理仅作用于该目录。测试没有访问正式/开发默认数据目录，没有把样例自动导入数据库。图片字节只在内部服务准备并回传，未完成显示或数据库持久化。

三个 worker JSON 是对应 Playwright 报告内附件的原样解码，保留创建/退出 ID 与资源摘要。主循环计数只证明本例等待期间主进程继续执行，不证明最大批次的窗口性能或内存指标。1ms 期限用于触发实际超时路径，默认业务期限仍为 120 秒。

已处理的问题：最小 Worker 替身最初受原生事件返回类型约束，接口已收紧；Playwright 参数字面量和动态报告索引已明确类型；真实测试改为内置模块接口和 createRequire 加载；收尾复查补充文本与图片合计下界。静态 ASAR 提取命令首次使用正斜杠路径未找到文件，按已安装工具的 Windows 路径规则规范化后，10 文件比对通过，未修改打包产物。详细两轮结论见[代码复查记录](../../代码复查记录.md)。

复现：依次执行 `npm run check`、`npm test`、`npm run test:desktop`、`npm run pack:dir`、`npm run test:packaged`。ASAR 检查使用项目已有 `@electron/asar`，给 extractFile 的内部路径经过本机 path.normalize。原始源码与构建产物对应关系记录在清单中。

边界：工作线程没有接入窗口或应用退出协调；预览令牌、变更摘要、确认事务、版本/归档、图片入库和导入界面尚未完成。未进行完整像素解码、全新电脑验收、性能实测或本批 NSIS 安装。M0 安装包 SHA-256 仍为 `641EEF07330151D6343047C3AAD2639A70C442B46A26426CD74B281D73A091D8`。没有创建提交、推送或发布，M1 整阶段继续开发。
