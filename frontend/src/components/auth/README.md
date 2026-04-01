# Auth Components

Auth UI components live here.

## Files
- `AuthPages.jsx` -> Login, Forgot Password, Reset Password
- `DirectorSignup.jsx` -> director onboarding flow

## Auth flow
1. sanitize input
2. validate email/password
3. call `/auth/*` APIs
4. save tokens and user in session
5. redirect to role dashboard

## Important code
```js
const safeEmail = sanitizeInput(email).toLowerCase();
```

```js
const validation = validatePassword(password);
if (!validation.isValid) return;
```
