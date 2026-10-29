# 我的积累检索与知识关联证据

2026-10-29，用户在复习待办交付后要求继续，按原候选顺序实现普通关键词检索与人工易混/前置/项目场景关联。保持 `codex/functional-ux-next-20261028`、HEAD `6fbce18` 及前两批未提交工作；没有自动提交、推送或操作正式个人数据。

## 对象和边界

- 产品0.0.2、构建 `20261029.2-knowledge-links`、结构16、Windows x64。
- 开发入口 `E:/My_Projects/embedded-practice/out/main/index.js`；独立EXE `E:/My_Projects/embedded-practice/release/V0.0.2-knowledge-links-20261029.2/win-unpacked/embedded-practice.exe`。
- 打包检查显式设置 `EMBEDDED_PRACTICE_PACKAGED_EXECUTABLE`，每场景使用新建 `embedded-practice-*` TEMP。准备辅助核对实际EXE、packaged、userData、构建与结构；文件对话框及指定故障为替身，生产IPC/数据库/窗口/导入/保存真实执行。
- `before/` 保存改前323项来源清单、Git差异/状态和61459字节计划书；`plan-preservation.json` 核对原完整字节前缀，只追加本批范围。原四张参考图、旧程序和旧报告保持。

## 已执行

- 最终同EXE完整单轮 `packaged-full-01.txt/json` **385/385**、830.272秒，零失败/跳过/flaky/自动重试；12项新增场景与全部旧回归均通过。`final-test-summary.json` 遍历核对每项仅一次执行、retry=0，并与单元755项及最终冻结来源对应。
- `check-02.txt` 类型与Prettier通过；`unit-02.txt/json` 为46文件 **755/755**，覆盖原功能及新知识契约/关联控制器。
- `build-final-04.txt`、`pack-01.txt`：最终构建和独立完整解包通过；未改变依赖、锁或构建配置。
- `development-core-01`：**3/3**。两端关系/CAS/重复/幂等/删除不复活/真实写失败/归档分页；来源片段合并、字面特殊字符/长笔记有界、当前版本/归档/答案隔离；最近10词/重复提升/只读查询与回滚。
- `development-ui-01`：**4/5**，窄窗详情继承原题库容器隐藏规则而不可见，已修正；其余返回/输入保护/双向对照组卷/揭晓边界通过。
- `development-all-02`：**12/12**；新增真实结构15升级/失败回滚、完整恢复及损坏拒绝，修正窄窗通过。
- `development-entry-03`：**1/1**，同一用例补齐题库先确认再取消、我的积累实际确认建轮，覆盖新增App回调。
- `development-all-04`：**12/12**，补齐对照读取后的定位与焦点，避免用户点击后仍留在表单。之后仅补充rowid恢复能力检查及同场景损坏输入，最终打包完整报告另存。
- `package-verification.json`：19份包内out/SQLite组件与最终构建逐字节一致。`source-final.json` 为337项来源/测试/配置清单，后续变化需另存并说明。

各次运行独立记录，不把重复定向累加为新场景；完整桌面实际结果见 `packaged-full-01.txt/json` 及最终汇总。旧批完整首轮371/373与专项26/26保持原样，本批新结果不改写历史。

## 失败和复查

- `typecheck-01` 发现Record展开未保留SQLite字段类型，以及旧服务替身缺新方法；显式取字段并补强类型替身，02通过，没有使用any/取消严格校验。
- 静态复查发现已有关系记录的revision/updatedAt可能被展开进严格写请求；控制器只取四个可写字段，并在单元中验证真实发出命令。
- 首轮UI窄窗失败来自 `.library-reader-pane` 的独立题库隐藏规则；积累详情改用自身容器，原题库响应规则不改，失败报告和现场保留。实际图片复查后，对照读取完成会直接定位/聚焦，两题笔记重绘不抢焦点。
- 最近关键词以成功插入顺序保留10个，重复词提升；同毫秒不按文字顺序丢弃最新词，也不补造时间。备份要求rowid能力，拒绝被改为WITHOUT ROWID的伪兼容表。
- `check-01` 类型通过但顺序SQL换行未格式化；通过原Prettier修正，`check-02`通过。未改依赖、放宽超时/断言或启用自动重试。
- 每文件Bug/维护性两轮结论在 `docs/代码复查记录.md`，静态复查不等同运行通过。

## 迁移、恢复和保留

`schema-v15.sql` 来自上一版真实EXE在新TEMP生成的结构15，只读提取28对象与3项初始化记录；SHA256 `62c7780f844348980f8cde639107aaf11152a56b191704c194e226bcedd8db95`。来源/实际对象/路径见 `schema-v15-source.json`，旧14/12等夹具不改。

15升16只增关联与近期查询两表/索引，验证原待办/笔记/标签/方案/题单/活动轮/草稿/自定义对象及保护备份逐表保持。备份阻塞或第二表冲突也整批回滚到15。生产完整备份恢复包含说明/方向/修订与最近词顺序；重复ID/无序题目对、自关联、孤儿、文字/修订/日期、近期重复/容量/rowid损坏均拒绝，来源字节和当前库保持。

`preservation-audit.json` 核对8项配置、个人标签版147文件、复习待办版150文件，以及新目录17份题库/主题/来源材料保持。新目录使用独立LOCALAPPDATA安全入口，安全cmd仅静态核对，实际自动化直接启动明确EXE和新TEMP。

## 未验项目和复跑

本轮不执行NSIS安装/发布、Windows系统DPI/IME、多屏、原生对话框、长期、性能、硬件或完整人工验收，VMware跳过保持。页面缩放/截图只证明指定布局及操作，不外推这些系统边界。参考答案技术正确性仍由用户审阅。

复跑使用新报告名和输出目录。需CLI `--reporter=list,json` 配合环境变量，避免固定JSON配置覆盖独立报告；带竖线grep表达式使用Node直接运行CLI。

```powershell
$env:EMBEDDED_PRACTICE_PACKAGED_EXECUTABLE='E:/My_Projects/embedded-practice/release/V0.0.2-knowledge-links-20261029.2/win-unpacked/embedded-practice.exe'
$env:PLAYWRIGHT_JSON_OUTPUT_NAME='docs/evidence/<新的批次>/packaged.json'
node node_modules/@playwright/test/cli.js test --project=packaged --reporter=list,json --output=output/playwright/<新的批次>
```
