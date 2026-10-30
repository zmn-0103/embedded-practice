# 本地分支与冗余副本清理

2026-10-30，用户明确要求删除本地其他分支及项目文件夹多余备份、保留最新数据。范围固定E:/My_Projects/embedded-practice，不清理其他项目、系统TEMP或正式用户数据。

## 分支

main保持fa8937e98fd3e48651407b954718711d56394097。fix/full-bug-audit-20261029的20217fdbd0b3919ce309b30f010025bb93adce8d已被main包含，git branch --merged main和merge-base --is-ancestor均确认；无工作树占用，git branch -d成功，本地只剩main，没有远程推送。原失效detached工作树登记不是本地分支，本轮未改动。

## 实际移除

| 类别 | 目标数 | 文件数 | 文件大小合计 |
|---|---:|---:|---:|
| 被最新包替代的旧程序目录 |35|5001|13670875721字节|
| 较早个人备份/记录 |4|7|3084558字节|
| 较早源码快照 |18|5557|136520555字节|
| 旧V0.0.1暂存副本 |1|780|42508612字节|
| 合计 |58|11345|13852989446字节|

这是文件逻辑大小之和（约13.85GB/12.90GiB），没有测量实际卷剩余空间差。详细绝对路径、原文件清点和保留理由见[最终清单](cleanup-plan-final-02.json)，实际完成路径见[deleted-paths.json](deleted-paths.json)。

## 保留

- 最新现成试用：release/V0.0.2-oral-timer-20261029.4（含题库/主题/使用说明/校验）。
- 桌面当前使用：release/V0.0.2-20261026.4，原桌面lnk目标存在且未更改。
- 仍被现有脚本直接引用：release/win-unpacked（tests/e2e/helpers.ts、m5-desktop-harness），release/findability-20261023-r2（check-uart-metadata），release/m5-20261022及根旧安装器（prepare-m5-installation-kit）。这些保留不代表恢复VMware验收。
- 个人备份最新完整组：backups/个人使用/V0.0.2桌面更新前-20261026-202244；保留原完整导出、快照/伴随文件及记录。旧回退快捷方式和说明是当时记录，已清理的旧包不能通过旧链接回退。
- tmp中该类最新session-filters-before快照、main源码与out、题库/主题/参考图、依赖与配置、Git历史及原始报告。原工作区已有9份截图删除和.workbuddy保持。

## 核对

删除只使用PowerShell原生Remove-Item -LiteralPath。事先解析绝对路径并验证项目/类别边界、文件数/大小、无重解析链接、与保留集合无交集、无运行进程占用，全部目标通过后才删除。最终58项目标均不存在，2037份保留文件大小及SHA-256完全相同，详见[保护清单](protected-files-final-02.json)和[执行结果](cleanup-result.json)。

个人备份5个副本只读immutable校验，quick_check=ok、无外键错误；最新完整导出419题/20练习项，未打开正式用户库，详见[备份核对](backup-checks.json)。没有进行恢复、迁移或改写数据库。

首次只读收集的PowerShell数组组合错误使两个保留路径没有正确组合，未执行删除；cleanup-plan.json和protected-files-before.json仅保留该未采用过程记录，不能用作最终保留验收。第二轮用Join-Path和Stop模式重建，最终02清单路径和交集检查通过后才实施。

最新main包含20217fd后续修复，现成oral-timer包早于修复，未重新打包。保留out是已复查的开发构建；未运行应用/测试/安装，不把文件一致性记为应用验收。未自动提交本轮清理记录或推送。
