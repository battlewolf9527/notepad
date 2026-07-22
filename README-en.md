# Notepad

An online notepad application built on Cloudflare Pages, replicating the classic Windows Notepad interface.

## Documentation

- [Code Wiki](CODE_WIKI-en.md) - Complete Code Wiki documentation, including project architecture, module responsibilities, and key function descriptions
- [Deployment Guide](DEPLOY-en.md) - Detailed deployment instructions and troubleshooting guide

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend Framework | Vue 3 | ^3.5.32 |
| State Management | Pinia | ^3.0.4 |
| Build Tool | Vite | ^8.0.8 |
| Backend Runtime | Cloudflare Pages Functions | - |
| Storage | Cloudflare R2 / KV | - |
| Password Hashing | Web Crypto API (PBKDF2-SHA256) | - |
| JWT | jose | ^6.2.3 |
| Markdown Rendering | markdown-it | ^14.3.0 |
| Encoding Detection | jschardet | ^3.1.4 |
| Math Formulas | KaTeX | ^0.17.0 |
| Diagram Support | Mermaid | ^11.16.0 |
| Virtual Scrolling | vue-virtual-scroller | ^2.0.0-beta.8 |
| Keyboard Shortcuts | @vueuse/core | ^11.1.0 |

## Core Features

### Folder-Level Password Protection

- **No global login**: Folder-level encryption to protect sensitive files as needed
- **Password inheritance**: Subfolders automatically inherit parent folder protection
- **Root directory protection**: Password can be set at root level to protect all files and subfolders
- **Verification mechanism**: JWT Token authentication, valid for 24 hours
- **Token version management**: Old tokens automatically expire when password changes
- **Folder encryption management**: Admin can disable encryption for specific folders

### File Operations

- New, Open, Save, Save As
- Folder browsing and management (with virtual scrolling support)
- Import local files (auto encoding detection)
- Download files to local machine (supports Chinese filenames)
- Auto-save (optional, 3 seconds delay after content changes)

### Editing Features

- Undo, Cut, Copy, Paste, Delete
- Find, Replace, Go to Line
- Select All, Insert Date/Time

### Format Features

- Word wrap toggle
- Font settings (font face, style, size)
- Dark/Light theme toggle
- Custom theme support

### Markdown Support

- Real-time Markdown preview
- GitHub-style rendering
- Supports task lists, code blocks, tables, math formulas (KaTeX), diagrams (Mermaid)
- DOMPurify sanitization to prevent XSS

### Share Links

- **View Share** (supports password protection, expiration control, iframe configuration)
- **Raw Direct Link** (supports CORS configuration, custom Content-Type)
- **Share Link Management Panel** (admin can delete links)
- **Protected Folder Sharing**: Folder password must be verified before viewing link details

### Admin Features

- System admin password configured via environment variable (`ADMIN_PASSWORD`)
- Admin can reset any folder password
- Admin can manage all share links (regular users have no delete permission)
- Root directory operations (save files, create folders, set passwords) require admin permission
- Admin can disable encryption for specific folders

### Security Features

- IP blocking: Progressive blocking based on failure count (3→5min, 6→15min, 9→30min, 10→permanent)
- Edge blocking: Integration with Cloudflare API for edge-level IP blocking (optional)
- Path traversal protection: Strict filtering of `../`, `..`, and illegal characters
- Filename validation: Follows Windows filename naming conventions

## Quick Start

### 1. Prerequisites

Ensure Node.js (^20.19.0 or >=22.12.0) and Wrangler CLI are installed.

```bash
npm install -g wrangler
```

### 2. Create Cloudflare Resources

```bash
# Create KV Namespace
wrangler kv:namespace create NOTEPAD_KV

# Create R2 Bucket
wrangler r2 bucket create notepad
```

### 3. Configure JWT Secret

```bash
# Local development: set in .dev.vars file
echo "JWT_SECRET=your-secret-key-here" > .dev.vars

# Production: set via Wrangler
wrangler secret put JWT_SECRET
```

Recommended: Use a random string of at least 32 characters as the secret.

### 4. Local Development

```bash
npm install
npm run dev
```

### 5. Deploy to Cloudflare Pages

```bash
npm run deploy
```

## Folder Password Management

### Set Folder Password

Right-click on a folder in the file dialog, select "Set Password", enter the password and confirm.

### Remove Folder Password

Right-click on an encrypted folder, select "Remove Password", enter the correct password and confirm.

### Modify Folder Password

Right-click on an encrypted folder, select "Modify Password", enter the old and new passwords and confirm.

### Password Reset

If you forget the folder password, the admin can reset it via:

```bash
# Delete password key for specific path
wrangler kv:key delete "folder:password:{path}" --namespace-id=xxx

# Example: delete root password
wrangler kv:key delete "folder:password:" --namespace-id=xxx

# Example: delete notes folder password
wrangler kv:key delete "folder:password:notes" --namespace-id=xxx
```

### Disable Folder Encryption

Admin can disable encryption for specific folders:

1. Right-click on the folder
2. Select "Disable Encryption"

After disabling, the folder won't show password protection options.

## Project Structure

```
notepad/
├── functions/               # Pages Functions Backend
│   ├── _middleware.ts       # Global middleware (security headers)
│   ├── types/               # Type definitions
│   │   ├── env.ts           # Environment variable types
│   │   └── r2-extensions.d.ts # R2 extension types
│   ├── utils/               # Backend utility modules
│   │   ├── admin.ts         # Admin authentication
│   │   ├── api.ts           # API common handling
│   │   ├── constants.ts     # Constant definitions
│   │   ├── error.ts         # Error handling and logging
│   │   ├── folder-auth.ts   # Folder permission checking core logic
│   │   ├── jwt.ts           # JWT generation and verification
│   │   ├── password.ts      # PBKDF2-SHA256 password hashing
│   │   ├── path.ts          # Path normalization utilities
│   │   ├── r2.ts            # R2 storage operations wrapper
│   │   ├── rate-limit.ts    # IP blocking and retry limiting
│   │   ├── response.ts      # Response generation utilities
│   │   ├── share.ts         # Share link logic
│   │   ├── share-page.ts    # Share page generation
│   │   ├── template.ts      # HTML template rendering
│   │   ├── theme.ts         # Theme style generation
│   │   └── token.ts         # Random Token generation
│   ├── api/
│   │   ├── config.ts        # Configuration management
│   │   ├── admin.ts         # Admin login
│   │   ├── files/[[path]].ts # File CRUD
│   │   ├── folder.ts        # Folder operations
│   │   ├── folder/password.ts # Folder password management
│   │   ├── folder/no-encrypt.ts # Folder encryption disable
│   │   ├── share.ts         # Generate share links
│   │   ├── raw.ts           # Generate raw links
│   │   ├── shares.ts        # List share links
│   │   ├── share/[token].ts # Delete share link
│   │   └── shares/verify.ts # Verify share link password
│   ├── view/[token].ts      # View page
│   ├── view/[token]/auth.ts # Share link password verification
│   └── raw/[token].ts       # Raw direct link
├── src/                     # Vue 3 Frontend
│   ├── components/
│   │   ├── MenuBar.vue      # Menu bar
│   │   ├── TextEditor.vue   # Text editor (contenteditable div, supports persistent selection)
│   │   ├── StatusBar.vue    # Status bar
│   │   ├── EditorWrapper.vue # Editor wrapper (with Markdown toggle)
│   │   ├── FileDialog.vue   # File dialog
│   │   ├── FileDialogPassword.vue # File dialog password input
│   │   ├── FileDialogContextMenu.vue # File dialog context menu
│   │   ├── SettingsDialog.vue # Settings dialog
│   │   ├── FontDialog.vue   # Font settings dialog
│   │   ├── CustomThemeDialog.vue # Custom theme dialog
│   │   ├── FindReplace.vue  # Find replace dialog
│   │   ├── ShareDialog.vue  # Share link dialog
│   │   ├── RawDialog.vue    # Raw link dialog
│   │   ├── ShareManager.vue # Share link management panel
│   │   ├── MarkdownPreview.vue # Markdown preview component
│   │   ├── AdminLoginDialog.vue # Admin login dialog
│   │   ├── AdminBadge.vue   # Admin status badge
│   │   ├── ZoomControl.vue  # Zoom control
│   │   ├── ConfirmDialog.vue # Confirm dialog
│   │   ├── PromptDialog.vue # Prompt dialog
│   │   ├── ToastNotification.vue # Toast notification
│   │   ├── ErrorRetry.vue   # Error retry component
│   │   └── AboutDialog.vue  # About dialog
│   ├── composables/
│   │   ├── useFileOperations.ts # File operations logic
│   │   ├── useEditorCommands.ts # Editor commands
│   │   ├── useKeyboardShortcuts.ts # Keyboard shortcuts
│   │   ├── useAppDialogs.ts # Dialog management
│   │   ├── useDraggable.ts  # Drag functionality
│   │   └── useModalClose.ts # Modal close
│   ├── stores/
│   │   ├── auth.ts          # Authentication state
│   │   ├── editor.ts        # Editor state
│   │   ├── files.ts         # File list state
│   │   ├── config.ts        # Configuration state
│   │   ├── share.ts         # Share link state
│   │   ├── toast.ts         # Toast notification state
│   │   └── confirm.ts       # Confirm dialog state
│   ├── utils/
│   │   ├── api.ts           # API request wrapper
│   │   ├── path.ts          # Path utilities
│   │   ├── share.ts         # Share link utilities
│   │   ├── constants.ts     # Constant definitions
│   │   ├── shortcuts.ts     # Shortcut definitions
│   │   ├── error.ts         # Error handling
│   │   ├── markdown-renderer.ts # Markdown renderer
│   │   └── theme-styles.ts  # Theme style generation
│   ├── types/index.ts       # TypeScript type definitions
│   ├── styles/notepad.css   # Global styles
│   ├── App.vue              # Main application component
│   └── main.ts              # Entry file
├── types/shared.ts          # Shared types between frontend and backend
├── tests/                   # Test files
├── public/                  # Static resources
├── wrangler.jsonc.example   # Pages configuration example
├── package.json             # Project configuration
└── README.md                # Project documentation
```

## Keyboard Shortcuts

| Shortcut | Function |
|----------|----------|
| Ctrl+N | New |
| Ctrl+O | Open |
| Ctrl+S | Save |
| Ctrl+Z | Undo |
| Ctrl+Shift+Z | Redo |
| Ctrl+X | Cut |
| Ctrl+C | Copy |
| Ctrl+V | Paste |
| Ctrl+A | Select All |
| Ctrl+F | Find |
| Ctrl+H | Replace |
| Ctrl+G | Go to Line |
| F5 | Insert Date/Time |
| Delete | Delete Selection |

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/config` | GET/PUT | Read/update configuration |
| `/api/files` | GET | List files/folders |
| `/api/files/*` | GET/PUT/DELETE | File read/write/delete |
| `/api/folder` | POST/DELETE/PUT | Folder operations |
| `/api/folder/password` | POST/DELETE | Set/verify/remove password |
| `/api/folder/no-encrypt` | POST/DELETE | Disable/enable folder encryption |
| `/api/admin` | POST | Admin login |
| `/api/share` | POST | Generate view share link |
| `/api/raw` | POST | Generate raw link |
| `/api/shares` | GET | List all share links |
| `/api/shares/verify` | POST | Verify share link password |
| `/api/share/:token` | DELETE | Delete share link |
| `/view/:token` | GET | View page |
| `/view/:token/auth` | POST | Share link password verification |
| `/raw/:token` | GET | Raw direct link |

## Environment Variables

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `JWT_SECRET` | Secret | Yes | JWT signing secret |
| `ADMIN_PASSWORD` | Secret | No | System admin password |
| `ENABLE_EDGE_BLOCKING` | Var | No | Enable edge blocking |
| `CLOUDFLARE_API_TOKEN` | Secret | No | Cloudflare API Token |
| `CLOUDFLARE_ACCOUNT_ID` | Secret | No | Cloudflare Account ID |
| `CLOUDFLARE_BAN_LIST_ID` | Secret | No | Ban list ID |
| `MAX_FOLDER_DEPTH` | Var | No | Max folder depth (default 5) |

## Security Notes

- Folder operation APIs require JWT Token verification (with `pathPrefix`)
- Passwords are hashed using Web Crypto PBKDF2-SHA256 (100,000 iterations, 128-bit salt)
- Share tokens are generated using cryptographically secure random number generator
- Path traversal attacks are prevented
- Markdown preview uses DOMPurify for HTML sanitization
- iframe embedding is disabled by default
- IP blocking policy: 3 failures→5min, 6 failures→15min, 9 failures→30min, 10 failures→permanent

## License

MIT