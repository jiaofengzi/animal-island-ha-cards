# 可选字体：只保留说明，不随包分发

当前包**不包含任何字体二进制**。卡片不注入 `@font-face`、不自动下载字体、不请求 CDN。

## 推荐名称与字重

| 字体 | 字重 | 用途 |
|---|---|---|
| Nunito | 500、700、900 | 拉丁字母、数字、强调文字 |
| Noto Sans SC | 400、500、700 | 简体中文、辅助文字与标题 |

这些是原 Animal Island UI 的字体偏好，不是运行必需依赖。若想接近原参考字形，可自行取得有合法许可的字体，在**实际查看仪表盘的电脑/设备操作系统**中安装对应字族与字重，然后重新打开浏览器。只在 Home Assistant 服务器安装字体不会让另一台客户端自动获得它。移动设备或浏览器若不能使用自装字体，就保持系统回退。

默认 CSS 依次尝试 `Nunito`、`Noto Sans SC` 与系统字体（例如 PingFang SC、Microsoft YaHei、sans-serif）。未安装推荐字体时，卡片照常工作；字宽、换行和字重外观会随系统变化。无需添加资源链接，也不要为了本包加载外部字体服务。

## 升级与许可

安装只需 `dist/island-ha-cards.js`、`dist/licenses/`、`dist/THIRD_PARTY_NOTICES.md`；当前 dist 中没有 fonts 目录。若之前手动复制过旧字体文件，本版不会引用它们，用户可自行清理旧目录。构建脚本会清理工作副本的旧 `dist/fonts/`，不再复制字体。

Nunito 与 Noto Sans SC 的 SIL Open Font License 1.1 文本保留在 `licenses/nunito-OFL.txt` 与 `licenses/notosanssc-OFL.txt`，仅作可选安装参考；请核对自行取得字体的许可。Animal Island UI 与 Naive Icons 的 MIT 许可仍随安装包保留，因为 CSS 规则与实际 React 图标仍被使用。
