# EduTrack

EduTrack is a role-based academic project management platform for **Directors, Teachers, and Students**.
It combines assignment operations, grading, analytics, leaderboard ranking, badges, notifications, and code execution into one workflow.

## Why EduTrack
- Role-specific dashboards for Director, Teacher, and Student
- End-to-end assignment lifecycle: create -> assign -> submit -> grade
- Smart progress visibility with analytics and leaderboard
- In-app notifications plus email triggers
- Built-in code runner (JDoodle-backed) for practical coding submissions

## Core Workflow

### 1) Authentication and role routing
- Users sign in via `/api/auth/login`
- JWT token is attached by frontend interceptor (`frontend/src/services/api.js`)
- Access is controlled by middleware (`authenticateToken`, `checkRole`)

### 2) Teacher flow
1. Create project (`POST /api/projects`)
2. Assign students (`POST /api/projects/:projectId/assign`)
3. Monitor submissions (`GET /api/projects/:projectId/submissions`)
4. Grade work (`PUT /api/projects/submissions/:submissionId/grade`)
5. Trigger badge checks + notifications + email updates

### 3) Student flow
1. View assignments (`GET /api/projects/student/my-assignments`)
2. Filter/sort to prioritize work
3. Submit from editor (`POST /api/projects/student/assignments/:assignmentId/submit`)
4. Track grades, feedback, badges, leaderboard, and analytics

### 4) Director flow
1. Create/manage users (`/api/auth/create-user`, `/api/auth/users/:userId`)
2. Bulk import users (`POST /api/bulk/import-users`)
3. Review institution stats (`/api/projects/director/stats`, `/api/projects/all`)
4. Analyze performance by department/course and export CSV reports

## Filters and views (curated)

### Student Dashboard
- Search: title, subject, teacher, department
- Status: `assigned`, `in_progress`, `submitted`, `graded`
- Subject dropdown (dynamic)
- Sort: due soon, due late, newest

### Teacher - Student Selector
- Search: name, email, department
- Stream filter (derived from department)
- Batch-wise grouped student selection
- Actions: select visible, clear visible, assign visible

### Teacher - Submission Review
- Search: student name/email/department
- Status filter: not started, in progress, pending review, graded
- Department filter
- Language filter (auto-detected or saved)
- Sort: latest/oldest, marks high-low, student name A-Z

### Leaderboard
- Scope tabs: `Overall`, `My Course`, `My Section`
- Backend query filters: `course`, `section`, `limit`
- Points formula: `(averageScore * gradedAssignments) + (badges * 10)`

### Director Dashboard
- Global search for teachers/students/projects
- Department filter across datasets
- Project status filter: `active`, `completed`, `draft`, `archived`
- Chart-driven drill-down by department

## Tech Stack
- Frontend: React + Vite + Axios + Chart.js + Monaco Editor
- Backend: Node.js + Express + Sequelize
- Database: PostgreSQL
- Auth: JWT
- Notifications: DB notifications + email
- Code execution: JDoodle API

## Project Structure
```text
edutrack/
  backend/
    controllers/
    routes/
    models/
    services/
  frontend/
    src/components/
    src/services/
```

## API Map

### Auth
- `POST /api/auth/register` (student self-register)
- `POST /api/auth/register-director`
- `POST /api/auth/login`
- `POST /api/auth/create-user` (director)
- `GET /api/auth/students`
- `GET /api/auth/all-users` (director)

### Projects
- `GET /api/projects/stats` (teacher)
- `GET /api/projects/my-projects` (teacher)
- `POST /api/projects`
- `POST /api/projects/:projectId/assign`
- `GET /api/projects/:projectId/submissions`
- `PUT /api/projects/submissions/:submissionId/grade`
- `GET /api/projects/student/my-assignments` (student)
- `POST /api/projects/student/assignments/:assignmentId/submit` (student)
- `GET /api/projects/director/stats` (director)
- `GET /api/projects/all` (director)
- `POST /api/projects/execute`
- `GET /api/projects/execute/credits`

### Other modules
- Analytics: `/api/analytics/*`
- Leaderboard: `/api/leaderboard`, `/api/leaderboard/my-rank`
- Notifications: `/api/notifications/*`
- Badges: `/api/badges/*`
- Profile: `/api/profile/*`
- Bulk import: `/api/bulk/*`

## Local Setup

### Prerequisites
- Node.js 18+
- npm 9+
- PostgreSQL 14+

### 1) Clone and install
```bash
git clone <your-repo-url>
cd edutrack

cd backend
npm install
copy .env.example .env

cd ..\frontend
npm install
copy .env.example .env
```

### 2) Configure backend env (`backend/.env`)
Set values for:
- DB: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- JWT: `JWT_SECRET`, `JWT_EXPIRES_IN`
- App: `CLIENT_URL`, `DIRECTOR_ACCESS_CODE`
- Optional integrations: SendGrid/AWS/JDoodle credentials

### 3) Start apps
```bash
# terminal 1
cd backend
npm run dev

# terminal 2
cd frontend
npm run dev
```

- Backend: `http://localhost:5000`
- Health: `http://localhost:5000/api/health`
- Frontend: `http://localhost:5173`
- API base (frontend): `http://localhost:5000/api`

## Quality checks

### Backend
- `npm run dev`
- `npm start`

### Frontend
- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`

## Troubleshooting
- DB connection errors: verify PostgreSQL service and `DB_*` credentials
- CORS blocked: ensure frontend URL is in `CLIENT_URL`
- 401 loops: token may be expired; re-login clears local token state
- Code execution fails: verify `JDOODLE_CLIENT_ID` and `JDOODLE_CLIENT_SECRET`

## Roadmap Ideas
- Pagination for leaderboard and notifications
- More advanced analytics filters (date range, semester, department)
- WebSocket live updates for grading and notifications
- Automated test coverage for critical API paths
