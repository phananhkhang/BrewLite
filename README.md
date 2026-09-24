# BrewLite

BrewLite là ứng dụng web đặt đồ uống và thanh toán không tiền mặt, được xây dựng cho bài tập lớn môn Công nghệ Phần mềm. Sản phẩm hướng tới luồng đặt món nhanh tại quầy: xem menu, chọn size/topping, quản lý giỏ hàng, đăng nhập, tạo đơn, thanh toán và theo dõi trạng thái.

> Trạng thái hiện tại: đã hoàn thành tài liệu kiến trúc, cây thư mục, `.gitignore` và `.env.example`; chưa scaffold mã nguồn Next.js/NestJS nên dự án chưa thể chạy.

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
BrewLite/
├─ apps/
│  ├─ web/                         # Ứng dụng Next.js
│  │  ├─ public/
│  │  ├─ src/
│  │  │  ├─ app/                   # Route, layout, page
│  │  │  ├─ components/            # UI dùng chung
│  │  │  ├─ features/              # auth, cart, catalog, checkout, orders
│  │  │  ├─ lib/                   # API client, auth, query client
│  │  │  └─ stores/                # Zustand stores
│  │  └─ tests/
│  └─ api/                         # Ứng dụng NestJS
│     ├─ prisma/
│     │  └─ migrations/
│     ├─ src/
│     │  ├─ common/                # Guard, filter, interceptor, pipe, error
│     │  ├─ config/
│     │  ├─ database/              # PrismaModule/PrismaService, transaction utility
│     │  └─ modules/
│     │     └─ <module>/
│     │        ├─ controllers/
│     │        ├─ services/
│     │        ├─ repositories/
│     │        ├─ mappers/
│     │        ├─ dto/
│     │        └─ entities/
│     │
│     │     # Riêng payments có gateways/, inventory có jobs/ khi triển khai
│     └─ test/
├─ packages/
│  ├─ contracts/                   # Contract/type dùng chung
│  ├─ eslint-config/
│  └─ tsconfig/
├─ tests/e2e/
├─ scripts/
└─ docs/
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

Phần mã nguồn và cấu hình chạy chưa được scaffold. Sau khi hoàn thành Task 1, quy trình dự kiến là:

```bash
cp .env.example .env
docker compose up --build
```

Các lệnh chính thức phải được cập nhật tại đây ngay khi `package.json`, Dockerfile và `docker-compose.yml` được tạo. Không xem các lệnh trên là đã khả dụng ở trạng thái hiện tại.

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
