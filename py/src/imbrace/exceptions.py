class ImbraceError(Exception):
    """Base exception for all Imbrace SDK errors."""
    pass

class AuthError(ImbraceError):
    """Raised when authentication fails (401/403)."""
    pass

class ApiError(ImbraceError):
    """Raised for API errors. Includes HTTP status code."""
    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        super().__init__(f"[{status_code}] {message}")

class NetworkError(ImbraceError):
    """Raised for network errors and timeouts."""
    pass
