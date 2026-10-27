# M4 第一批证据

日期：2026-10-22，Asia/Shanghai。本批授权范围：M3 关键输入/保存/退出聚焦补查，以及 M4 第一批完整备份导出和恢复预览。没有执行当前数据库替换，没有推进 M5，也没有代签人工验收。

## 环境与保护

- Windows 11 x64，Electron 42.11.15，better-sqlite3 12.11.1；依赖与锁文件、正式数据库结构 6 保持。
- [environment.json](environment.json) 保存改前源码/文档快照位置、哈希、当时程序及旧 NSIS 哈希。仓库原有文件均为未跟踪，未清理、提交或推送。
- 自动化只使用显式独立临时数据目录。备份输出夹具位于另一独立临时目录，未把正在使用的数据文件直接复制为导出备份。

## 已执行与原始失败

| 检查 | 实际结果 | 原始证据 |
|---|---|---|
| 首轮类型检查 | 生产接线通过；新增测试曾因两项未使用导入失败，删除后通过 | `typecheck-first.txt`、`typecheck-tests-first.txt`、`typecheck-legacy.txt` |
| 新契约/IPC 定向 | 23/23 通过 | `unit-target-first.json`、`unit-target-first.txt` |
| 单元完整、类型/格式 | 526/526 单元通过，26 文件；类型/格式通过 | `unit.json`、`unit.txt`、`check.txt` |
| 桌面新增首轮 | 开发 11/12；完整数据场景将开发 app.getVersion 错固定为 0.1.0，实际 42.11.15。数据逐表比较已通过，后续改为同一进程实际值精确比较 | `desktop-target-first.json`、`desktop-target-first.txt` |
| 新增二轮 | 开发 17/17 | `desktop-target-second.json`、`desktop-target-second.txt` |
| 新增三轮 | 开发 21/21，含发布失败、来源变化、并发事务一致性和业务 JSON 损坏 | `desktop-target-third.json`、`desktop-target-third.txt` |
| 源码及新 Windows x64 解包构建 | 已执行并通过；收尾改动后的最终结果另列 | `build-first.txt`、`build-second.txt`、`package.txt` |

## 最终检查

| 检查 | 最终实际结果 | 证据 |
|---|---|---|
| 类型/格式、单元 | 通过；526/526，26 文件，原 503 项按完整名称逐项保留 | `check-final.txt`、`unit-final.json`、`unit-baseline-comparison.json` |
| 第一轮完整桌面 | 开发 122/122、解包 122/122，合计 244/244；发生在最后同名表保护及摘要措辞修改前，不能冒充收尾版本验证 | `desktop-full-first.json`、`desktop-full-first.txt`、`attachments-first.json` |
| 同名表保护定向 | 开发/新解包各 1/1，旧目标及未知原表保持，普通额外表完整随备份保留 | `desktop-collision.json`、`desktop-collision.txt` |
| 收尾构建和新解包 | 源码构建及 Windows x64 解包通过；未生成新 NSIS | `package-final.txt` |
| 最终完整桌面 | 开发 123/123、收尾后重新生成的 Windows 解包 123/123，合计 246/246；原各 101 项逐项保留，新增各 22 项；全部仅一次结果、零失败/跳过/flaky/自动重试 | `desktop-final.json`、`desktop-final.txt`、`results-summary.json` |
| 包内容与范围 | 22 个构建/许可文件逐字节对应，运行元数据字段对应，EXE/ASAR/原生模块哈希已记录；计划书/依赖/锁文件/迁移/草稿控制器等 8 个范围文件保持，旧 NSIS 哈希保持 | `package-inspection.json` |
| 逐文件复查 | 11 个生产/构建文件、6 个测试文件，共 17 个代码文件两轮复查，实质修改重新复查；139 个源码/测试文本严格 UTF-8 可读 | `change-audit.json`、[代码复查记录](../../代码复查记录.md) |

完整报告的 246 个附件已保存到 `artifacts/`：42 个文件型附件及 204 个原报告内嵌附件（已解码，JSON 内容验证通过）。原报告路径/内嵌来源与本地副本的映射/哈希见 [artifacts-index.json](artifacts-index.json)。第一轮完整报告的 42 个文件型附件单独保存在 `attachments-first/`，其余内嵌附件仍在原始报告中。最终包与源码没有再修改；当前 [解包版预览截图](packaged-backup-preview.png) 已由 AI 直接查看图像内容，属于 Electron 窗口截图，不是完整人工验收。

包核对工具先后遇到 Windows ASAR 反斜杠路径与 electron-builder 精简开发 package.json 的两项工具假设错误，修正工具后重新核对，保留 `package-inspection-first.txt`、`package-inspection-second.txt`；没有修改产物或放宽构建/许可逐字节比较。范围检查首轮误将二进制图片按 UTF-8 处理，修正文本范围后通过，见 `change-audit-first.txt`。这些工具失败与应用场景失败分开记录。

## 覆盖内容

真实生产一致性备份及 SQLite 比较：专题、活动/归档题目、历史版本、两张图片资源字节、旧作答、自评、收藏、随机固定队列、未揭晓草稿、创建筛选快照、请求/导入回执和显示设置，共 13 个原业务表（含启动记录与元数据）逐值比较。恢复预览后当前数据与来源字节保持；旧结构 1～5 只迁移暂存副本，未知旧时间明确 null；旧结构迁移冲突保留原文件。

异常覆盖：取消、空库、写入失败、文件发布失败、读取中来源变化、当前库及伴随文件、Windows junction/硬链接别名、旧 WAL、损坏文件、其他应用、过新结构、缺表、外键错误、坏时间元数据、图片哈希、坏筛选对象和正文 JSON。导出进行中拒绝重复任务和切页，正常退出等待备份发布。

桌面回归中的文件框和错误注入为明确替身，SQLite、备份服务和文件发布为实际执行。[使用说明](../../使用说明.md)与[备份架构](../../architecture/M4完整备份与恢复预览.md)描述最终契约。

## 原生输入补查与未验边界

[native-steps.json](native-steps.json) 及 [native-reopened.png](native-reopened.png) 记录原解包程序在独立目录的长题 Tab、真实微软拼音组合中揭晓/下一题、标题栏关闭、SQLite 核对与独立重开继续。候选中 Alt+F4 有一次 15 秒内未关闭的观察；原因未知并保留。工具窗口最小化及一次坐标几何不可用均经过重新观察恢复。该关闭前已经超过 500ms，不计为原生立即退出通过；已有 Electron 立即保存/退出场景在完整回归中另核对。

Windows 多 DPI、外部编辑器双向剪贴板、真实浏览器、大图、全部主题字号组合的原生体验、正式题库、NSIS 安装升级与性能仍待验。历史单次键盘偏移和额外输入字符来源未知，后续通过不覆盖这些事实。恢复执行、保护性备份、失败回退及成功重启尚未实现；本批不是 M4 完整验收。

最终解包程序的真实 Windows 备份保存文件框已出现，并在文件名框填写中文空格路径；随后对话框取消，程序显示取消提示，输出目录为空，练习业务数据前后相同。本次不计为原生备份导出或恢复预览成功。过程中工具报告缓存元素不可用与检测到窗口用户输入，重新观察确认取消后停止该项交互。原始结果见 [native-backup-dialog.json](native-backup-dialog.json) 与 [取消后的窗口](native-backup-cancelled.png)，验收窗口已正常收起。
