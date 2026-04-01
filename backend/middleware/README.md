# Middleware

Middleware is the security and validation layer.

## Files
- `auth.js` -> token and role checks
- `validation.js` -> request input validation
- `rateLimiter.js` -> abuse protection

## How it works
1. `authenticateToken` checks JWT.
2. `checkRole` verifies role permission.
3. validation middleware checks request fields.
4. limiter blocks too many requests.

## Important code
```js
const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.user = await User.findByPk(decoded.userId, { attributes: { exclude: ['password'] } });
```

```js
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5 });
```
