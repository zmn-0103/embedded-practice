# 功能体验第一批执行证据

基线：72339b941711d8966ac482c08ce6efe70068c774（先保存原有未提交内容），实现分支codex/practice-flow-20261027。构建20261027.3-practice-flow，产品0.0.2、结构11；范围见[开发计划](../../功能体验优化开发计划.md)，行为见[练习契约](../../练习保存与统计契约.md)和[方案契约](../../练习方案行为与验收.md)。

- unit-01.json：36文件674/674。
- check-03.txt、build-04.txt、pack-01.txt为首版通过；r2最终为check-05.txt、build-05.txt、pack-02.txt通过，首轮类型/格式失败原日志保持。
- development-01：3/6；development-02：6/6；storage-01：4/5；修正后development-03.json单轮47/47，含12项本批与35项原迁移。重复定向不累计成不同场景。
- packaged-01：首版新EXE单轮288/288，590.389秒，零失败/跳过/flaky/自动重试。首版完整候选保持。
- editor-style-before/after：收尾新增实际背景/内边距/圆角回归在首版失败，补type=text沿用已有主题样式，r2定向1/1；packaged-02对r2重新完整回归，不能用首版通过代替。
- schema-v10-source.json、tests/fixtures/schema-v10.sql：结构10来源为旧20261027.2-ui-adaptive真实新TEMP建库，实际EXE/userData/ASAR及夹具哈希保留。旧v3～v9夹具不改。
- package-source-verification.json及-r2.json：两版各24份包内构建/许可及原生SQLite匹配，旧交付165文件保持、首版候选ASAR保持，原13专题419题字节保持。
- source-final.json及source-final-r2.json：源码哈希、基线/分支、原计划字节前缀、依赖和旧跟踪证据保护；r2相对首版仅编辑输入框type属性，测试/旧SQL夹具另存哈希。
- trial-entry-check.json：安全入口目标/独立数据路径/9行CRLF静态检查，未宣称动态启动该脚本。

开发入口E:\My_Projects\embedded-practice\out\main\index.js，最终解包目标E:\My_Projects\embedded-practice\release\V0.0.2-practice-flow-20261027.3-r2\win-unpacked\embedded-practice.exe；packaged-01的首版目标为去掉-r2的目录，packaged-02为最终修订版。全部应用流程使用逐场景新TEMP，实际运行对象/数据路径在运行附件中核对。原个人库和桌面不访问；旧EXE只用于明确标注的结构10夹具生成。

首次失败、修正和替身范围详见[验收记录](../../验收记录.md)。新恢复专项真实校验/替换并独立重开，选择/确认框和app.relaunch为替身，原恢复回归另验真实重启协调。截图为真实Electron窗口，仅作可见效果证据，不替代人工、安装、系统DPI/IME/多屏或硬件验收。VMware跳过保持。本轮不新提交/推送或更新个人桌面。

## 最终完整结果

r2最终packaged-02单轮 **288/288，608.479秒**，unexpected/skipped/flaky均0，errors为空；288场景各只有一次passed/retry=0。r2的实际源码107份与测试/SQL来源111份整轮前后哈希保持，见result-summary-r2.json及source-final-r2.json。

当前完整程序为release/V0.0.2-practice-flow-20261027.3-r2，附安全入口、开始使用、检查结果、3张本版窗口、原13专题419题、两个主题及逐文件校验。首版及上一版程序保留；原计划字节前缀最终保留，清理文档换行的首次辅助核对与修复见plan-prefix-check.json。新开发尚未另行提交，原工作区已提交为72339b9，无推送/桌面/正式库操作。

最终交付文件148份、390682749字节（清单自身除外），路径/大小/SHA-256逐项匹配，排除数据库/日志/缓存/个人运行数据；旧165份交付文件再次核对保持。详见delivery-file-verification-r2.json及交付目录的交付文件校验.json。使用说明的Codex打开请求返回queued，不冒称已经实际显示。
