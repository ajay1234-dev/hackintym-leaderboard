# Vercel Deployment Guide

## Prerequisites
- Vercel account
- Firebase project with Firestore database
- Git repository (GitHub, GitLab, or Bitbucket)

## Environment Variables Setup

1. **Firebase Configuration**
   Go to your Firebase project settings and copy the configuration:
   
   ```bash
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

2. **Set Environment Variables in Vercel**
   - Go to your Vercel project dashboard
   - Navigate to Settings → Environment Variables
   - Add all the Firebase environment variables above

## Deployment Steps

### Option 1: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project root
vercel --prod
```

### Option 2: Git Integration
1. Push your code to your Git repository
2. Import the project in Vercel
3. Configure environment variables
4. Deploy automatically on push

### Option 3: Vercel Dashboard
1. Click "Add New..." → "Project"
2. Import your Git repository
3. Add environment variables
4. Click "Deploy"

## Configuration Files

### `vercel.json`
The project includes a `vercel.json` file with:
- Build optimization settings
- Security headers
- Caching strategies
- Regional deployment (Singapore region)

### `next.config.ts`
Optimized for Vercel with:
- Static export configuration
- Image optimization
- Performance settings
- Security headers

## Mobile Optimization

The application is fully responsive with:
- ✅ Mobile-first design approach
- ✅ Touch-friendly interfaces
- ✅ Optimized animations for mobile devices
- ✅ Responsive celebration system
- ✅ Proper viewport configuration

## Performance Features

- ✅ Optimized bundle size
- ✅ Image optimization
- ✅ Caching strategies
- ✅ Performance monitoring ready
- ✅ SEO optimized meta tags

## Firebase Security Rules

Make sure to set up proper Firestore security rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Read access for all users (modify as needed)
    match /{document=**} {
      allow read: true;
      allow write: if request.auth != null;
    }
  }
}
```

## Troubleshooting

### Build Issues
- Check all environment variables are set
- Verify Firebase configuration is correct
- Ensure all dependencies are installed

### Runtime Issues
- Check Firebase security rules
- Verify environment variables in production
- Check Vercel function logs

### Mobile Issues
- Test on actual mobile devices
- Check viewport configuration
- Verify touch interactions

## Post-Deployment Checklist

- [ ] Environment variables configured
- [ ] Firebase security rules set
- [ ] Mobile responsiveness tested
- [ ] Celebration system working
- [ ] Real-time updates functioning
- [ ] Performance monitoring enabled

## Monitoring

Use Vercel Analytics to monitor:
- Page load times
- User engagement
- Error rates
- Mobile performance

## Support

For issues:
1. Check Vercel deployment logs
2. Verify Firebase configuration
3. Test environment variables locally
4. Review browser console for errors
