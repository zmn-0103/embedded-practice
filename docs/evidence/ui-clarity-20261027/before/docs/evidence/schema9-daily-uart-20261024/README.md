# 结构9定向试用与UART修订证据

日期：2026-10-24（Asia/Shanghai）。本批范围为当前解包程序日常链路和UART七题已知条件/步骤/编译依据修订，详见[行为与边界](../../结构9定向试用与UART修订.md)。应用仍为20261024.1-plans、结构9。

| 材料 | 证明范围 |
| --- | --- |
| [工作区改前清单](workspace-before.json)、[Git状态](git-before.txt) | 包含上一批未提交文档改动的5068份当前文件，不以Git HEAD覆盖已有工作 |
| [原文件备份清单](before.json)、before/ | 本批修改前的11份文档/题库完整原字节；包括[原完整题库](before/question-banks/trials/STM32F103-UART第二层-30题试用.md) |
| [程序基线](program-before.json) | 当前整个win-unpacked的124文件，收尾逐字节比较 |
| [实际启动核对](runtime-01/result.json)、[窗口](runtime-01/current-program.png) | 正确EXE/构建、isPackaged、Electron、结构9和新临时数据路径 |
| [6项定向报告](focused-01/report.json)、[运行stderr](focused-01/stderr.txt) | 既有两个方案文件、仅packaged形态，6通过、0失败/跳过/flaky |
| [内容首轮失败](content-01/result.json)、[截图](content-01/failure.png)、[格式化后修正前来源](content-01/source-after-format-before-fix.mjs) | 脚本误用status角色；真实分类已保存，未修改生产。格式化时序另见行为说明 |
| [最终完整链路](content-02/result.json)、[控制台](content-02-console.txt) | 分类/方案/练习/关窗重开、7题更新、重复30不变、旧业务逐行比较与新轮修订版 |
| [方案填入](content-02/plan-filled.png)、[旧轮恢复](content-02/daily-resumed.png)、[修订答案](content-02/revised-answer.png) | 实际Electron截图已查看；不代表原生DPI/输入法/完整主观体验 |
| [内容差异核对](content-verification.json)、[答案修订映射](../../../question-banks/trials/UART答案修订清单.json) | 仅七题答案变更，30题身份/题干/元数据不变，23题答案保持 |
| [本机来源哈希](references/local-sources.json)、[资料访问边界](references/official-access.json)、[PDF下载失败](references/manual-download-01.json) | 原笔记、SPL和来源映射保持；官方章节摘录已核对，完整PDF未取得 |
| [编译样例](references/volatile-rmw-probe.c)、[参数/版本/哈希](references/compiler-probe.json)、[-O0反汇编](references/volatile-O0.disassembly.txt)、[-O2反汇编](references/volatile-O2.disassembly.txt) | 本机GCC13.3.1/Cortex-M3样例的目标编译观察，不运行硬件或学习工程 |
| [单文件静态检查](script-check.txt)、[文档链接](links-verification.json)、[收尾核对](verification.json) | 语法/格式、当前文档链接、历史/程序保护与实际检查汇总 |

收尾第一次独立格式检查发现修订JSON需按项目格式排版，[原日志](script-check-01.txt)保留；规范后所有解析值完全相等，见[等值核对](revision-format-equivalence.json)。实际成功链路使用的[映射原字节](content-02/revision-map-input.json)另存，格式调整不增加运行次数。首次文档链接扫描时收尾报告尚未生成，缺少两份目标文件的[原结果](links-verification-01.json)保留，最终链接另见links-verification.json。

最终链路只有一次成功运行，首轮失败独立保留；6项既有专项与该链路不累计冒充7个不同覆盖场景。完整607单元/404桌面是前开发批次结果，本批未重跑。原始题库来源映射和元数据清单保持，用户审阅状态与实际反馈未代填。正式学习库未访问，安装/硬件/最新完整性能及长期体验未新增通过结论，VMware跳过保持。
