# 最新主线V0.0.2与个人桌面更新证据

日期2026-10-26（Asia/Singapore）。用户授权先核对最新合并与开发记录，再用最新程序更新桌面。基线main66bbc6c87abb0e17b5b185bf6b5b240c5fa8d016，产品0.0.2、构建20261026.4-v002、结构10。明确EXE为E:\My_Projects\embedded-practice\release\V0.0.2-20261026.4\win-unpacked\embedded-practice.exe；所有自动化按场景新建TEMP并设置EMBEDDED_PRACTICE_TEST_DATA_DIR。

## 主检查

| 来源 | 结果 |
| --- | --- |
| target-before.json、before/、source-before.json | 更新前13文件副本、208源码/测试/配置哈希与精确目标 |
| source-scope.json | 仅App构建常量及三份当前测试标识改变，包/锁文件保持，原计划前缀保持 |
| check-01.log、unit-01.log、build-01.log、pack-01.log | 全部通过，35文件660/660单元，Node24.19.0、Electron42.11.15 |
| packaged-01.json、packaged-01/、result-summary.json | 新EXE完整255/255，527.021秒，错误/失败/跳过/flaky/重试均0 |
| package-content.json、packaged-runtime.json | 24运行/许可文件与原生SQLite模块一致，实际EXE、packaged、版本、构建、userData和结构核对 |
| captures/、capture-index.json、measurements.json | 本轮UI2/3的19张隔离窗口、10组JSON附件；UI3的10张复制到新交付目录界面预览 |
| old-program-verification.json | 旧个人V0.0.1的143文件、首次V0.0.2的155文件保持原清单哈希 |

日志默认受.gitignore忽略，仅保留本机；结构化报告、失败说明及必要截图独立保存。没有把旧255或独立29项当成本轮结果。

## 个人数据和实际桌面

- backup-location.json：升级前数据目录与旧快捷方式快照、SQLite一致性备份；真实备份及全部私人内容位于本机backups/个人使用/V0.0.2桌面更新前-20261026-202244，不进入Git。
- personal-copy-before.json、personal-copy-result.json：自动化只访问TEMP/embedded-practice-v002-personal-copy-iwYEtg。新版读取原数据副本、生产导出完整备份并预览通过，15张业务表摘要保持，13专题419题、完整性ok/外键0；validFullBackup位于本机备份目录。
- desktop-runtime.json：从新版桌面快捷方式实际启动，精确主进程EXE为新程序，主窗口标题/响应/资源版本核对；启动前清除测试目录与Electron开发环境覆盖变量。
- personal-upgrade-result.json：用户授权的实际交付后只读一致性核对。正式目录不变，15张业务表摘要保持，13专题419题，结构10/完整性ok/外键0，只有正常启动计数14→15；不计入自动化测试。
- shortcut-before.json、shell-before.json、shortcut-staged.json、shortcut-after.json：旧入口备份、新入口准备、实际启动后移除旧入口、Shell创建/删除/目录刷新，以及个人/Public/OneDrive物理目录和Shell合并视图只剩V0.0.2。

## 首轮失败与更正

1. package-check-01.txt：首次核对脚本以POSIX路径调用Windows ASAR API；改用node:path.join后24项一致，未改变程序包。
2. old-package-check-01.txt：旧V0.0.1清单使用file字段，首次脚本只识别path而将目录交给Get-FileHash；补齐两种既有字段并拒绝空路径后通过，旧文件未改动。
3. personal-copy-01.log：副本读取及生产导出已通过；随后错误地选择带WAL/SHM伴随文件的内部SQLite快照作为独立应用备份，被FILE_ERROR正确拒绝。
4. personal-copy-02.log与personal-copy-raw-snapshot-preview.json：再次取证真实拒绝原因，但脚本错误预期INVALID_BACKUP；实际为“目标仍有数据库伴随文件”。保留快照与伴随文件，不放宽产品保护。
5. personal-copy-03.log：改选生产接口导出的完整备份后预览通过；最终将Node SQLite的null-prototype结果与普通对象deepStrictEqual导致脚本失败。
6. personal-copy-04.log、personal-copy-result.json：使用已生产导出的完整备份并按查询字段核对，读取、预览和15业务表摘要全部通过。原始三轮失败保持，不表述为所有补查一次通过。

## 验证边界

native-tool-status.txt记录node_repl多次初始化及reset重试、cua_repl getState均因内核资源路径不存在失败。没有完成个人桌面原生截图/点击；实际更新依据快捷方式、Shell合并视图、主进程路径与窗口状态，加上正式数据一致性核对。隔离Electron截图不代替个人桌面或人工验收。

本次交付完整解包程序；未制作或安装新NSIS、执行全部DPI/IME/多显示器、长期性能/体验或硬件验收，VMware跳过保持。未另行提交/推送或移动v0.0.2标签；旧程序、首次候选与历史失败均保留。

## 2026-10-27收尾复核

resume-verification-20261027.json记录main仍为66bbc6c、208源码/测试/配置仅既定4份标识文件改变、154份交付文件哈希保持。Shell合并视图仍只有新版入口且目标正确；此时程序未运行，没有为收尾再次启动或访问正式学习库。backup-final-verification-20261027.json记录完整备份完整性ok及15业务表摘要与升级前快照保持，13专题419题，旧入口备份存在。

原始packaged-01.json的255项结果未改动，本次没有重复单元或整套解包测试。原result-summary.json派生汇总误用重复build字段，构建标识被后面的布尔值覆盖；原文件保留，另存result-summary-final.json将build恢复为20261026.4-v002，并用buildPassed记录构建结果。这只更正派生元数据，不改原始报告或历史失败。
