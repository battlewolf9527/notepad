# Notepad Code Wiki

## 项目概述

基于 Cloudflare Pages 的在线记事本应用，完全复刻 Windows 经典记事本界面，支持文件夹级密码保护、分享链接、Markdown 预览等功能。

### 技术栈

| 层级          | 技术                           | 版本          |
| ------------- | ------------------------------ | ------------- |
| 前端框架      | Vue 3                          | ^3.5.32       |
| 状态管理      | Pinia                          | ^3.0.4        |
| 构建工具      | Vite                           | ^8.0.8        |
| 后端运行时    | Cloudflare Pages Functions     | -             |
| 存储          | Cloudflare R2 / KV             | -             |
| 密码哈希      | Web Crypto API (PBKDF2-SHA256) | -             |
| JWT           | jose                           | ^6.2.3        |
| Markdown 渲染 | markdown-it                    | ^14.3.0       |
| 编码检测      | jschardet                      | ^3.1.4        |
| 数学公式      | KaTeX                          | ^0.17.0       |
| 图表支持      | Mermaid                        | ^11.16.0      |
| 虚拟滚动      | vue-virtual-scroller           | ^2.0.0-beta.8 |
| 键盘快捷键    | @vueuse/core                   | ^11.1.0       |

---

## 项目结构

```
notepad/
├── functions/                    # Cloudflare Pages Functions 后端
│   ├── _middleware.ts            # 全局安全响应头中间件
│   ├── types/                    # 后端类型定义
│   │   ├── env.ts                # 环境变量类型
│   │   └── r2-extensions.d.ts    # R2 扩展类型
│   ├── utils/                    # 后端工具模块
│   │   ├── admin.ts              # 管理员认证
│   │   ├── api.ts                # API 通用处理（参数解析、权限检查）
│   │   ├── constants.ts          # 常量定义（KV键前缀、哈希参数等）
│   │   ├── error.ts              # 错误处理与日志
│   │   ├── folder-auth.ts        # 文件夹权限检查核心逻辑
│   │   ├── jwt.ts                # JWT 生成与验证
│   │   ├── password.ts           # PBKDF2 密码哈希
│   │   ├── path.ts               # 路径规范化工具
│   │   ├── r2.ts                 # R2 存储操作封装
│   │   ├── rate-limit.ts         # IP 封禁与重试限制
│   │   ├── response.ts           # 响应生成工具
│   │   ├── share.ts              # 分享链接逻辑
│   │   ├── share-page.ts         # 分享页面 HTML 生成
│   │   ├── template.ts           # HTML 模板渲染
│   │   ├── theme.ts              # 主题样式生成
│   │   └── token.ts              # 随机 Token 生成
│   ├── api/                      # API 路由
│   │   ├── config.ts             # 配置读写
│   │   ├── admin.ts              # 管理员登录
│   │   ├── files/[[path]].ts     # 文件 CRUD（列表、读取、写入、删除、移动）
│   │   ├── folder.ts             # 文件夹操作（创建、删除、重命名）
│   │   ├── folder/password.ts    # 文件夹密码管理（验证、设置、移除、重置）
│   │   ├── folder/no-encrypt.ts  # 文件夹加密禁用/启用
│   │   ├── share.ts              # 生成阅读视图分享链接
│   │   ├── raw.ts                # 生成 Raw 链接
│   │   ├── shares.ts             # 列出分享链接
│   │   ├── share/[token].ts      # 删除分享链接
│   │   └── shares/verify.ts      # 验证分享链接密码
│   ├── view/[token].ts           # 阅读视图页面（HTML）
│   ├── view/[token]/auth.ts      # 分享链接密码验证
│   └── raw/[token].ts            # Raw 直链（纯文本）
├── src/                          # Vue 3 前端
│   ├── components/               # 组件
│   │   ├── MenuBar.vue           # 菜单栏（文件、编辑、格式、查看、帮助）
│   │   ├── TextEditor.vue        # 文本编辑器（contenteditable div，支持选中状态保持、富文本过滤）
│   │   ├── StatusBar.vue         # 状态栏（行号、列号、文件大小、编码）
│   │   ├── EditorWrapper.vue     # 编辑器包装器（含 Markdown 切换）
│   │   ├── FileDialog.vue        # 文件对话框（浏览、选择、新建文件夹）
│   │   ├── FileDialogPassword.vue # 文件对话框密码输入弹窗
│   │   ├── FileDialogContextMenu.vue # 文件对话框右键菜单
│   │   ├── SettingsDialog.vue    # 设置对话框（主题、字体、自动保存等）
│   │   ├── FontDialog.vue        # 字体设置对话框
│   │   ├── CustomThemeDialog.vue # 自定义主题对话框
│   │   ├── FindReplace.vue       # 查找替换对话框
│   │   ├── ShareDialog.vue       # 分享链接生成对话框
│   │   ├── RawDialog.vue         # Raw 链接生成对话框
│   │   ├── ShareManager.vue      # 分享链接管理面板
│   │   ├── MarkdownPreview.vue   # Markdown 预览组件（含 KaTeX、Mermaid）
│   │   ├── AdminLoginDialog.vue  # 管理员登录对话框
│   │   ├── AdminBadge.vue        # 管理员状态徽章（⚡ 图标）
│   │   ├── ZoomControl.vue       # 缩放控制（50% - 200%）
│   │   ├── ConfirmDialog.vue     # 确认对话框
│   │   ├── PromptDialog.vue      # 提示对话框（输入型）
│   │   ├── ToastNotification.vue # Toast 通知组件
│   │   ├── ErrorRetry.vue        # 错误重试组件
│   │   └── AboutDialog.vue       # 关于对话框
│   ├── composables/              # 组合式函数
│   │   ├── useFileOperations.ts  # 文件操作逻辑（新建、打开、保存、导入、下载）
│   │   ├── useEditorCommands.ts  # 编辑器命令（撤销、复制、查找替换等）
│   │   ├── useKeyboardShortcuts.ts # 键盘快捷键绑定
│   │   ├── useAppDialogs.ts      # 对话框管理（统一打开/关闭）
│   │   ├── useDraggable.ts       # 拖拽功能（对话框拖拽）
│   │   └── useModalClose.ts      # 模态框关闭（点击外部关闭）
│   ├── stores/                   # Pinia stores
│   │   ├── auth.ts               # 认证状态（文件夹密码、管理员）
│   │   ├── editor.ts             # 编辑器状态（内容、光标、格式等）
│   │   ├── files.ts              # 文件列表状态（当前路径、文件/文件夹列表）
│   │   ├── config.ts             # 配置状态（主题、字体、自动保存等）
│   │   ├── share.ts              # 分享链接状态（生成、管理）
│   │   ├── toast.ts              # Toast 通知状态
│   │   └── confirm.ts            # 确认对话框状态
│   ├── utils/                    # 前端工具
│   │   ├── api.ts                # API 请求封装（自动携带 Token）
│   │   ├── path.ts               # 路径工具（规范化、拼接）
│   │   ├── share.ts              # 分享链接工具（生成、验证）
│   │   ├── constants.ts          # 常量定义（快捷键、主题等）
│   │   ├── shortcuts.ts          # 快捷键定义与映射
│   │   ├── error.ts              # 错误处理（自定义错误类）
│   │   ├── markdown-renderer.ts  # Markdown 渲染器（markdown-it 配置）
│   │   └── theme-styles.ts       # 主题样式生成（动态 CSS）
│   ├── types/index.ts            # 前端类型定义
│   ├── types/markdown-it-task-lists.d.ts # 任务列表插件类型
│   ├── styles/notepad.css        # 全局样式（Windows 记事本风格）
│   ├── App.vue                   # 根组件
│   └── main.ts                   # 入口文件
├── types/shared.ts               # 前后端共享类型（FileInfo、FolderInfo、ShareLinkData 等）
├── tests/                        # 测试文件（Vitest）
├── public/                       # 静态资源（图标、favicon）
├── wrangler.jsonc.example        # Cloudflare 配置示例
└── package.json                  # 项目配置
```

---

## 核心架构

### 架构分层

```
┌─────────────────────────────────────────────────────────────┐
│                    前端 (Vue 3 + Vite)                       │
│  ┌─────────┐  ┌──────────────┐  ┌─────────────────────────┐ │
│  │ 视图层   │  │  组合式函数   │  │        Stores          │ │
│  │ Components│  │ Composables  │  │ auth/editor/files/...  │ │
│  └────┬────┘  └──────┬───────┘  └──────────┬──────────────┘ │
│       │              │                      │                │
│       └──────────────┼──────────────────────┘                │
│                      ▼                                       │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    API 封装 (src/utils/api.ts)          │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────┬──────────────────────────────┘
                               ▼ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│              Cloudflare Pages Functions                      │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              _middleware.ts (安全响应头)                 │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    API 路由层                            │ │
│  │  api/config.ts  api/files/[[path]].ts  api/share.ts     │ │
│  │  view/[token].ts  raw/[token].ts                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    工具层                                │ │
│  │  folder-auth.ts  jwt.ts  password.ts  share.ts  r2.ts   │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare 存储层                         │
│  ┌─────────────────────────┐  ┌─────────────────────────┐   │
│  │         R2 Bucket       │  │          KV             │   │
│  │   NOTEPAD_R2 (文件内容)  │  │   NOTEPAD_KV (元数据)    │   │
│  └─────────────────────────┘  └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 数据流向

**文件操作流程**：

1. 用户操作 → `useFileOperations.ts` → `filesStore` → `api.ts` → `api/files/[[path]].ts` → R2

**认证流程**：

1. 用户输入密码 → `authStore.verifyFolderPassword()` → `/api/folder/password` → `folder-auth.ts` → KV → 返回 JWT
2. 后续请求携带 `Authorization: Bearer <token>` → `checkPathAccess()` 验证权限

**分享链接流程**：

1. 用户创建链接 → `/api/share` → `share.ts` → KV 存储链接信息
2. 访问分享链接 → `/view/:token` → `share.ts` 验证 → R2 获取内容 → 渲染 HTML

---

## 关键模块详解

### 1. 后端工具模块

#### 1.1 JWT 管理 (`functions/utils/jwt.ts`)

**功能**：JWT 的生成与验证，使用 `jose` 库实现。

**核心函数**：

| 函数        | 说明          | 参数                                                         | 返回值                     |
| ----------- | ------------- | ------------------------------------------------------------ | -------------------------- |
| `createJwt` | 创建 JWT 令牌 | `payload`: JwtPayload, `secret`: string, `expiresIn`: number | Promise\<string\>          |
| `verifyJwt` | 验证 JWT 令牌 | `token`: string, `secret`: string                            | Promise\<JwtVerifyResult\> |

**JwtPayload 结构**：

| 字段           | 类型                 | 说明                                 |
| -------------- | -------------------- | ------------------------------------ |
| `userId`       | string               | 用户标识                             |
| `pathPrefix`   | string \| undefined  | 授权访问的路径前缀                   |
| `admin`        | boolean \| undefined | 是否管理员                           |
| `tokenVersion` | number \| undefined  | 令牌版本（用于密码变更后失效旧令牌） |

#### 1.2 密码哈希 (`functions/utils/password.ts`)

**功能**：使用 Web Crypto API 的 PBKDF2-SHA256 算法进行密码哈希和验证。

**核心函数**：

| 函数             | 说明     | 参数                                     | 返回值             |
| ---------------- | -------- | ---------------------------------------- | ------------------ |
| `hashPassword`   | 哈希密码 | `password`: string                       | Promise\<string\>  |
| `verifyPassword` | 验证密码 | `password`: string, `storedHash`: string | Promise\<boolean\> |

**哈希格式**：`base64(salt):base64(hash)`

**安全参数**（定义在 `constants.ts`）：

- 迭代次数：100,000（`PASSWORD_HASH_ITERATIONS`）
- 输出长度：256 位（`PASSWORD_HASH_LENGTH`）
- 哈希算法：SHA-256
- 盐长度：128 位（16 字节）

#### 1.3 文件夹权限 (`functions/utils/folder-auth.ts`)

**功能**：实现文件夹级密码保护的核心逻辑，包括密码继承机制和文件夹加密管理。

**核心函数**：

| 函数                          | 说明                             | 参数                                                                | 返回值                                          |
| ----------------------------- | -------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------- |
| `checkFolderProtection`       | 检查路径是否受保护（向上遍历）   | `env`: Env, `targetPath`: string                                    | { protected, protectedPath, hash }              |
| `verifyFolderPassword`        | 验证文件夹密码（含 IP 封禁检查） | `env`: Env, `path`: string, `password`: string, `request`?: Request | { verified, protectedPath, blocked?, message? } |
| `checkPathAccess`             | 检查请求是否有权限访问路径       | `env`: Env, `request`: Request, `targetPath`: string                | { allowed, protectedPath, error? }              |
| `isPathAllowed`               | 判断路径前缀是否允许访问         | `pathPrefix`: string \| null, `targetPath`: string                  | boolean                                         |
| `checkFolderNoEncrypt`        | 检查文件夹是否禁用加密           | `env`: Env, `folderPath`: string                                    | Promise\<boolean\>                              |
| `setFolderNoEncrypt`          | 设置文件夹禁用加密               | `env`: Env, `folderPath`: string                                    | Promise\<void\>                                 |
| `removeFolderNoEncrypt`       | 移除文件夹禁用加密设置           | `env`: Env, `folderPath`: string                                    | Promise\<void\>                                 |
| `getFolderTokenVersion`       | 获取文件夹 Token 版本            | `env`: Env, `folderPath`: string                                    | Promise\<number\>                               |
| `incrementFolderTokenVersion` | 递增文件夹 Token 版本            | `env`: Env, `folderPath`: string                                    | Promise\<number\>                               |

**密码继承机制**：

- 访问文件/文件夹时，从当前路径向上遍历检查是否有密码保护
- 子文件夹自动继承父文件夹的保护
- 根目录可设置密码，保护所有文件和子文件夹

#### 1.4 R2 操作封装 (`functions/utils/r2.ts`)

**功能**：封装 R2 存储的文件和文件夹操作，支持批量操作和事务回滚。

**核心函数**：

| 函数                 | 说明               | 参数                                             | 返回值              |
| -------------------- | ------------------ | ------------------------------------------------ | ------------------- |
| `renameOrMoveFolder` | 重命名文件夹       | `env`: Env, `oldPath`: string, `newPath`: string | Promise\<R2Result\> |
| `deleteFolder`       | 删除文件夹（批量） | `env`: Env, `path`: string                       | Promise\<R2Result\> |
| `renameOrMoveFile`   | 重命名/移动文件    | `env`: Env, `oldPath`: string, `newPath`: string | Promise\<R2Result\> |

**关键特性**：

- 批量删除限制：1000 个对象/批次
- 列表查询限制：1000 个对象/查询
- 重命名/移动失败时自动回滚（删除已复制的文件）
- 使用 cursor-based 分页处理大量文件

#### 1.5 分享链接逻辑 (`functions/utils/share.ts`)

**功能**：分享链接的创建、验证和一次性使用处理。

**核心函数**：

| 函数                            | 说明                   | 参数                                                                            | 返回值                                                |
| ------------------------------- | ---------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `createShareLink`               | 创建分享链接           | `env`: Env, `options`: CreateShareLinkOptions, `generateToken`, `hashPassword?` | { token, url }                                        |
| `validateShareLink`             | 验证分享链接           | `env`: Env, `token`: string                                                     | Promise\<ShareLinkData \| null\>                      |
| `validateShareLinkWithResponse` | 验证分享链接并返回响应 | `env`: Env, `token`: string                                                     | { linkData, headers } \| { response, linkData: null } |
| `markShareLinkUsed`             | 标记分享链接已使用     | `env`: Env, `token`: string, `linkData`: ShareLinkData                          | Promise\<void\>                                       |

**分享链接数据结构**（`types/shared.ts`）：

| 字段             | 类型            | 说明                           |
| ---------------- | --------------- | ------------------------------ |
| `type`           | 'view' \| 'raw' | 链接类型                       |
| `filename`       | string          | 文件路径                       |
| `expires`        | number          | 过期时间戳                     |
| `oneTime`        | boolean         | 是否一次性                     |
| `password`       | string \| null  | 密码哈希                       |
| `renderMarkdown` | boolean         | 是否渲染 Markdown（view 类型） |
| `allowIframe`    | boolean         | 是否允许 iframe 嵌入           |
| `contentType`    | string          | Content-Type（raw 类型）       |
| `corsOrigin`     | string          | CORS 策略（raw 类型）          |
| `createdAt`      | number          | 创建时间                       |
| `used`           | boolean         | 是否已使用                     |

#### 1.6 IP 封禁与重试限制 (`functions/utils/rate-limit.ts`)

**功能**：基于 IP 的密码重试限制和边缘封禁机制。

**封禁策略**：

| 失败次数 | 封禁时长 | 是否边缘封禁       |
| -------- | -------- | ------------------ |
| 3        | 5 分钟   | 否（仅应用层封禁） |
| 6        | 15 分钟  | 否（仅应用层封禁） |
| 9        | 30 分钟  | 否（仅应用层封禁） |
| 10+      | 永久封禁 | 是（同时边缘封禁） |

**核心函数**：

| 函数                    | 说明                               | 参数                                           | 返回值                                 |
| ----------------------- | ---------------------------------- | ---------------------------------------------- | -------------------------------------- |
| `checkIpBlocked`        | 检查 IP 是否被封禁                 | `env`: Env, `ipHash`: string                   | { blocked, message? }                  |
| `recordPasswordFailure` | 记录密码失败                       | `env`: Env, `ipHash`: string, `realIp`: string | { blocked, message?, shouldEdgeBlock } |
| `recordPasswordSuccess` | 记录密码成功（清除失败记录）       | `env`: Env, `ipHash`: string                   | Promise\<void\>                        |
| `addIpToBanList`        | 添加 IP 到 Cloudflare 边缘封禁列表 | `env`: Env, `ip`: string                       | { success, error? }                    |
| `getClientIp`           | 获取客户端真实 IP                  | `request`: Request                             | string                                 |
| `hashIp`                | 哈希 IP 地址（用于存储）           | `ip`: string                                   | Promise\<string\>                      |

**边缘封禁配置**：

- `ENABLE_EDGE_BLOCKING`: 是否启用边缘封禁（普通环境变量）
- `CLOUDFLARE_API_TOKEN`: Cloudflare API Token（Secret）
- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare 账户 ID（Secret）
- `CLOUDFLARE_BAN_LIST_ID`: 封禁列表 ID（Secret）

#### 1.7 管理员认证 (`functions/utils/admin.ts`)

**功能**：系统管理员密码验证和 Token 版本管理。

**核心函数**：

| 函数                    | 说明                            | 参数                                               | 返回值                           |
| ----------------------- | ------------------------------- | -------------------------------------------------- | -------------------------------- |
| `verifyAdminPassword`   | 验证管理员密码                  | `env`: Env, `password`: string, `request`: Request | { verified, blocked?, message? } |
| `verifyAdminToken`      | 验证管理员 JWT                  | `env`: Env, `request`: Request                     | Promise\<boolean\>               |
| `incrementTokenVersion` | 递增 Token 版本（使旧令牌失效） | `env`: Env                                         | Promise\<number\>                |
| `getTokenVersion`       | 获取管理员 Token 版本           | `env`: Env                                         | Promise\<number\>                |

#### 1.8 响应生成工具 (`functions/utils/response.ts`)

**功能**：统一生成标准化的 HTTP 响应。

**核心函数**：

| 函数          | 说明           | 参数                                | 返回值   |
| ------------- | -------------- | ----------------------------------- | -------- |
| `json`        | 返回 JSON 响应 | `data`: unknown, `status`: number   | Response |
| `success`     | 返回成功响应   | `data`: unknown                     | Response |
| `error`       | 返回错误响应   | `message`: string, `status`: number | Response |
| `notFound`    | 返回 404 响应  | `message`: string                   | Response |
| `forbidden`   | 返回 403 响应  | `message`: string                   | Response |
| `badRequest`  | 返回 400 响应  | `message`: string                   | Response |
| `serverError` | 返回 500 响应  | `message`: string                   | Response |
| `gone`        | 返回 410 响应  | `message`: string                   | Response |

#### 1.9 路径工具 (`functions/utils/path.ts`)

**功能**：路径规范化和安全性检查。

**核心函数**：

| 函数            | 说明                       | 参数                                               | 返回值  |
| --------------- | -------------------------- | -------------------------------------------------- | ------- |
| `sanitizePath`  | 安全规范化路径             | `path`: string                                     | string  |
| `normalizePath` | 规范化路径（合并连续斜杠） | `path`: string                                     | string  |
| `getParentPath` | 获取父路径                 | `path`: string                                     | string  |
| `joinPath`      | 拼接路径                   | `...parts`: string[]                               | string  |
| `basename`      | 获取文件名                 | `path`: string                                     | string  |
| `isPathAllowed` | 检查路径是否在允许范围内   | `pathPrefix`: string \| null, `targetPath`: string | boolean |

---

### 2. API 路由层

#### 2.1 文件管理 (`functions/api/files/[[path]].ts`)

**路由**：`GET /api/files`, `GET /api/files/*`, `PUT /api/files/*`, `DELETE /api/files/*`

**功能**：文件列表、读取、写入、删除、移动操作。

**请求处理**：

| 方法   | 路径                  | 处理函数                             | 说明                       |
| ------ | --------------------- | ------------------------------------ | -------------------------- |
| GET    | `/api/files?path=xxx` | `listFiles()`                        | 列出指定路径的文件和文件夹 |
| GET    | `/api/files/{path}`   | `readFile()`                         | 读取文件内容               |
| PUT    | `/api/files/{path}`   | `writeFile()` / `renameOrMoveFile()` | 写入文件或移动文件         |
| DELETE | `/api/files/{path}`   | `env.NOTEPAD_R2.delete()`            | 删除文件                   |

**权限检查**：

- 所有操作需通过 `checkPathAccess()` 验证文件夹密码
- 根目录写入操作需要管理员权限

#### 2.2 文件夹管理 (`functions/api/folder.ts`)

**路由**：`POST /api/folder`, `DELETE /api/folder`, `PUT /api/folder`

**功能**：创建、删除、重命名文件夹。

**请求参数**：

| 方法   | action | 说明                                       |
| ------ | ------ | ------------------------------------------ |
| POST   | -      | 创建文件夹（body: { path, name }）         |
| DELETE | -      | 删除文件夹（body: { path }）               |
| PUT    | rename | 重命名文件夹（body: { oldPath, newPath }） |

**权限检查**：

- 需要通过 `checkPathAccess()` 验证文件夹密码
- 根目录操作需要管理员权限
- 文件夹创建深度限制（`MAX_FOLDER_DEPTH`）

#### 2.3 文件夹密码管理 (`functions/api/folder/password.ts`)

**路由**：`POST /api/folder/password`, `DELETE /api/folder/password`

**功能**：设置、验证、移除、重置文件夹密码。

**POST 操作类型**：

| action  | 说明               | 权限要求                   |
| ------- | ------------------ | -------------------------- |
| (默认)  | 验证密码并获取 JWT | 无（需正确密码）           |
| `set`   | 设置文件夹密码     | 已验证当前路径或管理员权限 |
| `reset` | 重置文件夹密码     | 管理员密码                 |

**DELETE 操作**：移除文件夹密码（需验证旧密码）

#### 2.4 文件夹加密管理 (`functions/api/folder/no-encrypt.ts`)

**路由**：`POST /api/folder/no-encrypt`, `DELETE /api/folder/no-encrypt`

**功能**：禁用/启用文件夹加密。

**权限**：仅管理员可操作。

#### 2.5 分享链接创建 (`functions/api/share.ts`, `functions/api/raw.ts`)

**路由**：`POST /api/share`, `POST /api/raw`

**功能**：生成阅读视图分享链接和 Raw 直链。

**参数**：

| 字段             | 类型    | 必填 | 说明                       |
| ---------------- | ------- | ---- | -------------------------- |
| `filename`       | string  | 是   | 文件路径                   |
| `expiresInHours` | number  | 否   | 有效期（小时），0 表示永久 |
| `oneTime`        | boolean | 否   | 是否一次性阅读             |
| `password`       | string  | 否   | 访问密码                   |
| `renderMarkdown` | boolean | 否   | 是否渲染 Markdown（share） |
| `allowIframe`    | boolean | 否   | 是否允许 iframe（share）   |
| `contentType`    | string  | 否   | Content-Type（raw）        |
| `corsOrigin`     | string  | 否   | CORS 策略（raw）           |

**权限检查**：

- 需要通过 `checkPathAccess()` 验证文件夹密码

#### 2.6 分享链接访问 (`functions/view/[token].ts`, `functions/raw/[token].ts`)

**路由**：`GET /view/:token`, `GET /raw/:token`

**功能**：访问分享链接内容。

**流程**：

1. 验证 Token 有效性和过期时间
2. 检查是否需要密码验证
3. 验证通过后从 R2 获取文件内容
4. 一次性链接标记为已使用（删除 KV 记录）
5. 返回 HTML（view）或原始文本（raw）

**安全特性**：

- 默认禁止 iframe 嵌入（`X-Frame-Options: DENY`）
- 支持 CORS 配置（raw 链接）
- 支持 Range 请求（raw 链接）
- Raw 链接返回 `Content-Disposition` 响应头（支持中文文件名）

#### 2.7 配置管理 (`functions/api/config.ts`)

**路由**：`GET /api/config`, `PUT /api/config`

**功能**：读取和更新应用配置。

**配置项**：

| 键                 | 类型     | 说明               |
| ------------------ | -------- | ------------------ |
| `siteTitle`        | string   | 网站标题           |
| `theme`            | string   | 默认主题           |
| `customTheme`      | string   | 自定义主题 JSON    |
| `autoWrap`         | boolean  | 自动换行           |
| `autoSave`         | boolean  | 自动保存           |
| `saveExtensions`   | string[] | 自动保存扩展名列表 |
| `scale`            | number   | 界面缩放（50-200） |
| `defaultExtension` | string   | 默认扩展名         |
| `defaultEncoding`  | string   | 默认编码           |
| `fontFamily`       | string   | 默认字体           |
| `fontSize`         | number   | 默认字体大小       |

#### 2.8 管理员登录 (`functions/api/admin.ts`)

**路由**：`POST /api/admin`

**功能**：管理员密码验证并返回 JWT。

**参数**：

| 字段       | 类型   | 必填 | 说明       |
| ---------- | ------ | ---- | ---------- |
| `password` | string | 是   | 管理员密码 |

**响应**：

| 字段        | 类型   | 说明       |
| ----------- | ------ | ---------- |
| `token`     | string | 管理员 JWT |
| `expiresAt` | number | 过期时间戳 |

---

### 3. 前端状态管理

#### 3.1 认证 Store (`src/stores/auth.ts`)

**状态**：

| 字段            | 类型           | 说明             |
| --------------- | -------------- | ---------------- |
| `pathPrefix`    | string \| null | 当前授权路径前缀 |
| `verifiedPaths` | Set\<string\>  | 已验证的路径集合 |
| `isAdmin`       | boolean        | 是否管理员       |
| `adminToken`    | string \| null | 管理员 Token     |
| `error`         | string         | 错误信息         |

**方法**：

| 方法                   | 说明               |
| ---------------------- | ------------------ |
| `verifyFolderPassword` | 验证文件夹密码     |
| `setFolderPassword`    | 设置文件夹密码     |
| `removeFolderPassword` | 移除文件夹密码     |
| `modifyFolderPassword` | 修改文件夹密码     |
| `loginAsAdmin`         | 管理员登录         |
| `checkAdminAuth`       | 检查管理员认证状态 |
| `logout`               | 退出登录           |

#### 3.2 编辑器 Store (`src/stores/editor.ts`)

**状态**：

| 字段                | 类型    | 说明                   |
| ------------------- | ------- | ---------------------- |
| `content`           | string  | 编辑器内容             |
| `currentFile`       | string  | 当前文件路径           |
| `isModified`        | boolean | 是否已修改             |
| `isLocalFile`       | boolean | 是否本地文件           |
| `cursorLine`        | number  | 光标行号               |
| `cursorColumn`      | number  | 光标列号               |
| `isAutoWrap`        | boolean | 是否自动换行           |
| `isMarkdownPreview` | boolean | 是否 Markdown 预览模式 |
| `fontSize`          | number  | 字体大小               |
| `fontFamily`        | string  | 字体名称               |

**计算属性**：

| 属性        | 说明               |
| ----------- | ------------------ |
| `fileSize`  | 文件大小（格式化） |
| `lineCount` | 行数               |
| `canUndo`   | 是否可撤销         |
| `canRedo`   | 是否可重做         |

**方法**：

| 方法            | 说明                 |
| --------------- | -------------------- |
| `setContent`    | 设置内容（重置历史） |
| `updateContent` | 更新内容（保存历史） |
| `undo`          | 撤销                 |
| `redo`          | 重做                 |
| `newFile`       | 新建文件             |
| `goToLine`      | 跳转到指定行         |

#### 3.3 文件 Store (`src/stores/files.ts`)

**状态**：

| 字段               | 类型         | 说明                 |
| ------------------ | ------------ | -------------------- |
| `currentPath`      | string       | 当前路径             |
| `folders`          | FolderInfo[] | 文件夹列表           |
| `files`            | FileItem[]   | 文件列表             |
| `rootProtected`    | boolean      | 根目录是否受保护     |
| `currentProtected` | boolean      | 当前路径是否受保护   |
| `currentNoEncrypt` | boolean      | 当前路径是否禁用加密 |

**方法**：

| 方法                    | 说明               |
| ----------------------- | ------------------ |
| `listFiles`             | 列出指定路径的文件 |
| `readFile`              | 读取文件内容       |
| `writeFile`             | 写入文件           |
| `createFolder`          | 创建文件夹         |
| `deleteFolder`          | 删除文件夹         |
| `renameFolder`          | 重命名文件夹       |
| `moveFile`              | 移动文件           |
| `setFolderNoEncrypt`    | 设置文件夹禁用加密 |
| `removeFolderNoEncrypt` | 移除文件夹禁用加密 |

---

### 4. 组合式函数

#### 4.1 文件操作 (`src/composables/useFileOperations.ts`)

**功能**：封装所有文件操作逻辑，包括新建、打开、保存、导入、下载等。

**核心方法**：

| 方法              | 说明                               |
| ----------------- | ---------------------------------- |
| `newFile`         | 新建文件（询问是否保存当前）       |
| `openFile`        | 打开文件对话框                     |
| `saveFile`        | 保存文件（无路径时弹出保存对话框） |
| `saveAs`          | 另存为                             |
| `importLocalFile` | 导入本地文件（自动编码检测）       |
| `download`        | 下载文件                           |
| `exit`            | 退出应用                           |
| `triggerAutoSave` | 触发自动保存（延迟 3 秒）          |

**自动保存机制**：

- 配置中开启自动保存后生效
- 内容变化后延迟 3 秒自动保存
- 本地文件不触发自动保存

#### 4.2 编辑器命令 (`src/composables/useEditorCommands.ts`)

**功能**：封装编辑器命令，如撤销、复制、查找替换等。

**核心方法**：

| 方法             | 说明               |
| ---------------- | ------------------ |
| `undo`           | 撤销               |
| `redo`           | 重做               |
| `cut`            | 剪切               |
| `copy`           | 复制               |
| `paste`          | 粘贴               |
| `find`           | 查找               |
| `replace`        | 替换               |
| `goTo`           | 跳转行号           |
| `insertDateTime` | 插入时间日期       |
| `toggleAutoWrap` | 切换自动换行       |
| `toggleMarkdown` | 切换 Markdown 预览 |

#### 4.3 键盘快捷键 (`src/composables/useKeyboardShortcuts.ts`)

**功能**：绑定全局键盘快捷键。

**快捷键映射**：

| 快捷键       | 操作         |
| ------------ | ------------ |
| Ctrl+N       | 新建         |
| Ctrl+O       | 打开         |
| Ctrl+S       | 保存         |
| Ctrl+Z       | 撤销         |
| Ctrl+Shift+Z | 重做         |
| Ctrl+X       | 剪切         |
| Ctrl+C       | 复制         |
| Ctrl+V       | 粘贴         |
| Ctrl+A       | 全选         |
| Ctrl+F       | 查找         |
| Ctrl+H       | 替换         |
| Ctrl+G       | 跳转行号     |
| F5           | 插入时间日期 |
| Delete       | 删除选区     |

**智能过滤**：输入框、文本域、可编辑元素聚焦时，文本编辑类快捷键（剪切、复制、粘贴、全选、删除）不被拦截，让浏览器默认处理。

---

### 5. API 封装

#### 5.1 前端 API 工具 (`src/utils/api.ts`)

**功能**：封装 HTTP 请求，自动携带认证 Token。

**核心函数**：

| 函数        | 说明        | 参数                                                |
| ----------- | ----------- | --------------------------------------------------- |
| `apiGet`    | GET 请求    | `url`: string, `useAdmin`?: boolean                 |
| `apiPost`   | POST 请求   | `url`: string, `data`: object, `useAdmin`?: boolean |
| `apiPut`    | PUT 请求    | `url`: string, `data`: object, `useAdmin`?: boolean |
| `apiDelete` | DELETE 请求 | `url`: string, `data`: object                       |

**认证机制**：

- 文件夹权限 Token：`localStorage.getItem('auth_token')`
- 管理员 Token：`localStorage.getItem('admin_token')`
- 请求头：`Authorization: Bearer <token>`

**错误处理**：

- 401 响应且包含 `X-Protected-Path` 头 → 抛出 `FolderProtectedError`
- 403 响应 → 抛出 `ForbiddenError`
- 其他错误 → 抛出通用错误

---

## 数据库/存储设计

### R2 存储结构

使用键前缀模拟文件夹结构：

```
notes/
├── 2024/
│   ├── daily.md
│   └── weekly.md
└── todo.txt
```

**虚拟文件夹实现**：

- 创建文件夹时写入 `${folderPath}/` 路径（空内容，contentType 为 `application/x-directory`）
- 列表查询使用 `delimiter='/'` 参数获取文件夹前缀（`delimitedPrefixes`）
- 删除文件夹时删除该前缀下所有对象

### KV 键结构

| 前缀                          | 键格式                                | 值类型 | 说明               |
| ----------------------------- | ------------------------------------- | ------ | ------------------ |
| `config:`                     | `config:{key}`                        | string | 配置项             |
| `folder:password:`            | `folder:password:{path}`              | string | 文件夹密码哈希     |
| `folder:token_version:`       | `folder:token_version:{path}`         | number | 文件夹 Token 版本  |
| `folder:no_encrypt:`          | `folder:no_encrypt:{path}`            | string | 文件夹加密禁用标记 |
| `link:`                       | `link:{token}`                        | JSON   | 分享链接数据       |
| `folder:password:retry:`      | `folder:password:retry:{ipHash}`      | JSON   | IP 重试记录        |
| `folder:password:edge_block:` | `folder:password:edge_block:{ipHash}` | string | IP 边缘封禁标记    |
| `admin:`                      | `admin:token_version`                 | number | 管理员 Token 版本  |

---

## 配置与部署

### 环境变量

| 变量                     | 类型   | 必填 | 说明                               |
| ------------------------ | ------ | ---- | ---------------------------------- |
| `JWT_SECRET`             | Secret | 是   | JWT 签名密钥                       |
| `ADMIN_PASSWORD`         | Secret | 否   | 系统管理员密码                     |
| `ENABLE_EDGE_BLOCKING`   | Var    | 否   | 是否启用边缘封禁（'true'/'false'） |
| `CLOUDFLARE_API_TOKEN`   | Secret | 否   | Cloudflare API Token               |
| `CLOUDFLARE_ACCOUNT_ID`  | Secret | 否   | Cloudflare 账户 ID                 |
| `CLOUDFLARE_BAN_LIST_ID` | Secret | 否   | 封禁列表 ID                        |
| `MAX_FOLDER_DEPTH`       | Var    | 否   | 文件夹最大深度（默认 5）           |

### wrangler.jsonc 关键配置

```json
{
  "name": "notepad",
  "compatibility_date": "2026-06-12",
  "pages_build_output_dir": "./dist",
  "kv_namespaces": [{ "binding": "NOTEPAD_KV", "id": "...", "preview_id": "..." }],
  "r2_buckets": [{ "binding": "NOTEPAD_R2", "bucket_name": "notepad", "remote": true }],
  "vars": {
    "ENABLE_EDGE_BLOCKING": "false",
    "MAX_FOLDER_DEPTH": "5"
  }
}
```

### 部署命令

```bash
# 开发模式
npm run dev

# 构建
npm run build

# 预览
npm run preview

# 部署
npm run deploy

# 测试
npm test
npm run test:run
npm run test:coverage
```

---

## 测试结构

测试文件位于 `tests/` 目录，使用 Vitest 框架：

```
tests/
├── api/              # API 路由测试
│   ├── config.test.ts
│   ├── folder.test.ts
│   ├── raw.test.ts
│   ├── share.test.ts
│   ├── shares.test.ts
│   └── share-token.test.ts
├── routes/           # 分享链接路由测试
│   ├── view-token.test.ts
│   ├── view-token-auth.test.ts
│   └── raw-token.test.ts
└── utils/            # 工具函数测试
    ├── jwt.test.ts
    ├── password.test.ts
    ├── path.test.ts
    ├── r2.test.ts
    ├── share.test.ts
    ├── markdown.test.ts
    ├── response.test.ts
    ├── template.test.ts
    ├── token.test.ts
    ├── error.test.ts
    └── misc.test.ts
```

---

## 安全特性

### 已实现的安全措施

1. **密码哈希**：使用 PBKDF2-SHA256 算法，100,000 次迭代，128 位盐值
2. **JWT 认证**：无状态 Token 认证，有效期 24 小时
3. **路径遍历防护**：严格过滤 `../`、`..`、非法字符
4. **IP 封禁**：基于失败次数的渐进式封禁策略
5. **边缘封禁**：集成 Cloudflare API 实现边缘级 IP 封禁
6. **Token 版本管理**：密码变更后旧令牌自动失效
7. **安全响应头**：全局设置 CSP、X-Frame-Options、HSTS 等
8. **XSS 防护**：Markdown 预览使用 DOMPurify 清洗
9. **iframe 安全**：分享链接默认禁止 iframe 嵌入
10. **CORS 控制**：Raw 链接支持自定义 CORS 策略
11. **文件名验证**：遵循 Windows 文件名命名规范（禁止特殊字符、保留名称）
12. **文件夹加密管理**：管理员可禁用特定文件夹的加密功能

### 安全最佳实践

- 文件夹密码存储在 KV 中，不与业务数据混合
- JWT Token 存储在 localStorage，便于跨页访问
- 管理员密码通过环境变量配置，不硬编码
- 分享链接安全：无效/过期 Token 返回 404 Not Found；需要密码的 view 链接返回 200 HTML 密码表单页面；密码验证失败时重定向回表单并附带 error 参数（不泄露链接是否存在）
- 分享链接 URL 中不包含文件名或路径信息
- 受保护文件夹的分享链接需要先验证文件夹密码才能查看详情

---

## 性能优化

### 已实现的优化

1. **批量操作限制**：R2 批量删除限制 1000 个对象
2. **分页查询**：使用 cursor-based 分页处理大量文件
3. **自动保存防抖**：3 秒延迟避免频繁请求
4. **代码分割**：通过 Vite 手动 chunk 配置，将 `jschardet`、`marked`、`dompurify`、`katex`、`mermaid` 分离为独立 chunk
5. **PWA 支持**：通过 `vite-plugin-pwa` 实现离线缓存和自动更新
6. **虚拟滚动**：文件/文件夹列表超过 200 项时自动启用

### 大文件处理

- 使用 ArrayBuffer 和 TextDecoder 处理编码检测（支持 GB2312、GBK 等编码）
- 文件超过 10MB 时给出警告并建议使用桌面编辑器

---

## 扩展建议

### 可添加的功能

1. **文件版本历史**：每次保存时创建版本快照
2. **搜索功能**：跨文件内容搜索
3. **协作编辑**：基于 WebSocket 的实时协作
4. **文件标签**：为文件添加标签和分类
5. **导入/导出**：支持导出为 ZIP 打包下载
6. **快捷键自定义**：允许用户自定义键盘快捷键
7. **代码高亮**：支持代码语法高亮
8. **文件预览**：图片、PDF 等文件的预览支持

### 架构改进建议

1. **缓存策略**：增加文件内容缓存，减少 R2 读取
2. **日志系统**：增加结构化日志和监控
3. **限流策略**：增加 API 级别的请求限流
4. **数据备份**：定期备份 R2 数据到外部存储
5. **国际化**：支持多语言界面
