# V0.0.1版本与个人使用更新证据

日期2026-10-25（Asia/Shanghai），起点提交246b70ed680abc25646c18760a1f9ec4ff7bfc26。用户授权版本V0.0.1、增加额外主题功能、本地提交和替换桌面快捷方式；不推送远程。源代码与主题开发原始报告一并纳入本地提交，旧证据保持。结果详见[发布说明](../../V0.0.1发布说明.md)。

| 内容 | 原始证据与结果 |
|---|---|
| 类型/格式 | [check-01](check-01.txt)通过 |
| 单元 | [unit-01](unit-01.txt)653/653、33文件 |
| 构建/完整程序 | [build-01](build-01.txt)、[package-01](package-01.txt)通过，输出新V0.0.1-20261025.2目录 |
| 定向桌面 | [desktop-01](desktop-01.json)、[日志](desktop-01.txt)，114/114，开发57+解包57，零失败/跳过/flaky/重试 |
| 真实恢复自动重启 | [restore-relaunch-01](restore-relaunch-01.json)、[日志](restore-relaunch-01.txt)，另2/2，两形态各1 |
| 当前/旧包核对 | [program-verification](program-verification.json)，包内0.0.1、24构建许可文件与SQLite模块一致、旧个人交付152文件保持、依赖树仅根版本变化 |
| 个人升级前 | [personal-before](personal-before.json)仅表字段/数量/哈希；[personal-backup](personal-backup.json)旧版真实一致性完整备份schema9 |
| 个人升级 | [personal-upgrade](personal-upgrade.json)，正式路径与EXE/版本核对，迁移9→10、自动保护备份、14旧表原字段全部保持、完整性ok/外键无异常、再导出schema10备份 |
| 快捷方式 | [修改前](shortcut-before.json)、[修改后](shortcut-after.json)，旧文件先备份再删除，新目标/工作目录/空参数一致且从快捷方式实际启动 |
| 计划保护 | [原字节前缀](plan-prefix-verification.json)不变，只在末尾追加本次用户原文授权 |
| 原主题证据 | [保留基线](prior-theme-evidence-manifest.json)，610文件逐字节复核；旧[主题批次](../themes-20261025/README.md)各轮失败保持 |

自动化回归全部独立临时目录，运行时核对实际EXE、构建、结构和userData。个人升级属于用户授权的实际使用设置，不将正式库作为回归测试。报告只保存数据数量/哈希和公开显示设置，个人题库原数据、草稿/回答等原始内容及完整备份均在Git忽略目录，未提交。

本次仅版本/构建提升与精确测试预期同步，主题业务使用前批实现；每文件Bug轮和可维护性轮记录在[复查记录](../../代码复查记录.md)。原主题完整桌面464/468、修正后定向4/4保留，不改称单轮468/468；本版114和2是不同场景的两次运行，不称单轮116/116。

对话框选择目标由自动化指定，实际SQLite一致性备份、保护迁移、恢复替换和真实自动重启均已执行。完整原生文件对话框、全部Windows DPI/IME、安装器安装/升级/卸载、长期体验/性能、用户题目技术审阅及硬件保持未验；VMware及此前已跳过排障保持跳过。没有制作/发布新安装器或推送远程。

## 收尾核对

[备份复核](personal-backups-verification.json)：结构9/10完整备份分别970752/978944字节，完整性均ok、外键无异常；备份内容留在忽略目录。

[文档链接](link-verification.json)：82份当前/新交付/输出文档，1150个本地链接，缺失0；Markdown AST解析，不把行内代码当链接，未宣称全部锚点验收。

[压缩交付](archive-verification.json)：144个文件，143个内容文件长度和SHA-256逐项匹配内含清单；共158188055字节，不含个人数据库或备份。完整程序目录与压缩包都保留。

Git收尾检出：首轮因Windows默认长路径限制停止，保留checkout-01-failure.json（首次错误节选，原工具输出曾截断）；仅对第二次Git调用添加core.longpaths=true后779待提交文件默认换行属性下独立检出逐字节一致，见checkout-02.json。未改系统/仓库配置、证据名称或源文件。
