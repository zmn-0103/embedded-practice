# 2026-10-27 UI可读性与操作层级第一批证据

用户授权“按照结论继续开发优化”，先处理占位提示、题库筛选区、练习操作层级；[完整原文与行为](../../UI可读性与操作层级优化.md)。产品0.0.2、构建20261027.1-ui-clarity、结构10。源码基线main66bbc6c，开始时已有桌面更新/审查的未提交修改，原状态及二进制差异补丁分别保存在git-status-before.txt和worktree-before.patch；不回退或覆盖这些改动。

## 实际对象与隔离

- 开发入口：E:\My_Projects\embedded-practice\out\main\index.js；宿主Electron42.11.15。
- 新EXE：E:\My_Projects\embedded-practice\release\V0.0.2-ui-clarity-20261027.1\win-unpacked\embedded-practice.exe；解包时显式传入EMBEDDED_PRACTICE_PACKAGED_EXECUTABLE。
- 自动化每场景新建TEMP，通过EMBEDDED_PRACTICE_TEST_DATA_DIR指定，按既有helper核对实际userData、构建、结构与EXE；未连接正式学习库、操作桌面或旧试用数据。
- Windows11 x64，Node24.19.0/npm11.17.0，Electron42.11.15/better-sqlite3 12.11.1。固定本地工具链，不新增依赖或运行时网络能力。
- 新八项使用25题明确标识的工作台夹具，生产导入预览/确认、SQLite和窗口为真实行为，系统文件选择为替身；明暗使用系统媒体模拟，不代表Windows系统DPI。既有完整回归仍含13专题419题的真实导入与原故障注入边界。

## 检查与首轮失败

| 轮次 | 实际结果 |
|---|---|
| check-01 / typecheck-02 | 通过；新增测试完成类型核对 |
| unit-01 | 35文件660/660 |
| build-01 / build-02 | 通过；第二份构建包含学习记录紧凑布局修正 |
| development-01 | 18通过、7失败，共25；原日志/JSON/上下文与对应源码保留 |
| development-02 | 修正后定向9/9，17.7秒；不累计为单轮25/25 |
| check-03 | 最终类型/格式通过 |
| check-04 | 键盘断言同步后最终类型/格式通过 |
| pack-01 | 新Windows x64解包构建通过，未制作/安装NSIS |
| packaged-01 | 完整新EXE首轮262/263，587.164秒；0跳过/0flaky，1项旧键盘次序断言失败 |
| packaged-02 | 同一EXE的键盘场景定向1/1，6.9秒；只更新测试中的实际顺序断言 |
| artifact-verification-03 | 原154份交付文件、24份新包构建/许可、SQLite原生模块、13份题库、源码范围与配置核对通过 |

development-01的五项颜色场景错误预期data-theme会变成light/dark；实际上system为用户设置，CSS响应系统媒体。修正保留system，并精确核对实际背景、占位色与4.5原始比值。另一个新增场景的status定位匹配到已有“本地数据已就绪”，修正为限定设置条件分组。没有修改产品来通过这六项测试。

第七项为真实布局退步：学习记录复用了新增题库分组，前三条记录不再全部可见。生产修正仅对data-records形态保持紧凑，将范围/清空说明收起；原“第三条完整在视口”断言保持，development-02重新通过。原25项中其他16项旧行为与两项新行为已在首轮通过，最终完整解包另按同一新程序验证。

新EXE首轮唯一失败位于board-entry.spec.ts原Tab断言：管理分类后原来直接搜索，现在按本批要求先选择专题/归档，再到搜索。增加专题→归档→搜索逐项聚焦断言，保留原循环上限、后续分类导航/焦点环/对比度，以及四配色明暗/900与1440/22px覆盖；定向1/1通过。产品包与构建文件未变，不重新打包、不将此结果冒充单轮263/263。当前同一EXE的263个不同场景均有通过证据，自动重试为0；原完整首轮与后续定向分别保留。

工具首查误把打包器移除scripts/devDependencies后的package.json与开发文件字节比较；现改为运行字段精确相等，并与上一版同产品/依赖的包内package.json哈希相同。第二次工具检查把一份被Git默认转义而未进入快照的中文合法专题夹具误当新文件；改用NUL分隔清单，该夹具另与HEAD原始字节相等。两份失败日志/原脚本均保留，不改旧before.json、不放宽构建/许可/原生模块校验。

## 颜色、画面与范围

开发测量见[contrast-development-02.json](contrast-development-02.json)，同一新EXE测量见[contrast-packaged-01.json](contrast-packaged-01.json)：两形态各10组真实空白占位均达4.5，原始比值5.04699719377935～8.08907507785969，且与对应主题muted颜色精确一致、opacity=1、placeholder-shown=true。不是全部控件/外部主题或完整无障碍合规结论。

| 主题 | 明色 | 暗色 |
|---|---:|---:|
| 松间绿 | 5.173 | 8.089 |
| 晴空蓝 | 5.129 | 7.716 |
| 暖沙金 | 5.263 | 7.627 |
| 暮山紫 | 5.441 | 7.358 |
| Claude风格 | 5.047 | 7.210 |

表格保留三位小数用于阅读，判定使用JSON原始值。开发画面在development-02下，实际新EXE画面在packaged-01下，[14张交付预览](../../../release/V0.0.2-ui-clarity-20261027.1/界面预览/)与[来源清单](preview-files.json)另存。已目视开发形态1440/900题库，以及新EXE1440题库、暖沙金暗色空白输入、练习揭晓后；普通题库完整分组、学习记录紧凑复用，原字号和主题语义保留。自动化图片中的拼写检查提示来自实际运行控件，不作为产品新能力。

相较本批开始快照，只改变5份渲染生产文件及3份当前构建身份测试，新增ui-clarity.spec.ts；原主进程、预加载、共享契约、草稿控制器、包/锁文件/构建配置保持。初始243份源码/测试/脚本快照中235份保持，一份中文夹具另与HEAD字节核对保持，详见[artifact-verification.json](artifact-verification.json)。before/保存3748份当时可解析路径文件；原完整未提交差异另有补丁，不能将目录数量当作全仓快照完整性证明。

本批未处理第二批高缩放空间、概览行动、规划板块或其他说明统一；没有改Windows窗口DPI行为或恢复此前被拒绝/跳过的原生拖动。全部DPI/IME、多屏鼠标拖动、主观体验、长期性能、安装器/VMware及硬件继续保持未验边界。源码未自动提交、推送或更新桌面。

最终汇总见[result-summary.json](result-summary.json)。新目录除清单自身外159份文件逐项长度/SHA-256重新读取匹配，无数据库/日志/缓存/用户数据，见[交付核对](delivery-file-verification.json)；没有另制ZIP。最终源码/测试/配置哈希见source-final.json，新增文档12处本地链接全部存在，见link-check-01.json。安全入口只静态核对、未自动运行，实际EXE已由上列逐场景临时目录验证。
