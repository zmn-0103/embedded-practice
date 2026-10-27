# 方案E：学习工作台开发与交付证据

2026-10-25开始，2026-10-26继续完成检查。用户授权在E:\My_Projects\embedded-practice按完整方案重构UI。源码起点为1f25ffa，工作区开始时干净，已包含主线恢复事务修复；历史主题交付不是本次源码基线。

最终产品0.0.1、构建20261025.3-workbench-e、结构10，完整交付目录为release/V0.0.1-workbench-e-20261025.3-r2。首包release/V0.0.1-workbench-e-20261025.3保留作候选追溯，不作为最终交付。

## 实际结果

| 检查 | 结果与原始证据 |
|---|---|
| 类型与格式 | 通过，[最终日志](check-final-03.txt)；前轮日志分别保留 |
| 单元 | 35文件、660/660，[最终日志](unit-final-02.txt)；原34文件658项保持，新增2项严格浏览条件契约 |
| 构建 | 通过，最终[build-07](build-07.txt)，所有前轮构建日志保留 |
| 首轮专题与布局 | overview-dev-01为3/3；focused-dev-01为11/14，修正3个旧布局准备后focused-fixes-dev-01为3/3 |
| 首轮完整开发 | [207/241](full-development-01.json)，34失败，未跳过/自动重试；原程序、失败源码与完整错误另存 |
| 第一批修复复查 | [32/35](regression-fixes-dev-01.json)，余3个窄窗找题步骤；[后续8/8](findability-fixes-dev-01.json)保留原滚动、过滤和异步业务断言 |
| 第二轮完整开发 | [236/242](full-development-02.json)，5项标签候选遮挡、1项展开管理焦点准备问题；原报告、错误、源码与当轮程序保留 |
| 第二批修复复查 | regression-fixes-dev-02为3/8，候选改文档流后发现blur收起使点击目标移动；修正外部点击/Tab收起后[15/15](regression-fixes-dev-03.json)通过，包含原失败、全部找题和练习守卫场景 |
| 第三轮完整开发 | [242/242](full-development-03.json)，零失败/跳过/flaky/自动重试；运行build-06，未在运行中改写out |
| 最终布局定向 | [10/10](final-layout-dev-01.json)，build-07，补充实际1440三列表单、900单列表单边界框及原阅读节点断言，覆盖板块键盘/对比度与全部7主题六页矩阵 |
| 最终Windows解包 | [242/242](full-packaged-01.json)，上述r2完整EXE、build-07，零失败/跳过/flaky/自动重试，含真实恢复自动重启与最后草稿保护 |
| 包内核对 | [最终核对](program-verification-final.json)：24份构建/许可字节一致、SQLite原生模块一致、程序124文件、13题库哈希一致，app0.0.1 |
| 原内容保护 | [最终保护核对](protection-final.json)：165份保护文件仅题库只读查询和ListRequest两项授权变动；旧交付143文件哈希保持，用户新计划逐字保持、原根计划字节前缀保持，原练习控制器字节保持 |
| 原桌面入口 | [只读核对](desktop-entry-readonly.json)，仍指向20261025.2-v001的完整原程序，未保存或替换快捷方式 |
| 最终画面 | [实际运行对象与13画面](final-preview-02/runtime.json)，新r2 EXE、packaged=true、0.0.1、结构10、新TEMP数据；13专题419题及5分类均由生产API实际导入/建立，演示作答与正式库隔离，HTTP/HTTPS请求0 |

完整报告及文本按表中同名.json/.txt保存，Playwright附件在同名无扩展目录。原始失败不被后续通过改写，不把多轮修复合并成一轮全通过。首轮241包含7项新场景，第二轮起新增窄窗错误可见性场景，共242；[覆盖映射](regression-coverage.json)核对原234场景零遗漏，仅将主题矩阵的“六页”标题对应回原“五页”。新增页面检查与原业务断言同时保留。

Git首轮diff --check将新增Windows CRLF中的CR报告为行尾空白，原输出保留在diff-check-01.txt；按有效CRLF的cr-at-eol复查通过，见diff-check-windows-01.txt和diff-check-explanation.json。未修改全局Git配置或通过改写原计划字节消除报告。交付压缩包逐项校验另见archive-verification.json，文档本地链接静态核对另见links-final.json。

最终ZIP共159,523,882字节，158个文件（含交付清单）全部逐项解压读取并核对长度/SHA-256，无缺失/额外文件，无数据库或运行缓存。ZIP SHA-256为4b51a6b11ca84f641b941acfa09ab7d4e127e46b07aa117dad3dc307069a0846。20份当前文档的822处本地文件/图片引用存在，未把代码块示例计作链接，未宣称外部网页或全部锚点有效。

用户可见产物另存到C:\Users\pc\Documents\Codex\2026-10-25\an-zh\outputs，包含本轮命名的ZIP、开始使用/检查/主题说明、13张实际预览及2个主题示例；既有V0.0.1和历史输出未覆盖。

## 目标和数据隔离

开发形态明确入口E:\My_Projects\embedded-practice\out\main\index.js，宿主node_modules/electron/dist/electron.exe，Electron42.11.15。最后完整开发轮为build-06；其后的两项视觉修正为管理details正文网格目标和主题局部预览文案，通过build-07的10项定向及最终解包完整回归核对。

最终解包目标显式设置EMBEDDED_PRACTICE_PACKAGED_EXECUTABLE为E:\My_Projects\embedded-practice\release\V0.0.1-workbench-e-20261025.3-r2\win-unpacked\embedded-practice.exe。已有帮助器逐场景新建%TEMP%/embedded-practice-*，通过EMBEDDED_PRACTICE_TEST_DATA_DIR传入；板块、主题和新工作台场景进一步核对实际EXE/packaged/版本/页脚/结构/userData，真实恢复重启沿原场景执行。

工具链仍为Node24.19.0、npm11.17.0、Electron42.11.15、better-sqlite3 12.11.1，依赖与锁文件不变。使用本地Electron分发，electron-builder --win --x64 --dir --publish never输出不存在的新目录；只制作完整解包程序，未制作或运行新安装器。

新“安全试用学习工作台.cmd”静态核对固定独立的%LOCALAPPDATA%/embedded-practice-workbench-e-trial-20261025.3；本轮没有实际运行这个持久目录。程序实际运行检查全部使用新的临时目录，不在交付中放入演示数据库、缓存、备份或用户学习内容。

## 修复与截图的证据边界

- 原历史允许未揭晓时主动回看，用户新计划要求历史作答也隔离。本批保留揭晓前DOM/无障碍树检查，揭晓后再做原历史分页、版本、只读和晚到响应检查，不能通过恢复旧泄露边界来满足旧测试。
- 原默认练习页改为总览，真实reload/relaunch后明确进入开始练习；原导航隐藏改为六入口可见但禁用；吸底动作假设改为正常文档流滚动。这些准备变化不删除原数据、守卫或可达性断言。
- 已修复窄窗重读失败提示/重试隐藏、失败页码丢失、失效选择空详情、练习候选遮挡及blur点击移位；新增900px错误场景和实际表单几何核对，不靠强制显示、放大窗口或延长等待绕过。
- preview-01的总览截图未等待绘制、捕获到上一页，作为时机诊断保留；preview-02显示旧184px管理区问题；final-preview-01在学习记录使用不存在的.learning-summary选择器时停止，只形成11张，且管理三列样式未作用于当前Chromium正文伪元素。均不作为最终画面签收。final-preview-02以正确语义选择器、页面就绪与两帧绘制完成13张；脚本为[preview-final.mjs](preview-final.mjs)，失败也写实际已完成范围。

## 保留的未验事项

源码、自动化、包内字节和实际窗口画面只证明各自范围。用户主观体验、全部系统DPI/输入法与多显示器、长期性能、真实安装升级卸载、实际断电及题目硬件/技术审阅仍未验；VMware及相关既有跳过继续保留。没有访问正式数据库、改个人数据、更新桌面、自动提交、推送或发布。原首轮失败、旧程序、旧夹具与原13张设计参考不被覆盖。
