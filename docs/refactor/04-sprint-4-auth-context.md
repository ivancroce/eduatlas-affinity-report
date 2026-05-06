# Sprint 4 — Replace CustomEvent Auth Bus with React AuthContext

## Branch
`refactor/sprint-4-auth-context` (branch from `develop`)

## Problem

The app syncs auth state across components using the global event bus anti-pattern:

```js
// LoginPage.jsx — producer
window.dispatchEvent(new CustomEvent("userLoggedIn", { detail: { role, userId } }));

// MyNavBar.jsx — consumer
window.addEventListener("userLoggedIn", handleUserLogin);
```

Symptoms:
- `jwtDecode` + `localStorage` calls scattered across 3 files (`LoginPage`, `MyNavBar`, `ProtectedRoute`)
- Silent failures if the event name is misspelled anywhere
- No single source of truth for auth state — each component independently reads and decodes the token
- `MyNavBar` needs a `useEffect` with multiple event listeners just to know if the user is logged in
- `MyNavBar` has an `isLoading` guard that flashes a minimal navbar on every page load while the effect fires

## Fix

Replace with a `React AuthContext` (~50 lines). One place owns auth state; all components subscribe via `useAuth()`.

---

## Files Changed

| File | Action |
|---|---|
| `frontend/src/context/AuthContext.jsx` | **CREATE** |
| `frontend/src/main.jsx` | Add `<AuthProvider>` wrapper |
| `frontend/src/pages/LoginPage/LoginPage.jsx` | Replace localStorage + jwtDecode + CustomEvent with `login(token)` |
| `frontend/src/components/MyNavBar/MyNavBar.jsx` | Replace all auth logic with `useAuth()`, delete event listeners + loading state |
| `frontend/src/components/ProtectedRoute/ProtectedRoute.jsx` | Replace `checkAuth()` with `useAuth()`, delete jwtDecode |
| `frontend/src/api/axios.js` | Add 401 response interceptor (excluding `/auth/login`) |
| `frontend/src/components/MyNavBar/MyNavBar.jsx` | Also add Login button (with icon) shown when `!user` |

---

## Step 1 — Create `frontend/src/context/AuthContext.jsx`

**Why:** Single source of truth for auth state. All decoding and localStorage access lives here only.

```jsx
import { createContext, useContext, useState } from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext(null);

const getInitialUser = () => {
  const token = localStorage.getItem("accessToken");
  if (!token) return null;
  const decoded = jwtDecode(token);
  if (decoded.exp < Date.now() / 1000) {
    localStorage.removeItem("accessToken");
    return null;
  }
  return decoded;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getInitialUser);

  const login = (token) => {
    localStorage.setItem("accessToken", token);
    const decoded = jwtDecode(token);
    setUser(decoded);
    return decoded; // returned so LoginPage can navigate by role without re-decoding
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

**Why `getInitialUser` is module-level:** passed as a lazy initializer to `useState` — React calls it once on mount, never again on re-renders. Handles page-refresh persistence and expired-token cleanup synchronously.

**Why `login()` returns decoded:** React state updates are async; `user` won't reflect the new value in the same frame as `setUser`. Returning decoded lets LoginPage navigate by role immediately without re-importing `jwtDecode`.

---

## Step 2 — Update `frontend/src/main.jsx`

**Why:** `AuthProvider` must wrap the entire tree so every consumer (`LoginPage`, `MyNavBar`, `ProtectedRoute`) can call `useAuth()`.

**Before:**
```jsx
createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
```

**After:**
```jsx
import { AuthProvider } from "./context/AuthContext";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
);
```

---

## Step 3 — Update `frontend/src/pages/LoginPage/LoginPage.jsx`

**Why:** LoginPage currently does localStorage.set + jwtDecode + CustomEvent dispatch — 7 lines replaced by 1.

**Before (lines 5, 34–53):**
```js
import { jwtDecode } from "jwt-decode";
// ...
localStorage.setItem("accessToken", token);
const decoded = jwtDecode(token);
const userRole = decoded.role;
window.dispatchEvent(
  new CustomEvent("userLoggedIn", {
    detail: { role: userRole, userId: decoded.sub }
  })
);
if (userRole === "ADMIN") {
  navigate("/admin-dashboard");
} else {
  navigate("/student-dashboard");
}
```

**After:**
```js
import { useAuth } from "../../context/AuthContext";
// ... (in component body alongside useNavigate)
const { login } = useAuth();
// ... (in handleSubmit, after getting token from response)
const decoded = login(token);
if (decoded.role === "ADMIN") {
  navigate("/admin-dashboard");
} else {
  navigate("/student-dashboard");
}
```

---

## Step 4 — Update `frontend/src/components/MyNavBar/MyNavBar.jsx`

**Why:** The navbar currently maintains its own `userRole` state, decodes the JWT itself, and listens to two window events (`"userLoggedIn"`, `"storage"`) to stay in sync. All of this is replaced by a single `useAuth()` call.

**Remove:**
- `import { jwtDecode } from "jwt-decode"` (line 4)
- `useEffect` from the React import (line 5); only `useState` remains
- `const [userRole, setUserRole] = useState(null)` (line 14)
- `const [isLoading, setIsLoading] = useState(true)` (line 15)
- Entire `checkUserRole()` function (lines 19–37)
- Entire `useEffect` block with event listeners (lines 40–64)
- The `isLoading` early-return guard block (lines 84–96)
- Inside `confirmLogout`: `localStorage.removeItem("accessToken")`, `setUserRole(null)`, `window.dispatchEvent(new CustomEvent("userLoggedOut"))` (lines 71–72, 77)

**Add:**
```js
import { useAuth } from "../../context/AuthContext";
// ... (in component body)
const { user, logout } = useAuth();
```

**Update `confirmLogout`:**
```js
// Before:
const confirmLogout = () => {
  localStorage.removeItem("accessToken");
  setUserRole(null);
  setShowLogoutModal(false);
  navigate("/");
  window.dispatchEvent(new CustomEvent("userLoggedOut"));
};

// After:
const confirmLogout = () => {
  logout();
  setShowLogoutModal(false);
  navigate("/");
};
```

**Update all `userRole` references in JSX:**
```
{userRole && (                               → {user && (
{userRole === "ADMIN" ? "Admin" : "Student"} → {user.role === "ADMIN" ? "Admin" : "Student"}
{userRole === "ADMIN" && (   (×2)            → {user.role === "ADMIN" && (
{userRole === "STUDENT" && (                 → {user.role === "STUDENT" && (
```

**Side effect of removing `isLoading`:** the flicker on page load (minimal navbar → full navbar) is eliminated, because `user` is initialized synchronously via `getInitialUser` — no effect needed.

---

## Step 5 — Update `frontend/src/components/ProtectedRoute/ProtectedRoute.jsx`

**Why:** ProtectedRoute currently re-decodes the JWT on every render. With AuthContext, `user` is already available and always current.

**Before (full file body):**
```js
import { jwtDecode } from "jwt-decode";

const ProtectedRoute = ({ children, requiredRole }) => {
  const checkAuth = () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      return { isAuthenticated: false, userRole: null, error: "No token found" };
    }
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      if (decoded.exp < currentTime) {
        localStorage.removeItem("accessToken");
        return { isAuthenticated: false, userRole: null, error: "Token expired" };
      }
      return { isAuthenticated: true, userRole: decoded.role, error: null };
    } catch (error) {
      console.error("Error decoding token:", error);
      localStorage.removeItem("accessToken");
      return { isAuthenticated: false, userRole: null, error: "Invalid token" };
    }
  };

  const { isAuthenticated, userRole, error } = checkAuth();

  if (!isAuthenticated) {
    console.log("Access denied:", error);
    return <Navigate to="/" replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    console.log(`Access denied: Required role ${requiredRole}, user has ${userRole}`);
    return <Navigate to="/" replace />;
  }

  return children;
};
```

**After:**
```js
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
```

`console.log` calls removed — they were debugging artifacts that leak auth logic into user devtools.

---

## Step 6 — Add 401 Response Interceptor to `frontend/src/api/axios.js`

**Why:** Without this, a mid-session token expiry (backend returns 401) surfaces as a cryptic error to the user. The interceptor handles it globally: clear token + redirect to home. The `/auth/login` exclusion is critical — wrong password returns 401, and we want `LoginPage`'s try/catch to surface the inline error, not redirect.

**Before (no response interceptor):**
```js
const api = axios.create({ baseURL: API_BASE_URL });
api.interceptors.request.use(...); // only request interceptor existed
```

**After (add after existing request interceptor):**
```js
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginAttempt = error.config?.url?.includes("/auth/login");
    if (error.response?.status === 401 && !isLoginAttempt) {
      localStorage.removeItem("accessToken");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);
```

---

## Step 7 — Add Login Button to `frontend/src/components/MyNavBar/MyNavBar.jsx`

**Why:** There is currently no Login link in the navbar. Users who aren't logged in can only reach `/login` by typing the URL. Add a visible Login link using `BsBoxArrowInRight` (from `react-icons/bs`, already used in the file), shown only when `!user`.

**Where:** In the `<Nav>` block alongside the Home link, rendered when `!user` (mutually exclusive with the dropdown):

```jsx
{!user ? (
  <Nav.Link
    onClick={() => navigate("/login")}
    className={`d-flex align-items-center ${location.pathname === "/login" ? "active" : ""}`}
  >
    <BsBoxArrowInRight size={20} className="me-1" />
    Login
  </Nav.Link>
) : (
  <NavDropdown ...>...</NavDropdown>
)}
```

---

## Implementation Order

1. Create `AuthContext.jsx` (consumers depend on it)
2. Update `main.jsx` (provider must be in tree before consumers render)
3. Update `ProtectedRoute.jsx`
4. Update `LoginPage.jsx`
5. Update `MyNavBar.jsx` (largest change, includes login button)
6. Update `axios.js` (add 401 response interceptor)

---

## What Was NOT Changed

- `frontend/src/api/axios.js` request interceptor — reads `localStorage.getItem("accessToken")` directly. This is correct; axios runs outside React's tree and cannot use hooks. A response interceptor was added (see Step 6); the request interceptor is unchanged.
- `frontend/src/App.jsx` — routing structure and `<ProtectedRoute>` usage unchanged. The `requiredRole` prop interface stays the same.
- JWT structure — nothing about how the token is issued or stored changes. `user.role` and `user.sub` are the same claims as before.
- `ProtectedRoute` `console.log` calls — removed in this refactor (they leaked auth logic into user devtools and were debugging artifacts).
- httpOnly cookie migration — out of scope; would require backend + CORS changes.
- Refresh token flow — out of scope.

---

## Manual Testing Checklist

- [ ] Hard-refresh the home page — navbar renders immediately, no flicker (no loading guard anymore)
- [ ] Navigate to `/admin-dashboard` without logging in → redirected to `/`
- [ ] Navigate to `/student-dashboard` without logging in → redirected to `/`
- [ ] Log in as admin → redirected to `/admin-dashboard`, navbar shows Admin dropdown with Backoffice link
- [ ] Log in as student → redirected to `/student-dashboard`, navbar shows Student dropdown with My Dashboard link
- [ ] While logged in, click Logout → confirmation modal appears
- [ ] Confirm logout → redirected to `/`, navbar hides the dropdown
- [ ] After logout, try `/admin-dashboard` directly → redirected to `/`
- [ ] Paste a shareable affinity URL (e.g. `/affinity-report?c1=IT&c2=IE`) while logged in → report loads, navbar still shows correct role
- [ ] Paste the same URL in a fresh tab without logging in → report loads (public route), navbar shows no dropdown
- [ ] Refresh the page while logged in → navbar immediately shows correct role (no flash of logged-out state)
