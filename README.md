# 🏥 Clinic Equipment & Sterilization Tracker

## 🚀 Start backend and frontend

Run these in **two terminals** from the project root. Ensure backend environment variables are set in `backend/.env` (copy `backend/.env.example` if needed).

**Terminal 1 — backend and database**

```bash
cd backend
npm install
docker compose up -d
npm run migration:run
npm run seed
npm run start:dev
```

**Terminal 2 — frontend**

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the frontend terminal (usually http://localhost:5173). The frontend proxies API requests to `http://localhost:3000`; Swagger docs are at http://localhost:3000/docs.

## 🧰 Backend

NestJS, PostgreSQL, TypeORM, JWT authentication, request validation, and Swagger API documentation.

- 🔐 **Auth & users** — Login, current-user profile, role-based access, and user administration.
- 🧼 **Equipment & instruments** — Manage clinic devices and instruments with searchable, filterable lists.
- 🛠️ **Maintenance** — Record service dates and intervals; calculate upcoming due dates.
- 🔥 **Sterilization** — Create batches, start cycles, and record pass/fail results while updating instrument status.
- 📎 **Attachments** — Upload and download JPEG, PNG, and PDF files for service records and batches.
- 📊 **Analytics & reports** — Operational metrics and downloadable HTML maintenance/sterilization reports.

Backend modules and application bootstrap are in `backend/src/`; database migrations and seed data are in `backend/src/database/`.

## 🖥️ Frontend pages

React, TypeScript, Vite, and Lucide icons. Sign in with a backend account; access is controlled by the user’s role.

- 🏠 **Dashboard** — View equipment, instrument, maintenance, and batch totals, plus maintenance watch and recent cycles.
- 📦 **Equipment** — Search, filter, create, edit, and delete equipment.
- ✂️ **Instruments** — Search, register, update, and track instrument status.
- 🔧 **Maintenance** — Review service records and due status; log and manage maintenance.
- 🔥 **Sterilization** — Create batches, select an active autoclave and available instruments, start cycles, and record results.
- 📈 **Analytics** — Review sterilization outcomes, equipment/instrument status, and maintenance due metrics.
- 📄 **Reports** — Generate reports for maintenance records and completed sterilization batches.
- 👥 **Users** — Administrators can create, edit, and delete clinic users.

Frontend source and development proxy configuration are in `frontend/src/` and `frontend/vite.config.ts`.
