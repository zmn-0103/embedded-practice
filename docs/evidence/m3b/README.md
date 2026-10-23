# M3 第二批：随机练习与固定队列恢复证据

日期：2026-10-21。范围见[行为与验收](../../M3第二批行为与验收.md)，实现见[随机练习与模式升级](../../architecture/M3随机练习与模式升级.md)。本批接续 M3 第一批及收藏修复；未开发单题历史、更新待复习展示、主题字号或完整恢复。

## 实际结果

环境为 Windows 11 x64（10.0.26200）、Node.js 24.19.0、npm 11.17.0、Electron 42.11.15、better-sqlite3 12.11.1，应用 0.1.0，当前数据库结构 4。全部运行使用 `launchApplication` 创建的显式独立临时目录和生成题库，解包子进程 PATH 仅 System32；文件框为明确替身，其余练习、随机 SQL、IPC、SQLite 和进程恢复实际执行。改前 556 文件副本及哈希见[环境](environment.json)。

| 检查 | 实际结果与证据 |
|---|---|
| 类型与格式 | [通过](check.log)，测试采样修正前[再次通过](check-final.log)，最终收尾见 check-closeout.log |
| 全部单元检查 | 21 文件，430/430，零失败/跳过；[报告](unit-tests.json)、[输出](unit.log) |
| 新 v3 迁移定向 | 首轮 6/6，[报告](migration-first-tests.json)、[输出](migration-first.log) |
| 原生换行赋值基准后恢复定向 | 正常/强制结束 2/2，[报告](random-newline-probe-tests.json)、[输出](random-newline-probe.log) |
| 源码构建 | [通过](build.log) |
| Windows x64 解包构建 | [通过](package.log)，未生成新 NSIS |
| 完整开发构建 | 68/68；[136 项原始报告](final-full-tests.json)、[输出](final-full.log)按 projectName 区分 |
| 完整 Windows 解包 EXE | 68/68；同一原始报告，两个项目均零失败/跳过/重试 |
| 首页截图采样修正后 | 两种运行形态各 1 项通过，业务/数据库断言保持；[报告](home-capture-tests.json)、[输出](home-capture.log) |
| 包内容核对 | 13 个运行文件、6 个许可文件逐字节相同，原生数据库模块一致，旧 NSIS 哈希不变；[结果](package-inspection.json) |

[汇总](results-summary.json)直接读取原始报告，逐项比较前次 57 项名称/文件集合，两个项目的原各 57 项均完整保留，新增各 11 项。没有将定向运行重复加到完整场景数量，也未增加失败自动重试。

实际执行使用 `npm run check`、`npx vitest run tests/unit`、`npm run build`、`npm run pack:dir`，桌面运行使用 `npx playwright test`，通过 `--reporter=list,json` 和独立输出目录分别保留报告；定向命令在上述原始日志中对应各文件及场景。固定依赖与锁文件保持。

## 新增 11 项桌面场景的实际内容

- 六项迁移：冻结旧 SQL 与改前生产定义在展开限额常量后逐字符一致，[来源核对](legacy-schema-source.json)。旧库含活动/完成/结束轮、草稿/揭晓/自评/跳过、图片/收藏及不含 mode 的原请求回执。升级备份与新库全部业务表逐字段相同，旧请求仍命中原回执，实际窗口继续旧顺序轮；重开不重复升级。备份失败、DDL 冲突、未知触发器、未知索引和外键破坏分别停止并保留原数据。成功[开发](development-migration-v3-preserved.json)/[解包](packaged-migration-v3-preserved.json)，失败分支的完整保留记录也按运行形态存放在本目录。
- 一项受控 SQLite：仅本测试连接覆盖 random()，24 个完整候选均参与取样，10 题可包含顺序列表尾部；原请求重试不再调用 random；数量 20/50/全部、交集、单题、随机键相同仍不重复、无匹配/答案搜索保护、中途插入失败整笔回滚和同请求重试均核对。收藏/掌握筛选状态在独立测试库中直接构造，实际收藏交互由原回归覆盖。记录见[开发](development-random-controlled-sql.json)/[解包](packaged-random-controlled-sql.json)。这不是随机分布或性能统计检验。
- 两项真实随机恢复：生产连接使用原生 random()，输入/揭晓/掌握后到第二题保存；分别正常关窗和核对 userData 后终止真实 Electron PID，确认退出再独立重开。队列、模式、版本、已保存草稿及自评保持，首页改为顺序并筛到 0 题仍可继续原随机轮，返回上一题保持原答案/作答/自评。正常[开发](development-random-recovery-normal.json)/[解包](packaged-random-recovery-normal.json)，强制[开发](development-random-recovery-forced.json)/[解包](packaged-random-recovery-forced.json)。只证明已确认内容恢复，不承诺未提交按键。
- 一项版本/归档：当前随机轮返回首页，导入全部更新并缺少本轮第二题的新快照；旧固定队列、内容版本及作答保持，已归档题仍可在旧轮查看原答案。新轮只使用最新 23 题、排除归档且空作答/隐藏答案。记录见[开发](development-random-fixed-versions.json)/[解包](packaged-random-fixed-versions.json)。
- 一项成功响应丢失：真实建轮提交后测试丢弃一次响应，界面锁定原模式/数量/筛选，重试后完整队列、会话与回执快照不变，没有另建随机轮。记录见[开发](development-random-start-retry.json)/[解包](packaged-random-start-retry.json)。

## 本轮失败与修正

1. 新随机测试首轮 [3 通过/2 失败](random-first-tests.json)，[输出](random-first.log)：将 SQLite 保留的 CRLF 与重开 textarea.value 的 LF 混比。第二轮尝试按“插入后也应为 LF”建立基准，仍 [3 通过/2 失败](random-separated-tests.json)、[输出](random-separated.log)，说明该假设在当前自动化编辑路径不成立。
2. 随后分别记录实际编辑值、输入原文、同环境新建原生 textarea 赋值结果和数据库快照。实测编辑插入后值/数据库为 CRLF，原生 value 赋值及重开后值为 LF；恢复后的数据库和队列仍完整保留原 CRLF。四组实际测量见[newline-measurements.json](newline-measurements.json)，含开发/解包、正常/强制关闭。没有修改生产保存逻辑、替换测试输入、使用模糊匹配或删除原文断言。参考 [HTML 标准的 textarea API 值/换行说明](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html)，当前结论以本环境测量为准，不推广为所有原生粘贴/输入法行为。
3. 完整开发首轮 [66/68](development-first-tests.json)、[输出](development-first.log)：两处旧 `schemaVersion: 3` 预期遗漏同步，实际返回 4，其余数据/图片等断言通过。只同步当前成功初始化/迁移的精确版本预期，旧备份/失败回滚版本仍分别为 1/2/3。随后完整运行两形态得到上述 136/136。
4. 目视发现完整回归的初次首页图实际停在题库滚动位置；[开发原图](development-random-start-before-scroll.png)/[解包原图](packaged-random-start-before-scroll.png)保留，不能证明模式选择布局。仅在测试采样前将模式选择滚入视口并断言在视口内，字体/双帧等待及 capturePage 保持；两形态各 1 项再通过。新的[开发首页](development-random-start.png)/[解包首页](packaged-random-start.png)均已目视，模式/专题/题数、匹配数与说明完整可见；保存页[开发](development-random-saved.png)/[解包](packaged-random-saved.png)也已查看。没有改变生产滚动行为，或据此声称系统 DPI 验收。

初次类型检查还发现 `pragma` 返回 unknown，已增加数组收窄；测试使用的浏览器 DOM 能力用明确结构声明，未改 TypeScript 配置。逐文件两轮复查及这些检查边界见[复查记录](../../代码复查记录.md)。

## 改动与未验证边界

本批 6 个生产代码文件、8 个测试/夹具文件逐文件复查；[代码清单](code-change-audit.json)、[复查覆盖](review-coverage.json)及最终 source-manifest.json 记录来源。计划书、题库、依赖/锁文件和构建配置保持。最终文件/UTF-8/本地链接核对见 documents-static.json、change-audit.json。改前副本可用于恢复本批修改；本仓库仍无提交基线，本轮未提交或推送。

当前运行入口为整个 `release/win-unpacked/` 内的 `embedded-practice.exe`。结构 4 不受旧结构 3 程序或 M0 NSIS 支持；本批没有重新制作/安装 NSIS，也没有发布。v1/v2/v3 自动升级前的保护性备份不等于完整备份恢复功能。

本批完成 M3 随机练习与对应恢复，M3 未全部验收。单题历史、更新待复习展示、主题字号仍待开发；M4 完整恢复、M5 正式题库试用/新安装升级/性能未完成。M2 完整 Windows DPI、组合输入切题/关闭、系统能力与人工体验仍按原清单待验；历史键盘单次偏移根因仍未知，本次三档原回归通过不能覆盖历史失败。没有访问默认开发或正式学习库。
