# API Deployment Adapter

This folder helps backend run in serverless mode.

## File
- `all.js`

## How it works
1. If route is `/api/health`, return quick success response.
2. Otherwise load app and check DB.
3. Forward request to Express app.

## Important code
```js
const { app, ensureDatabaseReady } = require('../app');
await ensureDatabaseReady();
return app(req, res);
```
