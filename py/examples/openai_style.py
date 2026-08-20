import os
from imbrace import ImbraceClient

def main():
    # 1. Initialize the Client (OpenAI-style)
    client = ImbraceClient(
        api_key="sk-imbrace-xxx", # Get it from the IMBrace Dashboard
        env="develop"             # develop / sandbox / stable
    )

    try:
        print("--- IMBrace Python SDK Demo ---")

        # 2. Chat AI - Manage Folders
        folders = client.chat_ai.list_folders()
        print(f"User has {len(folders)} chat folders.")

        # 3. Chat AI - Create a Prompt dedicated to this Project
        # A very powerful feature recently added to the SDK
        new_prompt = client.chat_ai.create_prompt({
            "command": "expert-dev",
            "name": "Expert Software Architect",
            "content": "You are a software architect with 20 years experience."
        })
        print(f"Created Prompt: {new_prompt.get('name')}")

        # 4. Chat Completion (standard AI usage)
        response = client.chat_ai.chat({
            "model": "gpt-3.5-turbo",
            "messages": [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Tell me about IMBrace features."}
            ]
        })
        print("AI Response:", response["choices"][0]["message"]["content"])

        # 5. Automation - Trigger Workflow
        # Send data into a Workflow that processes leads or persists to a database
        automation_res = client.workflows.trigger_flow("YOUR_FLOW_ID", {
            "source": "SDK_DEMO",
            "payload": response["choices"][0]["message"]["content"]
        })
        print("Automation Response:", automation_res)

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    main()
