package com.example.datn.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    // Thêm mã lỗi mới NV-KH.
    CCCD_EXISTED(1012, "CCCD đã tồn tại", HttpStatus.BAD_REQUEST),
    EMAIL_EXISTED(1013, "Email đã tồn tại", HttpStatus.BAD_REQUEST),
    PHONE_EXISTED(1014, "Số điện thoại đã tồn tại", HttpStatus.BAD_REQUEST),
    RESOURCE_NOT_FOUND(4040, "Tài nguyên không tồn tại", HttpStatus.NOT_FOUND),

    // General & User
    USER_EXISTED(1002, "User already existed", HttpStatus.INTERNAL_SERVER_ERROR),
    UNCATEGORIZED_EXCEPTION(9999, "UNCATEGORIZED_EXCEPTION", HttpStatus.BAD_REQUEST),
    USERNAME_INVALID(1003, "USERNAME MUST BE AT LEAST {min} characters", HttpStatus.BAD_REQUEST),
    PASSWORD_INVALID(1004, "PASSWORD MUST BE AT LEAST {min} characters", HttpStatus.BAD_REQUEST),
    VALIDATION_ERROR(1008, "VALIDATION_ERROR", HttpStatus.BAD_REQUEST),
    INVALID_DOB(1009, "Your must be at least {min}", HttpStatus.BAD_REQUEST),

    EMAIL_ALREADY_EXISTS(1019, "Email đã tồn tại ", HttpStatus.BAD_REQUEST),
    // Product/Customer/Order
    INSUFFICIENT_QUANTITY(1001, "Số lượng yêu cầu vượt quá số lượng tồn kho", HttpStatus.BAD_REQUEST),
    PRODUCT_NOT_FOUND(1010, "Sản phẩm không tồn tại", HttpStatus.BAD_REQUEST),
    CUSTOMER_NOT_FOUND(1011, "Khách hàng không tồn tại", HttpStatus.BAD_REQUEST),
    EMPLOYEE_NOT_FOUND(1011, "Nhân viên không tồn tại", HttpStatus.BAD_REQUEST),
    ORDER_NOT_FOUND(1005, "Hóa đơn không tồn tại", HttpStatus.NOT_FOUND),
    NO_STATUS_CHANGE(1006, "Trạng thái hóa đơn không thay đổi", HttpStatus.BAD_REQUEST),
    NO_PREVIOUS_STATUS(1006, "Không có trạng thái trước đó để thay đổi", HttpStatus.BAD_REQUEST),
    INVALID_STATUS_TRANSITION(1007, "Chuyển đổi trạng thái không hợp lệ", HttpStatus.BAD_REQUEST),
    ORDER_HAS_BEEN_CANCELLED(1008, "Đơn hàng đã hủy", HttpStatus.BAD_REQUEST),
    INVALID_STATUS(1009, "Trạng thái hóa đơn không đúng", HttpStatus.BAD_REQUEST),
    NOT_YET_PAID(1012, "Chưa thanh toán", HttpStatus.BAD_REQUEST),
    PAYMENT_METHOD_NOT_FOUND(1013, "Khong nó hình thưc thanh toán này", HttpStatus.BAD_REQUEST),

    NO_PAYMENT_HISTORY (1014, "Chưa có lịch sử thanh toán", HttpStatus.BAD_REQUEST),
    INVALID_QUANTITY (1015, "Số lượng tồn kho hết", HttpStatus.BAD_REQUEST),
    PHIEU_GIAM_GIA_HET_SO_LUONG (1016, "Số lượng phiếu giảm giá đã hết", HttpStatus.BAD_REQUEST),
    // Voucher/Discount (from sd_17)
    PHIEU_GIAM_GIA_NULL(2001, "Phiếu Giảm Giá Không Tồn tại", HttpStatus.NOT_FOUND),
    PHIEU_GIAM_GIA_KHACH_HANG_NOT_FOUND(2002, "Phiếu giảm giá khách hàng không tồn tại", HttpStatus.BAD_REQUEST),
    MAIL_ERROR(2003, "ERROR MAIL", HttpStatus.BAD_REQUEST),
    PHIEU_GIAM_GIA_KH_NULL(2002, "Không có phiếu gia giá nào", HttpStatus.NOT_FOUND),
    MA_PHIEU_GIAM_GIA_TON_TAI(2002, "Mã phiếu giảm giá tồn tại", HttpStatus.BAD_REQUEST),
    PHIEU_GIAM_GIA_DA_HET_HAN(400, "Phiếu giảm giá đã hết hạn", HttpStatus.BAD_REQUEST),
    ERROR_SEND_MAIL(400,"Lỗi gửi mail", HttpStatus.BAD_REQUEST),

    INVALID_QUANTITY_PGG(1015, "Số lượng PGG hết", HttpStatus.BAD_REQUEST),
    LICH_SU_HOA_DON_NOT_FOUND(400,"Lịch sử hóa đơn không tồn tại", HttpStatus.NOT_FOUND),
    THERE_ARE_NO_ORDERS_YET(1018, "Chưa có đơn hàng nào", HttpStatus.BAD_REQUEST), //
    THE_BRAND_ALREADY_EXISTS(1019, "Thương  hiệu đã tồn tại", HttpStatus.BAD_REQUEST),
    THE_DIRECTORY_ALREADY_EXISTS(1019, "Danh mục đã tồn tại", HttpStatus.BAD_REQUEST),
    THE_material_ALREADY_EXISTS(1020, "Chất liệu đã tồn tại", HttpStatus.BAD_REQUEST),
    THE_SIZE_ALREADY_EXISTS(1021, "Kích thước đã tồn tại", HttpStatus.BAD_REQUEST),
    THE_COLOR_ALREADY_EXISTS(1022, "Màu sắc đã tồn tại", HttpStatus.BAD_REQUEST),
    TAY_AO_ALREADY_EXISTS(1023, "Tay áo đã tồn tại", HttpStatus.BAD_REQUEST),
    CO_AO_ALREADY_EXISTS(1023, "Cổ áo đã tồn tại", HttpStatus.BAD_REQUEST),
    PHIEU_GIAM_GIA_EXISTS(400,"Tên phiếu giảm giá đã tồn tại", HttpStatus.BAD_REQUEST),


    CHATLIEU_NAME_EMPTY(3001, "Tên chất liệu không được để trống!", HttpStatus.BAD_REQUEST),
    CHATLIEU_NAME_TOO_LONG(3002, "Tên chất liệu không được vượt quá %d ký tự!", HttpStatus.BAD_REQUEST),
    CHATLIEU_NAME_DUPLICATE(3003, "Tên chất liệu đã tồn tại!", HttpStatus.BAD_REQUEST),
    CHATLIEU_NOT_FOUND(3004, "Chất liệu không tồn tại!", HttpStatus.NOT_FOUND),

    DANHMUC_NAME_EMPTY(3001, "Tên danh mục không được để trống!", HttpStatus.BAD_REQUEST),
    DANHMUC_NAME_TOO_LONG(3002, "Tên danh mục không được vượt quá %d ký tự!", HttpStatus.BAD_REQUEST),
    DANHMUC_NAME_DUPLICATE(3003, "Tên danh mục đã tồn tại!", HttpStatus.BAD_REQUEST),
    DANHMUC_NOT_FOUND(3004, "Danh mục không tồn tại!", HttpStatus.NOT_FOUND),

    COAO_NAME_EMPTY(3001, "Tên cổ áo  không được để trống!", HttpStatus.BAD_REQUEST),
    COAO_NAME_TOO_LONG(3002, "Tên cổ áo không được vượt quá %d ký tự!", HttpStatus.BAD_REQUEST),
    COAO_NAME_DUPLICATE(3003, "Tên cổ áo đã tồn tại!", HttpStatus.BAD_REQUEST),
    COAO_NOT_FOUND(3004, "Cổ áo không tồn tại!", HttpStatus.NOT_FOUND),

    KICHCO_NAME_EMPTY(3001, "Tên kích cỡ  không được để trống!", HttpStatus.BAD_REQUEST),
    KICHCO_NAME_TOO_LONG(3002, "Tên kích cỡ không được vượt quá %d ký tự!", HttpStatus.BAD_REQUEST),
    KICHCO_NAME_DUPLICATE(3003, "Tên kích cỡ đã tồn tại!", HttpStatus.BAD_REQUEST),
    KICHCO_NOT_FOUND(3004, "Kích cỡ không tồn tại!", HttpStatus.NOT_FOUND),

    TAYAO_NAME_EMPTY(3001, "Tên tay áo không được để trống!", HttpStatus.BAD_REQUEST),
    TAYAO_NAME_TOO_LONG(3002, "Tên tay áo không được vượt quá %d ký tự!", HttpStatus.BAD_REQUEST),
    TAYAO_NAME_DUPLICATE(3003, "Tên tay áo đã tồn tại!", HttpStatus.BAD_REQUEST),
    TAYAO_NOT_FOUND(3004, "Tay áo không tồn tại!", HttpStatus.NOT_FOUND),

    THUONGHIEU_NAME_EMPTY(3001, "Tên thương hiệu không được để trống!", HttpStatus.BAD_REQUEST),
    THUONGHIEU_NAME_TOO_LONG(3002, "Tên thương hiệu không được vượt quá %d ký tự!", HttpStatus.BAD_REQUEST),
    THUONGHIEU_NAME_DUPLICATE(3003, "Tên thương hiệu đã tồn tại!", HttpStatus.BAD_REQUEST),
    THUONGHIEU_NOT_FOUND(3004, "Thương hiệu không tồn tại!", HttpStatus.NOT_FOUND),


    SANPHAM_NAME_EMPTY(3001, "Tên sản phẩm không được để trống!", HttpStatus.BAD_REQUEST),
    SANPHAM_NAME_TOO_LONG(3002, "Tên sản phẩm không được vượt quá %d ký tự!", HttpStatus.BAD_REQUEST),
    SANPHAM_NAME_DUPLICATE(3003, "Tên sản phẩm đã tồn tại!", HttpStatus.BAD_REQUEST),
    SANPHAM_NOT_FOUND(3004, "Sản phẩm không tồn tại!", HttpStatus.NOT_FOUND),

    MAUSAC_NAME_EMPTY(3001, "Tên màu sắc không được để trống!", HttpStatus.BAD_REQUEST),
    MAUSAC_NAME_TOO_LONG(3002, "Tên màu sắc không được vượt quá %d ký tự!", HttpStatus.BAD_REQUEST),
    MAUSAC_NAME_DUPLICATE(3003, "Tên màu sắc đã tồn tại!", HttpStatus.BAD_REQUEST),
    MAUSAC_NOT_FOUND(3004, "Màu sắc không tồn tại!", HttpStatus.NOT_FOUND);



    private final int errorCode;
    private final String errorMessage;
    private final HttpStatus httpStatus;

    ErrorCode(int errorCode, String errorMessage, HttpStatus httpStatus) {
        this.errorCode = errorCode;
        this.errorMessage = errorMessage;
        this.httpStatus = httpStatus;
    }

    // Overload for enums without errorCode (for compatibility)
    ErrorCode(HttpStatus status, String message) {
        this.errorCode = -1;
        this.errorMessage = message;
        this.httpStatus = status;
    }

    public String getErrorMessage(Object... args) {
        return String.format(errorMessage, args);
    }
}