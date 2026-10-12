from typing import Optional


class ImbraceError(Exception):
    """Base exception for all Imbrace SDK errors."""
    pass

class AuthError(ImbraceError):
    """Raised when authentication fails (401/403).

    ``status_code`` and ``body`` hold the HTTP status and raw response body when
    the error came from a response (``None`` otherwise). Some services send a
    403 for a reason other than bad credentials and say why in the body.
    """
    status_code: Optional[int] = None
    body: Optional[str] = None

    def with_response(self, status_code: int, body: str) -> "AuthError":
        self.status_code = status_code
        self.body = body
        return self

class ApiError(ImbraceError):
    """Raised for API errors. Includes HTTP status code."""
    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        super().__init__(f"[{status_code}] {message}")

class NetworkError(ImbraceError):
    """Raised for network errors and timeouts."""
    pass

class DataIqError(ImbraceError):
    """A DataIQ v2 call the server refused for a known reason; ``code`` says which.

    - ``disabled`` (503): v2 is switched off in this environment.
    - ``plan_limit`` (402): over the plan's boards per org or records per board.
    - ``read_only`` (403, body ``{"code": "read_only"}``): the team is View-Only.
    """
    def __init__(self, code: str, status_code: int, message: str):
        self.code = code
        self.status_code = status_code
        super().__init__(message)
