# 通用基础10题小样：原始证据

日期：2026-10-24。范围为8份原资料盘点和五专题各2题的新身份通用小样；不是约30题成品、433题答案审定或程序新功能发布。交付用法和用户待审阅表见[本批说明](../../通用基础样题与试用.md)，可导入文件见[题库入口](../../../question-banks/general/README.md)。

## 实际运行

明确目标：`E:\My_Projects\embedded-practice\release\practice-plans-20261024\win-unpacked\embedded-practice.exe`，构建20261024.1-plans、结构9、Electron42.11.15。实际进程、isPackaged、数据路径及EXE哈希写在报告中。最终数据目录为 `C:\Users\pc\AppData\Local\Temp\embedded-practice-m5b-general-samples-zcMB4a\中文 数据`，仅本次新建库。

执行入口是[本批脚本](../../../scripts/check-general-samples.mjs)。在仓库根目录运行时，必须提供新的、不存在的输出目录和明确EXE：

```powershell
node scripts/check-general-samples.mjs docs/evidence/general-samples-20261024/desktop-new E:\My_Projects\embedded-practice\release\practice-plans-20261024\win-unpacked\embedded-practice.exe
```

本批实际两次分别使用desktop-01和desktop-02，均已等待进程最终退出0；不运行示例中的desktop-new。后续使用者另选新目录，不覆盖已有证据。

| 材料 | 结论 |
| --- | --- |
| [首轮报告](desktop-01/result.json) | completed=true、errors为空；导入/分类/草稿重开/重复导入/十题揭晓链路通过 |
| [首轮首题窗口](desktop-01/answer-1.png) | 截图查看发现粗体标签被渲染为星号，不能把软件通过当作显示完全正确 |
| [修正前五文件与来源映射](content-before-spacing/question-banks/sources/general/样题来源映射.json) | 同目录保留五份题库的原始运行输入字节；仅标签间距随后修正 |
| [最终报告](desktop-02/result.json) | completed=true、errors为空；新增10、重复不变10；十题题答/元数据准确、逐行保护、新增可见strong断言通过 |
| [最终分类窗口](desktop-02/category-ready.png) | 新临时库“嵌入式通用基础”分类内10题 |
| [最终首题](desktop-02/answer-1.png)、[最终第10题](desktop-02/answer-10.png) | 实际揭晓与合成输入，标签正确加粗；不代签用户体验或技术审阅 |

最终库为5专题/10题/10版本/0图片/1轮/10练习项；完整性ok、外键空。正常关闭后和重开重复导入后的固定业务表摘要一致：`4e176ae9e657b5d7bdb1e2a97afe6a362860c114029266f7b0dc034f2fe2b155`。十题都有揭晓前无答案字段、界面无答案区、揭晓后正确答案以及合成自评推进的检查。两轮同一链路不累计成20条独立场景。

仅文件选择框被替换为明确的五文件选择；解析器、导入事务、分类、练习、正常关闭与独立重开均使用实际解包程序。所有草稿和“不熟”均为自动化合成数据，不是用户作答或技术审阅结论。

## 静态结果、来源与范围保护

- [首次扫描误报](static-01.json)：PA引脚扫描未限制词边界，误识别官方资料编号SCPA070。只修正检查规则，保留原记录，没有删去官方依据规避扫描。
- [修正词边界后的结果](static-02.json)、[内容间距修正后的最终结果](static-03.json)：五文件/十题、题干哈希无重复、专有形式扫描无命中、无NUL/替换字符；最后一轮还核对答案存在“核心结论：”strong节点。扫描不是全部隐含平台知识的自动证明。
- [脚本检查](script-checks.json)：新脚本语法和单文件格式的最终实际退出结果。
- [来源及内容对应核对](source-verification.json)：8份原笔记/快照哈希，433题范围/行段/原题哈希，10题身份与来源映射、双向合并对应及仍待用户审阅。
- [范围核对](scope-verification.json)：相对本批开始时完整工作区清单的原文件变化、新文件与允许范围；程序124文件和旧证据逐字节比较；原计划全文前缀与既有复查正文保留。
- [链接核对](links-verification.json)：当前维护文档和本批新增说明的本地链接；排除解析器测试夹具、冻结原文快照、备份、旧证据和临时/生成目录，不为修链接改写历史材料。[首次报告](links-verification-01.json)保留了两个解析器夹具图片引用及尚未生成的本报告链接；前两项在既有语法树测试中只验证引用提取，不是需配图的使用文档，第三项已通过先建立待完成报告再扫描解决，没有修改旧夹具。
- [差异空白核对](diff-check.json)：按既有CRLF边界检查工作区差异，未为消除旧材料格式而重排原文。[第二次链接报告](links-verification-02.json)只缺当时尚未落盘的这份差异报告，已补全后重新检查通过；原报告保留。
- [源码/内容清单](source-manifest.json)、[本证据清单](evidence-manifest.json)：收尾哈希。本证据清单不把自身纳入自身哈希。

改前工作区清单见[before.json](before.json)；待修改的9份原文在before/按原相对路径保存。来源笔记位于仓库外，8份完整快照及哈希位于[来源目录](../../../question-banks/sources/general/README.md)，未修改原笔记。

## 未验证与保持边界

本批没有修改生产源码、旧题库、依赖/锁、迁移或程序，没有重跑607项单元/404项完整桌面，也没有完整性能/长期内存、原生输入/系统缩放、硬件或安装验收。原用户反馈、题目审阅和历史报告保持；VMware及相关排障继续跳过。文件、格式、导入或合成自评通过都不能认定用户已经完成小样审阅或V1完整验收。没有提交、推送或发布。
