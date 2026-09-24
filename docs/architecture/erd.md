# ERD BrewLite

## 1. Sơ đồ quan hệ

```mermaid
erDiagram
    USER ||--o{ ORDER : dat
    USER o|--o{ ORDER_STATUS_HISTORY : thay_doi
    USER ||--o{ LOYALTY_TRANSACTION : co

    PRODUCT ||--|{ PRODUCT_VARIANT : co
    PRODUCT ||--o{ PRODUCT_TOPPING : cho_phep
    TOPPING ||--o{ PRODUCT_TOPPING : duoc_gan

    ORDER ||--|{ ORDER_ITEM : gom
    PRODUCT_VARIANT ||--o{ ORDER_ITEM : duoc_chon
    ORDER_ITEM ||--o{ ORDER_ITEM_TOPPING : co
    TOPPING ||--o{ ORDER_ITEM_TOPPING : duoc_chon

    ORDER ||--o{ PAYMENT : thu_thanh_toan
    ORDER ||--|{ ORDER_STATUS_HISTORY : ghi_nhan
    ORDER ||--|{ INVENTORY_RESERVATION : giu_ton
    PRODUCT_VARIANT ||--o{ INVENTORY_RESERVATION : bi_giu

    COUPON ||--o{ COUPON_REDEMPTION : duoc_dung
    USER ||--o{ COUPON_REDEMPTION : su_dung
    ORDER ||--o| COUPON_REDEMPTION : ap_dung
    ORDER ||--o{ LOYALTY_TRANSACTION : phat_sinh

    USER {
        uuid id PK
        citext email UK
        string password_hash
        enum role
        int loyalty_balance
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    PRODUCT {
        uuid id PK
        string sku UK
        string name
        string description
        bigint base_price
        string image_url
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    PRODUCT_VARIANT {
        uuid id PK
        uuid product_id FK
        enum size
        bigint price_delta
        int stock
        int version
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    TOPPING {
        uuid id PK
        string code UK
        string name
        bigint price
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    PRODUCT_TOPPING {
        uuid product_id PK,FK
        uuid topping_id PK,FK
    }

    ORDER {
        uuid id PK
        string order_number UK
        uuid user_id FK
        enum status
        bigint subtotal
        bigint discount_amount
        bigint total
        string currency
        string coupon_code_snapshot
        timestamptz reservation_expires_at
        timestamptz created_at
        timestamptz updated_at
    }

    ORDER_ITEM {
        uuid id PK
        uuid order_id FK
        uuid product_variant_id FK
        string product_name_snapshot
        string variant_name_snapshot
        bigint unit_price
        int quantity
        bigint line_total
    }

    ORDER_ITEM_TOPPING {
        uuid id PK
        uuid order_item_id FK
        uuid topping_id FK
        string topping_name_snapshot
        bigint unit_price
        int quantity
        bigint line_total
    }

    PAYMENT {
        uuid id PK
        uuid order_id FK
        string idempotency_key UK
        string request_hash
        enum method
        enum status
        bigint amount
        string gateway_transaction_id UK
        string failure_code
        timestamptz processed_at
        timestamptz created_at
        timestamptz updated_at
    }

    ORDER_STATUS_HISTORY {
        uuid id PK
        uuid order_id FK
        enum from_status
        enum to_status
        uuid changed_by_user_id FK
        string reason
        timestamptz created_at
    }

    INVENTORY_RESERVATION {
        uuid id PK
        uuid order_id FK
        uuid product_variant_id FK
        int quantity
        enum status
        timestamptz expires_at
        timestamptz created_at
        timestamptz updated_at
    }

    COUPON {
        uuid id PK
        string code UK
        enum discount_type
        bigint discount_value
        bigint max_discount
        bigint min_order_value
        int usage_limit
        int per_user_limit
        timestamptz starts_at
        timestamptz ends_at
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    COUPON_REDEMPTION {
        uuid id PK
        uuid coupon_id FK
        uuid user_id FK
        uuid order_id FK,UK
        bigint discount_amount
        enum status
        timestamptz expires_at
        timestamptz consumed_at
        timestamptz released_at
        timestamptz created_at
        timestamptz updated_at
    }

    LOYALTY_TRANSACTION {
        uuid id PK
        uuid user_id FK
        uuid order_id FK
        enum type
        int points
        int balance_after
        string reason
        timestamptz created_at
    }
```

## 2. Cardinality và tính bắt buộc

| Quan hệ | Diễn giải |
|---|---|
| User 1 - N Order | Mỗi đơn thuộc đúng một user; user có thể chưa có đơn |
| Product 1 - N ProductVariant | Sản phẩm phải có ít nhất một size/variant khả dụng |
| Product N - N Topping | Bảng nối giới hạn topping hợp lệ theo từng sản phẩm |
| Order 1 - N OrderItem | Không cho phép order rỗng |
| OrderItem 1 - N OrderItemTopping | Topping là tùy chọn |
| Order 1 - N Payment | Một đơn có thể thất bại rồi thử thanh toán lại |
| Order 1 - N OrderStatusHistory | Mọi lần đổi trạng thái đều phải có audit record |
| User 0..1 - N OrderStatusHistory | Người thao tác có thể được ghi nhận; null nếu transition do hệ thống/payment |
| Order 1 - N InventoryReservation | Một reservation cho mỗi variant trong đơn |
| Order 0..1 - 1 CouponRedemption | Mỗi đơn dùng tối đa một coupon |
| User/Order 1 - N LoyaltyTransaction | Ledger bảo toàn lịch sử cộng/trừ điểm |

## 3. Vì sao mô hình lớn hơn 5 entity tối thiểu

Năm entity trong đề bài đủ để demo luồng đơn giản nhưng chưa đủ chứng minh Task 10:

- `ProductVariant` biểu diễn size, giá và tồn kho độc lập.
- `OrderItemTopping` lưu nhiều topping và snapshot giá tại thời điểm mua.
- `OrderStatusHistory` chứng minh transition và hỗ trợ audit.
- `InventoryReservation` cho biết lượng tồn đang giữ/đã tiêu thụ/đã hoàn.
- `CouponRedemption` giữ lượt coupon khi order còn chờ thanh toán và chỉ chuyển `CONSUMED` sau khi trả tiền thành công; hủy/hết hạn sẽ giải phóng lượt.
- `LoyaltyTransaction` giúp cộng điểm đúng một lần và truy vết được.
- Nhiều `Payment` cho một order biểu diễn đúng các lần thử thanh toán.

## 4. Snapshot và tham chiếu

`OrderItem` vẫn giữ FK tới `ProductVariant` để truy vết, đồng thời lưu tên/giá snapshot. Khi sản phẩm đổi tên, thay giá hoặc ngừng bán, hóa đơn cũ vẫn giữ nguyên nội dung. Tương tự, `coupon_code_snapshot` và `discount_amount` trên order bảo toàn kết quả tính tiền ngay cả khi coupon được chỉnh sửa về sau.

## 5. Ràng buộc không thể hiện hết trên ERD

- Unique `(product_id, size)` trên `product_variant`.
- Unique `(product_id, topping_id)` trên `product_topping`.
- Unique `(order_id, product_variant_id)` trên `inventory_reservation`.
- Unique `(order_id, type)` cho loyalty type `EARN` để chống cộng điểm lặp.
- `coupon_redemption.status` chỉ cho `RESERVED | CONSUMED | RELEASED | EXPIRED`; `order_id` unique.
- Partial unique index chỉ cho một payment `SUCCEEDED` trên mỗi order.
- Check `stock >= 0`, `quantity > 0`, mọi giá trị tiền `>= 0`.
- Check `subtotal - discount_amount = total` và `currency = 'VND'` trong MVP.
- `from_status` có thể null ở bản ghi lịch sử đầu tiên; `to_status` không null.

Chi tiết cột, enum và vòng đời nằm trong [đặc tả entity](./entities.md) và [thiết kế cơ sở dữ liệu](./database-design.md).
