import pytest
from imbrace.exceptions import ImbraceError, AuthError, ApiError, NetworkError

def test_hierarchy():
    assert issubclass(AuthError, ImbraceError)
    assert issubclass(ApiError, ImbraceError)
    assert issubclass(NetworkError, ImbraceError)

def test_api_error_message():
    err = ApiError(404, "Not Found")
    assert err.status_code == 404
    assert "404" in str(err)
