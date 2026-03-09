# 🎨 Frontend Architecture — Deep Dive

This document explains every part of the React frontend so you can quickly understand the component tree, routing, state management, and how the frontend communicates with the backend.

---

## Tech Stack

| Technology         | Purpose                                      |
| :----------------- | :------------------------------------------- |
| React 19           | UI framework (functional components + hooks) |
| Vite 7             | Build tool & dev server                      |
| React Router v7    | Client-side routing                          |
| Axios              | HTTP client (with JWT interceptor)           |
| React Bootstrap 5  | UI component library                         |
| SASS               | Custom styling on top of Bootstrap           |
| Chart.js           | Doughnut chart for affinity scores           |
| html2canvas        | DOM→Canvas screenshot for PDF export         |
| jsPDF              | Generate PDF files client-side               |
| jwt-decode         | Decode JWT to read role & expiry             |
| react-icons        | Icon library (Bootstrap icons via React)     |

---

## File Map

```
frontend/src/
├── main.jsx                           ← Entry point, wraps App in BrowserRouter
├── App.jsx                            ← Root: NavBar + Routes + Footer
├── App.scss                           ← App-level styles
├── index.scss                         ← Global styles
│
├── api/
│   └── axios.js                       ← Axios instance + JWT interceptor
│
├── hooks/
│   └── useAvailableHeight.js          ← Sets CSS var for full-page layouts
│
├── components/
│   ├── MyNavBar/                      ← Navigation bar (shows/hides based on auth)
│   ├── MyFooter/                      ← Footer
│   ├── ProtectedRoute/                ← Route guard (checks JWT token + role)
│   ├── UniversalDropdown/             ← Reusable country selector with search
│   ├── StatCounter/                   ← Animated stat counter (homepage)
│   ├── CountryFlag/                   ← Renders country flag images
│   ├── FeedbackModal/                 ← Modal form for user feedback
│   ├── CountriesManagement/           ← Admin: Countries CRUD table
│   ├── BachelorProgramsManagement/    ← Admin: Bachelor Programs CRUD table
│   └── UsersManagement/               ← Admin: Users CRUD table
│
├── pages/
│   ├── HomePage/                      ← Country comparison form + stats
│   ├── AffinityReportPage/            ← Comparison results, chart, PDF export
│   ├── LoginPage/                     ← Email/password login form
│   ├── AdminDashboard/                ← Tabbed admin panel
│   ├── StudentDashboard/              ← Placeholder ("Coming soon...")
│   └── NotFoundPage/                  ← 404 page
│
└── styles/                            ← Global SCSS partials
```

---

## Routing

Defined in `App.jsx`:

| Path                 | Component            | Access     | Guard                        |
| :------------------- | :------------------- | :--------- | :--------------------------- |
| `/`                  | `HomePage`           | Public     | —                            |
| `/affinity-report`   | `AffinityReportPage` | Public     | —                            |
| `/login`             | `LoginPage`          | Public     | —                            |
| `/admin-dashboard`   | `AdminDashboard`     | ADMIN only | `ProtectedRoute requiredRole="ADMIN"` |
| `/student-dashboard` | `StudentDashboard`   | STUDENT only | `ProtectedRoute requiredRole="STUDENT"` |
| `*`                  | `NotFoundPage`       | Public     | —                            |

### Route Protection (`ProtectedRoute.jsx`)

1. Reads `accessToken` from `localStorage`
2. Decodes it with `jwt-decode` to check expiry and role
3. If no token, expired, or wrong role → redirects to `/`
4. Otherwise renders the child component

---

## API Communication (`api/axios.js`)

```javascript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL  // e.g. "http://localhost:3001/api"
});

// Automatically attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

All API calls throughout the app use `api.get(...)`, `api.post(...)`, etc. — the interceptor handles authentication transparently.

---

## Key Pages — How They Work

### `HomePage.jsx`

**Purpose**: Let the user select two countries and generate a report.

**State**:
- `countries` — fetched from `GET /api/countries/simple` on mount
- `country1`, `country2` — selected country IDs
- `isGeneratingReport`, `isFetchingCountries`, `errorMessage` — UI state

**Flow**:
1. On mount: fetches all countries for the dropdown
2. On "Generate Report": makes 6 parallel API requests:
   - Country details for both (`GET /api/countries/{id}`)
   - Representative programs for both (`GET /api/countries/{id}/representative-program`)
   - Special program flags for both (`GET /api/countries/{id}/has-special-program`)
3. Navigates to `/affinity-report` passing all data via `location.state`

---

### `AffinityReportPage.jsx`

**Purpose**: Display the affinity comparison table and chart.

**Key features**:
- Receives data from `location.state` (no direct API calls)
- **Affinity calculations** are done entirely client-side (see [01-project-overview.md](./01-project-overview.md))
- Comparison table built from `comparisonData` array with 6 rows
- **Doughnut chart** using Chart.js shows the final affinity percentage
- **Export buttons**:
  - **Print**: `window.print()` (hides non-print elements)
  - **Share**: Web Share API with clipboard fallback
  - **PDF**: `html2canvas` captures the report → `jsPDF` generates multi-page PDF
- **Feedback modal**: Opens `FeedbackModal` at the bottom
- Special handling for Poland's 3.5-year duration display

---

### `LoginPage.jsx`

**Purpose**: Email + password login.

**Flow**:
1. User submits form → `POST /api/auth/login` with `{ email, password }`
2. Receives `{ accessToken: "..." }`
3. Stores token in `localStorage`
4. Decodes JWT to get role
5. Dispatches `userLoggedIn` CustomEvent (used by MyNavBar to update UI)
6. Redirects: ADMIN → `/admin-dashboard`, others → `/student-dashboard`

---

### `AdminDashboard.jsx`

**Purpose**: Tabbed admin panel for managing data.

**Structure**:
- 3 tabs: Countries, BA Programs, Users
- Each tab renders a dedicated management component

---

## Reusable Components

### `ProtectedRoute`
Guards routes by checking JWT validity and role. See "Route Protection" above.

### `UniversalDropdown`
A searchable dropdown that can display countries with flags. Used on the home page.

Props: `type`, `countries`, `value`, `onChange`, `placeholder`, `size`, `showSearch`, `showAllCountries`, `loading`

### `CountryFlag`
Renders a flag image for a given country code. Uses a flag CDN URL.

### `StatCounter`
Animated counter that counts up from 0 to a target value. Shows stats on the homepage (e.g., "30+ Countries Covered").

### `FeedbackModal`
Bootstrap modal with a form for submitting feedback. Posts to `POST /api/feedback`.

### `CountriesManagement` / `BachelorProgramsManagement` / `UsersManagement`
Admin CRUD components — each one:
- Fetches paginated data from the backend
- Displays a sortable, searchable table
- Provides Create/Edit/Delete modals
- Uses the Axios instance for all API calls

---

## Custom Hook — `useAvailableHeight`

```javascript
// Sets a CSS variable --available-height to the distance from the
// element to the bottom of the viewport, enabling full-page layouts
// for LoginPage and AdminDashboard without scrolling past the footer
```

---

## Styling Architecture

- **Global**: `index.scss` for resets, variables, typography
- **App-level**: `App.scss` for layout utilities
- **Per-component**: Each component folder has its own `.scss` file (e.g., `HomePage.scss`)
- Bootstrap is overridden with custom SASS variables for brand colors
- Print-specific styles (`.no-print`, `.d-print-none`) handle PDF/print rendering

---

## Environment Variables

| Variable              | File            | Purpose                          |
| :-------------------- | :-------------- | :------------------------------- |
| `VITE_API_BASE_URL`   | `.env` / `.env.local` | Backend API base URL (e.g. `http://localhost:3001/api`) |

Vite requires all custom env variables to be prefixed with `VITE_`.
