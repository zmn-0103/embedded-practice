# 方案E第三轮UI优化执行证据

本轮针对用户[四项复查意见原文](../../UI第三轮优化目标.md)继续实现，范围见[行为与验收](../../UI第三轮优化行为与验收.md)。先保存311文件及哈希到before/、before.json；原未提交改动保留。旧r5共155交付文件（含清单）在previous-delivery-before.json登记，scope-check-01.json再次确认未变。个人学习数据库与桌面入口没有操作。

当前源码构建为build-02，产品0.0.1、构建20261026.2-workbench-e-ui3、数据库结构10。开发入口E:\My_Projects\embedded-practice\out\main\index.js；最终解包明确目标E:\My_Projects\embedded-practice\release\V0.0.1-workbench-e-ui3-20261026.2-r2\win-unpacked\embedded-practice.exe。自动化每场景新建TEMP/embedded-practice-*，经EMBEDDED_PRACTICE_TEST_DATA_DIR传入；解包显式指定EMBEDDED_PRACTICE_PACKAGED_EXECUTABLE。启动后核对实际EXE、userData、产品版本、页脚构建和结构10。

环境为Windows 11 x64（10.0.26200）、Node24.19.0、npm11.17.0、Electron42.11.15、better-sqlite3 12.11.1。pack-01/02使用已安装的本地Electron分发及现有依赖，保持依赖/锁文件/打包配置；未制作或安装NSIS。每个实质修改按Bug轮、可维护性轮复查，见[代码复查记录](../../代码复查记录.md)。

## 各轮实际结果

| 报告 | 结果与边界 |
| --- | --- |
| build-01.log、build-02.log | 两轮类型与源码构建通过，最终build-02 |
| check-01.log、check-02.log | 两轮类型与格式通过，最终check-02 |
| unit-01.log、unit-02.log | 各35文件660/660，最终unit-02；没有新增单元场景，不把重复运行累加 |
| targeted-dev-01.log/.json | 首轮8通过/1失败，旧画面7项与板块新场景通过；分类展开准备使用随点击缩短的属性筛选nth集合，超时在准备步骤，未完成分类几何断言 |
| targeted-dev-02.log/.json | 修正分类定位、补齐5项新场景后12/12；原7项画面加新5项，零失败/跳过/flaky/自动重试，25.9秒 |
| targeted-dev-02-captures/与measurements.json | 19张开发窗口及8组几何；分类/板块/未揭晓/长答案末尾四张主要画面已目视。后补等待原500ms保护结束、返回enabled后采图，未改产品或固定延时 |
| full-packaged-01.log/.json | 首份候选72通过/5失败/178未运行，达到失败上限产生runner停止错误；四处完整可访问名称/分隔符遗漏及一处新空结果文案预期。原程序和报告保留 |
| targeted-dev-03.log/.json | 补回来源无障碍上下文，不改旧找题/历史定位器；27/27，零失败/跳过/flaky/自动重试，包含相关旧流程和全部新画面 |
| pack-01.log、pack-02.log | 两份新Windows x64完整解包目录分别生成，通过；最终r2（pack-02），首份候选保留 |
| package-content-01.json、package-content-02.json | 各自构建时24/24构建与许可文件匹配；最终package-content-02核对当前源码/原生SQLite模块/产品0.0.1及ui3标识 |
| full-packaged-02-target.json及full-packaged-02.log/.json | 最终r2完整解包255/255，零失败/跳过/flaky/自动重试，520.8秒（约8分41秒）；errors为空，255结果均passed/retry=0，不沿用r5历史250或独立复查24 |
| final-result-summary.json | 最终统计与明确目标汇总，源111文件哈希保持build-02状态 |
| final-packaged-captures/、final-packaged-measurements.json、final-packaged-runtime.json | 19张最终EXE画面、8组几何、两份明确运行身份；主要画面已复核，10张新增预览随包交付；[前后画面与实测](前后画面与实测.md) |
| scope-check-01.json | 本轮只改6个渲染层生产文件；75个主进程/IPC/共享契约/控制器/配置保护文件无变化，r5的155文件保持，根计划原字节前缀保持 |
| scope-final.json、delivery-copy-check.json、delivery-final-verification.json | 收尾核对源码范围、旧包/原题库主题、预览字节与完整交付文件清单；原阶段清单保留 |

新5项分别检查：真实419题及大量展开分类只有树滚动、固定搜索与第20题定位；900px/22px长答案顶部/中部/末尾返回及真实SQL保存失败重试；短题17/22px唯一常驻揭晓与输入高度/答案隐藏；72～88px短行及22px长中文题名完整；真实题库有活动轮时首排450px内/两排可见、有题筛选只读、原条件与队列保持。

最终r2实测板块首排y=431.98、第二排y=636.75；短题两档字号揭晓按钮均y=833、高42，输入高200。分类17/22px均只有category-tree可滚动，第20题点击前后列表位置分别1029/1029和1054/1054。短行与长中文完整的断言没有放宽字号/视口比例，来源的视觉去重保留了完整无障碍名称。具体样本边界见下节及前后画面说明。

## 数据与证据边界

分类与板块场景从question-banks/releases/v000-20261024/全量题库清单.json列出的原13专题导入419题，通过生产分类API建立原5个演示分类；分类压力场景另建12个明确测试分类。这些只在各自TEMP库，未修改Markdown或个人归属。返回/短题/长中文边界使用25题独立布局样本及50段参考说明。截图不代表个人学习记录。

文件选择与确定性故障为明确替身；真实SQLite事务、草稿/队列数据、生产API与Electron窗口按场景实际执行。开发截图不能代替解包运行，更不能代替安装器、全部系统DPI/IME/多显示器、长期性能、真实断电或用户主观体验。既有VMware及相关排障继续跳过。

没有提交、推送、发布新安装器、更新桌面或打开正式个人库。安全持久试用脚本只做静态核对，不往该目录写入演示数据。原失败报告、旧r5、用户独立复查24/24与所有历史证据保持原样。
