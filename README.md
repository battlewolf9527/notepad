# 记事本 - Notepad

基于 Cloudflare Pages 的在线记事本应用，复刻 Windows 经典记事本界面。

## 文档

- [代码文档](CODE_WIKI.md) - 完整的 Code Wiki 文档，包含项目架构、模块职责、关键函数说明
- [部署指南](DEPLOY.md) - 详细的部署说明和故障排除指南

## 技术栈

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

## 核心功能

### 文件夹级密码保护

- **无全局登录**：改为文件夹级加密，按需保护敏感文件
- **密码继承**：子文件夹自动继承父文件夹的保护
- **根目录保护**：支持在根目录设置密码保护所有文件
- **验证机制**：JWT Token 验证，有效期 24 小时
- **密码版本管理**：密码变更后旧令牌自动失效
- **文件夹加密管理**：管理员可禁用特定文件夹的加密功能

### 文件操作

- 新建、打开、保存、另存为
- 支持文件夹浏览和管理（虚拟滚动支持）
- 导入本地文件（自动编码检测）
- 下载文件到本地（支持中文文件名）
- 自动保存（可选，内容变化后延迟 3 秒）

### 编辑功能

- 撤销、剪切、复制、粘贴、删除
- 查找、替换、转到指定行
- 全选、插入时间/日期

### 格式功能

- 自动换行切换
- 字体设置（字体、字形、大小）
- 深色/浅色主题切换
- 自定义主题支持

### Markdown 支持

- 实时 Markdown 预览
- GitHub 风格样式
- 支持任务列表、代码块、表格、数学公式（KaTeX）、图表（Mermaid）
- DOMPurify 安全清洗防止 XSS

### 分享链接

- **阅读视图分享**（支持密码保护、时效控制、iframe 配置）
- **Raw 直链**（支持 CORS 配置、自定义 Content-Type）
- **分享链接管理面板**（管理员可删除链接）
- **受保护文件夹分享**：需要先验证文件夹密码才能查看链接详情

### 管理员功能

- 系统管理员密码通过环境变量配置（`ADMIN_PASSWORD`）
- 管理员可重置任意文件夹密码
- 管理员可管理所有分享链接（普通用户无删除权限）
- 根目录操作（保存文件、创建文件夹、设置密码）需要管理员权限
- 管理员可禁用特定文件夹的加密功能

### 安全特性

- IP 封禁：基于失败次数的渐进式封禁策略（3次→5分钟，6次→15分钟，9次→30分钟，10次→永久封禁）
- 边缘封禁：集成 Cloudflare API 实现边缘级 IP 封禁（可选）
- 路径遍历防护：严格过滤 `../`、`..`、非法字符
- 文件名验证：遵循 Windows 文件名命名规范

## 部署指南

### 1. 准备工作

确保已安装 Node.js（^20.19.0 或 >=22.12.0）和 Wrangler CLI。

```bash
npm install -g wrangler
```

### 2. 创建 Cloudflare 资源

```bash
# 创建 KV Namespace
wrangler kv:namespace create NOTEPAD_KV

# 创建 R2 Bucket
wrangler r2 bucket create notepad
```

### 3. 配置 JWT 密钥

```bash
# 本地开发：在 .dev.vars 文件中设置
echo "JWT_SECRET=your-secret-key-here" > .dev.vars

# 生产环境：通过 Wrangler 设置密钥
wrangler secret put JWT_SECRET
```

推荐使用 32 位以上的随机字符串作为密钥。

### 4. 本地开发

```bash
npm install
npm run dev
```

### 5. 部署到 Cloudflare Pages

```bash
npm run deploy
```

## 文件夹密码管理

### 设置文件夹密码

在文件对话框中右键点击文件夹，选择"设置密码"，输入密码后点击确认。

### 移除文件夹密码

在文件对话框中右键点击已加密的文件夹，选择"移除密码"，输入正确密码后点击确认。

### 修改文件夹密码

在文件对话框中右键点击已加密的文件夹，选择"修改密码"，输入旧密码和新密码后点击确认。

### 密码遗忘处理

如果忘记文件夹密码，管理员可以通过以下方式重置：

```bash
# 删除指定路径的密码键
wrangler kv:key delete "folder:password:{path}" --namespace-id=xxx

# 例如删除根目录密码：
wrangler kv:key delete "folder:password:" --namespace-id=xxx

# 例如删除 notes 文件夹密码：
wrangler kv:key delete "folder:password:notes" --namespace-id=xxx
```

### 禁用文件夹加密

管理员可以禁用特定文件夹的加密功能：

1. 右键点击文件夹
2. 选择"禁用加密"

禁用加密后，该文件夹不会显示密码保护选项。
禁用加密只对指定目录有效，不向下继承至子文件夹。

## 项目结构

```
notepad/
├── functions/               # Pages Functions 后端
│   ├── _middleware.ts       # 全局中间件（安全响应头）
│   ├── types/               # 类型定义
│   │   ├── env.ts           # 环境变量类型
│   │   └── r2-extensions.d.ts # R2 扩展类型
│   ├── utils/               # 后端工具模块
│   │   ├── admin.ts         # 管理员认证
│   │   ├── api.ts           # API 通用处理
│   │   ├── constants.ts     # 常量定义
│   │   ├── error.ts         # 错误处理与日志
│   │   ├── folder-auth.ts   # 文件夹权限检查核心逻辑
│   │   ├── jwt.ts           # JWT 生成与验证
│   │   ├── password.ts      # PBKDF2-SHA256 密码哈希
│   │   ├── path.ts          # 路径规范化工具
│   │   ├── r2.ts            # R2 存储操作封装
│   │   ├── rate-limit.ts    # IP 封禁与重试限制
│   │   ├── response.ts      # 响应生成工具
│   │   ├── share.ts         # 分享链接逻辑
│   │   ├── share-page.ts    # 分享页面生成
│   │   ├── template.ts      # HTML 模板渲染
│   │   ├── theme.ts         # 主题样式生成
│   │   └── token.ts         # 随机 Token 生成
│   ├── api/
│   │   ├── config.ts        # 配置管理
│   │   ├── admin.ts         # 管理员登录
│   │   ├── files/[[path]].ts # 文件 CRUD
│   │   ├── folder.ts        # 文件夹操作
│   │   ├── folder/password.ts # 文件夹密码管理
│   │   ├── folder/no-encrypt.ts # 文件夹加密禁用
│   │   ├── share.ts         # 生成分享链接
│   │   ├── raw.ts           # 生成 Raw 链接
│   │   ├── shares.ts        # 列出分享链接
│   │   ├── share/[token].ts # 删除分享链接
│   │   └── shares/verify.ts # 验证分享链接密码
│   ├── view/[token].ts      # 阅读视图页面
│   ├── view/[token]/auth.ts # 分享链接密码验证
│   └── raw/[token].ts       # Raw 直链
├── src/                     # Vue 3 前端
│   ├── components/
│   │   ├── MenuBar.vue      # 菜单栏
│   │   ├── TextEditor.vue   # 文本编辑器（contenteditable div，支持选中状态保持）
│   │   ├── StatusBar.vue    # 状态栏
│   │   ├── EditorWrapper.vue # 编辑器包装器（含Markdown切换）
│   │   ├── FileDialog.vue   # 文件对话框
│   │   ├── FileDialogPassword.vue # 文件对话框密码输入
│   │   ├── FileDialogContextMenu.vue # 文件对话框右键菜单
│   │   ├── SettingsDialog.vue # 设置对话框
│   │   ├── FontDialog.vue   # 字体设置对话框
│   │   ├── CustomThemeDialog.vue # 自定义主题对话框
│   │   ├── FindReplace.vue  # 查找替换对话框
│   │   ├── ShareDialog.vue  # 分享链接对话框
│   │   ├── RawDialog.vue    # Raw 链接对话框
│   │   ├── ShareManager.vue # 分享链接管理面板
│   │   ├── MarkdownPreview.vue # Markdown 预览组件
│   │   ├── AdminLoginDialog.vue # 管理员登录对话框
│   │   ├── AdminBadge.vue   # 管理员状态徽章
│   │   ├── ZoomControl.vue  # 缩放控制
│   │   ├── ConfirmDialog.vue # 确认对话框
│   │   ├── PromptDialog.vue # 提示对话框
│   │   ├── ToastNotification.vue # Toast 通知
│   │   ├── ErrorRetry.vue   # 错误重试组件
│   │   └── AboutDialog.vue  # 关于对话框
│   ├── composables/
│   │   ├── useFileOperations.ts # 文件操作逻辑
│   │   ├── useEditorCommands.ts # 编辑器命令
│   │   ├── useKeyboardShortcuts.ts # 键盘快捷键
│   │   ├── useAppDialogs.ts # 对话框管理
│   │   ├── useDraggable.ts  # 拖拽功能
│   │   └── useModalClose.ts # 模态框关闭
│   ├── stores/
│   │   ├── auth.ts          # 认证状态
│   │   ├── editor.ts        # 编辑器状态
│   │   ├── files.ts         # 文件列表状态
│   │   ├── config.ts        # 配置状态
│   │   ├── share.ts         # 分享链接状态
│   │   ├── toast.ts         # Toast 通知状态
│   │   └── confirm.ts       # 确认对话框状态
│   ├── utils/
│   │   ├── api.ts           # API 请求封装
│   │   ├── path.ts          # 路径工具
│   │   ├── share.ts         # 分享链接工具
│   │   ├── constants.ts     # 常量定义
│   │   ├── shortcuts.ts     # 快捷键定义
│   │   ├── error.ts         # 错误处理
│   │   ├── markdown-renderer.ts # Markdown 渲染器
│   │   └── theme-styles.ts  # 主题样式生成
│   ├── types/index.ts       # TypeScript 类型定义
│   ├── styles/notepad.css   # 全局样式
│   ├── App.vue              # 主应用组件
│   └── main.ts              # 入口文件
├── types/shared.ts          # 前后端共享类型
├── tests/                   # 测试文件
├── public/                  # 静态资源
├── wrangler.jsonc.example   # Pages 配置示例
├── package.json             # 项目配置
└── README.md                # 项目说明
```

## 快捷键

| 快捷键       | 功能          |
| ------------ | ------------- |
| Ctrl+N       | 新建          |
| Ctrl+O       | 打开          |
| Ctrl+S       | 保存          |
| Ctrl+Z       | 撤销          |
| Ctrl+Shift+Z | 重做          |
| Ctrl+X       | 剪切          |
| Ctrl+C       | 复制          |
| Ctrl+V       | 粘贴          |
| Ctrl+A       | 全选          |
| Ctrl+F       | 查找          |
| Ctrl+H       | 替换          |
| Ctrl+G       | 转到          |
| F5           | 插入时间/日期 |
| Delete       | 删除选区      |

## API 路由

| 路由                     | 方法            | 说明                |
| ------------------------ | --------------- | ------------------- |
| `/api/config`            | GET/PUT         | 读取/更新配置       |
| `/api/files`             | GET             | 列出文件/文件夹     |
| `/api/files/*`           | GET/PUT/DELETE  | 文件读写删          |
| `/api/folder`            | POST/DELETE/PUT | 文件夹操作          |
| `/api/folder/password`   | POST/DELETE     | 设置/验证/移除密码  |
| `/api/folder/no-encrypt` | POST/DELETE     | 禁用/启用文件夹加密 |
| `/api/admin`             | POST            | 管理员登录          |
| `/api/share`             | POST            | 生成阅读视图链接    |
| `/api/raw`               | POST            | 生成 Raw 链接       |
| `/api/shares`            | GET             | 列出所有分享链接    |
| `/api/shares/verify`     | POST            | 验证分享链接密码    |
| `/api/share/:token`      | DELETE          | 删除分享链接        |
| `/view/:token`           | GET             | 阅读视图页面        |
| `/view/:token/auth`      | POST            | 分享链接密码验证    |
| `/raw/:token`            | GET             | Raw 直链            |

## 环境变量

| 变量                     | 类型   | 必填 | 说明                     |
| ------------------------ | ------ | ---- | ------------------------ |
| `JWT_SECRET`             | Secret | 是   | JWT 签名密钥             |
| `ADMIN_PASSWORD`         | Secret | 否   | 系统管理员密码           |
| `ENABLE_EDGE_BLOCKING`   | Var    | 否   | 是否启用边缘封禁         |
| `CLOUDFLARE_API_TOKEN`   | Secret | 否   | Cloudflare API Token     |
| `CLOUDFLARE_ACCOUNT_ID`  | Secret | 否   | Cloudflare 账户 ID       |
| `CLOUDFLARE_BAN_LIST_ID` | Secret | 否   | 封禁列表 ID              |
| `MAX_FOLDER_DEPTH`       | Var    | 否   | 文件夹最大深度（默认 5） |

## 安全说明

- 文件夹操作 API 需要 JWT Token 验证（含 `pathPrefix`）
- 密码使用 Web Crypto PBKDF2-SHA256 哈希存储（100,000 次迭代，128 位盐值）
- 分享 Token 使用加密安全的随机数生成器
- 防止路径遍历攻击
- Markdown 预览使用 DOMPurify 清洗 HTML
- iframe 嵌入默认禁止
- IP 封禁策略：3次失败→5分钟，6次失败→15分钟，9次失败→30分钟，10次失败→永久封禁

## 许可证

MIT
