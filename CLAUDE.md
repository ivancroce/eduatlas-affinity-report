# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EduAtlas Affinity Report System — a full-stack app for comparing international Bachelor's degree programs to determine academic compatibility. Capstone project for Westcliff University. Compares duration, ECTS credits, credit ratios, and EQF levels to produce an "Affinity Score" and downloadable PDF report.

## Repository Layout

Monorepo with two independent applications:

- `backend/` — Java 21, Spring Boot 3.5.8, Maven, PostgreSQL
- `frontend/` — React 19, Vite 7, React Bootstrap, SCSS
- `docs/` — 5 markdown files covering architecture, API reference, deployment (plus a `refactor/` subfolder with per-sprint implementation notes, committed alongside each sprint)

## Build & Run Commands

### Backend (from `backend/`)

```bash
# Run (Windows)
./mvnw.cmd spring-boot:run

# Run (macOS/Linux/Git Bash)
./mvnw spring-boot:run

# Build JAR
./mvnw clean package

# Run tests
./mvnw test
```

Requires `backend/.env.properties` with: `SERVER_PORT`, `PG_USERNAME`, `PG_PASSWORD`, `JDBC_URI`, `JWT_SECRET`, `JWT_EXPIRATION`, `MAILGUN_*`, and `admin.*` properties. See README.md for the full template.

### Frontend (from `frontend/`)

```bash
npm install         # install dependencies
npm run dev         # dev server at localhost:5173
npm run build       # production build to dist/
npm run preview     # preview production build
npm run lint        # ESLint
```

Requires `frontend/.env` with `VITE_API_BASE_URL=http://localhost:3001/api`.

## Architecture

### Backend

**Layered architecture**: Controllers → Services → Repositories → JPA Entities

- **Package root**: `com.ivancroce.backend`
- **Entities**: `Country` (has many `BachelorProgram`), `BachelorProgram`, `User` (implements `UserDetails`)
- **Controllers**: `AuthController` (`/api/auth`), `CountryController` (`/api/countries`), `BachelorProgramController` (`/api/bachelor-programs`), `UserController` (`/api/users`), `FeedbackController` (`/api/feedback`)
- **Key public endpoint**: `GET /api/countries/comparison?c1=IT&c2=IE` — accepts ISO 2-letter country codes, returns a `CountryComparisonRespDTO` containing both countries, their representative programs, and whether each has special programs. Designed to replace the 6 parallel calls previously made by the frontend. Validates that codes are not equal (same-country comparison → 400).
- **Security**: Stateless JWT auth via `JWTCheckerFilter`. Public endpoints are explicitly listed in the filter's `shouldNotFilter()`. Fine-grained access control uses `@PreAuthorize` on controller methods. BCrypt(12) for passwords. Important: `JWTCheckerFilter` wraps its logic in try-catch and writes 401 JSON directly to the response — filters run before `DispatcherServlet` so `@RestControllerAdvice` does not catch their exceptions.
- **Data seeding**: `DataInitializer` (CommandLineRunner) imports countries/programs from `resources/data/matrix.xlsx` using `ExcelImportService` on startup. Idempotent — skips existing countries.
- **Key business logic**: `BachelorProgramService.getRepresentativeProgramForCountry()` finds the representative program (duration = 16 - yearsCompulsorySchooling, non-special) with longest-duration fallback.
- **DTOs**: Separate request/response payloads in `payloads/` package. Passwords are never exposed in responses. Validation annotations (`@NotBlank`, `@Positive`, etc.) go on **request** DTOs only — response DTOs have no validation.
- **Dynamic queries**: JPA Specification pattern for search/filter on Countries and Users.
- **Error handling**: `@ControllerAdvice` `ExceptionsHandler` maps custom exceptions to HTTP status codes, including `ConstraintViolationException` (400) for `@Positive`/`@NotBlank` violations on method params and `MissingServletRequestParameterException` (400) for missing required `@RequestParam`s. `TooManyRequestsException` returns 429 with a `Retry-After` header via `ResponseEntity` (not `@ResponseStatus`) so the header can be set.
- **Rate limiting**: `FeedbackRateLimiter` (@Service) uses Bucket4j 8.10.1 to enforce two in-memory token bucket limits on `POST /api/feedback`: 3 requests/min per IP (`refillIntervally` hard window) and 100 requests/day globally. IP is extracted from the rightmost `X-Forwarded-For` value (Koyeb-appended; leftmost is client-controlled/spoofable), falling back to `getRemoteAddr()`. IPv6 loopback forms (`::1`, `0:0:0:0:0:0:0:1`) are normalized to `127.0.0.1`. Stale per-IP buckets are evicted every 10 minutes via `@Scheduled`. `@EnableScheduling` is on the main application class.
- **Tests**: `backend/src/test/java/com/ivancroce/backend/services/FeedbackRateLimiterTest.java` — 10 unit tests (no Spring context) covering `extractIp` (XFF spoofing, IPv6 normalization) and `checkAllowed` (limits, independent IPs, cleanup eviction). Maven Surefire configured with `-XX:+EnableDynamicAgentLoading` to suppress Mockito JDK 21 agent warnings.
- **Swagger / OpenAPI**: `OpenApiConfig` declares a `bearerAuth` HTTP Bearer scheme with a global security requirement (all endpoints require a token by default). Public endpoints opt out with `@SecurityRequirements({})`. Groups (`public` / `admin`) use `pathsToMatch` / `pathsToExclude` — no `OperationCustomizer`. See `docs/refactor/07-swagger-openapi-hardening.md`.

### Frontend

- **Routing**: React Router v7 in `App.jsx`. Public routes (`/`, `/affinity-report`, `/login`) and protected routes (`/admin-dashboard`, `/student-dashboard`) guarded by `ProtectedRoute` component that checks JWT expiry and role.
- **API layer**: `api/axios.js` creates an Axios instance with base URL from env var and a request interceptor that attaches the JWT from `localStorage`.
- **Affinity algorithm**: Entirely client-side in `AffinityReportPage.jsx`. Compares duration, total credits, credit ratio, EQF level, and grading system convertibility. Final score = weighted average of EQUIVALENT (100%) and MODERATE (60%) ratings.
- **Data flow for reports**: `HomePage` validates the selection and navigates to `/affinity-report?c1=IT&c2=IE` (ISO 2-letter country codes). `AffinityReportPage` reads the codes from `useSearchParams()` and fetches from `GET /api/countries/comparison?c1=IT&c2=IE` in a `useEffect`. This makes the URL fully shareable — pasting it in a new tab loads the report fresh.
- **Grade comparison page**: `/grade-comparison?c1=IT&c2=IE` shows a side-by-side ECTS grade band table (A/B/C/D-E/F) for both countries. Data comes from a static `frontend/src/data/gradingScales.js` lookup keyed by ISO country code. Accessed via the "COMPARE GRADING SCALES →" badge in the affinity report's Grading System row.
- **PDF export**: Client-side using `html2canvas` + `jsPDF`.
- **Admin dashboard**: Tabbed interface with `CountriesManagement`, `BachelorProgramsManagement`, `UsersManagement` — all with paginated tables, search, and CRUD modals.
- **Auth state**: Managed by `AuthContext` (React Context API). `MyNavBar` reads from context directly — no event bus. `api/axios.js` has a response interceptor that clears localStorage and redirects to `/login` on any 401.
- **Feedback rate limit UX**: `FeedbackModal` handles 429 responses by reading the `Retry-After` header and running a live countdown (`retryCountdown` state + `setInterval` via `useRef`). The submit button is disabled and shows "Wait Xs" during the cooldown.

### Deployment

- Frontend → Netlify (with `_redirects` for SPA routing)
- Backend → Koyeb (Cloud Native Buildpacks, no Dockerfile)
- Database → Koyeb managed PostgreSQL

### CORS

Allowed origins are hardcoded in `SecurityConfig.java`: localhost dev ports (5173, 4173) and production Netlify/Koyeb URLs. Update this when deployment URLs change.

## Key Conventions

- Environment config is externalized via `.env.properties` (backend) and `.env` (frontend) — these are gitignored
- Hibernate `ddl-auto=update` manages schema — no migration files
- All backend env vars are referenced in `application.properties` via `${VAR_NAME}` syntax
- Frontend env vars must be prefixed with `VITE_`
- `User.getUsername()` returns the email (Spring Security convention); `getUsernameField()` returns the actual username
- Swagger UI available at `/swagger-ui/index.html`; API docs split into "public" and "admin" groups via `OpenApiConfig`

## Trello Board (Sprint Tracking)

The project uses Trello for sprint tracking: https://trello.com/b/w6ZoXUaT/eduatlas-affinity-report-system

Board list structure:
- **📓 Backlog** — next sprint(s) to pick up, ordered by priority (top card = highest priority)
- **🚧 In Progress** — active work
- **✅ Done - v1.0 / v2.0 / v3.0** — completed sprints, grouped by version
- **💡 Ideas & Future (v4.0)** — deferred improvements, not currently scheduled
- **🐛 Bugs & Issues** — defects found in production or testing

When a sprint is merged to `develop`: move its Trello card to the appropriate Done list and move the next Backlog card to In Progress.

## Refactor Documentation (`docs/refactor/`)

Files in `docs/refactor/` are **per-sprint implementation notes** — they are committed and pushed alongside each sprint's code changes.

**Rules:**
- Write the "why" from first principles: explain the problem, the risk, and the fix
- Every change must have: a file path, a before/after code snippet where relevant, and a plain-English "why"
- A refactor doc is scoped to one branch. Its filename matches the branch: `refactor/sprint-1-quick-wins` → `01-sprint-1-quick-wins.md`
- What was NOT changed is always documented explicitly at the bottom
- The doc must include a manual testing checklist so the branch can be verified before merging

**Never create branches or commit changes before the corresponding refactor doc exists and is reviewed.**

## Maintaining Accurate Documentation

**CRITICAL**: After any significant codebase update that is confirmed working and pushed to GitHub, immediately update CLAUDE.md to reflect the current state of the project. This prevents Claude from being confused by outdated information when working on future tasks.

- Update version numbers, dependencies, or tools if changed
- Update architecture descriptions if implementation patterns shifted
- Update configuration requirements if environment variables or setup changed
- Update API endpoints or controller routes if modified
- Remove references to deprecated code or removed features
- Update deployment information if servers, URLs, or processes changed

Keeping CLAUDE.md current ensures Claude Code has accurate context for all future work on this repository.
