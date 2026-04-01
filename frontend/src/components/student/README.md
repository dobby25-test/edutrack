# Student Components

Student profile and analytics components.

## Files
- `Studentprofile.jsx`
- `StudentAnalytics.jsx`

## Student flow
1. load profile and stats from `/profile/me`
2. load analytics from `/analytics/student/:id`
3. render chart data and progress insights
4. allow profile photo upload/remove

## Important code
```js
const res = await api.get(`/analytics/student/${user.id}`);
await api.post('/profile/upload-photo', { photoUrl: previewSrc });
```
