# BrewLite Web

Frontend BrewLite sử dụng Next.js App Router, React, TypeScript và Tailwind CSS.

## Chạy local

```bash
npm ci
npm run dev
```

Ứng dụng chạy tại `http://localhost:3000`. Khi chạy ngoài Docker, tạo `apps/web/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
API_INTERNAL_URL=http://localhost:3001/api/v1
```

`NEXT_PUBLIC_API_URL` được đóng vào client bundle tại thời điểm build. Khi build Docker cho môi trường khác, truyền biến này qua build argument.

## Kiểm tra

```bash
npm run lint
npm run typecheck
npm run build
```

Build production dùng `output: "standalone"` để Docker image chỉ chứa các file runtime cần thiết.

