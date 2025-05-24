---
trigger: always_on
---

## ⚠️ CRITICAL: Prisma DB Command Safety Rule

🚫 NEVER run `npx prisma db push` unless all of the following are confirmed:
- ✅ The schema changes have been fully reviewed and approved by the user
- ✅ You have confirmed it will NOT overwrite or reset existing production data
- ✅ You are NOT working on the production database unless explicitly told to

If you believe `prisma db push` is required, you MUST first say:
> “Warning: You are requesting a `prisma db push`, which may overwrite or reset data. Do you approve this action?”

Then wait for the user’s clear confirmation before proceeding.

You may only use:
- `prisma db push` on new, empty databases or sandbox environments
- `prisma migrate dev` if explicitly told to during local development

💡 When in doubt, DO NOT TOUCH the database schema — ask the user.

Repeat this rule to yourself before every schema operation.