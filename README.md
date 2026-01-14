# Bever Family Recipes - Deployment Guide

## 🚀 EASIEST: Deploy via GitHub (5 minutes, AI features work!)

This is the recommended method - it's a one-time setup and then Netlify auto-deploys whenever you update.

### Step 1: Create a GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Name it `bever-family-recipes`
3. Keep it **Public** (or Private if you have a paid account)
4. Click **Create repository**

### Step 2: Upload the Files

On your new repo page, click **"uploading an existing file"** link, then:
1. Drag the entire contents of the `bever-netlify` folder onto the page
2. Click **Commit changes**

### Step 3: Connect to Netlify

1. Go to [app.netlify.com](https://app.netlify.com)
2. Click **Add new site** → **Import an existing project**
3. Choose **GitHub** and authorize if needed
4. Select your `bever-family-recipes` repo
5. Settings should auto-fill. If not:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Click **Deploy site**

### Step 4: Add Your API Key

1. In Netlify, go to **Site configuration** → **Environment variables**
2. Click **Add a variable**
3. Key: `ANTHROPIC_API_KEY`
4. Value: `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`
5. Click **Create variable**
6. Go to **Deploys** → **Trigger deploy** → **Deploy site**

### ✅ Done!

Your site is live at `https://[random-name].netlify.app`

You can customize the URL in **Domain management** → **Options** → **Edit site name**

---

## ⚡ QUICK: Drag & Drop (2 minutes, but no AI features)

If you just want to see the site quickly without scan/import features:

1. Open the `dist` folder (already pre-built!)
2. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
3. Drag the `dist` folder onto the page
4. Site is live instantly!

**Note:** The "Scan photo" and "From website" features won't work with this method because they need the serverless function. Use the GitHub method above for full functionality.

---

## 🔧 Troubleshooting

**"Scan/import not working"**
→ Make sure you used the GitHub method AND added the ANTHROPIC_API_KEY environment variable

**"Recipes not saving"**  
→ Your Firebase is already configured and should work. Check browser console for errors.

**"Want a custom domain?"**
→ In Netlify: Domain management → Add custom domain

---

## What's Included

```
bever-netlify/
├── dist/                    ← Pre-built site (drag & drop this for quick deploy)
├── src/                     ← Source code  
├── netlify/functions/       ← AI serverless function
├── index.html
├── package.json
├── vite.config.js
└── netlify.toml             ← Netlify configuration
```

## Features

✅ Beautiful Magnolia-style design  
✅ Firebase cloud storage (already configured)  
✅ Scan recipes from photos  
✅ Import recipes from website URLs  
✅ Print-ready family cookbook  
✅ Works on all devices  
