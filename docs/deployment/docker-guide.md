# Hướng dẫn Docker cho BrewLite

> Repository hiện chưa có mã nguồn và `docker-compose.yml`. Tài liệu này là hợp đồng triển khai để nhóm hiện thực ở Task 1 và hoàn thiện ở Task 9.

## 1. Topology

```mermaid
flowchart LR
    Browser -->|localhost:3000| Frontend[frontend / Next.js]
    Frontend -->|server-side: http://backend:3001| Backend[backend / NestJS]
    Browser -->|client-side: localhost:3001/api/v1| Backend
    Backend -->|postgresql://postgres:5432/brewlite| DB[(postgres / PostgreSQL)]
```

| Service | Port host | Healthcheck | Phụ thuộc |
|---|---:|---|---|
| `frontend` | 3000 | HTTP `/` hoặc `/health` | `backend` healthy |
| `backend` | 3001 | HTTP `/api/v1/health` | `postgres` healthy + migration |
| `postgres` | chỉ mở 5432 khi dev cần | `pg_isready` | volume dữ liệu |

Trong production không công khai trực tiếp PostgreSQL. Reverse proxy/TLS termination nằm ngoài phạm vi MVP.

## 2. Biến môi trường tối thiểu

`.env.example` chỉ chứa tên biến và giá trị local không nhạy cảm:

```dotenv
NODE_ENV=development
WEB_PORT=3000
API_PORT=3001
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
DATABASE_URL=postgresql://brewlite:change-me@postgres:5432/brewlite
JWT_ISSUER=brewlite-api
JWT_AUDIENCE=brewlite-web
JWT_ACCESS_SECRET=replace-with-a-long-random-secret
JWT_ACCESS_TTL=15m
MOCK_PAYMENT_MODE=deterministic
ORDER_RESERVATION_TTL_MINUTES=15
```

Không commit file `.env` thật. Secret cho môi trường chia sẻ phải cấp qua CI/secret store.

## 3. Quy trình khởi động dự kiến

Sau khi nhóm tạo Compose:

```bash
docker compose up --build
docker compose exec backend npm run prisma:migrate:deploy
docker compose exec backend npm run prisma:seed
```

Có thể dùng container migration one-shot thay vì chạy tay. Backend chỉ nhận traffic sau khi migration thành công; không để nhiều replica đồng thời chạy migration dev.

## 4. Yêu cầu cho Dockerfile

- Multi-stage build; image runtime không chứa dev dependency nếu không cần.
- Chạy bằng user không phải root.
- Pin major/minor base image phù hợp, không dùng tag `latest`.
- Copy lockfile và dùng install frozen/locked.
- Không bake `.env`, secret hoặc credential vào image.
- Có `.dockerignore` loại `node_modules`, `.git`, log, coverage và file môi trường.
- Healthcheck phản ánh readiness: backend kiểm tra kết nối database, frontend kiểm tra process phục vụ request.

## 5. Dữ liệu và migration

- PostgreSQL dùng named volume trong local để giữ dữ liệu qua lần restart.
- `docker compose down` không xóa volume; chỉ `down -v` khi chủ động reset dữ liệu local.
- Migration nằm trong source control và chạy từ database rỗng trong CI.
- Seed dùng upsert để chạy lặp an toàn.

## 6. Kiểm tra bàn giao Task 9

1. Clone repository mới và copy `.env.example` thành `.env`.
2. Chạy một lệnh `docker compose up --build` hoặc theo đúng README.
3. Healthcheck của ba service đạt trạng thái healthy.
4. Migration/seed thành công từ volume rỗng.
5. Demo end-to-end: menu -> register/login -> order -> payment -> history.
6. Restart stack; order đã tạo vẫn tồn tại.
7. Log không chứa password, JWT, connection string hay payment token.

## 7. Xử lý sự cố cơ bản

- Backend không kết nối DB: kiểm tra hostname trong container phải là `postgres`, không phải `localhost`.
- Frontend SSR không gọi được API: dùng URL nội bộ `http://backend:3001`; code chạy trong browser dùng URL public.
- Schema thiếu: kiểm tra migration container/command đã hoàn tất trước backend readiness.
- Port bận: đổi port phía host, giữ nguyên port mạng nội bộ Compose.
