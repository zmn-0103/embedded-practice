# Embedded Practice 夜间持续改进报告
**报告日期：2026-11-02（周一，台北时间）**

① **健康度：黄。** 默认分支可读，未发现已证实的 P0/P1 缺陷；但最新备份恢复与导航修复尚缺 Windows 打包版本验证，属于重要验证缺口。  
② **变化基线：** 历史状态 C，无法确认此前有效巡检台账；检查最近 3 天，共发现 7 次默认分支提交、1 个已关闭但未合并的 PR。  
③ **周一专题：** 完成刷题主流程、布局与导航的静态检查。近期导航缺陷已有修复及开发版测试证据，未发现新的、证据充分的核心流程阻断。  
④ **最高优先级：P2。** 当前主要关注打包验证缺口、历史增长后的筛选性能，以及尚未合并的跨平台测试修复。  
⑤ **次日建议：** 优先补齐最新数据恢复与笔记导航修复的 Windows packaged 回归验证；不建议立即开展大规模重构。

## 巡检台账快照

**2026-11-02｜95959d3680e92a4ffb94ede12402daacb5c22ae8｜2026-10-30 01:00 至 2026-11-02 01:00（UTC+8）｜C**

本轮仅使用临时稳定键，不分配正式 EP 编号。

| 编号 | 状态 | 优先级 | 稳定键 | 描述 | 关键证据 | 状态日期 |
|---|---|---|---|---|---|---|
| 临时待追踪 | 新发现 | P2 | `tests/e2e/recovery-guards.spec.ts#packaged-coverage` | 最新恢复与导航修复缺少打包版验证 | [验收记录](https://github.com/zmn-0103/embedded-practice/blob/main/docs/验收记录.md?utm_source=chatgpt.com) | 2026-11-02 |
| 临时待追踪 | 新发现 | P2 | `src/main/database/repositories/question-selection.ts#lastPracticeJulianSql` | 大历史量下最近练习筛选耗时增长 | [性能证据](https://github.com/zmn-0103/embedded-practice/blob/main/docs/evidence/recovery-guards-20261031/README.md?utm_source=chatgpt.com) | 2026-11-02 |
| 临时待追踪 | 状态待确认 | P2 | `tests/unit/backup-ipc.test.ts#file.filePath` | Linux 单测路径假设，关联 PR #1 已关闭未合并 | [PR #1](https://github.com/zmn-0103/embedded-practice/pull/1?utm_source=chatgpt.com) | 2026-11-02 |
| 临时待追踪 | 新发现 | P2 | `.gitignore#output` | 测试输出仍被跟踪，存在 Windows 长路径维护风险 | [清理证据](https://github.com/zmn-0103/embedded-practice/tree/main/docs/evidence/local-cleanup-20261030?utm_source=chatgpt.com) | 2026-11-02 |

上述候选均需在恢复有效历史台账后进行根因匹配，不能直接转换为四个新的正式编号。

---

## A. 仓库基线

### A1. 仓库与分支

仓库：[zmn-0103/embedded-practice](https://github.com/zmn-0103/embedded-practice?utm_source=chatgpt.com)

| 项目 | 当前确认结果 |
|---|---|
| 默认分支 | `main` |
| HEAD | `95959d3680e92a4ffb94ede12402daacb5c22ae8` |
| 最新提交时间 | 2026-10-31 19:35:39（UTC+8） |
| 可见远程分支 | `main` |
| 开放 Issues | 0 |
| 开放 PR | 0 |
| 最近关闭 PR | #1，未合并 |
| 当前版本 | V0.0.3 |
| 数据库结构 | 17 |
| 目标平台 | Windows x64 |
| 运行模式 | 单机、离线、SQLite |

HEAD 对应提交：

[fix: 补齐备份校验与故障恢复并修复笔记导航](https://github.com/zmn-0103/embedded-practice/commit/95959d3680e92a4ffb94ede12402daacb5c22ae8?utm_source=chatgpt.com)

当前默认分支未发现与这些修复关联的开放 PR。

### A2. CI 状态

默认分支根目录不存在 `.github/workflows`，可读取的 Actions 运行集合为 0 条。

**CI 结论：未配置。**

本轮无法通过工作流列表接口独立枚举工作流启用状态，但默认分支目录与运行记录均未显示现行工作流。

因此没有可报告的最近有效完成运行，也没有能够计算连续失败次数的工作流序列。

按照巡检规则，未配置 CI 本身不构成健康度降级依据。

### A3. 文档基线

已读取并核对：

- `AGENTS.md`
- `README.md`
- `计划书.md` 的结构与相关入口
- `docs/README.md`
- `docs/AGENTS.md`
- `docs/开发记录.md` 最新条目
- `docs/验收记录.md` 当前条目
- `docs/开发说明.md`
- `docs/项目模块职责.md`
- `docs/练习保存与统计契约.md`
- `docs/数据保护与桌面边界.md`

计划书实际位于仓库根目录：

[计划书.md](https://github.com/zmn-0103/embedded-practice/blob/main/计划书.md?utm_source=chatgpt.com)

专项开发计划包括：

[UI 学习工作台开发计划](https://github.com/zmn-0103/embedded-practice/blob/main/docs/UI学习工作台开发计划.md?utm_source=chatgpt.com)

[功能体验优化开发计划](https://github.com/zmn-0103/embedded-practice/blob/main/docs/功能体验优化开发计划.md?utm_source=chatgpt.com)

这些文件路径已通过目录确认。本轮未将历史计划中的待办描述直接认定为当前缺陷。

---

## B. 最近变化与周一专题

### B1. 最近三天变化

本轮确认最近三天默认分支有 7 次提交。

主要变化包括：

**2026-10-30：V0.0.3 题库与交付调整。**

新增或整理了 23 个专题、382 道题目，并更新相关交付材料。

[V0.0.3 题库交付提交](https://github.com/zmn-0103/embedded-practice/commit/b4b12ada44b2898eba4c28a235d6de7b5a6aac5c?utm_source=chatgpt.com)

**2026-10-30：文档职责整理。**

README、业务契约、开发记录及历史材料的职责得到重新划分。

[文档整理提交](https://github.com/zmn-0103/embedded-practice/commit/4d36b74dc3c41319797bebd15e7b8704977373f7?utm_source=chatgpt.com)

**2026-10-31：数据恢复和笔记导航修复。**

涉及七个生产源码文件，主要包括：

- `startup-store.ts`
- `index.ts`
- `backup.ts`
- `restore-files.ts`
- `validate-backup.ts`
- `App.tsx`
- `BackupPanel.tsx`

同时新增恢复保护和性能测量测试。

该提交直接涉及数据安全及核心导航行为，因此是本轮重点复核对象。

### B2. 周一专题：刷题主流程、布局与导航

检查范围包括：

| 模块 | 检查重点 |
|---|---|
| `App.tsx` | 页面切换、导航锁定、笔记保存 |
| `LearningOverview.tsx` | 总览、继续练习、新练习入口 |
| `PracticeWorkspace.tsx` | 建轮、继续、保存返回 |
| `LibraryBrowser.tsx` | 题目选择、详情、返回位置 |
| `BoardEntrance.tsx` | 板块入口和导航 |
| `TopicNavigator.tsx` | 分类与专题导航 |
| `note-saves.tsx` | 跨页面保存协调 |

#### 导航修复复核

当前 `App.tsx` 中，导航锁定条件已区分数据操作忙碌、保存正在执行和笔记存在待保存状态。

页面切换时，如果存在未确认的笔记保存，会先调用统一保存协调器；只有保存成功才执行切页。

[App.tsx 导航实现](https://github.com/zmn-0103/embedded-practice/blob/main/src/renderer/src/App.tsx?utm_source=chatgpt.com#L43-L97)

历史验收记录显示：

- 原导航问题曾被复现；
- 最终开发版定向测试 21/21 通过；
- 单元测试 784/784 通过；
- 扩大回归中旧断言曾出现一次失败，随后调整为验证实际保存保护行为；
- 未执行最新修复的完整 Windows packaged 验证。

因此，**可以确认源码已有针对性修复及开发版验证证据，但不能确认当前个人桌面 EXE 已包含并通过该修复。**

#### 练习主流程

`PracticeWorkspace.tsx` 仍采用原有控制器管理练习创建、继续和保存返回。

未发现新建轮次绕过原练习控制器的直接代码证据。

`LibraryBrowser.tsx` 在切换题目、筛选和翻页时使用笔记保存协调器，未发现可直接确认的新增数据丢失路径。

这些是静态检查结论，不等于本轮执行了 Electron 回归测试。

#### 布局

板块、总览、题库和练习入口的职责与现行模块文档基本一致。

本轮没有发现足以进入候选清单的新增布局阻断缺陷。

系统 DPI、IME、多显示器及最新安装包布局未运行验证。

---

## C. 候选开发任务

### C1. 补齐最新恢复与导航修复的 Windows packaged 验证

**状态：新发现｜P2｜证据强**

稳定键：

`tests/e2e/recovery-guards.spec.ts#packaged-coverage`

**问题与用户价值**

2026-10-31 的修复涉及启动数据库检查、恢复前保护、异常文件处理以及笔记导航。

这些能力直接关系到个人学习记录的安全性。

当前已有开发 Electron 验证，但没有对应的最新打包程序验证。

[2026-10-31 验收记录](https://github.com/zmn-0103/embedded-practice/blob/main/docs/验收记录.md?utm_source=chatgpt.com)

**当前行为**

源码与开发版测试已经更新；既有个人桌面程序不能仅凭相同界面版本标识认定包含最新修复。

**预期行为**

在独立构建的 Windows x64 完整程序中，验证以下路径：

1. 正常数据库启动及练习恢复。
2. 损坏数据库进入仅恢复模式。
3. 无效备份被拒绝。
4. 恢复保护失败时不替换原文件。
5. 替换失败能够按契约回退。
6. 笔记保存失败时不离开当前页面。
7. 保存成功后可以正常导航。

**建议范围**

主要涉及：

`tests/e2e/recovery-guards.spec.ts`

`tests/e2e/helpers.ts`

`docs/验收记录.md`

必要时更新 `docs/开发说明.md` 中的验证入口。

优先复用已有测试，不重复实现一套恢复测试框架。

**工作量：中。**

涉及约 2–3 个关联模块；可能需要补充 packaged 专项测试；Electron、SQLite、文件恢复和真实 Windows 程序的联合验证复杂度较高。

**风险与依赖**

必须使用新建的完整免安装目录，不能覆盖现有个人程序。

测试数据库必须位于独立临时目录。

**验收标准**

- 明确记录被测 EXE 的绝对路径、构建标识、数据库结构和实际数据目录。
- 恢复与导航专项在 packaged 项目中通过。
- 失败、取消和回退场景均核对原始文件保护。
- 无跳过、无自动重试掩盖失败。
- 原始失败报告保留。
- 不能将开发版通过结果重复记为打包版通过。

Windows 人工验收建议：额外检查真实文件选择对话框、窗口关闭、重启及错误提示；与自动化结果分别记录。

---

### C2. 优化大历史量下的最近练习筛选

**状态：新发现｜P2｜证据强**

稳定键：

`src/main/database/repositories/question-selection.ts#lastPracticeJulianSql`

**问题与用户价值**

当前最近练习筛选通过历史记录计算题目最后揭晓时间。

生产查询包含关联历史表的时间聚合逻辑。

[question-selection.ts](https://github.com/zmn-0103/embedded-practice/blob/main/src/main/database/repositories/question-selection.ts?utm_source=chatgpt.com)

已有测试使用 5000 道生成题及 0、10 万、50 万条练习历史，实际通过生产 IPC 测量。

50 万历史项时：

| 查询 | 暖查询中位数 |
|---|---:|
| 不限历史、默认顺序 | 11.46 ms |
| 7 天未练、默认顺序 | 397.51 ms |
| 7 天未练、最久优先 | 565.42 ms |

[原始性能报告](https://github.com/zmn-0103/embedded-practice/blob/main/docs/evidence/recovery-guards-20261031/recency-performance-final-02.json?utm_source=chatgpt.com)

**当前行为**

普通查询仍较快，但高级筛选耗时随历史规模明显增长。

目前没有真实用户卡顿报告，因此不判定为 P1。

**预期行为**

降低大历史量下的筛选成本，同时保持题目匹配、排序和组卷语义。

**建议方案**

优先分析查询计划、现有索引和重复聚合。

评估是否可以复用单次历史聚合结果，减少重复扫描。

不得为性能优化改变“未练”“最近 7 天”“最近 30 天”和“最久优先”的业务定义。

**工作量：中至大。**

涉及公共选题 SQL、关联查询调用方及性能/正确性测试，预计 3 个以上关联模块；需要新增或扩展回归测试，验证复杂度较高。

**验收标准**

- 使用已有 `recency-performance.spec.ts` 的数据分布建立可比较基线。
- 同环境、同数据、同预热规则下获得可重复的性能改善。
- 建议以最慢组合中位数下降至少 20% 作为优化目标，而非预先宣称已经达到。
- 全部筛选结果数量、首题排序及固定队列语义保持。
- 不影响方案、配额及练习创建。
- 不修改历史记录以换取性能。

Windows 验收建议：在独立大样本数据库中执行开发版性能测试，再对新打包程序进行定向复测。

**暂不列为次日首选**，因为该项涉及公共查询语义，回归面大于 C1。

---

### C3. Linux 单元测试中的 Windows 路径假设

**状态：状态待确认｜P2｜证据强**

稳定键：

`tests/unit/backup-ipc.test.ts#file.filePath`

关联：

[PR #1：修复云端单元测试的 Windows 路径假设](https://github.com/zmn-0103/embedded-practice/pull/1?utm_source=chatgpt.com)

**问题**

当前默认分支测试文件仍存在硬编码 Windows 绝对路径。

例如 `backup-ipc.test.ts` 中使用 `C:/...` 作为对话框返回值，而生产 IPC 会调用宿主平台的 `isAbsolute()` 校验。

在 Linux 上，这种路径不被视为 POSIX 绝对路径。

另一相关文件 `data-locations-ipc.test.ts` 的大小写测试也依赖宿主路径语义。

已有 PR 证据记录 Linux 基线 781 项中 12 项失败，修改测试夹具后 782/782 通过。

但 PR #1 已关闭，且未合并到 `main`。

**当前状态判断**

不能因为 PR 已关闭就认为修复完成，也不能自动将其认定为维护者否决。

因此标记为“状态待确认”。

**建议范围**

两个单元测试文件：

`tests/unit/backup-ipc.test.ts`

`tests/unit/data-locations-ipc.test.ts`

不需要修改生产 IPC 的路径安全检查。

**工作量：小。**

两个测试文件；需要补充平台语义检查；Linux 单元验证简单，Windows 兼容复核仍必要。

**验收标准**

- Linux 完整单元测试通过。
- Windows 原有测试语义保持。
- 相对路径拒绝、真实路径核对等安全断言保留。
- 不通过修改生产校验或删除断言制造通过。

Windows 验收建议：运行完整单元测试，并确认文件选择及数据位置功能没有回归。

由于关联 PR 已关闭且缺少可持久化处理决定，本项不进入 D 节。

---

## D. 次日优先开发建议

### 推荐：C1——补齐 Windows packaged 数据恢复与导航验证

**推荐数量：1 项。**

选择依据：

- 已有明确的生产源码变更。
- 已有可复用的 Electron 测试。
- 最新打包验证缺口由验收文档直接确认。
- 用户价值明确，涉及个人学习数据保护。
- 不需要新增产品功能或数据库结构。
- 可以限定在一个 PR 内完成。
- 不依赖未解决的产品需求决策。

预期交付为一份可审查的验证改进 PR，包含必要测试调整、明确的 packaged 测试结果及验收记录。

如果测试发现真实生产缺陷，应先保留失败证据，再判断是否仍属于本 PR 的最小修复范围；不能为追求通过而扩大或削弱测试。

---

## E. Codex Desktop 提示词

以下内容可直接交给 Codex Desktop 执行。

```markdown
# Embedded Practice：Windows packaged 恢复与导航回归验证

## 目标

为当前 main 上已完成的备份恢复与笔记导航修复，
补齐 Windows x64 完整免安装程序的回归验证。

本任务不新增产品功能，不修改数据库结构，
不替换用户现有桌面程序。

## 已确认事实

- 仓库：zmn-0103/embedded-practice
- 巡检 HEAD：95959d3680e92a4ffb94ede12402daacb5c22ae8
- 产品版本：0.0.3
- 数据库结构：17
- 最近修复涉及数据库启动预检、恢复保护、
  异常文件回退和笔记导航保存守卫。
- 开发 Electron 已有对应验证证据。
- 最新修复尚无完整 Windows packaged 验收记录。

执行前重新核对 main 当前 HEAD，不假设其保持不变。

## 先检查

1. 用户全局规则。
2. 仓库根 AGENTS.md。
3. tests/AGENTS.md。
4. docs/开发说明.md。
5. docs/数据保护与桌面边界.md。
6. docs/验收记录.md 最新条目。
7. tests/e2e/recovery-guards.spec.ts。
8. tests/e2e/helpers.ts。
9. playwright.config.ts。
10. package.json。

按仓库规则检查适用工程技能。

## 工作范围

优先复用现有 recovery-guards 测试。

需要时补充 packaged 专项验证，但不得复制整套测试逻辑。

重点覆盖：

- 正常数据库启动；
- 损坏数据库仅恢复模式；
- 非法备份拒绝；
- 恢复保护失败；
- 文件替换失败回退；
- 笔记保存失败阻止切页；
- 保存成功后正常导航。

## 非目标

- 不新增恢复功能。
- 不改变数据库结构。
- 不优化最近练习 SQL。
- 不重构导航架构。
- 不处理 PR #1。
- 不部署、发布或替换个人桌面程序。

## 验证

仓库 package.json 已定义：

npm run check
npm test
npm run build
npm run test:packaged

docs/开发说明.md 已提供使用 electron-builder
创建独立 Windows x64 完整免安装目录的命令。

必须使用文档中的独立输出目录方案，
不得覆盖现有 release 交付。

packaged 定向测试使用仓库现有文件：

tests/e2e/recovery-guards.spec.ts

参考 docs/开发说明.md 中的 test:packaged 调用方式。

执行前必须：

- 明确新 EXE 的绝对路径；
- 设置 EMBEDDED_PRACTICE_PACKAGED_EXECUTABLE；
- 创建独立临时测试数据目录；
- 使用新的 Playwright 报告输出目录；
- 核对实际运行程序、构建标识和数据库结构。

不能使用旧 EXE 冒充新构建。

## 验收标准

1. packaged 测试实际运行且结果可复核。
2. 数据恢复失败路径保持原始文件。
3. 笔记保存失败时页面与输入保持。
4. 保存成功后导航正常。
5. 不跳过失败、不增加自动重试掩盖问题。
6. 保留原始失败与修复后报告。
7. 分别记录自动化和人工验收结果。
8. 未执行的系统场景明确标记未验证。

## 安全要求

- 在独立分支或 Worktree 中工作。
- 保护已有修改，不直接修改 main。
- 仅使用隔离测试数据。
- 不访问、覆盖或迁移正式个人数据库。
- 不修改现有个人桌面程序。
- 不绕过失败，不修改断言制造通过。
- 不自动合并 PR。
- 不自动发布或部署。

## 完成报告

报告：

1. 实际基线提交。
2. 变更文件。
3. 新增或调整的测试场景。
4. 每条实际执行命令及退出码。
5. 开发版和 packaged 测试结果。
6. 被测 EXE 与测试数据目录。
7. 原始测试证据位置。
8. 未验证事项。
9. 风险及后续建议。

若测试失败，保留失败现场，
不得将未通过结果描述为完成。
```

---

## F. 其他候选

### `.gitignore#output`

**状态：新发现｜P2**

当前 `.gitignore` 未整体忽略 `output/`，默认分支已经跟踪部分测试输出。

最近提交也包含 `output/recovery-guards-20261031/` 下的运行结果和附件。

已有历史清理记录出现 Windows 长路径相关 Git 操作错误。

[当前 .gitignore](https://github.com/zmn-0103/embedded-practice/blob/main/.gitignore?utm_source=chatgpt.com)

[历史长路径证据](https://github.com/zmn-0103/embedded-practice/blob/main/docs/evidence/local-cleanup-20261030/diff-check-final.json?utm_source=chatgpt.com)

这构成可定位的仓库维护风险，但尚不能证明当前默认分支在所有 Windows 环境中无法检出。

建议后续审查测试产物跟踪策略，区分必须保留的原始证据与可再生成的临时文件。

暂不优先原因：涉及既有证据保留约束，不能直接删除历史材料或批量清理。

本轮其余候选均已在 C 节展开，没有额外未展示项。

---

## G. 未解决问题与限制

### G1. 已确认事实

1. 当前默认分支为 `main`，HEAD 为 `95959d3...`。
2. 最近三天有 7 次默认分支提交。
3. 当前没有开放 Issue 或 PR。
4. PR #1 已关闭、未合并。
5. 默认分支未配置可见的 GitHub Actions 工作流。
6. 2026-10-31 的恢复与导航修复已有开发版测试证据。
7. 最新修复缺少完整 Windows packaged 验证记录。
8. 最近练习高级筛选存在实际测量到的历史规模相关耗时增长。

### G2. 合理推断

最新数据保护修改的验证风险高于普通界面文案或样式修改。

因此，在继续扩大功能范围前，先完成打包版恢复回归具有较高价值。

这不意味着当前代码已经存在新的数据损坏缺陷。

### G3. 待验证假设

- 新打包 EXE 是否完整通过现有恢复保护测试。
- 最新源码与现有个人桌面 EXE 是否存在功能差异。
- 最近练习筛选在真实个人使用规模下是否产生可感知卡顿。
- Linux 路径测试修复是否仍符合维护者当前处理意图。
- 现有测试输出跟踪策略是否影响全新 Windows 检出或日常 Git 操作。

### G4. 弱证据观察

周一专题中未发现其他值得以弱证据新增候选的导航或布局问题。

没有把未经运行验证的交互猜测列为缺陷。

### G5. 历史台账限制

本轮按固定任务 ID 读取历史。

确认任务身份匹配，但读取到的最近运行是当前执行中的 `in_progress`，此前 `latest_result` 为 `null`。

因此无法证明这是首次执行，也无法恢复完整历史台账。

**历史分类：C。未能读取历史报告，去重不完整。**

比较窗口限定为：

2026-10-30 01:00 至 2026-11-02 01:00，台北时间。

本轮所有候选仅使用临时稳定键。后续恢复有效台账时，必须按根因映射，不能重复建立正式候选。

### G6. 人工决策文件

默认分支未发现：

`docs/巡检决策.md`

本轮未创建该文件。

聊天中的“不做”或“以后再做”不能自动跨轮持久化。

如需持久记录维护决定，可由维护者手动使用以下格式：

```text
候选编号或稳定键 | wontfix/deferred | 记录日期 | 复查日期 | 理由
```

例如：

```text
src/main/database/repositories/question-selection.ts#lastPracticeJulianSql | deferred | 2026-11-02 | 2026-12-01 | 等待进一步性能验证
```

上述仅为格式示例，不代表已经作出延期决定。

延期还必须满足有效维护者标签等条件，不能仅凭文件记录直接生效。

### G7. 本轮执行边界

本轮只读取了远程仓库、文档、提交、PR、代码及既有测试证据。

没有执行以下操作：

- 修改任何仓库文件；
- 创建或切换分支；
- 提交、推送或创建 PR；
- 触发 CI、构建或测试；
- 访问用户电脑；
- 访问个人数据库；
- 打包、部署或发布程序。

所有 Windows、Electron 和 SQLite 测试结果均来自仓库已有记录，不是本轮重新执行的结果。

**最终结论：健康度黄，未确认新的 P0/P1 缺陷。建议优先关闭最新数据保护修复的打包验证缺口，再考虑性能优化和跨平台测试维护。**