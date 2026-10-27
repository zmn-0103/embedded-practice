# 第二批UI自适应与状态反馈：执行证据

2026-10-27，承接用户“继续”，范围见[第二批行为](../../UI自适应与状态反馈优化.md)与[原完整结论](../../UI可读性与操作层级优化.md)。产品0.0.2、构建20261027.2-ui-adaptive、结构10。原未提交修改保持，开始308份源码/根文档/配置快照、原Git状态与完整二进制差异补丁分别在before/、before.json、git-status-before.txt、worktree-before.patch。

## 实际目标和数据

- 改前：E:\My_Projects\embedded-practice\release\V0.0.2-ui-clarity-20261027.1\win-unpacked\embedded-practice.exe，构建20261027.1-ui-clarity/结构10，baseline-01六组仅作测量，不计为第二批通过。
- 开发：E:\My_Projects\embedded-practice\out\main\index.js，Electron42.11.15宿主；build-01为实际构建。
- 新程序：E:\My_Projects\embedded-practice\release\V0.0.2-ui-adaptive-20261027.2\win-unpacked\embedded-practice.exe，产品0.0.2/构建20261027.2-ui-adaptive/结构10。
- 每个自动化场景由helper新建独立TEMP，通过EMBEDDED_PRACTICE_TEST_DATA_DIR传入，核对实际userData/EXE/packaged/构建/结构；解包显式指定EMBEDDED_PRACTICE_PACKAGED_EXECUTABLE。程序缩放只设置应用webContents，不改变Windows缩放设置。
- Windows11 x64，Node24.19.0/npm11.17.0，Electron42.11.15/better-sqlite3 12.11.1。未访问正式学习库或桌面、未新增在线依赖或服务。

## 实际运行

| 记录 | 结果 |
|---|---|
| baseline-01 | 原第一批EXE六组采集6/6完成，16.1秒；源冻结baseline-source.spec.ts |
| typecheck-baseline / typecheck-renderer-01 / typecheck-02 | 通过 |
| build-01 | 源码构建通过 |
| adaptive-development-01 | 八组缩放8/8，24.9秒 |
| feedback-development-01 | 四项新状态场景与原概览/第二三轮UI共19/19，45.6秒 |
| error-development-01 | 200%实际草稿写失败/返回保护/重试1/1，3.3秒 |
| check-01 | 类型与格式通过 |
| unit-01 | 35文件660/660，13.71秒 |
| pack-01 | 本机Windows x64解包通过，无安装器 |
| packaged-01 | 同一新EXE完整276/276，619.785秒；0失败/跳过/flaky/自动重试，errors为空 |
| artifact-verification-01 | 24份构建/许可、原生SQLite、第一批159份文件/清单自身、13份题库与源范围通过 |

开发定向8+19+1为28个不同场景；其中新增九项缩放/失败与四项状态测试，原263场景保持，最终同一新EXE单轮276/276。无本批首轮失败、跳过或自动重试；不把改前采集或上批262+1计为本批通过。原baseline采集源和所有报告独立保存。

## 缩放比较

窗口API的内容高度统一设为900，保持松间绿明色、相同17/22px正文、40行独立草稿、已揭晓且输入聚焦。缩放后的有效CSS视口高度实际为450/600/900；下表宽度是所设窗口内容尺寸，底栏/输入几何使用CSS逻辑像素，不代表Windows DPI或物理屏幕像素。capturePage直接读取真实窗口渲染内容，避免上一批已知的200% Playwright截图空白，不是原生跨屏/系统行为验收。

| 内容宽度/字号/缩放 | 改前底栏高度/占比 | 新EXE高度/占比 | 改前输入可见 | 新输入可见 |
|---|---|---|---:|---:|
| 1440 / 17 / 200% | 189 / 42% | 79.20 / 17.6% | 200 | 200 |
| 1440 / 22 / 200% | 189 / 42% | 79.20 / 17.6% | 55.38 | 200 |
| 900 / 17 / 200% | 189 / 42% | 119.59 / 26.58% | 51.23 | 200 |
| 900 / 22 / 200% | 189 / 42% | 119.59 / 26.58% | 54.98 | 200 |
| 900 / 22 / 150% | 146.40 / 24.4% | 117.58 / 19.6% | 200 | 200 |
| 900 / 22 / 100% | 148.39 / 16.49% | 148.39 / 16.49% | 200 | 200 |

原始值见[layout-baseline.json](layout-baseline.json)、[layout-development-01.json](layout-development-01.json)、[新EXE测量](layout-packaged-01.json)及[两份EXE同条件比较](layout-comparison.json)；表格仅作阅读性舍入，新EXE结果与开发一致。新增暖沙金/Claude深色的200%检查也通过，正式断言底栏≤30%、原输入高度200且至少180可见、全部原底栏按钮完整在视口，以及缩放往返后同一输入/草稿/业务快照保持。失败态保留原42%高度上限给错误重试，不冒称与正常态一样紧凑；另测真实失败时重试可见且不丢输入/不离开原题。

## 页面、保护和限制

- 概览按确认空库/有题无轮/活动轮给出下一步，开始新练习只到原配置页；真实导入、保存返回和继续保持草稿/队列。
- 板块按真实有效/归档/规划/空分类给出状态和可用入口；无匹配清空仅改变展示。独立归档样本通过TEMP内明确SQL设置，仅作展示夹具，不属于正式数据迁移。
- 设置使用真实appearance_settings写失败触发器，验证待应用/切页保持/未确认/原选择重试成功/默认即时应用；记录重置验证只改变范围，不删除业务数据。文件选择为替身，SQLite/应用保存与页面真实。
- 已目视开发概览、板块和200%输入前后；新EXE八组缩放与全部状态场景包含在276/276中。新EXE五主题明暗占位10组仍为5.047～8.089，见[本版颜色](contrast-packaged-01.json)。实际画面保存在packaged-01及独立交付目录，改前图片明确标记来源；只做自查，没有独立评审或用户主观验收。

相较before，只修改7份渲染生产文件和3份当前身份断言，新增两份测试文件13场景；主进程、预加载、共享契约、草稿控制器、包/锁文件/构建配置保持。rg默认未包含的13份隐藏.gitkeep逐份与HEAD原始字节一致，缺项明确列于[artifact-verification.json](artifact-verification.json)，不改写原before.json。

本批没有提交/推送、发布/安装新NSIS、更换个人桌面或读取正式学习库。全部Windows DPI/IME、真实跨显示器拖动、长期性能、完整人工体验、硬件及VMware保持原未验/跳过边界。新安全入口只静态核对，个人体验时使用独立LOCALAPPDATA；程序本体由上列逐场景TEMP验证。

最终汇总见[result-summary.json](result-summary.json)，完整[前后对比](../../../release/V0.0.2-ui-adaptive-20261027.2/前后对比.md)与19张预览随独立程序交付，其中17张来自新EXE、2张“改前”图来自原EXE。交付除清单自身外165份文件逐项长度/SHA-256重新读取匹配，未夹带数据库/日志/缓存/用户数据，见[交付核对](delivery-file-verification.json)；没有另制ZIP。255份最终源码/测试/配置哈希在source-final.json，新文档22处本地链接全部存在，link-check-02与差异空白检查通过。第一批与个人桌面仍可使用，本轮不自动切换。
