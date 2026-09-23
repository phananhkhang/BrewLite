# ADR-002: Chọn PostgreSQL và Prisma

- Trạng thái: Chấp nhận
- Ngày: 2026-09-23

## Bối cảnh

Dữ liệu BrewLite có quan hệ chặt, nhiều unique/check constraint và cần transaction để không bán quá tồn, không thanh toán/cộng điểm lặp.

## Quyết định

- PostgreSQL là database giao dịch.
- Prisma là ORM, migration và client truy cập dữ liệu.
- Các khả năng PostgreSQL chưa biểu diễn trực tiếp trong Prisma, như partial unique index, được thêm bằng SQL trong migration.
- Tiền lưu `BIGINT` theo VND; thời gian dùng `timestamptz`; khóa chính dùng UUID.

## Lý do

- ACID transaction và constraint mạnh phù hợp order/payment/inventory.
- PostgreSQL hỗ trợ index có điều kiện, locking và truy vấn đủ cho Task 10.
- Prisma có type safety tốt trong hệ sinh thái TypeScript và dễ seed/migrate trong bài tập.

## Hệ quả

- Đội phải hiểu transaction, isolation, unique conflict và migration; ORM không thay thế kiến thức database.
- Một số index/check nâng cao cần migration SQL thủ công và integration test.
- Không dựa vào cascade delete cho dữ liệu giao dịch.

## Phương án loại bỏ

- Dữ liệu mẫu chỉ trong bộ nhớ: không chứng minh được transaction/concurrency.
- MongoDB: mô hình aggregate có thể dùng được, nhưng quan hệ và constraint của đề bài phù hợp relational hơn.
- TypeORM: hợp lệ theo đề bài, nhưng nhóm thống nhất Prisma để giảm hai cách truy cập dữ liệu.
