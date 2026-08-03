import { ImbraceClient } from "@imbrace/sdk";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Đảm bảo load đúng file .env từ thư mục hiện tại
dotenv.config({ path: resolve(process.cwd(), ".env") });

const apiKey = process.env.IMBRACE_API_KEY;
const accessToken = process.env.IMBRACE_ACCESS_TOKEN;
const organizationId = process.env.IMBRACE_ORGANIZATION_ID;
const baseUrl = process.env.IMBRACE_GATEWAY_URL || "https://app-gatewayv2.imbrace.co";
const timeout = parseInt(process.env.IMBRACE_TIMEOUT || "60000");

console.log("\n--- Kiểm tra cấu hình ---");
console.log("Base URL:", baseUrl);
console.log("API Key:", apiKey ? "Đã nạp (vế đầu: " + apiKey.substring(0, 5) + "...)" : "Trống");
console.log("Access Token:", accessToken ? "Đã nạp (vế đầu: " + accessToken.substring(0, 5) + "...)" : "Trống");
console.log("Organization ID:", organizationId ? "Đã nạp" : "Trống");
console.log("Timeout:", timeout, "ms");

if ((!apiKey && !accessToken) || !organizationId) {
  console.error("\n❌ LỖI: Thiếu thông tin cấu hình trong .env!");
  process.exit(1);
}

// Ưu tiên Access Token nếu có cả hai, vì nó có quyền hạn rộng hơn trên nhiều service
const useAccessToken = !!accessToken;
const client = new ImbraceClient({
  apiKey: !useAccessToken ? (apiKey || undefined) : undefined,
  accessToken: useAccessToken ? accessToken : undefined,
  baseUrl,
  timeout,
  organizationId: organizationId || undefined,
});

async function runTest() {
  const mode = useAccessToken ? "Access Token" : "API Key";
  console.log(`\n🚀 Bắt đầu Full Flow Test (Chế độ: ${mode})...`);

  try {
    // 0. Sanity Check - Dùng Health Check thay vì getMe để tránh lỗi phân quyền
    console.log("\n--- 0. Kiểm tra kết nối (Health Check) ---");
    try {
      const health = await client.health.check();
      console.log("Trạng thái Gateway:", JSON.stringify(health));
    } catch (e: any) {
      console.warn("Cảnh báo: Health check không phản hồi (có thể endpoint không tồn tại), thử bước tiếp theo...");
    }

    console.log("\n--- 1. Kiểm tra Assistant ---");
    const assistants = await client.chatAi.listAiAgents();
    console.log("Danh sách Assistant hiện có:", assistants.length);

    const assistant = await client.chatAi.createAiAgent({
      name: `SDK_TEST_${Date.now()}`,
      workflow_name: `test_bot_${Date.now()}`,
      description: "Test",
    });
    const assistantId = assistant.id;
    console.log("✅ Đã tạo Assistant:", assistantId);

    // Dọn dẹp ngay sau khi tạo để test tính năng delete
    await client.chatAi.deleteAiAgent(assistantId);
    console.log("✅ Đã xóa Assistant thành công.");

    console.log("\n--- 2. Kiểm tra Boards ---");
    const boards = await client.boards.list({ limit: 1 });
    console.log("Số lượng bảng CRM:", boards.data?.length ?? 0);

    console.log("\n✅ KẾT LUẬN: SDK đang hoạt động bình thường!");

  } catch (error: any) {
    console.error("\n❌ TEST THẤT BẠI!");
    console.error("Thông báo lỗi:", error.message);
    if (error.statusCode) console.error("Mã lỗi HTTP:", error.statusCode);
    console.error("Chi tiết lỗi:", error);
  }
}

runTest();

