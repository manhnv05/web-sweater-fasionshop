package com.example.datn.service.impl;

import com.example.datn.config.EmailService;
import com.example.datn.dto.PhieuGiamGiaDTO;
import com.example.datn.entity.ChiTietPhieuGiamGia;
import com.example.datn.entity.PhieuGiamGia;
import com.example.datn.repository.ChiTietPhieuGiamGiaRepository;
import com.example.datn.repository.PhieuGiamGiaRepository;
import com.example.datn.service.PhieuGiamGiaService;
import com.example.datn.vo.phieuGiamGiaVO.PhieuGiamGiaVO;
import com.example.datn.vo.phieuGiamGiaVO.PhieuGiamGiaVOUpdate;
import com.example.datn.vo.phieuGiamGiaVO.PhieuGiamVOSearch;
import com.example.datn.vo.phieuGiamGiaVO.SendMailRequestData;
import com.example.datn.exception.AppException;
import com.example.datn.exception.ErrorCode;
import com.example.datn.mapper.PhieuGiamGiaMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PhieuGiamGiaServiceImpl implements PhieuGiamGiaService {

    @Autowired
    private PhieuGiamGiaRepository phieuGiamGiaRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private ChiTietPhieuGiamGiaRepository phieuGiamGiaKhachHangRepository;

    @Override
    public Page<PhieuGiamGiaDTO> getAllPhieuGiamGia(int page, int size, PhieuGiamVOSearch search) {
        Pageable pageable = PageRequest.of(page, size);
        Page<PhieuGiamGia> phieuGiamGiaPages = phieuGiamGiaRepository.findAllBySearch(search, pageable);
        return phieuGiamGiaPages.map(PhieuGiamGiaMapper.INSTANCE::toResponse);
    }

    @Override
    public PhieuGiamGiaDTO getPhieuGiamGiaById(int id) {
        PhieuGiamGia phieuGiamGia = phieuGiamGiaRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PHIEU_GIAM_GIA_NULL));
        return PhieuGiamGiaMapper.INSTANCE.toResponse(phieuGiamGia);
    }

    @Override
    public PhieuGiamGiaDTO createPhieuGiamGia(PhieuGiamGiaVO phieuGiamGiaRequest) {
        List<PhieuGiamGia> checkMaPhieuGiamGia = phieuGiamGiaRepository.getPhieuGiamGiaByMaPhieuGiamGia(phieuGiamGiaRequest.getMaPhieuGiamGia());
        if (!checkMaPhieuGiamGia.isEmpty()) {
            throw new AppException(ErrorCode.MA_PHIEU_GIAM_GIA_TON_TAI);
        }
        if (phieuGiamGiaRepository.getPhieuGiamGiaByTenPhieu(phieuGiamGiaRequest.getTenPhieu())){
            throw new AppException(ErrorCode.PHIEU_GIAM_GIA_EXISTS);
        }
        PhieuGiamGia phieuGiamGia = PhieuGiamGiaMapper.INSTANCE.toPhieuGiamGia(phieuGiamGiaRequest);
        phieuGiamGiaRepository.save(phieuGiamGia);
        return PhieuGiamGiaMapper.INSTANCE.toResponse(phieuGiamGia);
    }

    @Override
    public PhieuGiamGiaDTO updatePhieuGiamGia(PhieuGiamGiaVOUpdate phieuGiamGiaRequestUpdate) {
        PhieuGiamGia phieuGiamGia = phieuGiamGiaRepository.findById(phieuGiamGiaRequestUpdate.getId()).orElse(null);
        if (phieuGiamGia == null) {
            throw new AppException(ErrorCode.PHIEU_GIAM_GIA_NULL);
        } else {
            PhieuGiamGiaMapper.INSTANCE.updatePhieuGiamGia(phieuGiamGia, phieuGiamGiaRequestUpdate);
            phieuGiamGiaRepository.save(phieuGiamGia);
            return PhieuGiamGiaMapper.INSTANCE.toResponse(phieuGiamGia);
        }
    }

    @Override
    public boolean deletePhieuGiamGia(int id) {
        PhieuGiamGia phieuGiamGia = phieuGiamGiaRepository.findById(id).orElse(null);
        if (phieuGiamGia == null) {
            return false;
        } else {
            phieuGiamGiaRepository.delete(phieuGiamGia);
            return true;
        }
    }

    @Override
    public PhieuGiamGiaDTO updateStatusPhieuGiamGia(int id, int status) {
        PhieuGiamGia phieuGiamGia = phieuGiamGiaRepository
                .findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PHIEU_GIAM_GIA_NULL));
        phieuGiamGia.setTrangThai(status);
        phieuGiamGiaRepository.save(phieuGiamGia);
        return PhieuGiamGiaMapper.INSTANCE.toResponse(phieuGiamGia);
    }

    @Override
    public void sendMailToListCustomer(SendMailRequestData sendMailRequestData) {
        PhieuGiamGia phieuGiamGia = PhieuGiamGiaMapper.INSTANCE
                .toPhieuGiamGia(sendMailRequestData.getPhieuGiamGiaVO());
        String subject = "Bạn nhận được phiếu giảm giá!";

        // Tạo ThreadPool cố định 10 luồng
        ExecutorService executor = Executors.newFixedThreadPool(10);

        for (String email : sendMailRequestData.getEmails()) {
            executor.submit(() -> {
                String body = buildHtmlBody(phieuGiamGia);
                try {
                    emailService.sendEmail(email, subject, body);
                } catch (Exception e) {
                    // Log lỗi nhưng không dừng toàn bộ tiến trình
                    System.err.println("Lỗi gửi mail tới: " + email + " - " + e.getMessage());
                }
            });
        }

        executor.shutdown(); // Không nhận thêm task mới
    }

    @Override
    public String tangSoluongPhieuGiamGia(Integer idPhieuGiamGia, Integer soLuong) {
        PhieuGiamGia phieuGiamGia = phieuGiamGiaRepository.findById(idPhieuGiamGia)
                .orElseThrow(() -> new AppException(ErrorCode.PHIEU_GIAM_GIA_NULL));
        BigDecimal soluongHienTai = phieuGiamGia.getSoLuong();
        BigDecimal soLuongTangThem = BigDecimal.valueOf(soLuong);
        BigDecimal tongSoLuong = soluongHienTai.add(soLuongTangThem);
        phieuGiamGia.setSoLuong(tongSoLuong);
        phieuGiamGiaRepository.save(phieuGiamGia);
        return "Tăng số lượng thành công";
    }

    @Override
    public String giamSoluongPhieuGiamGia(Integer idPhieuGiamGia, Integer soLuong, Integer idKhachHang) {
        PhieuGiamGia phieuGiamGia = phieuGiamGiaRepository.findById(idPhieuGiamGia)
                .orElseThrow(() -> new AppException(ErrorCode.PHIEU_GIAM_GIA_NULL));
        if (phieuGiamGia.getLoaiPhieu() == 1){
            phieuGiamGiaKhachHangRepository.deletePhieuGiamGiaPhieuGiamGia(idPhieuGiamGia, idKhachHang);
        }
        BigDecimal soluongHienTai = phieuGiamGia.getSoLuong();
        BigDecimal soLuongGiamBot = BigDecimal.valueOf(soLuong);

        if (soluongHienTai.compareTo(soLuongGiamBot) < 0) {
            throw new AppException(ErrorCode.INVALID_QUANTITY_PGG);
        }
        BigDecimal soLuongConLai = soluongHienTai.subtract(soLuongGiamBot);
        phieuGiamGia.setSoLuong(soLuongConLai);
        phieuGiamGiaRepository.save(phieuGiamGia);
        return "Giảm số lượng thành công";
    }

    @Override
    public List<PhieuGiamGiaDTO> getPublicAndActiveVouchers() {
        // Gọi phương thức repository với thời gian hiện tại
        List<PhieuGiamGia> entities = phieuGiamGiaRepository.findActivePublicVouchers(LocalDateTime.now());

        // Chuyển đổi danh sách entity sang danh sách DTO
        return entities.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    // Hàm tiện ích để chuyển đổi từ Entity sang DTO
    private PhieuGiamGiaDTO convertToDto(PhieuGiamGia entity) {
        PhieuGiamGiaDTO dto = new PhieuGiamGiaDTO();
        dto.setId(entity.getId());
        dto.setMaPhieuGiamGia(entity.getMaPhieuGiamGia());
        dto.setDieuKienGiam(entity.getDieuKienGiam());
        dto.setTenPhieu(entity.getTenPhieu());
        dto.setLoaiPhieu(entity.getLoaiPhieu());
        dto.setPhamTramGiamGia(entity.getPhamTramGiamGia());
        dto.setSoTienGiam(entity.getSoTienGiam());
        dto.setGiamToiDa(entity.getGiamToiDa());
        dto.setNgayBatDau(entity.getNgayBatDau());
        dto.setNgayKetThuc(entity.getNgayKetThuc());
        dto.setNgayTao(entity.getNgayTao());
        dto.setNgayCapNhat(entity.getNgayCapNhat());
        dto.setGhiChu(entity.getGhiChu());
        dto.setTrangThai(entity.getTrangThai());
        dto.setSoLuong(entity.getSoLuong());
        return dto;
    }

    private String buildHtmlBody(PhieuGiamGia info) {
        String value = "";
        try{
            value = info.getSoTienGiam().intValue() + " VNĐ";
        }
        catch (Exception e){
            value = info.getPhamTramGiamGia().intValue() + " %";
        }

        return String.format("""
        <html>
        <body>
            <h2 style="color:#4CAF50;">🎁 Phiếu Giảm Giá Đặc Biệt 🎁</h2>
            <p><strong>Mã phiếu:</strong> %s</p>
            <p><strong>Ngày bắt đầu:</strong> %s</p>
            <p><strong>Ngày kết thúc:</strong> %s</p>
            <p><strong>Giá trị giảm:</strong> %s</p>
            <hr/>
            <p>Hãy sử dụng phiếu giảm giá này trước khi hết hạn!</p>
        </body>
        </html>
    """,
                info.getMaPhieuGiamGia(),
                info.getNgayBatDau().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")),
                info.getNgayKetThuc().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")),
                value);
    }

}