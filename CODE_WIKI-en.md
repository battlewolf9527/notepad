# Notepad Code Wiki

## Project Overview

An online notepad application built on Cloudflare Pages, completely replicating the classic Windows Notepad interface with support for folder-level password protection, share links, Markdown preview, and more.

### Tech Stack

| Layer              | Technology                     | Version       |
| ------------------ | ------------------------------ | ------------- |
| Frontend Framework | Vue 3                          | ^3.5.32       |
| State Management   | Pinia                          | ^3.0.4        |
| Build Tool         | Vite                           | ^8.0.8        |
| Backend Runtime    | Cloudflare Pages Functions     | -             |
| Storage            | Cloudflare R2 / KV             | -             |
| Password Hashing   | Web Crypto API (PBKDF2-SHA256) | -             |
| JWT                | jose                           | ^6.2.3        |
| Markdown Rendering | markdown-it                    | ^14.3.0       |
| Encoding Detection | jschardet                      | ^3.1.4        |
| Math Formulas      | KaTeX                          | ^0.17.0       |
| Diagram Support    | Mermaid                        | ^11.16.0      |
| Virtual Scrolling  | vue-virtual-scroller           | ^2.0.0-beta.8 |
| Keyboard Shortcuts | @vueuse/core                   | ^11.1.0       |

---

## Project Structure

```
notepad/
├── functions/                    # Cloudflare Pages Functions Backend
│   ├── _middleware.ts            # Global security response headers middleware
│   ├── types/                    # Backend type definitions
│   │   ├── env.ts                # Environment variable types
│   │   └── r2-extensions.d.ts    # R2 extension types
│   ├── utils/                    # Backend utility modules
│   │   ├── admin.ts              # Admin authentication
│   │   ├── api.ts                # API common handling (parameter parsing, permission checks)
│   │   ├── constants.ts          # Constant definitions (KV key prefixes, hash parameters, etc.)
│   │   ├── error.ts              # Error handling and logging
│   │   ├── folder-auth.ts        # Folder permission checking core logic
│   │   ├── jwt.ts                # JWT generation and verification
│   │   ├── password.ts           # PBKDF2 password hashing
│   │   ├── path.ts               # Path normalization utilities
│   │   ├── r2.ts                 # R2 storage operations wrapper
│   │   ├── rate-limit.ts         # IP blocking and retry limiting
│   │   ├── response.ts           # Response generation utilities
│   │   ├── share.ts              # Share link logic
│   │   ├── share-page.ts         # Share page HTML generation
│   │   ├── template.ts           # HTML template rendering
│   │   ├── theme.ts              # Theme style generation
│   │   └── token.ts              # Random Token generation
│   ├── api/                      # API routes
│   │   ├── config.ts             # Config read/write
│   │   ├── admin.ts              # Admin login
│   │   ├── files/[[path]].ts     # File CRUD (list, read, write, delete, move)
│   │   ├── folder.ts             # Folder operations (create, delete, rename)
│   │   ├── folder/password.ts    # Folder password management (verify, set, remove, reset)
│   │   ├── folder/no-encrypt.ts  # Folder encryption disable/enable
│   │   ├── share.ts              # Generate view share links
│   │   ├── raw.ts                # Generate raw links
│   │   ├── shares.ts             # List share links
│   │   ├── share/[token].ts      # Delete share link
│   │   └── shares/verify.ts      # Verify share link password
│   ├── view/[token].ts           # View page (HTML)
│   ├── view/[token]/auth.ts      # Share link password verification
│   └── raw/[token].ts            # Raw direct link (plain text)
├── src/                          # Vue 3 Frontend
│   ├── components/               # Components
│   │   ├── MenuBar.vue           # Menu bar (File, Edit, Format, View, Help)
│   │   ├── TextEditor.vue        # Text editor (contenteditable div, persistent selection, rich text filtering)
│   │   ├── StatusBar.vue         # Status bar (line number, column, file size, encoding)
│   │   ├── EditorWrapper.vue     # Editor wrapper (with Markdown toggle)
│   │   ├── FileDialog.vue        # File dialog (browse, select, new folder)
│   │   ├── FileDialogPassword.vue # File dialog password input popup
│   │   ├── FileDialogContextMenu.vue # File dialog context menu
│   │   ├── SettingsDialog.vue    # Settings dialog (theme, font, auto-save, etc.)
│   │   ├── FontDialog.vue        # Font settings dialog
│   │   ├── CustomThemeDialog.vue # Custom theme dialog
│   │   ├── FindReplace.vue       # Find replace dialog
│   │   ├── ShareDialog.vue       # Share link generation dialog
│   │   ├── RawDialog.vue         # Raw link generation dialog
│   │   ├── ShareManager.vue      # Share link management panel
│   │   ├── MarkdownPreview.vue   # Markdown preview component (with KaTeX, Mermaid)
│   │   ├── AdminLoginDialog.vue  # Admin login dialog
│   │   ├── AdminBadge.vue        # Admin status badge (⚡ icon)
│   │   ├── ZoomControl.vue       # Zoom control (50% - 200%)
│   │   ├── ConfirmDialog.vue     # Confirm dialog
│   │   ├── PromptDialog.vue      # Prompt dialog (input type)
│   │   ├── ToastNotification.vue # Toast notification component
│   │   ├── ErrorRetry.vue        # Error retry component
│   │   └── AboutDialog.vue       # About dialog
│   ├── composables/              # Composables
│   │   ├── useFileOperations.ts  # File operations logic (new, open, save, import, download)
│   │   ├── useEditorCommands.ts  # Editor commands (undo, copy, find replace, etc.)
│   │   ├── useKeyboardShortcuts.ts # Keyboard shortcut bindings
│   │   ├── useAppDialogs.ts      # Dialog management (unified open/close)
│   │   ├── useDraggable.ts       # Drag functionality (dialog dragging)
│   │   └── useModalClose.ts      # Modal close (click outside to close)
│   ├── stores/                   # Pinia stores
│   │   ├── auth.ts               # Authentication state (folder password, admin)
│   │   ├── editor.ts             # Editor state (content, cursor, format, etc.)
│   │   ├── files.ts              # File list state (current path, file/folder lists)
│   │   ├── config.ts             # Configuration state (theme, font, auto-save, etc.)
│   │   ├── share.ts              # Share link state (generate, manage)
│   │   ├── toast.ts              # Toast notification state
│   │   └── confirm.ts            # Confirm dialog state
│   ├── utils/                    # Frontend utilities
│   │   ├── api.ts                # API request wrapper (auto token attachment)
│   │   ├── path.ts               # Path utilities (normalize, join)
│   │   ├── share.ts              # Share link utilities (generate, verify)
│   │   ├── constants.ts          # Constant definitions (shortcuts, themes, etc.)
│   │   ├── shortcuts.ts          # Shortcut definitions and mappings
│   │   ├── error.ts              # Error handling (custom error classes)
│   │   ├── markdown-renderer.ts  # Markdown renderer (markdown-it configuration)
│   │   └── theme-styles.ts       # Theme style generation (dynamic CSS)
│   ├── types/index.ts            # Frontend type definitions
│   ├── types/markdown-it-task-lists.d.ts # Task lists plugin types
│   ├── styles/notepad.css        # Global styles (Windows Notepad style)
│   ├── App.vue                   # Root component
│   └── main.ts                   # Entry file
├── types/shared.ts               # Shared types between frontend and backend (FileInfo, FolderInfo, ShareLinkData, etc.)
├── tests/                        # Test files (Vitest)
├── public/                       # Static resources (icons, favicon)
├── wrangler.jsonc.example        # Cloudflare configuration example
└── package.json                  # Project configuration
```

---

## Core Architecture

### Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Vue 3 + Vite)                   │
│  ┌─────────┐  ┌──────────────┐  ┌─────────────────────────┐ │
│  │ View    │  │  Composables  │  │        Stores          │ │
│  │ Layer   │  │              │  │ auth/editor/files/...  │ │
│  └────┬────┘  └──────┬───────┘  └──────────┬──────────────┘ │
│       │              │                      │                │
│       └──────────────┼──────────────────────┘                │
│                      ▼                                       │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    API Wrapper (src/utils/api.ts)       │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────┬──────────────────────────────┘
                               ▼ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│              Cloudflare Pages Functions                      │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              _middleware.ts (security headers)          │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    API Route Layer                       │ │
│  │  api/config.ts  api/files/[[path]].ts  api/share.ts     │ │
│  │  view/[token].ts  raw/[token].ts                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    Utility Layer                         │ │
│  │  folder-auth.ts  jwt.ts  password.ts  share.ts  r2.ts   │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Storage Layer                  │
│  ┌─────────────────────────┐  ┌─────────────────────────┐   │
│  │         R2 Bucket       │  │          KV             │   │
│  │   NOTEPAD_R2 (files)    │  │   NOTEPAD_KV (metadata) │   │
│  └─────────────────────────┘  └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

**File Operation Flow**:

1. User action → `useFileOperations.ts` → `filesStore` → `api.ts` → `api/files/[[path]].ts` → R2

**Authentication Flow**:

1. User enters password → `authStore.verifyFolderPassword()` → `/api/folder/password` → `folder-auth.ts` → KV → returns JWT
2. Subsequent requests carry `Authorization: Bearer <token>` → `checkPathAccess()` verifies permission

**Share Link Flow**:

1. User creates link → `/api/share` → `share.ts` → KV stores link info
2. Access share link → `/view/:token` → `share.ts` verifies → R2 fetches content → renders HTML

---

## Key Module Details

### 1. Backend Utility Modules

#### 1.1 JWT Management (`functions/utils/jwt.ts`)

**Function**: Generate and verify JWT tokens using the `jose` library.

**Core Functions**:

| Function    | Description      | Parameters                                                   | Return                     |
| ----------- | ---------------- | ------------------------------------------------------------ | -------------------------- |
| `createJwt` | Create JWT token | `payload`: JwtPayload, `secret`: string, `expiresIn`: number | Promise\<string\>          |
| `verifyJwt` | Verify JWT token | `token`: string, `secret`: string                            | Promise\<JwtVerifyResult\> |

**JwtPayload Structure**:

| Field          | Type                 | Description                                                         |
| -------------- | -------------------- | ------------------------------------------------------------------- |
| `userId`       | string               | User identifier                                                     |
| `pathPrefix`   | string \| undefined  | Authorized path prefix                                              |
| `admin`        | boolean \| undefined | Is admin                                                            |
| `tokenVersion` | number \| undefined  | Token version (used to invalidate old tokens after password change) |

#### 1.2 Password Hashing (`functions/utils/password.ts`)

**Function**: Password hashing and verification using Web Crypto API's PBKDF2-SHA256 algorithm.

**Core Functions**:

| Function         | Description     | Parameters                               | Return             |
| ---------------- | --------------- | ---------------------------------------- | ------------------ |
| `hashPassword`   | Hash password   | `password`: string                       | Promise\<string\>  |
| `verifyPassword` | Verify password | `password`: string, `storedHash`: string | Promise\<boolean\> |

**Hash Format**: `base64(salt):base64(hash)`

**Security Parameters** (defined in `constants.ts`):

- Iterations: 100,000 (`PASSWORD_HASH_ITERATIONS`)
- Output length: 256 bits (`PASSWORD_HASH_LENGTH`)
- Hash algorithm: SHA-256
- Salt length: 128 bits (16 bytes)

#### 1.3 Folder Permission (`functions/utils/folder-auth.ts`)

**Function**: Core logic for folder-level password protection, including password inheritance mechanism and folder encryption management.

**Core Functions**:

| Function                      | Description                                         | Parameters                                                          | Return                                          |
| ----------------------------- | --------------------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------- |
| `checkFolderProtection`       | Check if path is protected (upward traversal)       | `env`: Env, `targetPath`: string                                    | { protected, protectedPath, hash }              |
| `verifyFolderPassword`        | Verify folder password (includes IP blocking check) | `env`: Env, `path`: string, `password`: string, `request`?: Request | { verified, protectedPath, blocked?, message? } |
| `checkPathAccess`             | Check if request has permission to access path      | `env`: Env, `request`: Request, `targetPath`: string                | { allowed, protectedPath, error? }              |
| `isPathAllowed`               | Check if path prefix allows access                  | `pathPrefix`: string \| null, `targetPath`: string                  | boolean                                         |
| `checkFolderNoEncrypt`        | Check if folder has encryption disabled             | `env`: Env, `folderPath`: string                                    | Promise\<boolean\>                              |
| `setFolderNoEncrypt`          | Set folder encryption disabled                      | `env`: Env, `folderPath`: string                                    | Promise\<void\>                                 |
| `removeFolderNoEncrypt`       | Remove folder encryption disabled setting           | `env`: Env, `folderPath`: string                                    | Promise\<void\>                                 |
| `getFolderTokenVersion`       | Get folder token version                            | `env`: Env, `folderPath`: string                                    | Promise\<number\>                               |
| `incrementFolderTokenVersion` | Increment folder token version                      | `env`: Env, `folderPath`: string                                    | Promise\<number\>                               |

**Password Inheritance Mechanism**:

- When accessing files/folders, traverse upward from the current path to check for password protection
- Subfolders automatically inherit parent folder protection
- Password can be set at root level to protect all files and subfolders

#### 1.4 R2 Operations Wrapper (`functions/utils/r2.ts`)

**Function**: Wrapper for R2 storage file and folder operations, supporting batch operations and transaction rollback.

**Core Functions**:

| Function             | Description           | Parameters                                       | Return              |
| -------------------- | --------------------- | ------------------------------------------------ | ------------------- |
| `renameOrMoveFolder` | Rename folder         | `env`: Env, `oldPath`: string, `newPath`: string | Promise\<R2Result\> |
| `deleteFolder`       | Delete folder (batch) | `env`: Env, `path`: string                       | Promise\<R2Result\> |
| `renameOrMoveFile`   | Rename/move file      | `env`: Env, `oldPath`: string, `newPath`: string | Promise\<R2Result\> |

**Key Features**:

- Batch delete limit: 1000 objects/batch
- List query limit: 1000 objects/query
- Auto rollback on rename/move failure (delete copied files)
- Cursor-based pagination for handling large file counts

#### 1.5 Share Link Logic (`functions/utils/share.ts`)

**Function**: Share link creation, verification, and one-time usage handling.

**Core Functions**:

| Function                        | Description                             | Parameters                                                                      | Return                                                |
| ------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `createShareLink`               | Create share link                       | `env`: Env, `options`: CreateShareLinkOptions, `generateToken`, `hashPassword?` | { token, url }                                        |
| `validateShareLink`             | Validate share link                     | `env`: Env, `token`: string                                                     | Promise\<ShareLinkData \| null\>                      |
| `validateShareLinkWithResponse` | Validate share link and return response | `env`: Env, `token`: string                                                     | { linkData, headers } \| { response, linkData: null } |
| `markShareLinkUsed`             | Mark share link as used                 | `env`: Env, `token`: string, `linkData`: ShareLinkData                          | Promise\<void\>                                       |

**Share Link Data Structure** (`types/shared.ts`):

| Field            | Type            | Description                 |
| ---------------- | --------------- | --------------------------- |
| `type`           | 'view' \| 'raw' | Link type                   |
| `filename`       | string          | File path                   |
| `expires`        | number          | Expiration timestamp        |
| `oneTime`        | boolean         | Is one-time                 |
| `password`       | string \| null  | Password hash               |
| `renderMarkdown` | boolean         | Render Markdown (view type) |
| `allowIframe`    | boolean         | Allow iframe embedding      |
| `contentType`    | string          | Content-Type (raw type)     |
| `corsOrigin`     | string          | CORS policy (raw type)      |
| `createdAt`      | number          | Creation time               |
| `used`           | boolean         | Has been used               |

#### 1.6 IP Blocking & Retry Limiting (`functions/utils/rate-limit.ts`)

**Function**: IP-based password retry limiting and edge blocking mechanism.

**Blocking Policy**:

| Failure Count | Block Duration | Edge Blocking                         |
| ------------- | -------------- | ------------------------------------- |
| 3             | 5 minutes      | No (application-layer only)           |
| 6             | 15 minutes     | No (application-layer only)           |
| 9             | 30 minutes     | No (application-layer only)           |
| 10+           | Permanent      | Yes (both edge and application-layer) |

**Core Functions**:

| Function                | Description                                     | Parameters                                     | Return                                 |
| ----------------------- | ----------------------------------------------- | ---------------------------------------------- | -------------------------------------- |
| `checkIpBlocked`        | Check if IP is blocked                          | `env`: Env, `ipHash`: string                   | { blocked, message? }                  |
| `recordPasswordFailure` | Record password failure                         | `env`: Env, `ipHash`: string, `realIp`: string | { blocked, message?, shouldEdgeBlock } |
| `recordPasswordSuccess` | Record password success (clear failure records) | `env`: Env, `ipHash`: string                   | Promise\<void\>                        |
| `addIpToBanList`        | Add IP to Cloudflare edge ban list              | `env`: Env, `ip`: string                       | { success, error? }                    |
| `getClientIp`           | Get client real IP                              | `request`: Request                             | string                                 |
| `hashIp`                | Hash IP address (for storage)                   | `ip`: string                                   | Promise\<string\>                      |

**Edge Blocking Configuration**:

- `ENABLE_EDGE_BLOCKING`: Enable edge blocking (regular env var)
- `CLOUDFLARE_API_TOKEN`: Cloudflare API Token (Secret)
- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare Account ID (Secret)
- `CLOUDFLARE_BAN_LIST_ID`: Ban list ID (Secret)

#### 1.7 Admin Authentication (`functions/utils/admin.ts`)

**Function**: System admin password verification and token version management.

**Core Functions**:

| Function                | Description                                     | Parameters                                         | Return                           |
| ----------------------- | ----------------------------------------------- | -------------------------------------------------- | -------------------------------- |
| `verifyAdminPassword`   | Verify admin password                           | `env`: Env, `password`: string, `request`: Request | { verified, blocked?, message? } |
| `verifyAdminToken`      | Verify admin JWT                                | `env`: Env, `request`: Request                     | Promise\<boolean\>               |
| `incrementTokenVersion` | Increment token version (invalidate old tokens) | `env`: Env                                         | Promise\<number\>                |
| `getTokenVersion`       | Get admin token version                         | `env`: Env                                         | Promise\<number\>                |

#### 1.8 Response Generation Utilities (`functions/utils/response.ts`)

**Function**: Generate standardized HTTP responses.

**Core Functions**:

| Function      | Description             | Parameters                          | Return   |
| ------------- | ----------------------- | ----------------------------------- | -------- |
| `json`        | Return JSON response    | `data`: unknown, `status`: number   | Response |
| `success`     | Return success response | `data`: unknown                     | Response |
| `error`       | Return error response   | `message`: string, `status`: number | Response |
| `notFound`    | Return 404 response     | `message`: string                   | Response |
| `forbidden`   | Return 403 response     | `message`: string                   | Response |
| `badRequest`  | Return 400 response     | `message`: string                   | Response |
| `serverError` | Return 500 response     | `message`: string                   | Response |
| `gone`        | Return 410 response     | `message`: string                   | Response |

#### 1.9 Path Utilities (`functions/utils/path.ts`)

**Function**: Path normalization and security checking.

**Core Functions**:

| Function        | Description                                | Parameters                                         | Return  |
| --------------- | ------------------------------------------ | -------------------------------------------------- | ------- |
| `sanitizePath`  | Securely normalize path                    | `path`: string                                     | string  |
| `normalizePath` | Normalize path (merge consecutive slashes) | `path`: string                                     | string  |
| `getParentPath` | Get parent path                            | `path`: string                                     | string  |
| `joinPath`      | Join paths                                 | `...parts`: string[]                               | string  |
| `basename`      | Get filename                               | `path`: string                                     | string  |
| `isPathAllowed` | Check if path is within allowed range      | `pathPrefix`: string \| null, `targetPath`: string | boolean |

---

### 2. API Route Layer

#### 2.1 File Management (`functions/api/files/[[path]].ts`)

**Routes**: `GET /api/files`, `GET /api/files/*`, `PUT /api/files/*`, `DELETE /api/files/*`

**Function**: File list, read, write, delete, move operations.

**Request Handling**:

| Method | Path                  | Handler                              | Description                              |
| ------ | --------------------- | ------------------------------------ | ---------------------------------------- |
| GET    | `/api/files?path=xxx` | `listFiles()`                        | List files and folders at specified path |
| GET    | `/api/files/{path}`   | `readFile()`                         | Read file content                        |
| PUT    | `/api/files/{path}`   | `writeFile()` / `renameOrMoveFile()` | Write file or move file                  |
| DELETE | `/api/files/{path}`   | `env.NOTEPAD_R2.delete()`            | Delete file                              |

**Permission Checks**:

- All operations require `checkPathAccess()` to verify folder password
- Root directory write operations require admin permission

#### 2.2 Folder Management (`functions/api/folder.ts`)

**Routes**: `POST /api/folder`, `DELETE /api/folder`, `PUT /api/folder`

**Function**: Create, delete, rename folders.

**Request Parameters**:

| Method | action | Description                                |
| ------ | ------ | ------------------------------------------ |
| POST   | -      | Create folder (body: { path, name })       |
| DELETE | -      | Delete folder (body: { path })             |
| PUT    | rename | Rename folder (body: { oldPath, newPath }) |

**Permission Checks**:

- Requires `checkPathAccess()` to verify folder password
- Root directory operations require admin permission
- Folder creation depth limit (`MAX_FOLDER_DEPTH`)

#### 2.3 Folder Password Management (`functions/api/folder/password.ts`)

**Routes**: `POST /api/folder/password`, `DELETE /api/folder/password`

**Function**: Set, verify, remove, reset folder passwords.

**POST Action Types**:

| action    | Description                 | Permission                       |
| --------- | --------------------------- | -------------------------------- |
| (default) | Verify password and get JWT | None (requires correct password) |
| `set`     | Set folder password         | Verified current path or admin   |
| `reset`   | Reset folder password       | Admin password                   |

**DELETE Operation**: Remove folder password (requires old password verification)

#### 2.4 Folder Encryption Management (`functions/api/folder/no-encrypt.ts`)

**Routes**: `POST /api/folder/no-encrypt`, `DELETE /api/folder/no-encrypt`

**Function**: Disable/enable folder encryption.

**Permission**: Admin only.

#### 2.5 Share Link Creation (`functions/api/share.ts`, `functions/api/raw.ts`)

**Routes**: `POST /api/share`, `POST /api/raw`

**Function**: Generate view share links and raw direct links.

**Parameters**:

| Field            | Type    | Required | Description                          |
| ---------------- | ------- | -------- | ------------------------------------ |
| `filename`       | string  | Yes      | File path                            |
| `expiresInHours` | number  | No       | Expiration in hours, 0 for permanent |
| `oneTime`        | boolean | No       | Is one-time                          |
| `password`       | string  | No       | Access password                      |
| `renderMarkdown` | boolean | No       | Render Markdown (share)              |
| `allowIframe`    | boolean | No       | Allow iframe (share)                 |
| `contentType`    | string  | No       | Content-Type (raw)                   |
| `corsOrigin`     | string  | No       | CORS policy (raw)                    |

**Permission Checks**:

- Requires `checkPathAccess()` to verify folder password

#### 2.6 Share Link Access (`functions/view/[token].ts`, `functions/raw/[token].ts`)

**Routes**: `GET /view/:token`, `GET /raw/:token`

**Function**: Access share link content.

**Flow**:

1. Verify token validity and expiration
2. Check if password verification is required
3. Fetch file content from R2 after verification
4. Mark one-time link as used (delete KV record)
5. Return HTML (view) or raw text (raw)

**Security Features**:

- iframe embedding disabled by default (`X-Frame-Options: DENY`)
- CORS configuration support (raw links)
- Range request support (raw links)
- Raw links return `Content-Disposition` header (supports Chinese filenames)

#### 2.7 Configuration Management (`functions/api/config.ts`)

**Routes**: `GET /api/config`, `PUT /api/config`

**Function**: Read and update application configuration.

**Configuration Items**:

| Key                | Type     | Description              |
| ------------------ | -------- | ------------------------ |
| `siteTitle`        | string   | Site title               |
| `theme`            | string   | Default theme            |
| `customTheme`      | string   | Custom theme JSON        |
| `autoWrap`         | boolean  | Word wrap                |
| `autoSave`         | boolean  | Auto save                |
| `saveExtensions`   | string[] | Auto save extension list |
| `scale`            | number   | UI scale (50-200)        |
| `defaultExtension` | string   | Default extension        |
| `defaultEncoding`  | string   | Default encoding         |
| `fontFamily`       | string   | Default font             |
| `fontSize`         | number   | Default font size        |

#### 2.8 Admin Login (`functions/api/admin.ts`)

**Route**: `POST /api/admin`

**Function**: Admin password verification and return JWT.

**Parameters**:

| Field      | Type   | Required | Description    |
| ---------- | ------ | -------- | -------------- |
| `password` | string | Yes      | Admin password |

**Response**:

| Field       | Type   | Description          |
| ----------- | ------ | -------------------- |
| `token`     | string | Admin JWT            |
| `expiresAt` | number | Expiration timestamp |

---

### 3. Frontend State Management

#### 3.1 Authentication Store (`src/stores/auth.ts`)

**State**:

| Field           | Type           | Description                    |
| --------------- | -------------- | ------------------------------ |
| `pathPrefix`    | string \| null | Current authorized path prefix |
| `verifiedPaths` | Set\<string\>  | Verified paths set             |
| `isAdmin`       | boolean        | Is admin                       |
| `adminToken`    | string \| null | Admin token                    |
| `error`         | string         | Error message                  |

**Methods**:

| Method                 | Description                       |
| ---------------------- | --------------------------------- |
| `verifyFolderPassword` | Verify folder password            |
| `setFolderPassword`    | Set folder password               |
| `removeFolderPassword` | Remove folder password            |
| `modifyFolderPassword` | Modify folder password            |
| `loginAsAdmin`         | Login as admin                    |
| `checkAdminAuth`       | Check admin authentication status |
| `logout`               | Logout                            |

#### 3.2 Editor Store (`src/stores/editor.ts`)

**State**:

| Field               | Type    | Description              |
| ------------------- | ------- | ------------------------ |
| `content`           | string  | Editor content           |
| `currentFile`       | string  | Current file path        |
| `isModified`        | boolean | Is modified              |
| `isLocalFile`       | boolean | Is local file            |
| `cursorLine`        | number  | Cursor line number       |
| `cursorColumn`      | number  | Cursor column            |
| `isAutoWrap`        | boolean | Is word wrap             |
| `isMarkdownPreview` | boolean | Is Markdown preview mode |
| `fontSize`          | number  | Font size                |
| `fontFamily`        | string  | Font name                |

**Computed Properties**:

| Property    | Description           |
| ----------- | --------------------- |
| `fileSize`  | File size (formatted) |
| `lineCount` | Line count            |
| `canUndo`   | Can undo              |
| `canRedo`   | Can redo              |

**Methods**:

| Method          | Description                   |
| --------------- | ----------------------------- |
| `setContent`    | Set content (reset history)   |
| `updateContent` | Update content (save history) |
| `undo`          | Undo                          |
| `redo`          | Redo                          |
| `newFile`       | New file                      |
| `goToLine`      | Go to line                    |

#### 3.3 File Store (`src/stores/files.ts`)

**State**:

| Field              | Type         | Description                         |
| ------------------ | ------------ | ----------------------------------- |
| `currentPath`      | string       | Current path                        |
| `folders`          | FolderInfo[] | Folder list                         |
| `files`            | FileItem[]   | File list                           |
| `rootProtected`    | boolean      | Is root protected                   |
| `currentProtected` | boolean      | Is current path protected           |
| `currentNoEncrypt` | boolean      | Is current path encryption disabled |

**Methods**:

| Method                  | Description                       |
| ----------------------- | --------------------------------- |
| `listFiles`             | List files at specified path      |
| `readFile`              | Read file content                 |
| `writeFile`             | Write file                        |
| `createFolder`          | Create folder                     |
| `deleteFolder`          | Delete folder                     |
| `renameFolder`          | Rename folder                     |
| `moveFile`              | Move file                         |
| `setFolderNoEncrypt`    | Set folder encryption disabled    |
| `removeFolderNoEncrypt` | Remove folder encryption disabled |

---

### 4. Composables

#### 4.1 File Operations (`src/composables/useFileOperations.ts`)

**Function**: Wraps all file operation logic, including new, open, save, import, download, etc.

**Core Methods**:

| Method            | Description                                        |
| ----------------- | -------------------------------------------------- |
| `newFile`         | Create new file (asks to save current if modified) |
| `openFile`        | Open file dialog                                   |
| `saveFile`        | Save file (shows save dialog if no path)           |
| `saveAs`          | Save as                                            |
| `importLocalFile` | Import local file (auto encoding detection)        |
| `download`        | Download file                                      |
| `exit`            | Exit application                                   |
| `triggerAutoSave` | Trigger auto save (3 second delay)                 |

**Auto Save Mechanism**:

- Enabled when auto save is configured
- Auto save 3 seconds after content changes
- Local files don't trigger auto save

#### 4.2 Editor Commands (`src/composables/useEditorCommands.ts`)

**Function**: Wraps editor commands like undo, copy, find replace, etc.

**Core Methods**:

| Method           | Description             |
| ---------------- | ----------------------- |
| `undo`           | Undo                    |
| `redo`           | Redo                    |
| `cut`            | Cut                     |
| `copy`           | Copy                    |
| `paste`          | Paste                   |
| `find`           | Find                    |
| `replace`        | Replace                 |
| `goTo`           | Go to line              |
| `insertDateTime` | Insert date/time        |
| `toggleAutoWrap` | Toggle word wrap        |
| `toggleMarkdown` | Toggle Markdown preview |

#### 4.3 Keyboard Shortcuts (`src/composables/useKeyboardShortcuts.ts`)

**Function**: Bind global keyboard shortcuts.

**Shortcut Mappings**:

| Shortcut     | Action           |
| ------------ | ---------------- |
| Ctrl+N       | New              |
| Ctrl+O       | Open             |
| Ctrl+S       | Save             |
| Ctrl+Z       | Undo             |
| Ctrl+Shift+Z | Redo             |
| Ctrl+X       | Cut              |
| Ctrl+C       | Copy             |
| Ctrl+V       | Paste            |
| Ctrl+A       | Select All       |
| Ctrl+F       | Find             |
| Ctrl+H       | Replace          |
| Ctrl+G       | Go to Line       |
| F5           | Insert Date/Time |
| Delete       | Delete Selection |

**Smart Filtering**: When input fields, textareas, or editable elements are focused, text editing shortcuts (cut, copy, paste, select all, delete) are not intercepted and handled by the browser's default behavior.

---

### 5. API Wrapper

#### 5.1 Frontend API Utilities (`src/utils/api.ts`)

**Function**: Wraps HTTP requests, automatically attaches authentication tokens.

**Core Functions**:

| Function    | Description    | Parameters                                          |
| ----------- | -------------- | --------------------------------------------------- |
| `apiGet`    | GET request    | `url`: string, `useAdmin`?: boolean                 |
| `apiPost`   | POST request   | `url`: string, `data`: object, `useAdmin`?: boolean |
| `apiPut`    | PUT request    | `url`: string, `data`: object, `useAdmin`?: boolean |
| `apiDelete` | DELETE request | `url`: string, `data`: object                       |

**Authentication Mechanism**:

- Folder permission token: `localStorage.getItem('auth_token')`
- Admin token: `localStorage.getItem('admin_token')`
- Request header: `Authorization: Bearer <token>`

**Error Handling**:

- 401 response with `X-Protected-Path` header → throws `FolderProtectedError`
- 403 response → throws `ForbiddenError`
- Other errors → throws generic error

---

## Database/Storage Design

### R2 Storage Structure

Uses key prefixes to simulate folder structure:

```
notes/
├── 2024/
│   ├── daily.md
│   └── weekly.md
└── todo.txt
```

**Virtual Folder Implementation**:

- When creating a folder, write `${folderPath}/` path (empty content, contentType as `application/x-directory`)
- List queries use `delimiter='/'` parameter to get folder prefixes (`delimitedPrefixes`)
- When deleting a folder, delete all objects under that prefix

### KV Key Structure

| Prefix                        | Key Format                            | Value Type | Description                     |
| ----------------------------- | ------------------------------------- | ---------- | ------------------------------- |
| `config:`                     | `config:{key}`                        | string     | Configuration items             |
| `folder:password:`            | `folder:password:{path}`              | string     | Folder password hash            |
| `folder:token_version:`       | `folder:token_version:{path}`         | number     | Folder token version            |
| `folder:no_encrypt:`          | `folder:no_encrypt:{path}`            | string     | Folder encryption disabled flag |
| `link:`                       | `link:{token}`                        | JSON       | Share link data                 |
| `folder:password:retry:`      | `folder:password:retry:{ipHash}`      | JSON       | IP retry records                |
| `folder:password:edge_block:` | `folder:password:edge_block:{ipHash}` | string     | IP edge blocking flag           |
| `admin:`                      | `admin:token_version`                 | number     | Admin token version             |

---

## Configuration & Deployment

### Environment Variables

| Variable                 | Type   | Required | Description                           |
| ------------------------ | ------ | -------- | ------------------------------------- |
| `JWT_SECRET`             | Secret | Yes      | JWT signing secret                    |
| `ADMIN_PASSWORD`         | Secret | No       | System admin password                 |
| `ENABLE_EDGE_BLOCKING`   | Var    | No       | Enable edge blocking ('true'/'false') |
| `CLOUDFLARE_API_TOKEN`   | Secret | No       | Cloudflare API Token                  |
| `CLOUDFLARE_ACCOUNT_ID`  | Secret | No       | Cloudflare Account ID                 |
| `CLOUDFLARE_BAN_LIST_ID` | Secret | No       | Ban list ID                           |
| `MAX_FOLDER_DEPTH`       | Var    | No       | Max folder depth (default 5)          |

### wrangler.jsonc Key Configuration

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

### Deployment Commands

```bash
# Development mode
npm run dev

# Build
npm run build

# Preview
npm run preview

# Deploy
npm run deploy

# Test
npm test
npm run test:run
npm run test:coverage
```

---

## Test Structure

Test files are located in the `tests/` directory, using Vitest framework:

```
tests/
├── api/              # API route tests
│   ├── config.test.ts
│   ├── folder.test.ts
│   ├── raw.test.ts
│   ├── share.test.ts
│   ├── shares.test.ts
│   └── share-token.test.ts
├── routes/           # Share link route tests
│   ├── view-token.test.ts
│   ├── view-token-auth.test.ts
│   └── raw-token.test.ts
└── utils/            # Utility function tests
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

## Security Features

### Implemented Security Measures

1. **Password Hashing**: PBKDF2-SHA256 algorithm, 100,000 iterations, 128-bit salt
2. **JWT Authentication**: Stateless token authentication, valid for 24 hours
3. **Path Traversal Protection**: Strict filtering of `../`, `..`, and illegal characters
4. **IP Blocking**: Progressive blocking based on failure count
5. **Edge Blocking**: Integration with Cloudflare API for edge-level IP blocking
6. **Token Version Management**: Old tokens automatically expire after password change
7. **Security Response Headers**: Global CSP, X-Frame-Options, HSTS, etc.
8. **XSS Protection**: Markdown preview uses DOMPurify sanitization
9. **iframe Security**: Share links disable iframe embedding by default
10. **CORS Control**: Raw links support custom CORS policy
11. **Filename Validation**: Follows Windows filename naming conventions (special characters, reserved names)
12. **Folder Encryption Management**: Admin can disable encryption for specific folders

### Security Best Practices

- Folder passwords stored in KV, not mixed with business data
- JWT tokens stored in localStorage for cross-page access
- Admin password configured via environment variables, not hardcoded
- Share link security: Invalid/expired tokens return 404 Not Found; view links requiring password return 200 HTML password form page; password verification failures redirect back to form with error parameter (doesn't leak link existence)
- Share link URLs don't contain filename or path information
- Share links for protected folders require folder password verification before viewing details

---

## Performance Optimization

### Implemented Optimizations

1. **Batch Operation Limits**: R2 batch delete limits 1000 objects
2. **Pagination**: Cursor-based pagination for handling large file counts
3. **Auto Save Debouncing**: 3 second delay to avoid frequent requests
4. **Code Splitting**: Manual Vite chunk configuration separates `jschardet`, `marked`, `dompurify`, `katex`, `mermaid` into independent chunks
5. **PWA Support**: `vite-plugin-pwa` for offline caching and auto-updates
6. **Virtual Scrolling**: Auto-enabled when file/folder count exceeds 200 items

### Large File Handling

- Uses ArrayBuffer and TextDecoder for encoding detection (supports GB2312, GBK, etc.)
- Files exceeding 10MB show warning and suggest using desktop editor

---

## Extension Suggestions

### Features to Add

1. **File Version History**: Create version snapshots on each save
2. **Search Functionality**: Cross-file content search
3. **Collaborative Editing**: Real-time collaboration based on WebSocket
4. **File Tags**: Add tags and categories to files
5. **Import/Export**: Support export as ZIP package download
6. **Custom Shortcuts**: Allow users to customize keyboard shortcuts
7. **Code Highlighting**: Support code syntax highlighting
8. **File Preview**: Preview support for images, PDF, etc.

### Architecture Improvement Suggestions

1. **Cache Strategy**: Add file content caching to reduce R2 reads
2. **Logging System**: Add structured logging and monitoring
3. **Rate Limiting**: Add API-level request rate limiting
4. **Data Backup**: Regularly backup R2 data to external storage
5. **Internationalization**: Multi-language UI support
