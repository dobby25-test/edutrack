# API Routes

Routes map API URLs to controller functions.

## Route files
- `auth.js`
- `project.js`
- `analytics.js`
- `badges.js`
- `leaderboard.js`
- `notification.js`
- `profile.js`
- `bulks.js`

## Route flow
1. URL matches route.
2. middleware runs.
3. controller handles logic.
4. JSON response returns.

## Important code
```js
router.post('/login', loginLimiter, validateLogin, login);
```

```js
router.post('/', authenticateToken, checkRole('teacher'), validateProject, createProject);
```

```js
router.post('/import-users', authenticateToken, checkRole('director'), bulkImportUsers);
```
