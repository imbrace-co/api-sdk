from __future__ import annotations
from typing import Generic, List, Optional, TypeVar
from pydantic import BaseModel

T = TypeVar("T")


class PageInfo(BaseModel):
    page: int
    limit: int
    total: int
    total_pages: int
    has_next: bool
    has_prev: bool


class ApiResponse(BaseModel, Generic[T]):
    success: bool
    data: Optional[T] = None
    message: Optional[str] = None
    error: Optional[str] = None


class PagedResponse(BaseModel, Generic[T]):
    success: Optional[bool] = None
    data: List[T] = []
    pagination: Optional[PageInfo] = None
    total: Optional[int] = None
