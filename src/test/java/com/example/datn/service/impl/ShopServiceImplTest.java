package com.example.datn.service.impl;

import com.example.datn.entity.*;
import com.example.datn.repository.*;
import com.example.datn.vo.hoaDonVO.ShopProductHinhAnhVO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.data.domain.*;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class ShopServiceImplTest {

    @Mock
    private SanPhamRepository sanPhamRepository;
    @Mock
    private ChiTietSanPhamRepository chiTietSanPhamRepository;
    @Mock
    private MauSacRepository mauSacRepository;
    @Mock
    private KichThuocRepository kichThuocRepository;
    @Mock
    private ThuongHieuRepository thuongHieuRepository;
    @Mock
    private HinhAnhRepository hinhAnhRepository;
    @Mock
    private ChiTietDotGiamGiaRepository chiTietDotGiamGiaRepository;

    @InjectMocks
    private ShopServiceImpl shopService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    /**
     * Bug fix: division by zero when price == 0 in discount percent calculation.
     * Verify that no ArithmeticException is thrown and discountPercent is empty.
     */
    @Test
    void getShopProducts_shouldNotThrowWhenProductPriceIsZero() {
        SanPham sp = new SanPham();
        sp.setId(1);
        sp.setTenSanPham("Áo test");
        sp.setMaSanPham("SP001");

        ChiTietSanPham ctsp = new ChiTietSanPham();
        ctsp.setId(1);
        ctsp.setGia(0); // price = 0 → should not cause division by zero
        ctsp.setSanPham(sp);

        DotGiamGia dotGiamGia = new DotGiamGia();
        dotGiamGia.setId(1);
        dotGiamGia.setTrangThai(1);
        dotGiamGia.setPhanTramGiamGia(10);

        ChiTietDotGiamGia chiTietDotGiamGia = new ChiTietDotGiamGia();
        chiTietDotGiamGia.setId(1);
        chiTietDotGiamGia.setDotGiamGia(dotGiamGia);
        chiTietDotGiamGia.setGiaSauKhiGiam(0);

        sp.setChiTietSanPhams(List.of(ctsp));

        Page<SanPham> mockPage = new PageImpl<>(List.of(sp));
        when(sanPhamRepository.searchWithFilter(any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(Pageable.class)))
                .thenReturn(mockPage);
        when(chiTietDotGiamGiaRepository.findByChiTietSanPhamId(1))
                .thenReturn(List.of(chiTietDotGiamGia));
        when(hinhAnhRepository.findBySpctHinhAnhs_ChiTietSanPham_Id(1))
                .thenReturn(List.of());

        Page<ShopProductHinhAnhVO> result = assertDoesNotThrow(
                () -> shopService.getShopProducts(null, null, null, null, null, null, null, 0, 10),
                "Không được ném ArithmeticException khi giá sản phẩm bằng 0"
        );

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        ShopProductHinhAnhVO vo = result.getContent().get(0);
        // discountPercent should be empty (not negative or NaN) when price = 0
        assertEquals("", vo.getDiscountPercent(),
                "discountPercent phải là chuỗi rỗng khi giá sản phẩm bằng 0");
    }

    @Test
    void getShopProducts_shouldCalculateDiscountPercentCorrectly() {
        SanPham sp = new SanPham();
        sp.setId(2);
        sp.setTenSanPham("Áo có giảm giá");
        sp.setMaSanPham("SP002");

        ChiTietSanPham ctsp = new ChiTietSanPham();
        ctsp.setId(2);
        ctsp.setGia(200000); // price = 200000
        ctsp.setSanPham(sp);

        DotGiamGia dotGiamGia = new DotGiamGia();
        dotGiamGia.setId(1);
        dotGiamGia.setTrangThai(1);
        dotGiamGia.setPhanTramGiamGia(20);

        ChiTietDotGiamGia chiTietDotGiamGia = new ChiTietDotGiamGia();
        chiTietDotGiamGia.setId(2);
        chiTietDotGiamGia.setDotGiamGia(dotGiamGia);
        chiTietDotGiamGia.setGiaSauKhiGiam(160000); // 20% off

        sp.setChiTietSanPhams(List.of(ctsp));

        Page<SanPham> mockPage = new PageImpl<>(List.of(sp));
        when(sanPhamRepository.searchWithFilter(any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(Pageable.class)))
                .thenReturn(mockPage);
        when(chiTietDotGiamGiaRepository.findByChiTietSanPhamId(2))
                .thenReturn(List.of(chiTietDotGiamGia));
        when(hinhAnhRepository.findBySpctHinhAnhs_ChiTietSanPham_Id(2))
                .thenReturn(List.of());

        Page<ShopProductHinhAnhVO> result = shopService.getShopProducts(null, null, null, null, null, null, null, 0, 10);

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals("-20%", result.getContent().get(0).getDiscountPercent(),
                "discountPercent phải là '-20%' khi giảm 20%");
    }
}
