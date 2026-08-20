import os
from imbrace import ImbraceClient

client = ImbraceClient(
    access_token=os.environ["IMBRACE_ACCESS_TOKEN"],
    env="stable",
)

# List channels
channels = client.channel.list()
print("Channels:", channels)

# List conversations
conversations = client.conversations.list(limit=10)
print("Conversations:", conversations)

# Send a text message (must be called inside an active conversation context)
msg = client.messages.send(type="text", text="Hello from iMBRACE SDK!")
print("Sent:", msg)

client.close()
