---
name: change-database-schema
description: Changes a production database schema safely with a migration tool (Alembic, Drizzle, Django, Prisma, and similar) - edit the models, generate a migration, review what the generator got wrong, apply it locally, keep it compatible with the code still running during deploy, adopt migrations on an existing database without touching its data, and regenerate the ER diagram. Use when the user says things like "add a column", "add a table", "change the schema", "generate a migration", "the migration failed in production", or "set up migrations for an existing database".
---

# Change a database schema

Starter file, in this repository: `templates/web-modern/scripts/er_diagram.py` (Mermaid ER diagram from SQLAlchemy models). Tool commands: [references/migration-tools.md](references/migration-tools.md).

## Rules

- Production data is kept. Never reset, drop, or recreate the production database to get past a schema problem
- Every change goes through a migration file committed to the repository. No manual `ALTER` on production
- Ask before running anything against a shared or production database

## 1. Change the models, generate the migration

1. Edit the model or schema definition
2. Generate the migration with the tool's autogenerate command and a message that says what changes
3. Read the generated file. Generators routinely get these wrong:
   - A rename becomes a drop plus an add, which loses the data. Write the rename by hand
   - A new `NOT NULL` column on a table with rows needs a default or a backfill step first
   - Changes to types, enums, and constraints may be missed or need an explicit `USING` cast
   - Data migrations (filling a new column from old ones) are never generated; add them
   - Large tables: create indexes in a way that does not lock writes (for example `CONCURRENTLY` on PostgreSQL, outside a transaction)
4. Apply it locally, run the tests, and try the downgrade if the tool supports it

## 2. Stay compatible during deploy

The migration runs before or while the old code is still serving. Make each step work with both versions (expand, then contract):

1. Add new columns and tables (nullable or with defaults); deploy code that writes both old and new
2. Backfill
3. Deploy code that reads only the new structure
4. Remove the old columns in a later migration

Run migrations as a separate step before the new code starts (a release job; see `cloud-run:deploy-to-cloud-run`), or at startup only when a single instance starts at a time.

## 3. Adopt migrations on an existing database

When the database already has the tables, generate the initial migration from the models, check it matches the live schema (diff the two), then mark the database as being at that revision without running it (`alembic stamp head`, `migrate --fake-initial`, or the tool's baseline command). From then on, every change is a normal migration.

## 4. After the change

- Regenerate the ER diagram (`python scripts/er_diagram.py {module}:Base docs/database-er.md`) and commit it with the migration
- Update the API reference and screen specs if fields became visible to users
