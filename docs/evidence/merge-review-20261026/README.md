# 2026-10-26 独立合并复查证据

结论：原三提交及追加授权的未提交修改均通过本轮范围内复查。基线 main=29342b8，原分支头=f066f4c。没有新改生产代码。

## 结果与文件

| 范围 | 日志 / 结构化报告 | 结果 |
| --- | --- | --- |
| 原提交静态 / 单元 / 构建 | check.log、unit.log、build.log | 通过，单元35文件660/660 |
| 原提交开发桌面 | desktop.log、desktop.json | practice与restore-window共22/22 |
| 原提交补充首轮 | probe-01.log、probe-01.json | 1通过1失败；恢复探针导出路径误置应用数据目录，被FILE_ERROR保护拒绝 |
| 修正夹具后定向 | probe-02.log、probe-02.json | 恢复目录创建故障诊断1/1；只改导出目录，不改产品 |
| 加入未提交修改后的静态 / 单元 / 构建 | expanded-check.log、expanded-unit.log、expanded-build.log | 通过，单元35文件660/660 |
| 最终候选开发桌面 | expanded-desktop.log、expanded-desktop.json | 7规格文件40/40，0失败/跳过/flaky/重试 |
| 新增行为定向 | expanded-probe-01.log、expanded-probe-01.json | 4/4，主题拒绝后的操作恢复、ASCII名称边界、空库错误重试、恢复双阶段诊断与原库恢复 |
| 工作区快照核对 | original-workspace-before.json | 原工作区12文件SHA-256在复查结束时全部一致 |
| 空白检查 | raw-whitespace.log、source-whitespace.log、crlf-aware-whitespace.log、expanded-whitespace.log | 原提交文档CRLF被默认检查提示；源码与单命令cr-at-eol检查通过 |

各轮通过数不相加冒充一轮全量回归。desktop-artifacts、probe-01、probe-02、expanded-desktop、expanded-probe-01保存相应附件/失败现场。补充IPC探针记录实际appPath、EXE和userData；最终候选themes-window沿用verifyThemeTarget核对开发宿主版本、构建、结构与独立数据目录。

## 环境与复现

本次在 E:\My_Projects\ep-review-20261026 独立工作区执行，Node24.19.0、npm11.17.0、Electron42.11.15。明确开发入口为该工作区out/main/index.js，构建20261026.3-v002、产品0.0.2、结构10。依赖通过目录联接复用原仓库已安装依赖，未安装/升级依赖或变更锁文件；构建产物写入独立工作区。

补充脚本以probe.spec.ts、expanded-probe.spec.ts与playwright.config.ts保留。脚本执行时位于仓库tmp/merge-review-20261026，归档后的相对导入仍指向原执行布局；复现时复制这3个文件到新的检出中相同tmp位置，构建后通过本地Playwright CLI指定该配置，并使用新的报告/输出目录。不能直接从归档位置执行或覆盖本批报告。首轮probe.spec.ts与归档最终版仅导出路径不同：原为join(testDataDirectory, 'probe-backup.sqlite3')，修正为独立mkdtemp目录。

最终候选定向规格：practice、themes-window、practice-plans、practice-plans-errors、library-window、restore-window、workbench-browser。临时探针配置不在默认测试发现范围内。

## 边界

系统文件框、THEME_LIMIT响应、恢复mkdir/rename错误采用替身；SQLite、渲染、IPC、生产恢复函数及日志真实执行。未实际改变系统ACL或耗尽磁盘，未打包/安装、更新桌面或访问个人数据库，未验全部DPI/IME/硬件和长期体验；VMware仍跳过。默认创建工作区工具曾因Windows长路径失败，之后仅对git worktree add启用core.longpaths完成，不改全局配置。

原bugfix-review-20261026目录为前一轮作者证据，保持原样；本目录独立结果不改写其Node版本、旧覆盖范围或历史未验项。
