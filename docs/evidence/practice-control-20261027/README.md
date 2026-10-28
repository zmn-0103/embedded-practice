# 功能体验第二批执行证据（2026-10-27）

用户在第一批后指示“继续”；范围为跨专题勾选组卷、固定题单、本轮清单与保存后跳题。行为见[契约](../../固定题单与练习清单行为.md)。产品0.0.2、构建20261027.4-practice-control、结构12、Windows x64。

## 运行目标与数据保护

开发入口为out/main/index.js；解包明确指定E:\My_Projects\embedded-practice\release\V0.0.2-practice-control-20261027.4\win-unpacked\embedded-practice.exe。系统Windows NT 10.0.26200.0、Node24.19.0、npm11.17.0、Electron42.11.15。每个场景独立新临时目录并设置EMBEDDED_PRACTICE_TEST_DATA_DIR，辅助函数核对实际EXE/packaged/userData/页脚与结构12；运行身份附件在各报告。不使用个人Roaming库或替换桌面。

before/及before.json保存第一批未提交维护文件332项，worktree-before.patch保留改前差异；新开发仍在codex/practice-flow-20261027，基线72339b9。本批不提交/合并/推送。schema-v11.sql由第一批r2真实EXE新临时空库提取，来源/哈希见schema-v11-source.json，旧SQL不改写。

## 实际结果

| 层次 | 实际执行与结果 | 原始文件 |
|---|---|---|
| 类型/格式 | 最终check-03通过；差异检查无空白错误，仅原计划书CRLF提示，原字节前缀保留 | check-03.txt、diff-check.txt |
| 单元 | 37文件691/691 | unit-03.json/.txt |
| 源码构建 | build-03通过 | build-03.txt |
| 本地解包构建 | pack-01通过，使用本地Electron发行目录 | pack-01.txt |
| 开发定向 | 最终27/27，覆盖22个新增场景及5个第一批结构/恢复回归 | development-05.json/.txt |
| 解包完整首轮 | 297/310，13项失败，673.859秒，零跳过/flaky/自动重试 | packaged-01.json/.txt及独立现场 |
| 解包定向复核 | 修正旧断言后51/51，86.972秒，零跳过/flaky/自动重试 | packaged-02.json/.txt |
| 未修改缩放测试的追加复核 | 明确repeat-each=2，2/2；不计为新增不同场景 | packaged-03.json/.txt |

310个不同解包场景均有通过证据，**不是单轮310/310**；result-summary.json按文件/语义标题核对覆盖并保留首轮失败。首轮后只更新测试预期，生产124文件/配置8文件及EXE/ASAR保持同一产物；source-final.json保留首轮源码/测试哈希，source-after-test-alignment.json保存最终测试哈希。没有为对齐测试删除原数据/安全/交互断言。

## 失败与修正

- typecheck-01缺新接口替身，补齐后typecheck-02通过；build-02遇新布局测试引用Node类型环境中的DOM全局，限定从页面节点/Reflect读取，build-03通过。
- development-03孤儿坏备份注入误将两题单同位置设为同一身份，先触发夹具唯一约束；限定一题单后重新运行，原报告/坏文件保留。
- development-04恢复未退出：新关闭检查误把恢复自己的忙态作为未确认写入，导致保存检查拒绝。App将同步锁限于练习/题库学习数据操作，备份/设置保留原生命周期；development-05的完整恢复、旧结构10/11及未知题单关闭保护通过。原失败目录另存，未记为已通过。
- packaged-01的12项失败来自旧断言：10项迁移快照缺结构12新增空表/NULL来源，1项键盘顺序缺新题单summary，1项受限桥接白名单缺新严格接口。补齐原精确检查，未改生产程序，packaged-02对应全部通过。
- packaged-01另一项Claude/dark/1440/22/200%缩放检查的库快照出现额外tong文字、草稿修订1→5。来源**未确认**；原ui-adaptive.spec.ts完全未改，packaged-02原样通过，再明确重复两次均通过。没有据此声称定位或修复了原因，首轮差异与截图保持。

## 覆盖与视觉证据

新增检查包括跨专题/筛选/分页/页面保持、有序身份、批量去重、100/500边界、NOCASE与过期编辑、真实成员写失败整单回滚、重导入当前版本/归档/失效保留、开始前竞态不结束原轮、顺序/随机仅指定题目、重开/固定快照、清单50题分页/只读保密、曾跳过与未评区分、保存失败原位保留、跳题回执重试及正常关闭保护、结构11受保护升级与4种失败回滚、题单完整恢复与5类坏定义拒绝。

新布局检查覆盖900/1200窗口、100/125/150%页面缩放、明暗主题；既有整包回归另覆盖高缩放、主题、导入/恢复/收藏/历史/方案和窗口隔离。已查看代表性的题单、正常确认、不可用确认、明暗窄窗清单及跳题后输入画面；实际包10张预览与来源见delivery-previews.json，开发阶段原生画面另在visual-review/。页面缩放不等同Windows系统DPI。

## 交付与未验边界

完整目录见release/V0.0.2-practice-control-20261027.4，安全入口指定%LOCALAPPDATA%\embedded-practice-control-trial-20261027.4；启动脚本仅静态核对，自动化通过显式EXE/临时目录实际运行。原13专题419题/两个主题及说明共17文件逐字节复制校验，包内18份out文件、原生SQLite及产品元数据核对见package-source-verification.json；上一版r2的148文件SHA256保持。

最终逐文件路径/大小/SHA256与未附带学习数据库/诊断日志/缓存/真实个人作答的检查见交付文件校验及delivery-file-verification.json。没有制作/安装NSIS、真实断网人工验收、全部系统DPI/IME、多显示器拖动、长期主观体验/性能或硬件验收，既有VMware跳过保持。个人笔记、按轮复盘/作答对照、Markdown导出、内容差异以及方案置顶/最近排序未实施。
