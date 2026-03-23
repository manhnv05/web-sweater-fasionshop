package com.example.datn.service.impl;

import com.example.datn.entity.*;
import com.example.datn.repository.*;
import com.example.datn.service.HomeService;
import com.example.datn.vo.clientVO.HomeProductVO;
import com.example.datn.vo.hoaDonVO.HomeProductHinhAnhVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class HomeServiceImpl implements HomeService {

    @Autowired
    private SanPhamRepository sanPhamRepository;
    @Autowired
    private ChiTietSanPhamRepository chiTietSanPhamRepository;
    @Autowired
    private HinhAnhRepository hinhAnhRepository;
    @Autowired
    private ChiTietDotGiamGiaRepository chiTietDotGiamGiaRepository;
    @Autowired
    private HoaDonChiTietRepository hoaDonChiTietRepository;

    @Override
    public List<HomeProductHinhAnhVO> getBestSellingProducts(int limit) {
        List<Object[]> bestSelling = hoaDonChiTietRepository.findBestSellingProductIds();
        List<HomeProductHinhAnhVO> result = new ArrayList<>();

        int count = 0;
        for (Object[] obj : bestSelling) {
            Integer sanPhamId = (Integer) obj[0];
            Optional<SanPham> spOpt = sanPhamRepository.findById(sanPhamId);
            if (spOpt.isEmpty()) continue;
            SanPham sp = spOpt.get();
// ✅ Bước 1: Chỉ xử lý sản phẩm cha đang hoạt động (trangThai = 1)
            if (sp.getTrangThai() != 1) {
                continue; // Bỏ qua sản phẩm này nếu nó đã ngừng kinh doanh
            }

            // ✅ Bước 2: Chỉ lấy các chi tiết sản phẩm con đang hoạt động
            // Gọi phương thức mới đã tạo trong Repository
            List<ChiTietSanPham> listCtsp = chiTietSanPhamRepository.findBySanPhamIdAndTrangThai(sp.getId(), 1);
            // Lấy tất cả chi tiết sản phẩm để tính khoảng giá

            if (listCtsp.isEmpty()) continue;

            // Tính giá min/max
            int priceMin = listCtsp.stream().mapToInt(ChiTietSanPham::getGia).min().orElse(0);
            int priceMax = listCtsp.stream().mapToInt(ChiTietSanPham::getGia).max().orElse(0);

            // Chọn chi tiết sản phẩm đầu tiên làm đại diện cho ảnh, sale, giá gốc hiển thị
            ChiTietSanPham ctsp = listCtsp.get(0);

            // Giá gốc đại diện
            Integer price = ctsp.getGia();

            // Lấy sale nếu có cho đại diện
            Integer salePrice = null;
            String discountPercent = "";
            List<ChiTietDotGiamGia> giamGias = chiTietDotGiamGiaRepository.findByChiTietSanPhamId(ctsp.getId());
            LocalDateTime now = LocalDateTime.now();
            for (ChiTietDotGiamGia dgg : giamGias) {
                DotGiamGia dot = dgg.getDotGiamGia();
                if (dot.getNgayBatDau().isBefore(now) && dot.getNgayKetThuc().isAfter(now) && dot.getTrangThai() == 1) {
                    salePrice = dgg.getGiaSauKhiGiam();
                    int percent = (price != null && price > 0) ? (int) Math.round(100.0 * (price - salePrice) / price) : 0;
                    discountPercent = percent > 0 ? "-" + percent + "%" : "";
                    break;
                }
            }

            // Lấy ảnh đại diện
            String imageUrl = "";
            List<HinhAnh> imgList = hinhAnhRepository.findBySpctHinhAnhs_ChiTietSanPham_Id(ctsp.getId());
            List<String> imageUrls = imgList.stream()
                    .map(HinhAnh::getDuongDanAnh)
                    .collect(Collectors.toList());


            double rating = 4 + Math.random(); // hoặc lấy từ feedback thực tế nếu có

            HomeProductHinhAnhVO vo = HomeProductHinhAnhVO.builder()
                    .id(sp.getId())
                    .name(sp.getTenSanPham())
                    .code(sp.getMaSanPham())
                    .imageUrl(imageUrls)
                    .price(price)
                    .salePrice(salePrice)
                    .discountPercent(discountPercent)
                    .rating(Math.round(rating * 10.0) / 10.0)
                    .priceMin(priceMin)
                    .priceMax(priceMax)
                    .build();

            result.add(vo);
            count++;
            if (count >= limit) break;
        }

        return result;
    }

    //    @Override
//    public List<HomeProductVO> getBestSellingProducts(int limit) {
//        List<HomeProductVO> result = new ArrayList<>();
//        result.add(HomeProductVO.builder()
//                .id(1)
//                .name("Test Product")
//                .imageUrl("https://via.placeholder.com/150")
//                .price(100000)
//                .salePrice(90000)
//                .discountPercent("-10%")
//                .rating(4.5)
//                .build());
//        return result;
//    }
}