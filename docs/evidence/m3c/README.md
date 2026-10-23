# M3 第三批证据：单题历史与内容更新待复习

日期：2026-10-21。范围见[第三批行为与验收](../../M3第三批行为与验收.md)，实现见[单题历史与更新标记](../../architecture/M3单题历史与更新标记.md)。本批完成这两项功能，学习记录总览、主题/字号、完整恢复及 M4/M5 未完成；不认定 M3 全阶段或完整人工验收通过。

## 环境与产物

- Windows 11 x64（10.0.26200）、Node.js 24.19.0、npm 11.17.0、Electron 42.11.15、better-sqlite3 12.11.1，应用版本 0.1.0。原环境与改前 612 文件副本位置见 [environment.json](environment.json)。
- 数据库保持结构 4，无新表、索引、迁移、依赖、锁文件或构建配置变更。12 个生产文件、8 个测试/夹具文件逐文件完成先 Bug 后可维护性复查，见[复查记录](../../代码复查记录.md)和 [code-change-audit.json](code-change-audit.json)。
- 测试均经 `tests/e2e/helpers.ts` 创建独立临时数据目录，明确传入 `EMBEDDED_PRACTICE_TEST_DATA_DIR`；数据库核对/故障注入/来源移动均校验作用域，不访问默认学习数据。
- 开发形态加载本次生产构建；Windows 形态运行重新生成的 `release/win-unpacked/embedded-practice.exe`，子进程 PATH 仅 Windows System32。使用时保留完整解包目录，不能只复制 EXE。
- [包内容核对](package-inspection.json)：13 个运行文件、6 个许可副本逐字节一致，原生 SQLite 模块匹配。旧 M0 NSIS 哈希保持，未生成/安装新 NSIS，旧包不能打开当前结构 4。

## 实际执行结果

| 检查 | 结果 | 原始证据 |
|---|---|---|
| 类型与格式 | 通过，最终测试白名单同步后重新执行 | [check-final.log](check-final.log) |
| 单元检查 | 22 文件、452/452，零失败/跳过 | [unit-tests.json](unit-tests.json)、[unit.log](unit.log) |
| 开发源码构建 | 通过 | [build-first.log](build-first.log) |
| Windows x64 解包构建 | 通过，未发布 | [package.log](package.log) |
| 首轮历史版本/更新定向 | 开发 3/3 | [版本报告](history-versions-first-tests.json) |
| 首轮历史窗口定向 | 开发 4/4 | [窗口报告](history-window-first-tests.json) |
| 首轮完整回归 | 开发 73/75、解包 71/75，合计 144/150 | [首轮报告](full-first-tests.json)、[首轮日志](full-first.log) |
| 失败场景及正常恢复控制场景复测 | 两种形态各 5/5，合计 10/10 | [定向报告](failure-recheck-tests.json)、[定向日志](failure-recheck.log) |
| 最终完整开发构建 | 75/75，原 68 项完整保留 | [最终报告](final-full-tests.json)、[最终日志](final-full.log) |
| 最终完整 Windows 解包 EXE | 75/75，原 68 项完整保留 | 同上，projectName 为 packaged |
| 最终回归状态 | 150/150，零失败、跳过、flaky 或自动重试 | [汇总及新增场景列表](results-summary.json) |

类型/格式使用 `npm run check`；单元使用 `npm test -- --reporter=json --outputFile=docs/evidence/m3c/unit-tests.json`；源码构建 `npm run build`；解包构建 `npm run pack:dir`。最终两种形态一起执行：

```powershell
$env:PLAYWRIGHT_JSON_OUTPUT_NAME = 'docs/evidence/m3c/final-full-tests.json'
npx playwright test --reporter=list,json --output=tmp/m3c-final-full-recheck
```

最初完整回归的输出目录为 `tmp/m3c-final-full`，定向复测为 `tmp/m3c-failure-recheck`。原始报告均保留，最终报告未覆盖首次失败。生产文件在打包后未再修改；后续只同步旧列表测试的精确字段白名单和开发文档，因此两种形态对应同一最终生产实现。

## 七项新增场景与数据

每种形态新增相同七项，另外保留前批全部 68 项；按文件与场景名称独立比较，缺失数为 0。

| 场景 | 实际核对 | 开发 / 解包附件 |
|---|---|---|
| 真实历史资格、分页、身份与只读 | 25 轮真实服务操作；每页 20+5、倒序完整会话 ID、同轮改评分仅一条、仅排队不计入、同题号异专题隔离、未揭晓无答案、空作答揭晓、排除轮/超页/错误归属及前后全库业务快照 | [开发](development-history-query-matrix.json) / [解包](packaged-history-query-matrix.json) |
| 更新标记生命周期 | 首次无标记；内容更新后标记；旧轮揭晓/只读查看不消除；新版本空作答揭晓后无自评也消除；跳过保留；元数据不产生版本；仅图片更新重置；旧状态兼容不伪造历史 | [开发](development-content-update-lifecycle.json) / [解包](packaged-content-update-lifecycle.json) |
| 历史图片、归档恢复与重开 | 真实替换为 3×2 图片、来源目录移走、正常关窗后独立重开；当前图解码为 3×2，旧历史仍为 2×3、绑定旧版本；归档及同 ID 恢复后记录/版本保留 | [开发](development-history-image-archive-restore.json) / [解包](packaged-history-image-archive-restore.json) |
| 默认隐藏、主动回看及保存保持 | 新轮零历史请求、DOM/无障碍树无旧作答/答案；摘要不含全文，单条按需读取；脚本样本文字按纯文本；查询不写库；当前草稿实际保存且滚动/焦点/历史展开保持；新题/新轮重新收起 | [开发](development-history-default-readonly-autosave.json) / [解包](packaged-history-default-readonly-autosave.json) |
| 真实读取失败与重试 | 测试表改名造成实际 SQL 失败、坏定义 JSON 造成响应校验失败；不伪造空历史，恢复后原页/记录可重试；完整数据保持，诊断不包含作答 | [开发](development-history-read-failure-retry.json) / [解包](packaged-history-read-failure-retry.json) |
| 晚到历史列表 | 真实完成读后延迟返回，切到另一题并加载其记录，再释放原题所有请求；等待返回与界面消费后检查不覆盖/泄露，数据库不变 | [开发](development-history-late-list.json) / [解包](packaged-history-late-list.json) |
| 晚到单条详情 | 同上，延迟的是原题单条详情；另一题已展开记录后仍不混入旧作答/答案 | [开发](development-history-late-get-entry.json) / [解包](packaged-history-late-get-entry.json) |

夹具使用真实 `start/saveDraft/reveal/rateAndAdvance/navigate/end`，包含顺序与随机轮。只有旧状态兼容场景显式构造一个旧自评状态；未插入假历史。故障、文件选择和返回时序由测试控制，其他走真实预加载、IPC、SQLite 与渲染。

## 首轮失败与处理

1. 两个确定失败（开发/解包各一）来自旧列表测试漏列本批新增的 `contentUpdated`。只补充这一精确字段，列表仍严格只允许既定摘要字段，不允许题干/答案/旧作答；搜索、分页、字面字符和无障碍隐藏断言保持。
2. 四个输入失败中，实际草稿含脚本未输入的尾部字符：新历史场景两种形态及既有练习/随机强制恢复场景各一。首轮分别出现“昂捷”“wan”“1”“jiao'xu”。当时没有输入事件来源记录，无法确认是系统输入干扰还是其他原因，不能认定已修复。没有修改生产输入/保存代码，没有去除或模糊原文断言。随后同一组输入场景两种形态及正常恢复控制共 10/10、最终完整 150/150 通过；首次失败仍保留。
3. 首轮新场景定向全部通过，但截图目视发现历史采样停在条目标题、更新标记采样停在已展开历史，不能证明目标内容。只调整测试采样位置/时点，不改产品滚动；最终两种形态对应图已目视核对。原定向报告和 `tmp/m3c-history-*` 中的原图保留，不能以原图证明标记或正文布局。

四个输入失败的根因与此前 9.33px 单次键盘偏移分别待定位；没有证据证明两者有关。后续通过不覆盖历史失败，也不等于完整 Windows 输入法/DPI 人工验收完成。

## 窗口截图与静态核对

截图由 Electron `capturePage` 获取完整可视区域，等待字体与两帧绘制；不是全页面拼接，也不是 Windows 系统 DPI 验收。测试用图片极小，尺寸和版本由 DOM/数据库独立断言，不凭截图推断所有图片均正确。

| 目标 | 开发 | Windows 解包 |
|---|---|---|
| 主动展开后的纯文本作答 | [完整窗口](development-history-expanded.png) | [完整窗口](packaged-history-expanded.png) |
| 列表及详情更新待复习标记 | [完整窗口](development-content-update.png) | [完整窗口](packaged-content-update.png) |
| 旧版本题干、图片及已揭晓答案 | [完整窗口](development-history-old-image.png) | [完整窗口](packaged-history-old-image.png) |

[源码清单](source-manifest.json)、[变更核对](change-audit.json)、[文档静态检查](documents-static.json)分别记录哈希、原计划/题库/依赖等保持情况、中文 UTF-8 往返及本批文档链接/围栏。它们是静态检查，不等同运行验收。

本批未访问默认学习库、提交、推送或发布。完整备份恢复、学习记录总览、主题/字号仍待开发；完整 Windows 人工体验、组合输入中切题/关闭、系统 DPI、外部编辑器双向剪贴板、系统浏览器、大图、正式题库审阅、新 NSIS/安装升级及性能仍未验收。
