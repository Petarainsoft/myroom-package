# MyRoom Q&A Document

## Q&A về API Key và Phân quyền tài nguyên

### **Q1: Mỗi project nên có nhiều API Key (dev_key, prod_key, ...) hay chỉ một key? Có cần phân biệt dev/prod không?**

**A:**
- Nên cho phép mỗi project tạo nhiều API Key. Khi tạo key, khách hàng có thể đặt tên (label) như dev, prod, staging... để phục vụ các môi trường khác nhau.
- Mỗi key có thể có trường mô tả (description) hoặc loại (type: dev/prod/custom) nếu muốn phân biệt rõ.
- Việc này giúp linh hoạt, bảo mật (có thể thu hồi từng key riêng lẻ), dễ tracking usage và phù hợp với các hệ thống lớn.
- Đây là cách làm phổ biến của các nền tảng lớn như Firebase, AWS, Stripe...

**Gợi ý schema:**
```js
APIKey {
  id
  key
  projectId
  label        // Tên do khách hàng đặt: dev, prod, ...
  description  // Mô tả thêm (optional)
  type         // (optional) dev/prod/custom
  scopes
  status
  createdAt
  updatedAt
}
```

---

### **Q2: Làm sao để dùng API Key phân quyền truy cập tài nguyên?**

**A:**
- Mỗi API Key gắn với một Project.
- Mỗi Resource (tài nguyên) gắn với một Project sở hữu (ownerProjectId) và có thuộc tính phân quyền (public/private/shared).
- Khi client gửi request kèm API Key, server xác thực key này thuộc project nào, sau đó kiểm tra quyền truy cập resource:
    - Nếu resource là `public` → ai cũng truy cập được.
    - Nếu resource là `private` → chỉ project sở hữu mới truy cập được.
    - Nếu resource là `shared` → chỉ các project nằm trong danh sách chia sẻ mới truy cập được.
- Nếu không đủ quyền, server trả về lỗi 403 Forbidden.

**Pseudo-code kiểm tra quyền:**
```js
const apiKey = req.headers['x-api-key'];
const resourceId = req.params.id;
const keyInfo = await APIKey.findOne({ key: apiKey, status: 'active' });
if (!keyInfo) return res.status(401).json({ error: 'Invalid API Key' });
const projectId = keyInfo.projectId;
const resource = await Resource.findById(resourceId);
if (resource.accessPolicy === 'public') return res.json(resource);
if (resource.accessPolicy === 'private' && resource.ownerProjectId === projectId) return res.json(resource);
if (resource.accessPolicy === 'shared' && resource.sharedWith.includes(projectId)) return res.json(resource);
return res.status(403).json({ error: 'Forbidden' });
```

**Tóm lại:**
- API Key xác định bạn là project nào.
- Resource quy định ai được phép truy cập.
- Server kiểm tra quyền dựa trên mối quan hệ giữa API Key (project) và resource. 

### **Q3: Làm sao để chỉ cho phép customer sử dụng một phần resource (ví dụ: chỉ bàn, ghế), và yêu cầu trả phí cho resource cao cấp (tivi, tủ lạnh)?**

**A:**
- Mỗi resource thuộc một category.
- Hệ thống quản lý quyền sử dụng category cho từng customer (CustomerCategoryPermission).
- Nếu category là premium, customer phải trả phí để được cấp quyền sử dụng.
- Khi truy cập resource, server kiểm tra customer có quyền với category đó không, và đã thanh toán chưa nếu là premium.
- Nếu chưa có quyền hoặc chưa thanh toán, server trả về lỗi 403 hoặc 402 (Payment Required).

**Pseudo-code kiểm tra quyền truy cập resource theo category:**
```js
const apiKey = req.headers['x-api-key'];
const resourceId = req.params.id;
const keyInfo = await APIKey.findOne({ key: apiKey, status: 'active' });
if (!keyInfo) return res.status(401).json({ error: 'Invalid API Key' });
const projectId = keyInfo.projectId;
const project = await Project.findById(projectId);
const customerId = project.customerId;
const resource = await Resource.findById(resourceId);
const category = await ResourceCategory.findById(resource.categoryId);
const permission = await CustomerCategoryPermission.findOne({ customerId, categoryId: category.id });
if (!permission) return res.status(403).json({ error: 'No permission for this category' });
if (category.isPremium && !permission.isPaid) return res.status(402).json({ error: 'Payment required for premium category' });
// Các kiểm tra accessPolicy khác như cũ...
return res.json(resource);
```

---

## API hỗ trợ quản lý manifest
### API quản lý Manifest (với S3 storage)
- `POST /api/projects/:projectId/manifests` – Tạo mới manifest (upload file JSON lên S3)
- `GET /api/projects/:projectId/manifests` – Lấy danh sách manifest của project (metadata only)
- `GET /api/manifests/:manifestId` – Lấy chi tiết manifest theo id (download từ S3)
- `GET /api/manifests/:manifestId/metadata` – Lấy metadata manifest (không download file)
- `PUT /api/manifests/:manifestId` – Cập nhật manifest (upload version mới lên S3)
- `DELETE /api/manifests/:manifestId` – Xóa manifest (xóa cả S3 file và database record)

### API cho Customer truy cập tài nguyên
- `GET /api/customer/projects/:projectId/manifests` – Lấy danh sách manifest theo project (với API Key authentication)
- `GET /api/customer/manifests/:manifestId` – Lấy manifest theo ID (với API Key authentication)
- `GET /api/customer/projects/:projectId/resources` – Lấy danh sách resource mà project có quyền truy cập
- `GET /api/customer/resources/accessible` – Lấy tất cả resource mà API Key hiện tại có quyền truy cập

---

## Luồng sử dụng với S3 Storage

### Luồng quản lý Manifest
1. **Customer tạo manifest**: Upload JSON file lên S3 thông qua API, metadata lưu trong database
2. **Versioning**: Mỗi lần update tạo version mới trên S3, giữ lại history
3. **Customer mapping**: Customer tự quản lý mapping giữa end-user và manifest ID

### Luồng render 3D Scene
1. **End-user request**: Customer cung cấp manifest ID cho React Library
2. **API call**: React Library gọi `GET /api/customer/manifests/:manifestId` với API Key
3. **Authentication**: Server xác thực API Key và quyền truy cập
4. **File delivery**: Server trả về signed URL hoặc stream manifest từ S3
5. **Render**: React Library nhận JSON manifest và render 3D scene

### Tối ưu hiệu suất
- **CDN**: Sử dụng CloudFront để cache files gần user
- **Caching**: Redis cache metadata để giảm database queries
- **Lazy loading**: Chỉ tải resources khi cần thiết
- **Compression**: Gzip compression cho JSON files

---