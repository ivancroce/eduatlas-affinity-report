# 📖 EduAtlas — Project Overview

## What Is This Project?

**EduAtlas Affinity Report System** is a Full Stack capstone project for Westcliff University.  
It solves a real administrative problem: **comparing international Bachelor's degree programs** to determine academic compatibility between different education systems.

The system takes two countries, compares their degree durations, ECTS credits, credit ratios, and EQF levels, then calculates an **"Affinity Score"** and generates a downloadable PDF report.

---

## High-Level Architecture

```
┌───────────────────────────┐         ┌──────────────────────────────┐
│       FRONTEND            │  HTTP   │          BACKEND             │
│   React 19 + Vite 7       │────────▶│   Spring Boot 3.5.8 (Java 21)│
│   (Netlify)               │◀────────│   (Koyeb)                   │
└───────────────────────────┘   JSON  └────────────┬─────────────────┘
                                                   │ JPA / Hibernate
                                                   ▼
                                          ┌────────────────┐
                                          │  PostgreSQL 17  │
                                          │  (Koyeb)        │
                                          └────────────────┘
```

| Layer       | Technology                     | Hosted On  |
| :---------- | :----------------------------- | :--------- |
| **Frontend** | React 19, Vite 7, React Bootstrap 5, SASS, Chart.js | Netlify   |
| **Backend**  | Java 21, Spring Boot 3.5.8, Spring Security, JWT    | Koyeb     |
| **Database** | PostgreSQL 17, Spring Data JPA (Hibernate)          | Koyeb     |

---

## Project Structure (Monorepo)

```
eduatlas-affinity-report/
├── backend/                 ← Spring Boot application (Maven)
│   ├── pom.xml              ← Maven dependencies
│   ├── .env.properties      ← Environment variables (not committed)
│   └── src/main/
│       ├── java/com/ivancroce/backend/
│       │   ├── config/          ← SecurityConfig, OpenApiConfig
│       │   ├── controllers/     ← REST endpoints (5 controllers)
│       │   ├── entities/        ← JPA entities (Country, BachelorProgram, User)
│       │   ├── enums/           ← Role enum (USER, ADMIN, STUDENT)
│       │   ├── exceptions/      ← Custom exceptions + global handler
│       │   ├── payloads/        ← DTOs for request/response
│       │   ├── repositories/    ← Spring Data JPA repositories
│       │   ├── runners/         ← DataInitializer (startup seed)
│       │   ├── security/        ← JWTCheckerFilter (auth filter)
│       │   ├── services/        ← Business logic (5 services)
│       │   └── tools/           ← JWTTools, MailgunSender
│       └── resources/
│           ├── application.properties
│           └── data/matrix.xlsx ← Source data for import
│
├── frontend/                ← React + Vite application
│   ├── package.json         ← NPM dependencies
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── App.jsx          ← Root component + routing
│       ├── main.jsx         ← Entry point
│       ├── api/axios.js     ← Axios instance (base URL + JWT interceptor)
│       ├── hooks/           ← useAvailableHeight custom hook
│       ├── components/      ← 10 reusable components
│       ├── pages/           ← 6 page components
│       └── styles/          ← Global SCSS
│
├── README.md
└── .gitignore
```

---

## User Roles

| Role       | Access                                                        |
| :--------- | :------------------------------------------------------------ |
| **Public** | Home page, generate affinity report, submit feedback          |
| **ADMIN**  | Full CRUD on countries, bachelor programs, and users via Admin Dashboard |
| **STUDENT** | Student Dashboard (placeholder — "Coming soon...")           |

---

## Core User Flows

### 1. Public — Generate Affinity Report
1. User visits the **Home Page** (`/`)
2. Selects two countries from dropdown menus
3. Clicks "Generate Affinity Report"
4. Frontend fetches country data, representative programs, and special-program flags from the API (6 parallel requests)
5. Navigates to `/affinity-report` passing all the data via React Router state
6. **AffinityReportPage** calculates affinity scores client-side and displays the comparison table + doughnut chart
7. User can **Print**, **Share**, or **Download PDF** (via `html2canvas` + `jsPDF`)

### 2. Admin — Manage Data
1. Admin navigates to `/login`, enters email + password
2. Backend validates credentials, returns a JWT token
3. Frontend stores token in `localStorage`, decodes role, redirects to `/admin-dashboard`
4. Admin Dashboard has 3 tabs: **Countries**, **BA Programs**, **Users** — each providing paginated CRUD with search/filter

### 3. Feedback
1. From the Affinity Report page, user clicks "Report Issue or Give Feedback"
2. A modal collects feedback type, message, and optional email
3. Submitted via `POST /api/feedback` → backend sends email via Mailgun API

---

## The Affinity Algorithm (Client-Side)

The affinity score is calculated in `AffinityReportPage.jsx` by comparing:

| Category            | How Affinity Is Calculated                                     | Levels              |
| :------------------ | :------------------------------------------------------------- | :------------------ |
| **Duration**        | `abs(dur1 - dur2)`: 0 → EQUIVALENT, 1 → MODERATE, else LOW    | EQUIVALENT / MODERATE / LOW |
| **Total Credits**   | Percentage difference: ≤10% → EQUIVALENT, ≤25% → MODERATE, else LOW | EQUIVALENT / MODERATE / LOW |
| **Credit Ratio**    | Exact match → EQUIVALENT, else MODERATE                        | EQUIVALENT / MODERATE |
| **EQF Level**       | `abs(eqf1 - eqf2)`: 0 → EQUIVALENT, 1 → MODERATE, else LOW   | EQUIVALENT / MODERATE / LOW |
| **Grading System**  | Always returns "CAN ALWAYS BE CONVERTED" (excluded from score) | — |

**Final Percentage**: `(EQUIVALENT × 100 + MODERATE × 60) / total_comparable_categories`  
**Overall Level**: Any LOW → LOW; all EQUIVALENT → EQUIVALENT; otherwise → MODERATE

---

## Data Seeding — The Excel Import Engine

On startup, `DataInitializer.java` runs:
1. **Excel Import** — `ExcelImportService.importCountriesFromExcel()` reads `data/matrix.xlsx` (an Excel matrix provided by Westcliff) using Apache POI
2. **Admin Creation** — Creates the default admin user from env variables if it doesn't already exist

The Excel parser is a highlight of the project:
- Handles asterisks (`13*` → `13`), pipe-separated values (`12|13*` → `13`)
- Parses grading systems with regex (German inverted scales vs. Italian ascending scales)
- Special case for Poland's 3.5-year engineering programs
- Auto-calculates missing ECTS values (`duration × creditsPerYear`)
- Skips countries that already exist in the database

---

## Key Dependencies

### Backend (Maven — `pom.xml`)
| Dependency                         | Purpose                                      |
| :--------------------------------- | :------------------------------------------- |
| `spring-boot-starter-web`          | REST API                                     |
| `spring-boot-starter-data-jpa`     | ORM / Database access                        |
| `spring-boot-starter-security`     | Authentication & authorization               |
| `spring-boot-starter-validation`   | DTO validation (`@NotNull`, `@Email`, etc.)  |
| `jjwt-api` / `jjwt-impl` / `jjwt-jackson` | JWT creation, signing, verification  |
| `poi-ooxml`                        | Apache POI — Excel file parsing              |
| `postgresql`                       | PostgreSQL JDBC driver                       |
| `springdoc-openapi-starter-webmvc-ui` | Swagger / OpenAPI documentation           |
| `unirest-java-core`               | HTTP client for Mailgun API calls            |
| `lombok`                           | Boilerplate reduction (`@Getter`, `@Setter`) |

### Frontend (NPM — `package.json`)
| Dependency           | Purpose                                       |
| :------------------- | :-------------------------------------------- |
| `react` / `react-dom` | UI framework                                 |
| `react-router-dom`   | Client-side routing                            |
| `axios`              | HTTP requests to backend                       |
| `react-bootstrap` / `bootstrap` | UI components & grid                  |
| `sass`               | SCSS stylesheet compilation                    |
| `chart.js` / `react-chartjs-2` | Doughnut chart for affinity visualization |
| `html2canvas`        | Screenshot DOM elements for PDF                |
| `jspdf`              | Generate PDF files client-side                 |
| `jwt-decode`         | Decode JWT tokens to read role/expiry          |
| `react-icons`        | Icon library                                   |
| `bootstrap-icons`    | Additional icons                               |
