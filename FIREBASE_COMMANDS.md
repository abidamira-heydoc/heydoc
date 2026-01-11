# Firebase Quick Commands

## Find Your Project ID

### See all your Firebase projects:
```bash
firebase projects:list
```

This will show:
```
┌──────────────────────┬─────────────────┬────────────────┬──────────────────────┐
│ Project Display Name │ Project ID      │ Project Number │ Resource Location ID │
├──────────────────────┼─────────────────┼────────────────┼──────────────────────┤
│ HeyDoc               │ heydoc-abc123   │ 123456789      │ us-central           │
└──────────────────────┴─────────────────┴────────────────┴──────────────────────┘
```

Copy the **Project ID** column value (e.g., `heydoc-abc123`)

---

## Select Your Project

```bash
# Use your actual Project ID from the list above
firebase use heydoc-abc123
```

Or interactive selection:
```bash
firebase use --add
```
This will:
1. Show you a list of your projects
2. Let you select one with arrow keys
3. Automatically set it up

---

## Check Current Project

```bash
firebase use
```

Shows which project you're currently using

---

## Common Firebase Commands

### Deploy
```bash
# Deploy everything
firebase deploy

# Deploy only Firestore
firebase deploy --only firestore

# Deploy only Functions
firebase deploy --only functions

# Deploy Firestore + Functions (skip Storage)
firebase deploy --only firestore,functions

# Deploy with Storage
firebase deploy --only firestore,functions,storage
```

### Login/Logout
```bash
# Login to Firebase
firebase login

# Logout
firebase logout

# Check who's logged in
firebase login:list
```

### Project Info
```bash
# List all projects
firebase projects:list

# See current project
firebase use

# Project details
firebase projects:get
```

### Initialize (if needed)
```bash
# Initialize Firebase in a new directory
firebase init

# Initialize specific features
firebase init firestore
firebase init functions
firebase init storage
```

### Logs & Debug
```bash
# View function logs
firebase functions:log

# View function errors only
firebase functions:log --only error

# Real-time logs
firebase functions:log --tail
```

---

## Quick Setup Workflow

```bash
# 1. Login
firebase login

# 2. See your projects
firebase projects:list

# 3. Select your project (use actual ID from step 2)
firebase use heydoc-xxxxx

# 4. Deploy (without Storage for now)
firebase deploy --only firestore,functions

# 5. Verify it worked
firebase use
```

---

## If You Haven't Created a Firebase Project Yet

1. Go to https://console.firebase.google.com
2. Click **"Add project"**
3. Name it: **HeyDoc**
4. Enable Google Analytics (optional)
5. Click **Create project**

Then your Project ID will be auto-generated (usually `heydoc-xxxxx`)

---

## Troubleshooting

### "No project active"
```bash
firebase use --add
# Then select your project from the list
```

### "Permission denied"
```bash
firebase login
# Make sure you're logged in with the right Google account
```

### "Project not found"
```bash
firebase projects:list
# Make sure the project ID is correct
```

### "Functions failed to deploy"
```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

---

## .firebaserc File

After running `firebase use heydoc-xxxxx`, a `.firebaserc` file is created:

```json
{
  "projects": {
    "default": "heydoc-xxxxx"
  }
}
```

This saves your project selection so you don't need to run `firebase use` again.

---

## Quick Reference

| Command | What It Does |
|---------|-------------|
| `firebase login` | Login to Firebase |
| `firebase projects:list` | See all your projects |
| `firebase use <project-id>` | Select a project |
| `firebase use --add` | Interactive project selection |
| `firebase deploy` | Deploy everything |
| `firebase deploy --only firestore,functions` | Deploy specific services |
| `firebase functions:log` | View function logs |
| `firebase use` | Check current project |
