# Linux云端单元路径夹具修复证据

本批仅修改两个单元测试文件。生产代码、产品版本、数据库结构、依赖和业务契约保持。它修复实际Linux云端的测试阻塞，不证明定时调度能够创建指定环境的任务。

## 环境与来源

- 时间：2026-10-31，Asia/Singapore。精确执行时间以 [validation.json](validation.json) 的带时区字段为准。
- 仓库：`zmn-0103/embedded-practice`；远程默认分支 `main`，基线 `ba218d6a6959f95b5b97046993882193b7dbaf9f`，安全fetch后创建独立 `codex/cloud-path-test-portability-20261031` 分支。
- Linux云端，Node24.19.0、npm11.9.0。项目声明npm11.17.0；本批沿用已有依赖，仅执行检查/测试，没有安装依赖或改锁文件。
- 基线目录 `/workspace/embedded-practice`；修改与验证目录 `/workspace/embedded-practice-cloud-path-tests`。依赖目录通过工作树内受忽略目录中的链接复用基线已安装依赖；验证报告逐文件路径确认实际执行的是修改工作树中的测试。
- 基线独立数据目录 `/tmp/embedded-practice-test-data-sa2yr4ke`；修复后 `/tmp/embedded-practice-path-fix-data-1ii3wo5f`，通过 `EMBEDDED_PRACTICE_TEST_DATA_DIR` 传入。单元中的对话框、文件系统和服务使用既有替身，不实际打开夹具指向的路径。
- 已读取仓库及测试/文档规则和相关验证、数据保护契约。当前技能目录未提供 `embedded-code-writing`、`large-codebase-reading`、`ui-design-workflow`，未声称已应用；逐文件两轮静态复查另记[代码复查记录](../../代码复查记录.md#2026-10-31-云端路径测试夹具可移植性)。实际模型/强度未核实。

## 原始失败与最小修改

[unit-before.json](unit-before.json) 是首次完整单元报告的原字节副本，49文件781项中769通过、12失败、0跳过，原报告没有覆盖。SHA-256记录在[验证清单](validation.json)。

- `backup-ipc.test.ts` 失败11项：对话框返回固定Windows路径，但Linux宿主 `isAbsolute('C:/中文 空格/备份.sqlite3')` 为false，正常服务/恢复分支无法进入。夹具改用宿主 `resolve` 构造含中文/空格的绝对路径；生产路径校验与相对路径拒绝断言保持。
- `data-locations-ipc.test.ts` 失败1项：原Windows用例直接依赖宿主 `relative`，Linux将 `logs` 与 `Logs` 视为不同路径。文件内仅包装比较函数，普通场景仍用宿主实现，每个用例重置选择；大小写场景显式调用Node实际的 `win32.relative` 与 `posix.relative`，分别要求打开真实路径或拒绝且不调用系统打开。没有改 `process.platform` 或模拟Windows系统验收。

没有删除断言、忽略用例、增加重试或放松生产保护。新增1项POSIX拒绝检查，所以修复后总数为782。

## 实际验证

| 检查 | 结果 | 证据 |
| --- | --- | --- |
| 基线 `npm test -- --reporter=json --outputFile=…/unit.json` | 退出1；769/781，失败12，跳过0 | [原始JSON](unit-before.json) |
| 修复后 `node node_modules/vitest/vitest.mjs run tests/unit/backup-ipc.test.ts tests/unit/data-locations-ipc.test.ts --reporter=json --outputFile=…/focused.json` | 退出0；44/44，失败0，跳过0 | [定向JSON](focused-after.json) |
| 修复后 `npm run check` | 退出0；TypeScript和源码/配置格式通过 | [原始输出](check-output.txt) |
| 修复后 `npm test -- --reporter=json --outputFile=…/unit-after.json` | 退出0；49文件782/782，失败0，跳过0 | [完整JSON](unit-after.json) |

上表省略的报告路径、完整参数、退出码、起止时间、报告及测试文件摘要均在 [validation.json](validation.json)。定向与完整套件重叠，不合计为826个独立场景。此前同一生产代码基线的构建结果没有记为本批再次构建。

辅助报告核对的首轮标题比较因既有参数化标题含随机UUID而失败；随后仅在比对时规范UUID，原始报告未改。修正后确认除本次一个场景拆为两个外没有用例丢失，文件摘要及新增文档链接通过，见[报告核对结果](report-integrity.json)。这次辅助核对失败不计为Vitest用例失败。

## 未验与边界

- 没有执行Windows桌面、EXE打包、安装器、真实数据库集成、DPI/IME、多屏、长期性能或硬件验收。既有人工与用户跳过事项保持；Linux通过不替代Windows验收。
- 当前会话可以在云端读取代码、执行测试。尚未核实它与指定保存环境配置的映射，也没有创建新的独立Cloud编码任务。
- 应用环境查询仍断连，自动化立即触发曾返回动作执行前404；没有取得新的调度运行ID。不能把手工完成本批工作写成定时链路已经打通。
- 没有新增或修改定时计划、部署、访问正式个人数据或操作用户桌面程序。
