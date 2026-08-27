# Readmode

Readmode 是一个免费、开源、local-first 的 Chrome 扩展，用于阅读 Markdown 文件和预览 HTML 文档与原型。

## 产品定位

- 在 Chrome 中直接阅读本地 Markdown 文件和已登录的附件链接。
- 在不丢失原始布局和样式的情况下预览 HTML 文档与原型。
- 默认使用安全 HTML 预览；只有用户明确选择后才运行原始 HTML。
- 文档内容在浏览器中处理，不上传到 Readmode 后端。
- 当前不要求账号、不收费、不包含云端文档存储。

## 当前能力

- 本地 `.md`、`.markdown`、`.mkd`、`.mdx`、`.html` 和 `.htm` 文件。
- 在线 Markdown / HTML 链接，包括浏览器当前登录态可以访问的文档附件。
- 全屏 Markdown 布局、永久左侧目录和流式正文区域。
- 表格、任务列表、引用、GitHub 风格提示块、图片、链接、代码块、深色模式、源码查看和 Markdown 打印。
- 保留页面样式的全屏 HTML 安全预览。
- 用户主动选择后的“运行原始 HTML”交互预览。
- 设置页中的自动渲染、页面处理规则、Markdown 主题和正文宽度设置。

## 开源与贡献

Readmode 以 MIT License 开放。欢迎通过 GitHub Issues 提交问题、分享不含敏感信息的样例，或发起 Pull Request。

当前版本没有商业授权、订阅或付费门槛。未来如果增加独立服务或其他授权形式，会先根据真实使用反馈重新评估，并单独说明规则。

## 本地开发

```bash
npm run check
npm run preflight
npm run package:community
```

`npm run package:community` 会生成不包含私有目录的 Community Edition。`src/pro/` 如果存在，仅作为未来实验的本地私有目录，不属于公开源码和当前发布包。

## 隐私与安全

请阅读 [`privacy-policy.md`](privacy-policy.md) 和官网上的[隐私政策](https://cyrus2333.github.io/Readmode/privacy.html)。提交 issue、截图或补丁时，请移除私人文档、客户数据、账号信息、激活码和其他秘密。
