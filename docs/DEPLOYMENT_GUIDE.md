# SOCyberX Deployment Guide for Bluehost/Shared Hosting

This guide covers deploying SOCyberX to Bluehost or similar shared hosting providers.

## Prerequisites

- [ ] Bluehost/shared hosting account with cPanel access
- [ ] Firebase project configured
- [ ] Cloud Functions deployed
- [ ] Domain name configured (optional but recommended)

## Pre-Deployment Checklist

### 1. Build and Test Locally

```bash
# Install dependencies
npm install

# Test locally
npm run dev

# Verify OTP flow works
# Test signup and password reset
```

### 2. Update Configuration

Edit `public/html/js/config.js` and update the production domain:

```javascript
// Replace 'yourdomain.com' with your actual domain
if (hostname === 'yourdomain.com' || hostname === 'www.yourdomain.com') {
  return 'https://us-central1-cyberrank-a4380.cloudfunctions.net';
}
```

### 3. Verify Firebase Configuration

- [ ] `public/html/js/firebaseConfig.js` is configured
- [ ] Cloud Functions are deployed
- [ ] Firestore security rules are deployed
- [ ] Environment variables are set in Firebase Console

## Deployment Steps

### Step 1: Prepare Files for Deployment

**DO NOT include:**
- `node_modules/` folder
- `.git/` folder
- `.env` files
- `dist/` or `build/` folders (if using Vite build)
- Development files

**Files to deploy:**
- `public/` folder (entire contents)
- `firebase.json` (if using Firebase Hosting)
- `firestore.rules` (if using Firestore)

### Step 2: Create Deployment Package

#### Option A: Manual File Selection (Recommended)

1. **Using FileZilla or cPanel File Manager:**
   - Select only the `public/` folder
   - Upload to your hosting's `public_html/` or `www/` directory
   - Ensure folder structure is preserved

2. **Using Git (if available):**
   ```bash
   git clone <your-repo>
   cd SOCyberX
   # Only upload public/ folder via FTP
   ```

#### Option B: Create Clean Zip (Alternative)

```bash
# Create a clean deployment folder
mkdir deploy
cp -r public deploy/
cp firebase.json deploy/ 2>/dev/null || true
cp firestore.rules deploy/ 2>/dev/null || true

# Create zip (excludes node_modules automatically)
cd deploy
zip -r ../socyberx-deploy.zip . -x "*.git*" -x "*node_modules*" -x "*.env*"
cd ..
```

**Then upload `socyberx-deploy.zip` and extract on server.**

### Step 3: Upload to Bluehost

1. **Login to cPanel**
2. **Navigate to File Manager**
3. **Go to `public_html/` directory**
4. **Upload files:**
   - Upload entire `public/` folder contents
   - Or extract `socyberx-deploy.zip` if using zip method

5. **Verify folder structure:**
   ```
   public_html/
   ├── html/
   │   ├── index.html
   │   ├── login.html
   │   ├── signup.html
   │   ├── success.html
   │   ├── forgot-password.html
   │   ├── js/
   │   │   ├── config.js
   │   │   ├── signup.js
   │   │   ├── otp.js
   │   │   ├── forgot-password.js
   │   │   └── ...
   │   ├── css/
   │   └── images/
   └── ...
   ```

### Step 4: Configure Domain and Paths

#### If using subdomain (e.g., app.yourdomain.com):

1. **Create subdomain in cPanel:**
   - Subdomain: `app`
   - Document Root: `public_html/app`

2. **Upload files to `public_html/app/`**

3. **Update `config.js` if needed:**
   ```javascript
   if (hostname === 'app.yourdomain.com') {
     return 'https://us-central1-cyberrank-a4380.cloudfunctions.net';
   }
   ```

#### If using main domain (yourdomain.com):

1. **Upload to `public_html/`**
2. **Ensure `index.html` is in root or configure redirect**

### Step 5: Set File Permissions

In cPanel File Manager:
- Folders: `755`
- Files: `644`
- JavaScript files: `644`

### Step 6: Configure .htaccess (if needed)

Create `public_html/.htaccess`:

```apache
# Enable CORS for Cloud Functions
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization"
</IfModule>

# Redirect to index.html if file not found
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /html/index.html [L]
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

## Post-Deployment Verification

### 1. Test Basic Functionality

- [ ] Home page loads: `https://yourdomain.com/html/index.html`
- [ ] Login page loads: `https://yourdomain.com/html/login.html`
- [ ] Signup page loads: `https://yourdomain.com/html/signup.html`
- [ ] CSS and images load correctly
- [ ] JavaScript files load (check browser console)

### 2. Test OTP Flow

- [ ] Signup form submits
- [ ] OTP request is sent (check browser console)
- [ ] OTP page loads: `https://yourdomain.com/html/success.html`
- [ ] OTP verification works
- [ ] Account creation works after OTP verification

### 3. Test Password Reset

- [ ] Forgot password form submits
- [ ] OTP request is sent
- [ ] OTP verification works
- [ ] Password reset email is sent

### 4. Check Browser Console

- [ ] No `ReferenceError: process is not defined`
- [ ] Config loads: `[Config] SOCyberX configuration loaded`
- [ ] Functions URL is correct
- [ ] No CORS errors

### 5. Verify Cloud Functions

- [ ] Functions URL is accessible
- [ ] OTP requests work
- [ ] OTP verification works
- [ ] Check Firebase Console for function logs

## Troubleshooting

### Issue: "process is not defined" Error

**Solution:** Ensure `config.js` is loaded before other scripts:
```html
<script src="../js/config.js"></script>
<script type="module" src="../js/signup.js"></script>
```

### Issue: OTP Page Redirects Immediately

**Solution:** Check that `success.html` doesn't have OTP_ENABLED redirect logic.

### Issue: Functions URL Not Working

**Solution:** 
1. Check `config.js` hostname detection
2. Verify Cloud Functions are deployed
3. Check browser console for actual URL being used
4. Test Functions URL directly in browser

### Issue: CORS Errors

**Solution:**
1. Update Cloud Functions `ALLOWED_ORIGINS` environment variable
2. Add your domain to allowed origins
3. Check `.htaccess` CORS headers

### Issue: Files Not Loading

**Solution:**
1. Check file paths (relative vs absolute)
2. Verify file permissions (644 for files, 755 for folders)
3. Check `.htaccess` redirect rules
4. Verify folder structure matches local

## Production Configuration

### Update config.js for Production

Before deploying, update `public/html/js/config.js`:

```javascript
// Replace with your actual domain
if (hostname === 'yourdomain.com' || hostname === 'www.yourdomain.com') {
  return 'https://us-central1-cyberrank-a4380.cloudfunctions.net';
}
```

### Environment-Specific Override

If you need different configs per environment, you can override in HTML:

```html
<script>
  // Override config before config.js loads
  window.__SOCYBERX_CONFIG__ = {
    FUNCTIONS_BASE_URL: 'https://us-central1-cyberrank-a4380.cloudfunctions.net',
    OTP_ENABLED: true
  };
</script>
<script src="../js/config.js"></script>
```

## Maintenance

### Updating Files

1. **Make changes locally**
2. **Test locally**
3. **Upload only changed files via FTP**
4. **Clear browser cache**
5. **Test on production**

### Backup

- [ ] Backup `public/` folder before updates
- [ ] Keep Firebase config backed up securely
- [ ] Document any custom configurations

## Security Checklist

- [ ] `firebaseConfig.js` is not committed to public repo
- [ ] Cloud Functions environment variables are set
- [ ] Firestore security rules are deployed
- [ ] CORS is properly configured
- [ ] No sensitive data in client-side code
- [ ] HTTPS is enabled (SSL certificate)

## Support

If deployment issues persist:
1. Check browser console for errors
2. Check server error logs (cPanel → Error Logs)
3. Verify file permissions
4. Test Functions URL directly
5. Verify Firebase configuration

