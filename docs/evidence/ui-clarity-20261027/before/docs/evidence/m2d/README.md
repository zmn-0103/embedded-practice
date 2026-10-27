# M2 第四批证据：原生输入与键盘可见性

收尾日期：2026-10-21，接续 2026-10-20 的验证，原始日志保留实际 UTC 时间。Windows 11 x64（10.0.26200）、Node.js 24.19.0、npm 11.17.0、Electron 42.11.15、better-sqlite3 12.11.1；应用 0.1.0，数据库结构 3。范围见[行为与验收](../../M2第四批行为与验收.md)。

## 实际问题与修复

原生 Tab 从“我的答案”折叠标题进入输入框后，第一行被底部 sticky 操作区遮住。继续键入，原生无障碍树显示内容已改变且已保存，但视口仍看不到输入文字。保留[原生修复前截图](native-keyboard-before-fix.jpg)和[原始观察](native-actions.json)。

PracticePane 仅在输入框获得焦点时，根据实际边框、内边距、行高与操作区几何判断遮挡，必要时将输入框顶部移到可见区域；自动保存不触发定位。生产代码只改该组件，另补现有 Electron 用例；逐文件 Bug/优化复查见[记录](../../代码复查记录.md)。

| 检查 | 实际结果 | 原始证据 |
|---|---|---|
| 原构建新增场景 | 3/3 失败，均在第一行命中悬浮区处检出问题 | [报告](before-fix-tests.json)、[输出](before-fix-output.txt)、[100%](before-fix-keyboard-100.png)、[125%](before-fix-keyboard-125.png)、[150%](before-fix-keyboard-150.png) |
| 修复首轮定向 | 1 通过、2 失败；三档输入可见/保存已通过，后两项错误要求 Shift+Tab 的浏览器正常滚动保持旧坐标 | [报告](focused-first-tests.json)、[输出](focused-first-output.txt) |
| 修正再次聚焦断言后的定向 | 3/3 通过；保留首轮遮挡、保存不滚动与持久化断言，分别检查 preventScroll 再聚焦和真实 Shift+Tab/Tab 后可见 | [报告](focused-tests.json)、[输出](focused-output.txt)、[修复后 150%](fixed-keyboard-150.png) |
| 类型与格式 | 通过 | [输出](check-output.txt) |
| 单元检查 | 20 文件、405/405 通过，无失败/跳过 | [报告](unit-tests.json)、[输出](unit-output.txt) |
| 当前源码构建 | 通过 | [输出](build-output.txt) |
| 完整开发构建回归 | 49/49 通过，无失败/跳过/重试 | [报告](development-tests.json)、[输出](development-output.txt) |
| Windows 解包构建 | 通过，重建原生模块和 ASAR | [输出](package-output.txt) |
| 完整 Windows 解包 EXE 回归 | 49/49 通过，无失败/跳过/重试；子进程 PATH 仅 System32 | [报告](packaged-tests.json)、[输出](packaged-output.txt)、[100%](packaged-keyboard-100.png)、[125%](packaged-keyboard-125.png)、[150%](packaged-keyboard-150.png) |
| 产物核对 | 13 个运行文件和 6 个许可文件逐字节一致，旧 M0 NSIS 哈希未变 | [结果](package-inspection.json) |

[汇总](results-summary.json)从原始报告读取数量、失败与第一行命中几何；三档均为 Electron 页面 zoom，不是 Windows 系统 DPI。

## 原生 Windows 自动化

这组操作使用 Computer Use 的 Windows 输入、无障碍树和原生窗口截图，不替换应用的文件选择框或剪贴板。所有输入都是明确标识的生成测试数据，独立临时目录与程序位置见[环境](environment.json)。原生观察逐次保存在[native-actions.json](native-actions.json)。它们与 Playwright 回归、人工验收分别认定。

| 操作 | 实际结果与范围 | 证据 |
|---|---|---|
| 系统文件选择框 | 实际取消后显示取消提示；重新选择带中文/空格路径的 Markdown，预览新增 3 题并确认导入 | 原始观察中的 `real-file-dialog-cancelled`、`real-file-dialog-selected-preview`、`native-import-confirmed` |
| 原生 Tab 输入可见性 | 新 EXE 按“题目标题 → 复制 → 图片 → 折叠标题 → 输入框”的相同顺序进入，文字可见 | [修复后截图](native-keyboard-after-fix.jpg) |
| 真实中文输入法 | 系统配置为 Microsoft Pinyin；实际 n 产生候选、Escape 取消为空，再以 n/i/h/空格选词得到“你好”，逗号键得到中文逗号，回车产生换行，最终保存 | [系统输入法标识](input-method-profile.json)、[候选窗](native-ime-candidate.jpg)、[已上屏保存](native-ime-committed.jpg) |
| 系统剪贴板 | 通过原生 Enter 激活复制代码，再用 Ctrl+V 粘入作答框，保留中文注释、换行和原文；覆盖本程序复制及本程序粘贴，未覆盖外部编辑器双向互操作 | [实际粘贴](native-clipboard-paste.jpg)、[逐字 SQLite 核对](fixed-native-before-reopen-database.json) |
| 原生揭晓与推进 | Tab/Enter 揭晓后点击“掌握”，只进入第 2/3 题，第二题保持未揭晓 | 原始观察中的 `fixed-native-keyboard-revealed`、`fixed-native-rated-advanced-second-question` |
| 正常关闭与重开 | 原生 Alt+F4 关闭，确认原进程退出，再以同一独立目录重开；继续第 2 题草稿正确，上一题中文/代码/揭晓/掌握自评仍在；本组关闭前已经显示已保存 | [关闭前](native-before-normal-close.jpg)、[进程重开](fixed-native-reopened-process.json)、[第二题恢复](native-recovered-second-question.jpg)、[第一题恢复](native-recovered-first-question.jpg)、[恢复后数据库](fixed-native-after-reopen-database.json) |
| 测试窗口收尾 | 使用正常关闭，最终无本次应用窗口和进程遗留 | [窗口](native-final-windows.json)、[进程](native-final-process.json) |

初始原构建的正常关闭/重开也已检查，证据为 [normal-close-database.json](normal-close-database.json)、[normal-close-process.json](normal-close-process.json) 与原始观察。新构建继续同一测试会话并核对 ID，外键与 quick_check 通过。未等 500ms 即关窗由现有 Electron 场景覆盖；本组原生关闭不扩大为该时序证明。

辅助核对曾遇到两处工具差异：Windows ASAR 提取需将路径规范为系统分隔符；node:sqlite 返回无原型行对象，与 JSON 快照做严格比较前先转成普通对象。修正核对方式后逐字/逐字段比较通过，未修改应用、数据库或放宽内容断言。原生系统文件框的无障碍索引缓存曾不可用，重新观察后按截图坐标完成同一选择操作；工具定位失败不计为应用故障。

## 保留边界

本批可进行 M2 源码开发、构建、数据库验证和真实 Windows 输入走查，未发现工具链或桌面连接阻塞。真实 Windows 100%/125%/150% DPI、组合输入中揭晓/切题/关窗、外部编辑器双向剪贴板、系统浏览器、大图与完整人工体验仍待按[人工清单](../../M2人工验收清单.md)检查。两像素测试配图不证明大图体验，正式题库由用户审阅。

M2 主要软件闭环与本批修复通过对应验证，完整人工验收仍待完成。M3～M5 未推进，新 NSIS 安装升级、完整备份恢复和压力性能未验收。没有连接正式/默认开发学习库，没有提交、推送或发布；旧 M0 NSIS 保持原样。改前副本及 434 文件哈希位于 `tmp/m2d-before-9abc3753002c4c058c8d30e2b79139ac/`。

收尾文件核对见[改动清单](change-audit.json)和[当前哈希](source-manifest.json)：原有 434 个文件中 424 个保持原样，10 个变化限定为一个生产组件、一个测试文件和八个说明/记录文件。原计划、题库、依赖/锁文件与后端保持；文档本地链接和 UTF-8 静态结果见[文档核对](documents-static.json)。
