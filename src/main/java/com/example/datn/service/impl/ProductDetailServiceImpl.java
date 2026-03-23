package com.example.datn.service.impl;

import com.example.datn.dto.MauSacDTO;
import com.example.datn.dto.ProductDetailDTO;
import com.example.datn.dto.VariantDTO;
import com.example.datn.dto.VoucherDTO;
import com.example.datn.entity.*;
import com.example.datn.repository.*;
import com.example.datn.service.ProductDetailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ProductDetailServiceImpl implements ProductDetailService {

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
    public ProductDetailDTO getProductDetail(Integer id) {
        SanPham sp = sanPhamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sản phẩm không tồn tại"));

        if (sp.getTrangThai() != 1) {
            throw new RuntimeException("Sản phẩm đã ngừng kinh doanh");
        }

        List<ChiTietSanPham> ctspList = chiTietSanPhamRepository.findBySanPhamIdAndTrangThai(sp.getId(), 1);
        if (ctspList.isEmpty()) {
            // Có thể trả về null hoặc throw exception tùy vào logic nghiệp vụ
            return null;
        }

        // Giá min/max là GIÁ GỐC của các variant (không tính giảm giá)
        List<Integer> giaGocList = ctspList.stream()
                .map(ChiTietSanPham::getGia)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        int giaMin = giaGocList.stream().min(Integer::compareTo).orElse(0);
        int giaMax = giaGocList.stream().max(Integer::compareTo).orElse(0);

        // List variant (chi tiết sản phẩm)
        List<VariantDTO> variants = ctspList.stream().map(e -> {
            VariantDTO v = new VariantDTO();
            v.setId(e.getId());
            v.setMauSac(e.getMauSac() != null ? e.getMauSac().getTenMauSac() : "");
            v.setMaMau(e.getMauSac() != null ? e.getMauSac().getMaMau() : "");
            v.setKichThuoc(e.getKichThuoc() != null ? e.getKichThuoc().getTenKichCo() : "");
            v.setGia(e.getGia());
            // Giá khuyến mãi và phần trăm giảm giá cho từng variant (nếu có)
            List<ChiTietDotGiamGia> dggsV = chiTietDotGiamGiaRepository.findByChiTietSanPhamId(e.getId());
            Optional<ChiTietDotGiamGia> outletV = dggsV.stream()
                    .filter(d -> d.getDotGiamGia().getTrangThai() != null && d.getDotGiamGia().getTrangThai() == 1)
                    .findFirst();
            if (outletV.isPresent()) {
                v.setGiaTruocKhiGiam(outletV.get().getGiaTruocKhiGiam());
                v.setGiaSauKhiGiam(outletV.get().getGiaSauKhiGiam());
                v.setPhanTramGiamGia(outletV.get().getDotGiamGia().getPhanTramGiamGia());
            }
            List<String> imgs = hinhAnhRepository.findBySpctHinhAnhs_ChiTietSanPham_Id(e.getId())
                    .stream().map(HinhAnh::getDuongDanAnh).collect(Collectors.toList());
            v.setImages(imgs);
            return v;
        }).collect(Collectors.toList());

        // Ảnh tổng hợp toàn bộ variant
        List<String> imageUrls = variants.stream()
                .flatMap(v -> v.getImages().stream())
                .distinct()
                .collect(Collectors.toList());

        // Colors (của tất cả variant, loại trùng lặp)
        List<MauSacDTO> colors = ctspList.stream()
                .map(e -> {
                    MauSacDTO c = new MauSacDTO();
                    c.setTenMauSac(e.getMauSac() != null ? e.getMauSac().getTenMauSac() : "");
                    c.setMaMau(e.getMauSac() != null ? e.getMauSac().getMaMau() : "");
                    return c;
                })
                .collect(Collectors.collectingAndThen(
                        Collectors.toCollection(() -> new TreeSet<>(Comparator.comparing(MauSacDTO::getMaMau))),
                        ArrayList::new
                ));

        // Sizes (loại trùng lặp)
        List<String> sizes = ctspList.stream()
                .map(e -> e.getKichThuoc() != null ? e.getKichThuoc().getTenKichCo() : "")
                .filter(s -> !s.isEmpty())
                .distinct()
                .collect(Collectors.toList());

        // Khuyến mãi tổng thể (chỉ dùng cho banner hoặc đồng loạt, còn FE quyết định hiển thị theo variant)
        ChiTietSanPham ctsp = ctspList.get(0);
        List<ChiTietDotGiamGia> dggs = chiTietDotGiamGiaRepository.findByChiTietSanPhamId(ctsp.getId());
        Optional<ChiTietDotGiamGia> outlet = dggs.stream()
                .filter(d -> d.getDotGiamGia().getTrangThai() != null && d.getDotGiamGia().getTrangThai() == 1)
                .findFirst();

        ProductDetailDTO dto = new ProductDetailDTO();
        dto.setId(sp.getId());
        dto.setTenSanPham(sp.getTenSanPham());
        dto.setMaSanPham(sp.getMaSanPham());
        dto.setMoTa(sp.getMoTa());
        dto.setGia(giaMin);
        dto.setGiaMin(giaMin);
        dto.setGiaMax(giaMax);
        // Không set giáTruocKhiGiam/giaSauKhiGiam/phanTramGiamGia tổng thể, FE chỉ lấy theo từng variant để show đúng
        if (outlet.isPresent()) {
            dto.setGiaTruocKhiGiam(outlet.get().getGiaTruocKhiGiam());
            dto.setGiaSauKhiGiam(outlet.get().getGiaSauKhiGiam());
            dto.setPhanTramGiamGia(outlet.get().getDotGiamGia().getPhanTramGiamGia());
        }
        dto.setTenDanhMuc(sp.getDanhMuc() != null ? sp.getDanhMuc().getTenDanhMuc() : "");
        dto.setTenThuongHieu(ctsp.getThuongHieu() != null ? ctsp.getThuongHieu().getTenThuongHieu() : "");
        dto.setImages(imageUrls);
        dto.setColors(colors);
        dto.setSizes(sizes);
        dto.setVariants(variants);
        dto.setRating(4.5 + Math.random() * 0.5);

        // Số lượng đã bán thực tế (sum soLuong của tất cả HoaDonChiTiet với trạng thái true)
        Integer sold = hoaDonChiTietRepository.countSoldBySanPhamId(sp.getId());
        dto.setSold(sold == null ? 0 : sold);

        dto.setShipping("Miễn phí vận chuyển cho đơn hàng từ 500k");
        VoucherDTO voucher = new VoucherDTO();
        voucher.setCode("SALE5OFF");
        voucher.setPercent(5);
        voucher.setMin("399.000");
        voucher.setExpire("Còn 3 ngày");
        dto.setVoucher(voucher);

        return dto;
    }
}