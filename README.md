# BookVerse

BookVerse is a Smart Library Management and Reading Community System developed as a university DBMS project.

## Technology Stack

- Frontend: HTML, CSS, JavaScript, Bootstrap 5
- Backend: Node.js and Express.js
- Database: PostgreSQL
- Database driver: `pg`
- Authentication: `express-session` and `bcrypt`
- Module system: CommonJS

## Architecture

The backend follows an MVC-style structure:

- **Routes** define API endpoints and apply middleware.
- **Controllers** validate requests and return HTTP responses.
- **Models** contain PostgreSQL queries.
- **Services** handle multi-step business logic and transactions.
- **Middleware** handles authentication and role authorization.
- **app.js** connects middleware and route groups.
- **server.js** connects PostgreSQL and starts the Express server.

## Backend Status

The backend is feature-complete for the university project scope.

Completed functionality includes:

- Registration, login, logout and session authentication
- Admin, Librarian and Student role authorization
- User role and account management
- User profile and password management
- Author, publisher and genre CRUD
- Book and physical book-copy CRUD
- Book browsing and searching
- Borrowing, returning and renewing books
- Book reservations
- Reviews and ratings
- Personal bookshelves and bookshelf items
- Fine creation, payment and management
- Administrative reports and statistics
- PostgreSQL indexes and views
- Stored functions and procedures
- Automatic timestamp and audit triggers
- Audit logs and procedure-call logs

## User Roles

### Admin

- Manages users and roles
- Manages library records
- Accesses all administrative reports
- Accesses audit and procedure logs

### Librarian

- Manages books and library records
- Manages borrowing, reservations and fines
- Accesses operational reports

### Student

- Registers and manages a personal profile
- Borrows, returns and renews books
- Makes and cancels reservations
- Creates reviews
- Manages personal bookshelves

## Backend Setup

### 1. Install requirements

Install:

- Node.js
- PostgreSQL
- pgAdmin 4

### 2. Install backend packages

Open PowerShell inside the project and run:

```powershell
cd .\backend
npm.cmd ci
the commands to run on the powershell 
cd backend
npm.cmd run dev 