# 会话筛选快照缺口修复证据

日期：2026-10-21。用户明确要求“只需要修复问题，不需要继续开发”。范围见[修复说明](../../M3会话筛选快照修复.md)。本轮仅补齐计划书 5.2 要求的会话创建筛选快照、读取与旧库保护，不开展 M4/M5。

## 原因与修改

原建轮已使用筛选条件选题，但会话表只保存模式/专题等八字段，回执只有不可逆请求哈希，重开无法还原原条件。原复查实际样本见[保留的筛选检查](original-filter-persistence.json)，源码改前 826 文件副本/哈希见 [environment.json](environment.json)。

结构 6 增补 filters_json：建轮严格校验/规范化五项条件，选题与保存共用同一目标，省略条件的新轮保存明确默认对象；会话/快照/固定队列/旧轮结束/回执同事务。开始请求/回执形状与旧哈希保持，重试不重抽或改写条件。读取必须返回完整对象或旧轮 null，坏对象报错，不冒充默认/未知。活动轮的“本轮创建条件”只读展示，与首页新轮编辑独立，继续始终读取固定队列。

v1～v5 先 SQLite 一致性备份并校验，再事务迁移；旧会话统一 NULL，不从当前题目、状态或哈希反推。v5 只增列，原作答/图片/收藏/回执/显示设置及自定义对象保留，v3 原约束替换限制保持。备份失败停止，冲突列/坏外键回滚，禁止自动空库。旧结构 5 或更低版本程序不能打开新库。

## 环境与边界

Windows 11 x64（10.0.26200）、Node.js 24.19.0、npm 11.17.0、Electron 42.11.15、better-sqlite3 12.11.1，应用 0.1.0。全部运行显式使用独立临时目录，未连接默认正式或开发学习库。系统文件框、提交后的响应时序明确替身，其余通过真实桥接/SQLite/窗口/正常关闭及独立进程重开。

5 个生产文件与 11 个测试/夹具文件逐个完成 Bug 与可维护性复查，见[复查记录](../../代码复查记录.md)和 [code-change-audit.json](code-change-audit.json)。计划书、原题库、依赖/锁文件、构建配置与练习保存控制器保持。

[新包核对](package-inspection.json)确认 13 个运行文件、6 个许可副本与构建逐字节一致，原生 SQLite 模块一致，旧 M0 NSIS 哈希保持。解包程序已重新生成；完整回归后续只修正测试 SQL 探针，生产构建与包未变。解包子进程 PATH 仅 System32；未制作或安装新 NSIS。

## 实际检查

| 检查 | 结果 | 原始记录 |
|---|---|---|
| 类型/格式 | 通过；最初固定表键缺少非空类型标记，修正后通过 | [首次](check-first.log)、[最终](check-final.log) |
| 单元 | 24 文件、503/503；新增 11 项，原 492 项保持 | [报告](unit-tests.json)、[日志](unit-tests.log) |
| 源码构建 | 通过 | [日志](build.log) |
| Windows x64 解包构建 | 通过 | [日志](package.log) |
| 定向首轮 | 17/19；两模式测试遗漏展开重新创建的筛选区，原失败保留 | [报告](targeted-first-tests.json)、[日志](targeted-first.log) |
| 修正后五项快照场景 | 5/5 | [报告](reopen-fixed-tests.json)、[日志](reopen-fixed.log) |
| 首轮完整开发/解包 | 各 100/101，合计 200/202；旧约束探针八值插入未同步新列 | [报告](full-first-tests.json)、[日志](full-first.log) |
| 约束探针修正后两形态定向 | 2/2 | [报告](constraint-fixed-tests.json)、[日志](constraint-fixed.log) |
| 最终完整两形态 | 开发 101/101、解包 101/101，合计 202/202；原各 92 项保留，零失败/跳过/flaky/自动重试 | [报告](final-full-tests.json)、[日志](final-full.log) |

命令：`npm run check`，`npm test -- --reporter=default --reporter=json --outputFile=docs/evidence/session-filters-fix/unit-tests.json`，`npm run build`，`npm run pack:dir`；新增两文件与既有 v3/v4 迁移在 development 定向，旧草稿约束在两形态定向。最终完整：

```powershell
$env:PLAYWRIGHT_JSON_OUTPUT_NAME = 'docs/evidence/session-filters-fix/final-full-tests.json'
npx playwright test --reporter=list,json --output=tmp/session-filters-final-confirmed
```

## 九项新增场景

| 场景 | 证明范围 | 开发 / 解包数据 |
|---|---|---|
| 顺序原条件重开 | 五项非默认条件规范化、真实作答/自评/位置、修改首页/收藏/导入后原条件/固定版本/队列不变，正常关闭独立重开及继续 | [开发](development-filters-reopen-sequential.json) / [解包](packaged-filters-reopen-sequential.json) |
| 随机原条件重开 | 同上，实际随机顺序及版本固定，不按原条件重新取样 | [开发](development-filters-reopen-random.json) / [解包](packaged-filters-reopen-random.json) |
| 原子提交与原请求重试 | 队列插入触发器故障整轮/快照/回执回滚；移除后真实提交但丢返回，同请求重试不改全快照，改变条件同 ID 拒绝 | [开发](development-filters-atomic-retry.json) / [解包](packaged-filters-atomic-retry.json) |
| 省略条件 | 新轮明确保存 EMPTY 对象，旧省略请求不注入字段，重试无新增记录 | 见完整报告 session-filters.spec.ts |
| 坏条件 | 不完整 JSON 对象读取失败、界面不显示伪造条件；修复后原轮/全部业务保持，非法 JSON/数组/字符串 SQL 拒绝 | 见完整报告 session-filters.spec.ts |
| v5 保护升级 | 冻结真实 v5 全部旧业务仅追加 NULL，API/界面未知，旧回执保持，设置保持、备份仍 v5 且无新列，重开不再升级 | [开发](development-filters-v5-preserved.json) / [解包](packaged-filters-v5-preserved.json) |
| 备份阻断 | 停止升级，原文件逐字节保持 | [开发](development-filters-v5-backup-blocked.json) / [解包](packaged-filters-v5-backup-blocked.json) |
| 冲突列 | 不覆盖未知列和旧数据，保护备份保持旧结构，迁移回滚 | [开发](development-filters-v5-column-conflict.json) / [解包](packaged-filters-v5-column-conflict.json) |
| 坏外键 | 迁移检查失败回滚，原库与旧结构保护备份保留 | [开发](development-filters-v5-foreign-key.json) / [解包](packaged-filters-v5-foreign-key.json) |

[冻结 schema-v5.sql](../../../tests/fixtures/schema-v5.sql) 从修复前真实构建在受限临时目录初始化，核对 userData 与实际版本后关闭导出 16 对象，仅有默认元数据/显示行，不包含用户数据。来源与旧构建/归档哈希见 [schema-v5-source.json](schema-v5-source.json)，未从新生产定义反推旧库。既有 v1～v4 来源/备份版本和失败保护保持，v3/v4 成功目标标题显式同步 v6；旧业务逐字段比较只添加新列 NULL 预期，不删旧字段。

## 原失败与修正

首轮两项超时来自测试在练习返回首页后没有重新展开默认收起的筛选区。只补实际 summary 点击与可见断言，未修改产品折叠、输入/队列语义或时限。

首轮完整两项失败来自旧单活动轮约束探针仍用整行八值 INSERT，新增列后先发生列数错误，未触达原唯一性约束。改为明确旧八字段，原五项约束、constraint failed 检查、1MiB/UTF-8 原文与外键断言保持。未修改生产约束来迎合旧测试，所有原始失败保留。

完整窗口截图由 Electron capturePage 在字体/双帧后获取，代表性原条件只读区已目视。截图可见首页新轮条件与本轮原条件分别展示，不将当前筛选反推为旧轮原条件，也不等同 Windows DPI/完整人工验收。

| 原条件窗口 | 开发 | Windows 解包 |
|---|---|---|
| 顺序 | [图](development-original-filters-sequential.png) | [图](packaged-original-filters-sequential.png) |
| 随机 | [图](development-original-filters-random.png) | [图](packaged-original-filters-random.png) |

[结果比较](results-summary.json)、[源码清单](source-manifest.json)、[变更检查](change-audit.json)、[文档静态检查](documents-static.json)分别记录原场景保留、原文档/源码哈希、复查覆盖和 UTF-8/链接。软件检查不替代完整人工验收。既有键盘偏移、额外输入字符来源仍未知，系统 DPI/组合输入中切题退出/外部系统能力/大图/正式题库/新安装包/性能边界保持。未提交、推送或发布，M4/M5 未开展。
