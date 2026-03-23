package com.example.datn.service.impl;

import com.example.datn.dto.ProductDetailDTO;
import com.example.datn.entity.ChiTietSanPham;
import com.example.datn.entity.SanPham;
import com.example.datn.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.*;

class ProductDetailServiceImplTest {

    @Mock
    private SanPhamRepository sanPhamRepository;
    @Mock
    private ChiTietSanPhamRepository chiTietSanPhamRepository;
    @Mock
    private HinhAnhRepository hinhAnhRepository;
    @Mock
    private ChiTietDotGiamGiaRepository chiTietDotGiamGiaRepository;
    @Mock
    private HoaDonChiTietRepository hoaDonChiTietRepository;

    @InjectMocks
    private ProductDetailServiceImpl productDetailService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    /**
     * Bug fix: dto.setGia(giaMin) was immediately overwritten by dto.setGia(giaMax).
     * Verify that giaMin and giaMax are both set correctly on the DTO.
     */
    @Test
    void getProductDetail_shouldSetGiaMinAndGiaMaxCorrectly() {
        SanPham sp = new SanPham();
        sp.setId(1);
        sp.setTenSanPham("Áo sweater");
        sp.setMaSanPham("SP001");
        sp.setTrangThai(1);

        ChiTietSanPham ctsp1 = new ChiTietSanPham();
        ctsp1.setId(1);
        ctsp1.setGia(100000);
        ctsp1.setSanPham(sp);

        ChiTietSanPham ctsp2 = new ChiTietSanPham();
        ctsp2.setId(2);
        ctsp2.setGia(200000);
        ctsp2.setSanPham(sp);

        when(sanPhamRepository.findById(1)).thenReturn(Optional.of(sp));
        when(chiTietSanPhamRepository.findBySanPhamIdAndTrangThai(1, 1))
                .thenReturn(List.of(ctsp1, ctsp2));
        when(chiTietDotGiamGiaRepository.findByChiTietSanPhamId(anyInt()))
                .thenReturn(List.of());
        when(hinhAnhRepository.findBySpctHinhAnhs_ChiTietSanPham_Id(anyInt()))
                .thenReturn(List.of());
        when(hoaDonChiTietRepository.countSoldBySanPhamId(1)).thenReturn(5);

        ProductDetailDTO result = productDetailService.getProductDetail(1);

        assertNotNull(result);
        // giaMin should be the minimum price (100000), not overwritten by giaMax
        assertEquals(100000, result.getGiaMin(), "giaMin phải là giá thấp nhất");
        assertEquals(200000, result.getGiaMax(), "giaMax phải là giá cao nhất");
        // 'gia' should display the minimum (starting) price
        assertEquals(100000, result.getGia(), "gia phải bằng giaMin");
    }

    @Test
    void getProductDetail_shouldReturnNullWhenNoActiveVariants() {
        SanPham sp = new SanPham();
        sp.setId(1);
        sp.setTrangThai(1);

        when(sanPhamRepository.findById(1)).thenReturn(Optional.of(sp));
        when(chiTietSanPhamRepository.findBySanPhamIdAndTrangThai(1, 1))
                .thenReturn(List.of());

        ProductDetailDTO result = productDetailService.getProductDetail(1);

        assertNull(result, "Phải trả về null khi không có biến thể nào hoạt động");
    }

    @Test
    void getProductDetail_shouldThrowWhenProductNotFound() {
        when(sanPhamRepository.findById(99)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class,
                () -> productDetailService.getProductDetail(99),
                "Phải ném RuntimeException khi sản phẩm không tồn tại");
    }
}
