# 🔌 API Reference

Complete reference of every REST endpoint in the backend. All endpoints are under the base path `/api`.

---

## Authentication

### `POST /api/auth/login`
**Access**: Public  
**Purpose**: Authenticate a user and get a JWT token.

**Request Body**:
```json
{
  "email": "admin@example.com",
  "password": "your_password"
}
```

**Response** (`200 OK`):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9..."
}
```

**Errors**: `401 Unauthorized` if credentials are invalid.

---

## Countries

### `GET /api/countries/simple`
**Access**: Public  
**Purpose**: Get a lightweight list of all countries (for dropdown selectors).

**Response** (`200 OK`):
```json
[
  { "id": 1, "name": "Italy", "countryCode": "IT" },
  { "id": 2, "name": "Germany", "countryCode": "DE" },
  ...
]
```

---

### `GET /api/countries/{id}`
**Access**: Public  
**Purpose**: Get full details of a single country.

**Response** (`200 OK`):
```json
{
  "id": 1,
  "name": "Italy",
  "yearsCompulsorySchooling": 13,
  "gradingSystem": "18-30",
  "creditRatio": "25/30",
  "countryCode": "IT"
}
```

---

### `GET /api/countries/{countryId}/representative-program`
**Access**: Public  
**Purpose**: Get the standard bachelor program used for affinity comparison.

**Logic**: Returns the program where `duration = 16 - yearsCompulsorySchooling` and `isSpecialProgram = false`. Falls back to the longest-duration program.

**Response** (`200 OK`):
```json
{
  "id": 5,
  "duration": 3,
  "isSpecialProgram": false,
  "creditsPerYear": 60,
  "totalCredits": 180,
  "eqfLevel": 6,
  "officialDenomination": "Laurea",
  "countryId": 1
}
```

---

### `GET /api/countries/{countryId}/has-special-program`
**Access**: Public  
**Purpose**: Check if a country has any special (alternative duration) programs.

**Response** (`200 OK`):
```json
true
```

---

### `GET /api/countries`
**Access**: ADMIN only  
**Purpose**: Paginated list of all countries.

**Query Params**: `page` (default: 0), `size` (default: 10, max: 50), `sortBy` (default: "id")

**Response**: Spring `Page<Country>` JSON.

---

### `GET /api/countries/{countryId}/bachelor-programs`
**Access**: ADMIN only  
**Purpose**: Get all bachelor programs for a country.

**Response** (`200 OK`): `List<BachelorProgram>`.

---

### `POST /api/countries`
**Access**: ADMIN only  
**Purpose**: Create a new country.

**Request Body**:
```json
{
  "name": "France",
  "yearsCompulsorySchooling": 12,
  "gradingSystem": "0-20",
  "creditRatio": "25/30",
  "countryCode": "FR"
}
```

**Response** (`201 Created`): The created `Country` object.

---

### `PUT /api/countries/{id}`
**Access**: ADMIN only  
**Purpose**: Update an existing country.

**Request Body**: Same as POST.  
**Response** (`200 OK`): The updated `Country` object.

---

### `DELETE /api/countries/{id}`
**Access**: ADMIN only  
**Response**: `204 No Content`

---

### `GET /api/countries/search`
**Access**: ADMIN only  
**Purpose**: Search countries by ID or schooling years.

**Query Params**: `id`, `yearsCompulsorySchooling`, `page`, `size`, `sortBy`, `direction`

---

## Bachelor Programs

### `GET /api/bachelor-programs`
**Access**: ADMIN only  
**Purpose**: Paginated list of all programs.

**Query Params**: `page`, `size`, `sortBy`

---

### `GET /api/bachelor-programs/{id}`
**Access**: ADMIN only

---

### `POST /api/bachelor-programs`
**Access**: ADMIN only

**Request Body**:
```json
{
  "duration": 3,
  "isSpecialProgram": false,
  "creditsPerYear": 60,
  "eqfLevel": 6,
  "officialDenomination": "Laurea",
  "countryId": 1
}
```

**Note**: `totalCredits` is auto-calculated as `duration × creditsPerYear`.

**Response** (`201 Created`): The created `BachelorProgram` object.

---

### `PUT /api/bachelor-programs/{id}`
**Access**: ADMIN only  
**Request Body**: Same as POST.

---

### `DELETE /api/bachelor-programs/{id}`
**Access**: ADMIN only  
**Response**: `204 No Content`

---

### `GET /api/bachelor-programs/search`
**Access**: ADMIN only  
**Query Params**: `countryId`, `duration`, `isSpecialProgram`, `page`, `size`, `sortBy`, `direction`

---

## Users

### `GET /api/users`
**Access**: ADMIN only  
**Purpose**: Paginated list of all users (returns `UserDetailDTO` — no passwords).

---

### `GET /api/users/{id}`
**Access**: ADMIN only  
**Response**: `UserDetailDTO`

---

### `GET /api/users/me`
**Access**: STUDENT or ADMIN  
**Purpose**: Get the current authenticated user's profile.

---

### `POST /api/users`
**Access**: ADMIN only  
**Purpose**: Create a new user.

**Request Body**:
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "USER"
}
```

**Response** (`201 Created`): `{ "userId": 42 }`

---

### `PUT /api/users/{id}`
**Access**: ADMIN only

**Request Body**:
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "STUDENT",
  "password": "newPassword",
  "avatarUrl": "https://..."
}
```

**Note**: `password` and `avatarUrl` are optional — if blank/null, they are not changed.

---

### `DELETE /api/users/{id}`
**Access**: ADMIN only  
**Response**: `204 No Content`

---

### `GET /api/users/search`
**Access**: ADMIN only  
**Query Params**: `role`, `search` (searches across firstName, lastName, username, email), `page`, `size`, `sort`, `direction`

---

## Feedback

### `POST /api/feedback`
**Access**: Public  
**Purpose**: Submit a feedback email (sent via Mailgun).

**Request Body**:
```json
{
  "feedbackType": "bug",
  "message": "The grading system for France seems incorrect.",
  "userEmail": "user@example.com",
  "country1": "France",
  "country2": "Germany"
}
```

**Response** (`200 OK`):
```json
{
  "message": "Feedback submitted successfully!",
  "userEmail": "user@example.com",
  "feedbackType": "bug",
  "timestamp": "2026-03-09T12:30:00"
}
```

---

## Swagger / OpenAPI

Swagger UI is available at:
- **Local**: `http://localhost:3001/swagger-ui/index.html`
- **Production**: `https://extraordinary-greer-ictech-3392249e.koyeb.app/swagger-ui/index.html`

OpenAPI JSON spec: `http://localhost:3001/v3/api-docs`
