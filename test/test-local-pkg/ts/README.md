# Imbrace SDK - Local Integration Test Suite

Bộ công cụ kiểm thử tích hợp (Integration Test) dành cho Imbrace TypeScript SDK, được thiết kế để xác thực mã nguồn trực tiếp trong quá trình phát triển thông qua file đóng gói cục bộ (`.tgz`).

## 1. Mục tiêu
- Xác thực toàn bộ logic của SDK trước khi phát hành (Publish) lên NPM.
- Đảm bảo tính ổn định của các luồng nghiệp vụ quan trọng (Full Flow).
- Kiểm tra khả năng tương thích của gói đóng gói cục bộ.

## 2. Thiết lập môi trường

### Prerequisites
- Node.js (v18 trở lên)
- PNPM hoặc NPM

### Cấu hình Biến môi trường
Tạo file `.env` tại thư mục này với các thông số sau:
```env
IMBRACE_API_KEY=your_api_key_here
IMBRACE_ORGANIZATION_ID=your_org_id_here
IMBRACE_GATEWAY_URL=https://app-gatewayv2.imbrace.co
```

### Cài đặt
```bash
npm install
```
*Lưu ý: Thư mục này cài đặt SDK thông qua đường dẫn file cục bộ: `file:../../ts/imbrace-sdk-x.x.x.tgz`.*

## 3. Danh mục Kiểm thử

### 🚀 Kiểm thử luồng chính (Priority 1)
- **Full Flow Guide**: `npm run test:full-flow`
  - Chạy toàn bộ 4 giai đoạn quan trọng nhất: AI Assistant -> Workflow -> Knowledge Hub (RAG) -> CRM Boards.

### 🎭 Kiểm thử theo kịch bản (Scenario-based)
- **Frontend SDK**: `npm run test:frontend` (Chat Client API, Tracing, Messages)
- **Multi-Agent**: `npm run test:multi-agent` (Sub-agents, History, Parquet)
- **CRM Advanced**: `npm run test:crm-advanced` (Contacts, Conversations, Link/Unlink)
- **Multimedia AI**: `npm run test:multimedia` (OCR, STT, TTS, Document AI)

### 🛠️ Kiểm thử tài nguyên đơn lẻ
- **Boards**: `npm run test:boards`
- **AI Agent**: `npm run test:ai`
- **CRM**: `npm run test:crm`

### 🛡️ Kiểm thử độ bền (Resilience)
- **Error Paths**: `npm run test:error-paths` (Xác thực xử lý lỗi 401, 404, 400).

## 4. Chạy toàn bộ hệ thống
Để kiểm tra sức khỏe tổng thể của SDK:
```bash
npm run test:all
```
*Hệ thống test mới được thiết kế theo cơ chế **Module Isolation**: Nếu một dịch vụ Backend gặp lỗi (ví dụ 502), bộ test sẽ ghi nhận và chạy tiếp các module khác thay vì dừng lại toàn bộ.*

## 5. Cấu trúc thư mục
- `tests/`: Chứa các kịch bản test `.ts`.
- `utils/`: Các hàm bổ trợ, khởi tạo Client và xử lý log.
- `debug/`: (Nếu có) Chứa các công cụ hỗ trợ debug nhanh.
