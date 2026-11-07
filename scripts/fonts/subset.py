"""把圆体和 Nunito 裁成网页用的 woff2。

用法：python scripts/fonts/subset.py <RHR-CN.7z 路径> <Nunito[wght].ttf 路径>
中文字体只保留 GB2312 全部 6763 个汉字 + ASCII + 常用全角标点，缺的字由系统字体补。
"""
import os
import sys
import tempfile

import py7zr
from fontTools import subset

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "src", "fonts")
os.makedirs(OUT, exist_ok=True)


def gb2312_chars():
    chars = set()
    for hi in range(0xA1, 0xF8):
        for lo in range(0xA1, 0xFF):
            try:
                chars.add(bytes([hi, lo]).decode("gb2312"))
            except UnicodeDecodeError:
                pass
    chars.update(chr(c) for c in range(0x20, 0x7F))
    chars.update("°·•…—–‘’“”、。，：；！？（）《》〈〉【】「」『』～￥％＋－×÷＝")
    return "".join(sorted(chars))


def run(src, dst, text=None, unicodes=None):
    opts = subset.Options()
    opts.flavor = "woff2"
    opts.layout_features = ["*"]
    opts.name_IDs = ["*"]
    opts.notdef_outline = True
    font = subset.load_font(src, opts)
    sub = subset.Subsetter(opts)
    sub.populate(text=text or "", unicodes=unicodes or [])
    sub.subset(font)
    subset.save_font(font, dst, opts)
    font.close()
    print(dst, os.path.getsize(dst) // 1024, "KB")


def main():
    archive, nunito = sys.argv[1], sys.argv[2]
    weights = {"Medium": "500", "Bold": "700", "Heavy": "900"}
    text = gb2312_chars()
    with tempfile.TemporaryDirectory() as tmp:
        names = [f"ResourceHanRoundedCN-{w}.ttf" for w in weights]
        with py7zr.SevenZipFile(archive) as z:
            z.extract(path=tmp, targets=names)
        for w, num in weights.items():
            run(os.path.join(tmp, f"ResourceHanRoundedCN-{w}.ttf"), os.path.join(OUT, f"island-rounded-{num}.woff2"), text=text)
    latin = list(range(0x20, 0x7F)) + list(range(0xA0, 0x100)) + [0x2013, 0x2014, 0x2018, 0x2019, 0x201C, 0x201D, 0x2022, 0x2026, 0x20AC]
    run(nunito, os.path.join(OUT, "island-nunito.woff2"), unicodes=latin)


if __name__ == "__main__":
    main()
