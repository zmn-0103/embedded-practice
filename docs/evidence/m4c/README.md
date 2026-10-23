# M4 第三批证据：数据位置与诊断入口

日期：2026-10-22。环境为 Windows 11 x64、Node.js 24.19.0、Electron 42.11.15、better-sqlite3 12.11.1；依赖/锁文件未变。开发形态启动本次 `out/main/index.js`，解包形态启动新生成的 `release/win-unpacked/embedded-practice.exe`，子进程 PATH 仅 System32。全部运行显式传入独立临时数据根，未连接默认正式或开发学习库。

范围和验收目标见[行为说明](../../M4第三批行为与验收.md)，接口与生命周期见[架构](../../architecture/M4数据位置与诊断入口.md)，每个代码文件的 Bug/边界及可维护性两轮静态复查见[复查记录](../../代码复查记录.md)。正式结构保持 6，计划书、依赖/锁文件、数据库迁移与原练习草稿控制器保持；本批包括有实测依据的备份路径大小写限定修复。

## 当前实际结果

| 检查 | 实际结果 | 原始材料 |
|---|---|---|
| 类型与格式 | 最终通过 | [最终检查](check-final.log)，单元与桌面测试源另见 typecheck-tests-first.log、typecheck-desktop-first.log |
| 最终单元 | 561/561，28 文件，失败/待执行 0；原 533 项完整保留，新增 28 项 | [最终 JSON](unit-final.json)、[日志](unit-final.log)、[基线逐项比较](unit-baseline-comparison.json) |
| 最终源码及 Windows x64 解包构建 | 通过，未制作新 NSIS | [构建日志](package-final.log) |
| 新增及原启动/坏库/设置定向 | 大小写修复前开发 19/19 | [定向 JSON](desktop-target-first.json)、[日志](desktop-target-first.log)、desktop-output-first/ |
| 大小写修复前完整回归 | 开发 149/149、解包 149/149，298/298；属于前一轮软件 | [首轮 JSON](desktop-full-first.json)、[日志](desktop-full-first.log)、desktop-output-full-first/ |
| Windows 大小写专项 | 最终代码开发/新解包各 1/1 | [专项 JSON](desktop-case-final.json)、[日志](desktop-case-final.log)、desktop-output-case-final/ |
| 第二轮完整回归 | 299/300；v5 backup-blocked 的旧全局 status 匹配两个元素，原始失败保留 | [第二轮 JSON](desktop-full-second.json)、[日志](desktop-full-second.log)、desktop-output-full-second/ |
| 数据库状态定位专项 | 明确原数据库状态区后，两种形态合计 14/14，原保护断言保持 | [定向 JSON](desktop-status-target.json)、[日志](desktop-status-target.log)、desktop-output-status-target/ |
| 最终完整回归 | 开发 150/150、解包 150/150，300/300；原各 142 项完整保留，零失败/跳过/flaky/自动重试，每项一次结果 | [最终 JSON](desktop-final.json)、[日志](desktop-final.log)、[逐项汇总](results-summary.json)、desktop-output-final/ |
| 最终附件 | 298 份，44 文件/254 嵌入，全部按路径/字节/SHA-256 核对，JSON 严格解析与 PNG 签名检查 | [附件清单](attachments-final.json)、artifacts/，实际解包暗色/22px 截图已目视 |
| 修改范围 | 19 个代码文件：10 生产/样式、9 测试，逐文件两轮复查 | [实际哈希差异](change-audit.json)及上述复查记录 |
| 包核对 | 23 个运行/许可文件逐字节对应，运行元数据与原生模块核对，原 NSIS 保持 | [最终包记录](package-inspection-final.json) |
| 历史证据 | M4 第一批 341、第二批 559 个封存文件 SHA-256 全部一致 | [历史核对](historical-evidence-verification.json) |

系统文件管理器打开、系统文件/确认对话框在自动化中使用明确替身；主进程 IPC、真实文件目录、普通文件冲突、Windows junction、SQLite 和备份替换走实际程序。没有把系统接口返回成功写成真实 Explorer 视觉通过。原有自动重启与恢复失败回退场景继续保留，不由新的重启替身场景替代。

## 新增场景与实际数据

`tests/e2e/data-locations.spec.ts` 新增 8 个场景，每种运行形态分别执行：

1. 中文/空格实际数据目录与三个固定位置，读取没有建目录；打开按需建立空目录，完整学习快照、图片字节、草稿、队列、历史、自评/收藏、设置与启动记录不变；暗色/22px、760px 窗口长路径可达。
2. 参数/来源拒绝，实际普通文件与 junction 目录拒绝，修正独立夹具后重试成功，原数据库保持。
3. 读取坏响应可重试，系统返回错误明确失败且不泄露任意内容，重试恢复，原数据保持。
4. 实际损坏数据库仍提供数据与日志位置入口，坏库原字节保持。
5. 打开期间导航/显示保存/备份受控，重复调用忙碌；正常退出注销接口并等待在途请求结算。
6. 恢复先暂停并排空目录操作，再创建保护性备份，旧打开结果失效，实际恢复完成。
7. 切页后的旧位置读取不能覆盖新面板。
8. 真实已有 `Logs`、`Backups`、`Backup-Staging` 可打开、导出、读取内部独立备份、保护生成、恢复及独立进程重开；所选备份原字节保持。夹具复制的是已校验的一致性导出文件。

单元检查覆盖严格四项位置结果、固定枚举与错误结构、五类不可信来源、参数拒绝、非目录/链接/路径变化、缺根/写入/系统错误、并发/暂停/关闭/导航代次与晚到来源变化。单元文件系统和系统打开均使用替身，真实目录语义由 Electron 场景补足。

## 原始缺陷和工具错误

[windows-case-first.json](windows-case-first.json) 保留原代码在实际 `Logs` 目录下返回 FILE_ERROR 的结果；请求路径与 realpath 虽仅大小写不同，平台相对路径为空。[backup-case-first.json](backup-case-first.json) 保留 `Backups` 保护生成与内部选择、`Backup-Staging` 暂存的同类误拒。两份均来自显式独立临时目录，不是用户正式数据恢复失败。

修复采用平台路径关系判断同一位置，并保留 lstat 目录/链接、运行库/硬链接/伴随文件、事务和哈希验证；两个专项结果与最终完整回归分别记录。大小写修复前包核对在 [package-inspection-first.json](package-inspection-first.json)，不能用于证明最终包。

第二轮完整 299/300 的失败是全局 `getByRole('status')` 同时匹配原数据库错误区与“正在读取数据位置”提示。保留原始报告、日志和 error-context；v5/v4/v1 三处同类断言只限定为原 `.service-status`，未改变错误文本、原数据库字节、全业务/版本、保护备份断言，也没有修改生产迁移或添加自动重试。随后定向两形态 14/14；最终完整回归另记。

首次单元定向命令的字面通配符没有被 PowerShell 展开，Vitest 未匹配测试，退出 1，见 [unit-target-first.log](unit-target-first.log)及 JSON。改为明确两个文件后 27/27，大小写新增后 28/28，分别见 unit-target-second 和 unit-target-case 报告。大小写修复前全套单元 560/560 保留在 unit-before-case 报告，最终是 561/561。

包核对脚本一次写成不存在的 schema.ts，历史核对脚本一次误要求无 bytes 字段的旧清单提供字节数，均已按实际文件/清单修正；原因与退出状态见 [tooling-notes.json](tooling-notes.json)，没有修改应用或历史证据来绕过核对。上述工具失败不计为功能通过，也不改写为生产故障。

## 最终包与范围

本批使用整个 `release/win-unpacked/`，不能只复制单个 EXE。旧 NSIS 没有重制，仍不能打开当前结构 6 的数据库。

| 文件 | SHA-256 |
|---|---|
| 新解包 EXE | `eeac64484ef0f1208273b625e95796ad94705abd9529db602dceeabfe102d3a6` |
| 新 app.asar | `ff9cb31b662f2e9a029c5241aa7e51a81feb7cf8807d8eeee4093f904d8410d7` |
| better_sqlite3.node | `24e2e3ca5a829572239718fbca35b873ba4975655d29c56a93f1880e3775d9b8` |
| 保持的旧 NSIS | `641eef07330151d6343047c3aad2639a70c442b46a26426cd74b281d73a091d8` |

开工快照与环境在 [environment.json](environment.json)；最终源码清单为 [source-manifest.json](source-manifest.json)，本批封存证据清单为 [evidence-manifest.json](evidence-manifest.json)，均收尾逐项核对。前两轮完整报告和错误上下文保持，运行顺序及状态见 [prior-run-summary.json](prior-run-summary.json)。没有提交、推送、发布或正式学习数据恢复。

原生 Explorer 实际打开、真实备份/恢复选择与确认、完整中文输入法/退出、Windows DPI、外部编辑器双向剪贴板、真实浏览器和大图仍需人工验收；旧键盘位置偏移、额外输入字符及候选 Alt+F4 一次未关闭原因仍未知。M5 正式 20～30 题试用、新 NSIS 安装升级、完整离线、5,000 题/500 图性能未开展。测试与静态复查不构成完整人工或发布验收。
