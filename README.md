# BrewLite

BrewLite là ứng dụng web đặt đồ uống và thanh toán không tiền mặt, được xây dựng cho bài tập lớn môn Công nghệ Phần mềm. Sản phẩm hướng tới luồng đặt món nhanh tại quầy: xem menu, chọn size/topping, quản lý giỏ hàng, đăng nhập, tạo đơn, thanh toán và theo dõi trạng thái.

> Trạng thái hiện tại: đã scaffold Next.js/NestJS, có health endpoint và cấu hình Docker chạy được. Các module nghiệp vụ và Prisma schema sẽ được triển khai theo Sprint Backlog.

## Công nghệ dự kiến

| Thành phần | Công nghệ |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Quản lý state | TanStack Query, Zustand |
| Backend | NestJS, TypeScript, REST API |
| Database | PostgreSQL |
| ORM | Prisma |
| Xác thực | JWT, Passport, bcrypt |
| Validation | `class-validator` |
| Thanh toán | Mock Payment Gateway |
| DevOps | Docker Compose |

## Kiến trúc

Backend sử dụng modular monolith. Mỗi module tuân theo luồng:

```text
Controller -> Service -> Repository -> Prisma -> PostgreSQL
```

- **Controller**: nhận HTTP request, guard, DTO và HTTP response.
- **Service**: xử lý nghiệp vụ, state machine và điều phối transaction.
- **Repository**: truy cập PostgreSQL qua Prisma.
- **Mapper**: chuyển Prisma record sang Entity và Entity sang Response DTO.
- **DTO**: validate hợp đồng request/response.
- **Entity**: biểu diễn dữ liệu và enum nghiệp vụ trong module.

Mapper là helper thuần, không phải một tầng riêng; mapper không truy vấn database và không chứa business rule.

## Cây thư mục

```text
src/
├── app.module.ts                           // Root module tích hợp Config, Prisma, Auth, User
├── main.ts                                 // Entry point: Global Pipes, Filters, Interceptors, Swagger
│
├── config/                                 // [Backend Architect] Quản lý cấu hình & biến môi trường
│   ├── env.validation.ts                   // Kiểm tra tính hợp lệ của .env (JWT_SECRET, DATABASE_URL)
│   └── auth.config.ts                      // TTL tokens, bcrypt/argon rounds, cookie options
│
├── common/                                 // Tầng tài nguyên dùng chung xuyên suốt hệ thống
│   ├── constants/
│   │   ├── auth.constants.ts               // Metadata keys: IS_PUBLIC_KEY, PERMISSIONS_KEY, ROLES_KEY
│   │   └── error-codes.constants.ts        // Mã lỗi nghiệp vụ chuẩn hóa (E_UNAUTHORIZED, E_USER_NOT_FOUND)
│   │
│   ├── decorators/                         // [Identity Engineer] Bộ Decorators custom
│   │   ├── current-user.decorator.ts       // Trích xuất User Payload từ Request (sau khi qua Guard)
│   │   ├── public.decorator.ts             // Đánh dấu Endpoint công khai (bypass JwtAuthGuard)
│   │   ├── roles.decorator.ts              // Khai báo Role yêu cầu: @RequireRoles('ADMIN', 'MANAGER')
│   │   └── permissions.decorator.ts        // Khai báo Permission yêu cầu: @RequirePermissions('pos:checkout')
│   │
│   ├── guards/                             // [Identity Engineer] Chuỗi kiểm soát truy cập
│   │   ├── jwt-auth.guard.ts               // Kiểm tra Access Token (kiểm tra @Public() trước)
│   │   ├── roles.guard.ts                  // Kiểm tra Role-Based Access Control cấp cao
│   │   └── permissions.guard.ts            // Kiểm tra phân quyền chi tiết (Fine-grained RBAC)
│   │
│   ├── filters/                            // [API Platform] Chuẩn hóa lỗi trả về toàn hệ thống
│   │   └── http-exception.filter.ts        // Format: { success: false, statusCode, errorCode, message, timestamp }
│   │
│   ├── interceptors/                       // [API Platform] Chuẩn hóa dữ liệu đầu ra
│   │   └── transform-response.interceptor.ts // Format: { success: true, data: ..., meta: ... }
│   │
│   ├── pipes/                              // [API Platform]
│   │   └── validation.pipe.ts              // Tự động strip field thừa, validate type qua class-validator
│   │
│   └── prisma/                             // [Database Optimizer] Tầng kết nối cơ sở dữ liệu
│       ├── prisma.service.ts               // Quản lý Prisma Client, Connection Pool, Soft-delete middleware
│       └── prisma.module.ts                // Module toàn cục (@Global)
│
└── modules/
    ├── auth/                               // [Identity & Access Engineer] Module Xác thực & Cấp quyền
    │   ├── dto/
    │   │   ├── register.dto.ts             // DTO đăng ký tài khoản khách hàng / nội bộ
    │   │   ├── login.dto.ts                // DTO đăng nhập (email + password)
    │   │   ├── refresh-token.dto.ts        // DTO nhận refresh token để quay vòng
    │   │   ├── forgot-password.dto.ts      // DTO yêu cầu gửi link reset mật khẩu
    │   │   └── reset-password.dto.ts       // DTO đặt lại mật khẩu với Token một lần
    │   ├── interfaces/
    │   │   ├── token-payload.interface.ts  // Định dạng JWT Claims: { sub, email, roles, permissions }
    │   │   └── auth-response.interface.ts  // Cấu trúc trả về: { user, accessToken, refreshToken }
    │   ├── strategies/
    │   │   ├── jwt.strategy.ts             // Passport Strategy phân giải Bearer Access Token
    │   │   └── refresh-jwt.strategy.ts     // Passport Strategy kiểm tra Refresh Token
    │   ├── auth.controller.ts              // Endpoints: /auth/login, /register, /refresh, /logout
    │   ├── auth.service.ts                 // Logic băm Argon2id, ký JWT, Rotation & Reuse Detection
    │   └── auth.module.ts
    │
    └── user/                               // [Backend Architect & Database Optimizer] Module Quản lý User
        ├── dto/
        │   ├── create-user.dto.ts          // DTO tạo User mới (dành cho Admin)
        │   ├── update-user.dto.ts          // DTO cập nhật profile người dùng hiện tại
        │   ├── update-user-roles.dto.ts    // DTO gán/hủy Role của User
        │   └── query-user.dto.ts           // DTO lọc, tìm kiếm, phân trang người dùng
        ├── entities/
        │   └── user.entity.ts              // Class Transformer loại bỏ triệt để passwordHash
        ├── user.repository.ts              // Lớp trừu tượng truy vấn Database (ngăn Service phụ thuộc cứng vào Prisma)
        ├── user.controller.ts              // Endpoints: /users/me, /users (Admin CRUD)
        ├── user.service.ts                 // Business logic User, kích hoạt/khóa tài khoản
        └── user.module.ts
```

## Module backend

| Module | Trách nhiệm |
|---|---|
| `auth` | Đăng ký, đăng nhập và JWT |
| `users` | Tài khoản, vai trò và thông tin khách hàng |
| `catalog` | Sản phẩm, size, topping và giá niêm yết |
| `orders` | Tạo đơn, snapshot giá và state machine |
| `inventory` | Giữ, trừ, hoàn tồn kho và optimistic locking |
| `payments` | Payment attempt, idempotency và mock gateway |
| `promotions` | Coupon, điều kiện áp dụng và redemption |
| `loyalty` | Sổ giao dịch và số dư điểm thưởng |

## Chức năng MVP

- Hiển thị menu và chi tiết sản phẩm.
- Chọn size và topping.
- Thêm, sửa số lượng và xóa sản phẩm trong giỏ.
- Đăng ký, đăng nhập bằng JWT.
- Tạo đơn với giá được tính lại ở backend.
- Thanh toán Ví/Thẻ qua mock gateway.
- Chống xử lý thanh toán lặp bằng `Idempotency-Key`.
- Kiểm soát tồn kho khi nhiều khách đặt đồng thời.
- Áp dụng coupon và cộng điểm thưởng đúng một lần.
- Hiển thị xác nhận và lịch sử đơn hàng.

## Trạng thái đơn hàng

```text
PENDING -> PAID -> PREPARING -> READY -> COMPLETED
    |         |
    |         +-> CANCELLED
    +-> PAYMENT_FAILED -> PENDING
    +-> CANCELLED
```

Mọi chuyển trạng thái phải đi qua `OrderService` và được ghi vào lịch sử trạng thái. `COMPLETED` và `CANCELLED` là trạng thái kết thúc.

## Tài liệu

- [Mục lục tài liệu](./docs/README.md)
- [Phân tích đề bài](./docs/phan-tich-de-bai.md)
- [Kiến trúc hệ thống](./docs/architecture/system-architecture.md)
- [ERD](./docs/architecture/erd.md)
- [Đặc tả entity](./docs/architecture/entities.md)
- [Thiết kế cơ sở dữ liệu](./docs/architecture/database-design.md)
- [Đặc tả REST API](./docs/architecture/api-spec.md)
- [Thiết kế bảo mật](./docs/architecture/security.md)
- [Các quyết định kiến trúc](./docs/decisions/ADR-001-project-architecture.md)
- [Product Backlog](./docs/scrum/product-backlog.md)
- [Kế hoạch 3 Sprint](./docs/scrum/sprint-01.md)
- [Chiến lược kiểm thử](./docs/testing/test-strategy.md)

## Khởi chạy dự án

Chạy toàn bộ stack bằng:

```bash
cp .env.example .env
docker compose up --build
```

Kiểm tra trạng thái bằng `docker compose ps`. Frontend chạy tại `http://localhost:3000`, backend tại `http://localhost:3001/api/v1` và health endpoint là `http://localhost:3001/api/v1/health`.

## Quy ước phát triển

- Backend không tin giá, tổng tiền, user ID hoặc trạng thái do frontend gửi.
- Tiền lưu bằng số nguyên theo đơn vị VND; không dùng số thực.
- Thời gian lưu UTC bằng PostgreSQL `timestamptz`.
- Controller không gọi Prisma/Repository trực tiếp và không chứa business rule.
- Module khác chỉ gọi public Service, không truy cập Repository nội bộ.
- Transaction nhiều Repository được điều phối tại Service.
- Mapper không thực hiện I/O và không gọi Service/Repository.
- API thay đổi phải cập nhật DTO, OpenAPI và tài liệu liên quan.
- Migration được lưu trong source control; không sửa migration đã chạy trên môi trường chung.

## Kiểm thử bắt buộc cho nghiệp vụ nâng cao

- Chặn chuyển trạng thái đơn không hợp lệ.
- Hai request cùng `Idempotency-Key` chỉ tạo một kết quả thanh toán.
- Nhiều request tạo đơn đồng thời không làm tồn kho âm.
- Coupon không vượt giới hạn và điểm thưởng chỉ được cộng một lần trên mỗi đơn.

## Lộ trình triển khai

1. Scaffold monorepo, Next.js, NestJS và cấu hình dùng chung.
2. Tạo Prisma schema, migration và dữ liệu seed.
3. Xây dựng catalog API và giao diện menu.
4. Hoàn thiện giỏ hàng, auth và tạo đơn.
5. Thêm payment idempotency, state machine, inventory, coupon và loyalty.
6. Viết unit/integration/e2e test.
7. Hoàn thiện Docker Compose, README chạy thật và demo bàn giao.
