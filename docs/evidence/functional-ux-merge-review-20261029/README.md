# 功能体验分支合并前复查（2026-10-29）

## 对象与结论

用户授权检查 `codex/functional-ux-next-20261028`，通过后合并本地 `main`。检查开始时两分支均为 `6fbce18`，新增功能尚在工作区，不能仅凭 Git 提示“已经合并”认定完成。本轮未修改应用源码或测试实现，未发现阻止本次合并的问题；先将现有开发、参考图及证据提交，再进行本地快进合并。合并实际结果另记开发记录。

范围为个人标签与常用入口、复习待办与最近练习、积累检索与知识关联、每日/备考目标与配额组卷、可选口述计时，以及对应保存、迁移、备份、IPC契约和界面入口。

## 本轮实际验证

- `npm run check`：TypeScript与Prettier均通过，见 `check.txt`。
- `npm test -- --reporter=json --outputFile=docs/evidence/functional-ux-merge-review-20261029/unit.json`：778/778通过，见 `unit.json` 和 `unit.txt`。
- 14个定向桌面测试文件单轮64/64通过，零失败、跳过或flaky，耗时120.974511秒，见 `packaged-targeted-01.json`、`packaged-targeted-01.txt` 及 `../../../output/playwright/functional-ux-merge-review-20261029/`。
- 测试文件：personal-tags、personal-tags-storage、shortcut-usage、review-todos、practice-recency、review-storage、knowledge、knowledge-ui、knowledge-storage、planning、planning-ui、planning-storage、oral-timer、note-favorite（均为 `tests/e2e/*.spec.ts`）。
- 显式设置 `EMBEDDED_PRACTICE_PACKAGED_EXECUTABLE=E:/My_Projects/embedded-practice/release/V0.0.2-oral-timer-20261029.4/win-unpacked/embedded-practice.exe`；项目 `packaged`，构建 `20261029.4-oral-timer`，结构17。每项使用独立系统TEMP目录；运行对象附件保留在原始报告中。
- 359项源码/测试/配置与口述计时最终冻结记录逐项SHA256一致；20份本地运行文件与指定EXE的ASAR包内文件逐项一致，见 `source-package-audit.json`。
- 原始 `../oral-timer-20261029/packaged-full-01.json` 独立解析确认406项每项仅一次passed结果、retry=0，零跳过/失败/flaky。该完整回归属于前次交付证据，本轮未重跑406项。
- `git diff --check` 通过。旧代码复查/验收记录忽略行尾差异后仅有追加，未删改历史失败结论。

## 静态复查

核对新增数据库表和13至17迁移、复习完成和活动写入事务、关联/目标的版本比较更新与重试、检索绑定参数与答案范围、最近练习的当前版本语义、配额缺额阻止和确认建轮、计划/题单成功建轮使用时间、备份新增表校验、固定IPC参数与来源校验、保存守卫及计时暂停/临时状态。未发现本次合并阻断项；这不表示穷尽所有缺陷。

保留首轮失败、后续修正与原报告，不合并不同轮次来计算通过数，不放宽测试断言。`changes-before.patch` 和 `status-before.txt` 记录检查前状态，`source-before.json` 用于合并后核对源码保持。

## 边界

本轮不重建安装包，不连接或迁移正式用户库，不替换桌面程序，不推送远程，不删除原有分支。锁屏/系统休眠、系统DPI/输入法、多屏及完整人工安装体验未验证；原VMware跳过状态保持。自动化及静态检查不能替代这些人工验收。

## 实际合并结果

功能提交552e2f8，main已从6fbce18快进至该提交，无冲突；原工作目录已切换main，合并后359项来源哈希保持，随后仅追加本节及开发记录。三个原有本地分支全部保留且均已包含于main；没有推送。Git长路径与缺少提交身份的环境问题以单次命令参数解决，未改持久配置。
