# Readmode 最终验收矩阵

这份矩阵用于最终 Chrome Web Store 提交前的人工验收。自动检查只能证明静态结构、渲染器 smoke test、许可证算法和 ZIP 完整性，不能代替真实 Chrome 页面上的行为验证。

## 环境

- Chrome stable，使用干净配置文件或新的测试用户配置；
- 从 `dist/readmode-<version>.zip` 解压或加载最终未打包目录；
- 扩展详情中开启“允许访问文件网址”；
- 测试文件使用脱敏样例，不使用真实业务数据、私有域名或用户姓名。

## 功能用例

| 编号 | 场景 | 操作 | 通过标准 |
| --- | --- | --- | --- |
| A01 | 本地 Markdown | 打开 `.md` 后点击扩展图标 → 在 Readmode 中预览当前文档 | 打开阅读视图；左侧目录、正文、图片和代码块正常 |
| A02 | Popup 导入 Markdown | 点击扩展图标 → 打开本地文件 | 新标签打开阅读视图；空文件有明确提示 |
| A03 | 在线 Markdown | 打开已登录的附件 URL 后点击扩展图标 | 保留当前登录态；文档内容可读；不出现 Failed to fetch |
| A04 | 无扩展名文本附件 | 通过 Popup/右键打开 `text/plain` 或 `text/markdown` | 能识别 Markdown；普通网页正文不被读取或替换 |
| A05 | 本地 HTML | 打开 `.html` 后点击扩展图标 | 页面样式完整；没有 Readmode 外壳挤压内容 |
| A06 | 在线 HTML | 打开带样式的 HTML 链接后点击扩展图标 | 相对 CSS、图片、字体尽可能保持；安全预览默认无脚本 |
| A07 | HTML 交互原型 | Popup → 启用 JS | 在隔离 sandbox 中运行所选 HTML；脚本交互可用，且可切回安全模式 |
| A08 | Markdown 目录 | 点击多个目录项 | 定位正确；目录不提供无效的收起/展开按钮 |
| A09 | 查看原文 | 打开原文弹窗并滚动 | 标题栏和关闭按钮保持可见；按钮、遮罩点击、Escape 均可关闭 |
| A10 | Popup 状态 | 在原生页面和 Readmode viewer 间切换 Popup | 原生页显示打开/导入菜单；viewer 显示对应操作；无重复弹窗或死按钮 |
| A11 | 设置 | 修改主题、正文宽度 | 重新打开文档后偏好生效；HTML 不受 Markdown 主题影响 |
| A13 | 权限边界 | 打开普通新闻/业务网页但不点击 Readmode | 页面不被读取、注入或替换；只有用户点击扩展或右键菜单后才读取当前页面 |
| A14 | 错误状态 | 401、403、404、空文件、无权限本地文件 | 错误信息可理解，并给出下一步操作 |

## 发布证据

每个用例至少记录：Chrome 版本、扩展版本、测试文件类型、结果和必要截图。商店截图只使用脱敏后的最终画面。通过全部用例后，再运行：

```bash
npm run check
npm run preflight
npm run release:check
npm run package
unzip -t dist/readmode-<version>.zip
```
