# Migration tool commands

Check the tool's current documentation; flags change between versions.

| Step | Alembic (SQLAlchemy) | Drizzle | Django | Prisma |
| --- | --- | --- | --- | --- |
| Generate | `alembic revision --autogenerate -m "{message}"` | `drizzle-kit generate` | `python manage.py makemigrations` | `prisma migrate dev --name {message}` |
| Apply | `alembic upgrade head` | `drizzle-kit migrate` | `python manage.py migrate` | `prisma migrate deploy` |
| Show state | `alembic current`, `alembic history` | `drizzle-kit check` | `python manage.py showmigrations` | `prisma migrate status` |
| Adopt an existing database | `alembic stamp head` | generate a baseline, then mark it applied in the journal | `migrate --fake-initial` | `prisma migrate resolve --applied {name}` |
| Do not use on production | `alembic downgrade` without a plan | `drizzle-kit push` | `migrate {app} zero` | `prisma db push`, `migrate reset` |

## Running in containers

Run the commands inside the backend container so they use the same environment as the app (`docker compose exec backend alembic upgrade head`).

## Applying at startup

Running `upgrade` when the app starts is convenient for a single instance. With several instances starting together, two can run the same migration at once. Use a separate migration job, or a database lock, in that case.

## Drizzle `push`

`push` applies the schema directly without a migration file. It is fine for a throwaway local database and wrong for production: there is no reviewed, repeatable record of the change.
