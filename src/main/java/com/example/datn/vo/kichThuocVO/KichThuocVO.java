package com.example.datn.vo.kichThuocVO;

import jakarta.validation.constraints.Size;
import lombok.Data;
import java.io.Serializable;

@Data
public class KichThuocVO implements Serializable {
    private static final long serialVersionUID = 1L;

    // Không cần id khi thêm mới, id sẽ tự sinh
    private String ma;
    @Size(max = 255, message = "Tên kích thước không được vượt quá 255 ký tự")
    private String tenKichCo;
    private Integer trangThai;
}