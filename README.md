# Education Platform

A responsive education content platform with a secure admin dashboard for managing classes, books, PDFs, covers, videos, and student questions.

## Stack

- Next.js + TypeScript
- PostgreSQL + Prisma
- Auth.js
- Tailwind CSS + shadcn/ui
- S3-compatible object storage

## Local setup

1. Install Node.js 20 LTS or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and configure PostgreSQL, Auth.js, and storage.
4. Run `npx prisma migrate dev`.
5. Run `npm run dev`.

See `docs/ARCHITECTURE.md` for the implementation plan.
