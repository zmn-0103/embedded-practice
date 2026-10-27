# V0.0.2版本更新与本地提交证据

用户要求“提交git，然后更新版本为V0.0.2”。先将三轮UI、测试与独立复查提交为ddf2309，再更新版本。before/及before.json保留14文件原件，source-before.json保留111个源码/配置哈希，ui3-delivery-before.json保留r2完整156文件（含清单）哈希。Git版本更新与本地标签单独收口，不推送远程、不更新桌面或操作个人学习库。

本版仅package.json/锁文件根版本0.0.1→0.0.2和App页脚构建20261026.3-v002改变，另同步三份当前测试版本断言；原布局、主进程、IPC、结构10、控制器与依赖内容保持。两个可选视觉打磨仍留在后续观察。逐文件Bug/可维护性复查见[复查记录](../../代码复查记录.md)。

开发入口E:\My_Projects\embedded-practice\out\main\index.js（build-01）。解包明确目标E:\My_Projects\embedded-practice\release\V0.0.2-20261026.3\win-unpacked\embedded-practice.exe（pack-01）。每场景新建TEMP/embedded-practice-*并传入EMBEDDED_PRACTICE_TEST_DATA_DIR，解包显式指定EMBEDDED_PRACTICE_PACKAGED_EXECUTABLE。预期/实际运行身份见runtime-target.json与actual-runtime.json。

| 实际检查与报告 | 结果 |
| --- | --- |
| npm version 0.0.2 --no-git-tag-version --ignore-scripts --offline | 正确更新包与锁文件根版本，依赖内容不变；未手改锁文件 |
| check-01.log、build-01.log | 类型/格式及源码构建通过 |
| unit-01.log | 35文件660/660 |
| pack-01.log、runtime-target.json | 使用现有本地Electron分发生成完整新目录；WindowsFileVersion=0.0.2、ProductVersion=0.0.2.0 |
| packaged-01.log/.json、result-summary.json | 8文件74/74，零失败/跳过/flaky/自动重试，163.3秒；74份结果均passed/retry=0，errors为空 |
| package-content.json | 24/24构建与许可文件、原生SQLite模块匹配；ASAR版本0.0.2、构建v002 |
| captures/、measurements.json、actual-runtime.json | 19张本版实际窗口、8组几何与2份明确运行身份；10张新预览随完整程序 |
| scope-initial.json、scope-final.json、delivery-verification.json | 元数据范围/依赖/原计划前缀、旧r2保留、题库主题及交付文件SHA-256核对 |

本轮定向8文件为backup-legacy、backup-window、restore-window、board-entry、personal-bank、themes-window、workbench-ui2、workbench-ui3。覆盖旧结构备份/保护/预览/恢复与真实重启、419题精确比较、板块与主题、前轮7项和第三轮5项布局保护。版本更新没有重复完整255项；原r2的255/255和独立29/29保持此前结果，不混为新版本本轮执行。

源文件与顶层文档的Git空白预检通过。首次通配路径同时匹配历史error-context，检出原失败日志摘录的末尾空白；这些原始证据保持，不为提交而格式化历史现场。Git源代码、报告、截图和测试来源纳入本地提交；release/out/数据库/缓存按既有忽略规则留本机。

安全持久试用入口只静态核对，不自动导入/迁移个人进度。文件选择和确定性故障为替身，数据库/生产API/实际窗口/恢复按场景执行。自动截图和定向不代签全部系统DPI/IME/多显示器、安装器、长期主观体验、真实断电或硬件；VMware及其排障继续跳过。
