# 字体：随包附带圆体子集

自 Island UI 改版起，安装包在 `dist/fonts/` 里附带两款 SIL OFL 1.1 字体的 WOFF2 子集，由卡片脚本按自身地址注入同源 `@font-face`，不请求任何 CDN：

| 文件 | 字体 | 字重 | 范围 |
|---|---|---|---|
| `island-rounded-500/700/900.woff2` | Resource Han Rounded CN | Medium / Bold / Heavy | GB2312 全部 6763 个汉字 + ASCII + 常用全角标点 |
| `island-nunito.woff2` | Nunito（可变字重） | 200–1000 | Basic Latin + Latin-1 |

CSS 字体栈为 `"Island Nunito", "Island Rounded", Nunito, "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif`：拉丁字母和数字用 Nunito，中文用圆体，GB2312 以外的字回落到系统字体。

## 安装

复制整个 `dist/` 目录（含 `fonts/`）到 `config/www/island-ha-cards/`。字体按 JS 文件所在目录解析，所以不需要额外的资源链接。

## 重新生成与许可

`python scripts/fonts/subset.py <RHR-CN-0.990.7z> <Nunito[wght].ttf>`，依赖 `fonttools brotli py7zr`。只裁剪字符集，不修改字形。许可文本 `src/fonts/ResourceHanRounded-LICENSE.md`、`src/fonts/Nunito-OFL.txt` 会随构建复制到 `dist/fonts/`。来源和版权见 `THIRD_PARTY_NOTICES.md`。

这改变了旧版“不随包分发字体”的策略，原因是系统字体回落时中文没有圆润感，破坏整体风格。
