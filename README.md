# EduTrack

EduTrack is a full-stack academic project platform.

It has 3 roles:
- `Director`: manages users and views institute-level reports.
- `Teacher`: creates projects, assigns students, grades submissions.
- `Student`: receives assignments, writes code, submits work, sees feedback.

## Project Folders
- `frontend/` -> React app (what users see)
- `backend/` -> Express API (business logic + database access)
- `docs/` -> screenshots and report assets

## Simple End-to-End Working

### Login to dashboard flow
1. User opens login page in frontend.
2. Frontend sends login request to backend (`/api/auth/login`).
3. Backend verifies email/password.
4. Backend returns:
   - `access token` (short life)
   - `refresh token` (longer life)
   - user details (role, name, etc.)
5. Frontend stores tokens and sends user to role dashboard.

### Protected page flow
1. User opens `/student/*` or `/teacher/*` or `/director/*`.
2. `ProtectedRoute` checks if token is valid.
3. It also checks if role is allowed for that route.
4. If checks fail, user is redirected to login.

### Project lifecycle flow
1. Teacher creates a project.
2. Teacher assigns selected students.
3. Student opens assignment and submits code.
4. Teacher reviews and gives marks + feedback.
5. System updates status (`assigned -> submitted -> graded`) and sends notifications.

## Important Code (Explained)

### 1) Token pair creation
```js
// backend/controllers/authController.js
const issueTokenPair = async (user) => {
  const token = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken();
  await user.update({ refreshToken: hashToken(refreshToken), refreshExpires });
  return { token, refreshToken };
};
```
Meaning: backend creates both tokens and stores only hashed refresh token in DB for safety.

### 2) Auto token refresh on expiry
```js
// frontend/src/services/api.js
if (status === 401 && !originalRequest?._retry) {
  const refreshResponse = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
  setTokens(refreshResponse.data.token, refreshResponse.data.refreshToken);
  return api(originalRequest);
}
```
Meaning: if access token expires, frontend silently gets new tokens and retries the same API call.

### 3) Assignment status update
```js
// backend/controllers/projectController.js
await assignment.update({ status: 'submitted', submittedAt: new Date() });
await submission.update({ marks, teacherFeedback, status: 'graded' });
await Assignment.update({ status: 'graded', gradedAt: new Date() }, { where: { id: submission.assignmentId } });
```
Meaning: submission and assignment status are updated together for consistent tracking.

## Run Project Locally

```bash
# backend
cd backend
npm install
npm run dev

# frontend
cd ../frontend
npm install
npm run dev
```

URLs:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- Health check: `http://localhost:5000/api/health`

## For Report Writing
Use folder READMEs for deeper explanation:
- `backend/README.md`
- `frontend/README.md`
- `backend/routes/README.md`
- `backend/models/README.md`
- `backend/middleware/README.md`
