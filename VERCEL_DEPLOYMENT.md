# Backend Deployment to Vercel

## ✅ Serverless Conversion Complete

Your Express backend has been converted to work with Vercel's serverless platform **WITHOUT changing any existing folder structure**.

## 📁 What Changed

### Files Modified:
1. **`src/index.ts`** - Removed `app.listen()`, now exports the Express app
2. **`package.json`** - Added `vercel-build` script
3. **`tsconfig.json`** - Includes `api` folder for compilation

### Files Created:
1. **`api/index.ts`** - Vercel serverless entry point (thin wrapper)
2. **`vercel.json`** - Vercel routing configuration
3. **`.vercelignore`** - Excludes unnecessary files from deployment

## 🚀 Deploy to Vercel

### Option 1: Vercel CLI (Recommended)
```bash
cd backend-shloksagar
npm install -g vercel
vercel --prod
```

### Option 2: Vercel Dashboard
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Set Root Directory: `backend-shloksagar`
4. Framework Preset: Other
5. Build Command: `npm run vercel-build`
6. Output Directory: (leave empty)
7. Install Command: `npm install`

## 🔐 Environment Variables (CRITICAL)

Add these in Vercel Dashboard → Settings → Environment Variables:

```
NODE_ENV=production
PORT=3000
FRONTEND_URL=<your-frontend-url>
ADMIN_URL=<your-admin-url>
SUPABASE_URL=<your-supabase-url>
SUPABASE_KEY=<your-supabase-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
FIREBASE_ADMIN_PROJECT_ID=<firebase-project-id>
FIREBASE_ADMIN_CLIENT_EMAIL=<firebase-client-email>
FIREBASE_ADMIN_PRIVATE_KEY=<firebase-private-key>
JWT_SECRET=<your-jwt-secret>
ADMIN_SECRET_KEY=<your-admin-key>
GOOGLE_CLIENT_ID=<google-client-id>
GOOGLE_CLIENT_SECRET=<google-client-secret>
GOOGLE_CALLBACK_URL=<vercel-backend-url>/auth/google/callback
```

## 🎯 API Endpoints (Unchanged)

All endpoints work exactly as before:

- **Public API**: `https://your-backend.vercel.app/api/v1/public/*`
- **Admin Auth**: `https://your-backend.vercel.app/api/v1/admin/auth/*`
- **Admin API**: `https://your-backend.vercel.app/api/v1/admin/*`
- **Google OAuth**: `https://your-backend.vercel.app/auth/google`
- **Health Check**: `https://your-backend.vercel.app/health`

## ✅ What Still Works

- ✅ All routes (public, admin, admin-auth)
- ✅ Authentication (JWT, Firebase, Google OAuth)
- ✅ Supabase database operations
- ✅ File uploads (Cloudinary)
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ All middleware
- ✅ All controllers
- ✅ All services

## 📂 Folder Structure (UNCHANGED)

```
backend-shloksagar/
├── src/               ✅ All your business logic stays here
│   ├── config/        ✅ Unchanged
│   ├── controllers/   ✅ Unchanged
│   ├── middleware/    ✅ Unchanged
│   ├── routes/        ✅ Unchanged
│   ├── services/      ✅ Unchanged
│   ├── types/         ✅ Unchanged
│   ├── utils/         ✅ Unchanged
│   ├── app.ts         ✅ Unchanged (Express setup)
│   └── index.ts       ⚠️  MODIFIED (removed server startup)
├── api/               🆕 NEW (serverless wrapper)
│   └── index.ts       🆕 NEW (exports Express app)
├── migrations/        ✅ Unchanged
├── scripts/           ✅ Unchanged
├── package.json       ⚠️  MODIFIED (added vercel-build)
├── tsconfig.json      ⚠️  MODIFIED (includes api folder)
├── vercel.json        🆕 NEW (routing config)
└── .vercelignore      🆕 NEW (deployment optimization)
```

## 🧪 Testing Locally

Test the serverless setup locally:
```bash
npm install -g vercel
vercel dev
```

This will run your backend on `http://localhost:3000`

## 🔥 Post-Deployment Checklist

1. ✅ Verify health endpoint: `https://your-backend.vercel.app/health`
2. ✅ Test public API endpoints
3. ✅ Test admin authentication
4. ✅ Test Google OAuth callback
5. ✅ Check Vercel logs for any errors
6. ✅ Update frontend/admin URLs to use new backend URL

## 📊 Monitoring

- View logs: Vercel Dashboard → Your Project → Logs
- Function analytics: Vercel Dashboard → Your Project → Analytics
- Runtime: Node.js (automatically detected)

## ⚠️ Important Notes

1. **Serverless Functions**: Each request is stateless
2. **Cold Starts**: First request after inactivity may be slower
3. **Timeouts**: Max execution time is 10 seconds (Hobby), 60 seconds (Pro)
4. **Database Connections**: Use connection pooling (already implemented with Supabase)

## 🐛 Troubleshooting

### Build Fails
- Check Vercel build logs
- Ensure all environment variables are set
- Verify TypeScript compilation: `npm run build`

### Routes Not Working
- Check `vercel.json` routing configuration
- Ensure `api/index.ts` exports the Express app

### CORS Errors
- Update `FRONTEND_URL` and `ADMIN_URL` in environment variables
- Check CORS configuration in `src/app.ts`

## 📞 Support

If deployment fails, check:
1. Vercel build logs
2. Environment variables are correctly set
3. Dependencies are installed
4. TypeScript compiles without errors

---

**✅ Your backend is now serverless-ready!**
