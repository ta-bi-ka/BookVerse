# BookVerse Task Ownership

| Task | Owner | Branch | Expected Files | Status |
|---|---|---|---|---|
| PostgreSQL schema | Developer A | feature/database-schema | database/schema.sql | In Progress |
| Homepage UI | Developer B | feature/homepage-ui | frontend/pages/public/index.html | In Progress |
| Express setup | Unassigned | - | backend/app.js, backend/server.js | Pending |

## Status Values

- Pending
- In Progress
- Testing
- Pull Request
- Completed

## Rules

1. Every active task must have one owner.
2. Both developers may work in frontend and backend.
3. Active tasks should not modify the same files.
4. Shared files require temporary ownership.
5. Every completed task must use a pull request.
6. Both developers pull main after every merge.


