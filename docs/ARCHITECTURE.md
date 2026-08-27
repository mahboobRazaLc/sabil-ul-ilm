# Architecture and implementation plan

## Principles

Keep public pages, admin workflows, database access, and storage adapters separated. All mutations run on the server, validate input with Zod, authorize the user, and write an audit event.

## Layers

- `app/`: routes, layouts, loading/error states, and server actions
- `components/`: reusable UI and domain-specific admin/public components
- `lib/db/`: Prisma client and repository functions
- `lib/auth/`: Auth.js configuration, role checks, and protected route helpers
- `lib/storage/`: S3-compatible upload, signed download, and delete adapters
- `lib/validation/`: schemas shared by forms and server actions
- `prisma/`: database schema and migrations

## Core workflows

1. Admin signs in with a secure session and receives an ADMIN role.
2. Admin creates classes and subjects.
3. Admin uploads covers and PDFs to private object storage. The database stores metadata, not file contents.
4. Admin creates books and videos, then publishes or saves drafts.
5. Students browse published content and submit questions.
6. Admin answers, archives, or moderates questions. Audit logs record sensitive changes.

## Delivery phases

1. Scaffold, design tokens, responsive shell, and environment configuration.
2. Prisma schema and database repositories.
3. Auth.js login, password hashing, session protection, and role checks.
4. Dashboard navigation and overview metrics.
5. CRUD for classes, subjects, books, media, videos, and questions.
6. Public catalog and content detail pages.
7. Upload constraints, signed URLs, rate limits, audit logs, and security review.
8. Tests, production build, deployment documentation, and backup guidance.
