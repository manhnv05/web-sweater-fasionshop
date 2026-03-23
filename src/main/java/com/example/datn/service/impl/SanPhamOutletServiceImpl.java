package com.example.datn.service.impl;

import com.example.datn.dto.SanPhamOutletDTO;
import com.example.datn.entity.*;
import com.example.datn.repository.*;
import com.example.datn.service.SanPhamOutletService;
import com.example.datn.vo.clientVO.ShopProductVO;
import com.example.datn.vo.hoaDonVO.SanPhamOutletHinhAnhDTO;
import com.example.datn.vo.hoaDonVO.ShopProductHinhAnhVO;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class SanPhamOutletServiceImpl implements SanPhamOutletService {
    @Autowired
    private SanPhamRepository sanPhamRepository;
    @Autowired
    private ChiTietDotGiamGiaRepository chiTietDotGiamGiaRepository;
    @Autowired
    private HinhAnhRepository hinhAnhRepository;

    @Override
    public Page<SanPhamOutletHinhAnhDTO> getOutletProducts(int page, int pageSize) {
        Pageable pageable = PageRequest.of(page, pageSize, Sort.by(Sort.Direction.DESC, "id"));

        // Lấy tất cả ChiTietDotGiamGia có DotGiamGia trạng thái = 1 (đang áp dụng giảm giá)
        Page<ChiTietDotGiamGia> outletPage = chiTietDotGiamGiaRepository.findAll((root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            Join<ChiTietDotGiamGia, DotGiamGia> dotGiamGiaJoin = root.join("dotGiamGia", JoinType.INNER);
            predicates.add(cb.equal(dotGiamGiaJoin.get("trangThai"), 1));
            return cb.and(predicates.toArray(new Predicate[0]));
        }, pageable);

        // Lấy ra danh sách id sản phẩm cha (SanPham) chứa ít nhất 1 ChiTietSanPham đang có giảm giá
        Set<Integer> sanPhamIds = outletPage.getContent().stream()
                .map(ct -> {
                    ChiTietSanPham ctsp = ct.getChiTietSanPham();
                    return ctsp != null && ctsp.getSanPham() != null ? ctsp.getSanPham().getId() : null;
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        // Map ra danh sách sản phẩm cha, mỗi sản phẩm chỉ lấy 1 sản phẩm chi tiết outlet đại diện (ưu tiên giảm nhiều nhất)
        List<SanPhamOutletHinhAnhDTO> voList = new ArrayList<>();
        for (Integer spId : sanPhamIds) {
            // Lấy tất cả ChiTietDotGiamGia của sản phẩm cha này với trạng thái giảm giá 1
            List<ChiTietDotGiamGia> outletOfSp = outletPage.getContent().stream()
                    .filter(ct -> {
                        ChiTietSanPham ctsp = ct.getChiTietSanPham();
                        return ctsp != null && ctsp.getSanPham() != null && ctsp.getSanPham().getId().equals(spId);
                    })
                    .collect(Collectors.toList());

            // Lấy chi tiết outlet có phần trăm giảm giá lớn nhất (nếu bằng nhau lấy bất kỳ)
            ChiTietDotGiamGia maxDiscount = outletOfSp.stream()
                    .max(Comparator.comparingInt(ct ->
                            ct.getDotGiamGia() != null && ct.getDotGiamGia().getPhanTramGiamGia() != null
                                    ? ct.getDotGiamGia().getPhanTramGiamGia()
                                    : 0
                    )).orElse(null);

            if (maxDiscount != null) {
                ChiTietSanPham ctsp = maxDiscount.getChiTietSanPham();
                if (ctsp == null) continue;
                SanPham sp = ctsp.getSanPham();
                if (sp == null) continue;

                SanPhamOutletHinhAnhDTO dto = new SanPhamOutletHinhAnhDTO();
                dto.setId(sp.getId());
                dto.setIdChiTietSanPham(ctsp.getId());
                dto.setTenSanPham(sp.getTenSanPham() != null ? sp.getTenSanPham() : "");
                dto.setMaSanPham(sp.getMaSanPham() != null ? sp.getMaSanPham() : "");
                dto.setTenThuongHieu(
                        ctsp.getThuongHieu() != null && ctsp.getThuongHieu().getTenThuongHieu() != null
                                ? ctsp.getThuongHieu().getTenThuongHieu()
                                : ""
                );
                dto.setTenDanhMuc(
                        sp.getDanhMuc() != null && sp.getDanhMuc().getTenDanhMuc() != null
                                ? sp.getDanhMuc().getTenDanhMuc()
                                : ""
                );
                dto.setTenMauSac(
                        ctsp.getMauSac() != null && ctsp.getMauSac().getTenMauSac() != null
                                ? ctsp.getMauSac().getTenMauSac()
                                : ""
                );
                dto.setMaMau(
                        ctsp.getMauSac() != null && ctsp.getMauSac().getMaMau() != null
                                ? ctsp.getMauSac().getMaMau()
                                : ""
                );
                dto.setTenKichThuoc(
                        ctsp.getKichThuoc() != null && ctsp.getKichThuoc().getTenKichCo() != null
                                ? ctsp.getKichThuoc().getTenKichCo()
                                : ""
                );
                dto.setTenChatLieu(
                        ctsp.getChatLieu() != null && ctsp.getChatLieu().getTenChatLieu() != null
                                ? ctsp.getChatLieu().getTenChatLieu()
                                : ""
                );
                // Ảnh đại diện (ưu tiên ảnh mặc định, fallback ảnh đầu tiên)
                String imageUrl = "";

                    List<HinhAnh> imgList = hinhAnhRepository.findBySpctHinhAnhs_ChiTietSanPham_Id(ctsp.getId());
                    List<String> imageUrls = imgList.stream()
                            .map(HinhAnh::getDuongDanAnh)
                            .collect(Collectors.toList());

                dto.setImageUrl(imageUrls);
                dto.setGiaTruocKhiGiam(maxDiscount.getGiaTruocKhiGiam());
                dto.setGiaSauKhiGiam(maxDiscount.getGiaSauKhiGiam());
                dto.setPhanTramGiamGia(
                        maxDiscount.getDotGiamGia() != null && maxDiscount.getDotGiamGia().getPhanTramGiamGia() != null
                                ? maxDiscount.getDotGiamGia().getPhanTramGiamGia()
                                : 0
                );
                dto.setMoTa(sp.getMoTa() != null ? sp.getMoTa() : "");
                voList.add(dto);
            }
        }

        // Sort lại (nếu muốn), phân trang lại vì tổng số sp cha có thể ít hơn tổng số ChiTietDotGiamGia
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), voList.size());
        List<SanPhamOutletHinhAnhDTO> pagedList = voList.subList(Math.min(start, voList.size()), Math.min(end, voList.size()));

        return new PageImpl<>(pagedList, pageable, voList.size());
    }

    @Override
    public List<ShopProductHinhAnhVO> findRelatedProducts(Integer productId, int limit) {
        // Bước 1: Tìm sản phẩm gốc để xác định danh mục
        SanPham sanPhamGoc = sanPhamRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm với ID: " + productId));

        DanhMuc danhMuc = sanPhamGoc.getDanhMuc();
        if (danhMuc == null) {
            return Collections.emptyList(); // Trả về danh sách rỗng nếu sản phẩm không có danh mục
        }

        // Bước 2: Lấy các sản phẩm cùng danh mục từ DB
        Pageable pageable = PageRequest.of(0, limit);
        List<SanPham> relatedEntities = sanPhamRepository.findByDanhMucAndIdNot(danhMuc, productId, pageable);

        // Bước 3: Ánh xạ danh sách entity sang danh sách VO, sử dụng logic bạn đã cung cấp
        return relatedEntities.stream()
                .map(this::convertToShopProductVO)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }
    private ShopProductHinhAnhVO convertToShopProductVO(SanPham sp) {
        List<ChiTietSanPham> ctspList = sp.getChiTietSanPhams();
        if (ctspList == null || ctspList.isEmpty()) {
            return null; // Bỏ qua sản phẩm không có biến thể
        }

        // Tính toán giá min/max từ tất cả các biến thể
        int minPrice = ctspList.stream().mapToInt(ChiTietSanPham::getGia).min().orElse(0);
        int maxPrice = ctspList.stream().mapToInt(ChiTietSanPham::getGia).max().orElse(0);

        // Lấy biến thể đầu tiên làm đại diện để hiển thị
        ChiTietSanPham ctsp = ctspList.get(0);

        // Logic tìm giá và giá sale
        Integer price = ctsp.getGia();
        Integer salePrice = null;
        String discountPercent = "";
        List<ChiTietDotGiamGia> giamGias = chiTietDotGiamGiaRepository.findByChiTietSanPhamId(ctsp.getId());
        for (ChiTietDotGiamGia dgg : giamGias) {
            DotGiamGia dot = dgg.getDotGiamGia();
            if (dot.getTrangThai() == 1) { // Giả sử 1 là trạng thái "đang hoạt động"
                salePrice = dgg.getGiaSauKhiGiam();
                    int percent = (price != null && price > 0) ? (int) Math.round(100.0 * (price - salePrice) / price) : 0;
                discountPercent = percent > 0 ? "-" + percent + "%" : "";
                break;
            }
        }

        // Logic tìm hình ảnh
        String imageUrl = "";
        List<HinhAnh> imgList = hinhAnhRepository.findBySpctHinhAnhs_ChiTietSanPham_Id(ctsp.getId());
        List<String> imageUrls = imgList.stream()
                .map(HinhAnh::getDuongDanAnh)
                .collect(Collectors.toList());


        // Xây dựng đối tượng VO để trả về
        return ShopProductHinhAnhVO.builder()
                .id(sp.getId())
                .name(sp.getTenSanPham())
                .code(sp.getMaSanPham())
                .imageUrl(imageUrls)
                .price(price)
                .salePrice(salePrice)
                .discountPercent(discountPercent)
                .rating(4.0 + Math.random()) // Có thể thay bằng rating thật từ DB nếu có
                .priceMin(minPrice)
                .priceMax(maxPrice)
                .colorName(ctsp.getMauSac() != null ? ctsp.getMauSac().getTenMauSac() : null)
                .colorCode(ctsp.getMauSac() != null ? ctsp.getMauSac().getMaMau() : null)
                .sizeName(ctsp.getKichThuoc() != null ? ctsp.getKichThuoc().getTenKichCo() : null)
                .categoryName(sp.getDanhMuc() != null ? sp.getDanhMuc().getTenDanhMuc() : null)
                .build();
    }


}