package com.example.datn.dto;

import lombok.Data;
import java.io.Serializable;

@Data
public class SanPhamDTO implements Serializable {
    private Integer id;

    private String xuatXu;

    private Integer idDanhMuc;
    private String tenDanhMuc;

    private String maSanPham;
    private String tenSanPham;
    private String moTa;
    private Integer trangThai;

    // Thêm trường này để FE nhận được giá của sản phẩm (lấy từ sản phẩm chi tiết)
    private Integer giaBan;
}