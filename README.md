# IVPDS Admin Web

Trang quản trị của IVPDS (Intelligent Voice Phishing Detection System): theo dõi cuộc gọi rủi ro cao, duyệt báo cáo số lừa đảo, quản lý danh sách đen, mẫu lừa đảo, người dùng và xem thống kê.

React + TypeScript + Vite + React Router + TanStack Query + Axios + Ant Design 5 (`@ant-design/plots` cho biểu đồ).

## Chạy

Cần Node.js 20.19 trở lên và backend IVPDS đang chạy (mặc định `http://127.0.0.1:8080`).

```bash
npm install
cp .env.example .env    # chỉ cần khi backend không ở địa chỉ mặc định
npm run dev             # http://localhost:5173
```

Backend chưa bật CORS, nên trình duyệt gọi `/api` cùng origin và Vite chuyển tiếp tới `VITE_BACKEND_URL`. Đăng nhập bằng một tài khoản có vai trò `ADMIN`.

## Lệnh

| Lệnh | Việc |
|---|---|
| `npm run dev` | Chạy máy chủ phát triển |
| `npm run build` | Kiểm tra kiểu và build ra `dist/` |
| `npm run preview` | Chạy bản build (vẫn có proxy `/api`) |
| `npm run typecheck` | `tsc` không sinh file |
| `npm run lint` | ESLint |
| `npm test` | Vitest: làm mới token khi nhiều request cùng 401, đổi trang 0 ↔ 1, ánh xạ mã lỗi |

## Cấu trúc

```
src/
  api/          axios, kiểu dữ liệu, hàm gọi API, đổi trang, ánh xạ lỗi (kèm test)
  auth/         phiên đăng nhập, chặn route, đổi mật khẩu
  components/   Tag mức rủi ro / dấu hiệu / trạng thái, bảng dùng chung, bảng và chi tiết cuộc gọi
  features/     auth, dashboard, calls, reports, blacklist, patterns, users
  lib/          tên tiếng Việt và màu (labels.ts), định dạng, trạng thái trên URL
  routes/       định tuyến, bố cục chung, trang 404
  theme/        theme Ant Design, màu mức rủi ro, CSS chung
```

## Ghi chú

- Access token chỉ nằm trong bộ nhớ; refresh token nằm trong `localStorage` và chỉ dùng được một lần. Khi API trả 401, ứng dụng refresh đúng một lần cho mọi request đang chờ rồi gửi lại.
- Tên tiếng Việt, màu mức rủi ro và câu lỗi nằm ở `src/lib/labels.ts`, `src/theme/theme.ts`, `src/api/errors.ts`.
- Backend đánh số trang từ 0, giao diện từ 1; chỉ đổi ở `src/api/pagination.ts`.
- Không có trình phát hay nút tải ghi âm: quản trị viên không được nghe ghi âm của người dùng.
- Không đưa `.env`, token hay mật khẩu vào git.
