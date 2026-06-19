from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    env: str = "development"

    database_url: str

    nvidia_api_key: str
    nvidia_base_url: str = "https://integrate.api.nvidia.com/v1"
    nvidia_llm_model: str = "meta/llama-3.1-70b-instruct"

    pinecone_api_key: str
    pinecone_index: str = "second-brain"
    pinecone_cloud: str = "aws"
    pinecone_region: str = "us-east-1"
    pinecone_dimension: int = 1024

    notion_api_key: str | None = None
    notion_tasks_database_id: str | None = None

    openwa_base_url: str = "http://openwa-api:2785"
    openwa_api_key: str | None = None

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
