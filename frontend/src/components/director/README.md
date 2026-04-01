# Director Components

Components for director-level operations.

## Files
- `UserManagement.jsx` -> create/edit/delete users + bulk CSV import
- `DirectorProfile.jsx` -> profile stats + badge view + photo upload

## Director flow
1. load users and dashboard stats
2. manage accounts (single or bulk)
3. monitor project/department summaries
4. export report CSV from dashboard

## Important code
```js
await api.post('/bulk/import-users', { users });
await api.put(`/auth/users/${editingId}`, payload);
await api.delete(`/auth/users/${user.id}`);
```
