# 部署指南 - Notepad on Cloudflare Pages

本文档详细说明如何部署 Notepad 应用到 Cloudflare Pages。

## 目录

- [前置要求](#前置要求)
- [Cloudflare 资源创建](#cloudflare-资源创建)
- [环境配置](#环境配置)
- [本地开发](#本地开发)
- [部署到生产环境](#部署到生产环境)
- [部署后验证](#部署后验证)
- [故障排除](#故障排除)

---

## 前置要求

### 必需工具

| 工具 | 版本要求 | 安装方式 |
|------|----------|----------|
| Node.js | ^20.19.0 或 >=22.12.0 | [官网下载](https://nodejs.org/) |
| Wrangler CLI | v4.x+ | `npm install -g wrangler` |
| Git | 任意稳定版本 | [官网下载](https://git-scm.com/) |

### 检查安装

```bash
# 检查 Node.js 版本
node --version

# 检查 npm 版本
npm --version

# 检查 Wrangler 版本
wrangler --version

# 检查 Cloudflare 登录状态
wrangler whoami
```

### Cloudflare 账号准备

1. 注册 [Cloudflare 账号](https://dash.cloudflare.com/sign-up)
2. 完成邮箱验证
3. 确保账号已绑定支付方式（用于 R2 存储）

---

## Cloudflare 资源创建

### 1. 创建 KV Namespace

KV Namespace 用于存储配置、分享链接映射和文件夹密码。

```bash
# 创建生产环境 KV Namespace
wrangler kv:namespace create "NOTEPAD_KV"

# 创建预览环境 KV Namespace（可选，用于本地开发）
wrangler kv:namespace create "NOTEPAD_KV" --env preview
```

命令执行后会返回类似以下信息：

```
{ binding = "NOTEPAD_KV", id = "xxxxxxxxxxxxxxxxxxxx", preview_id = "yyyyyyyyyyyyyyyyyyyy" }
```

**记录返回的 `id` 和 `preview_id`，后续配置需要用到。**

### 2. 创建 R2 Bucket

R2 Bucket 用于存储文件内容。

```bash
# 创建 R2 Bucket
wrangler r2 bucket create notepad

# 可选：指定数据中心位置
wrangler r2 bucket create notepad --location wnam  # 西半球
# 或
wrangler r2 bucket create notepad --location ena   # 东半球
```

### 3. 获取 R2 Bucket 的 Account ID

R2 Bucket 需要关联 Account ID 才能在配置中使用。

```bash
# 方式一：通过 Wrangler 命令查看
wrangler r2 bucket list

# 方式二：登录 Cloudflare Dashboard
# 访问 https://dash.cloudflare.com/{your-account-id}/r2/buckets
```

---

## 环境配置

### 环境变量与 Secrets 汇总

以下是项目所需的所有环境变量和 secrets 的汇总表：

| 变量名 | 类型 | 必填 | 说明 | 配置位置 |
|--------|------|------|------|----------|
| `JWT_SECRET` | Secret | 是 | JWT 密钥，用于生成和验证文件夹访问令牌，建议至少 32 位随机字符串 | `wrangler secret put` / `.dev.vars` |
| `ADMIN_PASSWORD` | Secret | 否 | 管理员密码，用于根目录操作权限验证。若不配置，根目录操作将不受限制 | `wrangler secret put` / `.dev.vars` |
| `ENABLE_EDGE_BLOCKING` | Var | 否 | 是否启用边缘封禁，值为 `"true"` 或 `"false"` | `wrangler.jsonc` → `vars` / `.dev.vars` |
| `CLOUDFLARE_API_TOKEN` | Secret | 否 | Cloudflare API Token，需要包含 Rules Lists 权限 | `wrangler secret put` / `.dev.vars` |
| `CLOUDFLARE_ACCOUNT_ID` | Secret | 否 | Cloudflare Account ID | `wrangler secret put` / `.dev.vars` |
| `CLOUDFLARE_BAN_LIST_ID` | Secret | 否 | Cloudflare Ban List ID（自定义列表 ID） | `wrangler secret put` / `.dev.vars` |
| `MAX_FOLDER_DEPTH` | Var | 否 | 文件夹最大深度，默认为 5 | `wrangler.jsonc` → `vars` / `.dev.vars` |

### wrangler.jsonc 配置项

以下是 `wrangler.jsonc` 文件中需要配置的资源 ID：

| 配置项 | 说明 | 获取方式 |
|--------|------|----------|
| `kv_namespaces[].id` | KV Namespace ID（生产环境） | `wrangler kv:namespace create NOTEPAD_KV` |
| `kv_namespaces[].preview_id` | KV Namespace Preview ID（本地开发） | `wrangler kv:namespace create NOTEPAD_KV --env preview` |
| `r2_buckets[].bucket_name` | R2 Bucket 名称 | `wrangler r2 bucket create notepad` |
| `r2_buckets[].preview_bucket_name` | R2 Preview Bucket 名称 | 同上 |

### 1. 更新 wrangler.jsonc

复制 `wrangler.jsonc.example` 为 `wrangler.jsonc`，填入你的资源 ID：

```bash
cp wrangler.jsonc.example wrangler.jsonc
```

编辑项目根目录下的 `wrangler.jsonc` 文件：

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "notepad",
  "compatibility_date": "2026-06-12",
  "pages_build_output_dir": "./dist",

  "kv_namespaces": [
    {
      "binding": "NOTEPAD_KV",
      // 填入你的 KV Namespace ID（生产环境）
      "id": "你的 KV_NAMESPACE_ID",
      // 填入你的 KV Namespace Preview ID（本地开发）
      "preview_id": "你的 KV_PREVIEW_ID",
    },
  ],

  "r2_buckets": [
    {
      "binding": "NOTEPAD_R2",
      // 填入你的 R2 Bucket 名称
      "bucket_name": "notepad",
      // 本地开发时使用的 Preview Bucket 名称
      "preview_bucket_name": "notepad",
      // 设为 true 允许本地开发时连接远程 R2
      "remote": true,
    },
  ],

  "vars": {
    "ENABLE_EDGE_BLOCKING": "false",
    "MAX_FOLDER_DEPTH": "5",
  },
}
```

### 2. 配置 JWT 密钥

JWT 密钥用于文件夹访问令牌的生成和验证。**务必使用强随机密钥。**

#### 生产环境密钥设置

```bash
# 交互式设置（推荐）
wrangler secret put JWT_SECRET

# 或通过文件设置
echo "your-very-secure-random-string-at-least-32-chars" > jwt_secret.txt
wrangler secret put JWT_SECRET < jwt_secret.txt
rm jwt_secret.txt  # 设置后立即删除文件
```

#### 本地开发密钥设置

在项目根目录创建 `.dev.vars` 文件：

```bash
# Windows PowerShell
echo "JWT_SECRET=your-local-dev-secret-key-here" | Out-File -FilePath .dev.vars -Encoding UTF8

# Linux/macOS
echo 'JWT_SECRET=your-local-dev-secret-key-here' > .dev.vars
```

**注意**：`JWT_SECRET` 的值应至少为 32 位字符，建议使用随机字符串生成：

```bash
# 生成随机密钥
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. 配置管理员密码（可选）

管理员密码用于根目录操作权限验证。若不配置，根目录操作将不受限制。

```bash
# 生产环境
wrangler secret put ADMIN_PASSWORD

# 本地开发（添加到 .dev.vars）
# ADMIN_PASSWORD=your-admin-password-here
```

### 4. 配置边缘封禁（可选）

边缘封禁功能可在多次密码验证失败后，通过 Cloudflare API 将 IP 地址添加到边缘封禁列表。

> **注意**：边缘封禁需要在 Cloudflare Dashboard 中手动创建配置，且需要以下两项前置准备：
>
> 1. 创建自定义列表（Ban List）
> 2. 创建自定义规则（Security Rule）

#### 什么是边缘封禁

**边缘封禁**是 Cloudflare 提供的一种安全防护机制，可以在 Cloudflare 的全球边缘节点层面阻止特定 IP 地址的访问请求。与传统的应用层封禁相比，边缘封禁具有以下特点：

- **更高性能**：封禁规则在 Cloudflare 边缘节点生效，请求不会到达你的 Pages Functions
- **全球生效**：封禁规则在所有 Cloudflare 数据中心同步，无论攻击者从哪个地区发起请求
- **更低延迟**：边缘节点直接拒绝请求，不需要经过 Workers 的处理流程
- **免费使用**：此功能基于 Cloudflare 的自定义规则和列表，不依赖收费的 WAF 功能

#### 封禁效果

当 IP 地址被边缘封禁后：

1. 该 IP 发起的所有请求都会在 Cloudflare 边缘被直接拒绝
2. 返回 HTTP 403 Forbidden 错误（或 Cloudflare 默认的封禁页面）
3. 请求不会到达你的 Pages Functions，也不会产生任何日志记录
4. 封禁对整个域名生效，不仅限于密码验证相关的 API

#### 封禁策略

| 失败次数 | 封禁时长 | 是否边缘封禁 |
|----------|----------|--------------|
| 3 | 5 分钟 | 否（仅应用层封禁） |
| 6 | 15 分钟 | 否（仅应用层封禁） |
| 9 | 30 分钟 | 否（仅应用层封禁） |
| 10+ | 永久封禁 | 是（同时边缘封禁） |

> **说明**：前 9 次失败仅在应用层（KV）记录封禁，第 10 次失败后会触发边缘封禁。

#### 前置准备：创建自定义列表（Ban List）

边缘封禁依赖 Cloudflare 的自定义列表（Custom List）来存储被封禁的 IP 地址。

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 点击左上角账户下拉菜单，选择 **管理账户**
3. 点击 **配置** 标签页
4. 选择 **列表** 子标签页
5. 点击 **创建列表** 按钮
6. 填写列表信息：
   - **名称**：`ban`（建议名称）
   - **描述**：`IP 封禁列表`
   - **类型**：`IP Lists`
7. 点击 **创建**

创建成功后，记录列表的 ID（在列表详情页可以找到）。

#### 前置准备：创建自定义规则（Security Rule）

创建完列表后，还需要创建一个安全规则，让 Cloudflare 在边缘层阻止列表中的 IP 地址。

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入你的域名页面
3. 点击左侧菜单 **安全** → **安全规则**
4. 点击 **自定义规则** 标签页
5. 点击 **创建自定义规则** 按钮
6. 填写规则信息：
   - **规则名称**：`BAN`
   - **匹配条件**：
     - **字段**：`IP 源地址`
     - **运算符**：`在列表中`
     - **值**：选择刚才创建的 `ban` 列表
   - **操作**：`阻止`
   - **放置位置**：`第一个`（确保优先级最高）
7. 点击 **部署**

#### 配置环境变量

完成上述前置准备后，配置以下环境变量：

```bash
# Cloudflare API Token（需要包含 Rules Lists 权限）
wrangler secret put CLOUDFLARE_API_TOKEN

# Cloudflare Account ID
wrangler secret put CLOUDFLARE_ACCOUNT_ID

# Cloudflare Ban List ID（上一步创建的列表 ID）
wrangler secret put CLOUDFLARE_BAN_LIST_ID
```

> **注意**：`ENABLE_EDGE_BLOCKING` 需要在 `wrangler.jsonc` 的 `vars` 中配置，而非使用 `wrangler secret put`：
>
> ```jsonc
> {
>   "vars": {
>     "ENABLE_EDGE_BLOCKING": "true",
>     "MAX_FOLDER_DEPTH": "5",
>   },
> }
> ```

#### 如何解除边缘封禁

一旦 IP 地址被边缘封禁，需要手动在 Cloudflare Dashboard 中解除：

**方法一：通过 Cloudflare Dashboard**

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 点击左上角账户下拉菜单，选择 **管理账户**
3. 点击 **配置** 标签页
4. 选择 **列表** 子标签页
5. 找到你的 `ban` 列表，点击进入
6. 在列表中找到被封禁的 IP 地址
7. 点击右侧的 **删除** 按钮解除封禁

**方法二：通过 Cloudflare API**

```bash
# 使用 curl 解除封禁
curl -X DELETE "https://api.cloudflare.com/client/v4/accounts/{account_id}/rules/lists/{list_id}/items/{item_id}" \
  -H "Authorization: Bearer {api_token}"
```

> **注意**：解除边缘封禁后，还需要清除 KV 中的封禁记录才能完全恢复访问：
>
> ```bash
> wrangler kv:key delete "folder:password:retry:{ipHash}" --namespace-id={namespace_id}
> wrangler kv:key delete "folder:password:edge_block:{ipHash}" --namespace-id={namespace_id}
> ```

---

## 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

这将同时启动：

- Vite 前端开发服务器（默认 http://localhost:5173）
- Wrangler Pages 本地模拟环境（API 请求代理）

### 3. 预览生产构建（可选）

在本地完整模拟 Cloudflare Pages 环境：

```bash
npm run preview
```

### 4. 本地测试

```bash
# 运行所有测试
npm test

# 运行测试并查看覆盖率
npm run test:coverage
```

### 5. 类型检查

```bash
npm run type-check
```

### 6. 代码检查与格式化

```bash
# 运行所有检查
npm run lint

# 格式化代码
npm run format
```

---

## 部署到生产环境

### 部署前检查清单

- [ ] `wrangler whoami` 确认已登录 Cloudflare
- [ ] KV Namespace ID 已填入 wrangler.jsonc
- [ ] R2 Bucket 已创建
- [ ] JWT_SECRET 已通过 `wrangler secret put` 设置
- [ ] （可选）ADMIN_PASSWORD 已设置（用于根目录权限控制）
- [ ] （可选）边缘封禁相关环境变量已配置
- [ ] 本地 `npm test` 全部通过
- [ ] 本地 `npm run build` 构建成功

### 执行部署

```bash
# 一键部署（自动构建 + 上传）
npm run deploy
```

### 手动分步部署

如果需要更精细控制：

```bash
# 步骤 1：构建前端
npm run build

# 步骤 2：部署到 Cloudflare Pages
wrangler pages deploy ./dist

# 或部署到特定环境
wrangler pages deploy ./dist --env production
```

### 验证部署

部署成功后，Cloudflare 会返回应用的访问地址，例如：

```
https://notepad.pages.dev
```

---

## 部署后验证

### 1. 功能测试

访问部署的地址，进行以下测试：

| 功能 | 测试方法 |
|------|----------|
| 新建文件 | 点击菜单"文件 > 新建"，输入内容 |
| 保存文件 | 点击菜单"文件 > 保存"，检查是否成功 |
| 打开文件 | 点击菜单"文件 > 打开"，浏览文件夹 |
| 创建文件夹 | 在文件对话框中点击新建文件夹按钮 |
| 设置密码 | 右键文件夹 > 设置密码 |
| 修改密码 | 右键已加密文件夹 > 修改密码 |
| 生成分享链接 | 点击菜单"文件 > 生成分享链接" |
| 生成 Raw 链接 | 点击菜单"文件 > 生成 Raw 链接" |
| Markdown 预览 | 点击菜单"查看 > Markdown 预览" |
| 主题切换 | 点击菜单"格式 > 颜色" |

### 2. 查看实时日志

```bash
# 监控所有请求
wrangler tail

# 只看错误日志
wrangler tail --status error

# 只看特定 Worker 的日志
wrangler tail notepad
```

### 3. 检查 KV 数据

```bash
# 列出 KV 中的所有 key
wrangler kv key list --namespace-id=<YOUR_NAMESPACE_ID>

# 查看特定 key
wrangler kv key get "folder:password:" --namespace-id=<YOUR_NAMESPACE_ID>
```

### 4. 检查 R2 Bucket

```bash
# 查看 Bucket 内容
wrangler r2 object list notepad

# 上传测试文件
echo "test content" | wrangler r2 object put notepad/test.txt --data

# 下载测试文件
wrangler r2 object get notepad/test.txt
```

---

## 故障排除

### 常见问题

#### 1. 部署失败：Authentication error

**原因**：未登录 Cloudflare 或登录会话过期。

**解决**：

```bash
wrangler login
```

#### 2. 部署失败：KV Namespace not found

**原因**：`wrangler.jsonc` 中的 KV Namespace ID 不正确。

**解决**：

```bash
# 查看现有 KV Namespaces
wrangler kv namespace list

# 确认 ID 是否匹配 wrangler.jsonc 中的配置
```

#### 3. API 请求返回 500 Internal Server Error

**解决**：

```bash
# 查看实时日志定位错误
wrangler tail --format pretty
```

#### 4. 文件上传失败

**可能原因**：

- R2 Bucket 未正确配置
- 文件大小超过限制（单个对象最大 5GB）
- R2 Bucket 名称包含非法字符

**解决**：

```bash
# 确认 R2 Bucket 存在
wrangler r2 bucket list

# 检查 R2 配置是否正确
cat wrangler.jsonc | grep -A 5 r2_buckets
```

#### 5. JWT 验证失败

**原因**：JWT_SECRET 与生成 token 时使用的密钥不一致。

**解决**：确保生产环境的 JWT_SECRET 与创建分享链接时使用的一致。

```bash
# 查看当前 JWT_SECRET 配置
wrangler secret list
```

#### 6. 本地开发正常，但部署后功能异常

**排查步骤**：

1. 检查 `compatibility_date` 是否需要更新
2. 查看 `wrangler tail` 日志
3. 确认 `.dev.vars` 中的密钥未用于生产
4. 清除浏览器缓存或使用隐私模式测试
5. 检查环境变量是否正确配置（注意 `ENABLE_EDGE_BLOCKING` 和 `MAX_FOLDER_DEPTH` 需要在 `wrangler.jsonc` 的 `vars` 中配置）

#### 7. 管理员功能无法使用

**可能原因**：

- `ADMIN_PASSWORD` 环境变量未配置
- 管理员 Token 过期或失效

**解决**：

```bash
# 检查管理员密码是否已设置
wrangler secret list | grep ADMIN_PASSWORD
```

#### 8. 分享链接返回 404

**可能原因**：

- Token 已过期（KV TTL 自动删除）
- Token 已被使用（一次性链接）
- KV 数据损坏或格式错误

**解决**：查看 KV 中的链接数据：

```bash
wrangler kv key get "link:{token}" --namespace-id=<YOUR_NAMESPACE_ID>
```

### 回滚操作

如果部署后出现问题需要回滚：

```bash
# 查看版本历史
wrangler versions list

# 回滚到上一个版本
wrangler rollback

# 回滚到指定版本
wrangler rollback <VERSION_ID>
```

---

## 进阶配置

### 使用自定义域名

```bash
# 在 Cloudflare Dashboard 中添加域名
# 或使用 Wrangler CLI
wrangler pages domain add your-domain.com

# 添加 CNAME
wrangler pages record add your-domain.com CNAME notepad.pages.dev
```

### 设置环境变量

```bash
# 设置生产环境变量
wrangler pages config set ENVIRONMENT=production

# 查看所有环境变量
wrangler pages env list
```

### 配置缓存策略

在 `functions/_middleware.ts` 中可以调整缓存头：

```typescript
// 根据需要调整 Cache-Control
newResponse.headers.set('Cache-Control', 'no-cache')
```

### Git 集成自动部署

1. 在 Cloudflare Dashboard 中进入你的 Pages 项目
2. 点击 **设置** → **部署**
3. 点击 **连接到 Git**
4. 选择你的 Git 仓库（GitHub/GitLab/Bitbucket）
5. 配置构建命令：`npm run build`
6. 配置构建输出目录：`dist`
7. 点击 **保存并部署**

配置完成后，每次推送到主分支都会自动触发部署。

---

## 安全建议

1. **JWT_SECRET 密钥安全**
   - 使用强随机字符串（至少 32 字符）
   - 定期轮换密钥
   - 不要在代码库中硬编码

2. **R2 Bucket 访问控制**
   - 考虑使用 R2 的自定义域名绑定并配置 HTTPS
   - 避免将 Bucket 设为公开访问

3. **KV 数据保护**
   - 文件夹密码已使用 PBKDF2 加密存储
   - 定期审计 KV 中的敏感数据

4. **分享链接安全**
   - 设置合理的链接有效期
   - 敏感文件使用密码保护
   - 一次性链接使用后自动失效

5. **管理员密码安全**
   - 使用强密码
   - 通过环境变量配置，不硬编码
   - 定期更换管理员密码

---

## 获取帮助

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
- [Cloudflare 社区](https://community.cloudflare.com/)