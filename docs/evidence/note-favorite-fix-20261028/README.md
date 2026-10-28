# 取消收藏期间笔记输入丢失修复（2026-10-28）

按用户复查确认的P1实施修复，范围仅收藏与笔记的保存衔接。原[独立复查](../../../output/review-four-batches-20261028/README.md)、两次丢失观察、完整338/342及原样4/4重跑保持，不改写四项未知原因或整体验收状态。方案置顶/最近排序不在本批。

## 变更与运行对象

首次等待前设置收藏忙碌与笔记只读；沿原协调器保存，失败不发收藏请求并保留输入。生效筛选为只看收藏且取消成功时，只读保持直到详情实际随刷新卸载；其他成功或失败分支恢复编辑。PersonalNote仅增加原生readOnly输入与按钮禁用、明确状态提示，其他调用默认保持原行为；无全局新协调器、卸载盲写、数据库/依赖/构建配置变化。

功能生产修改为LibraryBrowser/PersonalNote两文件，另改App构建标签；五份现有测试当前运行身份同步，新note-favorite.spec.ts包含5场景。逐文件Bug/维护性检查见代码复查记录。before/封存12份相关改前文件，before.json先核对上版301来源和156交付，worktree-before.patch保留既有改动。

开发入口E:/My_Projects/embedded-practice/out/main/index.js；本EXE为E:/My_Projects/embedded-practice/release/V0.0.2-note-favorite-fix-20261028.2/win-unpacked/embedded-practice.exe。产品0.0.2、构建20261028.2-note-favorite-fix、结构13；每场景新TEMP并检查实际EXE/userData/packaged/页脚/结构，解包显式设置EMBEDDED_PRACTICE_PACKAGED_EXECUTABLE。未访问个人库。

## 实际检查

- check-02类型/格式、build-01、pack-01本地解包通过，未新增依赖或在线能力。
- unit-01：42文件724/724，沿原全部单元；无新增镜像实现的单元测试。
- development-03：5/5。两入口的真实收藏及收藏范围列表响应分段延迟，原输入先持久化，等待期间原生键盘输入被只读阻止；列表刷新期间DOM保留且readOnly，放行后真实卸载，已接受文本持久化保持。
- 两入口真实SQLite笔记写失败：编辑器/输入保持，零收藏调用，原修订重试后可继续取消。普通题库真实收藏写失败及成功后均恢复编辑。
- packaged-targeted-01：同EXE六文件定向27/27、56.790秒，零失败/跳过/flaky/自动重试；包含新增5项及原笔记/收藏/关闭重开/主题/练习保存/三布局。系统文件对话框使用原明确替身；延迟只暂停真实响应，读写仍实际实现。

本轮没有重跑完整桌面套件。原复查四项失败对应场景在本次相关定向中通过，但不能据此解释旧取消/输入异常、记为已修复或声称全套342/347通过。

## 开发首次探针失败

development-01/02均3/5。最初仅暂停第一个列表请求，其他请求可以先完成；01在角色定位未发现编辑器时先解释为hidden，改用DOM后02仍失败，说明该解释不充分。03仅对收藏范围的全部真实列表请求设屏障并统一释放，保留DOM存在/readonly/最终卸载、键盘与持久化的精确断言后5/5。没有为这些失败修改生产、旧测试或超时，01/02与截图保留。

## 交付核对与边界

verify-delivery.cjs及verification.json核对18份包内out逐字节一致、产品/SQLite匹配、8配置不变、原156交付文件保持；source-at-pack.json冻结302来源。新交付150文件390982902字节清单排自身、无数据库/运行目录，原17题库/主题素材随附；四张同EXE capturePage窗口反映两入口只读提示与失败保留输入，代表画面已目视检查。

安全cmd采用独立LOCALAPPDATA目录，仅静态核对；桌面运行使用显式EXE/新TEMP。原个人程序、桌面、正式数据和旧交付保持，未提交/合并/推送。未执行安装器、系统DPI/IME、多屏、硬件、长期/性能或完整人工验收，VMware原跳过保持。

[修复版开始使用](../../../release/V0.0.2-note-favorite-fix-20261028.2/开始使用.md) · [验收记录](../../验收记录.md) · [原两次丢失证据](../../../output/review-four-batches-20261028/note-loss-observations.json)。
