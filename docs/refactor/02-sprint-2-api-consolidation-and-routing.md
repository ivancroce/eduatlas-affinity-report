# Refactor Sprint 2 — API Consolidation, Shareable URLs & Grade Comparison Page

> **Branch:** `refactor/sprint-2-api-consolidation-and-routing` (branched from `develop`)
>
> **Status:** Merged to `develop`.

---

## Context

Three closely related problems are addressed in this sprint:

**1. Six parallel API calls for a single user action.**
When the user clicks "Generate Affinity Report" on the homepage, the frontend fires 6 simultaneous requests to 3 different endpoints per country (country details, representative program, has-special-program). The server has all the information needed to answer this in a single response. Firing 6 calls introduces unnecessary latency, round-trip overhead, and is harder to reason about when one call fails.

**2. The affinity report URL is not shareable.**
The current flow passes all comparison data from `HomePage` to `AffinityReportPage` via React Router's `location.state`. State-based navigation means the data only exists during that browser session — it is not encoded in the URL. If a user copies and shares the URL (`/affinity-report`), the recipient lands on a blank error state because there is no state attached to their navigation. This makes the report effectively unshareable, which breaks a core use case.

**3. The grading system row lacks actionable detail.**
The affinity report table shows "CAN ALWAYS BE CONVERTED" for the grading system. While this label is correct (academic grading scales can always be cross-referenced), it provides no information about what the actual scales are. Adding a grade comparison page gives users a concrete side-by-side view of the grading ranges for the two countries they compared. This is implemented as a standalone feature and does not touch the affinity algorithm.

---

## Changes

### 1. New backend endpoint: single comparison response

**File to create:** `backend/src/main/java/com/ivancroce/backend/payloads/CountryComparisonRespDTO.java`

**New DTO:**
```java
public record CountryComparisonRespDTO(
    Country country1,
    BachelorProgram representativeProgram1,
    boolean hasSpecialProgram1,
    Country country2,
    BachelorProgram representativeProgram2,
    boolean hasSpecialProgram2
) {}
```

**File to modify:** `backend/src/main/java/com/ivancroce/backend/controllers/CountryController.java`

**What changed — add one public endpoint in the `// --- PUBLIC ENDPOINTS ---` block:**

```java
// Before: no comparison endpoint existed. Frontend called:
// GET /api/countries/{id}                       ×2
// GET /api/countries/{id}/representative-program ×2
// GET /api/countries/{id}/has-special-program    ×2
// Total: 6 HTTP requests per report generation

// After:
@Operation(summary = "Get comparison data", description = "Returns both countries and their representative programs in a single response.")
@GetMapping("/comparison")
public CountryComparisonRespDTO getComparison(
        @RequestParam Long country1Id,
        @RequestParam Long country2Id) {
    Country c1 = countryService.findById(country1Id);
    Country c2 = countryService.findById(country2Id);
    BachelorProgram p1 = bachelorProgramService.getRepresentativeProgramForCountry(country1Id);
    BachelorProgram p2 = bachelorProgramService.getRepresentativeProgramForCountry(country2Id);
    boolean s1 = bachelorProgramRepository.existsByCountryIdAndIsSpecialProgramTrue(country1Id);
    boolean s2 = bachelorProgramRepository.existsByCountryIdAndIsSpecialProgramTrue(country2Id);
    return new CountryComparisonRespDTO(c1, p1, s1, c2, p2, s2);
}
```

No `@PreAuthorize` — matches the pattern of all other public country endpoints.

**Why:**
The client already had all the data it needed after the 6 calls; nothing was computed client-side to decide which calls to make next. A single endpoint that returns the composite response is the correct design — it reduces 6 network round-trips to 1, and it centralises the data assembly in the backend where it belongs.

---

### 2. Shareable affinity report URLs

**File to modify:** `frontend/src/pages/HomePage/HomePage.jsx`

**What changed:**

Before:
```js
const [country1Data, country2Data, program1Data, program2Data, special1Data, special2Data] = await Promise.all([
  api.get(`/countries/${country1}`),
  api.get(`/countries/${country2}`),
  api.get(`/countries/${country1}/representative-program`),
  api.get(`/countries/${country2}/representative-program`),
  api.get(`/countries/${country1}/has-special-program`),
  api.get(`/countries/${country2}/has-special-program`)
]);

navigate("/affinity-report", {
  state: {
    country1: { ...country1Data.data, program: program1Data.data, hasSpecialPrograms: special1Data.data },
    country2: { ...country2Data.data, program: program2Data.data, hasSpecialPrograms: special2Data.data }
  }
});
```

After:
```js
// No API calls here. Just navigate with IDs in the URL.
navigate(`/affinity-report?country1=${country1}&country2=${country2}`);
```

The entire `Promise.all` block and all state merging is removed from `HomePage`. The `isGeneratingReport` spinner is removed (navigation is now instant). Input validation (both selected, not same country) is kept.

**Why:**
State-based navigation is a session-only mechanism. Encoding the country IDs as query parameters makes the URL self-describing and permanent. Anyone with the URL can open the report because the report page fetches its own data. This follows the standard REST/SPA principle: the URL is the source of truth for the view being rendered.

---

**File to modify:** `frontend/src/pages/AffinityReportPage/AffinityReportPage.jsx`

**What changed:**

Before (lines 17–37):
```js
const location = useLocation();
const { country1, country2 } = location.state || {};

if (!country1 || !country2) {
  return (/* "No comparison data" alert */);
}
```

After:
```js
import { useSearchParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import api from "../../../src/api/axios";

const AffinityReportPage = () => {
  const [searchParams] = useSearchParams();
  const [country1, setCountry1] = useState(null);
  const [country2, setCountry2] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const id1 = searchParams.get("country1");
    const id2 = searchParams.get("country2");
    if (!id1 || !id2) {
      setError("missing-params");
      setIsLoading(false);
      return;
    }
    api.get(`/countries/comparison?country1Id=${id1}&country2Id=${id2}`)
      .then(({ data }) => {
        setCountry1({ ...data.country1, program: data.representativeProgram1, hasSpecialPrograms: data.hasSpecialProgram1 });
        setCountry2({ ...data.country2, program: data.representativeProgram2, hasSpecialPrograms: data.hasSpecialProgram2 });
      })
      .catch(() => setError("fetch-failed"))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return (/* spinner */);
  if (error || !country1 || !country2) return (/* existing "No comparison data" alert */);

  // ... rest of the component is unchanged
```

All affinity calculation functions, the comparison table, the Doughnut chart, the PDF export, and the FeedbackModal are unchanged.

**Why:**
The component now owns its own data lifecycle. It reads two IDs from the URL and fetches from the new endpoint. The internal `country1`/`country2` shape is identical to before, so every downstream calculation is untouched. The only new state is the loading and error guards around the async fetch.

---

**File to modify:** `frontend/src/App.jsx`

Add one route at the end of the public routes:
```jsx
import GradeComparisonPage from "./pages/GradeComparisonPage/GradeComparisonPage";

// In <Routes>:
<Route path="/grade-comparison" element={<GradeComparisonPage />} />
```

---

### 3. Grade Comparison page

**File to create:** `frontend/src/data/gradingScales.js`

A static lookup keyed by the country name as stored in the backend (`Country.name`), mapping to the five standard ECTS-compatible grade bands:

```js
// Grading scale breakdown per country.
// Keys match exactly the `name` field of the Country entity in the database.
// Grade bands follow the ECTS grading table convention: A (top 10%), B (next 25%),
// C (next 30%), D (next 25%), E (bottom 10%), F (fail).
export const gradingScales = {
  "Italy":       { excellent: "29-30+", veryGood: "27-28", good: "24-26", pass: "18-23",  fail: "<18"   },
  "Ireland":     { excellent: "70-100%", veryGood: "60-69%", good: "50-59%", pass: "40-49%", fail: "<40%" },
  "Germany":     { excellent: "1.0-1.5", veryGood: "1.6-2.5", good: "2.6-3.5", pass: "3.6-4.0", fail: ">4.0" },
  "France":      { excellent: "16-20", veryGood: "14-15", good: "12-13", pass: "10-11", fail: "<10" },
  "Spain":       { excellent: "9-10", veryGood: "7-8.9", good: "6-6.9", pass: "5-5.9", fail: "<5" },
  // ... all remaining countries in the system
};
```

Countries not yet in the map will render "N/A" in the table cells.

**File to create:** `frontend/src/pages/GradeComparisonPage/GradeComparisonPage.jsx`

```jsx
// Route: /grade-comparison?country1Name=Italy&country2Name=Ireland
// Reads country names from URL, looks up in gradingScales, renders comparison table.
// "← go back" navigates to the previous page (the affinity report).
```

Layout matches the screenshot provided during planning:
- Header: icon + "Compare Grades" title + subtitle
- Sub-header line: `Countries: <Name1> & <Name2>   Grade: Bachelor's Degree`
- Table: first column is the country name (no header), columns A (EXCELLENT) / B (VERY GOOD) / C (GOOD) / D/E (PASS) / F (FAIL)
- One row per country
- "← go back" link top-left using `useNavigate(-1)`

**File to create:** `frontend/src/pages/GradeComparisonPage/GradeComparisonPage.scss`

Styles aligned with the existing app design system (primary blue header cells, white rows, clean table borders, consistent font sizing).

---

**File to modify:** `frontend/src/pages/AffinityReportPage/AffinityReportPage.jsx`

In the grading system row of the comparison table (where "CAN ALWAYS BE CONVERTED" badge is rendered), add a link after the badge:

Before:
```jsx
<Badge bg="warning" text="dark">CAN ALWAYS BE CONVERTED</Badge>
```

After:
```jsx
<Badge bg="warning" text="dark">CAN ALWAYS BE CONVERTED</Badge>
{" "}
<Link
  to={`/grade-comparison?country1Name=${encodeURIComponent(country1.name)}&country2Name=${encodeURIComponent(country2.name)}`}
  className="small"
>
  Compare grading scales →
</Link>
```

The affinity algorithm (`calculateGradingAffinity`) and scoring logic are not changed.

**Why:**
"CAN ALWAYS BE CONVERTED" is accurate but opaque. The link gives users who want to verify the equivalence a concrete reference without leaving the context of their report. The `encodeURIComponent` handles country names with spaces or special characters in the URL.

---

## What was NOT changed

- Affinity algorithm: `calculateDurationAffinity`, `calculateCreditsAffinity`, `calculateCreditRatioAffinity`, `calculateGradingAffinity`, `calculateEqfAffinity`, `calculateAffinityPercentage`, `calculateOverallAffinity` — all functions are identical
- Overall score calculation and Doughnut chart rendering
- PDF export (`handlePrint` with `html2canvas` + `jsPDF`)
- FeedbackModal
- Database schema and JPA entities
- All existing API endpoints — no existing endpoint is modified or removed
- Admin dashboard (Countries, Programs, Users management)
- Security configuration and JWT auth flow
- Frontend routing for all existing pages

---

## How to test manually

### Backend
1. Start backend: `./mvnw spring-boot:run` (from `backend/`)
2. Hit the new endpoint in Swagger or curl:
   ```
   GET /api/countries/comparison?country1Id=1&country2Id=2
   ```
   Confirm response contains `country1`, `representativeProgram1`, `hasSpecialProgram1`, `country2`, `representativeProgram2`, `hasSpecialProgram2`
3. Try with an invalid ID (e.g. `country1Id=9999`) → expect 404 from existing `NotFoundException` handler

### Frontend — Shareable URL
1. Start frontend: `npm run dev` (from `frontend/`)
2. Select two countries and generate report
3. Verify the URL in the address bar is `/affinity-report?country1=X&country2=Y` with actual IDs
4. Copy that URL and open it in a new browser tab (or incognito) → report should load with full data
5. Check Network tab: exactly 1 request to `/api/countries/comparison`, zero calls to `/representative-program` or `/has-special-program`
6. Navigate to `/affinity-report` with no query params → "No comparison data" alert with "Back to Homepage" button

### Frontend — Grade Comparison page
1. Generate any affinity report
2. In the grading row, click "Compare grading scales →"
3. Confirm URL changes to `/grade-comparison?country1Name=X&country2Name=Y`
4. Confirm table renders both countries as rows with A/B/C/D-E/F columns
5. For a country not in `gradingScales.js`, confirm "N/A" renders without crashing
6. Click "← go back" → returns to the affinity report page with the same URL params
7. Test with country names containing spaces (e.g. "United Kingdom") — URL encoding must not break routing

---

## Automated tests

This sprint's changes are covered by two test classes.

**`BachelorProgramServiceTest`** (`backend/src/test/java/com/ivancroce/backend/services/BachelorProgramServiceTest.java`):

| Test | What it verifies |
|---|---|
| `standardProgramFound_returnsIt` | Standard program (duration = 16 − yearsCompulsorySchooling, non-special) is returned when it exists |
| `standardProgramAbsent_fallsBackToLongest` | When no standard program matches, the longest program for the country is returned (handles e.g. Poland's 3.5-year degree) |
| `noProgramsFound_throwsNotFoundException` | When no programs exist at all, `NotFoundException` is thrown |

**`CountryControllerTest`** (`backend/src/test/java/com/ivancroce/backend/controllers/CountryControllerTest.java`) — covers the comparison endpoint:

| Test | What it verifies |
|---|---|
| `comparison_validDifferentCodes_returns200` | `GET /api/countries/comparison?c1=IT&c2=IE` → 200 |
| `comparison_sameCode_returns400` | Same country code in both params → 400 (controller guard) |
| `comparison_missingC1Param_returns400` | Missing required `c1` parameter → 400 (`MissingServletRequestParameterException` handler) |

Run: `./mvnw.cmd test -Dtest="BachelorProgramServiceTest,CountryControllerTest"` (from `backend/`)
