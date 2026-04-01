# Shared Components

Reusable UI components used by many pages.

## Files
- `LogoLoader.jsx`
- `Notificationcenter.jsx`
- `Leaderboard.jsx`

## Shared behavior
- notification center fetches and updates notification state
- leaderboard supports overall/course/section ranking filters
- theme updates are synced via global theme utility event

## Important code
```js
const intervalId = setInterval(() => { void run(); }, 30000);
```

```js
await api.put('/notifications/read-all');
await api.delete(`/notifications/${id}`);
```
