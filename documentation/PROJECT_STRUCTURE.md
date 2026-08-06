# BookVerse Project Structure

```text
BookVerse/
├── frontend/
│   ├── pages/
│   │   ├── public/
│   │   ├── user/
│   │   ├── librarian/
│   │   └── admin/
│   ├── components/
│   ├── css/
│   ├── js/
│   └── assets/
│       ├── images/
│       ├── icons/
│       └── book-covers/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── models/
│   ├── services/
│   ├── validators/
│   ├── utils/
│   ├── uploads/
│   │   ├── book-covers/
│   │   └── profile-images/
│   ├── app.js
│   └── server.js
├── database/
│   ├── schema.sql
│   ├── sample_data.sql
│   ├── indexes.sql
│   ├── views.sql
│   ├── procedures.sql
│   └── triggers.sql
├── documentation/
│   ├── erd/
│   ├── relational-schema/
│   ├── api-documentation/
│   ├── screenshots/
│   ├── project-report/
│   ├── AI_DEVELOPMENT_RULES.md
│   ├── PROJECT_STRUCTURE.md
│   ├── MODULE_PLAN.md
│   └── PROJECT_PROGRESS.md
├── .gitignore
└── README.md
```

## Responsibilities

### Frontend

Contains browser pages, reusable visual components, CSS, browser-side JavaScript, and static assets. It communicates with Express through `/api` endpoints only.

### Backend

Contains application configuration, routes, controllers, models, services, middleware, validators, utilities, and uploaded files.

### Database

Contains independently executable PostgreSQL scripts for schema, indexes, views, procedures/functions, triggers, and sample data.

### Documentation

Contains the approved ERD, relational schema, API documentation, screenshots, report materials, development rules, and progress records.
