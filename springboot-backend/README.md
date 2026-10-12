# Grevya HR Portal Spring Boot API

This is the Spring Boot backend for the React HR portal.

## Requirements

- Java 17+
- Maven 3.9+

## Run

```bash
cd springboot-backend
mvn spring-boot:run
```

The API runs on:

```text
http://localhost:8080
```

The React app proxies `/api` to this backend during development.

## Demo logins

```text
admin@grevya.com / admin123
hr@grevya.com / hr123
manager@grevya.com / mgr123
employee@grevya.com / emp123
```

## Main endpoints

```text
POST   /api/auth/login
GET    /api/bootstrap
GET    /api/employees
POST   /api/employees
PUT    /api/employees/{id}
DELETE /api/employees/{id}
GET    /api/hr-managers
POST   /api/hr-managers
PUT    /api/hr-managers/{id}
PATCH  /api/hr-managers/{id}/toggle-status
DELETE /api/hr-managers/{id}
PUT    /api/leave-requests/{id}
POST   /api/leave-requests
PUT    /api/notifications/{id}/read
PUT    /api/notifications/mark-all-read
GET    /api/jobs
POST   /api/jobs
PUT    /api/jobs/{id}
GET    /api/candidates
POST   /api/candidates
PUT    /api/candidates/{id}
```
