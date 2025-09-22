package com.example.datn.vo.coAoVO;

import jakarta.validation.constraints.Size;
import lombok.Data;
import java.io.Serializable;

@Data
public class CoAoVO implements Serializable {
    private static final long serialVersionUID = 1L;

    // Không cần id khi thêm mới (id tự sinh)
    private String ma;
    @Size(max = 255, message = "Tên màu sắc không được vượt quá 255 ký tự")
    private String tenCoAo;
    private Integer trangThai; // Bổ sung trường trạng thái
}