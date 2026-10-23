"""生成独立 M5 阅读验收样本；不读取或修改应用数据库、正式题库。"""

import argparse
import hashlib
import json
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, __version__ as pillow_version


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def make_image(path, size, image_format):
    image = Image.new("RGB", size, "#f4f7fb")
    draw = ImageDraw.Draw(image)
    font = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", 30)
    heading = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", 48)
    width, height = size
    draw.rectangle((0, 0, width, 170), fill="#18324d")
    draw.text((48, 32), f"M5 READING SAMPLE / {image_format}", font=heading, fill="white")
    draw.text((48, 100), f"{width} x {height} pixels - generated acceptance fixture", font=font, fill="white")
    for row, top in enumerate(range(200, height - 60, 140)):
        for column, left in enumerate(range(32, width - 60, 340)):
            color = (44 + row * 13 % 150, 90 + column * 17 % 140, 140 + (row + column) * 7 % 100)
            draw.rectangle((left, top, min(left + 310, width - 20), min(top + 110, height - 45)), fill=color)
            draw.text((left + 12, top + 12), f"R{row + 1:02} C{column + 1:02}", font=font, fill="white")
            draw.text((left + 12, top + 60), f"x={left} y={top}", font=font, fill="white")
    draw.text((32, height - 42), "BOTTOM EDGE - check panning and complete image", font=font, fill="#18324d")
    image.save(path, format=image_format, **({"quality": 92} if image_format != "PNG" else {}))
    with Image.open(path) as decoded:
        decoded.load()
        assert decoded.size == size and decoded.format == image_format
        pixel_hash = hashlib.sha256(decoded.tobytes()).hexdigest()
    return {"path": str(path), "format": image_format, "width": width, "height": height,
            "bytes": path.stat().st_size, "sha256": digest(path), "decodedPixelSha256": pixel_hash}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path, help="新建证据目录；已有目录拒绝覆盖")
    args = parser.parse_args()
    output = args.output.resolve()
    output.mkdir(parents=False, exist_ok=False)
    root = Path(tempfile.mkdtemp(prefix="embedded-practice-m5d-"))
    sources = root / "中文 空格阅读样本"
    assets = sources / "assets"
    assets.mkdir(parents=True)
    images = [make_image(assets / name, size, image_format) for name, size, image_format in [
        ("大图 PNG.png", (2560, 1440), "PNG"),
        ("大图 JPEG.jpg", (2400, 1600), "JPEG"),
        ("大图 WebP.webp", (2048, 1536), "WEBP"),
    ]]
    code = "\n".join([
        "/* M5 阅读与复制验收样本；不是学习答案，不执行本代码。 */",
        "#include <stddef.h>", "#include <stdint.h>", "",
        "typedef struct {", "    uint16_t index;", "    uint16_t value;",
        "    const char *label;", "} Sample;", "", "static const Sample samples[] = {",
        *[f'    {{ {i:3}u, {i * 17 % 65536:5}u, "ROW-{i:03}-' + "wide-line-" * (20 if i == 1 else 1) + 'end" },' for i in range(1, 161)],
        "};", "", "static uint32_t sum_samples(void)", "{", "    uint32_t total = 0u;",
        "    for (size_t index = 0; index < sizeof(samples) / sizeof(samples[0]); ++index) {",
        "        if ((samples[index].index & 1u) != 0u) {", "\t\ttotal += samples[index].value;",
        "        }", "    }", "    return total;", "}", "",
    ])
    code_path = sources / "缩进原文.c.txt"
    code_path.write_bytes(code.encode("utf-8"))
    paragraphs = "\n\n".join(
        f"第 {index:02} 段：这是长答案阅读验收文字。检查中文换行、行距、明暗主题和字号；"
        "在底部操作后返回上一题，题首与进度应重新可见。这里只验证界面，不作为技术答案。"
        for index in range(1, 61)
    )
    markdown = "---\nschema_version: 1\ntopic_id: m5-experience\ntopic_title: M5 阅读验收样本（非正式题库）\n---\n\n"
    markdown += "## experience-1 | 多屏代码与长答案\n\n标签：体验验收\n难度：基础\n\n### 题目\n\n"
    markdown += "验收用例：核对下列 180 余行代码的长行横向滚动、空格/Tab 缩进和复制原文。\n\n```c\n" + code + "```\n\n"
    markdown += "### 参考答案\n\nM5-LONG-ANSWER-SECRET\n\n" + paragraphs + "\n\n"
    markdown += "## experience-2 | 三种大图与草稿保存\n\n标签：体验验收\n难度：基础\n\n### 题目\n\n"
    markdown += "打开图片，放大后滚动查看网格与底边；Escape 关闭后应回到原按钮。\n\n"
    for image in images:
        name = Path(image["path"]).name
        markdown += f"![{image['format']} 大图](assets/{name.replace(' ', '%20')})\n\n"
    markdown += "### 参考答案\n\n图片是生成的尺寸与阅读验收图，不是硬件图或技术资料。\n\n"
    markdown += "## experience-3 | 输入法与外部参考链接\n\n标签：体验验收\n难度：基础\n\n### 题目\n\n"
    markdown += "用真实中文输入法选词、标点、换行，再在候选中揭晓、切题或正常关闭。\n\n"
    markdown += "[打开 SQLite 官方网站](https://www.sqlite.org/index.html)\n\n"
    markdown += "### 参考答案\n\n最终提交文字应逐字保存；候选文字尚未提交时，记录实际结束组合的结果。\n"
    bank = sources / "M5 阅读体验验收.md"
    bank.write_bytes(markdown.encode("utf-8"))
    (sources / "样本说明.txt").write_text(
        "全部是生成的体验验收素材，不是正式题库或用户学习记录。\n"
        "代码仅用于阅读与复制，未编译；图片不是技术示意图。\n"
        "只在显式独立临时目录运行，不导入正式数据；生成器不会启动程序或修改系统设置。\n",
        encoding="utf-8",
    )
    report = {"root": str(root), "sourceDirectory": str(sources), "bank": str(bank),
              "bankSha256": digest(bank), "code": str(code_path), "codeSha256": digest(code_path),
              "codeLines": len(code.splitlines()), "answerParagraphs": 60, "images": images,
              "pillow": pillow_version, "scope": "generated acceptance fixtures only; no database access"}
    (output / "samples.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
