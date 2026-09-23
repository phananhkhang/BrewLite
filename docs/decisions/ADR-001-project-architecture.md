# ADR-001: Chọn modular monolith với Controller - Service - Repository

- Trạng thái: Chấp nhận
- Ngày: 2026-09-23

## Bối cảnh

BrewLite phải hoàn thành trong phạm vi học phần với Next.js, NestJS, PostgreSQL và Docker Compose. Nghiệp vụ có nhiều phần liên quan transaction (order, tồn kho, payment, coupon, loyalty), nhưng quy mô đội và tải chưa cần hạ tầng phân tán.

## Quyết định

- Frontend Next.js và backend NestJS là hai ứng dụng triển khai riêng trong monorepo.
- Backend là modular monolith, chia module `auth`, `users`, `catalog`, `orders`, `inventory`, `payments`, `promotions`, `loyalty`.
- Bên trong mỗi module áp dụng luồng `Controller -> Service -> Repository`.
- `controllers` xử lý HTTP và DTO; `services` chứa nghiệp vụ/transaction; `repositories` truy cập Prisma/PostgreSQL.
- `mappers` là helper thuần để chuyển Prisma record sang Entity và Entity sang Response DTO; mapper không phải một tầng mới và không được thực hiện I/O.
- Các module dùng chung một PostgreSQL nhưng module khác chỉ gọi public Service, không truy cập Repository nội bộ.

## Lý do

- Transaction xuyên order/inventory/payment/loyalty đơn giản và nhất quán.
- Ít chi phí vận hành hơn microservices, phù hợp Docker Compose và thời gian học phần.
- Ba lớp quen thuộc với NestJS, ít boilerplate và đủ rõ để test/phân công thành viên.

## Hệ quả

- Cần review để Controller không chứa nghiệp vụ và Service không trở thành lớp quá lớn.
- Transaction nhiều Repository phải do Service điều phối và truyền transaction client nhất quán.
- Một lỗi process có thể ảnh hưởng toàn API; phải có test và xử lý lỗi tốt.
- Scale chủ yếu theo toàn backend trong MVP.

## Phương án loại bỏ

- Microservices: quá nhiều network, deployment, observability và distributed transaction cho quy mô hiện tại.
- Clean Architecture bốn lớp đầy đủ: tốt cho hệ thống lớn nhưng tạo nhiều interface/mapper/boilerplate không cần thiết cho bài tập này.
- Backend chia layer toàn cục: dễ khiến một module nghiệp vụ bị rải ở nhiều thư mục và khó phân công theo feature.
