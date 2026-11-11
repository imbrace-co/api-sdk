import os
from imbrace import ImbraceClient

client = ImbraceClient(
    api_key=os.environ["IMBRACE_API_KEY"],
    env="cloud",
)

channels = client.channel.list()
print("Channels:", channels)

client.close()
