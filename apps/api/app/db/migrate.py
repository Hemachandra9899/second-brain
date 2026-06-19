from sqlalchemy import inspect, text

from app.db.session import engine


def run_migrations():
    inspector = inspect(engine)
    existing_columns = [col["name"] for col in inspector.get_columns("tasks")]

    with engine.begin() as conn:
        if "priority" not in existing_columns:
            conn.execute(text("ALTER TABLE tasks ADD COLUMN priority VARCHAR(50) DEFAULT 'Normal'"))
            print("Added column: priority")

        if "due_date" not in existing_columns:
            conn.execute(text("ALTER TABLE tasks ADD COLUMN due_date VARCHAR(50)"))
            print("Added column: due_date")

        if "source" not in existing_columns:
            conn.execute(text("ALTER TABLE tasks ADD COLUMN source VARCHAR(50) DEFAULT 'second_brain'"))
            print("Added column: source")

    print("Migration complete")
