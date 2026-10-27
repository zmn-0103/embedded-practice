# M2 第三批验证证据

日期：2026-10-20（Asia/Shanghai）。Windows 11 x64（10.0.26200），Node.js 24.19.0、npm 11.17.0，Electron 42.11.15 / better-sqlite3 12.11.1；应用 0.1.0、数据库结构 3。范围为长内容切题定位/焦点和实际强制终止后的已确认状态恢复，不推进 M3。行为约定见[第三批](../../M2第三批行为与验收.md)，人工项见[独立清单](../../M2人工验收清单.md)。

## 实际运行

| 文件 | 结果与范围 |
|---|---|
| [改前副本与环境](before.json) | 383 个源文件、文档、配置、题库和历史证据的副本及哈希，旧 M0 NSIS 哈希 |
| [未修源码构建](baseline-build-output.txt) | 原应用源码构建成功，新增测试已纳入类型检查 |
| [首次新增用例](before-fix-tests.json)、[输出](before-fix-output.txt) | 5 项失败：三档 zoom 新题标题不在视口、末题结果未聚焦，共四项实际缺口；另一项为 Windows 测试目标错误导致的关闭等待超时 |
| [原构建强制终止](forced-stop-baseline-tests.json)、[输出](forced-stop-baseline-output.txt) | 修正为终止真实 Electron 主进程后，未重建页面修复的原 out 即 1/1 通过；不将测试目标错误当作应用恢复失败 |
| [类型与格式](check-output.txt) | 最终检查通过，含完整截图采集修改后的 TypeScript/格式检查 |
| [单元报告](unit-tests.json)、[输出](unit-output.txt) | 20 文件、405 项全部通过，无失败/跳过 |
| [页面修复构建](build-output.txt) | 主进程、预加载、页面构建成功 |
| [定向回归](focused-tests.json)、[输出](focused-output.txt) | 定位修复和正确强制终止后的新增五项全部通过 |
| [截图修正前完整开发回归](development-before-native-capture-tests.json)、[输出](development-before-native-capture-output.txt) | 46/46，通过后检查截图发现页面 zoom 引起裁切；行为断言保持，不改写此报告 |
| [最终完整开发回归](development-tests.json)、[输出](development-output.txt) | 46/46，无失败/跳过/重试；包含原 41 项与新增 5 项，完整窗口截图使用 Electron capturePage |
| [Windows 解包构建](package-output.txt) | 重新构建原生模块与 ASAR，未生成新 NSIS |
| [最终完整解包回归](packaged-tests.json)、[输出](packaged-output.txt) | 新 Windows x64 解包 EXE 46/46，无失败/跳过/重试，子进程 PATH 仅 System32 |
| [结果与截图汇总](results-summary.json) | 首次失败分类、最终统计、修复前后滚动/标题位置、六张完整截图的尺寸及提取附件 |
| [产物核对](package-inspection.json) | 13 个运行文件与 6 个许可文件逐字节一致，旧 M0 NSIS 哈希保持 |
| [人工步骤静态解析](manual-instructions-static.json) | 清单中的 PowerShell 启动代码只解析语法，未执行，`executed=false` |
| [收尾静态检查](static-checks.json)、[当前清单](source-manifest.json) | 修改范围、两轮复查覆盖、UTF-8、链接与原始计划/题库/依赖/核心代码保持分别记录；清单以改前 383 文件为基准，新证据另列 |

## 长内容定位与完整截图

原构建在从长答案推进到下一长题后保留原滚动深度，新标题完全在视口外；修复后页首、标题和进度可见，标题接收焦点。上一题、明确结束和末题完成也通过；同题自动保存保持原滚动和输入焦点。

| Electron 页面 zoom | 修复前 scrollY / 标题 y（CSS px） | 修复后 scrollY | 开发完整窗口 | 解包完整窗口 |
|---|---|---|---|---|
| 100% | 2833 / -2633.23 | 0 | [截图](development-long-content-next-100.png)、[状态](development-long-content-advance-100.json) | [截图](packaged-long-content-next-100.png)、[状态](packaged-long-content-advance-100.json) |
| 125% | 2980 / -2780.40 | 0 | [截图](development-long-content-next-125.png)、[状态](development-long-content-advance-125.json) | [截图](packaged-long-content-next-125.png)、[状态](packaged-long-content-advance-125.json) |
| 150% | 3076.67 / -2877.22 | 0 | [截图](development-long-content-next-150.png)、[状态](development-long-content-advance-150.json) | [截图](packaged-long-content-next-150.png)、[状态](packaged-long-content-advance-150.json) |

修复前附件：[100%](before-long-content-advance-100.json)、[125%](before-long-content-advance-125.json)、[150%](before-long-content-advance-150.json)。末题完成：[开发](development-long-content-finished.json)、[解包](packaged-long-content-finished.json)。

最终六张截图均为 Electron capturePage 的完整 1124×741 可视区域。首次浏览器截图在 125%/150% 下仅为 899×593、749×494，已识别为裁切，不用它们冒充完整窗口。此处 zoom 是应用页面渲染缩放，不等于真实 Windows 系统 DPI。

## 实际强制终止与恢复

测试先在第一题输入、揭晓并自评“不熟”，再进入第二题确认草稿已保存，随后输入一段尚未提交尾部。读取实际 Electron 主进程 PID，核对 userData 属于本场景临时目录后 SIGKILL，等待真实 close，再核对 SQLite。独立进程重开后，继续同一会话、第二题已确认草稿和原位置；第一题输入/揭晓/自评保持，外键为空且 quick_check 为 ok，未把未提交尾部当成已确认保存。

- 开发：[终止前确认与终止后状态](development-forced-stop-confirmed.json)、[独立进程恢复](development-forced-stop-recovered.json)。
- 解包：[终止前确认与终止后状态](packaged-forced-stop-confirmed.json)、[独立进程恢复](packaged-forced-stop-recovered.json)。

Windows 下 Playwright 使用 shell 启动，process() 可能是启动外壳。首次仅终止外壳导致等待超时；修正测试后原构建已经通过，未修改生产保存/退出或事务来规避失败。本场景不是正常关闭、真实断电或系统关机验证；未提交按键没有恢复承诺。

## 复现与边界

使用 `npm run check`、`npm test`、`npm run build` 和 `npm exec -- playwright test --project=development`；随后 `npm run pack:dir` 并执行 `npm exec -- playwright test --project=packaged`。新增场景可用 `tests/e2e/practice-window.spec.ts --grep 'M2 第三批'` 定向筛选。

生产改动仅 `PracticePane.tsx`，测试改动仅 `practice-window.spec.ts`；两轮静态复查见[记录](../../代码复查记录.md)。原始计划书、题库、依赖和锁文件、主进程、预加载、共享契约、数据库、保存控制器、事务、样式和 CSP 保持。没有新增生产测试入口、网络能力、提交、推送或发布。

所有启动、PID 终止、写入、故障和数据库读取均限定在本场景创建的进程/独立临时目录，未连接正式或默认开发数据。系统选择框、浏览器、剪贴板与退出提示仍沿用明确测试替身；真实中文输入法/Windows DPI、人工系统交互、正式题库审阅、长期体验、压力性能、新 NSIS 安装升级及完整备份恢复未因此验收。M2 软件与本批收尾有对应证据，完整人工验收按清单另行记录，M3～M5 未推进。
