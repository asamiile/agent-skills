# SQLite specifics

## Bootstrapping with Alembic

On startup:

- No `alembic_version` table (a fresh database): create the schema from the models with `create_all`, then `alembic stamp head`. Running every historical migration on an empty database is slower and can fail on SQLite-specific operations
- Otherwise: `alembic upgrade head`

`create_all` alone is never the way to change an existing database: it creates missing tables but never alters existing ones.

## Concurrency

SQLite allows one writer at a time. Set a busy timeout (`connect_args={"timeout": 5}` in SQLAlchemy) so a writer waits for the lock instead of failing at once. Use `check_same_thread=False` when a web framework uses the connection from several threads.

## Schema changes

- Adding a column, including `NOT NULL` with a `server_default`, works directly
- Most other changes (dropping or altering columns, changing constraints) need Alembic's batch mode (`with op.batch_alter_table(...)`), which copies the table
- Enums are stored as plain strings with no CHECK constraint unless one is created explicitly, so adding a value needs no migration of the column, but nothing stops invalid values written outside the ORM. Validate at the application boundary

## Conventions that age well

- Every foreign key gets an `ondelete` policy and an index
- Status-like and type-like columns are enums, never free text
- Timestamps are timezone-aware, with a server default
- Columns used for sorting large lists (creation time) are indexed
