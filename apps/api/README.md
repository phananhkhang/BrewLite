# BrewLite API

Backend BrewLite sử dụng NestJS, TypeScript và REST API với global prefix `/api/v1`.

## Chạy local

```bash
npm ci
npm run start:dev
```

API chạy tại `http://localhost:3001`; readiness endpoint hiện tại là `GET /api/v1/health`.

Các biến môi trường chính:

```dotenv
PORT=3001
WEB_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://brewlite:change_me_local_only@localhost:5432/brewlite?schema=public
```

`WEB_ORIGIN` chấp nhận nhiều origin phân tách bằng dấu phẩy.

## Kiểm tra

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

Prisma chưa được cài ở giai đoạn scaffold hiện tại. Khi thêm Prisma schema, cần bổ sung script generate/migrate và migration service vào Compose.

