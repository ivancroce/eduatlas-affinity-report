# 🚀 Environment Setup & Deployment Guide

How to set up the project locally, configure environment variables, and deploy to production.

---

## Prerequisites

| Tool         | Version     | Purpose              |
| :----------- | :---------- | :------------------- |
| **Node.js**  | 18+         | Frontend runtime     |
| **Java JDK** | 21          | Backend runtime      |
| **PostgreSQL** | 17 (any 12+ works) | Database      |
| **Git**      | Any         | Version control      |

---

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/ivancroce/eduatlas-affinity-report.git
cd eduatlas-affinity-report
```

### 2. Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE eduatlas_affinity_report_db;
```

The tables are auto-created by Hibernate (`ddl-auto=update`).

### 3. Backend Configuration

Create `backend/.env.properties` (this file is git-ignored):

```properties
# Server
SERVER_PORT=3001

# PostgreSQL
PG_USERNAME=postgres
PG_PASSWORD=your_password
JDBC_URI=jdbc:postgresql://localhost:5432/eduatlas_affinity_report_db

# JWT
JWT_SECRET=your_very_long_random_secret_string_at_least_32_chars
JWT_EXPIRATION=86400000

# Default Admin Account (created on first startup)
admin.username=admin
admin.email=admin@example.com
admin.password=your_admin_password
admin.first-name=Admin
admin.last-name=User

# Mailgun (optional — needed only for feedback emails)
MAILGUN_API_KEY=x
MAILGUN_DOMAIN_NAME=x
MAILGUN_SENDER_EMAIL=x
```

### 4. Start the Backend

```powershell
# From the project root
cd backend
.\mvnw.cmd spring-boot:run
```

On macOS/Linux:
```bash
cd backend
./mvnw spring-boot:run
```

First startup will:
1. Auto-create database tables
2. Import countries/programs from `data/matrix.xlsx`
3. Create the admin user

Backend is now at: **http://localhost:3001**

### 5. Frontend Configuration

Create `frontend/.env` (or `.env.local`):

```
VITE_API_BASE_URL=http://localhost:3001/api
```

### 6. Start the Frontend

```bash
# From the project root
cd frontend
npm install
npm run dev
```

Frontend is now at: **http://localhost:5173**

---

## Local URLs

| Service      | URL                                         |
| :----------- | :------------------------------------------ |
| Frontend     | http://localhost:5173                        |
| Backend API  | http://localhost:3001                        |
| Swagger UI   | http://localhost:3001/swagger-ui/index.html  |

---

## Production Deployment

### Architecture

```
User → Netlify (Frontend SPA) → Koyeb (Spring Boot API) → Koyeb (PostgreSQL)
```

### Frontend (Netlify)

1. **Build command**: `npm run build` (from `frontend/`)
2. **Publish directory**: `frontend/dist`
3. **Environment variable**: Set `VITE_API_BASE_URL` to the Koyeb backend URL + `/api`
4. **SPA routing**: A `_redirects` file exists at `frontend/public/_redirects`:
   ```
   /* /index.html 200
   ```
   This ensures that all client-side routes work on page refresh.

### Backend (Koyeb)

The backend is deployed on Koyeb using Cloud Native Buildpacks (no Dockerfile needed).

1. Koyeb auto-detects the Java/Maven project and builds it
2. Set the following environment variables in the Koyeb dashboard:
   - `SERVER_PORT` (Koyeb typically uses 8000)
   - `PG_USERNAME`, `PG_PASSWORD`, `JDBC_URI`
   - `JWT_SECRET`, `JWT_EXPIRATION`
   - `MAILGUN_API_KEY`, `MAILGUN_DOMAIN_NAME`, `MAILGUN_SENDER_EMAIL`
   - `admin.username`, `admin.email`, `admin.password`, `admin.first-name`, `admin.last-name`

### Database (Koyeb PostgreSQL)

PostgreSQL is hosted on Koyeb's managed database service. The `JDBC_URI` is provided by Koyeb.

### Production URLs

| Component    | URL                                                                 |
| :----------- | :------------------------------------------------------------------ |
| Live App     | https://eduatlas-affinity-report.netlify.app                        |
| Backend API  | https://extraordinary-greer-ictech-3392249e.koyeb.app               |
| Swagger UI   | https://extraordinary-greer-ictech-3392249e.koyeb.app/swagger-ui/index.html |

> **Note**: The backend is on a free tier — the first request may take ~30 seconds as the server wakes up.

---

## CORS Configuration

The backend explicitly allows these origins in `SecurityConfig.java`:

- `http://localhost:5173` (Vite dev server)
- `http://localhost:4173` (Vite preview)
- `https://eduatlas-affinity-report.netlify.app` (production frontend)
- `https://extraordinary-greer-ictech-3392249e.koyeb.app` (production backend/Swagger)

If you deploy the frontend to a new domain, add it to the CORS origins in `SecurityConfig.java`.

---

## Common Issues

### Backend won't start
- Check that PostgreSQL is running and the `JDBC_URI` is correct
- Ensure `.env.properties` exists in `backend/` with all required variables
- Check the Java version: `java -version` should show 21+

### Frontend can't reach the API
- Verify `VITE_API_BASE_URL` matches the backend's actual URL + `/api`
- Check browser console for CORS errors → add your origin to `SecurityConfig.java`
- Check if the backend is running on the expected port

### "Unauthorized" errors
- Make sure `JWT_SECRET` is the same between env file and running server
- Ensure the token hasn't expired (default TTL: 24 hours)
- Check that the user's role matches the endpoint's `@PreAuthorize` requirement

### Excel import errors on startup
- The file `backend/src/main/resources/data/matrix.xlsx` must be present
- Import is idempotent (safe to re-run) — it skips existing countries

### SPA routing breaks on Netlify refresh
- Ensure `frontend/public/_redirects` contains `/* /index.html 200`
- After `npm run build`, verify this file is in `dist/_redirects`
