package com.example.datn.service.impl;

import com.example.datn.entity.*;
import com.example.datn.repository.*;
import com.example.datn.vo.hoaDonVO.HomeProductHinhAnhVO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class HomeServiceImplTest {

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
    private HomeServiceImpl homeService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void getBestSellingProducts_shouldReturnEmptyListWhenNoSales() {
        when(hoaDonChiTietRepository.findBestSellingProductIds()).thenReturn(List.of());

        List<HomeProductHinhAnhVO> result = homeService.getBestSellingProducts(10);

        assertNotNull(result);
        assertTrue(result.isEmpty(), "Phải trả về danh sách rỗng khi không có dữ liệu bán hàng");
    }

    @Test
    void getBestSellingProducts_shouldSkipProductsThatAreNotFound() {
        Object[] row = new Object[]{999};
        when(hoaDonChiTietRepository.findBestSellingProductIds())
                .thenReturn(List.of(row));
        when(sanPhamRepository.findById(999)).thenReturn(Optional.empty());

        List<HomeProductHinhAnhVO> result = homeService.getBestSellingProducts(10);

        assertTrue(result.isEmpty(), "Phải bỏ qua sản phẩm không tồn tại trong DB");
    }

    @Test
    void getBestSellingProducts_shouldSkipInactiveProducts() {
        SanPham sp = new SanPham();
        sp.setId(1);
        sp.setTenSanPham("Áo test");
        sp.setTrangThai(0); // inactive

        Object[] row = new Object[]{1};
        when(hoaDonChiTietRepository.findBestSellingProductIds())
                .thenReturn(List.of(row));
        when(sanPhamRepository.findById(1)).thenReturn(Optional.of(sp));

        List<HomeProductHinhAnhVO> result = homeService.getBestSellingProducts(10);

        assertTrue(result.isEmpty(), "Phải bỏ qua sản phẩm không hoạt động (trangThai != 1)");
    }

    @Test
    void getBestSellingProducts_shouldSkipProductsWithNoActiveVariants() {
        SanPham sp = new SanPham();
        sp.setId(1);
        sp.setTenSanPham("Áo test");
        sp.setTrangThai(1); // active

        Object[] row = new Object[]{1};
        when(hoaDonChiTietRepository.findBestSellingProductIds())
                .thenReturn(List.of(row));
        when(sanPhamRepository.findById(1)).thenReturn(Optional.of(sp));
        when(chiTietSanPhamRepository.findBySanPhamIdAndTrangThai(1, 1))
                .thenReturn(List.of()); // no active variants

        List<HomeProductHinhAnhVO> result = homeService.getBestSellingProducts(10);

        assertTrue(result.isEmpty(), "Phải bỏ qua sản phẩm không có chi tiết hoạt động");
    }

    @Test
    void getBestSellingProducts_shouldReturnProductWithCorrectPriceRange() {
        SanPham sp = new SanPham();
        sp.setId(1);
        sp.setTenSanPham("Áo sweater");
        sp.setMaSanPham("SP001");
        sp.setTrangThai(1);

        ChiTietSanPham ctsp1 = new ChiTietSanPham();
        ctsp1.setId(1);
        ctsp1.setGia(150000);
        ctsp1.setSanPham(sp);

        ChiTietSanPham ctsp2 = new ChiTietSanPham();
        ctsp2.setId(2);
        ctsp2.setGia(250000);
        ctsp2.setSanPham(sp);

        Object[] row = new Object[]{1};
        when(hoaDonChiTietRepository.findBestSellingProductIds())
                .thenReturn(List.of(row));
        when(sanPhamRepository.findById(1)).thenReturn(Optional.of(sp));
        when(chiTietSanPhamRepository.findBySanPhamIdAndTrangThai(1, 1))
                .thenReturn(List.of(ctsp1, ctsp2));
        when(chiTietDotGiamGiaRepository.findByChiTietSanPhamId(1))
                .thenReturn(List.of());
        when(hinhAnhRepository.findBySpctHinhAnhs_ChiTietSanPham_Id(1))
                .thenReturn(List.of());

        List<HomeProductHinhAnhVO> result = homeService.getBestSellingProducts(10);

        assertEquals(1, result.size());
        HomeProductHinhAnhVO vo = result.get(0);
        assertEquals(1, vo.getId());
        assertEquals("Áo sweater", vo.getName());
        assertEquals(150000, vo.getPriceMin(), "Giá tối thiểu phải là 150000");
        assertEquals(250000, vo.getPriceMax(), "Giá tối đa phải là 250000");
        assertEquals(150000, vo.getPrice(), "Giá đại diện phải là giá của variant đầu tiên");
    }

    @Test
    void getBestSellingProducts_shouldCalculateDiscountPercentForActivePromotion() {
        SanPham sp = new SanPham();
        sp.setId(1);
        sp.setTenSanPham("Áo giảm giá");
        sp.setMaSanPham("SP002");
        sp.setTrangThai(1);

        ChiTietSanPham ctsp = new ChiTietSanPham();
        ctsp.setId(1);
        ctsp.setGia(200000);
        ctsp.setSanPham(sp);

        DotGiamGia dotGiamGia = new DotGiamGia();
        dotGiamGia.setId(1);
        dotGiamGia.setTrangThai(1);
        dotGiamGia.setPhanTramGiamGia(20);
        dotGiamGia.setNgayBatDau(LocalDateTime.now().minusDays(1));
        dotGiamGia.setNgayKetThuc(LocalDateTime.now().plusDays(10));

        ChiTietDotGiamGia chiTietDotGiamGia = new ChiTietDotGiamGia();
        chiTietDotGiamGia.setId(1);
        chiTietDotGiamGia.setDotGiamGia(dotGiamGia);
        chiTietDotGiamGia.setGiaSauKhiGiam(160000); // 20% off 200000

        Object[] row = new Object[]{1};
        when(hoaDonChiTietRepository.findBestSellingProductIds())
                .thenReturn(List.of(row));
        when(sanPhamRepository.findById(1)).thenReturn(Optional.of(sp));
        when(chiTietSanPhamRepository.findBySanPhamIdAndTrangThai(1, 1))
                .thenReturn(List.of(ctsp));
        when(chiTietDotGiamGiaRepository.findByChiTietSanPhamId(1))
                .thenReturn(List.of(chiTietDotGiamGia));
        when(hinhAnhRepository.findBySpctHinhAnhs_ChiTietSanPham_Id(1))
                .thenReturn(List.of());

        List<HomeProductHinhAnhVO> result = homeService.getBestSellingProducts(10);

        assertEquals(1, result.size());
        HomeProductHinhAnhVO vo = result.get(0);
        assertEquals(160000, vo.getSalePrice(), "Giá sau giảm phải là 160000");
        assertEquals("-20%", vo.getDiscountPercent(), "Phần trăm giảm phải là -20%");
    }

    @Test
    void getBestSellingProducts_shouldNotSetDiscountForExpiredPromotion() {
        SanPham sp = new SanPham();
        sp.setId(1);
        sp.setTenSanPham("Áo hết hạn giảm giá");
        sp.setMaSanPham("SP003");
        sp.setTrangThai(1);

        ChiTietSanPham ctsp = new ChiTietSanPham();
        ctsp.setId(1);
        ctsp.setGia(200000);
        ctsp.setSanPham(sp);

        DotGiamGia expiredDot = new DotGiamGia();
        expiredDot.setId(1);
        expiredDot.setTrangThai(1);
        expiredDot.setNgayBatDau(LocalDateTime.now().minusDays(30));
        expiredDot.setNgayKetThuc(LocalDateTime.now().minusDays(1)); // already expired

        ChiTietDotGiamGia chiTiet = new ChiTietDotGiamGia();
        chiTiet.setId(1);
        chiTiet.setDotGiamGia(expiredDot);
        chiTiet.setGiaSauKhiGiam(160000);

        Object[] row = new Object[]{1};
        when(hoaDonChiTietRepository.findBestSellingProductIds())
                .thenReturn(List.of(row));
        when(sanPhamRepository.findById(1)).thenReturn(Optional.of(sp));
        when(chiTietSanPhamRepository.findBySanPhamIdAndTrangThai(1, 1))
                .thenReturn(List.of(ctsp));
        when(chiTietDotGiamGiaRepository.findByChiTietSanPhamId(1))
                .thenReturn(List.of(chiTiet));
        when(hinhAnhRepository.findBySpctHinhAnhs_ChiTietSanPham_Id(1))
                .thenReturn(List.of());

        List<HomeProductHinhAnhVO> result = homeService.getBestSellingProducts(10);

        assertEquals(1, result.size());
        HomeProductHinhAnhVO vo = result.get(0);
        assertNull(vo.getSalePrice(), "Giá giảm phải là null khi chương trình đã hết hạn");
        assertEquals("", vo.getDiscountPercent(), "discountPercent phải rỗng khi không có khuyến mãi");
    }

    @Test
    void getBestSellingProducts_shouldNotCauseArithmeticExceptionWhenPriceIsZero() {
        SanPham sp = new SanPham();
        sp.setId(1);
        sp.setTenSanPham("Sản phẩm giá 0");
        sp.setMaSanPham("SP004");
        sp.setTrangThai(1);

        ChiTietSanPham ctsp = new ChiTietSanPham();
        ctsp.setId(1);
        ctsp.setGia(0); // price = 0, division by zero risk
        ctsp.setSanPham(sp);

        DotGiamGia dotGiamGia = new DotGiamGia();
        dotGiamGia.setId(1);
        dotGiamGia.setTrangThai(1);
        dotGiamGia.setNgayBatDau(LocalDateTime.now().minusDays(1));
        dotGiamGia.setNgayKetThuc(LocalDateTime.now().plusDays(10));

        ChiTietDotGiamGia chiTiet = new ChiTietDotGiamGia();
        chiTiet.setId(1);
        chiTiet.setDotGiamGia(dotGiamGia);
        chiTiet.setGiaSauKhiGiam(0);

        Object[] row = new Object[]{1};
        when(hoaDonChiTietRepository.findBestSellingProductIds())
                .thenReturn(List.of(row));
        when(sanPhamRepository.findById(1)).thenReturn(Optional.of(sp));
        when(chiTietSanPhamRepository.findBySanPhamIdAndTrangThai(1, 1))
                .thenReturn(List.of(ctsp));
        when(chiTietDotGiamGiaRepository.findByChiTietSanPhamId(1))
                .thenReturn(List.of(chiTiet));
        when(hinhAnhRepository.findBySpctHinhAnhs_ChiTietSanPham_Id(1))
                .thenReturn(List.of());

        List<HomeProductHinhAnhVO> result = assertDoesNotThrow(
                () -> homeService.getBestSellingProducts(10),
                "Không được ném ArithmeticException khi giá sản phẩm bằng 0"
        );

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("", result.get(0).getDiscountPercent(),
                "discountPercent phải rỗng khi giá = 0");
    }

    @Test
    void getBestSellingProducts_shouldRespectLimitParameter() {
        SanPham sp1 = buildSanPham(1, "SP001");
        SanPham sp2 = buildSanPham(2, "SP002");
        SanPham sp3 = buildSanPham(3, "SP003");

        Object[] row1 = new Object[]{1};
        Object[] row2 = new Object[]{2};
        Object[] row3 = new Object[]{3};

        when(hoaDonChiTietRepository.findBestSellingProductIds())
                .thenReturn(List.of(row1, row2, row3));

        for (int i = 1; i <= 3; i++) {
            final int id = i;
            SanPham sp = id == 1 ? sp1 : (id == 2 ? sp2 : sp3);
            when(sanPhamRepository.findById(id)).thenReturn(Optional.of(sp));

            ChiTietSanPham ctsp = new ChiTietSanPham();
            ctsp.setId(id);
            ctsp.setGia(100000);
            ctsp.setSanPham(sp);
            when(chiTietSanPhamRepository.findBySanPhamIdAndTrangThai(id, 1))
                    .thenReturn(List.of(ctsp));
            when(chiTietDotGiamGiaRepository.findByChiTietSanPhamId(id))
                    .thenReturn(List.of());
            when(hinhAnhRepository.findBySpctHinhAnhs_ChiTietSanPham_Id(id))
                    .thenReturn(List.of());
        }

        List<HomeProductHinhAnhVO> result = homeService.getBestSellingProducts(2);

        assertEquals(2, result.size(), "Kết quả phải bị giới hạn bởi limit");
    }

    @Test
    void getBestSellingProducts_shouldIncludeImageUrlsFromRepository() {
        SanPham sp = buildSanPham(1, "SP001");

        ChiTietSanPham ctsp = new ChiTietSanPham();
        ctsp.setId(1);
        ctsp.setGia(100000);
        ctsp.setSanPham(sp);

        HinhAnh img1 = new HinhAnh();
        img1.setDuongDanAnh("https://cdn.example.com/img1.jpg");
        HinhAnh img2 = new HinhAnh();
        img2.setDuongDanAnh("https://cdn.example.com/img2.jpg");

        Object[] row = new Object[]{1};
        when(hoaDonChiTietRepository.findBestSellingProductIds())
                .thenReturn(List.of(row));
        when(sanPhamRepository.findById(1)).thenReturn(Optional.of(sp));
        when(chiTietSanPhamRepository.findBySanPhamIdAndTrangThai(1, 1))
                .thenReturn(List.of(ctsp));
        when(chiTietDotGiamGiaRepository.findByChiTietSanPhamId(1))
                .thenReturn(List.of());
        when(hinhAnhRepository.findBySpctHinhAnhs_ChiTietSanPham_Id(1))
                .thenReturn(List.of(img1, img2));

        List<HomeProductHinhAnhVO> result = homeService.getBestSellingProducts(10);

        assertEquals(1, result.size());
        List<String> images = result.get(0).getImageUrl();
        assertEquals(2, images.size());
        assertEquals("https://cdn.example.com/img1.jpg", images.get(0));
        assertEquals("https://cdn.example.com/img2.jpg", images.get(1));
    }

    // --- helper methods ---

    private SanPham buildSanPham(int id, String ma) {
        SanPham sp = new SanPham();
        sp.setId(id);
        sp.setTenSanPham("Sản phẩm " + id);
        sp.setMaSanPham(ma);
        sp.setTrangThai(1);
        return sp;
    }
}
