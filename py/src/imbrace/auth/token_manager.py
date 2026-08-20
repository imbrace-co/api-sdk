from typing import Optional
import threading

class TokenManager:
    """Thread-safe access token store for the Imbrace SDK."""

    def __init__(self, initial_token: Optional[str] = None):
        self._token = initial_token
        self._lock = threading.Lock()

    def set_token(self, token: str) -> None:
        """Set the active access token.

        Args:
            token: New access token value.
        """
        with self._lock:
            self._token = token

    def get_token(self) -> Optional[str]:
        """Return the current access token, or None if not set."""
        with self._lock:
            return self._token

    def clear(self) -> None:
        """Clear the stored access token."""
        with self._lock:
            self._token = None
