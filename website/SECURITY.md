# Security Guidelines

## API Keys & Secrets Management

### Current Setup

This application uses environment variables to manage sensitive credentials:

```bash
# Environment variables are loaded from .env file
VITE_FIREBASE_API_KEY=...
VITE_GEMINI_API_KEY=...
VITE_FIREBASE_VAPID_KEY=...
VITE_CLOUDINARY_CLOUD_NAME=...
```

**Important:** The `.env` file is in `.gitignore` and should **never be committed** to version control.

### For Development

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your actual API keys from the respective services:
   - **Firebase**: [Firebase Console](https://console.firebase.google.com) > Project Settings
   - **Gemini AI**: [Google AI Studio](https://aistudio.google.com/app/apikey)
   - **Cloudinary**: [Cloudinary Dashboard](https://console.cloudinary.com/)

### For Production Deployment

#### ⚠️ Critical Security Issues

1. **Client-Side API Keys Are Visible**
   - API keys in Vite environment variables (`VITE_*` prefix) are embedded in the built bundle
   - This means keys are visible in browser DevTools and network requests
   - Any user can inspect the frontend and find your API keys

2. **Recommended Solutions**

   **Option A: Backend Proxy (Recommended)**
   - Move API calls to a backend server
   - Backend proxy handles API authentication
   - Client never directly accesses APIs with secret keys
   - Frontend calls `/api/generateContent` instead of calling Gemini directly

   **Option B: API Key Restrictions**
   - Restrict API keys by domain/referrer in cloud provider settings
   - Set rate limits and usage quotas
   - Monitor usage for suspicious activity

   **Option C: Server-Side Environment Variables**
   - For Node.js backends, store keys in server-only environment variables
   - These are NOT embedded in the client bundle

#### Implementation Example: Backend Proxy for Gemini

Instead of calling Gemini directly from frontend:

```typescript
// ❌ UNSAFE - Key exposed
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
  { /* ... */ }
);
```

Use a backend proxy:

```typescript
// ✅ SAFE - No key exposure
const response = await fetch('/api/generateContent', {
  method: 'POST',
  body: JSON.stringify({ prompt: 'your prompt' })
});
```

Backend handler (`server.js` or Express):

```javascript
app.post('/api/generateContent', async (req, res) => {
  const { prompt } = req.body;
  
  // API key only on server, never exposed to client
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    }
  );
  
  const data = await response.json();
  res.json(data);
});
```

### Firestore Security Rules

Security rules are configured in `firestore.rules`:

- ✅ Admins-only access for sensitive collections (audit logs, admin data)
- ✅ Users can only read/update their own documents
- ✅ Partners can only read/update their own profiles
- ✅ Public read-only access for subscription plans
- ✅ Restrictions on notifications (only owner and admins)

### Environment Variables Checklist

Before deploying to production:

- [ ] Replace all placeholder values in `.env` with real API keys
- [ ] Ensure `.env` is in `.gitignore`
- [ ] Set up API key restrictions in cloud provider settings
- [ ] Consider implementing a backend proxy for sensitive APIs
- [ ] Enable HTTPS for all communications
- [ ] Monitor API key usage for unauthorized access
- [ ] Rotate keys regularly
- [ ] Use separate keys for development and production
- [ ] Store production keys securely (use hosted secret manager)

### Hosting Platform Secret Management

**Firebase Hosting:**
- Use Firebase Cloud Functions for backend proxy
- Set environment variables in Cloud Functions settings

**Vercel/Netlify:**
- Use platform's environment variable settings
- Keep sensitive vars as "secret" type

**AWS:**
- Use AWS Secrets Manager or Parameter Store
- Reference from Lambda functions

**Azure:**
- Use Azure Key Vault
- Reference from Azure Functions

### Monitoring & Alerts

1. **Set up billing alerts** on all API services
2. **Monitor usage patterns** for unusual spikes
3. **Enable audit logging** in Firebase
4. **Use CloudFare or similar CDN** to detect abnormal traffic

### References

- [Firebase Security Best Practices](https://firebase.google.com/docs/security)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [Google Cloud Security Best Practices](https://cloud.google.com/security/best-practices)
