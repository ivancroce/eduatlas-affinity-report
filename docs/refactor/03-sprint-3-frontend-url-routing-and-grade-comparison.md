# Sprint 3 — Frontend URL Routing & Grade Comparison Page

**Branch**: `feature/sprint-3-frontend-url-routing-and-grade-comparison`
**Base**: `develop` (after Sprint 2 merged via PR #4)

---

## Problem

Two independent issues addressed in this sprint:

### 1. Non-shareable affinity report URL
`HomePage` made 6 parallel API calls on button click, then navigated to `/affinity-report` passing all data via `location.state`. Any user who copied and pasted `/affinity-report` in a new tab got a blank page — no state, no data.

### 2. Grading system row was a dead end
The affinity table showed the raw grading string (e.g., `18-30`) in the Grading System row with a hardcoded yellow badge "CAN ALWAYS BE CONVERTED". There was no way for users to understand what those numbers meant or compare the two grading scales side by side.

---

## Changes

### A — Backend: `/comparison` endpoint accepts ISO country codes

**Problem**: The endpoint accepted numeric IDs (`country1Id`, `country2Id`), producing ugly URLs like `/affinity-report?country1=3&country2=12`. IDs are meaningless to humans and not SEO-friendly.

**Fix**: Changed params to ISO 2-letter codes (`c1`, `c2`). Added `findByCountryCodeIgnoreCase` to `CountryRepository` and `findByCountryCode` to `CountryService`.

| File | Change |
|------|--------|
| `CountryRepository.java` | Added `Optional<Country> findByCountryCodeIgnoreCase(String code)` |
| `CountryService.java` | Added `findByCountryCode(String code)` → throws 404 if not found |
| `CountryController.java` | `getComparison` params: `@Positive Long country1Id/country2Id` → `@NotBlank String c1/c2`; same-country check now `c1.equalsIgnoreCase(c2)`; lookup via `countryService.findByCountryCode()` |

**Before**:
```
GET /api/countries/comparison?country1Id=3&country2Id=12
```
**After**:
```
GET /api/countries/comparison?c1=IT&c2=IE
```

Validation behaviour is unchanged: missing param → 400, blank param → 400 (via `@NotBlank` + `ConstraintViolationException` handler from Sprint 2), unknown code → 404.

---

### B — Frontend: Shareable URL for Affinity Report

**Problem**: `HomePage` made 6 parallel API calls on "Generate" click. `AffinityReportPage` read its data from `location.state` — invisible in the URL, lost on refresh or share.

**Fix**: `HomePage` now navigates instantly with country codes in the URL. `AffinityReportPage` reads the codes from `useSearchParams()` and fetches from the single `/comparison` endpoint on mount.

#### `frontend/src/pages/HomePage/HomePage.jsx`

Before:
```js
const [country1Data, country2Data, ...] = await Promise.all([
  api.get(`/countries/${country1}`),
  api.get(`/countries/${country2}`),
  // ... 4 more
]);
navigate("/affinity-report", { state: { country1: {...}, country2: {...} } });
```

After:
```js
const c1 = countries.find((c) => c.id.toString() === country1.toString())?.countryCode;
const c2 = countries.find((c) => c.id.toString() === country2.toString())?.countryCode;
navigate(`/affinity-report?c1=${c1}&c2=${c2}`);
```

- Removed `isGeneratingReport` state and spinner (no async needed on this page)
- Removed `api` import for the 6-call pattern — `api` is kept for the `/countries/simple` dropdown fetch
- `handleGenerateReport` is now synchronous

#### `frontend/src/pages/AffinityReportPage/AffinityReportPage.jsx`

Before:
```js
const location = useLocation();
const { country1, country2 } = location.state || {};
```

After:
```js
const [searchParams] = useSearchParams();
// useEffect reads c1/c2, calls /countries/comparison?c1=IT&c2=IE
// Maps response: { ...data.country1, program: data.representativeProgram1, hasSpecialPrograms: data.hasSpecialProgram1 }
```

- Added `isLoading` + `fetchError` states with spinner and error alert
- Grading affinity badge: `"CAN ALWAYS BE CONVERTED"` / `warning` → `"COMPARE GRADING SCALES →"` / `primary` (dark blue)
- Badge is now a `<Link>` to `/grade-comparison?c1=IT&c2=IE`
- Removed stale `"CAN ALWAYS BE CONVERTED"` filter strings from `calculateAffinityPercentage` and `calculateOverallAffinity` — grading is not in `affinitiesForOverall` so the filter was dead code
- `calculateGradingAffinity` call cleaned up (was passing unused args)

---

### C — Frontend: Grade Comparison Page (new feature)

#### `frontend/src/data/gradingScales.js` (new)
Static lookup keyed by ISO 2-letter country code. Each entry has:
- `name`: display name matching backend `Country.name`
- `excellent`, `veryGood`, `good`, `pass`, `fail`: grade bands following ECTS table (A/B/C/D-E/F)

Countries not in the map render "N/A" with an explanatory note.

#### `frontend/src/pages/GradeComparisonPage/GradeComparisonPage.jsx` (new)
- Route: `/grade-comparison?c1=IT&c2=IE`
- Reads `c1`/`c2` from `useSearchParams()`
- Looks up name and scale bands from `gradingScales.js`
- Renders flags, country names, badges, and the 5-column ECTS table
- Uses `useAvailableHeight()` + `full-page-container py-4` wrapper (no `my-5` on Container — that caused a scrollbar because margin exceeded `--available-height`)
- Includes Print / Share / PDF buttons (same implementation as `AffinityReportPage`)
- `← go back` uses `navigate(-1)` to return to the affinity report

#### `frontend/src/App.jsx`
Added `<Route path="/grade-comparison" element={<GradeComparisonPage />} />`.

---

## Commit Plan

```
1. refactor: update /comparison endpoint to accept ISO country codes (backend)
   → CountryController, CountryRepository, CountryService

2. refactor: replace 6-call pattern with shareable URL routing for affinity report
   → HomePage.jsx, AffinityReportPage.jsx

3. feat: add grade comparison page with ECTS grading scales
   → App.jsx, gradingScales.js, GradeComparisonPage.jsx, GradeComparisonPage.scss
```

---

## What Was NOT Changed

- Affinity algorithm logic — unchanged (duration, credits, ratio, EQF). Grading was always excluded from the score; only the display changed.
- `GET /api/countries/simple` — unchanged, still returns `{ id, name, countryCode }` for the dropdown
- All other public and admin endpoints — unchanged
- `JWTCheckerFilter` — `/api/countries/comparison` path was already whitelisted in Sprint 2
- `ExceptionsHandler` — `ConstraintViolationException` and `MissingServletRequestParameterException` handlers from Sprint 2 cover `@NotBlank` validation on the new params

---

## Manual Testing Checklist

- [ ] Home page: select Italy + Ireland → URL becomes `/affinity-report?c1=IT&c2=IE`
- [ ] Paste `/affinity-report?c1=IT&c2=IE` in a new tab → full report loads (shareability)
- [ ] Network tab: only 1 call to `/api/countries/comparison` (no 6-call pattern)
- [ ] Grading row: shows "COMPARE GRADING SCALES →" badge in dark blue, clicking navigates to `/grade-comparison?c1=IT&c2=IE`
- [ ] Grade comparison page: flags, country names, ECTS table with correct values
- [ ] Grade comparison page: no scrollbar, footer not visible until you reach end naturally
- [ ] Print/Share/PDF buttons work on grade comparison page
- [ ] `← go back` returns to affinity report
- [ ] Backend: `?c1=IT&c2=IT` → 400 (same country), `?c1=` → 400 (blank), `?c1=ZZ&c2=IT` → 404 (unknown code)
- [ ] Affinity score and overall rating unchanged for same pair of countries
