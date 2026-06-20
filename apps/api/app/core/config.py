from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    env: str = "development"
    frontend_url: str = "http://localhost:3000"

    database_url: str

    nvidia_api_key: str
    nvidia_base_url: str = "https://integrate.api.nvidia.com/v1"
    nvidia_llm_model: str = "meta/llama-3.1-70b-instruct"

    pinecone_api_key: str
    pinecone_index: str = "second-brain"
    pinecone_cloud: str = "aws"
    pinecone_region: str = "us-east-1"
    pinecone_dimension: int = 1024

    notion_oauth_client_id: str | None = None
    notion_oauth_client_secret: str | None = None
    notion_oauth_redirect_uri: str = "http://localhost:8000/integrations/notion/callback"
    notion_api_version: str = "2026-03-11"
    notion_tasks_database_id: str | None = None

    openwa_base_url: str | None = None
    openwa_api_key: str | None = None

    google_client_id: str = ""
    jwt_secret: str = "change_this_to_long_random_secret"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 10080

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
