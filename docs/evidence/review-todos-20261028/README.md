# 复习待办与最近练习检查证据

2026-10-28～29，在 `codex/functional-ux-next-20261028`，保留上一批未提交工作与原始证据。用户在个人标签与常用入口交付后要求“继续”，按原候选顺序实施复习待办、最近7/30天未练及最久未练优先。其余检索、关联、目标和配额候选未展开。

## 实际对象与范围

- 产品0.0.2，构建 `20261029.1-review-todos`，数据库结构15，Windows x64。
- 开发入口 `E:/My_Projects/embedded-practice/out/main/index.js`；独立完整程序 `E:/My_Projects/embedded-practice/release/V0.0.2-review-todos-20261029.1/win-unpacked/embedded-practice.exe`。
- 每次启动使用新建的 `embedded-practice-*` 系统临时数据目录，辅助检查核对实际 `process.execPath`、`app.isPackaged`、`userData`、构建标签和结构。打包测试显式设置 `EMBEDDED_PRACTICE_PACKAGED_EXECUTABLE`；不访问正式个人库。
- 文件对话框为明确替身，数据库、事务、导入、窗口、IPC和保存实际运行。SQL触发器/回包丢失只注入特定故障，不替代成功路径。
- `before/` 保存本批改前309项来源清单、差异、状态与60355字节计划书。`plan-preservation.json` 核对原文完整字节前缀，后续范围只追加。

## 已执行检查

- 最终 `check-03.txt` 通过；同EXE完整首轮 `packaged-full-01` 为 **371/373**、758.212秒，2项旧测试适配失败；修正后 `packaged-regression-fixes-01` 两文件专项 **26/26**、41.416秒，精确覆盖两项原失败。两轮均零跳过/flaky/自动重试；新增14项在完整首轮全部通过。
- 本轮没有第二次373/373单次全绿报告；生产/EXE始终保持，后续仅改两份旧测试。`final-test-summary.json` 将完整/专项分开记录并核对原失败ID均被专项覆盖；`source-final-02.json` 为修正后的322项清单。
- `check-01.txt`、`check-02.txt`：TypeScript与既有Prettier检查通过。
- `unit-01.txt/json`：45文件，**747/747**。新控制器覆盖500ms保存、显式完成/重开、未知结果原命令重试、冲突保留和并发/释放；契约覆盖日历、修订、原因、状态和最近条件；路由测试保留来源/暂停/关闭边界。
- `build-development-01.txt`、`build-02.txt`、`pack-01.txt`：开发构建、最终构建和独立解包通过，依赖/锁与构建配置保持。
- `development-todos-01.txt/json`：**10/10**，真实升级/回滚、CAS/归档、完整恢复及损坏拒绝、待办UI/退出/隐私、跨页组卷与窄窗暗色。
- `development-recency-04.txt/json`：**3/3**，精确7/30天边界、时区与MAX揭晓、旧版本及未知时间、三轮先限量后随机、队列重开保持与方案/UI复用。
- `development-round-01.txt/json`：**2/2**，强化揭晓后修改再自评先保存，并验证旧轮复盘中的当前安排与旧历史逐表分离。此为两项定向运行，不与前述数量累加冒充一轮全过。
- `package-verification.json`：19份包内out/SQLite文件与最终构建逐字节一致，并核对构建标签。实际运行范围以对应桌面报告为准。

## 原始失败与修正

- 初次生成改前清单误列不存在的 `tsconfig.json`，脚本在写清单前停止；后按实际存在的7配置成功生成。旧记录原样保留，本轮校验只列真实文件。
- `development-storage-01` 为4/5：测试错误假设未来日期的归档项在第二页；按既定有日期优先规则它在第一页。修正为跨两页按身份核对，10/10中该项通过；产品排序未改变。
- `development-recency-01` 为1/3：旧自评夹具重复插入导入已创建的状态行，另一个定位器假定题库有compact外层。修正为UPDATE与真实分组。
- `development-recency-02` 为2/3：定位同时命中隐藏练习区和题库分组，改为各自语义容器。
- `development-recency-03` 为2/3：正文定位命中同名select选项，限定题目article。04通过，未调大超时、删除精确断言或启用自动重试。
- 完整打包首轮发现 `backup-window` 的备份manifest仍期待结构14，实际正确为15；仅同步该精确测试值，产品、EXE和备份格式保持。首轮报告与修正后复验分开保存。
- 同轮 `themes-reading` 的旧后代summary定位器同时命中新增最近分组，改为原筛选入口的直接子summary。长内容/宽窄辅助/输入与答案隔离断言保持，产品未改变，另行复验。
- 原四批的历史未知原因、首轮与旧结构夹具保持，不以本轮新结果改写。

## 结构14夹具与数据保护

`tests/fixtures/schema-v14.sql` 由上一批 `V0.0.2-personal-tags-20261028.3-r2` 真实EXE在全新TEMP生成后，只读提取26项结构定义与3项初始化记录；没有待办表。SHA256为 `b79d0dd96a9eddbf326cce4794e1c6a7c3fd5862a269fc55b00b5dae27dafddb`，运行对象、数据路径和来源见 `schema-v14-source.json`。旧schema-v12等夹具完全保持。

结构14升级15只新增待办表/索引；测试种入旧笔记、个人标签、置顶/最近时间、活动轮、草稿和自定义对象，逐表核对原记录与保护备份；备份目录阻塞/同名表冲突保持原版本14。完整恢复包含待办完成状态和最近条件方案；无效日历、状态/完成时间、修订、原因上限、重复与孤儿均拒绝且源字节不变。

`preservation-audit.json` 核对7项实际配置、旧147份交付和新目录17份题库/主题/来源材料保持。源码清单另存 `source-final*.json`；补充测试修正不会改变已核对的生产文件或EXE。

## 未验边界

页面缩放与指定窗口检查证明本轮布局/操作，不代替Windows系统DPI/IME、多屏、原生对话框、完整人工、长期、性能或硬件验收。本轮没有生成/安装/发布NSIS、替换桌面、自动迁移正式学习库或访问在线服务；原VMware跳过保持。安全cmd仅静态核对，自动化实际应用启动使用明确EXE及新TEMP。

## 重复执行方式

每次使用新的报告名和输出目录；环境变量需填实际绝对EXE。固定配置的JSON输出会覆盖单独的环境目标，所以必须加CLI `--reporter=list,json`。Windows带 `|` 的grep表达式使用Node直接运行CLI，避免批处理管道解释。

```powershell
$env:EMBEDDED_PRACTICE_PACKAGED_EXECUTABLE='E:/My_Projects/embedded-practice/release/V0.0.2-review-todos-20261029.1/win-unpacked/embedded-practice.exe'
$env:PLAYWRIGHT_JSON_OUTPUT_NAME='docs/evidence/<新的批次>/packaged.json'
node node_modules/@playwright/test/cli.js test --project=packaged --reporter=list,json --output=output/playwright/<新的批次>
```
