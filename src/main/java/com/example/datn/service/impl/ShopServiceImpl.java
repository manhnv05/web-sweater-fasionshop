package com.example.datn.service.impl;

import com.example.datn.entity.*;
import com.example.datn.repository.*;
import com.example.datn.service.ShopService;
import com.example.datn.vo.clientVO.ShopProductVO;
import com.example.datn.vo.hoaDonVO.ShopProductHinhAnhVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ShopServiceImpl implements ShopService {

    @Autowired
    private SanPhamRepository sanPhamRepository;
    @Autowired
    private ChiTietSanPhamRepository chiTietSanPhamRepository;
    @Autowired
    private MauSacRepository mauSacRepository;
    @Autowired
    private KichThuocRepository kichThuocRepository;
    @Autowired
    private ThuongHieuRepository thuongHieuRepository;
    @Autowired
    private HinhAnhRepository hinhAnhRepository;
    @Autowired
    private ChiTietDotGiamGiaRepository chiTietDotGiamGiaRepository;

    @Override
    public Page<ShopProductHinhAnhVO> getShopProducts(
            String keyword,
            String color,
            String size,
            String brand,
            String category,
            Integer priceMin,
            Integer priceMax,
            int page,
            int pageSize
    ) {
        Pageable pageable = PageRequest.of(page, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        Page<SanPham> sanPhamPage = sanPhamRepository.searchWithFilter(
                keyword == null ? null : keyword.trim().toLowerCase(),
                color,
                size,
                brand,
                category,
                null, // material
                null, // collar
                null, // sleeve
                priceMin,
                priceMax,

                pageable
        );

        List<ShopProductHinhAnhVO> voList = sanPhamPage.getContent().stream().map(sp -> {
            List<ChiTietSanPham> ctspList = sp.getChiTietSanPhams();
            if (ctspList == null || ctspList.isEmpty())
                return null;

            int minPrice = ctspList.stream().mapToInt(ChiTietSanPham::getGia).min().orElse(0);
            int maxPrice = ctspList.stream().mapToInt(ChiTietSanPham::getGia).max().orElse(0);

            ChiTietSanPham ctsp = ctspList.get(0);

            Integer price = ctsp.getGia();
            Integer salePrice = null;
            String discountPercent = "";
            List<ChiTietDotGiamGia> giamGias = chiTietDotGiamGiaRepository.findByChiTietSanPhamId(ctsp.getId());
            for (ChiTietDotGiamGia dgg : giamGias) {
                DotGiamGia dot = dgg.getDotGiamGia();
                if (dot.getTrangThai() == 1) {
                    salePrice = dgg.getGiaSauKhiGiam();
                    int percent = (price != null && price > 0) ? (int) Math.round(100.0 * (price - salePrice) / price) : 0;
                    discountPercent = percent > 0 ? "-" + percent + "%" : "";
                    break;
                }
            }

            String imageUrl = "";
            List<HinhAnh> imgList = hinhAnhRepository.findBySpctHinhAnhs_ChiTietSanPham_Id(ctsp.getId());
            List<String> imageUrls = imgList.stream()
                    .map(HinhAnh::getDuongDanAnh)
                    .collect(Collectors.toList());

            return ShopProductHinhAnhVO.builder()
                    .id(sp.getId())
                    .name(sp.getTenSanPham())
                    .code(sp.getMaSanPham())
                    .imageUrl(imageUrls)
                    .price(price)
                    .salePrice(salePrice)
                    .discountPercent(discountPercent)
                    .rating(4.0 + Math.random()) // giả lập cho hiển thị
                    .priceMin(minPrice)
                    .priceMax(maxPrice)
                    .colorName(ctsp.getMauSac() != null ? ctsp.getMauSac().getTenMauSac() : null)
                    .colorCode(ctsp.getMauSac() != null ? ctsp.getMauSac().getMaMau() : null)
                    .sizeName(ctsp.getKichThuoc() != null ? ctsp.getKichThuoc().getTenKichCo() : null)
                    .brandName(ctsp.getThuongHieu() != null ? ctsp.getThuongHieu().getTenThuongHieu() : null)
                    .categoryName(sp.getDanhMuc() != null ? sp.getDanhMuc().getTenDanhMuc() : null)
                    .build();
        }).filter(Objects::nonNull).collect(Collectors.toList());

        return new PageImpl<>(voList, pageable, sanPhamPage.getTotalElements());
    }
    public Double getMaxProductPrice() {
        Double maxPrice = chiTietSanPhamRepository.findMaxPriceFromChiTiet();
        return maxPrice == null ? 0.0 : maxPrice; // Trả về 0 nếu không có sản phẩm nào
    }
}
