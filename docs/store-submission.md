# Chrome Web Store 提交准备

## 当前官方 Dashboard 字段

完整工作表见 `docs/cws-submission-worksheet.md`。提交时还需要填写 single purpose、权限用途、remote code、数据使用声明、Privacy Policy URL、Distribution 和 Support URL；这些字段不能只靠 manifest 自动完成。

当前产品建议：remote code 选择 No；单一目的聚焦“本地优先的 Markdown 阅读与 HTML 文档/原型预览”。

## Listing

- 产品名：`Readmode — Markdown & HTML Reader`
- 中文名：`Readmode｜Markdown 阅读与 HTML 预览`
- 短描述：见 `store-listing.md`
- 长描述：见 `store-listing.md`
- 关键词：Markdown reader / Markdown viewer / Markdown preview / HTML preview / HTML prototype preview
- 图标：`icons/icon-16.png`、`icon-32.png`、`icon-48.png`、`icon-128.png`

## 必填或强烈建议准备

- 真实的 Chrome Web Store 首页链接；
- 官网 Homepage URL、Support URL 和 Privacy Policy URL；
- 公开隐私政策 URL；
- 支持 URL 或支持邮箱；
- 至少 1 张 1280×800 截图，产品计划准备 3–5 张不包含私密内容的真实截图；
- 440×280 small promo tile；
- 1400×560 marquee promo tile；
- 如提交，准备不含敏感信息的 promo video 链接；
- 免费和未来 Pro 功能的清晰说明；
- HTML 原始运行的安全提示；
- 权限用途说明：`storage`、`tabs`、`contextMenus`、网站访问权限；
- 版本号与 `manifest.json`、发布说明、ZIP 文件一致。

## 权限说明口径

- `storage`：保存用户偏好和一次性临时预览内容；
- `tabs`：打开 Readmode viewer，并在用户选择时回到原始页面；
- `contextMenus`：提供“在 Readmode 中打开”；
- HTTP、HTTPS 和用户主动允许的本地文件网址：识别用户主动打开的 Markdown / HTML 文档并在浏览器中读取。自动渲染可以在设置中关闭。

## 付费与条款

如果通过外部 checkout 销售 Pro，需要在官网和支付页明确销售主体、价格、功能边界、退款和支持方式。Chrome Web Store 只负责扩展分发，插件本身不保存支付凭证。

## 自动预检

```bash
npm run check
npm run preflight
npm run package
```

`preflight` 会明确列出仍需负责人配置的支付、官网、支持和截图信息；`release:check` 是接受真实订单前的严格门禁。

## 上架前人工验收

1. 干净 Chrome 配置文件安装 ZIP；
2. 开启文件网址访问；
3. 本地 Markdown、Markdown 附件、在线 HTML、在线 Markdown 各测一次；
4. 测试 401/403、404、空文件、非 UTF-8、无扩展名 text/plain；
5. 测试 HTML 样式、相对资源、安全预览和原始运行；
6. 测试原文弹窗关闭按钮、遮罩点击和 Escape；
7. 测试自动渲染关闭后手动打开；
8. 测试设置保存和离线许可证激活；
9. 检查商店截图中不存在真实业务数据、私有域名或用户姓名。
