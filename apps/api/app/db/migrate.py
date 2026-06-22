from sqlalchemy import inspect, text

from app.db.session import engine


def run_migrations():
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()

    with engine.begin() as conn:
        if "users" not in existing_tables:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS users (
                    id VARCHAR PRIMARY KEY,
                    provider VARCHAR(50) DEFAULT 'google',
                    provider_user_id VARCHAR(255) NOT NULL,
                    email VARCHAR(255),
                    name VARCHAR(255),
                    picture TEXT,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                )
            """))
            print("Created table: users")

            conn.execute(text(
                "CREATE UNIQUE INDEX IF NOT EXISTS idx_users_provider_user_id ON users(provider, provider_user_id)"
            ))
            print("Created index: idx_users_provider_user_id")

    if "projects" not in existing_tables:
        with engine.begin() as conn:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS projects (
                    id VARCHAR PRIMARY KEY,
                    user_id VARCHAR REFERENCES users(id),
                    name VARCHAR(300) NOT NULL,
                    description TEXT,
                    status VARCHAR(50) DEFAULT 'active',
                    created_at TIMESTAMP DEFAULT NOW()
                )
            """))
            print("Created table: projects")

    if "goals" not in existing_tables:
        with engine.begin() as conn:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS goals (
                    id VARCHAR PRIMARY KEY,
                    user_id VARCHAR REFERENCES users(id),
                    project_id VARCHAR REFERENCES projects(id),
                    title VARCHAR(500) NOT NULL,
                    description TEXT,
                    target_date VARCHAR(50),
                    status VARCHAR(50) DEFAULT 'active',
                    created_at TIMESTAMP DEFAULT NOW()
                )
            """))
            print("Created table: goals")

    if "memory_cards" not in existing_tables:
        with engine.begin() as conn:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS memory_cards (
                    id VARCHAR PRIMARY KEY,
                    user_id VARCHAR REFERENCES users(id),
                    project_id VARCHAR REFERENCES projects(id),
                    title VARCHAR(500) NOT NULL,
                    summary TEXT NOT NULL,
                    tags TEXT,
                    source_item_ids TEXT,
                    created_at TIMESTAMP DEFAULT NOW()
                )
            """))
            print("Created table: memory_cards")

    with engine.begin() as conn:
        existing_columns_tasks = [col["name"] for col in inspector.get_columns("tasks")] if "tasks" in existing_tables else []

        if "tasks" in existing_tables:
            if "user_id" not in existing_columns_tasks:
                conn.execute(text("ALTER TABLE tasks ADD COLUMN user_id VARCHAR REFERENCES users(id)"))
                print("Added column: tasks.user_id")
            if "project_id" not in existing_columns_tasks:
                conn.execute(text("ALTER TABLE tasks ADD COLUMN project_id VARCHAR REFERENCES projects(id)"))
                print("Added column: tasks.project_id")

    with engine.begin() as conn:
        if "knowledge_items" in existing_tables:
            existing_columns_ki = [col["name"] for col in inspector.get_columns("knowledge_items")]
            if "user_id" not in existing_columns_ki:
                conn.execute(text("ALTER TABLE knowledge_items ADD COLUMN user_id VARCHAR REFERENCES users(id)"))
                print("Added column: knowledge_items.user_id")
            if "project_id" not in existing_columns_ki:
                conn.execute(text("ALTER TABLE knowledge_items ADD COLUMN project_id VARCHAR REFERENCES projects(id)"))
                print("Added column: knowledge_items.project_id")

    with engine.begin() as conn:
        if "mood_events" in existing_tables:
            existing_columns_me = [col["name"] for col in inspector.get_columns("mood_events")]
            if "user_id" not in existing_columns_me:
                conn.execute(text("ALTER TABLE mood_events ADD COLUMN user_id VARCHAR REFERENCES users(id)"))
                print("Added column: mood_events.user_id")

    with engine.begin() as conn:
        if "whatsapp_messages" in existing_tables:
            existing_columns_wm = [col["name"] for col in inspector.get_columns("whatsapp_messages")]
            if "user_id" not in existing_columns_wm:
                conn.execute(text("ALTER TABLE whatsapp_messages ADD COLUMN user_id VARCHAR REFERENCES users(id)"))
                print("Added column: whatsapp_messages.user_id")

    with engine.begin() as conn:
        if "entities" in existing_tables:
            existing_columns_e = [col["name"] for col in inspector.get_columns("entities")]
            if "user_id" not in existing_columns_e:
                conn.execute(text("ALTER TABLE entities ADD COLUMN user_id VARCHAR REFERENCES users(id)"))
                print("Added column: entities.user_id")

    with engine.begin() as conn:
        if "relationships" in existing_tables:
            existing_columns_r = [col["name"] for col in inspector.get_columns("relationships")]
            if "user_id" not in existing_columns_r:
                conn.execute(text("ALTER TABLE relationships ADD COLUMN user_id VARCHAR REFERENCES users(id)"))
                print("Added column: relationships.user_id")

    with engine.begin() as conn:
        existing_columns_tasks = [col["name"] for col in inspector.get_columns("tasks")] if "tasks" in existing_tables else []

        if "priority" not in existing_columns_tasks:
            conn.execute(text("ALTER TABLE tasks ADD COLUMN priority VARCHAR(50) DEFAULT 'Normal'"))
            print("Added column: priority")

        if "due_date" not in existing_columns_tasks:
            conn.execute(text("ALTER TABLE tasks ADD COLUMN due_date VARCHAR(50)"))
            print("Added column: due_date")

        if "source" not in existing_columns_tasks:
            conn.execute(text("ALTER TABLE tasks ADD COLUMN source VARCHAR(50) DEFAULT 'second_brain'"))
            print("Added column: source")

    if "mood_events" not in existing_tables:
        with engine.begin() as conn:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS mood_events (
                    id VARCHAR PRIMARY KEY,
                    user_id VARCHAR REFERENCES users(id),
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

    if "whatsapp_messages" not in existing_tables:
        with engine.begin() as conn:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS whatsapp_messages (
                    id VARCHAR PRIMARY KEY,
                    user_id VARCHAR REFERENCES users(id),
                    phone VARCHAR(100),
                    sender_name VARCHAR(200),
                    direction VARCHAR(20) DEFAULT 'inbound',
                    message_text TEXT NOT NULL,
                    detected_intent VARCHAR(50),
                    detected_mood VARCHAR(50),
                    created_task_id VARCHAR(200),
                    created_knowledge_item_id VARCHAR(200),
                    raw_payload TEXT,
                    created_at TIMESTAMP DEFAULT NOW()
                )
            """))
            print("Created table: whatsapp_messages")

    with engine.begin() as conn:
        if "notion_connections" in existing_tables:
            existing_columns_nc = [col["name"] for col in inspector.get_columns("notion_connections")]
            if "default_database_id" not in existing_columns_nc:
                conn.execute(text("ALTER TABLE notion_connections ADD COLUMN default_database_id VARCHAR(255)"))
                print("Added column: notion_connections.default_database_id")
            if "default_data_source_id" not in existing_columns_nc:
                conn.execute(text("ALTER TABLE notion_connections ADD COLUMN default_data_source_id VARCHAR(255)"))
                print("Added column: notion_connections.default_data_source_id")
            if "default_database_title" not in existing_columns_nc:
                conn.execute(text("ALTER TABLE notion_connections ADD COLUMN default_database_title VARCHAR(500)"))
                print("Added column: notion_connections.default_database_title")

    if "notion_connections" not in existing_tables:
        with engine.begin() as conn:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS notion_connections (
                    id VARCHAR PRIMARY KEY,
                    user_id VARCHAR REFERENCES users(id),
                    encrypted_access_token TEXT NOT NULL,
                    encrypted_refresh_token TEXT,
                    bot_id VARCHAR(255),
                    workspace_id VARCHAR(255),
                    workspace_name VARCHAR(500),
                    workspace_icon TEXT,
                    owner_type VARCHAR(100),
                    owner_user_id VARCHAR(255),
                    owner_name VARCHAR(500),
                    owner_email VARCHAR(500),
                    owner_avatar_url TEXT,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                )
            """))
            print("Created table: notion_connections")

            conn.execute(text(
                "CREATE INDEX IF NOT EXISTS idx_notion_connections_user_id ON notion_connections(user_id)"
            ))
            print("Created index: idx_notion_connections_user_id")

    if "writing_documents" not in existing_tables:
        with engine.begin() as conn:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS writing_documents (
                    id VARCHAR PRIMARY KEY,
                    user_id VARCHAR REFERENCES users(id),
                    title VARCHAR(500) NOT NULL,
                    raw_text TEXT NOT NULL,
                    cleaned_markdown TEXT,
                    blocks_json TEXT,
                    source_type VARCHAR(100) DEFAULT 'manual',
                    notion_page_id VARCHAR(255),
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                )
            """))
            print("Created table: writing_documents")

            conn.execute(text(
                "CREATE INDEX IF NOT EXISTS idx_writing_documents_user_id ON writing_documents(user_id)"
            ))
            print("Created index: idx_writing_documents_user_id")

    if "activity_events" not in existing_tables:
        with engine.begin() as conn:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS activity_events (
                    id VARCHAR PRIMARY KEY,
                    user_id VARCHAR REFERENCES users(id),
                    event_type VARCHAR(100) NOT NULL,
                    title VARCHAR(500) NOT NULL,
                    description TEXT,
                    source_type VARCHAR(100),
                    source_id VARCHAR(255),
                    url TEXT,
                    metadata_json TEXT,
                    created_at TIMESTAMP DEFAULT NOW()
                )
            """))
            print("Created table: activity_events")

            conn.execute(text(
                "CREATE INDEX IF NOT EXISTS idx_activity_events_user_id ON activity_events(user_id)"
            ))
            print("Created index: idx_activity_events_user_id")

            conn.execute(text(
                "CREATE INDEX IF NOT EXISTS idx_activity_events_event_type ON activity_events(event_type)"
            ))
            print("Created index: idx_activity_events_event_type")

    with engine.begin() as conn:
        if "notion_todo_pages" not in existing_tables:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS notion_todo_pages (
                    id VARCHAR PRIMARY KEY,
                    user_id VARCHAR REFERENCES users(id),
                    title VARCHAR(500) NOT NULL,
                    notion_page_id VARCHAR(255) NOT NULL,
                    notion_page_url TEXT,
                    data_source_id VARCHAR(255),
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                )
            """))
            print("Created table: notion_todo_pages")

            conn.execute(text(
                "CREATE INDEX IF NOT EXISTS idx_notion_todo_pages_user_id ON notion_todo_pages(user_id)"
            ))
            print("Created index: idx_notion_todo_pages_user_id")

    with engine.begin() as conn:
        if "tasks" in existing_tables:
            existing_columns_tasks = [col["name"] for col in inspector.get_columns("tasks")]
            if "notion_block_id" not in existing_columns_tasks:
                conn.execute(text("ALTER TABLE tasks ADD COLUMN notion_block_id VARCHAR(255)"))
                print("Added column: tasks.notion_block_id")

    print("Migration complete")
