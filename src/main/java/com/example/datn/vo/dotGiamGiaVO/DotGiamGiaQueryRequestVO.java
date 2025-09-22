package com.example.datn.vo.dotGiamGiaVO;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalDateTime;
@Data
public class DotGiamGiaQueryRequestVO implements Serializable {
    private static final long serialVersionUID = 1L;
    private Integer id;
    private Integer page;
    private Integer size;

    private String maDotGiamGia;

    private String tenDotGiamGia;

    private Integer phanTramGiamGia;

    private LocalDate ngayBatDau;

    private LocalDate ngayKetThuc;

    private LocalDateTime ngayTao;

    private LocalDateTime ngaySua;

    private String moTa;

    private Integer trangThai;

    public void setTenDotGiamGia(String tenDotGiamGia) {
        this.tenDotGiamGia = tenDotGiamGia;
    }

    public Integer getPage() {
        return page;
    }

    public void setPage(Integer page) {
        this.page = page;
    }

    public Integer getSize() {
        return size;
    }

    public void setSize(Integer size) {
        this.size = size;
    }
}
