package com.example.datn.vo.thuongHieuVO;

import jakarta.validation.constraints.Size;
import lombok.Data;
import java.io.Serializable;

@Data
public class ThuongHieuVO implements Serializable {
    private static final long serialVersionUID = 1L;

    private String maThuongHieu;
    @Size(max = 255, message = "Tên thương hiệu không được vượt quá 255 ký tự")
    private String tenThuongHieu;
    private Integer trangThai;
}