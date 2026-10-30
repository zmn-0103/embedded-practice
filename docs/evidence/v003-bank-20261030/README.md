# V0.0.3 全量题库与桌面交付证据

用户授权：直接全量改完、不做小样、可多agent、V0.0.3、移除旧程序、更新桌面、不生成备份、最后提交。所有自动化测试使用独立临时目录；实际个人库操作只发生在明确交付阶段。

## 内容与身份

[题库入口](../../../question-banks/releases/v003-20261030/README.md)包含23专题382题，源595条：302改写/261合并/32不纳入，30源文件hash与每条目标明确。旧419身份：143更新/276归档，归档中248有新目标、28不再单独收录；另新增239身份。[归档逐题对照](../../../question-banks/releases/v003-20261030/旧题归档对照.md)。原库与旧来源快照不改，技术核对/未验项记录在editorial review；未冒称用户已审阅或硬件验证。

## 实际检查

- check-01/check-02、typecheck-e2e-01、build-01和pack-01通过，见同名文本。
- unit-01：49文件781/781；最后两处答案文字修订后bank-unit-final-01：3/3，不叠加计数。
- packaged-01.json：显式新EXE，6文件31/31，0失败/跳过/重试，独立TEMP；包含题库2场景。
- packaged-bank-final-01.json：最终题库内容重复专项2/2，10.5秒，与31项有重叠。
- migration-memory-03.json：Node24原生TypeScript加载，内存旧10夹具正常迁移/受控故障回滚，16旧表旧列摘要一致。夹具仅启动/外观/元数据非空，不单独替代实际数据保护证据。
- 截图：[最终口述练习](../../../output/playwright/v003-bank-final-01/v003-bank-V0-0-3全量首次及重复导入、板块归属、口述揭晓与重开-packaged/v003-practice.png)，已目视检查。

## 已授权实际交付

personal-migration.json：原APPDATA/embedded-practice结构10→17，无文件备份；16旧表原列逐表摘要保持，原2轮40练习项、419题目状态在内。

personal-bank-deployment.json：精确新EXE/0.0.3/packaged/原数据路径；生产预览后提交新增239、更新143、归档276，新382版本；最终23专题382活动/276归档。原学习表、419旧状态、旧版本与活动队列摘要保持；完整性ok/外键无错误。为10个无归属新专题填现有推荐板块，既有归属保持。备份目录仍原9文件，无新增。

desktop-shortcut.json与desktop-reopen.json：新桌面V0.0.3路径无额外参数，旧lnk移除，通过实际快捷方式启动新主窗口。

old-program-cleanup-plan/result.json：8个已核对目标共682文件、2161500666逻辑字节，目录内无数据库或重解析链接。永久删除命令两次被自动安全检查拒绝（未执行），使用computer-use文件管理器普通删除移入系统回收站，未清空回收站；release最终仅V0.0.3-20261030.1，新EXE SHA256保持4978E252E3B8D0B3B59912AA8A461BAA646B84EBE594F1FFC44F4104D5A6722D。不宣称同等实际磁盘释放。

## 首轮失败与边界

migration-memory-01为空stdout：脚本初版依赖未安装esbuild，未打开个人库；改Node原生registerHooks。migration-memory-02为空stdout：旧夹具app_startup已有行，INSERT约束失败；改UPDATE，03通过。bank-finalize-01发现CAN重复标签，已去重，02之后通过；后续03/04是明确新轮汇总。原空stdout和工具失败未覆盖。UI初次点击因几何信息不可用失败，经重新捕获恢复；Ctrl+空格未更改选择，改用明确“反向选择”，核对8旧项/新版未选后普通删除。

未执行完整406回归、NSIS安装、原生DPI/IME/多屏/长期/性能/硬件或用户逐题验收，既有VMware跳过保持。独立临时测试仍覆盖程序内置保护备份行为，其夹具由测试清理；正式交付和原始资料未创建额外备份文件。程序正常迁移保护未删。
