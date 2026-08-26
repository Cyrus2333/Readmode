# Readmode 离线许可证操作说明

## 目标

Readmode 的许可证验证在插件本地完成，不需要在线 license server。插件内只保存公钥，签发私钥不得提交到仓库、打包文件、网盘或客服工单。

当前 `src/pro/license.js` 使用 P-256 / ECDSA-SHA-256，许可证格式为：

```text
RM1.<base64url(payload)>.<base64url(signature)>
```

许可证 payload 至少包含：

- `version: 1`
- `product: "readmode"`
- `plan: "pro"`
- `edition`
- `licenseId`
- `issuedAt`
- 可选 `notBefore` / `expiresAt`

## 生成生产密钥

在安全的本地目录执行，不要把目录放入项目：

```bash
node scripts/license-keygen.mjs /secure/path/readmode-keys
```

或者在确认目录安全、即将发布新版本时自动更新插件公钥：

```bash
node scripts/license-keygen.mjs /secure/path/readmode-keys --apply
```

不使用 `--apply` 时，再把输出的 **public JWK** 替换到 `src/pro/license.js` 的 `PUBLIC_KEY_JWK`；使用 `--apply` 时脚本会直接完成这一步。之后重新运行检查和打包：

```bash
npm run check
npm run preflight
npm run package
```私钥只保存在产品负责人的离线安全位置，并保留备份。

当前仓库内的公钥只用于开发验证，不能直接作为正式售卖密钥。

## 签发测试许可证

```bash
node scripts/issue-license.mjs \
  --private-key /secure/path/readmode-keys/readmode-license-private.pem \
  --id BETA-2026-001
```

带到期时间的许可证：

```bash
node scripts/issue-license.mjs \
  --private-key /secure/path/readmode-keys/readmode-license-private.pem \
  --id TRIAL-2026-001 \
  --expires 2026-12-31
```

## 商业化前必须完成

生产发布使用 `npm run release:check` 做严格门禁；预发布阶段使用 `npm run preflight`，它会把尚未提供的负责人输入标为 WAIT，而不会误报为可售状态。

1. 生成并备份生产密钥；
2. 将生产公钥写入插件并发布一个新版本；
3. 在支付平台上完成一笔真实小额测试订单；
4. 用订单号生成许可证并在干净 Chrome 配置文件激活；
5. 测试错误签名、篡改 payload、过期许可证和移除本机激活；
6. 决定退款后的处理规则。纯离线许可证无法即时远程撤销，建议早期采用人工处理和“停止后续版本授权”的简单规则。

## 安全边界

离线许可证的目标是提供正常购买流程和基本防误用，不承诺绝对防破解。不要在插件中嵌入私钥，也不要把支付平台密钥、Webhook 密钥或管理员凭据放入前端代码。
