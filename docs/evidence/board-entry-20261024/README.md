# 板块入口接入：2026-10-24

本批范围见[行为说明](../../板块入口行为与验收.md)。当前修正版为 `20261024.3-boards`、结构9，Windows x64，独立完整目录 `release/board-entry-20261024-r2/win-unpacked/`。仅接入板块卡片、搜索、空板块、实际题数、既有题库范围与难度显示；原分类/方案/继续流程保持。

## 数据与执行边界

- 修改前5,226份当前文件与旧方案程序目录125文件（124份分发内容加此前已存在debug.log）存于[基线](before.json)。相关当前源码/测试/入口文档和原计划另有 `before/` 原字节副本。
- 测试按场景新建临时目录，实际userData、开发入口或解包EXE、isPackaged、Electron42.11.15、构建和结构9在新增场景中核对并附件留存；没有连接正式学习库。
- 新解包运行显式指定 `EMBEDDED_PRACTICE_PACKAGED_EXECUTABLE`，不使用封存旧默认目录。文件选择框和明确IPC故障/延迟为测试替身；生产页面、SQLite、分类/导入/保存事务和正常关闭重开实际执行。
- 不写入22个默认分类，不改题库文件或自动评定未分级题，不改数据库/迁移/IPC/预加载/建轮/草稿控制器。原数据/题目身份、内容与历史证据的保护结果在收尾清单记录。

## 实际检查入口

| 记录 | 含义 |
| --- | --- |
| [unit-01](unit-01.json) | 单元611/611，31文件；新增4项板块派生边界，旧607项保留核对在coverage中 |
| [typecheck-01](typecheck-01.json)、[typecheck-02](typecheck-02.json) | 初始生产类型检查通过；加入Node侧单元导入后缺Vite raw类型声明，局部补引用，后续构建/检查通过 |
| [build-01](build-01.json)、[build-02](build-02.json) | 初构建与20261024.3修正版构建，均包含真实类型检查 |
| [pack-02](pack-02.json) | 使用本机同版Electron分发生成独立新解包目录，退出0；依赖/锁和打包配置保持 |
| [targeted-01](targeted-01.json)、[targeted-02](targeted-02.json) | 首两项因测试误期望开发appPath为根目录而失败；补精确out/main与argv断言后2/2 |
| [targeted-03](targeted-03.json) | 扩充队列/草稿/历史/方案保护及慢响应/失败后4/4 |
| [targeted-04](targeted-04.json)、[targeted-05](targeted-05.json)、[targeted-06](targeted-06.json) | 均前4项通过，第5项先后纠正测试对焦点样式、竖滚动条宽度和原summary的Tab顺序预期；首源和上下文保留 |
| [targeted-07](targeted-07.json) | 开发新增5/5；实看截图后发现搜索框使用系统默认样式，修正生产CSS，初包保留 |
| [targeted-08](targeted-08.json) | 修正版开发5/5、新解包5/5，共10/10；四配色明暗追加搜索框主题背景精确断言 |
| [full-01中断](full-01-interruption.json) | 旧坏库/迁移失败场景卡在新测试默认导航准备，原业务断言前超时；重复确认后只终止本轮已核对进程树。报告不完整，不计算完整通过率；已生成上下文在full-01-artifacts保留 |
| [targeted-09](targeted-09.json) | 辅助启动只在状态就绪后进入旧准备页，数据库不可用保留原错误页；三类坏库3/3，原字节保护断言保持 |
| [包核对](package-verification.json)、[签名](signature.json) | 23项构建/许可原字节一致，原生模块一致，精简后的package.json语义准确，签名NotSigned |

完整[full-02](full-02.json)为410/414，两形态各205/207；四处旧可见“基础”文案同步为“易（基础）”后，[targeted-10](targeted-10.json)开发2/2、新解包2/2。最终[桌面覆盖](desktop-coverage.json)为414个不同场景，原404保持，零跳过/flaky/自动重试，**不是单轮414/414**。只有可见文案期望更新，原持久化字段和全表精确断言保持。重复定向不累加，原失败不覆盖。

[单元覆盖](unit-coverage.json)确认原607保留、仅新增4；[收尾类型/格式](check-02.json)和[允许原CRLF的本批差异空白检查](diff-check.json)通过。[窗口与徽标测量](appearance-verification.json)包含两形态各8个配色/主题组合，徽标文字最低4.8295；[明色图](screenshots/boards-light.png)与[暗色图](screenshots/boards-dark.png)已实看。[程序清单](package-manifest.json)为124文件，旧方案目录125文件和初包124文件保持。

[范围保护](scope-verification.json)确认22份原文件按授权修改、5,204份原文件保持，新增6份维护文件；226份改前副本、4,893份旧证据和5,011份受保护源码/题库/配置均保持，原计划前缀和旧复查正文完整。[维护来源清单](source-manifest.json)记录28份本批变更/新增文件，[链接检查](links-verification.json)采用Markdown AST核对当前入口、正文及锚点。最终本目录全部证据的SHA-256封存清单为 `evidence-manifest.json`（自身不计入）。

## 复现

从仓库根目录构建，解包输出必须使用新的目录名，不能覆盖本批或任何旧包。当前已有修正版可直接显式指定运行：

```powershell
$env:EMBEDDED_PRACTICE_PACKAGED_EXECUTABLE = 'E:\My_Projects\embedded-practice\release\board-entry-20261024-r2\win-unpacked\embedded-practice.exe'
$env:PLAYWRIGHT_JSON_OUTPUT_FILE = 'tmp/board-entry-new-report.json'
npx playwright test tests/e2e/board-entry.spec.ts --output=tmp/board-entry-new-artifacts
```

测试辅助默认进入原开始练习页以保持旧场景准备；新增空库场景及reload明确验启动默认“板块”。坏库场景不等待禁用导航，不删除或放宽原断言。完整报告保留每场景实际运行次数、失败/跳过/flaky等状态。

## 工具问题与未验项

初次PracticePlans格式检查需Prettier换行，后续已规范；第一次ASAR读取使用了非Windows条目分隔符，随后从listPackage取得真实路径。包内package.json按构建工具剔除scripts/devDependencies，初次误按源码字节比较失败，改为精确比较剩余字段；23项输出/许可与原生模块继续按字节核对，没有修改包绕过。上述属于检查工具问题，原始说明与失败上下文保留。

当前窗口/主题/键盘自动化不是全部Windows系统DPI、原生IME或用户主观体验验收；没有重测完整性能/长期内存，没有运行安装器、验证硬件、代签题目审阅、提交/推送或恢复VMware排障。浏览器断网重载只证明所列渲染路径，不作安装版真实断网结论。首次完整回归中断使用的独立临时库不当作验收完成。
