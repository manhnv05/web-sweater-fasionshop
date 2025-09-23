package com.example.datn.vo.sanPham;

import lombok.Data;
import java.io.Serializable;

@Data
public class SanPhamQueryVO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Integer id;
    private String xuatXu;
    private Integer idDanhMuc;
    private String maSanPham;
    private String tenSanPham;
    private String moTa;
    private Integer trangThai;

    private Integer page;
    private Integer size;
}