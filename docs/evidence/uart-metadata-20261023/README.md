# UART 30题元数据整理证据

日期：2026-10-23。范围见[本批行为与验收](../../UART题库整理行为与验收.md)。应用源码和构建20261023.3保持；本批修改题库元数据、来源/审阅与分类文档，新增独立验收脚本。未改个人学习库。

## 运行与静态检查

- [before.json](before.json)及 `before/`：修改前240个文件的独立副本与完整哈希；[Git状态](git-before.txt)记录开始时状态，已有未跟踪文件保留，没有提交/推送。
- [metadata-static.json](metadata-static.json)：按Markdown语法树修改元数据；其余全文逐字节相同，专题与ID/题答保持，原始来源映射未变。
- [desktop-01/result.json](desktop-01/result.json)与[执行输出](desktop-01.txt)：一条完整实际解包链路，首轮completed=true、errors=[]；新增30→信息变更30/内容更新0→重复不变30→正常重开原轮。
- [标签/难度实际页面](desktop-01/uart-metadata-filters.png)：波特率+进阶正确筛出029/041，当前标题与标签显示正常；[原轮重开](desktop-01/uart-original-queue-resumed.png)：保留第2/30题、旧快照标题/标签/难度和完整草稿，未揭晓答案。两张实际截图均已查看，不代表原生DPI或用户学习验收。
- [项目类型与格式](check-01.txt)、[脚本与清单格式](format-01.txt)：实际通过；脚本还执行了语法检查。上批567单元与344桌面没有在本批重跑。

本次实际命令：

```powershell
node scripts/check-uart-metadata.mjs 'docs/evidence/uart-metadata-20261023/before/question-banks/trials/STM32F103-UART第二层-30题试用.md' 'docs/evidence/uart-metadata-20261023/desktop-01'
```

证据目录必须是新路径；不要重用 `desktop-01` 覆盖历史结果。当前默认EXE为完整 `release/findability-20261023-r2/win-unpacked/` 中的程序，也可第三个参数明确指定同构建EXE。脚本检查可见构建标识和实际临时userData，不能连接个人数据；文件选择框为明确替身。

## 技术资料与工具边界

- [本机来源](references/local-sources.json)：原始UART笔记、原始映射、SPL V3.5.0源文件/头文件和设备头的路径与完整哈希。本批再次核对原始笔记哈希一致。
- [第一次下载记录](references/fetch.json)：完整RM0008下载失败；GCC官方说明与ST官方CMSIS头取得成功。[第二次记录](references/fetch-02.json)保留其他EOF失败，未冒充取得完整手册、LL驱动或CMSIS文档。
- 后续通过官方搜索取得RM0008 Rev21的27.3.4、27.6.1和27.6.5相关摘录，出处及实际覆盖见[来源/技术核对](../../UART30题来源与技术核对.md)。完整PDF未下载成功，也未核对全部勘误。
- `references/stm32f103xe.h`为取得的ST官方原件；其[原始Apache2.0许可](references/ST-cmsis-device-f1-License.md)完整保留。这是只读核对资料，不是应用新依赖，也没有为本项目重新选择许可证。
- [许可定位记录](references/license-fetch.json)、[第二次记录](references/license-fetch-02.json)保留错误大小写文件名的404；[根目录定位与成功获取](references/license-fetch-03.json)确认实际文件名为 `License.md`。工具错误没有靠修改生产代码绕过。

逐题核对包含明确未完成项：23题关键点与所读依据相符，6题需补条件/步骤，1题部分核对；30题用户审阅均待填写。未改参考答案，未做硬件或用户学习代签。VMware安装继续跳过，其原证据和未知边界保持。

收尾文件、未变范围、当前程序和上批封存证据的哈希检查见 `delivery-verification.json`；本目录最终文件清单见 `evidence-manifest.json`。这些哈希只证明所列文件状态，不替代其内容、原生操作或安装验收。
