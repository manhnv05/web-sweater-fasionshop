package com.example.datn.vo.mauSacVO;

import jakarta.validation.constraints.Size;
import lombok.Data;
import java.io.Serializable;

@Data
public class MauSacVO implements Serializable {
    private static final long serialVersionUID = 1L;

    // Không cần id khi thêm mới, id sẽ tự sinh
    @Size(max = 255, message = "Tên màu sắc không được vượt quá 255 ký tự")
    private String tenMauSac;
    private String maMau;
    private Integer trangThai;
}