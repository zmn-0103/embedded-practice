# M4 第二批证据

日期：2026-10-22，Asia/Shanghai。本批用户授权继续开发，完成恢复执行、保护性备份、失败回退和重启。仅在显式独立临时数据目录执行恢复，没有恢复、覆盖或迁移默认正式/开发学习库；默认数据目录日志仅做存在性检查。

## 环境与范围

- Windows 11 x64，Node.js 24.19.0，Electron 42.11.15，better-sqlite3 12.11.1。正式结构仍为 6。
- [改前环境与快照](environment.json) 保留逐文件改前哈希和可恢复副本位置；Git 仍无提交、文件原来均未跟踪，未清理用户更改、提交、推送或生成新 NSIS。
- 12 个生产/构建文件和 9 个测试文件完成逐文件 Bug、可维护性两轮复查，实质改动重新复查；[范围核对](change-audit.json)按实际改前哈希检查。所有代码复查只证明静态检查，运行结果另列。
- [行为范围](../../M4第二批行为与验收.md)、[恢复架构](../../architecture/M4恢复执行与回退.md)和[使用方法](../../使用说明.md)描述最终链路；正式计划原文、依赖/锁文件、迁移、SQL 结构和原草稿控制器保持。

## 原始失败与后续修正

| 检查 | 原始结果及处理 | 原始证据 |
|---|---|---|
| 类型衔接 | 恢复入口 nullable IPC、UI 结构包含类型收窄、新测试替身字段与未使用导入、暂停测试误用非法题数 1 均有日志；按契约修正，没有放宽生产校验 | `typecheck-first.log`、`typecheck-second.log`、`typecheck-restore-tests.log`、`typecheck-final-candidate.log` |
| 首轮单元 | 532/533。旧预览清理 await 期间立即关闭，取消先于文件框创建，晚到流程仍打开文件框并悬挂；在 await 后重新检查关闭/导航/来源，原立即关闭测试保持，定向 20/20 后完整通过 | `unit-first.json`、`unit-ipc-fix.json`、`unit-final.json` |
| 新恢复首轮 | 开发 10/11；真实自动重启检查未能连接新进程。第二次同一检查 0/1 | `desktop-restore-first.json`、`desktop-restart-second.json` |
| 重启测试根因 | helper 多次 choose，包装了前一次阻止 relaunch 的测试替身，实际未调用原生重启。只捕获一次原始函数后 1/1 真实重启通过，保留 CDP 新进程和数据断言 | `desktop-restart-third.json`；二次失败的独立夹具在 `failed-workspaces/` |
| 新旧备份定向 | 38/39；旧空库预览精确比较遗漏新 UUID。补全 UUID v4 断言，原路径和完整摘要仍精确相等 | `desktop-focused-second.json` |
| 恢复保存/暂停 | 29/30；新增暂停场景传非法题数 1，先被输入校验拒绝。改为既有合法选项 20 后 1/1，仍要求暂停错误码与数据不变 | `desktop-focused-third.json`、`desktop-save-pause-fix.json` |
| 第一轮完整 | 开发 141/141、解包 141/141，282/282，零失败/跳过/flaky/重试；在本地保护备份可直接选择的收尾修改之前，不能冒充最终版本 | `desktop-full-first.json`、`desktop-full-first.log`、`desktop-output-first/` |
| 保护备份往返 | 新增读取例外只允许 `backups/` 内独立文件；真实选择保护备份、恢复原状态和保留来源字节，两形态各 1/1 | `desktop-protection-roundtrip.json` |
| 范围核对工具 | 首版把原 rg 未包含的 `.gitkeep` 误列为新增代码；按实际代码扩展名与改前副本修正，21 个代码文件都有复查 | `change-audit-first.json`、`change-audit.json` |

早期定向报告的 JSON、失败堆栈与内嵌附件保留；其中指向临时 `test-results` 的部分路径附件曾被后续运行清理，不能宣称这些早期图片全部留存。两轮完整结果的输出目录独立归档，最终附件另做逐项核对。

## 自动化期间“无法启动”提示

用户提供的[截图](reported-startup-error.png)来自自动测试期间，用户确认未手动启动。独立诊断复现：`firstWindow()` 仅表示窗口创建，页面还未加载完成时调用 `app.exit`，页面报 `ERR_FAILED (-2)` 并触发同一启动失败提示。[复现日志](startup-abort-diagnostic.json)保留错误及截获的标题/文案；截获只发生在诊断进程，避免再次弹原生提示。

自动化清理先等待页面 load，再强制结束；[修正后的诊断](startup-cleanup-verified.json)确认正常启动记录、无日志、无错误提示。生产启动异常没有被屏蔽。真实恢复重启及三个明确文件事务阶段的进程中断仍分别检查，不以正常退出替代中断。用户截图不是学习库损坏证据，历史键盘偏移/额外字符及 Alt+F4 原因也不由这次诊断改写。

## 最终实际检查

- 类型/格式、单元：533/533，26 文件；原 526 项按文件及完整名称逐项保留，见 `check-final.log`、`unit-final.json`、[基线核对](unit-baseline-comparison.json)。
- 源码和收尾 Windows x64 解包：`package-final.log`；未生成新 NSIS。
- 最终完整桌面：开发 142/142、解包 142/142，284/284，原各 123 场景逐项保留，新增各 19；全部只有一次结果、零失败/跳过/flaky/自动重试。见 `desktop-final.json`、`desktop-final.log`、[结果核对](results-summary.json)；完整输出在 `desktop-output-final/`。
- 最终 286 份附件逐项核对：42 个文件附件映射到独立归档，244 个内嵌附件解码保存，JSON 可解析、PNG 签名及每项哈希/长度检查，见 [attachments-final.json](attachments-final.json)。
- 包文件与稳定范围：[package-inspection.json](package-inspection.json) 检查 23 个构建/许可文件逐字节一致、运行元数据、EXE/ASAR/原生模块哈希、8 个关键范围文件保持、旧 NSIS 保持；首轮核对另存 `package-inspection-first.json`。
- [前批证据核对](prior-evidence-preserved.json)确认 M4 第一批 341 个封存文件保持；本批最终源码/文档和证据清单分别为 `source-manifest.json`、`evidence-manifest.json`。

## 覆盖和边界

真实 SQLite/文件检查包括：全新目录恢复 12 个业务表及图片字节、随机队列/版本/筛选/草稿/自评/收藏/历史/显示设置一致；源文件预览后被替换仍使用原副本；原生 relaunch 启动新进程后继续原轮；v1～v5 确认恢复并独立重开。`app_startup` 属于新进程启动记录，不要求计数倒回原备份值。

失败路径包括：未达自动保存时间的中文输入先确认入库并进入保护备份，恢复暂停拒绝设置/收藏/新轮写入；取消、保存失败、保护失败、副本损坏不替换；连接关闭失败、发布失败、自动回退失败保留可恢复原件；移动原件后/安装后/提交后退出，再启动优先处理事务，不误建空库。独立合成 WAL/SHM/journal 字节精确回退与未知目录不清理另验。

系统文件选择/确认是明确替身；实际自动重启新进程用 CDP 连接检查，其他故障场景阻止自动 relaunch 后独立启动，报告区分。合成伴随文件不是全部真实 WAL/磁盘/杀毒锁情形的证明；进程退出不是实际断电测试。

本批没有真实原生恢复确认签署、完整人工体验、系统 DPI、外部剪贴板/浏览器、大图、正式 20～30 题试用、新 NSIS 安装/升级、完整离线验收或 5,000 题/500 图性能实测。M4 软件链路已接通，完整人工体验仍待验，M5 未开展。旧 NSIS 和支持结构 5 以下的旧程序不能用于当前结构 6 数据。
