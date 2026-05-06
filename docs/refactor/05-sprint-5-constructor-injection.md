# Sprint 5 — Constructor Injection Refactor

**Branch:** `refactor/sprint-5-constructor-injection`
**Base:** `develop`

---

## Problem

All 11 backend classes use `@Autowired` field injection (22 occurrences total). Spring resolves these via reflection at runtime. Problems:

- Fields cannot be `final` → dependencies are mutable after construction
- Missing beans fail at request time as `NullPointerException`, not at startup
- Tests must use `@SpringBootTest` or `ReflectionTestUtils` — no plain `new MyService(mock)` possible
- Circular dependencies are silently accepted instead of caught at wiring time

## Fix

Replace every `@Autowired` field with Lombok `@RequiredArgsConstructor` + `final` fields. Lombok generates the constructor; Spring injects through it. No reflection involved.

### Pattern

**Before:**
```java
@Service
public class AuthService {
    @Autowired
    private UserService userService;
    @Autowired
    private BCryptPasswordEncoder bCrypt;
    @Autowired
    private JWTTools jwtTools;
}
```

**After:**
```java
@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserService userService;
    private final BCryptPasswordEncoder bCrypt;
    private final JWTTools jwtTools;
}
```

Steps per class:
1. Add `@RequiredArgsConstructor` to the class
2. Remove all `@Autowired` annotations
3. Add `final` to each injected field
4. Remove unused `import org.springframework.beans.factory.annotation.Autowired;`
5. Add `import lombok.RequiredArgsConstructor;`

---

## Scope — 11 files, 22 @Autowired occurrences

| File | Fields |
|---|---|
| `runners/DataInitializer.java` | 3 |
| `security/JWTCheckerFilter.java` | 2 |
| `services/AuthService.java` | 3 |
| `services/BachelorProgramService.java` | 2 + fix flush-left annotation indentation |
| `services/CountryService.java` | 1 |
| `services/ExcelImportService.java` | 2 |
| `services/UserService.java` | 2 |
| `controllers/AuthController.java` | 1 |
| `controllers/BachelorProgramController.java` | 1 |
| `controllers/CountryController.java` | 3 |
| `controllers/FeedbackController.java` | 1 |
| `controllers/UserController.java` | 1 |

`MailgunSender.java` already uses constructor injection — no change needed.

### Special case: `JWTCheckerFilter`

Extends `OncePerRequestFilter`. Spring manages this bean; constructor injection works identically — Spring calls the generated constructor. Same pattern applies.

---

## What NOT to change

- DTOs, entities, repositories, config classes
- `@Component` / `@Service` / `@RestController` annotations
- Field visibility (keep `private`)
- Frontend — untouched
- No new tests in this sprint
- No setter injection

---

## Verification checklist

- [ ] `grep -r "@Autowired" backend/src/main/java` → zero matches
- [ ] `./mvnw clean package` passes (no compile errors)
- [ ] `./mvnw test` passes
- [ ] App boots: check logs for successful startup and "Seeding countries" messages
- [ ] Swagger UI loads at `/swagger-ui/index.html`
- [ ] `GET /api/countries/comparison?c1=IT&c2=IE` returns 200
- [ ] `POST /api/auth/login` with valid credentials returns JWT
- [ ] Protected endpoint without token returns 401 JSON (not 500)
