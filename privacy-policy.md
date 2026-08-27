# Readmode 隐私政策

最后更新：2026 年 8 月 27 日

Readmode 是一个免费、local-first 的 Chrome 扩展，用于阅读 Markdown 文件和预览 HTML 文档、原型。当前版本不上传文档内容到 Readmode 服务器，不要求账号，也不使用分析或广告追踪。

## 文档与网页内容处理

用户主动导入的本地文件会在浏览器中读取和渲染。用户主动选择预览在线文档时，扩展会读取该 URL 和文档内容，并可能使用当前浏览器已有的登录态请求用户本来就有权限查看的附件。文档内容和网址仅用于提供 Readmode 的阅读或预览功能，不会发送到 Readmode 后端、广告服务或分析服务。

## HTML 运行

安全预览默认限制脚本、表单、iframe 和危险 URL。用户明确选择“运行原始 HTML”后，所选 HTML 文档自身的脚本和外部资源可能在隔离的 sandbox 页面中运行；请只运行信任的文件和来源。该模式不会让文档获得 Chrome 扩展 API、扩展存储或父页面访问权限。

## 本地存储

扩展使用 `chrome.storage.local` 保存阅读偏好和用户设置，也使用 `chrome.storage.session` 暂存当前预览所需的本地文件或用户主动打开的文档内容。会话数据用于完成当前预览，不用于建立云端文档副本。

## 权限

- `storage`：保存阅读偏好和当前预览所需的临时数据；
- `tabs`：识别用户当前选择的标签页，并打开、更新或返回 Readmode 阅读页；
- `contextMenus`：提供用户主动选择的“在 Readmode 中打开”菜单；
- `activeTab` 与 `scripting`：仅在用户点击扩展按钮或选择右键菜单后，临时读取当前标签页或用户已允许访问的本地文件，用于生成阅读或预览页面。Readmode 不会在所有网站上常驻运行，也不会将这些权限用于广告、分析或无关的数据收集。

## Chrome Web Store Limited Use

Readmode 对从 Chrome API 获得的信息的使用遵守 [Chrome Web Store User Data Policy](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq)，包括 Limited Use 要求。Readmode 仅将网页内容、网址和本地文件内容用于用户主动请求的阅读与预览功能，不会出售、转让或用于个性化广告。

## 第三方服务

当前版本不使用分析、广告追踪、文档存储、支付或 Readmode 云端后端。若未来引入新的第三方服务，会在启用前更新本政策，说明其处理范围。

## 联系方式

如需反馈隐私问题，请通过 [GitHub Issues](https://github.com/Cyrus2333/Readmode/issues) 联系维护者。请不要在公开 issue 中粘贴私人文档、凭据或其他敏感信息。
