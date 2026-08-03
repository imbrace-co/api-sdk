import os
from imbrace import ImbraceClient

client = ImbraceClient(
    access_token=os.environ["IMBRACE_ACCESS_TOKEN"],
    env="stable",
)

# List available models
models = client.chat_ai.list_models()
print("Models:", [m["id"] for m in models.get("data", [])])

# Chat completion
response = client.chat_ai.chat({
    "model": "gpt-4o",
    "messages": [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Summarize iMBRACE in one sentence."},
    ],
})
print("AI:", response["choices"][0]["message"]["content"])

# Manage chats
chats = client.chat_ai.list_chats()
print("Existing chats:", len(chats))

new_chat = client.chat_ai.create_chat({"title": "SDK Demo Chat"})
print("Created chat:", new_chat.get("id"))

# Manage knowledge bases
knowledge_list = client.chat_ai.list_knowledge()
print("Knowledge bases:", len(knowledge_list))

client.close()
