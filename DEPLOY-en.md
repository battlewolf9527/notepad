# Deployment Guide - Notepad on Cloudflare Pages

This document details how to deploy the Notepad application to Cloudflare Pages.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Cloudflare Resource Creation](#cloudflare-resource-creation)
- [Environment Configuration](#environment-configuration)
- [Local Development](#local-development)
- [Deploy to Production](#deploy-to-production)
- [Post-Deployment Verification](#post-deployment-verification)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools

| Tool | Version Requirement | Installation Method |
|------|---------------------|---------------------|
| Node.js | ^20.19.0 or >=22.12.0 | [Download](https://nodejs.org/) |
| Wrangler CLI | v4.x+ | `npm install -g wrangler` |
| Git | Any stable version | [Download](https://git-scm.com/) |

### Verify Installation

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check Wrangler version
wrangler --version

# Check Cloudflare login status
wrangler whoami
```

### Cloudflare Account Preparation

1. Register a [Cloudflare account](https://dash.cloudflare.com/sign-up)
2. Complete email verification
3. Ensure your account has a payment method linked (required for R2 storage)

---

## Cloudflare Resource Creation

### 1. Create KV Namespace

KV Namespace is used to store configurations, share link mappings, and folder passwords.

```bash
# Create production KV Namespace
wrangler kv:namespace create "NOTEPAD_KV"

# Create preview KV Namespace (optional, for local development)
wrangler kv:namespace create "NOTEPAD_KV" --env preview
```

The command will return something like:

```
{ binding = "NOTEPAD_KV", id = "xxxxxxxxxxxxxxxxxxxx", preview_id = "yyyyyyyyyyyyyyyyyyyy" }
```

**Record the returned `id` and `preview_id`, they will be needed for configuration.**

### 2. Create R2 Bucket

R2 Bucket is used to store file content.

```bash
# Create R2 Bucket
wrangler r2 bucket create notepad

# Optional: Specify data center location
wrangler r2 bucket create notepad --location wnam  # Western hemisphere
# or
wrangler r2 bucket create notepad --location ena   # Eastern hemisphere
```

### 3. Get R2 Bucket Account ID

R2 Bucket needs an associated Account ID to be used in configuration.

```bash
# Method 1: List buckets via Wrangler
wrangler r2 bucket list

# Method 2: Login to Cloudflare Dashboard
# Visit https://dash.cloudflare.com/{your-account-id}/r2/buckets
```

---

## Environment Configuration

### Environment Variables & Secrets Summary

Here's a summary of all environment variables and secrets required by the project:

| Variable | Type | Required | Description | Configuration Location |
|----------|------|----------|-------------|------------------------|
| `JWT_SECRET` | Secret | Yes | JWT secret for generating and verifying folder access tokens. Recommended to use at least 32 characters random string | `wrangler secret put` / `.dev.vars` |
| `ADMIN_PASSWORD` | Secret | No | Admin password for root directory operation permission verification. If not configured, root operations will be unrestricted | `wrangler secret put` / `.dev.vars` |
| `ENABLE_EDGE_BLOCKING` | Var | No | Enable edge blocking, values: `"true"` or `"false"` | `wrangler.jsonc` → `vars` / `.dev.vars` |
| `CLOUDFLARE_API_TOKEN` | Secret | No | Cloudflare API Token, needs Rules Lists permission | `wrangler secret put` / `.dev.vars` |
| `CLOUDFLARE_ACCOUNT_ID` | Secret | No | Cloudflare Account ID | `wrangler secret put` / `.dev.vars` |
| `CLOUDFLARE_BAN_LIST_ID` | Secret | No | Cloudflare Ban List ID (custom list ID) | `wrangler secret put` / `.dev.vars` |
| `MAX_FOLDER_DEPTH` | Var | No | Max folder depth, default is 5 | `wrangler.jsonc` → `vars` / `.dev.vars` |

### wrangler.jsonc Configuration Items

Here are the resource IDs that need to be configured in `wrangler.jsonc`:

| Configuration Item | Description | How to Get |
|-------------------|-------------|------------|
| `kv_namespaces[].id` | KV Namespace ID (production) | `wrangler kv:namespace create NOTEPAD_KV` |
| `kv_namespaces[].preview_id` | KV Namespace Preview ID (local dev) | `wrangler kv:namespace create NOTEPAD_KV --env preview` |
| `r2_buckets[].bucket_name` | R2 Bucket name | `wrangler r2 bucket create notepad` |
| `r2_buckets[].preview_bucket_name` | R2 Preview Bucket name | Same as above |

### 1. Update wrangler.jsonc

Copy `wrangler.jsonc.example` to `wrangler.jsonc` and fill in your resource IDs:

```bash
cp wrangler.jsonc.example wrangler.jsonc
```

Edit the `wrangler.jsonc` file in the project root:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "notepad",
  "compatibility_date": "2026-06-12",
  "pages_build_output_dir": "./dist",

  "kv_namespaces": [
    {
      "binding": "NOTEPAD_KV",
      // Fill in your KV Namespace ID (production)
      "id": "YOUR_KV_NAMESPACE_ID",
      // Fill in your KV Namespace Preview ID (local development)
      "preview_id": "YOUR_KV_PREVIEW_ID",
    },
  ],

  "r2_buckets": [
    {
      "binding": "NOTEPAD_R2",
      // Fill in your R2 Bucket name
      "bucket_name": "notepad",
      // Preview Bucket name for local development
      "preview_bucket_name": "notepad",
      // Set to true to allow connecting to remote R2 during local development
      "remote": true,
    },
  ],

  "vars": {
    "ENABLE_EDGE_BLOCKING": "false",
    "MAX_FOLDER_DEPTH": "5",
  },
}
```

### 2. Configure JWT Secret

JWT secret is used for generating and verifying folder access tokens. **Be sure to use a strong random secret.**

#### Production Secret Setup

```bash
# Interactive setup (recommended)
wrangler secret put JWT_SECRET

# Or setup via file
echo "your-very-secure-random-string-at-least-32-chars" > jwt_secret.txt
wrangler secret put JWT_SECRET < jwt_secret.txt
rm jwt_secret.txt  # Delete the file immediately after setup
```

#### Local Development Secret Setup

Create a `.dev.vars` file in the project root:

```bash
# Windows PowerShell
echo "JWT_SECRET=your-local-dev-secret-key-here" | Out-File -FilePath .dev.vars -Encoding UTF8

# Linux/macOS
echo 'JWT_SECRET=your-local-dev-secret-key-here' > .dev.vars
```

**Note**: `JWT_SECRET` should be at least 32 characters. Recommended to generate a random string:

```bash
# Generate random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Configure Admin Password (Optional)

Admin password is used for root directory operation permission verification. If not configured, root operations will be unrestricted.

```bash
# Production
wrangler secret put ADMIN_PASSWORD

# Local development (add to .dev.vars)
# ADMIN_PASSWORD=your-admin-password-here
```

### 4. Configure Edge Blocking (Optional)

Edge blocking can add IP addresses to the edge ban list via Cloudflare API after multiple password verification failures.

> **Note**: Edge blocking requires manual configuration in Cloudflare Dashboard with two prerequisites:
>
> 1. Create a custom list (Ban List)
> 2. Create a custom rule (Security Rule)

#### What is Edge Blocking

**Edge Blocking** is a security protection mechanism provided by Cloudflare that can block specific IP addresses at Cloudflare's global edge nodes. Compared to traditional application-layer blocking, edge blocking has the following features:

- **Higher Performance**: Blocking rules take effect at Cloudflare edge nodes, requests never reach your Pages Functions
- **Global Effectiveness**: Blocking rules sync across all Cloudflare data centers, regardless of where the attacker is
- **Lower Latency**: Edge nodes directly reject requests without going through Workers processing
- **Free to Use**: This feature is based on Cloudflare's custom rules and lists, doesn't depend on paid WAF features

#### Blocking Effect

When an IP address is edge-blocked:

1. All requests from this IP will be directly rejected at Cloudflare edge
2. Returns HTTP 403 Forbidden error (or Cloudflare's default blocking page)
3. Requests won't reach your Pages Functions and won't generate any logs
4. Blocking applies to the entire domain, not just password verification APIs

#### Blocking Policy

| Failure Count | Block Duration | Edge Blocking |
|---------------|----------------|---------------|
| 3 | 5 minutes | No (application-layer only) |
| 6 | 15 minutes | No (application-layer only) |
| 9 | 30 minutes | No (application-layer only) |
| 10+ | Permanent | Yes (both edge and application-layer) |

> **Note**: The first 9 failures only record blocking at the application layer (KV). After the 10th failure, edge blocking will be triggered.

#### Prerequisite: Create Custom List (Ban List)

Edge blocking relies on Cloudflare's custom list to store blocked IP addresses.

1. Login to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click the account dropdown in the top-left corner, select **Manage Account**
3. Click the **Configurations** tab
4. Select the **Lists** subtab
5. Click **Create List** button
6. Fill in list information:
   - **Name**: `ban` (recommended)
   - **Description**: `IP Ban List`
   - **Type**: `IP Lists`
7. Click **Create**

After creation, record the list ID (can be found on the list details page).

#### Prerequisite: Create Custom Rule (Security Rule)

After creating the list, you need to create a security rule to make Cloudflare block IPs in the list at the edge layer.

1. Login to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Go to your domain page
3. Click **Security** → **Security Rules** in the left menu
4. Click the **Custom Rules** tab
5. Click **Create Custom Rule** button
6. Fill in rule information:
   - **Rule Name**: `BAN`
   - **Matching Condition**:
     - **Field**: `Source IP Address`
     - **Operator**: `in list`
     - **Value**: Select the `ban` list you created
   - **Action**: `Block`
   - **Placement**: `First` (ensure highest priority)
7. Click **Deploy**

#### Configure Environment Variables

After completing the above prerequisites, configure the following environment variables:

```bash
# Cloudflare API Token (needs Rules Lists permission)
wrangler secret put CLOUDFLARE_API_TOKEN

# Cloudflare Account ID
wrangler secret put CLOUDFLARE_ACCOUNT_ID

# Cloudflare Ban List ID (the list ID from the previous step)
wrangler secret put CLOUDFLARE_BAN_LIST_ID
```

> **Note**: `ENABLE_EDGE_BLOCKING` needs to be configured in `wrangler.jsonc`'s `vars`, not using `wrangler secret put`:
>
> ```jsonc
> {
>   "vars": {
>     "ENABLE_EDGE_BLOCKING": "true",
>     "MAX_FOLDER_DEPTH": "5",
>   },
> }
> ```

#### How to Remove Edge Blocking

Once an IP is edge-blocked, you need to manually remove it in Cloudflare Dashboard:

**Method 1: Via Cloudflare Dashboard**

1. Login to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click the account dropdown in the top-left corner, select **Manage Account**
3. Click the **Configurations** tab
4. Select the **Lists** subtab
5. Find your `ban` list and click into it
6. Find the blocked IP address in the list
7. Click the **Delete** button to remove the block

**Method 2: Via Cloudflare API**

```bash
# Use curl to remove block
curl -X DELETE "https://api.cloudflare.com/client/v4/accounts/{account_id}/rules/lists/{list_id}/items/{item_id}" \
  -H "Authorization: Bearer {api_token}"
```

> **Note**: After removing edge blocking, you also need to clear the blocking records in KV to fully restore access:
>
> ```bash
> wrangler kv:key delete "folder:password:retry:{ipHash}" --namespace-id={namespace_id}
> wrangler kv:key delete "folder:password:edge_block:{ipHash}" --namespace-id={namespace_id}
> ```

---

## Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

This will start:

- Vite frontend development server (default http://localhost:5173)
- Wrangler Pages local simulation environment (API request proxy)

### 3. Preview Production Build (Optional)

Simulate Cloudflare Pages environment locally:

```bash
npm run preview
```

### 4. Local Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage
```

### 5. Type Checking

```bash
npm run type-check
```

### 6. Code Linting & Formatting

```bash
# Run all checks
npm run lint

# Format code
npm run format
```

---

## Deploy to Production

### Pre-Deployment Checklist

- [ ] `wrangler whoami` confirms Cloudflare login
- [ ] KV Namespace ID filled in wrangler.jsonc
- [ ] R2 Bucket created
- [ ] JWT_SECRET set via `wrangler secret put`
- [ ] (Optional) ADMIN_PASSWORD set (for root permission control)
- [ ] (Optional) Edge blocking environment variables configured
- [ ] Local `npm test` all passed
- [ ] Local `npm run build` build successful

### Execute Deployment

```bash
# One-click deployment (auto build + upload)
npm run deploy
```

### Manual Step-by-Step Deployment

For more granular control:

```bash
# Step 1: Build frontend
npm run build

# Step 2: Deploy to Cloudflare Pages
wrangler pages deploy ./dist

# Or deploy to specific environment
wrangler pages deploy ./dist --env production
```

### Verify Deployment

After successful deployment, Cloudflare will return the application URL, e.g.:

```
https://notepad.pages.dev
```

---

## Post-Deployment Verification

### 1. Functional Testing

Visit the deployed URL and perform the following tests:

| Feature | Test Method |
|---------|-------------|
| New File | Click menu "File > New", enter content |
| Save File | Click menu "File > Save", verify success |
| Open File | Click menu "File > Open", browse folders |
| Create Folder | Click new folder button in file dialog |
| Set Password | Right-click folder > Set Password |
| Modify Password | Right-click encrypted folder > Modify Password |
| Generate Share Link | Click menu "File > Generate Share Link" |
| Generate Raw Link | Click menu "File > Generate Raw Link" |
| Markdown Preview | Click menu "View > Markdown Preview" |
| Theme Toggle | Click menu "Format > Color" |

### 2. View Real-time Logs

```bash
# Monitor all requests
wrangler tail

# Only view error logs
wrangler tail --status error

# Only view specific Worker logs
wrangler tail notepad
```

### 3. Check KV Data

```bash
# List all keys in KV
wrangler kv key list --namespace-id=<YOUR_NAMESPACE_ID>

# View specific key
wrangler kv key get "folder:password:" --namespace-id=<YOUR_NAMESPACE_ID>
```

### 4. Check R2 Bucket

```bash
# View Bucket contents
wrangler r2 object list notepad

# Upload test file
echo "test content" | wrangler r2 object put notepad/test.txt --data

# Download test file
wrangler r2 object get notepad/test.txt
```

---

## Troubleshooting

### Common Issues

#### 1. Deployment Failed: Authentication error

**Cause**: Not logged in to Cloudflare or login session expired.

**Solution**:

```bash
wrangler login
```

#### 2. Deployment Failed: KV Namespace not found

**Cause**: KV Namespace ID in `wrangler.jsonc` is incorrect.

**Solution**:

```bash
# List existing KV Namespaces
wrangler kv namespace list

# Verify ID matches configuration in wrangler.jsonc
```

#### 3. API Request Returns 500 Internal Server Error

**Solution**:

```bash
# View real-time logs to locate error
wrangler tail --format pretty
```

#### 4. File Upload Failed

**Possible Causes**:

- R2 Bucket not configured correctly
- File size exceeds limit (single object max 5GB)
- R2 Bucket name contains invalid characters

**Solution**:

```bash
# Verify R2 Bucket exists
wrangler r2 bucket list

# Check R2 configuration
cat wrangler.jsonc | grep -A 5 r2_buckets
```

#### 5. JWT Verification Failed

**Cause**: JWT_SECRET doesn't match the secret used when generating tokens.

**Solution**: Ensure production JWT_SECRET matches the one used when creating share links.

```bash
# View current JWT_SECRET configuration
wrangler secret list
```

#### 6. Local Development Works, But Deployment Has Issues

**Troubleshooting Steps**:

1. Check if `compatibility_date` needs updating
2. View `wrangler tail` logs
3. Ensure `.dev.vars` secrets aren't used in production
4. Clear browser cache or test in incognito mode
5. Check environment variables configuration (note that `ENABLE_EDGE_BLOCKING` and `MAX_FOLDER_DEPTH` need to be configured in `wrangler.jsonc`'s `vars`)

#### 7. Admin Functions Not Working

**Possible Causes**:

- `ADMIN_PASSWORD` environment variable not configured
- Admin Token expired or invalid

**Solution**:

```bash
# Check if admin password is set
wrangler secret list | grep ADMIN_PASSWORD
```

#### 8. Share Link Returns 404

**Possible Causes**:

- Token expired (KV TTL auto-deleted)
- Token already used (one-time link)
- KV data corrupted or format error

**Solution**: View link data in KV:

```bash
wrangler kv key get "link:{token}" --namespace-id=<YOUR_NAMESPACE_ID>
```

### Rollback Operations

If issues occur after deployment and you need to rollback:

```bash
# View version history
wrangler versions list

# Rollback to previous version
wrangler rollback

# Rollback to specific version
wrangler rollback <VERSION_ID>
```

---

## Advanced Configuration

### Use Custom Domain

```bash
# Add domain in Cloudflare Dashboard
# Or use Wrangler CLI
wrangler pages domain add your-domain.com

# Add CNAME
wrangler pages record add your-domain.com CNAME notepad.pages.dev
```

### Set Environment Variables

```bash
# Set production environment variable
wrangler pages config set ENVIRONMENT=production

# List all environment variables
wrangler pages env list
```

### Configure Cache Policy

You can adjust cache headers in `functions/_middleware.ts`:

```typescript
// Adjust Cache-Control as needed
newResponse.headers.set('Cache-Control', 'no-cache')
```

### Git Integration for Auto Deployment

1. Go to your Pages project in Cloudflare Dashboard
2. Click **Settings** → **Deployments**
3. Click **Connect to Git**
4. Select your Git repository (GitHub/GitLab/Bitbucket)
5. Configure build command: `npm run build`
6. Configure build output directory: `dist`
7. Click **Save and Deploy**

After configuration, every push to the main branch will automatically trigger deployment.

---

## Security Recommendations

1. **JWT_SECRET Security**
   - Use strong random strings (at least 32 characters)
   - Rotate secrets periodically
   - Don't hardcode in codebase

2. **R2 Bucket Access Control**
   - Consider using R2 custom domain binding with HTTPS
   - Avoid making Bucket publicly accessible

3. **KV Data Protection**
   - Folder passwords are encrypted with PBKDF2
   - Regularly audit sensitive data in KV

4. **Share Link Security**
   - Set reasonable link expiration periods
   - Use password protection for sensitive files
   - One-time links auto-expire after use

5. **Admin Password Security**
   - Use strong passwords
   - Configure via environment variables, don't hardcode
   - Change admin password regularly

---

## Getting Help

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [Cloudflare Community](https://community.cloudflare.com/)