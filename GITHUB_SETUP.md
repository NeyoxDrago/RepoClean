# GitHub OAuth App Setup Guide

## Quick Setup

### 1. Create GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Click "OAuth Apps" → "New OAuth App"
3. Fill in:
   - Application name: RepoCleanr
   - Homepage URL: http://localhost:3000
   - Callback URL: http://localhost:5000/api/auth/github/callback

### 2. Required Scopes

- `repo` - Full repository access
- `read:user` - Read user profile
- `user:email` - Access email addresses  
- `read:org` - Read organization membership
- `delete_repo` - Delete repositories

### 3. Environment Variables

Backend `.env`:
```
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback
```

Frontend `.env.local`:
```
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_client_id
```

## API Usage Examples

### Authentication
```bash
GET /api/auth/github
GET /api/auth/github/callback?code=...&state=...
```

### Repositories
```bash
GET /api/repositories
POST /api/repositories/batch
```

For detailed documentation, see the main README.md file. 