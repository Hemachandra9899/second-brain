from pydantic import BaseModel


class CreateTodoPageRequest(BaseModel):
    title: str
    todos: list[str]
    data_source_id: str


class AppendTodosRequest(BaseModel):
    todos: list[str]


class CheckTodoBlockRequest(BaseModel):
    checked: bool


class RenameTodoPageRequest(BaseModel):
    title: str


class ConnectExistingPageRequest(BaseModel):
    notion_page_id: str
    title: str
    data_source_id: str
