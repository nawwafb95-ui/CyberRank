# Production Secrets Setup

This document explains how to configure secrets for Firebase Cloud Functions.

## Local Development

1. Copy `env.template` to `.env`:
   ```bash
   cd functions
   cp env.template .env
   ```

2. Edit `.env` and add your actual values:
   ```
   RESEND_API_KEY=re_your_actual_api_key_here
   FROM_EMAIL=noreply@yourdomain.com
   ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,https://yourdomain.com
   ```

3. The `.env` file is already in `.gitignore` and will NOT be committed.

## Production Deployment

For production, use Firebase Functions runtime configuration. Choose one method:

### Method 1: Firebase Functions Config (Recommended for v1 Functions)

Set environment variables using Firebase CLI:

```bash
firebase functions:config:set resend.key="YOUR_RESEND_API_KEY"
firebase functions:config:set resend.from_email="noreply@yourdomain.com"
firebase deploy --only functions
```

### Method 2: Environment Variables (Recommended for v2 Functions)

Set environment variables directly:

```bash
firebase functions:secrets:set RESEND_API_KEY
firebase functions:secrets:set FROM_EMAIL
```

Or set them during deployment:

```bash
firebase functions:config:set resend.key="YOUR_RESEND_API_KEY" resend.from_email="YOUR_EMAIL"
firebase deploy --only functions
```

### Method 3: Using .env file (NOT RECOMMENDED for production)

If you must use .env in production, ensure it is:
1. Never committed to git (already in .gitignore)
2. Only stored securely on your deployment server
3. Not included in any deployment package

## Important Notes

- **NEVER commit `.env` files to git** - they are already in `.gitignore`
- **NEVER share API keys or secrets** in code reviews, issues, or documentation
- The code automatically detects local vs production environment and uses the appropriate method
- For local development with emulators, use the `.env` file approach
- For production, always use Firebase Functions runtime config or secrets

## Verification

After deployment, verify secrets are set correctly:

```bash
firebase functions:config:get
```

Or check logs:
```bash
firebase functions:log
```

If secrets are missing, you'll see error messages in the function logs.

