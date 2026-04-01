# Frontend Services

Service layer for API calls and auth/session handling.

## Files
- `api.js`
- `authService.js`
- `projectService.js`
- `Jdoodleservice.js`

## How it works
- UI calls service functions
- service uses shared Axios client
- token is attached automatically
- token refresh runs automatically on 401

## Important code
```js
api.interceptors.request.use((config) => { ... });
api.interceptors.response.use((response) => response, async (error) => { ...refresh... });
```

```js
const response = await api.post('/projects/execute', { code, language, stdin });
```
