from typing import Optional, TypedDict


class ImbraceApiKey(TypedDict):
    """Shape of the apiKey object in the response from Imbrace Gateway."""
    _id: str
    apiKey: str
    organization_id: str
    user_id: str
    is_active: bool
    expired_at: str
    created_at: str
    updated_at: str
    is_temp: bool


class ImbraceApiKeyResponse(TypedDict):
    """Full response from the Imbrace Gateway auth endpoint."""
    apiKey: ImbraceApiKey
    expires_in: int


def extract_api_key(res: ImbraceApiKeyResponse) -> str:
    """Extract the actual key value from the API Key response.

    Example:
        res = requests.get(".../auth/key").json()
        key = extract_api_key(res)  # res["apiKey"]["apiKey"]
        client = ImbraceClient(api_key=key)
    """
    return res["apiKey"]["apiKey"]
