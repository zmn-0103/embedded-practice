# M0 验证证据

日期：2026-10-19。环境和结论见[验收记录](../../验收记录.md)。

| 文件 | 来源与范围 |
|---|---|
| [runtime-tests.json](runtime-tests.json) | 最终构建对开发运行时与 Windows 解包程序执行的 10 个桌面场景，Playwright 原始报告 |
| [installed-tests.json](installed-tests.json) | 最终安装包在含中文、空格路径安装后执行的 5 个桌面场景，Playwright 原始报告 |
| [development-smoke.json](development-smoke.json) | 实际开发服务器与 Electron 窗口的状态读取结果 |
| [uninstall-result.json](uninstall-result.json) | 测试副本卸载及独立测试数据库保留结果 |
| [manifest.json](manifest.json) | 最终源文件、锁文件、计划书与安装包的 SHA-256，用于关联本次证据 |
| [startup-light.png](startup-light.png) | 安装版 Electron 明亮主题截图 |
| [startup-dark.png](startup-dark.png) | 安装版 Electron 深色主题截图 |

这些文件是实际运行生成的证据，不用于应用运行。报告中的临时数据目录由测试管理，测试副本已卸载；路径存在与否不影响报告保存的结果。截图不能单独证明数据持久化，持久化结论来自测试中的关闭、重开与读取断言。

测试不触碰正式用户数据库。此处不包含正式题库、用户答案或个人学习记录。
