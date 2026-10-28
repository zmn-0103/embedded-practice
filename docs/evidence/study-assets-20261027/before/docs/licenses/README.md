# 第三方来源与许可

M1 第五批与 M2 第二批通过 npm 固定以下包，复用其标准 Markdown 与高亮功能，没有复制改写供应商源码。根目录 `package-lock.json` 记录完整依赖树；以下文件逐字节复制自本机已安装包的原许可。

| 包 | 来源与用途 | 原许可 |
|---|---|---|
| react-markdown 10.1.0 | [官方仓库](https://github.com/remarkjs/react-markdown)，受控 React Markdown 展示 | [MIT 原文](react-markdown-10.1.0-MIT.txt) |
| mdast-util-to-markdown 2.2.0 | [官方仓库](https://github.com/syntax-tree/mdast-util-to-markdown)，引用定义 AST 序列化 | [MIT 原文](mdast-util-to-markdown-2.2.0-MIT.txt) |
| lowlight 3.3.0 | [官方仓库](https://github.com/wooorm/lowlight)，返回高亮 AST，按受控节点展示 | [MIT 原文](lowlight-3.3.0-MIT.txt) |
| highlight.js 11.11.2 | [官方仓库](https://github.com/highlightjs/highlight.js)，lowlight 使用的语言语法与直接引入的 ARM/Thumb 语法 | [BSD-3-Clause 原文](highlight.js-11.11.2-BSD-3-Clause.txt) |

本说明保留第三方来源和许可，不为本项目整体选择开源许可证。项目 `package.json` 的 `license` 仍为 `UNLICENSED`。
