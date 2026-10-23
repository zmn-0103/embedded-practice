# M5 第二批证据

日期：2026-10-22。范围是用户指定笔记的 30 题整理与实际试用、计划书 7.3 性能实测，以及当前未签名 NSIS 候选的生成/拆检；完整安装、离线及人工验收未签署。行为与边界见[本批说明](../../M5第二批行为与验收.md)。

| 文件 | 证明范围 |
|---|---|
| [before.json](before.json) | 开工 175 项文件与 M5a 全部一致；原 133 份 M5a 证据哈希；Git 初始未跟踪状态及早期只读定位错误 |
| [sample-generation.json](sample-generation.json)、[samples.json](samples.json) | 新建临时根、6 份原始自测题的大小/哈希/AST、30 题选集与 5,000 题/500 图明确生成样本 |
| [sample-validation.json](sample-validation.json) | 30 题原文位置精确对应；6 份来源文件保持；500 张不同 PNG 的完整解码与哈希。技术答案审阅未执行 |
| [trial-01/result.json](trial-01/result.json) | 30 题/答案生产入库哈希、重复导入、临时单题更新、旧轮/草稿/收藏重开、逐题隐藏/揭晓、表格及验收自评、最终完整性与外键 |
| [performance-01/result.json](performance-01/result.json) | 首轮全部 30 搜索/30 切题/5 启动原始时间、导入反馈与渲染计时、数据规模/环境/图哈希/分页/受控图片请求，错误为空 |
| [performance-summary.json](performance-summary.json) | 从原始计时计算标准中位数及 P95/最大值；保留原 median 取较高中项的修正说明，未重新计时 |
| [首次执行脚本](performance-01/executed-scripts/manifest.json) | 性能首次执行时三个脚本的原文副本和哈希，供复查统计修正前实现 |
| [initial-static-failure.json](initial-static-failure.json)、[原始脚本](initial-sample-script.mjs.txt) | 准备脚本首次语法/格式检查失败，执行前已发现并修正；不是应用缺陷或已通过运行 |
| [工具与截图核对](tooling-notes.json) | 路径定位、文档补丁上下文失败、统计修正及两张截图的实际目视范围；按钮截图处于已知防连击期，不据此认定永久禁用 |
| [脚本检查](script-checks.json) | 四个新增脚本实际格式/语法、奇偶中位数检查及本批未重新运行项目 |
| [installer-input.json](installer-input.json)、[构建日志](installer-build.log) | 独立复制完整已测解包目录，使用副本生成新 NSIS；原 122 个文件/旧 M0 包基线及实际构建输出 |
| [installer-verification.json](installer-verification.json)、[签名状态](installer-signature.json) | 安装包大小/哈希/NotSigned；只读拆检载荷与原 122 文件完全一致，额外 NSIS 辅助文件；未执行安装器 |
| [安装包目录清单](installer-list.log)、[NSIS 载荷提取](installer-extract.log)、[载荷解压](payload-extract.log) | 对已生成候选包的格式及字节拆检，不能替代实际安装或升级 |
| [最终静态核对](artifact-validation.json)、[文件清单](source-manifest.json)、[证据哈希](evidence-manifest.json) | 文档/JSON/截图与当前源文件、历史证据、程序包和笔记哈希的最终核对；不是新的全套测试报告 |

试用与性能均使用当前完整 Windows 解包程序和新建的独立数据子目录；文件选择采用明确返回值替身，生产解析/线程/预览/提交/数据库/页面/关闭重开为真实执行。本批没有把替身场景改写为原生文件框证明，也没有覆盖 M5a 的原始失败和未知观察。

原始计时不删除慢样本，不自动重试；30 题中的前三个自评是明确验收输入，不代表用户学习结果。生成样本仅在临时根，原笔记/交付选集未加测试更新标记。所有脚本逐文件 Bug 与可维护性复查记录在[复查记录](../../代码复查记录.md)，运行结果与静态审查分开成立。

只读工具曾误猜不存在的文件路径和使用了 PowerShell 不展开的 rg 路径通配符；改为文件清单与明确路径后继续。准备脚本首轮语法错误和统计口径修正均单独保存；未据此修改应用或重写首轮运行结果。打包提示默认 Electron 图标、缺少 author，保留现状；不会据此虚构作者或选择许可证。

未完成：真实安装/升级/卸载保留/重装、真实断网全流程、用户题目技术审阅、完整输入法/DPI/键盘/人工体验、真实大图和长代码。历史键盘偏移、额外字符和候选 Alt+F4 原因仍未知，本批不作已修复判断。
