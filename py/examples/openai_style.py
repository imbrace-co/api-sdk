import os
from imbrace import ImbraceClient

def main():
    # 1. Khởi tạo Client giống OpenAI
    client = ImbraceClient(
        api_key="sk-imbrace-xxx", # Lấy từ IMBrace Dashboard
        env="develop"             # develop / sandbox / stable
    )

    try:
        print("--- IMBrace Python SDK Demo ---")

        # 2. Chat AI - Quản lý Folders
        folders = client.chat_ai.list_folders()
        print(f"User has {len(folders)} chat folders.")

        # 3. Chat AI - Tạo Prompt chuyên dụng cho Project này
        # Một feature cực mạnh vừa được em thêm vào SDK
        new_prompt = client.chat_ai.create_prompt({
            "command": "expert-dev",
            "name": "Expert Software Architect",
            "content": "You are a software architect with 20 years experience."
        })
        print(f"Created Prompt: {new_prompt.get('name')}")

        # 4. Chat Completion (Chuẩn nghiệp vụ AI)
        response = client.chat_ai.chat({
            "model": "gpt-3.5-turbo",
            "messages": [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Tell me about IMBrace features."}
            ]
        })
        print("AI Response:", response["choices"][0]["message"]["content"])

        # 5. Automation - Trigger Workflow
        # Gửi dữ liệu vào Workflow xử lý lead hoặc lưu database
        automation_res = client.workflows.trigger_flow("YOUR_FLOW_ID", {
            "source": "SDK_DEMO",
            "payload": response["choices"][0]["message"]["content"]
        })
        print("Automation Response:", automation_res)

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    main()
