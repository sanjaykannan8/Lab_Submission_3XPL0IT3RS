# Security Features

## Flag Protection Mechanism

This workflow implements several security measures to protect challenge flags from unauthorized access.

### 🔒 How Flags Are Protected

#### 1. **Hashing Before Storage**
When a lab is approved, the flag is:
- Extracted from the GitHub issue
- Hashed using SHA-256
- **Only the hash** is stored in Firestore
- The original flag is **never** stored in the database

```javascript
// From publish-lab.js
const crypto = require('crypto');
const flagHash = crypto.createHash('sha256').update(flag.trim()).digest('hex');
```

#### 2. **Issue Body Clearing**
After successful publication (5 seconds delay):
- The original issue body is **completely replaced**
- All sensitive data (flag, solution) is removed
- A generic "published" message is shown instead
- This prevents anyone from viewing the flag after approval

#### 3. **Issue Locking**
After the body is cleared:
- The issue is **locked** with reason: `resolved`
- No one can add comments or modify the issue
- The issue is permanently closed
- This prevents any attempts to restore or leak the flag

#### 4. **No Flag in Database**
- Users submit flags via the `/api/verify-flag` endpoint
- The API hashes the submitted flag
- Only hashes are compared (stored hash vs submitted hash)
- The actual flag never appears in database queries or logs

### 🔐 Verification Flow

```
User submits flag
       ↓
API receives flag
       ↓
Hash the submitted flag (SHA-256)
       ↓
Compare hash with stored hash
       ↓
Award points if match
```

### ⚠️ Important Security Notes

1. **GitHub Issue History**: GitHub maintains issue edit history. While we clear the body, admins with repo access can still view previous versions through the issue timeline. For maximum security, consider:
   - Using a private repository
   - Limiting who can view issues
   - Only trusted maintainers should approve labs

2. **GitHub Actions Logs**: The workflow logs do not contain the flag as it's passed via environment variables, but be cautious about logging the `ISSUE_BODY` variable.

3. **Service Account**: The Firebase service account JSON should be stored as a **GitHub Secret** and never committed to the repository.

### 🛡️ Best Practices

- ✅ Always use SHA-256 for flag hashing
- ✅ Clear issue bodies immediately after approval
- ✅ Lock issues to prevent tampering
- ✅ Store service accounts in GitHub Secrets
- ✅ Limit repository access to trusted maintainers
- ✅ Never log flags in workflow runs
- ✅ Use private repositories for sensitive challenges

### 📋 Workflow Steps

1. Issue is labeled with `approved`
2. Workflow extracts flag from issue body
3. Flag is hashed and stored in Firestore
4. Success comment is posted
5. **Wait 5 seconds** (so submitter can read comment)
6. Issue body is cleared (flag removed)
7. Issue is closed and locked
8. Original content is gone forever from public view

### 🔍 Verification

After the workflow completes:
- ✅ Issue should be closed
- ✅ Issue should be locked
- ✅ Issue body should show generic "published" message
- ✅ Original flag should not be visible
- ✅ Only the hash should exist in Firestore

### 📞 Questions?

If you have security concerns or find a vulnerability, please report it to the repository maintainers immediately.

