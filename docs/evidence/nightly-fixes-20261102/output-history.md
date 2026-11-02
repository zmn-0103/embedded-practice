# 生成输出的保留与取回

本轮停止跟踪 `output/playwright/`、`output/review-four-batches-20261028/`、`output/recovery-guards-20261031/`，共2762个生成文件。操作使用 `git rm --cached`，只改变索引，本地原文件未删除；逐文件SHA-256复核保持，14个 `output/imagegen/` 设计素材继续跟踪。

原始内容完整保留在来源提交 `95959d3680e92a4ffb94ede12402daacb5c22ae8`。本次没有改写历史或清洗旧报告；历史文档中的旧输出路径仍是当时路径，在本机继续可读，新的干净检出可从来源提交取回。

- [逐文件清单](output-tracking-manifest.json)：路径、来源Git blob、Git字节数、本机字节数/SHA-256及本机绝对路径长度。
- [核对结果](output-verification.json)：2762份本地文件摘要一致，937个去重来源blob均存在。
- 按当前工作区根路径计算，输出目录原有3条超过260个UTF-16单位的路径已不再进入当前索引；其他封存证据仍有9条超长路径，已列在核对结果，未擅自移动。不能据此宣称全仓已消除Windows长路径限制。

以下为需要时取回原始输出的示例命令，**本轮没有执行完整导出**：

```powershell
git archive --format=zip --output=output-history-95959d3.zip 95959d3680e92a4ffb94ede12402daacb5c22ae8 -- output/playwright output/review-four-batches-20261028 output/recovery-guards-20261031
```

建议解压到短目录；可只导出命令末尾的一个目录。浅克隆若尚无来源提交，须先取得该提交。

后续Playwright原始输出写入被忽略的 `output/`，不再整批加入Git。需要交付的原始报告、摘要和必要截图用短文件名另存 `docs/evidence/<批次>/`；不改写原始失败，不把重复运行累加为更多场景。`output/imagegen/` 是已有设计来源的明确例外。
