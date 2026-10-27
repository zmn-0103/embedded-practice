# M3 第四批证据：学习记录总览

日期：2026-10-21。范围见[第四批行为与验收](../../M3第四批行为与验收.md)，实现见[学习记录总览](../../architecture/M3学习记录总览.md)。本批完成当前版本题数总览和收藏/历史入口；主题/字号、四个主入口完全分离及 M4/M5 未完成，不认定 M3 全阶段或完整人工验收通过。

## 环境与修改

- Windows 11 x64（10.0.26200）、Node.js 24.19.0、npm 11.17.0、Electron 42.11.15、better-sqlite3 12.11.1，应用 0.1.0。改前 657 文件副本及哈希位置见 [environment.json](environment.json)。
- 10 个生产、6 个测试/夹具文件逐文件完成先 Bug 后可维护性复查，见[复查记录](../../代码复查记录.md)和 [code-change-audit.json](code-change-audit.json)。数据库保持结构 4；原计划、题库、依赖/锁文件、迁移及练习保存控制器保持。
- 全部测试显式传入独立临时数据目录，固定临时根目录/前缀检查后才访问测试库或清理。未读取默认学习库。
- 开发形态运行生产构建，Windows 形态运行重新生成的 `release/win-unpacked/embedded-practice.exe`，子进程 PATH 仅 Windows System32。使用时保留完整解包目录，不能只复制 EXE。
- [包内容核对](package-inspection.json)：13 个运行文件、6 个许可副本逐字节一致，原生 SQLite 模块一致；旧 M0 NSIS 哈希保持，未制作新 NSIS。旧安装包不能打开结构 4。

## 实际执行

| 检查 | 结果 | 原始证据 |
|---|---|---|
| 类型/格式 | 通过，所有测试文件完成后重新执行 | [check-final.log](check-final.log) |
| 单元检查 | 23 文件、474/474，零失败/跳过；原 452 项保留，新增 20 项契约及 2 项 IPC | [unit-tests.json](unit-tests.json)、[unit.log](unit.log) |
| 源码构建 | 通过 | [build-first.log](build-first.log) |
| Windows x64 解包构建 | 通过，未发布 | [package.log](package.log) |
| 开发新增窗口/统计首轮定向 | 4/4 | [首轮报告](learning-first-tests.json)、[日志](learning-first.log) |
| 开发新增故障/晚到首轮定向 | 2/2 | [故障首轮报告](learning-errors-first-tests.json)、[日志](learning-errors-first.log) |
| 完整开发构建首轮 | 81/81，原 75 项逐项保留 | [最终报告](final-full-tests.json)、[日志](final-full.log) |
| 完整 Windows 解包 EXE 首轮 | 81/81，原 75 项逐项保留 | 同上，projectName 为 packaged |
| 合计 | 162/162，零失败、跳过、flaky 或自动重试 | [汇总及新增场景](results-summary.json) |

实际命令：类型/格式 `npm run check`，单元 `npm test -- --reporter=json --outputFile=docs/evidence/m3d/unit-tests.json`，源码 `npm run build`，解包 `npm run pack:dir`。两个新增场景文件分别在开发形态首轮定向运行。完整两种形态：

```powershell
$env:PLAYWRIGHT_JSON_OUTPUT_NAME = 'docs/evidence/m3d/final-full-tests.json'
npx playwright test --reporter=list,json --output=tmp/m3d-final-full
```

本批应用场景首轮均通过。开发过程第一次类型检查发现既有服务测试替身尚缺 `readLearningSummary`，同步替身后通过；没有更改生产接口来绕过错误。包核对脚本第一次将归一化 `/` 路径直接传入 Windows ASAR 提取器，返回 not found；保留归档目录原始路径用于提取、仅比较时归一化后逐字节核对通过，未改归档内容。这些是测试/核对工具问题，不能当作应用失败或用后续通过覆盖其发生。

## 六项新增场景

每种形态新增同样六项，按文件与场景名称独立比较前批集合，缺失为 0。

| 场景 | 证明范围 | 开发 / Windows 解包数据 |
|---|---|---|
| 空库、未知专题、非法输入、只读 | 真实零、空目录、额外 SQL 字段拒绝；窗口零状态和查询前后业务快照不变 | [开发](development-learning-empty.json) / [解包](packaged-learning-empty.json) |
| 多轮、版本与归档 | 真实服务建轮/揭晓/改评/暂不评价/跳过；按题去重；内容更新排除旧版本，元数据保持；明确旧状态兼容不补造揭晓；归档/恢复收藏与分布 | [开发](development-learning-version-counts.json) / [解包](packaged-learning-version-counts.json) |
| 页面范围、收藏与历史 | 范围切换、默认只看收藏、取消收藏后总览/列表重读、清空保留范围、主动历史、新范围重新隐藏；明暗布局 | [开发](development-learning-window-counts.json) / [解包](packaged-learning-window-counts.json)，附件为操作后全活动范围 API 摘要，各窗口范围精确断言在原报告 |
| 预览与关闭恢复 | 跨页保留相同预览摘要并实际确认；保存作答后进入记录页，正常关闭/独立重开恢复原轮，完整业务行/草稿精确保持 | [开发](development-learning-page-reopen.json) / [解包](packaged-learning-page-reopen.json) |
| 真 SQL 故障与重试 | 改名状态表造成真实读失败，不显示伪造零；恢复后总览/列表分别重试，全业务快照保持，日志不含作答/答案 | [开发](development-learning-read-failure.json) / [解包](packaged-learning-read-failure.json) |
| 晚到范围响应 | 原范围真实读完后延迟返回，新专题/归档结果完成再释放；返回计数/同通道读取/双帧确认后精确核对，不覆盖新范围、不写库 | [开发](development-learning-late-response.json) / [解包](packaged-learning-late-response.json) |

数据库操作使用真实导入及练习服务，只有兼容场景明确构造旧自评状态。系统文件选择框为替身，SQL 故障与响应时序由测试控制，其他经过实际预加载、IPC、SQLite、窗口与进程退出。不冒充人工体验、性能或真实断电测量。

## 截图与静态核对

以下完整窗口截图由 Electron `capturePage` 在字体和两帧绘制后获取，已目视核对。明暗通过页面媒体模拟继承现有主题；本批未实现主题切换设置，也不等同 Windows 系统 DPI 验收。

| 截图 | 开发 | Windows 解包 |
|---|---|---|
| 学习记录明色 | [窗口](development-learning-light.png) | [窗口](packaged-learning-light.png) |
| 学习记录暗色 | [窗口](development-learning-dark.png) | [窗口](packaged-learning-dark.png) |

[源码清单](source-manifest.json)、[变更核对](change-audit.json)、[文档静态检查](documents-static.json)记录源文件哈希、逐文件复查覆盖、原计划/题库/依赖/结构等保持、中文 UTF-8 往返与本批文档本地链接/围栏。这些为静态证据，与窗口/数据库运行分别认定。

本批通过不解释前批单次键盘位置偏移或额外字符来源，原失败和未知边界保留。完整人工体验、组合输入中切题/退出、Windows 系统 DPI、外部编辑器双向剪贴板、系统浏览器、大图、正式题库审阅、新 NSIS/安装升级和性能未验收。未提交、推送、发布或访问默认学习数据。
