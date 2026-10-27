# 2026-10-27 UI运行、交互、对比度与DPI验证

本轮由用户追加授权执行验证，不实施此前设计建议。当前工作区既有未提交修改保留；应用源码、测试、脚本和交付程序未修改。只新增证据和验收记录，不构建、不打包、不提交、不操作正式学习库或系统缩放设置。

## 目标与数据隔离

- EXE：`E:\My_Projects\embedded-practice\release\V0.0.2-20261026.4\win-unpacked\embedded-practice.exe`。
- 实际产品0.0.2，页脚构建20261026.4-v002，结构10，packaged=true；见[runtime.json](runtime.json)与[summary.json](summary.json)。
- 42项既有场景逐场景新建TEMP目录；补充测量另用`C:\Users\pc\AppData\Local\Temp\embedded-practice-ui-audit-VejokK`，已核对实际userData。该目录保留，应用已正常关闭。
- 补充测量通过生产导入预览/确认流程导入25道明确标识的界面样本，文件选择为替身；SQLite、渲染、保存、揭晓为实际应用行为。样本不代表正式题库技术答案。
- [source-after-check.json](source-after-check.json)：本轮开始保存的244份src/tests/scripts文件哈希全部保持；Git原状态见git-status-before.txt。

## 运行与交互

[packaged-01.json](packaged-01.json)：42/42，114.461秒，0失败、0跳过、0flaky；未配置自动重试。该结果只代表本轮9份定向文件，不是完整255项回归或安装验收。

范围：workbench-ui2、workbench-ui3、workbench-overview、workbench-practice、workbench-errors、settings-palettes、themes-layout、themes-reading、settings-window。覆盖：总览空库/活动轮/读取失败；题库滚动、分页、范围、窄窗返回；草稿保存失败与重试、答案/历史隐藏、收藏；设置预览与应用、正常关闭重开；五内置与两个外部主题、明暗/跟随系统、字号15/17/22px、长代码/答案/图片及原主题布局场景中的离线请求检查。故障注入和文件选择替身边界沿各测试实现。

复现命令（再次执行应更换报告/输出名称，禁止覆盖本轮）：

```powershell
$env:EMBEDDED_PRACTICE_PACKAGED_EXECUTABLE = 'E:\My_Projects\embedded-practice\release\V0.0.2-20261026.4\win-unpacked\embedded-practice.exe'
$env:PLAYWRIGHT_JSON_OUTPUT_FILE = 'docs/evidence/ui-runtime-audit-20261027/packaged-new.json'
node node_modules/@playwright/test/cli.js test tests/e2e/workbench-ui2.spec.ts tests/e2e/workbench-ui3.spec.ts tests/e2e/workbench-overview.spec.ts tests/e2e/workbench-practice.spec.ts tests/e2e/workbench-errors.spec.ts tests/e2e/settings-palettes.spec.ts tests/e2e/themes-layout.spec.ts tests/e2e/themes-reading.spec.ts tests/e2e/settings-window.spec.ts --project=packaged --output=docs/evidence/ui-runtime-audit-20261027/packaged-new --reporter=list,json
```

## 对比度：发现1类问题，尚未修复

五套内置主题×明暗，测量实际getComputedStyle前景和背景；透明背景沿祖先合成，使用sRGB相对亮度公式，原始比值不舍入判定。每组6项设置/预览样本与8项真实练习样本，共140项。另做1次空白输入可见性确认，不重复累计。

参考[W3C普通文字对比度说明](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)的4.5:1门槛；本轮不是完整WCAG合规审核，未覆盖所有控件边界、悬停、焦点、错误状态或外部主题的对比度。

8项低于4.5均为“我的答案”的占位提示。普通正文、辅助文字、主按钮、代码类型/数字/注释、作答文字、保存成功、难度标签及局部预览错误文字等其余132项达到4.5，最低约4.511。

| 主题 | 明色占位提示 | 暗色占位提示 |
| --- | ---: | ---: |
| 松间绿 | 4.516 | 3.453 |
| 晴空蓝 | 4.480 | 3.263 |
| 暖沙金 | 4.423 | 3.198 |
| 暮山紫 | 4.439 | 3.273 |
| Claude风格 | 4.511 | 3.353 |

暖沙金暗色17px空白输入确认：`:placeholder-shown=true`、value为空、提示颜色rgb(117,117,117)、opacity=1、背景rgb(46,39,30)，比值3.198156654363375。其他组合最初测量时输入含草稿，读取的是其占位伪元素样式；最差组合另切到新题的空白输入，确认实际显示。当前样式文件未显式定义`::placeholder`颜色。建议后续授权修复时用主题次要文字语义颜色控制占位提示并重测，但本轮未改代码。

原始数据：[contrast-expanded.json](contrast-expanded.json)、[空白输入确认](placeholder-confirmation.json)、[可见截图](placeholder-sand-dark.png)。

## 实际Windows DPI与程序缩放

机器实际有100%及150%两个显示器；没有修改系统缩放设置。窗口webContents zoom=1时，Electron屏幕scaleFactor及renderer devicePixelRatio为1→1.5→1，Win32 GetDpiForWindow独立读取为96→144→96。原始数据见runtime.json、dpi-and-zoom.json、win32-dpi-100.json、win32-dpi-150.json、win32-dpi-return.json。

在适配屏幕内的窗口中，22px中文/表格/作答、200px输入区、底栏保持；没有整页横向溢出，原草稿及揭晓状态保持。150%下使用computer-use的截图坐标原生点击“查看参考答案”，实际参考答案挂载；见[native-input-result.json](native-input-result.json)。查看了100%与150%的原生窗口画面，截图证据也分别保存为native-100-before、native-150-fitted、native-150-answer-bottom、native-100-return。

**跨屏尺寸仍有未确认项：**第一次使用Electron setBounds从100%跨到150%时，请求1160×900却读到1740×1350，窗口部分超出屏幕，原始native-150-unrevealed.png保持。随后在目标屏明确设为1050×850后可用。尚不能归因于应用或API跨DPI时序；原生标题栏拖动尝试被工具拒绝（目的点在原窗口外），没有完成用户鼠标拖动场景。不能将本轮写成“完整多显示器DPI验收通过”。

在100%显示器另检查程序zoom=1.25/1.5/2，1050×850窗口、22px正文的DOM几何记录：无整页横向溢出，操作栏在视口内，原草稿保持。200%时有效CSS视口约517×405，操作栏换行并明显压缩输入可见空间。另以17px空白题的原生画面确认可见首行和操作栏，保存[实际渲染截图](page-zoom-200-surface.png)。这属于程序缩放，不是Windows 125%或200%DPI验证。

## 工具异常及边界

[limitations-and-first-failures.json](limitations-and-first-failures.json)保留本轮工具/采集异常：ES模块导入失败后使用现有本地依赖的createRequire；Windows设置未暴露窗口；原生可访问树曾滞后于真实画面，因此只按新截图进行原生点击；首次200% Playwright截图为空白，保留原图并以原生窗口和Electron capturePage复核。没有把这些记录改成首次全部成功。

测量在交互式JavaScript中执行，没有新增应用代码或测试文件。公式和样本选择已进行边界检查（透明背景、未舍入阈值、占位是否可见）及可维护性检查（沿用生产组件/主题、输出原始颜色和选择器）；这些静态检查不代替运行结果。未执行完整屏幕阅读器审核、全部焦点/非文字对比度、全部主题×DPI组合、Windows125%/200%真实缩放、IME组合、系统设置切换、安装器、硬件、长期体验或VMware；原跳过边界保持。
