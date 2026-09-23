# Definition of Done

Một backlog item chỉ được đánh dấu **Done** khi thỏa tất cả tiêu chí áp dụng:

## Chất lượng mã nguồn

- Build, lint và type-check thành công.
- Không còn lỗi mức blocker/critical; không commit secret hoặc dữ liệu nhạy cảm.
- Tuân thủ ranh giới module và quy ước kiến trúc trong `docs/architecture`.
- Pull request đã được ít nhất một thành viên review; comment quan trọng đã xử lý.

## Kiểm thử

- Unit test cho business rule mới/sửa; integration test cho repository/transaction quan trọng.
- Test tự động chạy thành công trong CI.
- Luồng chấp nhận của user story được kiểm tra thủ công hoặc e2e.
- Với Task 10: có test transition sai, payment idempotent và concurrent stock.

## API và dữ liệu

- DTO validate input, response/error theo hợp đồng API.
- Migration có thể chạy từ database rỗng; seed vẫn chạy lặp an toàn.
- Không tin giá/user/status từ client; phân quyền và ownership đã kiểm tra.
- OpenAPI và tài liệu kiến trúc được cập nhật nếu hợp đồng thay đổi.

## Giao diện

- Có loading, empty, success và error state phù hợp.
- Responsive ở kích thước mobile/desktop mục tiêu; không có lỗi console nghiêm trọng.
- Nội dung cơ bản truy cập được bằng bàn phím và có nhãn cho control chính.

## Bàn giao

- Acceptance Criteria được Product Owner/đại diện nhóm nghiệm thu.
- README/hướng dẫn chạy được cập nhật.
- Docker Compose hoặc môi trường demo chạy được từ checkout sạch.
- Commit/PR mô tả rõ thay đổi và liên kết backlog item.
