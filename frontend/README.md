# Frontend Module Guide

`frontend/` is the React client of EduTrack.

## Main files
- `src/main.jsx` -> app start
- `src/App.jsx` -> route setup
- `src/components/ProtectedRoute.jsx` -> auth + role guard
- `src/services/api.js` -> Axios client
- `src/services/authService.js` -> session helper

## Frontend flow
1. app starts from `main.jsx`
2. routes load from `App.jsx`
3. protected pages check login and role
4. dashboard components call service layer
5. service layer calls backend APIs

## Important code
```jsx
<Route path="/student/*" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
```

```js
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

```js
const refreshResponse = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
```
