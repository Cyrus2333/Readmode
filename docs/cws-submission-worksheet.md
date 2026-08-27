# Chrome Web Store 提交工作表

这份工作表根据 Chrome Web Store Developer Dashboard 的当前字段整理。它不进入插件运行时，也不要求建立后端。

## 1. 基本定位

### Single purpose

> Read Markdown files and preview HTML documents and prototypes in a readable Chrome view, while processing document content locally in the browser.

中文内部备选：

> 在 Chrome 中把 Markdown 文件和 HTML 文档/原型转换为适合阅读和检查的页面，文档默认只在浏览器本地处理。

### 权限用途说明

| 权限 | 提交时说明 |
| --- | --- |
| `activeTab` + `scripting` | 仅在用户点击扩展按钮或选择右键菜单后，临时读取当前标签页并注入随扩展发布的文档提取脚本；不在所有网站常驻运行。 |
| `storage` | 保存用户阅读偏好和当前预览所需的临时内容；不建立云端文档副本。 |
| `tabs` | 在用户点击扩展操作后打开或更新 Readmode viewer，并在用户选择时切换阅读页。 |
| `contextMenus` | 提供用户主动选择的“在 Readmode 中打开当前页面”菜单。 |

### Remote code

选择：**Yes, this extension uses remote code only after explicit user action**。

填写理由：Readmode 不下载或执行远程扩展代码，所有扩展 JavaScript、CSS 和 HTML 均随 ZIP 发布。只有当用户明确选择“运行原始 HTML”时，所选 HTML 文档自身的脚本和外部资源才会在隔离的 Manifest V3 sandbox 页面中运行；该页面没有 Chrome 扩展 API、扩展存储、cookie 或父页面访问权限。此行为仅用于按用户请求预览交互式 HTML 原型。

## 2. Privacy practices

- 隐私政策 URL：正式官网配置后填写；当前源文件为 `privacy-policy.md` 和 `site/privacy.html`。
- 文档内容：不上传到 Readmode 后端。
- 在线附件：使用用户当前浏览器会话访问用户已经有权限查看的 URL。
- 本地存储：阅读设置、临时预览内容。
- 分析/广告：当前不使用。
- 数据出售/转移：当前不使用。

提交时的 Chrome 数据使用声明必须与隐私政策和插件内说明保持一致。

## 3. Store listing 资产

当前产品计划准备：

- Store icon：`icons/icon-128.png`；
- 至少 3 张最终截图，推荐 1280×800；
- Small promo tile：440×280 PNG/JPEG；
- Marquee promo tile：1400×560 PNG/JPEG；
- Promo video：如提交，使用不含敏感业务信息的公开视频；
- English 和 Simplified Chinese listing 文案；
- 当前版本为免费开源版本，无付费入口。
- Homepage URL、Support URL、Privacy Policy URL。

截图内容见 `docs/store-screenshot-plan.md`，人工验收见 `docs/acceptance-matrix.md`。

## 4. 当前免费开源发布

Chrome Web Store 和 GitHub 均分发当前免费开源版本。当前不配置外部 checkout、不收取费用、不要求账号，也不启用许可证激活流程。未来若引入独立授权或服务，会先更新官网、隐私政策、条款和发布流程。

## 5. 提交顺序

1. 上传 `/Users/huangjingye/Documents/project/MD-HTML预览/dist/readmode-0.3.3-community.zip`；
2. 填写 Store Listing；
3. 填写 Privacy practices、single purpose、权限理由、remote code 和数据使用声明；
4. 填写 Distribution 与支持信息；
5. 用干净 Chrome 配置完成测试说明中的所有用例；
6. 先选择 deferred publishing，审核通过后再手动发布；
7. 发布后保存商店 URL，并回填 `src/commercial-config.js` 与官网链接。
