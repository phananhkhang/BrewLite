# Tài liệu dự án BrewLite

Thư mục này mô tả kiến trúc đích của BrewLite dựa trên đề bài phiên bản 1.0. Hiện repository chưa có mã nguồn triển khai, vì vậy tài liệu là đường cơ sở để nhóm thống nhất cách xây dựng trước khi lập trình.

## Lộ trình đọc

1. [Phân tích đề bài](./phan-tich-de-bai.md): phạm vi MVP, yêu cầu, giả định và truy vết 10 task.
2. [Kiến trúc hệ thống](./architecture/system-architecture.md): kiến trúc tổng thể, module, luồng chính và quy tắc phụ thuộc.
3. [ERD](./architecture/erd.md): sơ đồ quan hệ dữ liệu và các quyết định mô hình hóa.
4. [Đặc tả entity](./architecture/entities.md): thuộc tính, enum, khóa và quy tắc của từng thực thể.
5. [Thiết kế cơ sở dữ liệu](./architecture/database-design.md): ràng buộc, index, transaction và chiến lược tồn kho.
6. [Đặc tả REST API](./architecture/api-spec.md): hợp đồng API tối thiểu và API hỗ trợ Task 10.
7. [Thiết kế bảo mật](./architecture/security.md): xác thực, phân quyền và biện pháp bảo vệ API.
8. [Các quyết định kiến trúc](./decisions/ADR-001-project-architecture.md): ADR giải thích các lựa chọn chính.
9. [Hướng dẫn Docker](./deployment/docker-guide.md): topology chạy local và nguyên tắc cấu hình.
10. [Tài liệu Scrum](./scrum/product-backlog.md): backlog, user story và Definition of Done.

## Quy ước chung

- Số tiền dùng đơn vị đồng Việt Nam và lưu bằng số nguyên, không dùng số thực.
- Thời gian lưu theo UTC bằng `timestamptz`; giao diện chuyển sang múi giờ người dùng.
- ID dùng UUID để không lộ số lượng bản ghi và thuận tiện khi tách dịch vụ về sau.
- Tên bảng/cột trong PostgreSQL dùng `snake_case`; tên model TypeScript dùng `PascalCase`/`camelCase`.
- Backend luôn tính lại giá, khuyến mãi và tổng tiền; không tin dữ liệu giá từ frontend.
- Mermaid trong tài liệu là nguồn sơ đồ có thể version-control cùng mã nguồn.

## Phạm vi tài liệu

Kiến trúc này bao phủ luồng: xem menu -> chọn size/topping -> giỏ hàng -> đăng nhập -> tạo đơn -> thanh toán giả lập -> xác nhận/lịch sử đơn. Chức năng vận hành Barista/Admin được mô hình hóa ở mức API và phân quyền để hỗ trợ state machine, nhưng UI quản trị không thuộc MVP bắt buộc.
