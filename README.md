# BookVerse

BookVerse is a Smart Library Management and Reading Community System developed as a university DBMS project.

## Locked Technology Stack

- Frontend: HTML, CSS, JavaScript, Bootstrap 5
- Backend: Node.js, Express.js
- Database: PostgreSQL
- Database driver: `pg`
- Authentication: `express-session`, `bcrypt`
- File uploads: `multer`
- Module system: CommonJS

## Architecture

- Routes define endpoints and middleware.
- Controllers handle HTTP requests and responses.
- Models contain PostgreSQL queries.
- Services contain multi-step business logic and transactions.
- Middleware handles authentication, authorization, validation, uploads, and errors.
- The frontend communicates with the backend only through `/api` endpoints.

## Current Status

The project skeleton and development rules are prepared. Feature implementation has not started yet.

## Required Build Order

1. PostgreSQL relational schema
2. Database creation and sample data
3. Express foundation and database connection
4. Authentication and sessions
5. Role-based authorization and dashboards
6. Master data CRUD
7. Borrowing, returns, renewals, and reservations
8. Reviews, bookshelves, and profiles
9. Views, procedures, triggers, transactions, logs, and statistics
10. Testing, documentation, presentation, and viva preparation
