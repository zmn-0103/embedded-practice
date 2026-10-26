# 2026-10-26 分支提交复查与四项缺陷修复证据

本批对应分支 `review/bugfix-opt-20261026` 上的一次只读复查加修复：先复查 73b7c21、e4ab804、f066f4c 三个提交，再把 Bug 检查扩展到上一轮未覆盖的 `src/renderer`、`src/shared`、`src/preload`，然后修改 4 个源码文件与 2 个测试文件。逐文件两轮复查结论在[代码复查记录](../../代码复查记录.md)，验收结论在[验收记录](../../验收记录.md)。

## 运行环境

- 产品 0.0.2，数据库结构 10；开发形态运行，Playwright `development` 项目，构建产物为 `npm run build` 生成的 `out/`。
- Node v24.18.0，Windows 10.0.26200，Electron 由项目本地依赖提供。
- 测试数据全部来自各 spec 的 `testDataDirectory` 夹具创建的独立临时目录（`EMBEDDED_PRACTICE_TEST_DATA_DIR`），未连接、未覆盖、未迁移正式用户数据库；未打包、未更新桌面入口、未提交、未推送。

## 实际执行与结果

| 文件 | 命令 | 结果 |
| --- | --- | --- |
| [practice-spec-8of8.txt](practice-spec-8of8.txt) | `npm run build` 后 `npx playwright test tests/e2e/practice.spec.ts --project=development` | 8/8 通过（10.9s），含新增的 `ALREADY_REVEALED` 断言 |
| [build-format-unit-targeted32.txt](build-format-unit-targeted32.txt) | `npm run build`、`npx prettier --check`、`npm test`、6 个规格文件的定向回归 | 构建与格式检查通过；单元 35 文件 660/660（13.42s）；定向 e2e 32 项通过（1.2 分钟），0 失败/跳过/flaky |
| [library-plans-errors-8of8.txt](library-plans-errors-8of8.txt) | `npx playwright test tests/e2e/library-window.spec.ts tests/e2e/practice-plans-errors.spec.ts --project=development` | 8/8 通过（15.0s）；因上一行输出经 `tail` 截断，单独重跑以保留逐项明细 |

修改前基线取证同样通过：`npm run typecheck`、`npm run format:check`、`npm test` 35 文件 660/660（13.58s）。

## 覆盖对应关系

- `restore-window.spec.ts`（14 项）→ `src/main/services/backup/restore-files.ts` 的恢复失败日志改动。
- `themes-window.spec.ts`（5 项，含"安装写入失败与提交后响应丢失均保留请求"）→ `ThemeManager.tsx` 的 pending 释放改动，同时保护原可重试路径。
- `practice-plans.spec.ts`、`practice-plans-errors.spec.ts` → `PracticePlans.tsx` 的方案名 ASCII 折叠预检。
- `library-window.spec.ts`、`workbench-browser.spec.ts` → `LibraryBrowser.tsx` 空库分支的错误与重试入口。
- `practice.spec.ts` → `practice-exercise.ts` 新增的"已揭晓后跳过"步骤。

## 边界与未验证项

- 实测确认 `node_modules/better-sqlite3` 按 Electron ABI 构建、Node 下加载失败，因此练习仓储的集成覆盖只能落在 Electron 内的既有 exercise 流程，没有在 vitest 中新建数据库测试。
- 未运行完整 255 项解包回归，未重新打包 EXE，未做真实安装包、系统 DPI/IME、多显示器、长期性能与硬件验收；既有 VMware 跳过项保持。
- `restore-files.ts` 的新日志分支没有在真实 EPERM/ENOSPC 故障下实测，只由 14 项恢复场景确认正常与失败恢复行为未变。
- ThemeManager 的死路（THEME_LIMIT 后按钮全部禁用）是静态代码结论，未做人工界面复现。
- 四项修复的界面视觉未重新采集截图；`test-results/desktop-results.json` 只保留最后一次运行结果，每次运行会覆盖。
