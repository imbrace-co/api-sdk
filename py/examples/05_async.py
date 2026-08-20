import asyncio
import os
from imbrace import AsyncImbraceClient

async def main():
    async with AsyncImbraceClient(
        access_token=os.environ["IMBRACE_ACCESS_TOKEN"],
        organization_id=os.environ.get("IMBRACE_ORG_ID"),
        env="stable",
    ) as client:
        # Fire parallel requests
        channels, conversations = await asyncio.gather(
            client.channel.list(),
            client.conversations.list(limit=10),
        )
        print("Channels:", channels)
        print("Conversations:", conversations)

        # Chat AI completion
        response = await client.chat_ai.chat({
            "model": "gpt-4o",
            "messages": [{"role": "user", "content": "Hello!"}],
        })
        print("AI:", response["choices"][0]["message"]["content"])

        # AI streaming via ai resource (uses CompletionInput)
        from imbrace.types.ai import CompletionInput, CompletionMessage

        print("Streaming:")
        async for chunk in client.ai.stream(
            CompletionInput(
                model="gpt-4o",
                messages=[CompletionMessage(role="user", content="Count to 3.")],
            )
        ):
            content = chunk.choices[0].delta.content or ""
            print(content, end="", flush=True)
        print()

asyncio.run(main())
