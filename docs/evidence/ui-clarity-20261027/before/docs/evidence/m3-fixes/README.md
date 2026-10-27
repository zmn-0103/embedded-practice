# M3 复查修复：收藏乱序与键盘位置检查

日期：2026-10-21。本轮按用户要求只修复和排查，不继续扩展 M3。环境、518 个原文件的改前副本位置见[环境](environment.json)，逐文件 Bug/可维护性复查见[记录](../../代码复查记录.md)。

## 收藏显示一致性

原实现先把收藏返回值写入父级列表，再检查详情 generation。延迟一次真实写入成功响应，切题返回并完成相反操作后释放旧响应，可使数据库和当前详情正确、列表错误；两个方向均成立。用户复查[发现](review-findings.json)和[验证汇总](review-validation-summary.json)保留。

修复前的新回归在开发构建和旧解包 EXE 中分别检出两项错误：最终未收藏被旧收藏覆盖、最终已收藏被旧取消覆盖。另一个“切到其他题后晚到成功仍刷新”的控制场景通过，总计 4 失败、2 通过，见[原始报告](favorite-before-fix-tests.json)、[输出](favorite-before-fix.log)及[列表/详情/数据库摘要](favorite-before-fix-summary.json)。

生产改动仅在 `src/renderer/src/components/LibraryBrowser.tsx`：详情成功回调改为无载荷失效信号，父级按当前筛选重新查询数据库，不再把旧返回值映射到列表。列表读数沿用 Effect 失效保护，旧查询不能覆盖新请求；同一题仍在结果页时保留详情和已展开答案，收藏页取消后才清理不在结果页的选择。详情自身继续按 generation 保护，跨题晚到成功仍能刷新匹配数。

修复后开发构建三项定向全部通过，见[报告](favorite-fixed-development-tests.json)和[输出](favorite-fixed-development.log)。最终完整开发/解包回归还分别运行这三项，核对列表、详情和完整数据库快照一致，并保持已展开答案和当前题目。

回归夹具首轮误把 Electron evaluate 第一参数（模块对象）作为 release 布尔值，导致提前释放响应、6 项在消费屏障超时，属于测试错误，不作为产品复现证据。首轮[报告](favorite-harness-first-tests.json)和[输出](favorite-harness-first.log)独立保留；修正为第二参数接收 release 后，才得到上述实际产品失败。未放宽产品断言。

## 键盘位置偶发失败

原复查解包完整回归为 53/54，100% 页面缩放场景坐标变化约 9.33px，但焦点仍在输入框、首行仍命中输入框；原[失败上下文](review-keyboard-error.md)、[当时输入前截图](review-keyboard-focus.png)和验证汇总保留。该次事件缺少输入后实际缩放、DPR、窗口/屏幕倍率等记录，无法事后确认原因，也不能判为遮挡复发。

本轮先对未改程序的原 100% 用例连续运行 10 次，全部通过，见[报告](keyboard-original-repeat-tests.json)和[输出](keyboard-original-repeat.log)。随后只增强测试诊断：先确认目标 zoom 与窗口可见、字体就绪及两个绘制帧，记录输入前后 Electron 缩放/窗口/屏幕倍率、页面视口/DPR/字体/边框、滚动和 resize 事件（最多 64 条），保存两张完整窗口截图。保留原精确坐标/首行命中、焦点、再次聚焦、保存与实际草稿断言，并单独断言环境未变；没有放宽 9.33px 容差、增加自动重试或修改生产焦点代码。

增强记录后，开发构建三档页面缩放各连续 3 次，9/9 通过，输入前后精确位置一致，见[报告](keyboard-diagnostics-first-tests.json)、[输出](keyboard-diagnostics-first.log)和[测量摘要](keyboard-diagnostics-first-summary.json)。完整回归与解包重复检查另见下表。

新解包 EXE 的三档页面缩放各连续 5 次，15/15 通过；输入前后精确位置、焦点/命中和环境一致，见[报告](keyboard-fixed-packaged-repeat-tests.json)、[输出](keyboard-fixed-packaged-repeat.log)及[全部测量](keyboard-fixed-packaged-repeat-summary.json)。这些重复是显式排查，不是失败自动重试。

收尾目视检查又发现，[初次开发 focus 截图](development-keyboard-focus-before-paint-wait.png)及[初次解包 focus 截图](packaged-keyboard-focus-before-paint-wait.png)仍显示焦点滚动前的位置，与同次 DOM 坐标不一致；这两张图不能作为聚焦后已可见的视觉证据。原测试当时的坐标/命中断言和两种完整回归各 57 项已通过，报告保留为[开发首轮](development-first-tests.json)/[解包首轮](packaged-first-tests.json)。在基准采样及截图前补上两个绘制帧等待后，两种运行形态三档共 6 项通过，见[报告](keyboard-painted-tests.json)和[输出](keyboard-painted.log)；重新目视的聚焦图与 DOM 对应，输入首行确实可见。该修正只影响测试采样，不修改生产焦点行为，也不能倒推原 9.33px 偏移原因。

**历史首次偏移根因仍未确定，保留待定位。** 后续通过不能覆盖首次失败；新诊断用于区分环境变化、布局变化与实际遮挡，不把增加日志称作已经修复历史原因。三档均为 Electron 页面缩放，不是 Windows 系统 DPI 验收。

## 本轮实际检查

| 检查 | 结果与证据 |
|---|---|
| 类型/格式 | [初次通过](check.log)，采样修正后[再次通过](check-final.log) |
| 单元检查 | 21 文件、418/418，[报告](unit-tests.json)、[输出](unit.log) |
| 源码构建 | [通过](build.log) |
| 最终完整开发构建 | 57/57，与解包合并为[114 项原始报告](final-full-tests.json)、[输出](final-full.log) |
| Windows 解包构建 | [重新构建](package.log)，未生成新 NSIS |
| 最终完整解包回归 | 57/57，同一[最终报告](final-full-tests.json)按 projectName 区分；两种运行形态均零失败/跳过/重试 |
| 包文件核对 | 13 个运行文件和 6 个许可文件逐字节一致，旧 M0 NSIS 哈希保持，[结果](package-inspection.json) |

首行截图采用 Electron capturePage，开发构建的[输入前](development-keyboard-focus.png)/[保存后](development-keyboard-saved.png)，以及新解包程序的[输入前](packaged-keyboard-focus.png)/[保存后](packaged-keyboard-saved.png)独立保留。[汇总](results-summary.json)直接读取原始报告。收藏最终未收藏的[开发](development-favorite-final-false.json)/[解包](packaged-favorite-final-false.json)和最终已收藏的[开发](development-favorite-final-true.json)/[解包](packaged-favorite-final-true.json)均核对列表、详情和数据库一致。不能从构建、截图或测试数量推断完整人工验收通过。

绘制采样修正后最终再次完整运行两种形态，114/114 通过；[最终六组键盘测量](keyboard-final-summary.json)与截图对应，首行命中、输入前后精确坐标及环境均保持。

收尾[改动清单](change-audit.json)、[当前哈希](source-manifest.json)及[UTF-8/本地链接](documents-static.json)另行记录；统计不包含回写自身的三个审计文件。

本轮没有增加随机、单题历史、更新待复习展示或主题/字号设置，M3 仍只完成第一批；完整备份恢复及 M4～M5 未完成。所有运行只使用独立临时目录和生成数据，没有连接默认开发/正式学习库，没有提交、推送、发布或重做 NSIS。原计划、题库、依赖/锁文件、数据库结构与迁移保持。
