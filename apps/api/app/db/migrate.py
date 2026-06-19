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

    existing_tables = inspector.get_table_names()

    if "mood_events" not in existing_tables:
        with engine.begin() as conn:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS mood_events (
                    id VARCHAR PRIMARY KEY,
                    text TEXT NOT NULL,
                    mood VARCHAR(50) NOT NULL,
                    intensity VARCHAR(50) DEFAULT 'medium',
                    confidence VARCHAR(50) DEFAULT '0.5',
                    valence VARCHAR(50) DEFAULT 'neutral',
                    arousal VARCHAR(50) DEFAULT 'medium',
                    recommended_tone VARCHAR(100) DEFAULT 'calm_supportive',
                    theme_name VARCHAR(100) DEFAULT 'soft_sky',
                    created_at TIMESTAMP DEFAULT NOW()
                )
            """))
            print("Created table: mood_events")

    print("Migration complete")
