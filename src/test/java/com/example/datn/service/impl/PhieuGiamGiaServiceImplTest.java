package com.example.datn.service.impl;

import com.example.datn.config.EmailService;
import com.example.datn.dto.PhieuGiamGiaDTO;
import com.example.datn.entity.PhieuGiamGia;
import com.example.datn.exception.AppException;
import com.example.datn.repository.ChiTietPhieuGiamGiaRepository;
import com.example.datn.repository.PhieuGiamGiaRepository;
import com.example.datn.vo.phieuGiamGiaVO.PhieuGiamGiaVOUpdate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class PhieuGiamGiaServiceImplTest {

    @Mock
    private PhieuGiamGiaRepository phieuGiamGiaRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private ChiTietPhieuGiamGiaRepository phieuGiamGiaKhachHangRepository;

    @InjectMocks
    private PhieuGiamGiaServiceImpl phieuGiamGiaService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    // --- getPhieuGiamGiaById() tests ---

    @Test
    void getPhieuGiamGiaById_shouldReturnDTOWhenFound() {
        PhieuGiamGia entity = buildVoucher(1, "PGG001", "Phiếu tháng 1", 1, BigDecimal.TEN);

        when(phieuGiamGiaRepository.findById(1)).thenReturn(Optional.of(entity));

        PhieuGiamGiaDTO result = phieuGiamGiaService.getPhieuGiamGiaById(1);

        assertNotNull(result);
        assertEquals("PGG001", result.getMaPhieuGiamGia());
        assertEquals("Phiếu tháng 1", result.getTenPhieu());
    }

    @Test
    void getPhieuGiamGiaById_shouldThrowWhenNotFound() {
        when(phieuGiamGiaRepository.findById(99)).thenReturn(Optional.empty());

        assertThrows(AppException.class, () -> phieuGiamGiaService.getPhieuGiamGiaById(99),
                "Phải ném AppException khi phiếu giảm giá không tồn tại");
    }

    // --- createPhieuGiamGia() tests ---

    @Test
    void createPhieuGiamGia_shouldThrowWhenCodeAlreadyExists() {
        PhieuGiamGia existing = buildVoucher(1, "PGG001", "Phiếu cũ", 1, BigDecimal.TEN);
        when(phieuGiamGiaRepository.getPhieuGiamGiaByMaPhieuGiamGia("PGG001"))
                .thenReturn(List.of(existing));

        com.example.datn.vo.phieuGiamGiaVO.PhieuGiamGiaVO vo = buildVO("PGG001", "Phiếu mới");

        assertThrows(AppException.class, () -> phieuGiamGiaService.createPhieuGiamGia(vo),
                "Phải ném AppException khi mã phiếu đã tồn tại");
    }

    @Test
    void createPhieuGiamGia_shouldThrowWhenNameAlreadyExists() {
        when(phieuGiamGiaRepository.getPhieuGiamGiaByMaPhieuGiamGia("PGG002"))
                .thenReturn(List.of());
        when(phieuGiamGiaRepository.getPhieuGiamGiaByTenPhieu("Phiếu tên trùng"))
                .thenReturn(true);

        com.example.datn.vo.phieuGiamGiaVO.PhieuGiamGiaVO vo = buildVO("PGG002", "Phiếu tên trùng");

        assertThrows(AppException.class, () -> phieuGiamGiaService.createPhieuGiamGia(vo),
                "Phải ném AppException khi tên phiếu đã tồn tại");
    }

    @Test
    void createPhieuGiamGia_shouldSaveAndReturnDTOWhenValid() {
        when(phieuGiamGiaRepository.getPhieuGiamGiaByMaPhieuGiamGia("PGG003"))
                .thenReturn(List.of());
        when(phieuGiamGiaRepository.getPhieuGiamGiaByTenPhieu("Phiếu hợp lệ"))
                .thenReturn(false);
        when(phieuGiamGiaRepository.save(any(PhieuGiamGia.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        com.example.datn.vo.phieuGiamGiaVO.PhieuGiamGiaVO vo = buildVO("PGG003", "Phiếu hợp lệ");

        PhieuGiamGiaDTO result = phieuGiamGiaService.createPhieuGiamGia(vo);

        assertNotNull(result);
        verify(phieuGiamGiaRepository, times(1)).save(any(PhieuGiamGia.class));
    }

    // --- updatePhieuGiamGia() tests ---

    @Test
    void updatePhieuGiamGia_shouldThrowWhenNotFound() {
        when(phieuGiamGiaRepository.findById(99)).thenReturn(Optional.empty());

        PhieuGiamGiaVOUpdate update = new PhieuGiamGiaVOUpdate();
        update.setId(99);

        assertThrows(AppException.class, () -> phieuGiamGiaService.updatePhieuGiamGia(update),
                "Phải ném AppException khi phiếu giảm giá không tồn tại khi cập nhật");
    }

    @Test
    void updatePhieuGiamGia_shouldSaveWhenFound() {
        PhieuGiamGia entity = buildVoucher(1, "PGG001", "Phiếu cũ", 1, BigDecimal.TEN);
        when(phieuGiamGiaRepository.findById(1)).thenReturn(Optional.of(entity));
        when(phieuGiamGiaRepository.save(any(PhieuGiamGia.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        PhieuGiamGiaVOUpdate update = new PhieuGiamGiaVOUpdate();
        update.setId(1);
        update.setTenPhieu("Phiếu đã cập nhật");
        update.setSoLuong(BigDecimal.TEN);
        update.setGiamToiDa(BigDecimal.valueOf(50000));
        update.setNgayBatDau(LocalDateTime.now());
        update.setNgayKetThuc(LocalDateTime.now().plusDays(30));

        PhieuGiamGiaDTO result = phieuGiamGiaService.updatePhieuGiamGia(update);

        assertNotNull(result);
        verify(phieuGiamGiaRepository, times(1)).save(entity);
    }

    // --- deletePhieuGiamGia() tests ---

    @Test
    void deletePhieuGiamGia_shouldReturnFalseWhenNotFound() {
        when(phieuGiamGiaRepository.findById(99)).thenReturn(Optional.empty());

        boolean result = phieuGiamGiaService.deletePhieuGiamGia(99);

        assertFalse(result, "Phải trả về false khi phiếu giảm giá không tồn tại");
    }

    @Test
    void deletePhieuGiamGia_shouldReturnTrueAndDeleteWhenFound() {
        PhieuGiamGia entity = buildVoucher(1, "PGG001", "Phiếu test", 1, BigDecimal.TEN);
        when(phieuGiamGiaRepository.findById(1)).thenReturn(Optional.of(entity));
        doNothing().when(phieuGiamGiaRepository).delete(entity);

        boolean result = phieuGiamGiaService.deletePhieuGiamGia(1);

        assertTrue(result, "Phải trả về true khi xóa thành công");
        verify(phieuGiamGiaRepository, times(1)).delete(entity);
    }

    // --- updateStatusPhieuGiamGia() tests ---

    @Test
    void updateStatusPhieuGiamGia_shouldThrowWhenNotFound() {
        when(phieuGiamGiaRepository.findById(99)).thenReturn(Optional.empty());

        assertThrows(AppException.class,
                () -> phieuGiamGiaService.updateStatusPhieuGiamGia(99, 2),
                "Phải ném AppException khi phiếu không tồn tại");
    }

    @Test
    void updateStatusPhieuGiamGia_shouldUpdateStatusWhenFound() {
        PhieuGiamGia entity = buildVoucher(1, "PGG001", "Phiếu test", 1, BigDecimal.TEN);
        when(phieuGiamGiaRepository.findById(1)).thenReturn(Optional.of(entity));
        when(phieuGiamGiaRepository.save(any(PhieuGiamGia.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        PhieuGiamGiaDTO result = phieuGiamGiaService.updateStatusPhieuGiamGia(1, 2);

        assertNotNull(result);
        assertEquals(2, entity.getTrangThai());
        verify(phieuGiamGiaRepository, times(1)).save(entity);
    }

    // --- tangSoluongPhieuGiamGia() tests ---

    @Test
    void tangSoluong_shouldThrowWhenVoucherNotFound() {
        when(phieuGiamGiaRepository.findById(99)).thenReturn(Optional.empty());

        assertThrows(AppException.class,
                () -> phieuGiamGiaService.tangSoluongPhieuGiamGia(99, 5),
                "Phải ném AppException khi phiếu không tồn tại");
    }

    @Test
    void tangSoluong_shouldIncreaseSoLuongByGivenAmount() {
        PhieuGiamGia entity = buildVoucher(1, "PGG001", "Phiếu test", 1, BigDecimal.TEN);
        when(phieuGiamGiaRepository.findById(1)).thenReturn(Optional.of(entity));
        when(phieuGiamGiaRepository.save(any(PhieuGiamGia.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        String result = phieuGiamGiaService.tangSoluongPhieuGiamGia(1, 5);

        assertEquals("Tăng số lượng thành công", result);
        assertEquals(BigDecimal.valueOf(15), entity.getSoLuong(),
                "Số lượng phải tăng từ 10 lên 15");
        verify(phieuGiamGiaRepository, times(1)).save(entity);
    }

    // --- giamSoluongPhieuGiamGia() tests ---

    @Test
    void giamSoluong_shouldThrowWhenVoucherNotFound() {
        when(phieuGiamGiaRepository.findById(99)).thenReturn(Optional.empty());

        assertThrows(AppException.class,
                () -> phieuGiamGiaService.giamSoluongPhieuGiamGia(99, 1, 1),
                "Phải ném AppException khi phiếu không tồn tại");
    }

    @Test
    void giamSoluong_shouldThrowWhenQuantityInsufficient() {
        PhieuGiamGia entity = buildVoucher(1, "PGG001", "Phiếu test", 0, BigDecimal.valueOf(2));
        when(phieuGiamGiaRepository.findById(1)).thenReturn(Optional.of(entity));

        assertThrows(AppException.class,
                () -> phieuGiamGiaService.giamSoluongPhieuGiamGia(1, 5, 1),
                "Phải ném AppException khi số lượng giảm vượt quá số lượng hiện có");
    }

    @Test
    void giamSoluong_shouldDecreaseQuantitySuccessfully() {
        PhieuGiamGia entity = buildVoucher(1, "PGG001", "Phiếu test", 0, BigDecimal.TEN);
        when(phieuGiamGiaRepository.findById(1)).thenReturn(Optional.of(entity));
        when(phieuGiamGiaRepository.save(any(PhieuGiamGia.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        String result = phieuGiamGiaService.giamSoluongPhieuGiamGia(1, 3, 1);

        assertEquals("Giảm số lượng thành công", result);
        assertEquals(BigDecimal.valueOf(7), entity.getSoLuong(),
                "Số lượng phải giảm từ 10 xuống 7");
        verify(phieuGiamGiaRepository, times(1)).save(entity);
    }

    @Test
    void giamSoluong_shouldDeleteChiTietWhenLoaiPhieuIs1() {
        PhieuGiamGia entity = buildVoucher(1, "PGG001", "Phiếu cá nhân", 1, BigDecimal.TEN);
        when(phieuGiamGiaRepository.findById(1)).thenReturn(Optional.of(entity));
        when(phieuGiamGiaRepository.save(any(PhieuGiamGia.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        doNothing().when(phieuGiamGiaKhachHangRepository)
                .deletePhieuGiamGiaPhieuGiamGia(1, 42);

        phieuGiamGiaService.giamSoluongPhieuGiamGia(1, 1, 42);

        verify(phieuGiamGiaKhachHangRepository, times(1))
                .deletePhieuGiamGiaPhieuGiamGia(1, 42);
    }

    // --- getPublicAndActiveVouchers() tests ---

    @Test
    void getPublicAndActiveVouchers_shouldReturnListOfActiveDTOs() {
        PhieuGiamGia v1 = buildVoucher(1, "PGG001", "Phiếu công khai", 1, BigDecimal.valueOf(20));
        PhieuGiamGia v2 = buildVoucher(2, "PGG002", "Phiếu công khai 2", 1, BigDecimal.valueOf(5));

        when(phieuGiamGiaRepository.findActivePublicVouchers(any(LocalDateTime.class)))
                .thenReturn(List.of(v1, v2));

        List<PhieuGiamGiaDTO> result = phieuGiamGiaService.getPublicAndActiveVouchers();

        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("PGG001", result.get(0).getMaPhieuGiamGia());
        assertEquals("PGG002", result.get(1).getMaPhieuGiamGia());
    }

    @Test
    void getPublicAndActiveVouchers_shouldReturnEmptyListWhenNone() {
        when(phieuGiamGiaRepository.findActivePublicVouchers(any(LocalDateTime.class)))
                .thenReturn(List.of());

        List<PhieuGiamGiaDTO> result = phieuGiamGiaService.getPublicAndActiveVouchers();

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    // --- helper methods ---

    private PhieuGiamGia buildVoucher(int id, String ma, String ten, int loai, BigDecimal soLuong) {
        PhieuGiamGia v = new PhieuGiamGia();
        v.setId(id);
        v.setMaPhieuGiamGia(ma);
        v.setTenPhieu(ten);
        v.setLoaiPhieu(loai);
        v.setSoLuong(soLuong);
        v.setTrangThai(1);
        v.setNgayBatDau(LocalDateTime.now().minusDays(1));
        v.setNgayKetThuc(LocalDateTime.now().plusDays(30));
        v.setGiamToiDa(BigDecimal.valueOf(100000));
        v.setSoTienGiam(BigDecimal.valueOf(10000));
        return v;
    }

    private com.example.datn.vo.phieuGiamGiaVO.PhieuGiamGiaVO buildVO(String ma, String ten) {
        com.example.datn.vo.phieuGiamGiaVO.PhieuGiamGiaVO vo =
                new com.example.datn.vo.phieuGiamGiaVO.PhieuGiamGiaVO();
        vo.setMaPhieuGiamGia(ma);
        vo.setTenPhieu(ten);
        vo.setLoaiPhieu(0);
        vo.setSoLuong(BigDecimal.TEN);
        vo.setGiamToiDa(BigDecimal.valueOf(50000));
        vo.setNgayBatDau(LocalDateTime.now());
        vo.setNgayKetThuc(LocalDateTime.now().plusDays(30));
        return vo;
    }
}
