# Backend Module Guide

`backend/` is the server side of EduTrack.

It handles:
- login and token security
- project creation/assignment/submission/grading
- analytics and leaderboard
- profile, badges, notifications
- database operations

## Main files
- `app.js` -> Express app setup (middlewares + routes)
- `server.js` -> local server start
- `api/all.js` -> serverless entry
- `config/database.js` -> DB connection

## Backend flow
1. Request comes to route.
2. Middleware checks token/role/input.
3. Controller runs business logic.
4. Model reads/writes database.
5. Service sends email/notification if needed.

## Important code
```js
// app.js
app.use('/api', apiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
```

```js
// app.js
const { sequelize, testConnection } = require('./config/database');
await testConnection();
```

## Why this structure is good
Each layer has clear responsibility, so code is easier to maintain.
