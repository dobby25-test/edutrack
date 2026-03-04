# EduTrack

EduTrack is a full-stack project management platform for education workflows.

## Tech Stack
- Frontend: React + Vite
- Backend: Node.js + Express + Sequelize
- Database: PostgreSQL

## Project Structure
```text
edutrack/
  backend/
  frontend/
```

## Setup Steps

### 1. Prerequisites
- Node.js 18+
- npm 9+
- PostgreSQL 14+

### 2. Clone and Open Project
```bash
git clone <your-repo-url>
cd edutrack
```

### 3. Backend Setup
```bash
cd backend
npm install
copy .env.example .env
```

Update `backend/.env` with your database and secret values.

Start backend:
```bash
npm run dev
```

Backend runs at `http://localhost:5000`.
Health check: `http://localhost:5000/api/health`.

### 4. Frontend Setup
Open a new terminal:
```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Frontend runs at `http://localhost:5173`.

## Development Commands

### Backend (`backend/`)
- `npm run dev` - start in development mode with nodemon
- `npm start` - start in production mode

### Frontend (`frontend/`)
- `npm run dev` - start Vite dev server
- `npm run build` - build production bundle
- `npm run preview` - preview production build
- `npm run lint` - run ESLint

## Environment Notes
- Keep `CLIENT_URL=http://localhost:5173` in backend `.env` for local CORS.
- Frontend currently calls backend at `http://localhost:5000/api` (see `frontend/src/services/api.js`).

## API Base
- Backend API base: `http://localhost:5000/api`

## Troubleshooting
- If DB connection fails, verify PostgreSQL is running and `DB_*` values are correct.
- If CORS errors appear, ensure frontend URL is included in backend `CLIENT_URL`.
- If port conflicts happen, change `PORT` in backend `.env`.
