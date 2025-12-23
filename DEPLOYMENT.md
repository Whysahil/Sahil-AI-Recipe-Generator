# 🚀 Deployment Guide - AI Recipe Generator

## Deploy to Vercel

### Prerequisites
- Vercel account ([sign up here](https://vercel.com/signup))
- GitHub repository connected to Vercel
- OpenAI API key
- Firebase project set up

### Steps

#### 1. Install Vercel CLI (Optional)
```bash
npm install -g vercel
```

#### 2. Configure Environment Variables

Before deploying, you need to set up environment variables in Vercel:

**Backend Environment Variables (Serverless Functions):**
- `OPENAI_API_KEY` - Your OpenAI API key (required for recipe generation)

**Frontend Environment Variables:**
- `VITE_FIREBASE_API_KEY` - Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN` - Firebase auth domain (e.g., your-project.firebaseapp.com)
- `VITE_FIREBASE_PROJECT_ID` - Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging sender ID
- `VITE_FIREBASE_APP_ID` - Firebase app ID
- `VITE_API_BASE` - (Optional) Leave empty for same-origin API calls

#### 3. Deploy via Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset:** Vite
   - **Root Directory:** `AI_Recipes_Generator` (important!)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

5. Add Environment Variables:
   - Go to "Environment Variables" section
   - Add all the variables listed above
   - Make sure to add `OPENAI_API_KEY` as it's required for the backend API

6. Click "Deploy"

#### 4. Deploy via Vercel CLI

If you prefer using the CLI:

```bash
# Login to Vercel
vercel login

# Navigate to the project root (parent of AI_Recipes_Generator)
cd AI_Recipes_Generator

# Deploy to production
vercel --prod

# Set environment variables (do this after first deployment)
vercel env add OPENAI_API_KEY
vercel env add VITE_FIREBASE_API_KEY
vercel env add VITE_FIREBASE_AUTH_DOMAIN
vercel env add VITE_FIREBASE_PROJECT_ID
vercel env add VITE_FIREBASE_STORAGE_BUCKET
vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID
vercel env add VITE_FIREBASE_APP_ID
```

#### 5. Verify Deployment

After deployment:

1. Visit your Vercel URL (e.g., `https://your-project.vercel.app`)
2. Test the recipe generation feature to ensure the API is working
3. Test user authentication with Firebase
4. Check the Vercel logs if you encounter any issues

### Troubleshooting

**API Errors:**
- Verify `OPENAI_API_KEY` is set correctly in Vercel environment variables
- Check function logs in Vercel dashboard under "Functions" tab
- Ensure API functions are using Deno runtime (configured in `vercel.json`)

**Firebase Errors:**
- Verify all Firebase environment variables are set
- Check Firebase console for authentication and Firestore configuration
- Ensure Firestore security rules allow authenticated users to access their data

**Build Errors:**
- Check the build logs in Vercel dashboard
- Ensure `package.json` dependencies are up to date
- Verify Node.js version is 18.x as specified in `engines` field

**404 Errors on Routes:**
- The `vercel.json` rewrites should handle this automatically
- If issues persist, check the "Deployments" tab in Vercel and inspect the rewrite configuration

### Configuration Files

The deployment is configured via:

- **`vercel.json`** - Main Vercel configuration
  - Sets root directory to `AI_Recipes_Generator`
  - Configures Deno runtime for serverless functions
  - Handles API routing and SPA rewrites

- **`package.json`** - Dependencies and scripts
  - Locked to Node.js 18.x
  - Includes build scripts for Vite

### Firebase Hosting (Alternative)

If you prefer Firebase Hosting:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init hosting

# Build the app
npm run build

# Deploy to Firebase
firebase deploy --only hosting
```

Note: If using Firebase Hosting, you'll need to deploy the serverless functions separately or use Firebase Functions instead of Vercel Functions.

### Post-Deployment Checklist

- [ ] OpenAI API key is set and working
- [ ] All Firebase environment variables are configured
- [ ] User authentication works (signup/login)
- [ ] Recipe generation works
- [ ] Saved recipes can be created and retrieved
- [ ] Profile page loads correctly
- [ ] Dark/light mode toggle works
- [ ] All routes are accessible
- [ ] API endpoints respond correctly
- [ ] No console errors in production

### Continuous Deployment

Vercel automatically deploys:
- **Production:** When you push to the `main` branch
- **Preview:** When you create a pull request

Each deployment gets a unique URL for testing before going live.

### Domain Configuration

To add a custom domain:

1. Go to your project in Vercel Dashboard
2. Click "Settings" > "Domains"
3. Add your domain
4. Update your DNS settings as instructed by Vercel
5. Wait for DNS propagation (usually a few minutes to hours)

---

## Support

For issues or questions:
- Check Vercel documentation: https://vercel.com/docs
- Firebase documentation: https://firebase.google.com/docs
- OpenAI API documentation: https://platform.openai.com/docs
