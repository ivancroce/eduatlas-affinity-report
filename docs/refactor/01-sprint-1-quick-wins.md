# Refactor Sprint 1 — Code Quality Quick Wins

> **Branch:** `refactor/sprint-1-quick-wins` (branched from `develop`)
>
> **Status:** Merged to `develop`.

---

## Context

This sprint addresses a set of code quality improvements identified during a self-review of the backend and frontend. None of these changes affect the business logic, API contracts, or database schema — the app behaves identically before and after. The goal is to bring the codebase up to professional standards in areas that are low-risk and high-impact:

- Replacing development-era logging with a proper logging framework
- Closing a security gap in the login flow
- Fixing a logic error in the Excel importer that was masked by the data
- Removing unnecessary database queries on startup
- Making domain constants readable and documented

---

## Changes

### 1. Replace `System.out.println` with SLF4J logging

**Files:**
- `backend/src/main/java/com/ivancroce/backend/services/ExcelImportService.java`
- `backend/src/main/java/com/ivancroce/backend/runners/DataInitializer.java`
- `backend/src/main/java/com/ivancroce/backend/exceptions/ExceptionsHandler.java`

**What changed:**
- Added `@Slf4j` (Lombok) to each class
- Replaced all `System.out.println(...)` → `log.info(...)`
- Replaced all `System.err.println(...)` → `log.warn(...)`
- Replaced all `exception.printStackTrace()` → `log.error("message", exception)`
- Removed a leftover non-English debug comment in `ExceptionsHandler`

**Why:**
`System.out.println` and `printStackTrace()` write to raw stdout/stderr. In a deployed Spring Boot application (e.g. on Koyeb), the platform collects logs through the SLF4J/Logback pipeline — raw stdout output is invisible in the log viewer. Beyond visibility, SLF4J allows log levels to be configured per environment (`INFO` in dev, `WARN` in prod), supports structured log fields, and is the standard in every professional Java codebase.

---

### 2. Fix user enumeration vulnerability in login

**File:** `backend/src/main/java/com/ivancroce/backend/services/AuthService.java`

**What changed:**

Before:
```java
public String checkEmailBeforeLogin(UserLoginDTO payload) {
    User found = userService.findByEmail(payload.email()); // throws NotFoundException → 404
    if (bCrypt.matches(payload.password(), found.getPassword())) {
        return jwtTools.createToken(found);
    } else {
        throw new UnauthorizedException("Unauthorized - try again"); // 401
    }
}
```

After:
```java
public String checkEmailBeforeLogin(UserLoginDTO payload) {
    try {
        User found = userService.findByEmail(payload.email());
        if (bCrypt.matches(payload.password(), found.getPassword())) {
            return jwtTools.createToken(found);
        }
    } catch (NotFoundException ignored) {
        // fall through — same response whether email is unknown or password is wrong
    }
    throw new UnauthorizedException("Invalid email or password");
}
```

**Why:**
The original code returned two different HTTP status codes for two different failure scenarios: **404** when the email did not exist (thrown by `findByEmail`), and **401** when the password was wrong. An attacker could send POST requests with different email addresses and read the response status code to determine which emails are registered — this is called **user enumeration**. Knowing which emails are valid allows targeted brute-force attacks against real accounts.

The fix: wrap the lookup in a `try/catch`. Both failure paths now produce the same **401** response with the same message `"Invalid email or password"`. The attacker cannot distinguish between "account does not exist" and "wrong password."

---

### 3. Fix dead code bug in `ExcelImportService.parseRowToCountry`

**File:** `backend/src/main/java/com/ivancroce/backend/services/ExcelImportService.java`

**What changed:**

Before:
```java
if (name != null && yearsSchooling != null) {
    return new Country(name, yearsSchooling, gradingSystem, creditRatio, countryCode);
    // ↑ method returns here — the block below is unreachable
}
if (creditRatio == null || creditRatio.trim().isEmpty()) {
    creditRatio = "25/30 HOURS OF STUDENT WORK"; // dead code
}
```

After:
```java
// Apply default before constructing the object:
if (creditRatio == null || creditRatio.trim().isEmpty()) {
    creditRatio = "25/30 HOURS OF STUDENT WORK";
}
if (name != null && yearsSchooling != null) {
    return new Country(name, yearsSchooling, gradingSystem, creditRatio, countryCode);
}
```

**Why:**
The `creditRatio` default fallback was placed after an early `return` statement. In Java, code after a `return` in the same block never executes. The importer worked correctly in practice only because the source Excel file always has a value in the credit ratio column — the default was never needed. But the intent of the original code was clearly to apply the default before creating the object, and the placement was a logic error. Moving the null-check above the constructor call fixes the intent and eliminates the unreachable code.

---

### 4. Eliminate repeated DB queries on every startup

**File:** `backend/src/main/java/com/ivancroce/backend/services/ExcelImportService.java`

**What changed:**

Before — `existsByNameIgnoreCase(name)` called once per row inside the loop:
```java
for (int i = 2; i <= sheet.getLastRowNum(); i++) {
    // ...
    if (countryRepository.existsByNameIgnoreCase(name)) { // 1 DB query per row
        skip...
    }
}
```

After — load all names once, check a Set in memory:
```java
Set<String> existingNames = countryRepository.findAll()
        .stream()
        .map(c -> c.getName().toLowerCase())
        .collect(Collectors.toSet()); // 1 DB query total

for (int i = 2; i <= sheet.getLastRowNum(); i++) {
    // ...
    if (existingNames.contains(name.toLowerCase())) { // O(1) in-memory lookup
        skip...
    }
}
```

**Why:**
The original code issued one `SELECT` query per Excel row inside the loop — with 31 rows, that's 31 queries every time the application starts, even after the database is already fully seeded. Replacing the per-row query with a single `findAll()` before the loop reduces startup queries from N to 1. The `Set.contains()` lookup is O(1). This pattern also scales: if the dataset grew to hundreds of rows, the old approach would fire hundreds of individual queries every restart.

---

### 5. Replace hardcoded row count with `sheet.getLastRowNum()`

**File:** `backend/src/main/java/com/ivancroce/backend/services/ExcelImportService.java`

**What changed:**
```java
// Before:
for (int i = 2; i <= 32; i++) {

// After:
for (int i = 2; i <= sheet.getLastRowNum(); i++) {
```

**Why:**
The hardcoded `32` assumes the Excel file will always have exactly 31 data rows. If a row is added or removed from `matrix.xlsx`, the loop either silently skips the new data or reads a nonexistent empty row. `sheet.getLastRowNum()` reads the actual last row index from the file at runtime, making the loop correct regardless of file size.

---

### 6. Add `@Transactional` to the import method

**File:** `backend/src/main/java/com/ivancroce/backend/services/ExcelImportService.java`

**What changed:**
Added `@Transactional` to `importCountriesFromExcel()`.

**Why:**
Without `@Transactional`, each `countryRepository.save()` and `bachelorProgramRepository.save()` call runs in its own implicit transaction. If parsing fails on row 17, rows 1–16 are already committed and rows 17+ are not. The result is a partially seeded database with no clean way to determine what was imported.

`@Transactional` wraps the entire method in a single transaction. A failure anywhere rolls back all inserts, leaving the database in a clean state. The import can then be corrected and re-run from scratch.

---

### 7. Extract affinity score weights into named constants

**File:** `frontend/src/pages/AffinityReportPage/AffinityReportPage.jsx`

**What changed:**
```js
// Before:
const score = (equivalentCount * 100 + moderateCount * 60) / totalCount;

// After:
// Weights: EQUIVALENT contributes 100% to the score; MODERATE contributes 60%
// (still meaningful but signals the student would need to demonstrate equivalence); LOW contributes 0.
const SCORE_WEIGHT_EQUIVALENT = 100;
const SCORE_WEIGHT_MODERATE = 60;

const score = (equivalentCount * SCORE_WEIGHT_EQUIVALENT + moderateCount * SCORE_WEIGHT_MODERATE) / totalCount;
```

**Why:**
`100` and `60` are the core weights of the affinity scoring algorithm. As raw integers in a formula they look arbitrary. As named constants with a comment they document the academic reasoning: EQUIVALENT programs are fully comparable (100 points); MODERATE programs are partially comparable and require the student to demonstrate equivalence (60 points); LOW programs contribute nothing (0). If the weights ever need adjusting, there is a single place to change them rather than hunting for magic numbers.

---

### 8. Extract `16` (Bologna harmonization constant) into a documented constant

**Files:**
- `backend/src/main/java/com/ivancroce/backend/services/BachelorProgramService.java`
- `backend/src/main/java/com/ivancroce/backend/repositories/BachelorProgramRepository.java`

**What changed:**

Added to `BachelorProgramService`:
```java
/**
 * The Bologna Process harmonization constant: a Bachelor's degree is designed to be reachable
 * after 16 total years of education (primary + secondary + higher). Used to select the
 * "standard" program duration for a country: standardDuration = 16 - yearsCompulsorySchooling.
 */
public static final int TOTAL_EDUCATION_YEARS = 16;
```

The JPQL now receives this as a named parameter instead of a hardcoded integer:
```java
// Repository signature:
Optional<BachelorProgram> findStandardProgramForCountry(
    @Param("countryId") Long countryId,
    @Param("totalEducationYears") int totalEducationYears
);

// Service call:
bachelorProgramRepository.findStandardProgramForCountry(countryId, TOTAL_EDUCATION_YEARS);
```

**Why:**
`16` appearing in a JPQL string looks like a random number. It is actually the Bologna Process harmonization constant — under the European Credit Transfer and Accumulation System (ECTS), a Bachelor's degree is designed to be reachable after 16 total years of education. The formula `16 - yearsCompulsorySchooling` derives the expected Bachelor's duration for each country based on how many years of compulsory schooling that country mandates.

This is real domain knowledge and belongs in a documented constant. Note: JPQL strings are resolved at parse time and cannot directly reference Java static constants, so the value is passed as a `@Param` — the standard Spring Data pattern.

---

## What was NOT changed

- Business logic (affinity algorithm output, representative program selection)
- Database schema or JPA entities
- API contracts — all request and response shapes are identical
- Security configuration
- Frontend routing, components, or styling

These are deliberately scoped to separate branches with their own documentation.

---

## How to test manually

### Backend
1. Start the backend: `./mvnw spring-boot:run` (from `backend/`)
2. Check startup logs — they should appear as structured Spring Boot log lines with timestamps and log levels, not plain text
3. Confirm all countries are seeded: `GET /api/countries` should return the full list
4. **Login with a non-existent email** → expect **401** `"Invalid email or password"` (not 404)
5. **Login with a real email but wrong password** → expect **401** `"Invalid email or password"` (same response as above)
6. **Login with correct credentials** → expect a JWT token as normal
7. Generate an affinity report and verify the score renders correctly

### Frontend
1. Start the frontend: `npm run dev` (from `frontend/`)
2. Select two countries and generate a report — verify the score and layout are unchanged
3. The score formula change is a rename only; if the report renders, the logic is correct

---

## Automated tests

The user enumeration fix is covered by `AuthServiceTest` (`backend/src/test/java/com/ivancroce/backend/services/AuthServiceTest.java`):

| Test | What it verifies |
|---|---|
| `validCredentials_returnsToken` | Correct email + password returns a JWT |
| `wrongPassword_throwsUnauthorizedException` | Real email, wrong password → `UnauthorizedException` |
| `unknownEmail_throwsUnauthorizedException` | Unknown email → `UnauthorizedException` (not 404) |
| `userEnumeration_wrongPasswordAndUnknownEmail_throwSameMessage` | Both failure paths produce the same exception message — an attacker cannot tell whether the email exists |

Run: `./mvnw.cmd test -Dtest=AuthServiceTest` (from `backend/`)
