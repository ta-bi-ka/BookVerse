# BookVerse AI Development Rules

## Project Stack

- Frontend: HTML, CSS, JavaScript, Bootstrap 5
- Backend: Node.js, Express.js
- Database: PostgreSQL
- Database driver: `pg`
- Module system: CommonJS
- Authentication: `express-session` and `bcrypt`
- File uploads: `multer`

## Approved Architecture

- Routes define endpoints and middleware.
- Controllers handle HTTP requests and responses.
- Models contain PostgreSQL queries.
- Services contain multi-step business logic and transactions.
- Middleware handles authentication, authorization, validation, uploads, and errors.
- Validators validate request data.
- Frontend communicates with the backend only through `/api` routes.
- Frontend must never connect directly to PostgreSQL.

## Restrictions

- Do not redesign the approved ERD.
- Do not create new entities without explicit permission.
- Do not rename folders, files, routes, tables, or columns without permission.
- Do not install new packages without permission.
- Do not use React, TypeScript, JWT, Sequelize, Prisma, or another ORM.
- Do not use MySQL syntax, `mysql2`, or `AUTO_INCREMENT`.
- Do not place SQL inside routes.
- Do not place large business logic inside controllers.
- Do not modify unrelated modules.
- Do not replace working files unnecessarily.
- Do not expose passwords, stack traces, or raw database errors to clients.
- Do not permanently delete historical borrowing records.

## Naming Rules

- Folder names: lowercase
- JavaScript files: camelCase
- PostgreSQL tables: lowercase plural snake_case
- PostgreSQL columns: snake_case
- API routes: lowercase plural
- JavaScript variables: camelCase

## Standard API Response

Success:

```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": {}
}
```

Failure:

```json
{
  "success": false,
  "message": "The request could not be completed.",
  "errors": []
}
```

## Change-Control Rules

Before changing code:

1. Read this file and all files directly related to the task.
2. State a brief implementation plan.
3. List exact files that will be created or modified.
4. Keep the scope limited to the requested task.
5. Stop and explain before touching an out-of-scope file.

After changing code:

1. Run relevant tests or verification commands.
2. Report all commands executed.
3. Report files created and modified.
4. Report tests passed and failed.
5. Report remaining risks and edge cases.
6. Do not claim success when tests fail.

## Bounded Self-Correction Loop

For each task:

1. Inspect
2. Plan
3. Implement
4. Test
5. Review failure cases
6. Fix confirmed defects
7. Test again
8. Stop and report

Use a maximum of three fix attempts. After three failed attempts, stop and report the exact error, likely cause, files involved, and attempted fixes.

## Protected Working-Code Rules

- Prefer minimal targeted edits.
- Preserve existing exports, route paths, middleware order, and response formats.
- Do not rewrite an entire file when a small safe change is sufficient.
- Do not silently remove existing behavior.
- Do not modify files outside the task scope.

## Security and Integrity Rules

- Hash passwords with bcrypt.
- Never return password hashes in API responses.
- Public registration always creates a Student/User account.
- Never trust a role supplied by a public registration request.
- Enforce authorization on the backend.
- Use transactions for borrowing, returning, reservation fulfillment, and fine generation.
- Roll back all transaction steps when one step fails.
- Validate all IDs, statuses, and required fields.
- Prevent duplicate active borrows, duplicate reservations, duplicate fines, and duplicate user reviews where required.
