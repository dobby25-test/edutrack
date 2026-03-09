# EduTrack

EduTrack is a full-stack academic project and assignment platform for three roles:
- Director
- Teacher
- Student

It manages the full classroom workflow from project creation to submission, grading, analytics, leaderboard rokanking, badges, notifications, and profile management.

## What EduTrack Solves

EduTrack helps institutions run practical, project-based learning with a single system:
- Teachers can create, assign, review, and grade projects.
- Students can track assignments, submit code, and view feedback.
- Directors can manage users at scale and monitor institution-level performance.

## Key Features

### 1) Role-based access and dashboards
- Secure JWT authentication with role-based route protection.
- Dedicated dashboards for Director, Teacher, and Student.
- Protected frontend routes using role checks.

### 2) Authentication and account lifecycle
- Login and logout.
- Student self-registration.
- Director registration with access-code verification.
- Password reset flow (`forgot-password` and token-based reset).
- Access token refresh using refresh tokens.

### 3) Teacher features
- Create projects with due dates, marks, subject, and requirements.
- Assign projects to selected students (with duplicate-assignment protection).
- View project submission status (assigned/submitted/graded).
- Grade submissions with marks and teacher feedback.
- Reports view for project progress.

### 4) Student features
- View personal assignments with status tracking.
- Search, filter, and sort assignments by status/subject/deadline.
- Submit code and text responses from an integrated editor.
- Resubmit work when allowed.
- View marks, teacher feedback, and progress metrics.

### 5) Director features
- Create teacher/student accounts.
- Update and delete users.
- Bulk user import via CSV and downloadable CSV template.
- Institution-level stats and project visibility.
- Department, teacher, student, and project analysis views.
- CSV report export from dashboard views.

### 6) Analytics and leaderboard
- Student analytics endpoint.
- Teacher analytics endpoint.
- Director analytics endpoint.
- Leaderboard scopes: overall, course, and section.
- My-rank endpoint for logged-in users.

### 7) Badges and notifications
- Teacher badge awarding.
- Automatic badge checks after grading.
- In-app notifications (read, read-all, delete).
- Email notifications for assignment and grading events.

### 8) Code execution support
- JDoodle-backed code execution API.
- Execution credits endpoint.
- Per-student daily run quota tracking (`STUDENT_DAILY_RUN_LIMIT`, default 5).

### 9) Profile and media support
- Fetch own profile and view other user profiles (role-limited).
- Upload/remove profile photo.
- Extended academic and personal profile fields supported in backend model logic.

### 10) Security and platform hardening
- Helmet security headers.
- CORS allowlist based on `CLIENT_URL`.
- API and auth rate limiters.
- Request payload size limits.
- Safe error responses without stack leakage.

## Tech Stack

### Frontend
- React 19
- Vite (Rolldown Vite)
- React Router
- Axios
- Chart.js + react-chartjs-2
- Monaco Editor

### Backend
- Node.js + Express
- Sequelize ORM
- PostgreSQL
- JWT auth
- SendGrid/Nodemailer + AWS SDK integrations (optional)

## Project Structure

```text
edutrack/
  backend/
    app.js
    server.js
    config/
    controllers/
    middleware/
    models/
    routes/
    services/
  frontend/
    src/
      components/
      services/
      hooks/
      utils/
```

## API Overview

### Auth (`/api/auth`)
- `POST /register`
- `POST /register-director`
- `POST /verify-access-code`
- `POST /login`
- `POST /forgot-password`
- `POST /reset-password/:token`
- `POST /refresh-token`
- `POST /logout`
- `GET /me`
- `POST /create-user` (director)
- `PUT /users/:userId` (director)
- `DELETE /users/:userId` (director)
- `GET /students` (teacher/director)
- `GET /all-users` (director)

### Projects (`/api/projects`)
- `GET /stats` (teacher)
- `GET /my-projects` (teacher)
- `POST /` (teacher)
- `POST /:projectId/assign` (teacher)
- `GET /:projectId/submissions` (teacher)
- `PUT /submissions/:submissionId/grade` (teacher)
- `GET /student/my-assignments` (student)
- `POST /student/assignments/:assignmentId/submit` (student)
- `POST /execute`
- `GET /execute/credits`
- `GET /director/stats` (director)
- `GET /all` (director)

### Other modules
- Analytics: `/api/analytics/*`
- Leaderboard: `/api/leaderboard`, `/api/leaderboard/my-rank`
- Notifications: `/api/notifications/*`
- Badges: `/api/badges/*`
- Profile: `/api/profile/*`
- Bulk import: `/api/bulk/*`
- Health: `GET /api/health`

## Local Setup

### Prerequisites
- Node.js 20.x
- npm 9+
- PostgreSQL 14+

### 1) Install dependencies
```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2) Configure environment files
Create and fill:
- `backend/.env` from `backend/.env.example`
- `frontend/.env` from `frontend/.env.example`

#### Backend important variables
- Server: `PORT`, `NODE_ENV`
- DB: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- JWT: `JWT_SECRET`, `JWT_EXPIRES_IN`, `REFRESH_TOKEN_TTL_DAYS`
- App: `CLIENT_URL`, `DIRECTOR_ACCESS_CODE`
- JDoodle: `JDOODLE_CLIENT_ID`, `JDOODLE_CLIENT_SECRET`
- Optional: SendGrid/AWS/email settings
- Optional run limit: `STUDENT_DAILY_RUN_LIMIT`

#### Frontend variables
- `VITE_API_URL`
- Optional JDoodle vars if needed by your frontend usage

### 3) Run the app
```bash
# terminal 1
cd backend
npm run dev

# terminal 2
cd frontend
npm run dev
```

### Local URLs
- Backend API: `http://localhost:5000`
- Health endpoint: `http://localhost:5000/api/health`
- Frontend: `http://localhost:5173`

## Typical Workflow

1. Director creates teacher/student users (single or bulk CSV).
2. Teacher creates projects and assigns students.
3. Students submit work (including code execution/testing).
4. Teacher grades submissions and provides feedback.
5. System updates badges, notifications, leaderboard, and analytics.
6. Director monitors institutional performance and exports reports.

## Quality Checks

### Backend
- `npm run dev`
- `npm start`

### Frontend
- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`

## Troubleshooting

- Database connection issues: verify PostgreSQL is running and `DB_*` values are correct.
- CORS errors: ensure `CLIENT_URL` includes your frontend origin(s), comma-separated.
- Authentication loops: clear old tokens and login again.
- Email not sending: verify SendGrid/SMTP credentials.
- Code execution failures: verify JDoodle credentials and daily run limits.

## Future Enhancements

- WebSocket real-time updates for grading and notifications.
- Advanced analytics filters (date/semester/session).
- More automated tests for critical API and dashboard flows.
- Pagination and archival controls for large datasets.

## Screenshots

Add your product screenshots in this section for quick project preview.

Suggested images:
- Login page
- Student dashboard
- Teacher dashboard
- Director dashboard
- Leaderboard / Notifications panel

Example markdown:

```md
![Login](./docs/screenshots/login.png)
![Student Dashboard](./docs/screenshots/student-dashboard.png)
![Teacher Dashboard](./docs/screenshots/teacher-dashboard.png)
![Director Dashboard](./docs/screenshots/director-dashboard.png)
![Leaderboard](./docs/screenshots/leaderboard.png)
```

Tip: Create a `docs/screenshots/` folder and keep image file names lowercase with hyphens.

## Demo Accounts

Use separate demo users per role for local testing.

```text
Director
  Email: director@demo.com
  Password: Demo@123

Teacher
  Email: teacher@demo.com
  Password: Demo@123

Student
  Email: student@demo.com
  Password: Demo@123
```

Notes:
- Passwords must satisfy the backend policy (uppercase, lowercase, number, symbol, minimum length).
- You can create these users from Director dashboard or via API.
- Do not use demo credentials in production.

## Deployment

This project is split into two deployable apps:
- Frontend (Vite/React)
- Backend (Node/Express API)

### 1) Backend deployment checklist

Set these environment variables in your backend hosting platform:
- `NODE_ENV=production`
- `PORT`
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `JWT_SECRET`, `JWT_EXPIRES_IN`, `REFRESH_TOKEN_TTL_DAYS`
- `CLIENT_URL` (frontend domain; comma-separate multiple allowed origins)
- `DIRECTOR_ACCESS_CODE`
- `JDOODLE_CLIENT_ID`, `JDOODLE_CLIENT_SECRET`
- Optional email vars: `SENDGRID_API_KEY`, `FROM_EMAIL`, `EMAIL_SERVICE`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_FROM`
- Optional storage vars: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET`
- Optional quota: `STUDENT_DAILY_RUN_LIMIT`

Backend post-deploy validation:
- `GET /api/health` returns success
- CORS allows your frontend domain
- Database connection is successful

### 2) Frontend deployment checklist

Set frontend env:
- `VITE_API_URL=https://<your-backend-domain>/api`

Frontend post-deploy validation:
- Login works
- Role routes (`/student`, `/teacher`, `/director`) load correctly
- API calls resolve to the deployed backend

### 3) Vercel notes (if using Vercel)

- Keep frontend and backend as separate Vercel projects.
- Configure env vars per project (Production/Preview/Development as needed).
- Ensure frontend `VITE_API_URL` points to backend production URL.
- Ensure backend `CLIENT_URL` includes frontend production origin.

## Contributing

Contributions are welcome. Keep changes focused, tested, and documented.

### Workflow

1. Fork or create a feature branch from `main`.
2. Use clear branch names, for example:
   - `feature/director-user-filters`
   - `fix/auth-refresh-token`
   - `docs/readme-update`
3. Make scoped commits with descriptive messages.
4. Run checks before opening a PR.
5. Open a pull request with summary, screenshots (if UI change), and test notes.

### Recommended pre-PR checks

Backend:
- `npm run dev` starts without runtime errors.

Frontend:
- `npm run lint`
- `npm run build`
- `npm run dev` for manual UI sanity checks.

### Pull Request checklist

- Explain what changed and why.
- Mention impacted roles (Director/Teacher/Student).
- Add API updates to README when routes change.
- Add screenshots for UI changes.
- Confirm no secrets are committed.
