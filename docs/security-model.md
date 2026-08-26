# Readmode 安全边界

## 默认阅读路径

Markdown 在浏览器扩展页中转换为 HTML。渲染器会转义普通文本，并将 Markdown 链接中的 `javascript:`、`data:` 和 `vbscript:` URL 拦截为安全占位。

## HTML 安全预览

HTML 默认放入没有 `allow-scripts` 的 sandbox iframe，并在写入前移除：

- `script`；
- `iframe`、`object`、`embed`；
- `form`；
- 自动刷新 meta；
- 内联事件处理器；
- `javascript:`、`data:`、`vbscript:` URL。

外部样式、图片和普通资源仍可能被浏览器请求，这是为了尽可能保留原型的视觉效果。安全预览不是完整的恶意网页沙箱，用户不应把不可信 HTML 当作安全文件执行。

## 原始 HTML 运行

“运行原始 HTML”是显式动作。它离开 Readmode viewer，回到源 URL 或本地文件 URL，让 Chrome 按原始页面规则处理脚本和资源。该动作必须保持可见、可逆，并在帮助文档中提示只运行可信来源。

## 数据最小化

content script 不应读取普通网页的全文内容。只有 URL 扩展名或响应类型已经表明页面可能是 Markdown / 纯文本附件时，才读取必要的文本用于识别或预览；普通 HTML 页面即使路径包含 `.html`，也不会先读取全文。HTML 原始内容由 viewer 通过用户主动打开的 URL 获取。
