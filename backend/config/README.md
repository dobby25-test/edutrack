# Backend Config

This folder contains configuration code.

## File
- `database.js`

## What it does
- connects Sequelize to PostgreSQL
- supports both `DATABASE_URL` and split DB env vars
- enables SSL options in production
- exports `sequelize` and `testConnection`

## Important code
```js
const sequelize = hasDatabaseUrl
  ? new Sequelize(process.env.DATABASE_URL, {...})
  : new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {...});
```

```js
await sequelize.authenticate();
```
