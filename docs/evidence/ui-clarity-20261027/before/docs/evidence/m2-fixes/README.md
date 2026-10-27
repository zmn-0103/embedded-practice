# M2 复查交互缺陷修复证据

日期：2026-10-20（Asia/Shanghai）。Windows 11 x64（10.0.26200），Node.js 24.19.0、npm 11.17.0，Electron 42.11.15 / better-sqlite3 12.11.1；应用 0.1.0、数据库结构 3。范围是修复快速重复操作跨题、自动保存关闭图片预览和过时文案，未推进 M3。

| 文件 | 实际结果与范围 |
|---|---|
| [改前环境与副本](before.json) | 340 个改前源码/测试/文档/题库/配置的恢复副本位置，及原 M0 NSIS 哈希 |
| [修复前构建](baseline-build-output.txt) | 尚未修改应用源码时构建成功；本次新增桌面用例已经纳入类型检查 |
| [修复前报告](before-fix-tests.json)、[输出](before-fix-output.txt) | 7 项中 5 失败、2 通过；检出三种间隔双击跳过、按住 Enter 和图片自动关闭，失败报告保留 |
| [类型与格式](check-output.txt) | 最终代码 `npm run check` 通过 |
| [单元报告](unit-tests.json)、[输出](unit-output.txt) | 20 文件、405 项通过，无失败/跳过 |
| [构建输出](build-output.txt) | 修复后的主进程、预加载及渲染页面构建成功 |
| [定向回归](fixed-regressions-tests.json)、[输出](fixed-regressions-output.txt) | 修复后开发构建新增 7 项全部通过 |
| [完整开发报告](development-tests.json)、[输出](development-output.txt) | 41/41，通过原 34 项及新增 7 项，无失败/跳过/重试 |
| [解包构建](package-output.txt) | Windows x64 解包程序与原生模块重新构建成功，未生成新 NSIS |
| [完整解包报告](packaged-tests.json)、[输出](packaged-output.txt) | 新解包 EXE 41/41，无失败/跳过/重试，子进程 PATH 仅 System32 |
| [运行结果汇总](results-summary.json) | 修复前后数量和提取的 22 个持久化附件/截图文件名 |
| [产物核对](package-inspection.json) | 13 个 JS/HTML/CSS 和 6 个许可文件与当前文件逐字节一致；旧 M0 NSIS 哈希保持 |
| [首次静态结果](static-initial-checks.json)、[最终静态结果](static-checks.json) | 首次链接检查发生在结果文件生成前，将本页对该文件的链接报为缺失；文件生成后重新核对，源码范围、复查覆盖、UTF-8 和本地链接均通过 |

## 快速重复操作

双击跳过与上一题分别以 50/100/250ms 间隔运行；跳过从第 1 题只进入第 2 题，数据库位置为 1、仅一处跳过标记、修订和回执只增加一次。等待按钮恢复后可以明确前进，再从第 3 题双击上一题，只返回第 2 题，作答行保持。

| 场景 | 开发构建 | Windows 解包程序 |
|---|---|---|
| 50ms 双击跳过 | [持久化结果](development-repeat-skip-50ms.json) | [持久化结果](packaged-repeat-skip-50ms.json) |
| 100ms 双击跳过 | [持久化结果](development-repeat-skip-100ms.json) | [持久化结果](packaged-repeat-skip-100ms.json) |
| 250ms 双击跳过 | [持久化结果](development-repeat-skip-250ms.json) | [持久化结果](packaged-repeat-skip-250ms.json) |
| 50ms 双击上一题 | [持久化结果](development-repeat-previous-50ms.json) | [持久化结果](packaged-repeat-previous-50ms.json) |
| 100ms 双击上一题 | [持久化结果](development-repeat-previous-100ms.json) | [持久化结果](packaged-repeat-previous-100ms.json) |
| 250ms 双击上一题 | [持久化结果](development-repeat-previous-250ms.json) | [持久化结果](packaged-repeat-previous-250ms.json) |
| 100ms 两次 Enter | [结果](development-repeat-keyboard-Enter.json) | [结果](packaged-repeat-keyboard-Enter.json) |
| 100ms 两次 Space | [结果](development-repeat-keyboard-Space.json) | [结果](packaged-repeat-keyboard-Space.json) |
| 持续按住 Enter | [结果](development-repeat-held-key.json) | [结果](packaged-repeat-held-key.json) |

原揭晓和自评双击也增加到 100ms 间隔，并通过完整回归。按钮保护至少为激活后 500ms，请求未完成时由原忙碌锁继续保护；鼠标多击和长按重复键不能生成下一题的新操作，保护结束后仍可明确逐步操作。短暂保护不改变输入草稿的 500ms 保存或正常退出协调。

## 图片自动保存

在真实输入后、自动保存发生前打开 PNG 预览并放大到 150%。等待页面显示已保存并只读确认 SQLite 草稿后，预览依然打开、150% 和图片宽度保持；Escape 关闭恢复焦点，再次打开回到 100%，关闭按钮可用。

- 开发：[保存结果](development-image-autosave.json)、[保存后预览截图](development-image-after-autosave.png)。
- 解包：[保存结果](packaged-image-autosave.json)、[保存后预览截图](packaged-image-after-autosave.png)。

截图仅显示测试用的自建小图；不证明所有图片内容均经过像素校验。

## 复现与边界

运行 `npm run check`、`npm test`、`npm run build`；以 `npm exec -- playwright test --project=development` 运行开发构建，以 `npm run pack:dir` 重新生成解包程序，再以 `npm exec -- playwright test --project=packaged` 运行解包回归。两个项目都包含新增场景；定向筛选为 `--grep '快速重复|图片自动保存'`。完整日志记录了本次实际命令与结果。

每个代码文件先 Bug 检查再优化复查，见[代码复查记录](../../代码复查记录.md)。原计划书、题库、依赖、数据库实现、控制器、IPC、预加载和 CSP 保持；收尾静态结果见 [static-checks.json](static-checks.json)。改前副本保留于忽略的 `tmp/m2-fixes-before-6f0183ba4a4944378a701fb4231d12f2/`，原复查报告 `tmp/review-20261020-findings.json` 保持。

测试走真实 React/预加载/IPC/服务/SQLite，系统文件框、浏览器、剪贴板和退出提示仍使用原明确替身。所有测试使用独立临时数据目录，未连接正式或默认开发数据。没有以强制清理代替正常关闭验收，没有执行提交、推送或发布。

本次两项软件缺陷已修复并通过回归；M2 完整验收仍待人工体验、输入法/缩放、正式题库审阅等，性能目标未实测。未进行新 NSIS 安装升级或长期人工体验，M3～M5 未推进。旧 NSIS 仍为不支持结构 3 的 M0，只能将本次解包验证归于完整 `release/win-unpacked/`。
