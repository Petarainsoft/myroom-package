# Public API Endpoints

Tài liệu này mô tả các API endpoint công khai không yêu cầu xác thực người dùng trong hệ thống.

## Cách Xác Thực API

Hệ thống sử dụng hai phương thức xác thực chính:

1. **JWT Authentication**: Sử dụng cho các API dành cho Admin, yêu cầu token Bearer trong header `Authorization`
2. **API Key Authentication**: Sử dụng cho các API dành cho Developer, yêu cầu API key trong header `X-API-Key`

## Middleware Xác Thực

Hệ thống sử dụng middleware `publicRoutes` để xác định các route không yêu cầu xác thực. Các route này được định nghĩa trong file `src/middleware/publicRoutes.ts`.

## Danh Sách API Công Khai

### Health Check Endpoints

- `GET /api/health` - Kiểm tra sức khỏe cơ bản của hệ thống
- `GET /api/health/detailed` - Kiểm tra sức khỏe chi tiết của hệ thống
- `GET /api/health/database` - Kiểm tra sức khỏe của cơ sở dữ liệu
- `GET /api/health/redis` - Kiểm tra sức khỏe của Redis
- `GET /api/health/s3` - Kiểm tra sức khỏe của S3
- `GET /api/health/system` - Kiểm tra sức khỏe của hệ thống
- `GET /health` - Kiểm tra sức khỏe cơ bản cho load balancers

### Documentation Endpoints

- `GET /api/docs` - Tài liệu Swagger UI
- `GET /api/docs.json` - Tài liệu Swagger JSON
- `GET /api/postman` - Tạo Postman Collection
- `GET /api` - Thông tin API
- `GET /` - Endpoint gốc

### Authentication Endpoints

- `POST /api/admin/auth/login` - Đăng nhập Admin

### Developer Endpoints

- `POST /api/developer/register` - Đăng ký developer (yêu cầu API key với scope `developer:write`)
- `POST /api/developer/verify` - Xác thực email developer (yêu cầu API key với scope `developer:write`)

## Lưu Ý

- Các API công khai vẫn có thể yêu cầu API key, nhưng không yêu cầu xác thực người dùng
- Các API khác không được liệt kê ở đây đều yêu cầu xác thực người dùng
- Các API yêu cầu xác thực sẽ trả về mã lỗi 401 nếu không có thông tin xác thực hoặc thông tin xác thực không hợp lệ