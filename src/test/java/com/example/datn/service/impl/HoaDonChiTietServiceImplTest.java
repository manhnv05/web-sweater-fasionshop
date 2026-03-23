package com.example.datn.service.impl;

import com.example.datn.dto.HoaDonChiTietDTO;
import com.example.datn.entity.*;
import com.example.datn.repository.HoaDonChiTietRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class HoaDonChiTietServiceImplTest {

    @Mock
    private HoaDonChiTietRepository hoaDonChiTietRepository;

    @InjectMocks
    private HoaDonChiTietServiceImpl hoaDonChiTietService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    /**
     * Bug fix: getHinhAnh() could return null causing NPE.
     * Verify that null hinhAnh is handled gracefully.
     */
    @Test
    void getHoaDonChiTiet_shouldNotThrowWhenHinhAnhIsNull() {
        SpctHinhAnh spctHinhAnh = new SpctHinhAnh();
        spctHinhAnh.setId(1);
        spctHinhAnh.setHinhAnh(null); // hinhAnh is null - should not cause NPE

        MauSac mauSac = new MauSac();
        mauSac.setTenMauSac("Đỏ");

        KichThuoc kichThuoc = new KichThuoc();
        kichThuoc.setTenKichCo("L");

        SanPham sanPham = new SanPham();
        sanPham.setTenSanPham("Áo sweater");

        ChiTietSanPham ctsp = new ChiTietSanPham();
        ctsp.setId(1);
        ctsp.setMaSanPhamChiTiet("SP001-L-RED");
        ctsp.setSanPham(sanPham);
        ctsp.setMauSac(mauSac);
        ctsp.setKichThuoc(kichThuoc);
        ctsp.setSpctHinhAnhs(List.of(spctHinhAnh));

        HoaDonChiTiet hdct = new HoaDonChiTiet();
        hdct.setId(1);
        hdct.setSanPhamChiTiet(ctsp);
        hdct.setSoLuong(2);
        hdct.setGia(150000);
        hdct.setThanhTien(300000);

        when(hoaDonChiTietRepository.findByHoaDonMaHoaDon("HD001"))
                .thenReturn(List.of(hdct));

        List<HoaDonChiTietDTO> result = assertDoesNotThrow(
                () -> hoaDonChiTietService.getHoaDonChiTiet("HD001"),
                "Không được ném ngoại lệ khi hinhAnh là null"
        );

        assertEquals(1, result.size());
        assertNull(result.get(0).getDuongDanAnh(), "duongDanAnh phải là null khi hinhAnh là null");
    }

    @Test
    void getHoaDonChiTiet_shouldReturnImageUrlWhenHinhAnhExists() {
        HinhAnh hinhAnh = new HinhAnh();
        hinhAnh.setId(1);
        hinhAnh.setDuongDanAnh("https://example.com/img.jpg");

        SpctHinhAnh spctHinhAnh = new SpctHinhAnh();
        spctHinhAnh.setId(1);
        spctHinhAnh.setHinhAnh(hinhAnh);

        MauSac mauSac = new MauSac();
        mauSac.setTenMauSac("Xanh");

        KichThuoc kichThuoc = new KichThuoc();
        kichThuoc.setTenKichCo("M");

        SanPham sanPham = new SanPham();
        sanPham.setTenSanPham("Áo sweater xanh");

        ChiTietSanPham ctsp = new ChiTietSanPham();
        ctsp.setId(2);
        ctsp.setMaSanPhamChiTiet("SP002-M-BLUE");
        ctsp.setSanPham(sanPham);
        ctsp.setMauSac(mauSac);
        ctsp.setKichThuoc(kichThuoc);
        ctsp.setSpctHinhAnhs(List.of(spctHinhAnh));

        HoaDonChiTiet hdct = new HoaDonChiTiet();
        hdct.setId(2);
        hdct.setSanPhamChiTiet(ctsp);
        hdct.setSoLuong(1);
        hdct.setGia(200000);
        hdct.setThanhTien(200000);

        when(hoaDonChiTietRepository.findByHoaDonMaHoaDon("HD002"))
                .thenReturn(List.of(hdct));

        List<HoaDonChiTietDTO> result = hoaDonChiTietService.getHoaDonChiTiet("HD002");

        assertEquals(1, result.size());
        assertEquals("https://example.com/img.jpg", result.get(0).getDuongDanAnh(),
                "duongDanAnh phải lấy đúng đường dẫn ảnh");
    }

    @Test
    void getHoaDonChiTiet_shouldReturnEmptyListWhenNoItems() {
        when(hoaDonChiTietRepository.findByHoaDonMaHoaDon("HD999"))
                .thenReturn(List.of());

        List<HoaDonChiTietDTO> result = hoaDonChiTietService.getHoaDonChiTiet("HD999");

        assertNotNull(result);
        assertTrue(result.isEmpty(), "Phải trả về danh sách rỗng khi không có chi tiết hóa đơn");
    }
}
