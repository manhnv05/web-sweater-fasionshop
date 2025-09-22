package com.example.datn.vo.danhMucVO;

import jakarta.validation.constraints.Size;
import lombok.Data;
import java.io.Serializable;

@Data
public class DanhMucVO implements Serializable {
    private static final long serialVersionUID = 1L;

    // Không cần id vì VO dùng cho thêm mới, id tự sinh
    private String maDanhMuc;
    @Size(max = 255, message = "Tên chất liệu không được vượt quá 255 ký tự")
    private String tenDanhMuc;
    private Integer trangThai;
}