# fix/full-bug-audit-20261029 合并前复查

日期：2026-10-30（Asia/Singapore）。按用户“复查通过后合并到main”要求，复查源码提交 `20217fdbd0b3919ce309b30f010025bb93adce8d` 相对 `2bcc05abb2901014b53ef690af053a948eab1316` 的全部15个代码文件及3个记录文件，沿调用链核对数据保护与交互保存约束。没有修改应用源码、既有测试、依赖或数据库结构；未发现本次变更的合并阻断项。

## 实际验证

| 检查 | 结果与证据 |
| --- | --- |
| 类型及格式 | `npm run check` 通过，见 check-01.log |
| 单元 | 48文件778/778通过，见 unit-01.json / unit-01.log |
| 开发构建 | `npm run build` 通过，见 build-01.log |
| 开发桌面定向回归 | 16文件94/94，154.85秒，零失败/跳过/flaky，每项一次passed且retry=0，见 desktop-01.json / desktop-summary.json / desktop-01.log |
| 关键数据补证 | 8/8，见 check-data-paths.cjs / data-paths-02.log |
| 合并后来源一致性 | 358份源码、测试及配置的SHA-256全部保持，见 verified-source.json / merge-check.json |

环境为Windows、Node 24.19.0、npm 11.17.0、Electron 42.11.15。开发入口为 `E:/My_Projects/embedded-practice/out/main/index.js`，宿主为 `E:/My_Projects/embedded-practice/node_modules/electron/dist/electron.exe`；界面构建标识沿用20261029.4-oral-timer，产品0.0.2、结构17。该构建标识没有单独表示本次修复，因此以提交、重新构建及来源哈希共同识别对象，不能把旧同标识交付包当成本轮程序。

桌面每场景由既有测试夹具新建 `TEMP/embedded-practice-*`，通过 `EMBEDDED_PRACTICE_TEST_DATA_DIR` 传入；既有目标检查核对实际userData、开发形态、页脚和结构。94项包括备份导出/预览/恢复保护、旧备份迁移、草稿事务与未知结果、题库、笔记保存/收藏等待、标签、知识关联、目标/配额/日历、固定/随机/更新队列和工作台错误恢复。命令的文件匹配同时命中了category-practice、random-practice、updated-practice和workbench-practice，报告按实际94项统计，不按预估数量统计。

截图与附件在 `output/playwright/full-bug-review-20261030-01/`。实际目视检查了个人标签900宽/150%暗色，以及题库笔记保存失败画面；只证明这些具体状态，未重新验收全套主题、DPI或视觉规范。文件选择、指定IPC响应及SQL故障使用既有测试替身，生产窗口/服务/SQLite实际运行。

## 数据补证范围

补充脚本使用Electron Node模式运行本轮构建的生产服务，在新建系统TEMP根下创建独立data子目录，结束关闭连接并只清理经边界断言确认的本次临时根。8项分别为：

1. 结构17运行库保留结构16备份元数据时，可以导出并预览；新文件元数据为17，原库元数据16保持。
2. 作为导入来源的版本不一致备份仍被拒绝。
3. 缺少library_meta单例行的备份被拒绝。
4. 未知backup_manifest列阻止导出，原库未知列保持。
5. 事务入口故障后读回较新草稿，返回DRAFT_STALE，随后可正常保存。
6. 同修订不同文字返回DRAFT_CONFLICT，随后可正常保存。
7. 同修订同内容读回成功，返回原修订回执。
8. 读回旧修订保留原写入异常，原请求可重试。

草稿的事务入口异常是明确注入，读回及后续写入使用真实SQLite，不冒称真实磁盘故障。过期元数据由独立当前结构库人工构造，不冒称重演全部历史恢复过程；旧结构迁移另由backup-legacy回归覆盖。首轮直接从PowerShell调用图形宿主未捕获输出，data-paths-01.log为空，不能作为通过证据；第二轮通过Node子进程等待并捕获退出码0和8项结果。

## 审查边界

逐文件Bug检查与维护性结论见[代码复查记录](../../代码复查记录.md)。原记录保留的“数据库不可用时无法进入恢复”和“笔记未确认时主导航禁用”仍为已有产品/交互边界，没有在本轮修改或宣称解决。

恢复成功后的10秒界面解锁没有恢复已关闭的数据服务，不能视为“重启失败后可继续工作”的完整降级方案；正常生产路径仍在100ms后安排退出重启，本轮没有模拟进程未退出且延时解锁的异常。新增textarea的maxLength按UTF-16长度限制，最终1MiB UTF-8保护仍由共享契约执行，不宣称中文输入在前端已严格按字节截断。提前关窗及启动计数失败仅静态追踪，本轮没有专门注入这两个启动故障。

没有执行打包EXE、安装/升级、系统DPI/IME、多屏、锁屏/休眠、长期性能或完整人工验收，VMware跳过保持。没有访问正式库、替换桌面、重建旧交付包、推送远程或删除来源分支。

## 合并事实

在本工作目录切到main后执行 `git merge --ff-only fix/full-bug-audit-20261029`，main从2bcc05a快进到20217fd，无冲突；随后验证修复分支是main祖先，并核对358份文件字节一致。最终另在main提交本复查记录与新证据，不改生产实现。

起始工作区有9份历史截图的删除以及未跟踪的 `.workbuddy/`，全部保持且不纳入提交；前后清单见worktree-before.txt / worktree-after-merge.txt。旧prunable工作树保持。来源分支继续保留在20217fd。
