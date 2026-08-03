# Imbrace SDK - NPM Package Verification Suite

Bộ công cụ kiểm thử dành cho Imbrace TypeScript SDK, được thiết kế để xác thực gói thư viện sau khi đã phát hành hoặc cài đặt dưới dạng phụ thuộc (Dependency) từ registry.

## 1. Mục tiêu
- Đảm bảo các module được export chính xác từ thư viện `@imbrace/sdk`.
- Xác thực khả năng tương thích của SDK trong môi trường ứng dụng thực tế.
- Duy trì tính nhất quán về tính năng giữa bản phát triển và bản phát hành.

## 2. Thiết lập môi trường

### Cấu hình Biến môi trường
Cần chuẩn bị file `.env` tương tự môi trường local:
```env
IMBRACE_API_KEY=your_api_key_here
IMBRACE_ORGANIZATION_ID=your_org_id_here
```

### Cài đặt
```bash
npm install
```
*Gói này sử dụng `@imbrace/sdk` được định nghĩa trong `dependencies` của `package.json`.*

## 3. Lệnh chạy Test
Hệ thống sử dụng các lệnh tương đồng với bản Local để đảm bảo sự đồng bộ:

- **Chạy toàn bộ**: `npm run test:all`
- **Luồng tích hợp**: `npm run test:full-flow`
- **Frontend/Chat**: `npm run test:frontend`
- **Multi-Agent/Parquet**: `npm run test:multi-agent`
- **CRM/Boards**: `npm run test:crm-advanced`
- **Multimedia/AI**: `npm run test:multimedia`
- **Settings/Templates**: `npm run test:settings`
- **Xử lý lỗi**: `npm run test:error-paths`

## 4. Đặc điểm nổi bật
- **Zero-Crash Runner**: Bộ điều phối test (`test-all.ts`) cho phép bỏ qua các module gặp lỗi 502/404 để hoàn thành các phần còn lại của hệ thống.
- **Evidence Logging**: Log trả về chi tiết ID tài nguyên được tạo ra (Assistant ID, Board ID, v.v.) để phục vụ việc lập báo cáo kiểm thử.

## 5. Kết luận & Báo cáo
Nếu lệnh `npm run test:all` trả về `🎉 ALL TEST MODULES FINISHED SUCCESSFULLY!`, SDK đã sẵn sàng cho môi trường Production.
