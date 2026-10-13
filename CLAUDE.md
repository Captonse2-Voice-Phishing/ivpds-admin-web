# PROMPT — THIẾT KẾ VÀ XÂY DỰNG IVPDS ADMIN WEB

Bạn là Senior Frontend Engineer kiêm UI Designer. Hãy thiết kế và xây dựng **trang quản trị** của IVPDS trong thư mục hiện tại (`Capstone2_FE`).

IVPDS (Intelligent Voice Phishing Detection System) phân tích ghi âm cuộc gọi tiếng Việt để phát hiện lừa đảo qua điện thoại: audio → transcript → các dấu hiệu lừa đảo → điểm rủi ro 0–100 và mức LOW / MEDIUM / HIGH. Người dùng cuối dùng ứng dụng mobile. Trang này dành cho **quản trị viên**: theo dõi cuộc gọi rủi ro cao, quản lý tài khoản, danh sách đen, báo cáo số lừa đảo, mẫu lừa đảo, và xem thống kê.

Backend đã viết xong và đang chạy. Prompt này chứa đủ mọi API bạn cần; bạn không sửa backend và không cần tài liệu nào khác.

---

## PHẦN A — THIẾT KẾ GIAO DIỆN

### A1. Công nghệ

React, TypeScript (strict), Vite, React Router, TanStack Query, Axios, **Ant Design** (bản 5). Biểu đồ dùng `@ant-design/plots`. Không thêm thư viện giao diện khác (MUI, Tailwind, Bootstrap).

### A2. Phong cách

- Đây là công cụ làm việc cho người vận hành: gọn, rõ, mật độ thông tin vừa phải, không trang trí thừa. Người dùng phải thấy ngay "cuộc gọi nào nguy hiểm" và "việc gì đang chờ mình".
- Toàn bộ chữ trên giao diện bằng **tiếng Việt**.
- Dùng theme của Ant Design qua `ConfigProvider`, locale `vi_VN`:
  - Màu chính: xanh dương đậm `#1F4E79` (tin cậy, an ninh).
  - Bo góc 8px, font hệ thống, cỡ chữ gốc 14px.
  - Nền trang `#F5F7FA`, nội dung đặt trong các thẻ (Card) nền trắng.
- **Màu mức rủi ro dùng nhất quán ở mọi nơi** (nhãn, biểu đồ, số liệu):

  | Mức | Nhãn hiển thị | Màu |
  |---|---|---|
  | `HIGH` | Nguy cơ cao | đỏ `#D4380D` |
  | `MEDIUM` | Đáng ngờ | cam `#D48806` |
  | `LOW` | An toàn | xanh lá `#389E0D` |
  | chưa phân tích / lỗi | Chưa có kết quả | xám `#8C8C8C` |

  Không chỉ dựa vào màu: nhãn luôn có chữ.
- Trạng thái khác: `ACTIVE` "Hoạt động" (xanh lá), `LOCKED` "Đã khóa" (đỏ); `PENDING` "Chờ duyệt" (cam), `APPROVED` "Đã duyệt" (xanh lá), `REJECTED` "Từ chối" (xám); phân tích `PENDING` "Đang chờ", `PROCESSING` "Đang phân tích" (xanh dương, có biểu tượng quay), `COMPLETED` "Hoàn tất", `FAILED` "Lỗi" (đỏ).
- Thời gian hiển thị theo giờ Việt Nam, dạng `10/10/2026 13:15`. Thời lượng dạng `2 phút 30 giây`.
- Màn hình tối thiểu 1280px; thu nhỏ tới 992px vẫn dùng được (thanh bên tự thu gọn).

### A3. Bố cục chung

```
┌────────────┬──────────────────────────────────────────────┐
│  IVPDS     │  Tiêu đề trang              [Tên admin ▾]    │
│  Admin     ├──────────────────────────────────────────────┤
│            │                                              │
│ ▣ Tổng quan│   Nội dung trang                             │
│ ☎ Cuộc gọi │                                              │
│ ⚑ Báo cáo ③│                                              │
│ ⛔ Danh sách đen                                          │
│ ✎ Mẫu lừa đảo                                             │
│ 👤 Người dùng                                             │
└────────────┴──────────────────────────────────────────────┘
```

- Thanh bên (Sider) tối màu, thu gọn được. Mục **Báo cáo** có huy hiệu số báo cáo đang chờ duyệt (lấy từ `blacklistReports.PENDING` của API thống kê).
- Thanh trên: tiêu đề trang, bên phải là tên admin với menu thả xuống "Đổi mật khẩu" và "Đăng xuất".
- Mỗi trang có Breadcrumb và tiêu đề.

### A4. Màn hình đăng nhập (`/login`)

- Thẻ đăng nhập căn giữa trên nền xanh đậm, có logo chữ "IVPDS" và dòng "Hệ thống phát hiện lừa đảo qua cuộc gọi — Trang quản trị".
- Form: Email, Mật khẩu (có nút hiện/ẩn), nút "Đăng nhập" rộng hết thẻ, liên kết "Quên mật khẩu?".
- Sai thông tin (`INVALID_CREDENTIALS`): Alert đỏ trong thẻ "Email hoặc mật khẩu không đúng". Tài khoản khóa (`ACCOUNT_LOCKED`): "Tài khoản đã bị khóa".
- Đăng nhập được nhưng không có vai trò `ADMIN`: không cho vào, hiện "Tài khoản này không có quyền quản trị", và gọi `logout` để thu hồi token vừa nhận.
- **Quên mật khẩu** (`/forgot-password`): hai bước trong một thẻ, dùng `Steps` — bước 1 nhập email, bước 2 nhập mã 6 số (dùng `Input.OTP`) và mật khẩu mới. Sau bước 1 luôn hiện "Nếu email tồn tại, mã đã được gửi" (backend không tiết lộ email có tồn tại không).
- **Đổi mật khẩu**: Modal từ menu tên admin — mật khẩu hiện tại, mật khẩu mới, nhập lại. Thành công thì báo và đưa về `/login` (backend đăng xuất mọi phiên).

### A5. Tổng quan (`/`)

Mục tiêu: trong 5 giây biết tình hình và việc cần làm.

- Góc phải trên: `Segmented` chọn kỳ **7 ngày / 30 ngày / 90 ngày** (tham số `days`), và nút làm mới.
- **Hàng 1 — bốn thẻ số liệu lớn** (`Statistic` trong `Card`):
  1. Cuộc gọi nguy cơ cao (`callsByRiskLevel.HIGH`), màu đỏ; bấm vào → `/calls?riskLevel=HIGH`.
  2. Báo cáo chờ duyệt (`blacklistReports.PENDING`), màu cam; bấm vào → `/reports`.
  3. Tổng cuộc gọi (`calls.total`), dòng phụ "+N trong kỳ" (`calls.newInPeriod`).
  4. Người dùng (`users.total`), dòng phụ "N mới trong kỳ · N bị khóa".
- **Hàng 2**:
  - Trái (2/3): biểu đồ **cột chồng theo ngày** từ `daily` — bốn lớp `high`, `medium`, `low`, `unanalysed` với đúng màu ở A2; trục X là ngày (`dd/MM`); tooltip hiện đủ bốn số và tổng.
  - Phải (1/3): biểu đồ **vành khuyên** tỉ lệ `callsByRiskLevel`, giữa vành ghi tổng số cuộc gọi đã phân tích.
- **Hàng 3**:
  - Trái: thẻ **"Dấu hiệu lừa đảo phổ biến"** — danh sách `topIndicators`, mỗi dòng là tên tiếng Việt của dấu hiệu, số cuộc gọi, và thanh `Progress` tỉ lệ theo dòng lớn nhất.
  - Phải: thẻ **"Số đáng ngờ chưa bị chặn"** — bảng `suspectedNumbers`: số điện thoại, số cuộc gọi nguy cơ cao, số người nhận, cuộc gọi gần nhất; hai nút "Xem cuộc gọi" (→ `/calls?callerNumber=…&riskLevel=HIGH`) và "Chặn số" (mở form thêm vào danh sách đen, điền sẵn số). Dưới tiêu đề có dòng chữ nhỏ: *"Gợi ý từ kết quả phân tích tự động, cần xem xét trước khi chặn."*
- **Hàng 4 — ba thẻ nhỏ**: Nguồn cuộc gọi (`RECORDED` "Ghi âm trong ứng dụng", `UPLOADED` "Tải file lên", `LIVE` "Cuộc gọi trực tiếp"); Trạng thái phân tích (`analysesByStatus`); Danh sách đen và mẫu lừa đảo (tổng / đang bật).
- Cuối trang, chữ nhỏ màu xám: "Số liệu lúc {generatedAt}, múi giờ {timeZone}".

### A6. Cuộc gọi (`/calls`) và chi tiết (`/calls/:callId`)

**Danh sách**

- Trên bảng là hàng `Segmented`: **Tất cả · Nguy cơ cao · Đáng ngờ · An toàn** (đặt `riskLevel`), mặc định "Tất cả".
- Hàng bộ lọc: ô tìm số người gọi; `Select` trạng thái phân tích; `RangePicker` khoảng thời gian (`from`, `to`); nút "Xóa bộ lọc". Nếu đang lọc theo một người dùng (`userId` trên URL), hiện một `Tag` đóng được ghi email người đó.
- Bảng (phân trang phía server):

  | Cột | Nội dung |
  |---|---|
  | Thời điểm | `createdAt` |
  | Người dùng | `owner.fullName`, dòng dưới là email, màu xám |
  | Số người gọi | `callerNumber`; nếu `callerBlacklisted` thì kèm Tag đỏ "Trong danh sách đen"; không có số thì "Không rõ" |
  | Nguồn | Tag theo `source` |
  | Thời lượng | `durationSeconds` |
  | Mức rủi ro | Tag màu theo A2; đang phân tích thì Tag "Đang phân tích"; lỗi thì Tag "Lỗi" |
  | Điểm | `riskScore`/100, in đậm, màu theo mức |
  | Dấu hiệu | tối đa 2 Tag tên tiếng Việt, phần còn lại gộp thành "+N" có Tooltip |
  | | nút "Chi tiết" |

- Dòng mức HIGH có vạch đỏ mảnh ở mép trái để nhìn lướt là thấy.

**Chi tiết**

- Đầu trang: nút quay lại, số người gọi, Tag mức rủi ro lớn.
- **Thẻ kết luận** (nổi bật, viền màu theo mức): bên trái là vòng `Progress` dạng dashboard hiện `riskScore`/100 màu theo mức; bên phải là nhãn mức rủi ro cỡ lớn, dòng "Độ chắc chắn của kết luận: {confidence dạng %}", và các Tag dấu hiệu (mỗi Tag có Tooltip giải thích).
  - Nếu phân tích `FAILED`: thay bằng `Result` trạng thái lỗi, tiêu đề "Phân tích không thành công", hiện câu tiếng Việt theo `errorCode` và mã lỗi dạng chữ nhỏ. **Không hiện điểm hay mức rủi ro.**
  - Nếu chưa phân tích (`analysis` là `null`): `Empty` "Cuộc gọi chưa được phân tích".
- **Thẻ thông tin** (`Descriptions`, 2 cột): người dùng (liên kết sang trang người dùng), số người gọi, nguồn, thời điểm gửi, thời điểm cuộc gọi (`calledAt`), thời lượng, thời điểm phân tích xong.
- **Thẻ transcript**: nội dung trong khung cuộn được, chữ dễ đọc (cỡ 15px, giãn dòng 1.7), nút "Sao chép". Không có transcript thì ghi "Không có transcript".
- **Thẻ "Chi tiết kỹ thuật"** (thu gọn mặc định, `Collapse`): xác suất lừa đảo của NLP Model (`modelProbability`, dạng %), model nhận dạng giọng nói, phiên bản NLP Model, Rule Engine, Risk Engine. Có dòng chú thích: *"Xác suất của model là một thành phần của điểm rủi ro, không phải điểm rủi ro."*
- Nút hành động: "Chặn số này" (ẩn nếu không có số hoặc số đã bị chặn).
- **Không có trình phát hay nút tải ghi âm.** Quản trị viên không được quyền nghe ghi âm của người dùng; đây là chủ ý của hệ thống.

### A7. Báo cáo số lừa đảo (`/reports`)

Đây là hàng việc cần xử lý, thiết kế như một hộp thư đến.

- `Tabs`: **Chờ duyệt** (mặc định, có số đếm) · **Đã duyệt** · **Từ chối** · **Tất cả**. Ô tìm theo số điện thoại.
- Bảng:

  | Cột | Nội dung |
  |---|---|
  | Số bị báo cáo | `phoneNumber`; nếu `blacklisted` thì Tag "Đã chặn" |
  | Số người báo cáo | `reportsForNumber`; từ 2 trở lên thì hiện Badge đỏ nổi bật kèm chữ "người" |
  | Lý do | `reason`, cắt 2 dòng, Tooltip hiện đủ; trống thì "Không ghi lý do" |
  | Cuộc gọi liên quan | có `callId` thì liên kết "Xem cuộc gọi" mở chi tiết cuộc gọi trong `Drawer` bên phải (không rời trang) |
  | Ngày báo cáo | `createdAt` |
  | Trạng thái | Tag |
  | | với báo cáo chờ duyệt: nút chính "Duyệt" và nút "Từ chối" |

- **Duyệt** mở Modal: tiêu đề "Chặn số {phoneNumber}?", hiện lý do của người báo cáo, ô văn bản "Lý do hiển thị cho người dùng khi tra cứu" (không bắt buộc, tối đa 1000 ký tự, placeholder "Bỏ trống để dùng lý do của báo cáo"), và Alert thông tin: *"Số sẽ được đưa vào danh sách đen. Mọi báo cáo đang chờ về số này cũng được duyệt."*
- **Từ chối** dùng `Popconfirm`: "Từ chối báo cáo này? Các báo cáo khác về số này không bị ảnh hưởng."
- Sau khi xử lý: thông báo thành công, dòng biến khỏi tab Chờ duyệt, huy hiệu ở thanh bên giảm.
- Tab Chờ duyệt rỗng: `Empty` với chữ "Không còn báo cáo nào chờ duyệt".

### A8. Danh sách đen (`/blacklist`)

- Thanh công cụ: ô tìm theo số, `Select` trạng thái (Tất cả / Đang chặn / Đã tắt), nút chính "Thêm số".
- Bảng: số điện thoại (in đậm, font đơn cách), lý do, trạng thái (một `Switch` bật/tắt ngay trên dòng, có xác nhận khi tắt), ngày thêm, cập nhật lần cuối, nút "Sửa" và "Xóa".
- **Thêm số** (Modal): Số điện thoại (bắt buộc; dưới ô có gợi ý "Ví dụ: 0901234567 hoặc +84901234567"), Lý do (không bắt buộc, tối đa 1000 ký tự, có đếm ký tự; gợi ý "Lý do này hiển thị cho người dùng khi tra cứu").
- **Sửa** (Modal): chỉ sửa lý do; số điện thoại hiện dạng chỉ đọc.
- **Xóa** (`Popconfirm`): "Xóa hẳn số này khỏi danh sách? Muốn tạm ngừng chặn, hãy tắt thay vì xóa."

### A9. Mẫu lừa đảo (`/patterns`)

- Đầu trang có Alert thông tin, đóng được: *"Mẫu là cụm từ đặc trưng của kẻ lừa đảo. Mẫu đang bật được dùng ngay từ lần phân tích kế tiếp. Mẫu khớp nguyên cụm từ và riêng các mẫu không thể đưa một cuộc gọi lên mức nguy cơ cao."*
- Thanh công cụ: ô tìm (tên, cụm từ), `Select` loại dấu hiệu, `Select` trạng thái, nút chính "Thêm mẫu".
- Bảng: tên, cụm từ (hiện trong ngoặc kép, nền xám nhạt), loại dấu hiệu (Tag tên tiếng Việt), `Switch` bật/tắt, ngày tạo, nút "Sửa" và "Xóa".
- **Thêm / Sửa** (Modal rộng 560px):
  - Tên mẫu — bắt buộc, tối đa 150 ký tự.
  - Loại dấu hiệu — `Select` có tìm kiếm; mỗi lựa chọn hiện tên tiếng Việt và mã ở dòng phụ. Dùng 14 mã ở mục B6, **không có** `COORDINATED_CALLERS`.
  - Cụm từ — bắt buộc, **ít nhất hai từ**, tối đa 200 ký tự, có đếm ký tự. Gợi ý dưới ô: "Viết đúng như cách kẻ lừa đảo nói, ví dụ: tài khoản sẽ bị khóa". Kiểm tra hai từ ngay tại form: "Cụm từ cần ít nhất hai từ; một từ đơn lẻ sẽ khớp quá nhiều câu bình thường."
  - Mô tả — không bắt buộc, tối đa 2000 ký tự.

### A10. Người dùng (`/users`) và chi tiết (`/users/:id`)

- Thanh công cụ: ô tìm (email, họ tên), `Segmented` Tất cả / Hoạt động / Đã khóa.
- Bảng: `Avatar` chữ cái đầu cùng họ tên và email; số điện thoại; vai trò (Tag; `ADMIN` màu xanh đậm); trạng thái; ngày tạo; nút "Chi tiết" và "Khóa" / "Mở khóa".
- **Khóa** mở Modal xác nhận kiểu cảnh báo: "Khóa tài khoản {email}? Người dùng sẽ bị đăng xuất ngay và không đăng nhập lại được cho tới khi được mở khóa."
- Ở dòng của chính admin đang đăng nhập: không có nút khóa, có Tag "Bạn".
- **Chi tiết**: thẻ hồ sơ (`Descriptions`: email, họ tên, số điện thoại, vai trò, trạng thái, cảnh báo danh sách đen bật/tắt, ngày tạo) với nút khóa/mở khóa; bên dưới là bảng cuộc gọi của người đó (dùng lại bảng ở A6, không có cột Người dùng).

### A11. Quy tắc chung của mọi màn hình

- Mọi bảng: phân trang phía server, chọn được 10/20/50 dòng, hiện "Tổng N mục"; có `Skeleton` khi tải lần đầu và trạng thái mờ khi đổi trang; `Empty` có chữ phù hợp khi rỗng; `Result` kèm nút "Thử lại" khi lỗi.
- Bộ lọc và trang hiện tại nằm trên URL, để tải lại hoặc gửi liên kết không mất trạng thái.
- Thao tác thành công: `message.success` ngắn. Lỗi nghiệp vụ: `message.error` bằng tiếng Việt. Lỗi của form: hiện đỏ ngay dưới đúng ô.
- Thao tác không hoàn tác được (xóa, khóa, từ chối) luôn có bước xác nhận; nút nguy hiểm dùng kiểu `danger`.
- Nút đang gửi có trạng thái `loading` và không bấm lại được.
- Trang không tồn tại: `Result` 404 có nút về Tổng quan.

---

## PHẦN B — API

### B1. Kết nối

- Backend: `http://127.0.0.1:8080`. **Backend chưa bật CORS**: cấu hình proxy của Vite chuyển `/api` tới backend (đích lấy từ `VITE_BACKEND_URL`, mặc định `http://127.0.0.1:8080`), và gọi API bằng đường dẫn tương đối.
- Mọi API (trừ nhóm đăng nhập ở B3) cần header `Authorization: Bearer <accessToken>`.
- JSON; thời gian ISO 8601 UTC; id là UUID; trường không có giá trị là `null`.

### B2. Phân trang và lỗi

Danh sách nhận `page` (**bắt đầu từ 0** — Ant Design bắt đầu từ 1, nhớ đổi) và `size` (mặc định 20, tối đa 100), trả:

```json
{ "items": [], "page": 0, "size": 20, "totalItems": 57, "totalPages": 3 }
```

Mọi lỗi có dạng:

```json
{
  "timestamp": "2026-10-10T06:15:30.123Z", "status": 400, "code": "VALIDATION_FAILED",
  "message": "Request validation failed.", "path": "/api/v1/...", "requestId": "3f2c9a1e-...",
  "fieldErrors": [ { "field": "pattern", "message": "must not be blank" } ]
}
```

Xử lý theo `code`. `fieldErrors` chỉ có khi `code` là `VALIDATION_FAILED`: gắn vào đúng ô của form. `message` là tiếng Anh, không hiện thẳng cho người dùng.

### B3. Đăng nhập (không cần token)

| API | Body | Trả về |
|---|---|---|
| `POST /api/v1/auth/login` | `{email, password}` | `200` AuthResponse · `401 INVALID_CREDENTIALS` · `403 ACCOUNT_LOCKED` |
| `POST /api/v1/auth/refresh` | `{refreshToken}` | `200` AuthResponse · `401 INVALID_REFRESH_TOKEN` |
| `POST /api/v1/auth/logout` | `{refreshToken}` | `204` |
| `POST /api/v1/auth/forgot-password` | `{email}` | luôn `204` |
| `POST /api/v1/auth/reset-password` | `{email, code, newPassword}` (`code` 6 chữ số) | `204` · `400 INVALID_RESET_CODE` |
| `POST /api/v1/auth/change-password` (cần token) | `{currentPassword, newPassword}` | `204` · `400 INVALID_CURRENT_PASSWORD` |

Mật khẩu 8–72 ký tự.

```json
{
  "accessToken": "eyJ...", "refreshToken": "b7Jk2...", "tokenType": "Bearer", "expiresIn": 900,
  "user": { "id": "0b9f...", "email": "admin@ivpds.local", "fullName": "Administrator", "roles": ["ADMIN", "USER"] }
}
```

- `accessToken` sống 15 phút. `refreshToken` sống 7 ngày và **chỉ dùng được một lần**: mỗi lần refresh trả về cặp token mới.
- Khi một API trả `401`: gọi `refresh` rồi gửi lại request. Nhiều request cùng `401` thì **chỉ refresh một lần**, các request khác chờ kết quả đó. Refresh thất bại thì về `/login`.
- Giữ `accessToken` trong bộ nhớ, `refreshToken` trong `localStorage`; khi mở trang mà có `refreshToken` thì refresh trước khi hiện giao diện.

### B4. Thống kê

`GET /api/v1/admin/statistics?days=30&timeZone=Asia/Ho_Chi_Minh` (`days` 1–365)

```json
{
  "generatedAt": "2026-10-10T06:30:00Z",
  "periodDays": 7,
  "timeZone": "Asia/Ho_Chi_Minh",
  "users": { "total": 42, "active": 41, "locked": 1, "newInPeriod": 5 },
  "calls": { "total": 310, "newInPeriod": 28, "RECORDED": 12, "UPLOADED": 280, "LIVE": 18 },
  "analysesByStatus": { "PENDING": 0, "PROCESSING": 1, "COMPLETED": 300, "FAILED": 14 },
  "callsByRiskLevel": { "LOW": 190, "MEDIUM": 40, "HIGH": 70 },
  "topIndicators": [ { "indicator": "AUTHORITY_IMPERSONATION", "calls": 55 } ],
  "blacklist": { "total": 20, "active": 18 },
  "blacklistReports": { "PENDING": 4, "APPROVED": 9, "REJECTED": 2 },
  "phishingPatterns": { "total": 6, "active": 5 },
  "suspectedNumbers": [ { "phoneNumber": "+84901234567", "highRiskCalls": 3, "users": 2, "lastCallAt": "2026-10-10T05:00:00Z" } ],
  "daily": [ { "date": "2026-10-10", "calls": 6, "high": 2, "medium": 1, "low": 2, "unanalysed": 1 } ]
}
```

`daily` có một dòng mỗi ngày, cũ nhất trước. `topIndicators` và `suspectedNumbers` tối đa 10 dòng. (Các số trên chỉ minh họa cấu trúc.)

### B5. Cuộc gọi

- `GET /api/v1/admin/calls` — tham số: `riskLevel` (`LOW`/`MEDIUM`/`HIGH`), `status` (`PENDING`/`PROCESSING`/`COMPLETED`/`FAILED`), `userId`, `from`, `to` (ISO 8601), `callerNumber` (một phần chữ số), `page`, `size`. Mới nhất trước.
- `GET /api/v1/admin/calls/{callId}` — `404 CALL_NOT_FOUND`.

```json
{
  "callId": "5d0c...",
  "callerNumber": "+84901234567",
  "callerBlacklisted": true,
  "calledAt": null,
  "source": "UPLOADED",
  "createdAt": "2026-10-10T06:15:30Z",
  "durationSeconds": 150.2,
  "analysis": {
    "id": "c7a2...",
    "status": "COMPLETED",
    "errorCode": null,
    "errorMessage": null,
    "completedAt": "2026-10-10T06:16:02Z",
    "riskScore": 97,
    "riskLevel": "HIGH",
    "confidence": 0.98,
    "indicators": ["LEGAL_THREAT", "SECRECY_DEMAND", "URGENCY"],
    "transcript": "a lô mình là bên bộ công an ạ ...",
    "details": {
      "sttModel": "faster-whisper/phowhisper-medium-int8 (int8, cpu)",
      "modelProbability": 0.999912,
      "nlpModelVersion": "2026.10.09-phobert-base-r6",
      "rulesetVersion": "2026.10.5",
      "riskEngineVersion": "2026.10.1"
    }
  },
  "owner": { "id": "0b9f...", "email": "an@example.com", "fullName": "Nguyễn Văn An" }
}
```

- Trong **danh sách**, `analysis.transcript` và `analysis.details` luôn là `null`; chỉ API chi tiết mới có.
- `analysis` là `null` khi cuộc gọi chưa được phân tích. `callerNumber`, `calledAt`, `durationSeconds` có thể `null`.
- Khi `status` là `FAILED`: `riskScore`, `riskLevel`, `confidence`, `indicators` là `null`; `errorCode` và `errorMessage` có giá trị.
- Mức rủi ro: `LOW` 0–29, `MEDIUM` 30–59, `HIGH` 60–100. `confidence` (0–1) là độ chắc chắn của kết luận, **không phải** xác suất lừa đảo.

### B6. Mã dấu hiệu và tên hiển thị

| Mã | Tên hiển thị | Giải thích (Tooltip) |
|---|---|---|
| `OTP_REQUEST` | Đòi mã OTP | Người gọi yêu cầu đọc mã OTP |
| `MONEY_TRANSFER` | Yêu cầu chuyển tiền | Người gọi yêu cầu chuyển tiền |
| `BANK_IMPERSONATION` | Giả danh ngân hàng | Người gọi tự xưng nhân viên ngân hàng |
| `URGENCY` | Thúc giục | Ép làm ngay, không cho thời gian suy nghĩ |
| `ACCOUNT_LOCK_THREAT` | Dọa khóa tài khoản | Dọa tài khoản sẽ bị khóa |
| `SENSITIVE_INFORMATION` | Đòi thông tin nhạy cảm | Hỏi số thẻ, mật khẩu, CCCD |
| `AUTHORITY_IMPERSONATION` | Giả danh cơ quan chức năng | Tự xưng công an, viện kiểm sát, tòa án |
| `LEGAL_THREAT` | Đe dọa pháp lý | Dọa bắt giữ, khởi tố, liên quan vụ án |
| `HARM_THREAT` | Đe dọa gây hại | Đe dọa gây hại cho người nghe hoặc người thân |
| `SECRECY_DEMAND` | Yêu cầu giữ bí mật | Yêu cầu không nói với ai |
| `REMOTE_ACCESS_REQUEST` | Yêu cầu điều khiển từ xa | Yêu cầu cài ứng dụng, chia sẻ màn hình |
| `FINANCIAL_BAIT` | Mồi tài chính | Trúng thưởng, hoàn tiền, lãi cao |
| `UNUSUAL_PAYMENT` | Thanh toán bất thường | Hình thức thanh toán khác thường |
| `CALL_HANDOFF` | Chuyển máy | Chuyển máy cho "cán bộ" khác |
| `COORDINATED_CALLERS` | Nhiều người phối hợp | Nhiều người phía gọi đến cùng tham gia (chỉ hiển thị, không dùng cho mẫu) |

Mã lạ (backend thêm về sau) thì hiện nguyên mã.

### B7. Mã lỗi phân tích (`analysis.errorCode`) và câu hiển thị

| Mã | Câu hiển thị |
|---|---|
| `NO_SPEECH_DETECTED` | Không nhận ra lời nói trong ghi âm |
| `INVALID_AUDIO`, `EMPTY_AUDIO` | File ghi âm không đọc được |
| `AUDIO_TOO_LONG`, `AUDIO_TOO_LARGE`, `PAYLOAD_TOO_LARGE` | Ghi âm vượt giới hạn cho phép |
| `CALL_HAS_NO_AUDIO`, `AUDIO_OBJECT_MISSING` | Cuộc gọi không còn file ghi âm |
| `STT_UNAVAILABLE`, `STT_FAILED` | Nhận dạng giọng nói gặp lỗi |
| `NLP_MODEL_UNAVAILABLE` | Model đánh giá rủi ro chưa sẵn sàng |
| `AUDIO_PROCESSING_UNAVAILABLE`, `AUDIO_PROCESSING_TIMEOUT` | Xử lý âm thanh gặp lỗi |
| `AI_SERVICE_UNAVAILABLE`, `AI_SERVICE_TIMEOUT`, `AI_SERVICE_ERROR` | Dịch vụ AI không phản hồi |
| `AI_SERVICE_AUTH_FAILED`, `AI_REQUEST_REJECTED`, `AI_INVALID_RESPONSE` | Lỗi cấu hình giữa backend và dịch vụ AI |
| `STORAGE_UNAVAILABLE` | Kho lưu trữ không phản hồi |
| `ANALYSIS_QUEUE_FULL` | Hàng chờ phân tích đã đầy |
| `ANALYSIS_INTERRUPTED` | Phân tích bị gián đoạn do hệ thống khởi động lại |
| `LIVE_CALL_NOT_STARTED` | Cuộc gọi trực tiếp được mở nhưng không có âm thanh |
| `LIVE_SESSION_LIMIT`, `LIVE_SESSION_OVERLOADED`, `LIVE_SESSION_FAILED` | Phân tích trực tiếp quá tải hoặc gặp lỗi |
| mã khác | Phân tích gặp lỗi không xác định |

### B8. Người dùng

- `GET /api/v1/admin/users` — `query` (email, họ tên), `status` (`ACTIVE`/`LOCKED`), `page`, `size`.
- `GET /api/v1/admin/users/{id}` — `404 USER_NOT_FOUND`.
- `PATCH /api/v1/admin/users/{id}/status` — body `{"status": "LOCKED"}` hoặc `{"status": "ACTIVE"}` · `409 CANNOT_LOCK_OWN_ACCOUNT`.

```json
{ "id": "0b9f...", "email": "an@example.com", "fullName": "Nguyễn Văn An", "phoneNumber": "+84901234567",
  "status": "ACTIVE", "roles": ["USER"], "blacklistAlertEnabled": true, "createdAt": "2026-10-01T03:00:00Z" }
```

### B9. Danh sách đen

- `GET /api/v1/admin/blacklist` — `query` (một phần chữ số), `active` (`true`/`false`), `page`, `size`.
- `POST /api/v1/admin/blacklist` — `{"phoneNumber": "0901234567", "reason": "Giả danh ngân hàng"}` → `201` · `400 INVALID_PHONE_NUMBER` · `409 PHONE_NUMBER_ALREADY_BLACKLISTED` (kể cả số đã tắt) · `400 VALIDATION_FAILED` (lý do quá 1000 ký tự).
- `PATCH /api/v1/admin/blacklist/{id}` — `{"reason": "...", "active": false}`; trường không gửi giữ nguyên.
- `DELETE /api/v1/admin/blacklist/{id}` → `204` · `404 BLACKLIST_ENTRY_NOT_FOUND`.

```json
{ "id": "f0a1...", "phoneNumber": "+84901234567", "reason": "Giả danh ngân hàng", "active": true,
  "createdBy": "ad11...", "createdAt": "2026-10-09T02:00:00Z", "updatedAt": "2026-10-09T02:00:00Z" }
```

Backend tự chuẩn hóa số: `0901234567`, `090 123 4567`, `84901234567` đều thành `+84901234567`. Số hợp lệ có 6–15 chữ số.

### B10. Báo cáo số lừa đảo

- `GET /api/v1/admin/blacklist/reports` — `status` (`PENDING`/`APPROVED`/`REJECTED`), `query` (một phần chữ số), `page`, `size`.
- `POST /api/v1/admin/blacklist/reports/{id}/approve` — body không bắt buộc: `{"reason": "Đã xác minh"}` → `200`.
- `POST /api/v1/admin/blacklist/reports/{id}/reject` — không body → `200`.
- Lỗi: `404 BLACKLIST_REPORT_NOT_FOUND` · `409 REPORT_ALREADY_REVIEWED` · `409 REPORT_REVIEW_CONFLICT` (hai admin thao tác cùng lúc: báo và tải lại).

```json
{
  "id": "e19a...", "phoneNumber": "+84901234567", "reporterId": "0b9f...", "callId": "5d0c...",
  "reason": "Tự xưng công an, đòi chuyển tiền", "status": "PENDING",
  "reviewedBy": null, "reviewedAt": null, "createdAt": "2026-10-10T06:20:00Z",
  "reportsForNumber": 3, "blacklisted": false
}
```

`callId` và `reason` có thể `null`. Duyệt một báo cáo sẽ chặn số và duyệt luôn mọi báo cáo đang chờ về số đó.

### B11. Mẫu lừa đảo

- `GET /api/v1/admin/phishing-patterns` — `query` (tên, cụm từ), `indicatorCode`, `active`, `page`, `size`.
- `GET /api/v1/admin/phishing-patterns/{id}` — `404 PHISHING_PATTERN_NOT_FOUND`.
- `POST /api/v1/admin/phishing-patterns` → `201`
- `PATCH /api/v1/admin/phishing-patterns/{id}` — trường không gửi giữ nguyên; `description` là chuỗi rỗng nghĩa là xóa mô tả; `{"active": false}` để tắt.
- `DELETE /api/v1/admin/phishing-patterns/{id}` → `204`
- Lỗi: `400 VALIDATION_FAILED` · `400 UNKNOWN_INDICATOR_CODE` · `400 PATTERN_TOO_SHORT`.

```json
{ "name": "Gói bảo hiểm giả", "indicatorCode": "FINANCIAL_BAIT", "pattern": "gói bảo an tâm phúc", "description": "Xuất hiện từ tháng 10/2026" }
```

```json
{ "id": "a7c3...", "name": "Gói bảo hiểm giả", "indicatorCode": "FINANCIAL_BAIT", "pattern": "gói bảo an tâm phúc",
  "description": "Xuất hiện từ tháng 10/2026", "active": true, "createdBy": "ad11...",
  "createdAt": "2026-10-10T06:00:00Z", "updatedAt": "2026-10-10T06:00:00Z" }
```

### B12. Câu hiển thị cho các mã lỗi còn lại

| Mã | Câu hiển thị |
|---|---|
| `UNAUTHORIZED` | Phiên đăng nhập đã hết hạn |
| `FORBIDDEN` | Bạn không có quyền thực hiện thao tác này |
| `INVALID_PHONE_NUMBER` | Số điện thoại không hợp lệ (6–15 chữ số) |
| `PHONE_NUMBER_ALREADY_BLACKLISTED` | Số này đã có trong danh sách đen |
| `CANNOT_LOCK_OWN_ACCOUNT` | Bạn không thể khóa chính tài khoản của mình |
| `REPORT_ALREADY_REVIEWED` | Báo cáo này đã được xử lý |
| `REPORT_REVIEW_CONFLICT` | Danh sách vừa thay đổi, vui lòng thử lại |
| `UNKNOWN_INDICATOR_CODE` | Loại dấu hiệu không hợp lệ |
| `PATTERN_TOO_SHORT` | Cụm từ cần ít nhất hai từ |
| `INVALID_TIME_ZONE` | Múi giờ không hợp lệ |
| `*_NOT_FOUND` | Không tìm thấy dữ liệu (có thể đã bị xóa) |
| `INTERNAL_ERROR`, lỗi mạng | Hệ thống gặp lỗi, vui lòng thử lại. Mã tra cứu: {requestId} |

---

## PHẦN C — YÊU CẦU KHI LÀM

- **Không dùng dữ liệu giả.** Mọi số liệu, bảng, biểu đồ lấy từ API thật. Chưa có dữ liệu thì hiện trạng thái rỗng, không hard-code số để giao diện trông đầy.
- Viết kiểu TypeScript cho mọi request và response theo Phần B; không dùng `any`.
- Tên tiếng Việt, màu của mức rủi ro, câu lỗi đặt ở một chỗ dùng chung; không lặp lại ở từng màn hình.
- Cấu trúc: `src/api/` (axios, kiểu, hàm gọi), `src/auth/`, `src/features/<tên>/`, `src/components/` (Tag mức rủi ro, Tag dấu hiệu, bảng cuộc gọi dùng lại), `src/routes/`, `src/theme/`.
- Sau thao tác thay đổi dữ liệu, làm mới đúng các truy vấn liên quan (duyệt báo cáo làm mới báo cáo, danh sách đen và thống kê).
- Có test cho: làm mới token khi nhiều request cùng 401, đổi trang 0 ↔ 1, ánh xạ mã lỗi.
- `npm run build`, ESLint và `tsc --noEmit` không lỗi. Chú thích code bằng tiếng Việt, ngắn.
- Không đưa token, mật khẩu, `.env` vào git; không in token ra console. Có `.env.example` và README ngắn cách chạy.
- Khi xong, chạy thật với backend và báo cáo: đã làm gì, lệnh đã chạy và kết quả thật, màn hình nào đã thử với backend thật. Phần chưa thử ghi **NOT VERIFIED**; phần bị chặn (backend chưa chạy, chưa có tài khoản admin) ghi **BLOCKED** và nói cần gì.
- Tài khoản admin để thử: hỏi tôi khi cần; không tự tạo, không ghi vào code.
- Nếu backend thật trả khác với Phần B (đối chiếu tại `http://127.0.0.1:8080/v3/api-docs`), backend thật là đúng: báo cho tôi chỗ khác, không tự đoán.

Bắt đầu bằng việc dựng khung dự án, theme và bố cục chung, rồi màn hình đăng nhập; sau đó lần lượt Tổng quan, Cuộc gọi, Báo cáo, Danh sách đen, Mẫu lừa đảo, Người dùng.
