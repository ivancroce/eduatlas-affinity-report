# ⚙️ Backend Architecture — Deep Dive

This document explains every layer of the Spring Boot backend so you can quickly understand what each file does and how they connect.

---

## Package Map

```
com.ivancroce.backend
├── EduAtlasAffinityReportBackendApplication.java   ← Spring Boot main class
├── config/
│   ├── SecurityConfig.java      ← Security filter chain, CORS, BCrypt
│   └── OpenApiConfig.java       ← Swagger/OpenAPI metadata
├── controllers/
│   ├── AuthController.java      ← POST /api/auth/login
│   ├── CountryController.java   ← Public + Admin CRUD for countries
│   ├── BachelorProgramController.java ← Admin CRUD for bachelor programs
│   ├── UserController.java      ← Admin CRUD for users + GET /me
│   └── FeedbackController.java  ← POST /api/feedback (Mailgun email)
├── entities/
│   ├── Country.java             ← JPA entity (countries table)
│   ├── BachelorProgram.java     ← JPA entity (bachelor_programs table)
│   └── User.java                ← JPA entity (users table) + UserDetails
├── enums/
│   └── Role.java                ← USER, ADMIN, STUDENT
├── exceptions/
│   ├── BadRequestException.java
│   ├── NotFoundException.java
│   ├── UnauthorizedException.java
│   ├── ValidationException.java
│   └── ExceptionsHandler.java   ← @ControllerAdvice global error handler
├── payloads/                    ← DTOs (all Java records)
│   ├── UserLoginDTO.java        ← Login request (email, password)
│   ├── UserLoginRespDTO.java    ← Login response (accessToken)
│   ├── UserRegistrationDTO.java ← Create user request
│   ├── UserUpdateDTO.java       ← Update user request
│   ├── UserRespDTO.java         ← Response with userId only
│   ├── UserDetailDTO.java       ← Full user response (no password)
│   ├── CountryRegistrationDTO.java ← Create/update country request
│   ├── CountryRespDTO.java      ← Simplified country (id, name, code)
│   ├── BachelorRegistrationDTO.java ← Create/update program request
│   ├── FeedbackRequest.java     ← Feedback submission
│   ├── FeedbackRespDTO.java     ← Feedback response
│   ├── ErrorDTO.java            ← Single error response
│   └── ErrorsWithListDTO.java   ← Validation errors list
├── repositories/
│   ├── CountryRepository.java   ← JpaRepository + JpaSpecificationExecutor
│   ├── BachelorProgramRepository.java ← Custom JPQL queries
│   └── UserRepository.java
├── runners/
│   └── DataInitializer.java     ← CommandLineRunner (runs on startup)
├── security/
│   └── JWTCheckerFilter.java    ← OncePerRequestFilter for JWT verification
├── services/
│   ├── AuthService.java         ← Login logic (email lookup + BCrypt match)
│   ├── CountryService.java      ← Country CRUD + Specification search
│   ├── BachelorProgramService.java ← Program CRUD + representative program
│   ├── UserService.java         ← User CRUD + search with Specification
│   └── ExcelImportService.java  ← Excel → DB import engine
└── tools/
    ├── JWTTools.java            ← Create, verify, extract JWT tokens
    └── MailgunSender.java       ← Send emails via Mailgun REST API
```

---

## Entity Relationships (Database Schema)

```
┌──────────────────────┐        ┌──────────────────────────┐
│     countries         │        │   bachelor_programs       │
├──────────────────────┤        ├──────────────────────────┤
│ id (PK, IDENTITY)    │───┐    │ id (PK, IDENTITY)        │
│ name (UNIQUE)        │   │    │ duration                 │
│ years_compulsory_    │   └───▶│ country_id (FK)          │
│   schooling          │        │ is_special_program       │
│ grading_system       │        │ credits_per_year         │
│ credit_ratio         │        │ total_credits            │
│ country_code (2 chr) │        │ eqf_level                │
└──────────────────────┘        │ official_denomination    │
                                └──────────────────────────┘

┌──────────────────────┐
│       users           │
├──────────────────────┤
│ id (PK, IDENTITY)    │
│ username (UNIQUE)    │
│ email (UNIQUE)       │
│ password (BCrypt)    │
│ role (ENUM)          │
│ first_name           │
│ last_name            │
│ avatar_url           │
└──────────────────────┘
```

- **Country → BachelorProgram**: One-to-Many (`@OneToMany` with `CascadeType.ALL`)
- **User** is independent — implements `UserDetails` for Spring Security
- The `User.getUsername()` method returns `email` (Spring Security convention); the actual username field is accessed via `getUsernameField()`

---

## Security Pipeline

### How Authentication Works

```
Request → JWTCheckerFilter → SecurityContext → @PreAuthorize → Controller
```

1. **`SecurityConfig.java`**:
   - Disables form login, CSRF (stateless API)
   - Sets session policy to `STATELESS`
   - Permits all requests at the HTTP level (`/**` permitAll) — fine-grained control is done by the filter & `@PreAuthorize`
   - Configures CORS for allowed frontend origins
   - Provides `BCryptPasswordEncoder(12)` bean

2. **`JWTCheckerFilter.java`** (extends `OncePerRequestFilter`):
   - Intercepts every request except public endpoints (defined in `shouldNotFilter`)
   - Extracts `Bearer` token from `Authorization` header
   - Verifies token signature using `JWTTools`
   - Loads the `User` entity from the database using the userId (from JWT subject)
   - Sets `SecurityContextHolder` authentication with the user's authorities

3. **`@PreAuthorize` annotations** on controller methods enforce role-based access:
   - `@PreAuthorize("hasAuthority('ADMIN')")` — most CRUD endpoints
   - `@PreAuthorize("hasAnyAuthority('STUDENT','ADMIN')")` — `/api/users/me`

### Public Endpoints (no JWT required)

| Method | Path                                         | Purpose                        |
| :----- | :------------------------------------------- | :----------------------------- |
| POST   | `/api/auth/login`                            | Login, get JWT token           |
| GET    | `/api/countries/simple`                      | Country list for dropdowns     |
| GET    | `/api/countries/{id}`                        | Single country details         |
| GET    | `/api/countries/{id}/representative-program` | Standard bachelor program      |
| GET    | `/api/countries/{id}/has-special-program`    | Boolean check                  |
| POST   | `/api/feedback`                              | Submit feedback email          |
| GET    | `/swagger-ui/**`, `/v3/api-docs/**`          | Swagger documentation          |

### JWT Token Structure

```json
{
  "sub": "42",          // User ID
  "role": "ADMIN",      // Role claim
  "iat": 1709900000,    // Issued at
  "exp": 1709986400     // Expiration (configurable via JWT_EXPIRATION)
}
```

Signed with HMAC-SHA using the `JWT_SECRET` env variable.

---

## Services — Business Logic

### `AuthService`
- `checkEmailBeforeLogin(dto)` → Finds user by email, compares BCrypt password, returns JWT token

### `CountryService`
- Standard CRUD (`save`, `findById`, `findCountryByIdAndUpdate`, `deleteCountry`)
- `findAllCountriesSimple()` → returns `List<CountryRespDTO>` (id, name, code) for dropdowns
- `searchCountries(...)` → uses JPA `Specification` for dynamic filtering by id and/or schooling years

### `BachelorProgramService`
- Standard CRUD with duplicate-duration validation
- **`getRepresentativeProgramForCountry(countryId)`** — key method for the affinity report:
  1. First tries `findStandardProgramForCountry` (JPQL: `duration = 16 - yearsCompulsorySchooling AND isSpecialProgram = false`)
  2. Falls back to `findLongestProgramForCountry` (longest duration)

### `UserService`
- Standard CRUD with email/username uniqueness checks
- Passwords are always BCrypt-encoded before saving
- `searchUsers(...)` — Specification-based search across firstName, lastName, username, email

### `ExcelImportService`
- See [01-project-overview.md](./01-project-overview.md) section "Data Seeding — The Excel Import Engine"
- Reads `resources/data/matrix.xlsx` using Apache POI
- Complex regex parsing for grading systems, asterisks, pipe-separated values
- Creates `Country` entities + associated `BachelorProgram` entities
- Special handling for Poland's 3.5-year engineering degrees

---

## Data Initialization (`DataInitializer.java`)

This is a `CommandLineRunner` that runs every time the app starts:

1. **Imports countries/programs from Excel** — checks `existsByNameIgnoreCase` so it skips duplicates (safe to re-run)
2. **Creates admin user** — reads credentials from env vars (`admin.username`, `admin.email`, `admin.password`, etc.) and only creates if the email doesn't exist yet

---

## Configuration (`application.properties`)

| Property                      | Source                     | Purpose                            |
| :---------------------------- | :------------------------- | :--------------------------------- |
| `server.port`                 | `${SERVER_PORT}`           | API port (default: 3001)           |
| `spring.datasource.url`      | `${JDBC_URI}`              | PostgreSQL connection string       |
| `spring.datasource.username`  | `${PG_USERNAME}`           | DB username                        |
| `spring.datasource.password`  | `${PG_PASSWORD}`           | DB password                        |
| `spring.jpa.hibernate.ddl-auto` | `update`                 | Auto-creates/updates tables        |
| `jwt.secret`                  | `${JWT_SECRET}`            | HMAC signing key                   |
| `jwt.expiration`              | `${JWT_EXPIRATION}`        | Token TTL in milliseconds          |
| `mailgun.*`                   | `${MAILGUN_*}`             | Mailgun API credentials            |
| `server.forward-headers-strategy` | `framework`             | For Koyeb reverse proxy support    |

Environment variables are loaded from `backend/.env.properties` via `spring.config.import=optional:file:.env.properties`.

---

## Error Handling

`ExceptionsHandler.java` is a `@ControllerAdvice` that catches exceptions globally:

| Exception              | HTTP Status | Response Body             |
| :--------------------- | :---------- | :------------------------ |
| `NotFoundException`    | 404         | `ErrorDTO(message)`       |
| `BadRequestException`  | 400         | `ErrorDTO(message)`       |
| `UnauthorizedException`| 401         | `ErrorDTO(message)`       |
| `ValidationException`  | 400         | `ErrorsWithListDTO(list)` |
