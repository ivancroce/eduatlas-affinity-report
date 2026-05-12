# Sprint 7 — Swagger / OpenAPI Hardening (Authorize button + grouped specs)

**Branch:** `feature/swagger-controller-annotations` (already exists, branched from `develop`)
**Base:** `develop`
**Status:** Plan — not yet implemented

---

## How to read this document

This is a **planning + spec document**. It describes:

1. The problems found in the current Swagger / OpenAPI setup
2. The exact code changes required to fix them
3. The manual testing checklist that must pass before merge

This branch already has one commit (`8acc5ef`) adding `@Operation` / `@Tag` / `@ApiResponses` annotations to controllers. The changes described here build on top of that — do not undo that work.

After the changes are implemented and verified, this document should be rewritten in post-implementation refactor-doc style (see siblings `01-` through `06-` — Problem → Fix → What was NOT changed → Manual testing checklist that was run) and committed alongside the code.

---

## Problem

Logging in via Swagger UI (`POST /api/auth/login`) returns a JWT in the response body, but there is **nowhere to paste it** — there is no Authorize button and no padlock icons on protected endpoints. Every secured endpoint called from Swagger returns 401.

Three distinct issues in `OpenApiConfig` compound here:

### 1. No SecurityScheme is declared anywhere

`OpenApiConfig.java` declares `@OpenAPIDefinition(info = ...)` only. It never declares a `securitySchemes` block. springdoc-openapi has no opinion on its own — without a declared scheme of type `HTTP` + `bearer` + JWT, Swagger UI does not render the Authorize button at all, and no operation can carry a `SecurityRequirement`.

Verified by grepping the entire `backend/src/main` tree:

```
SecurityScheme | SecurityRequirement | bearerAuth → 0 matches
```

### 2. No endpoints are tagged as requiring auth

Even after a scheme is added, springdoc needs to know **which** operations require it. The current code has `@PreAuthorize("hasAuthority('ADMIN')")` and `@PreAuthorize("hasAnyAuthority('STUDENT','ADMIN')")` on protected methods, but those are Spring Security annotations — springdoc does not read them. Without either a global `security` block on `@OpenAPIDefinition` or per-method `@SecurityRequirement`, the generated spec lists every endpoint as anonymous.

### 3. The `OperationCustomizer` returning `null` breaks the grouped specs (known issue)

`CLAUDE.md` (Backend → Known issue) already documents this:

> `GET /v3/api-docs/public` and `/v3/api-docs/admin` return 500. `OpenApiConfig` uses `OperationCustomizer` returning `null` to filter operations, but springdoc does not handle null returns gracefully — causes a NPE during spec generation. Fix: replace null-returning customizers with explicit `pathsToMatch` per group.

Current code:

```java
.addOperationCustomizer((operation, handlerMethod) -> {
    if (handlerMethod.hasMethodAnnotation(PreAuthorize.class)) {
        return null;                  // <-- NPE inside springdoc
    }
    return operation;
})
```

The default `/v3/api-docs` works (which is why Swagger UI currently loads in production), but the **group** dropdown items ("Public - Affinity Report" / "Admin - Management") will 500 the moment a user selects them. The user has not yet noticed this because they always view the default group.

Two additional code-smells in the same customizer chain that should go away with the rewrite:

- `handlerMethod.hasMethodAnnotation(PreAuthorize.class)` only inspects **method-level** annotations. If `@PreAuthorize` were ever moved to the class, the filter would silently misclassify every endpoint in that controller. Today no controller uses class-level `@PreAuthorize`, but the brittle pattern should not be preserved.
- `handlerMethod.getBeanType().getSimpleName().contains("Auth")` is a string-match special case for `AuthController`. Fragile. Renaming `AuthController` to `AuthenticationController` would silently break the admin group.

---

## Fix

The fix is entirely in `backend/src/main/java/com/ivancroce/backend/config/OpenApiConfig.java`. No controller, security, or pom changes are required. springdoc-openapi-starter-webmvc-ui `2.8.14` (already in `pom.xml`) supports everything below.

### Step 1 — Declare a `bearerAuth` security scheme and make it the default for all operations

Replace the current `@OpenAPIDefinition` block with one that includes `securitySchemes` and a top-level `security` requirement. Using a top-level requirement means every operation in the spec **inherits** "requires bearerAuth" unless explicitly opted out. Public endpoints will opt out in Step 3.

```java
@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "EduAtlas Affinity Report API",
                version = "1.0",
                description = "API for Westcliff University EduAtlas"
        ),
        security = { @SecurityRequirement(name = "bearerAuth") }
)
@SecurityScheme(
        name = "bearerAuth",
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "JWT",
        description = "Paste the access token returned by POST /api/auth/login (without the 'Bearer ' prefix)"
)
public class OpenApiConfig {
    // ...
}
```

Required new imports:

```java
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
```

The existing import `org.springframework.security.access.prepost.PreAuthorize` becomes unused after Step 3 and must be removed.

**Why a global default + opt-out, not per-method `@SecurityRequirement`?** The codebase has ~20 protected endpoints versus ~6 public ones. Inverting the default keeps the controllers clean and means new endpoints are **secure-by-default in the Swagger UI** — if a developer forgets to annotate, the UI will at least prompt for a token rather than silently call anonymously.

### Step 2 — Replace the two `GroupedOpenApi` beans with `pathsToMatch` / `pathsToExclude` filtering

This is the fix for the known 500 issue. Filter by URL pattern, not by customizer-returning-null.

The endpoint-to-group mapping, derived from `JWTCheckerFilter.shouldNotFilter` (which is the authoritative source of truth for "what is public"):

| Group      | Includes                                                                                                                                                  | Excludes                        |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| **public** | `POST /api/auth/**`, `POST /api/feedback`, public `GET /api/countries/*` paths (simple, comparison, representative-program, has-special-program, `/{id}`) | everything else under `/api/**` |
| **admin**  | every `/api/**` operation that carries `@PreAuthorize`                                                                                                    | the public endpoints above      |

Replace both bean methods with:

```java
@Bean
public GroupedOpenApi publicApi() {
    return GroupedOpenApi.builder()
            .group("public")
            .displayName("Public - Affinity Report")
            .pathsToMatch(
                    "/api/auth/**",
                    "/api/feedback",
                    "/api/countries/simple",
                    "/api/countries/comparison",
                    "/api/countries/*/representative-program",
                    "/api/countries/*/has-special-program",
                    "/api/countries/*"          // GET /api/countries/{id}
            )
            .pathsToExclude("/api/countries/search")
            .build();
}

@Bean
public GroupedOpenApi adminApi() {
    return GroupedOpenApi.builder()
            .group("admin")
            .displayName("Admin - Management")
            .pathsToMatch("/api/**")
            .pathsToExclude(
                    "/api/auth/**",
                    "/api/feedback",
                    "/api/countries/simple",
                    "/api/countries/comparison",
                    "/api/countries/*/representative-program",
                    "/api/countries/*/has-special-program"
            )
            .build();
}
```

Notes / gotchas:

- `pathsToMatch("/api/countries/*")` will also match `/api/countries/search`. The `pathsToExclude("/api/countries/search")` on the **public** group is required to keep the admin-only search endpoint out of the public group. (springdoc applies excludes after matches.)
- `GET /api/countries/{id}/bachelor-programs` is admin-only and is correctly **not** matched by any of the public patterns above — it falls through to the admin group.
- Do **not** keep the `OperationCustomizer` chain. Delete it entirely along with the `PreAuthorize` import.

### Step 3 — Mark the public endpoints as not requiring auth in the generated spec

With the global `@SecurityRequirement` from Step 1, every operation now claims to need a token. The handful of truly public endpoints must override that. Add `@SecurityRequirements({})` (empty array — Swagger annotation, **not** the Spring Security one) to each. An empty `security` requirement on an operation overrides the global default and tells Swagger UI "this one is anonymous."

Files to edit and methods to annotate:

**`AuthController.java`**

- `login(...)` — `POST /api/auth/login`

**`FeedbackController.java`**

- `submitFeedback(...)` — `POST /api/feedback`

**`CountryController.java`**

- `getComparison(...)` — `GET /api/countries/comparison`
- `getCountryById(...)` — `GET /api/countries/{id}`
- `getAllCountriesSimple()` — `GET /api/countries/simple`
- `getRepresentativeProgram(...)` — `GET /api/countries/{countryId}/representative-program`
- `hasSpecialPrograms(...)` — `GET /api/countries/{countryId}/has-special-program`

Annotation form (same in every file):

```java
import io.swagger.v3.oas.annotations.security.SecurityRequirements;

// on the method:
@SecurityRequirements({})
```

Do **not** add this to admin-only endpoints — they should inherit the global `bearerAuth` requirement.

> **Caveat on import naming:** `io.swagger.v3.oas.annotations.security.SecurityRequirement` (singular) is the per-scheme annotation. `io.swagger.v3.oas.annotations.security.SecurityRequirements` (plural, with empty `{}`) is the override-to-anonymous annotation. The implementing agent should verify this import resolves; if springdoc-openapi 2.8.14 packages it differently, the equivalent is to put `@Operation(security = {})` on the method, which has the same effect via the `Operation` annotation's `security` attribute.

---

## Going forward — adding new endpoints

The security default is **opt-out**: every new endpoint requires a bearer token unless explicitly marked public.

**New admin/protected endpoint** (annotated with `@PreAuthorize`):
- No changes needed anywhere. It inherits `bearerAuth` from the global `@OpenAPIDefinition` security block and falls into the admin group automatically via `pathsToMatch("/api/**")`.

**New public endpoint** (no `@PreAuthorize`):
1. Add `@SecurityRequirements({})` on the controller method — this overrides the global default and removes the padlock in Swagger UI.
2. In `OpenApiConfig.publicApi()`, add the path to `pathsToMatch(...)`.
3. In `OpenApiConfig.adminApi()`, add the path to `pathsToExclude(...)`.

The authoritative reference for "what is public" is `JWTCheckerFilter.shouldNotFilter()` — keep `OpenApiConfig` in sync with that list.

---

## What was NOT changed (and why)

- **`SecurityConfig.java`** — unchanged. The Swagger fix is purely a spec-generation concern. Authentication enforcement at the filter layer is already correct (`JWTCheckerFilter.shouldNotFilter` whitelists the same public paths listed above).
- **`JWTCheckerFilter.java`** — unchanged. It already whitelists `/swagger-ui/**`, `/v3/api-docs/**`, etc., so Swagger UI itself remains accessible without a token.
- **`pom.xml`** — unchanged. `springdoc-openapi-starter-webmvc-ui:2.8.14` already provides every annotation used here.
- **The Swagger annotations added on `feature/swagger-controller-annotations` commit `8acc5ef`** — kept as-is. `@Operation`, `@Tag`, `@ApiResponses` on each controller are independent of the auth fix and improve the spec quality.
- **No changes to controller method signatures, request/response DTOs, or business logic.**

---

## Manual testing checklist

The implementing agent must run all of these locally before asking the user to test. The user will then re-run them before merge.

### Backend boot

- [ ] `./mvnw.cmd spring-boot:run` (Windows) starts without exceptions
- [ ] No NPE / startup warning from springdoc in the console
- [ ] Existing unit tests still pass: `./mvnw.cmd test`

### Swagger UI — default group

- [ ] `http://localhost:3001/swagger-ui/index.html` loads
- [ ] An **Authorize** button is visible in the top right
- [ ] Clicking it opens a dialog with a single field labelled `bearerAuth (http, Bearer)` and a JWT format hint
- [ ] Public endpoints (e.g. `GET /api/countries/simple`, `POST /api/feedback`) render with **no padlock icon**
- [ ] Admin endpoints (e.g. `GET /api/users`, `POST /api/countries`) render **with a padlock icon**
- [ ] `POST /api/auth/login` itself has **no padlock** (it issues the token; it must not require one)

### End-to-end login flow inside Swagger UI

- [ ] Without authorizing, "Try it out" on `POST /api/auth/login` with valid admin credentials returns 200 + an `accessToken` field
- [ ] Without authorizing, "Try it out" on `GET /api/users` returns 401
- [ ] Click Authorize, paste the token from the login response (no `Bearer ` prefix), Authorize, Close
- [ ] "Try it out" on `GET /api/users` now returns 200 with a paginated user list
- [ ] "Try it out" on `GET /api/users/me` returns 200 with the admin user's profile

### Grouped specs (the known-issue fix)

- [ ] The group dropdown (top-right of Swagger UI, next to the title) shows three options: default, `public`, `admin`
- [ ] Selecting `public` loads without 500 and shows **only** the 7 public endpoints listed in Step 3 (plus `POST /api/auth/login`)
- [ ] Selecting `admin` loads without 500 and shows the protected endpoints (Users, Bachelor Programs, admin Country routes), **not** the public ones
- [ ] `curl http://localhost:3001/v3/api-docs/public` returns 200 + valid JSON
- [ ] `curl http://localhost:3001/v3/api-docs/admin` returns 200 + valid JSON

### Regression — verify nothing else broke

- [ ] Frontend dev server (`npm run dev` in `frontend/`) still loads the homepage and runs an affinity report end-to-end (the spec changes should not affect runtime API behaviour at all, but verify because a misconfigured `pathsToMatch` could in theory hide endpoints from clients that rely on spec-driven tooling — we have none, so this is paranoia)
- [ ] Admin dashboard CRUD operations still work end-to-end via the React UI

### After local pass

- [ ] Rewrite this file in post-implementation refactor-doc style (Problem → Fix → What was NOT changed → Manual testing checklist actually run) and commit it alongside the code
- [ ] Update the "Known issue" paragraph in `CLAUDE.md` (the one starting `GET /v3/api-docs/public ... return 500`) — that entry should be deleted once the fix is verified

---

## Branch / PR coordination notes

- The user currently has 2 open PRs to `develop`:
  - `feature/user-dto-password-pattern` (current branch — `@Pattern` on registration DTO)
  - `feature/swagger-controller-annotations` (this branch — already has the `@Operation`/`@Tag` commit)
- This fix lands as **additional commits** on `feature/swagger-controller-annotations`, not a new branch
- After both PRs are merged to `develop`, `develop` → `main` merge will deploy to Koyeb at `https://extraordinary-greer-ictech-3392249e.koyeb.app/swagger-ui/index.html`
- No CORS / SecurityConfig changes needed — the Koyeb origin is already in the allowed-origins list

---

## Automated tests

The JWT filter whitelist introduced across all sprints is verified as security regression tests in `CountryControllerTest` (`backend/src/test/java/com/ivancroce/backend/controllers/CountryControllerTest.java`):

| Test | What it verifies |
|---|---|
| `getAllCountries_withoutAuthToken_returns401` | `GET /api/countries` without an `Authorization` header → 401 (filter runs on admin endpoints) |
| `getCountriesSimple_withoutAuthToken_returns200` | `GET /api/countries/simple` without an `Authorization` header → 200 (filter bypassed for public endpoints) |

These tests confirm `JWTCheckerFilter.shouldNotFilter()` correctly gates admin endpoints and passes through public ones. If the whitelist is accidentally broken in a future change, these tests will catch it.

`AuthControllerTest` (`backend/src/test/java/com/ivancroce/backend/controllers/AuthControllerTest.java`) further verifies the `ExceptionsHandler` integration:

| Test | What it verifies |
|---|---|
| `login_validCredentials_returns200WithToken` | Valid credentials → 200 with `accessToken` in body |
| `login_invalidCredentials_returns401` | `UnauthorizedException` from service → 401 via `ExceptionsHandler` |
| `login_emptyBody_returns400` | Empty `{}` body → 400 via `MethodArgumentNotValidException` handler |

Run: `./mvnw.cmd test -Dtest="CountryControllerTest,AuthControllerTest"` (from `backend/`)

---

## Acceptance criteria (one-line summary for the user)

After this branch is merged, a developer can open Swagger UI in production, call `POST /api/auth/login`, paste the returned token into the Authorize dialog, and successfully invoke any admin endpoint — and both the `public` and `admin` group filters work without 500ing.
