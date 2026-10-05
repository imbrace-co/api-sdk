from typing import Any, NoReturn

from ..exceptions import ImbraceError

NO_REPLACEMENT = "There is no replacement."


def retired(method: str, reason: str, hint: str = NO_REPLACEMENT) -> NoReturn:
    """Raise for an SDK method whose backing route no longer exists.

    Covers the retired backend monolith, IPS and removed ai-agent routes.
    Callers get a clear error naming the alternative instead of an opaque
    404/502. No request is made.
    """
    raise ImbraceError(f"{method}() is no longer available: {reason}. {hint}")


def unwrap_data(res: Any) -> Any:
    """Services that moved off the retired backend wrap single objects and lists in ``{data}``."""
    if isinstance(res, dict) and "data" in res:
        return res["data"]
    return res
