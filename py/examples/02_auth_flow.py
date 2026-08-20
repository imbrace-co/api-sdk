import os
from imbrace import ImbraceClient

# Step 1: sign in with email + password to get an access token
bootstrap = ImbraceClient(env="stable")
result = bootstrap.auth.sign_in(
    email=os.environ["IMBRACE_EMAIL"],
    password=os.environ["IMBRACE_PASSWORD"],
)
bootstrap.close()

access_token = result["accessToken"]
org_id = os.environ["IMBRACE_ORG_ID"]

# Step 2: use the SDK with the scoped access token
client = ImbraceClient(
    access_token=access_token,
    organization_id=org_id,
    env="stable",
)

me = client.platform.get_me()
print("Logged in as:", me)

client.close()
