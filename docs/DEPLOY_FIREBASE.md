# Hướng dẫn triển khai `react-demo` lên Firebase Hosting

> Tài liệu này dành cho dự án `react-demo` nằm trong thư mục `d:/Ahn/2025/my-room/react-demo`. Các lệnh dưới đây giả định bạn đang ở **PowerShell** trên Windows, thư mục hiện hành là `react-demo`.

---

## 1. Chuẩn bị môi trường

| Thành phần | Phiên bản gợi ý |
|------------|-----------------|
| Node.js    | v18 hoặc mới hơn|
| npm/pnpm/yarn | Tùy chọn (hướng dẫn dùng **npm**) |
| Firebase CLI | `npm install -g firebase-tools` |

```powershell
npm install -g firebase-tools
firebase --version   # kiểm tra cài đặt
```

## 2. Đăng nhập Firebase

```powershell
firebase login
```

Trình duyệt sẽ mở ra, hãy chọn tài khoản Google mong muốn.

## 3. Tạo (hoặc chọn) project Firebase

Nếu **chưa** có project:
```powershell
firebase projects:create myroom-react-demo --display-name "MyRoom React Demo"
```

Ghi lại **Project ID** (ví dụ: `myroom-react-demo`). Nếu **đã có** project, chỉ cần nhớ Project ID.

## 4. Khởi tạo Firebase Hosting trong thư mục dự án

```powershell
cd d:/Ahn/2025/my-room/react-demo
firebase init hosting
```

Trả lời các câu hỏi:
1. **Which Firebase project?**  
   → Chọn Project ID của bạn.
2. **What do you want to use as your public directory?**  
   → Gõ `dist` (đây là thư mục build của Vite).
3. **Configure as a single-page app (rewrite all urls to /index.html)?**  
   → Chọn **Yes**.
4. **Set up automatic builds and deploys with GitHub?**  
   → Tùy chọn **No** (hoặc Yes nếu cần CI).
5. **File `dist/index.html` already exists, overwrite?**  
   → Chọn **No**.

Firebase sẽ tạo hai file cấu hình:
- `firebase.json`
- `.firebaserc`

## 5. Cài đặt phụ thuộc và build dự án

```powershell
npm install
npm run build   # tạo thư mục dist/
```

## 6. Triển khai lên Firebase

```powershell
firebase deploy
```

Sau vài giây, terminal sẽ hiển thị URL:  
```
✔  Hosting URL: https://<PROJECT_ID>.web.app
```
Mở đường dẫn trên để xem ứng dụng đã hoạt động.

## 7. Thiết lập domain tuỳ chỉnh (tuỳ chọn)

```powershell
firebase hosting:channel:deploy live   # nếu dùng preview channels
firebase hosting:sites:create myroom.example.com
firebase hosting:sites:add-domain myroom.example.com
```
Làm theo hướng dẫn để cấu hình DNS CNAME.

## 8. Biến môi trường (nếu cần)

Firebase Hosting tĩnh **không** hỗ trợ biến môi trường runtime. Bạn có hai lựa chọn:
1. Build-time: tạo file `.env` hoặc khai báo biến trực tiếp trong mã nguồn trước khi build.
2. Sử dụng Cloud Functions/Cloud Run làm API trung gian nếu cần bảo mật khóa.

## 9. Cập nhật & triển khai lần sau

Sau mỗi lần thay đổi mã nguồn:
```powershell
npm run build
firebase deploy   # hoặc firebase deploy --only hosting
```

## 10. Liên kết tham khảo

- Tài liệu chính thức Firebase Hosting: <https://firebase.google.com/docs/hosting>
- Hướng dẫn chi tiết về Single Page Apps: <https://firebase.google.com/docs/hosting/spa>

---

Chúc bạn triển khai thành công! 🤗