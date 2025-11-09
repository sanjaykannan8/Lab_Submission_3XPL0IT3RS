# How to Get Firebase Service Account JSON

This guide walks you through creating a Firebase service account and adding it to your GitHub repository secrets.

## Step 1: Access Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (exploiters-e111d)
3. Click the gear icon next to "Project Overview" in the left sidebar
4. Select "Project settings"

## Step 2: Generate Service Account Key

1. In Project Settings, click on the "Service accounts" tab
2. You'll see a section titled "Firebase Admin SDK"
3. Click the button "Generate new private key"
4. A dialog will appear warning you to keep this key secure
5. Click "Generate key"
6. A JSON file will be downloaded to your computer (e.g., `exploiters-e111d-firebase-adminsdk-xxxxx.json`)

## Step 3: Verify the JSON Structure

Open the downloaded JSON file. It should look like this:

```json
{
  "type": "service_account",
  "project_id": "exploiters-e111d",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBA...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@exploiters-e111d.iam.gserviceaccount.com",
  "client_id": "123456789...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40exploiters-e111d.iam.gserviceaccount.com"
}
```

## Step 4: Add to GitHub Repository Secrets

### For the Lab Approval Workflow Repository:

1. Go to your lab approval workflow repository on GitHub
2. Click on "Settings" tab
3. In the left sidebar, click "Secrets and variables" → "Actions"
4. Click "New repository secret"
5. Name: `FIREBASE_SERVICE_ACCOUNT`
6. Value: Paste the **entire contents** of the JSON file (including the curly braces)
7. Click "Add secret"

## Step 5: Grant Firestore Permissions

The service account needs write access to your Firestore database. Your current Firestore rules need to allow this service account to write to the `labs` collection.

### Option A: Update Firestore Rules (Recommended for Production)

Add a rule that allows the service account to write:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // ... existing rules ...
    
    // Labs collection - allow service account to write
    match /labs/{labId} {
      // Allow authenticated users to read
      allow read: if request.auth != null
        && request.auth.token.email.matches('.*@sairamtap\\.edu\\.in$');
      
      // Allow service account to write (for GitHub Actions)
      allow write: if request.auth != null;
    }
  }
}
```

### Option B: Firebase Console IAM (Alternative)

1. Go to [Google Cloud Console IAM](https://console.cloud.google.com/iam-admin/iam)
2. Select your project
3. Find the service account email (from the JSON file)
4. Ensure it has the role "Cloud Datastore User" or "Firebase Admin"

## Step 6: Test the Setup

### Local Test (Optional)

Before pushing to GitHub, test locally:

```bash
cd lab-approval-workflow
npm install

# Create a test issue body
echo "### Submitter Name
John Doe

### Challenge Name
Test Challenge

### Challenge Type
Web

### Challenge Description
This is a test

### Solution
Test solution

### Extra Details
None" > test-issue.txt

# Run the script
FIREBASE_SERVICE_ACCOUNT='<paste-your-json-here>' \
ISSUE_BODY="$(cat test-issue.txt)" \
ISSUE_NUMBER=1 \
ISSUE_HTML_URL="https://github.com/test/test/issues/1" \
ISSUE_CREATED_AT="2025-01-01T12:00:00Z" \
ISSUE_USER_LOGIN="testuser" \
APPROVED_BY_LOGIN="admin" \
npm run publish-lab
```

### GitHub Actions Test

1. Create a test issue in your lab approval workflow repo
2. Add the `approved` label
3. Check the Actions tab to see if the workflow runs successfully
4. Verify the lab appears in your Firestore `labs` collection

## Security Best Practices

1. **Never commit the service account JSON to git**
   - It's already in `.gitignore`
   - Double-check before pushing

2. **Limit service account permissions**
   - Only grant Firestore write access
   - Don't give it broader permissions than needed

3. **Rotate keys periodically**
   - Generate new keys every 6-12 months
   - Delete old keys from Firebase Console

4. **Monitor usage**
   - Check Firebase Console for unusual activity
   - Set up billing alerts

## Troubleshooting

### "Permission denied" error
- Verify the service account has Firestore write permissions
- Check that Firestore rules allow writes from the service account

### "Invalid credentials" error
- Ensure the entire JSON is copied correctly (including newlines in private_key)
- Verify no extra spaces or formatting issues

### "Project not found" error
- Confirm the project_id in the JSON matches your Firebase project
- Ensure the service account belongs to the correct project

## Quick Reference

**Firebase Console**: https://console.firebase.google.com/  
**Service Account Location**: Project Settings → Service accounts → Generate new private key  
**GitHub Secrets Location**: Repository → Settings → Secrets and variables → Actions  
**Secret Name**: `FIREBASE_SERVICE_ACCOUNT`  
**Secret Value**: Entire JSON file contents

---

If you encounter any issues, check the GitHub Actions logs for detailed error messages.

