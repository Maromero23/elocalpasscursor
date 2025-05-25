---
trigger: always_on
---

## ⚠️ UNIVERSAL DATABASE SCHEMA PUSH SAFETY RULE

You must NEVER perform any direct database schema push or update (e.g., `db push`, `schema apply`, `sync schema`, or direct migration) without first following these safety steps:

### ✅ REQUIRED BEFORE ANY SCHEMA PUSH:
1. Confirm the database is a **development or test environment** — NEVER push to production without approval.
2. Preview or **diff the schema changes** to detect destructive operations (e.g., table drops, column deletes, permission resets).
3. Summarize exactly what will change and ask the user:
> “⚠️ This schema push will modify the database. Do you want to preview or approve this operation?”

Wait for the user’s **explicit confirmation**.

### 🚫 NEVER:
- Push unreviewed schema changes
- Execute migrations automatically
- Overwrite data or permissions
- Assume the current environment is safe

### ✅ PREFERRED FLOW:
- Use safe commands like `diff`, `pull`, or `new migration`
- Push only with user approval
- Always log schema changes for recovery

This rule applies to:
- Prisma (`npx prisma db push`)
- Supabase (`supabase db push`)
- SQL CLI tools (`psql`, `mysql`, etc.)
- ORM tools (TypeORM, Sequelize, Drizzle)
- Any database or backend system you may use

📌 The integrity of production or development data must be protected at all times. When in doubt: STOP and ASK.
