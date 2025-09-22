package com.example.datn.service;

import com.example.datn.dto.ChiTietSanPhamDTO;
import com.example.datn.dto.ChiTietSanPhamDotGIamGIaDTO;
import com.example.datn.dto.HinhAnhDTO;
import com.example.datn.entity.*;
import com.example.datn.repository.*;
import com.example.datn.vo.chiTietSanPhamVO.ChiTietSanPhamBanHangTaiQuayVO;
import com.example.datn.vo.chiTietSanPhamVO.ChiTietSanPhamQueryVO;
import com.example.datn.vo.chiTietSanPhamVO.ChiTietSanPhamUpdateVO;
import com.example.datn.vo.chiTietSanPhamVO.ChiTietSanPhamVO;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.Valid;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Validated
@Transactional
public class ChiTietSanPhamService {

    @Autowired
    private ChiTietSanPhamRepository chiTietSanPhamRepository;

    @Autowired
    private SanPhamRepository sanPhamRepository;
    @Autowired
    private ChatLieuRepository chatLieuRepository;
    @Autowired
    private ThuongHieuRepository thuongHieuRepository;
    @Autowired
    private MauSacRepository mauSacRepository;
    @Autowired
    private KichThuocRepository kichThuocRepository;
    @Autowired
    private CoAoRepository coAoRepository;
    @Autowired
    private TayAoRepository tayAoRepository;
    @Autowired
    private HoaDonChiTietRepository hoaDonChiTiet;

    @Autowired
    private ChiTietDotGiamGiaRepository chiTietDotGiamGiaRepository;

    @Autowired
    private SpctHinhAnhRepository spctHinhAnhRepository;
    @Autowired
    private HinhAnhRepository hinhAnhRepository;

    public Integer save(@Valid ChiTietSanPhamVO vO) {
        // Kiểm tra trùng CTSP theo idSanPham, idMauSac, idKichThuoc (có thể bổ sung thêm idChatLieu, idCoAo,... nếu muốn)

        ChiTietSanPham existing = chiTietSanPhamRepository.findExisting(
                vO.getIdSanPham(),
                vO.getIdMauSac(),
                vO.getIdKichThuoc()
        );

        if (existing != null) {
            // Cộng dồn số lượng và cập nhật giá mới nhất
            existing.setSoLuong(existing.getSoLuong() + vO.getSoLuong());
            existing.setGia(vO.getGia());
            existing.setTrongLuong(vO.getTrongLuong());
            //existing.setMoTa(vO.getMoTa());
            existing.setTrangThai(vO.getTrangThai());
            // Update mapping hình ảnh nếu có
            if (vO.getHinhAnhIds() != null) {
                spctHinhAnhRepository.deleteByChiTietSanPham_Id(existing.getId());
                for (Integer idHinhAnh : vO.getHinhAnhIds()) {
                    HinhAnh hinhAnh = hinhAnhRepository.findById(idHinhAnh)
                            .orElseThrow(() -> new RuntimeException("Không tìm thấy hình ảnh với id=" + idHinhAnh));
                    SpctHinhAnh mapping = new SpctHinhAnh();
                    mapping.setChiTietSanPham(existing);
                    mapping.setHinhAnh(hinhAnh);
                    spctHinhAnhRepository.save(mapping);
                }
            }
            chiTietSanPhamRepository.save(existing);
            return existing.getId();
        }

        // Nếu không trùng, tạo mới CTSP và tự gen mã
        ChiTietSanPham bean = new ChiTietSanPham();
        BeanUtils.copyProperties(vO, bean);

        if (vO.getIdSanPham() != null)
            bean.setSanPham(sanPhamRepository.findById(vO.getIdSanPham()).orElse(null));
        if (vO.getIdChatLieu() != null) {
            ChatLieu chatLieu = chatLieuRepository.findById(vO.getIdChatLieu()).orElse(null);
            bean.setChatLieu(chatLieu);
        }
        if (vO.getIdThuongHieu() != null) {
            ThuongHieu thuongHieu = thuongHieuRepository.findById(vO.getIdThuongHieu()).orElse(null);
            bean.setThuongHieu(thuongHieu);
        }
        if (vO.getIdMauSac() != null)
            bean.setMauSac(mauSacRepository.findById(vO.getIdMauSac()).orElse(null));
        if (vO.getIdKichThuoc() != null)
            bean.setKichThuoc(kichThuocRepository.findById(vO.getIdKichThuoc()).orElse(null));
        if (vO.getIdCoAo() != null)
            bean.setCoAo(coAoRepository.findById(vO.getIdCoAo()).orElse(null));
        if (vO.getIdTayAo() != null)
            bean.setTayAo(tayAoRepository.findById(vO.getIdTayAo()).orElse(null));

        // Tự động sinh mã CTSP + 4 số, ví dụ CTSP0001

        bean = chiTietSanPhamRepository.save(bean);
        String maMoi = String.format("CTSP%04d", bean.getId());
        bean.setMaSanPhamChiTiet(maMoi);
        bean = chiTietSanPhamRepository.save(bean);
        // --- Mapping nhiều hình ảnh ---
        if (vO.getHinhAnhIds() != null && !vO.getHinhAnhIds().isEmpty()) {
            for (Integer idHinhAnh : vO.getHinhAnhIds()) {
                HinhAnh hinhAnh = hinhAnhRepository.findById(idHinhAnh)
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy hình ảnh với id=" + idHinhAnh));
                SpctHinhAnh mapping = new SpctHinhAnh();
                mapping.setChiTietSanPham(bean);
                mapping.setHinhAnh(hinhAnh);
                spctHinhAnhRepository.save(mapping);
            }
        }

        return bean.getId();
    }

    public void delete(Integer id) {
        chiTietSanPhamRepository.deleteById(id);
    }

    public List<ChiTietSanPhamDotGIamGIaDTO> getChiTietSanPhamCoDGG() {
        List<ChiTietSanPham> chiTietSanPhamList = chiTietSanPhamRepository.getChiTietSanPhamTrangThai();
        List<ChiTietSanPhamDotGIamGIaDTO> chiTietSanPhamDotGIamGIaDTOS = new ArrayList<>();

        for (ChiTietSanPham c : chiTietSanPhamList) {
            ChiTietSanPhamDotGIamGIaDTO ctsp = new ChiTietSanPhamDotGIamGIaDTO();

            // BƯỚC 1: Lấy về danh sách đối tượng DotGiamGia, không phải List<Integer>
            List<DotGiamGia> activeDiscounts = chiTietDotGiamGiaRepository.getDotGiamGiaByIdChiTietSanPham(c.getId());

            // BƯỚC 2: Dùng Stream để tìm đợt giảm giá tốt nhất (có phanTramGiam cao nhất)
            Optional<DotGiamGia> bestDiscountOptional = activeDiscounts.stream()
                    .max(Comparator.comparing(DotGiamGia::getPhanTramGiamGia));

            int pggLonNhat = 0;
            Integer idDGG = null; // Dùng Integer để có thể là null

            // BƯỚC 3: Nếu tìm thấy đợt giảm giá, lấy thông tin từ đó
            if (bestDiscountOptional.isPresent()) {
                DotGiamGia bestDiscount = bestDiscountOptional.get();
                pggLonNhat = bestDiscount.getPhanTramGiamGia();
                idDGG = bestDiscount.getId(); // Lấy ID ở đây!
            }
            List<String> listUrl = new ArrayList<>();
            List<SpctHinhAnh> listspctHinhAnh = spctHinhAnhRepository.findByChiTietSanPham_Id(c.getId());
            for (SpctHinhAnh ctspHA : listspctHinhAnh) {
                listUrl.add(ctspHA.getHinhAnh().getDuongDanAnh());
            }


            // BƯỚC 4: Set giá trị cho DTO
            ctsp.setIdDotGiamGia(idDGG); // <-- SET ID ĐỢT GIẢM GIÁ
            ctsp.setIdChiTietSanPham(c.getId());
            ctsp.setTenSanPham(c.getSanPham().getTenSanPham());
            ctsp.setMaSanPham(c.getMaSanPhamChiTiet());
            ctsp.setThuongHieu(c.getThuongHieu().getTenThuongHieu());
            ctsp.setSoLuongTonKho(c.getSoLuong());
            ctsp.setDanhMuc(c.getSanPham().getDanhMuc().getTenDanhMuc());
            ctsp.setChatLieu(c.getChatLieu().getTenChatLieu());
            ctsp.setMauSac(c.getMauSac().getTenMauSac());
            ctsp.setKichThuoc(c.getKichThuoc().getTenKichCo());
            ctsp.setCoAo(c.getCoAo().getTenCoAo());
            ctsp.setTayAo(c.getTayAo().getTenTayAo());
            ctsp.setGia(c.getGia());
            ctsp.setPhanTramGiam(pggLonNhat);
            ctsp.setListUrlImage(listUrl);

            // Tính giá sau khi giảm
            BigDecimal originalPrice = BigDecimal.valueOf(c.getGia());
            BigDecimal discountAmount = originalPrice.multiply(BigDecimal.valueOf(pggLonNhat)).divide(BigDecimal.valueOf(100));
            ctsp.setGiaTienSauKhiGiam(originalPrice.subtract(discountAmount).intValue());

            chiTietSanPhamDotGIamGIaDTOS.add(ctsp);
        }

        return chiTietSanPhamDotGIamGIaDTOS;
    }

    public void update(Integer id, @Valid ChiTietSanPhamUpdateVO vO) {
        ChiTietSanPham bean = requireOne(id);
        BeanUtils.copyProperties(vO, bean);

        if (vO.getIdSanPham() != null)
            bean.setSanPham(sanPhamRepository.findById(vO.getIdSanPham()).orElse(null));
        if (vO.getIdChatLieu() != null)
            bean.setChatLieu(chatLieuRepository.findById(vO.getIdChatLieu()).orElse(null));
        if (vO.getIdThuongHieu() != null)
            bean.setThuongHieu(thuongHieuRepository.findById(vO.getIdThuongHieu()).orElse(null));
        if (vO.getIdMauSac() != null)
            bean.setMauSac(mauSacRepository.findById(vO.getIdMauSac()).orElse(null));
        if (vO.getIdKichThuoc() != null)
            bean.setKichThuoc(kichThuocRepository.findById(vO.getIdKichThuoc()).orElse(null));
        if (vO.getIdCoAo() != null)
            bean.setCoAo(coAoRepository.findById(vO.getIdCoAo()).orElse(null));
        if (vO.getIdTayAo() != null)
            bean.setTayAo(tayAoRepository.findById(vO.getIdTayAo()).orElse(null));

        chiTietSanPhamRepository.save(bean);

        // --- Cập nhật mapping hình ảnh ---
        if (vO.getHinhAnhIds() != null) {
            // Xóa toàn bộ mapping cũ theo id (an toàn, không phụ thuộc entity state)
            spctHinhAnhRepository.deleteByChiTietSanPham_Id(bean.getId());

            // Mapping mới nếu có id ảnh
            if (!vO.getHinhAnhIds().isEmpty()) {
                for (Integer idHinhAnh : vO.getHinhAnhIds()) {
                    HinhAnh hinhAnh = hinhAnhRepository.findById(idHinhAnh)
                            .orElseThrow(() -> new RuntimeException("Không tìm thấy hình ảnh với id=" + idHinhAnh));
                    SpctHinhAnh mapping = new SpctHinhAnh();
                    mapping.setChiTietSanPham(bean);
                    mapping.setHinhAnh(hinhAnh);
                    spctHinhAnhRepository.save(mapping);
                }
            }
            // Nếu danh sách là rỗng ([]), tức là xóa hết liên kết ảnh → không mapping mới
        }
    }

    public ChiTietSanPhamDTO getById(Integer id) {
        ChiTietSanPham original = requireOne(id);
        return toDTO(original);
    }

    public Page<ChiTietSanPhamDTO> query(ChiTietSanPhamQueryVO vO) {
        throw new UnsupportedOperationException();
    }

    public List<ChiTietSanPhamDTO> searchByMa(String keyword) {
        List<ChiTietSanPham> list = chiTietSanPhamRepository
                .findByMaSanPhamChiTietContainingIgnoreCase(keyword);
        return list.stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<ChiTietSanPhamDTO> findBySanPhamId(Integer idSanPham) {
        List<ChiTietSanPham> list = chiTietSanPhamRepository.findBySanPhamId(idSanPham);
        return list.stream().map(this::toDTO).collect(Collectors.toList());
    }

    public ChiTietSanPhamDTO findByMaSanPhamChiTiet(String maSanPhamChiTiet) {
        ChiTietSanPham entity = chiTietSanPhamRepository.findByMaSanPhamChiTiet(maSanPhamChiTiet);
        if (entity == null) {
            throw new NoSuchElementException("Không tìm thấy mã sản phẩm chi tiết: " + maSanPhamChiTiet);
        }
        return toDTO(entity);
    }

    public List<String> getAllMaChiTietSanPham() {
        return chiTietSanPhamRepository.findAllMaChiTietSanPham();
    }

    private ChiTietSanPhamDTO toDTO(ChiTietSanPham original) {
        ChiTietSanPhamDTO bean = new ChiTietSanPhamDTO();
        BeanUtils.copyProperties(original, bean);

        if (original.getSanPham() != null) {
            bean.setIdSanPham(original.getSanPham().getId());
            bean.setTenSanPham(original.getSanPham().getTenSanPham());
        }
        if (original.getChatLieu() != null) {
            bean.setIdChatLieu(original.getChatLieu().getId());
            bean.setTenChatLieu(original.getChatLieu().getTenChatLieu());
        }
        if (original.getThuongHieu() != null) {
            bean.setIdThuongHieu(original.getThuongHieu().getId());
            bean.setTenThuongHieu(original.getThuongHieu().getTenThuongHieu());
        }
        if (original.getMauSac() != null) {
            bean.setIdMauSac(original.getMauSac().getId());
            bean.setTenMauSac(original.getMauSac().getTenMauSac());
        }
        if (original.getKichThuoc() != null) {
            bean.setIdKichThuoc(original.getKichThuoc().getId());
            bean.setTenKichThuoc(original.getKichThuoc().getTenKichCo());
        }
        if (original.getCoAo() != null) {
            bean.setIdCoAo(original.getCoAo().getId());
            bean.setTenCoAo(original.getCoAo().getTenCoAo());
        }
        if (original.getTayAo() != null) {
            bean.setIdTayAo(original.getTayAo().getId());
            bean.setTenTayAo(original.getTayAo().getTenTayAo());
        }

        // Lấy danh sách hình ảnh mapping qua bảng spct_hinhanh
        if (original.getSpctHinhAnhs() != null && !original.getSpctHinhAnhs().isEmpty()) {
            List<HinhAnhDTO> hinhAnhDTOs = original.getSpctHinhAnhs().stream()
                    .map(spctHinhAnh -> {
                        HinhAnh ha = spctHinhAnh.getHinhAnh();
                        HinhAnhDTO dto = new HinhAnhDTO();
                        dto.setId(ha.getId());
                        dto.setMaAnh(ha.getMaAnh());
                        dto.setDuongDanAnh(ha.getDuongDanAnh());
                        dto.setAnhMacDinh(ha.getAnhMacDinh());
                        dto.setMoTa(ha.getMoTa());
                        dto.setTrangThai(ha.getTrangThai());
                        return dto;
                    })
                    .collect(Collectors.toList());
            bean.setHinhAnhs(hinhAnhDTOs);
        }

        return bean;
    }

    private ChiTietSanPham requireOne(Integer id) {
        return chiTietSanPhamRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Resource not found: " + id));
    }

    public List<ChiTietSanPhamBanHangTaiQuayVO> getChiTietSanPhamBanHangTaiQuay() {
        List<ChiTietSanPhamBanHangTaiQuayVO> list = chiTietSanPhamRepository.findChiTietSanPhamBanHangTaiQuay();
        if (list.isEmpty()) {
            throw new NoSuchElementException("Không tìm thấy chi tiết sản phẩm bán hàng tại quầy");
        }
        return list;
    }

    public ChiTietSanPhamDotGIamGIaDTO getChiTietSanPhamTheoMa(String maSanPhamChiTiet) {
        // Lấy chi tiết sản phẩm theo mã
        ChiTietSanPham c = chiTietSanPhamRepository.findByMaSanPhamChiTiet(maSanPhamChiTiet);
        if (c == null) {
            throw new NoSuchElementException("Không tìm thấy chi tiết sản phẩm bán hàng tại quầy");
        }

        ChiTietSanPhamDotGIamGIaDTO ctsp = new ChiTietSanPhamDotGIamGIaDTO();

        // Lấy các đợt giảm giá đang áp dụng
        List<DotGiamGia> activeDiscounts = chiTietDotGiamGiaRepository.getDotGiamGiaByIdChiTietSanPham(c.getId());

        // Tìm đợt giảm giá có phần trăm lớn nhất
        DotGiamGia bestDiscount = activeDiscounts.stream()
                .max(Comparator.comparing(DotGiamGia::getPhanTramGiamGia))
                .orElse(null); // trả về null nếu không có đợt giảm giá

        int pggLonNhat = 0;
        Integer idDGG = null;

        if (bestDiscount != null) {
            pggLonNhat = bestDiscount.getPhanTramGiamGia();
            idDGG = bestDiscount.getId();
        }

        // Gán dữ liệu vào DTO
        ctsp.setIdDotGiamGia(idDGG);
        ctsp.setIdChiTietSanPham(c.getId());
        ctsp.setTenSanPham(c.getSanPham().getTenSanPham());
        ctsp.setMaSanPham(c.getMaSanPhamChiTiet());
        ctsp.setThuongHieu(c.getThuongHieu().getTenThuongHieu());
        ctsp.setSoLuongTonKho(c.getSoLuong());
        ctsp.setChatLieu(c.getChatLieu().getTenChatLieu());
        ctsp.setMauSac(c.getMauSac().getTenMauSac());
        ctsp.setKichThuoc(c.getKichThuoc().getTenKichCo());
        ctsp.setCoAo(c.getCoAo().getTenCoAo());
        ctsp.setTayAo(c.getTayAo().getTenTayAo());
        ctsp.setGia(c.getGia());
        ctsp.setPhanTramGiam(pggLonNhat);
        List<String> listUrl = new ArrayList<>();
        // Truy vấn danh sách các đối tượng liên kết ảnh từ ID chi tiết sản phẩm
        List<SpctHinhAnh> listspctHinhAnh = spctHinhAnhRepository.findByChiTietSanPham_Id(c.getId());
        // Duyệt qua danh sách và lấy đường dẫn ảnh
        for (SpctHinhAnh ctspHA : listspctHinhAnh) {
            listUrl.add(ctspHA.getHinhAnh().getDuongDanAnh());
        }
        // Gán danh sách URL ảnh vào DTO
        ctsp.setListUrlImage(listUrl);

        // Tính giá sau khi giảm
        BigDecimal originalPrice = BigDecimal.valueOf(c.getGia());
        BigDecimal discountAmount = originalPrice.multiply(BigDecimal.valueOf(pggLonNhat)).divide(BigDecimal.valueOf(100));
        ctsp.setGiaTienSauKhiGiam(originalPrice.subtract(discountAmount).intValue());
        return ctsp;
    }

    public Page<ChiTietSanPhamDotGIamGIaDTO> getDanhSachSanPhamBanChay(Pageable pageable) {

        // 1. Lấy ra một trang chứa các ID sản phẩm bán chạy nhất
        Page<Integer> pageOfIds = hoaDonChiTiet.findBestSellingProductIdsAllTime(pageable);
        List<Integer> productIdsOnPage = pageOfIds.getContent();

        if (productIdsOnPage.isEmpty()) {
            return Page.empty(pageable);
        }

        // 2. Lấy thông tin chi tiết cho các sản phẩm trong trang hiện tại
        List<ChiTietSanPham> bestSellingProducts = chiTietSanPhamRepository.findAllById(productIdsOnPage);

        // 3. (Tối ưu) Lấy tất cả khuyến mãi liên quan trong 1 lần gọi DB
        Map<Integer, List<DotGiamGia>> discountsByProductId =
                chiTietDotGiamGiaRepository.findAllActiveDiscountsForProducts(productIdsOnPage)
                        .stream()
                        .collect(Collectors.groupingBy(ctdgg -> ctdgg.getChiTietSanPham().getId(),
                                Collectors.mapping(ctdgg -> ctdgg.getDotGiamGia(), Collectors.toList())));

        // 4. Chuyển đổi sản phẩm sang DTO và tính toán giá
        Map<Integer, ChiTietSanPhamDotGIamGIaDTO> dtoMap = bestSellingProducts.stream().map(c -> {
            ChiTietSanPhamDotGIamGIaDTO ctspDto = new ChiTietSanPhamDotGIamGIaDTO();

            List<DotGiamGia> activeDiscounts = discountsByProductId.getOrDefault(c.getId(), new ArrayList<>());

            DotGiamGia bestDiscount = activeDiscounts.stream()
                    .max(Comparator.comparing(DotGiamGia::getPhanTramGiamGia))
                    .orElse(null);

            int pggLonNhat = 0;
            Integer idDGG = null;
            if (bestDiscount != null) {
                pggLonNhat = bestDiscount.getPhanTramGiamGia();
                idDGG = bestDiscount.getId();
            }

            // Map dữ liệu
            ctspDto.setIdChiTietSanPham(c.getId());
            ctspDto.setTenSanPham(c.getSanPham().getTenSanPham());
            ctspDto.setMaSanPham(c.getMaSanPhamChiTiet());
            ctspDto.setThuongHieu(c.getThuongHieu().getTenThuongHieu());
            ctspDto.setSoLuongTonKho(c.getSoLuong());
            ctspDto.setChatLieu(c.getChatLieu().getTenChatLieu());
            ctspDto.setMauSac(c.getMauSac().getTenMauSac());
            ctspDto.setKichThuoc(c.getKichThuoc().getTenKichCo());
            ctspDto.setCoAo(c.getCoAo().getTenCoAo());
            ctspDto.setTayAo(c.getTayAo().getTenTayAo());
            ctspDto.setGia(c.getGia());
            ctspDto.setPhanTramGiam(pggLonNhat);
            ctspDto.setIdDotGiamGia(idDGG);

            // Tính giá cuối cùng
            BigDecimal originalPrice = BigDecimal.valueOf(c.getGia());
            BigDecimal discountAmount = originalPrice.multiply(BigDecimal.valueOf(pggLonNhat)).divide(BigDecimal.valueOf(100));
            ctspDto.setGiaTienSauKhiGiam(originalPrice.subtract(discountAmount).intValue());

            return ctspDto;
        }).collect(Collectors.toMap(ChiTietSanPhamDotGIamGIaDTO::getIdChiTietSanPham, dto -> dto));

        // 5. Sắp xếp lại DTO theo đúng thứ tự bán chạy (vì findAllById không đảm bảo thứ tự)
        List<ChiTietSanPhamDotGIamGIaDTO> finalOrderedList = productIdsOnPage.stream()
                .map(id -> dtoMap.get(id))
                .collect(Collectors.toList());

        // 6. Tạo và trả về đối tượng Page hoàn chỉnh
        return new PageImpl<>(finalOrderedList, pageable, pageOfIds.getTotalElements());
    }
}