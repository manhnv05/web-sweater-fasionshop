package com.example.datn.service;

import com.example.datn.dto.ThuongHieuDTO;
import com.example.datn.entity.ThuongHieu;
import com.example.datn.exception.AppException;
import com.example.datn.repository.ThuongHieuRepository;
import com.example.datn.vo.thuongHieuVO.ThuongHieuQueryVO;
import com.example.datn.vo.thuongHieuVO.ThuongHieuUpdateVO;
import com.example.datn.vo.thuongHieuVO.ThuongHieuVO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.util.Arrays;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class ThuongHieuServiceTest {

    @Mock
    private ThuongHieuRepository thuongHieuRepository;

    @InjectMocks
    private ThuongHieuService thuongHieuService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    // --- save() validation tests ---

    @Test
    void save_shouldThrowWhenNameIsNull() {
        ThuongHieuVO vo = new ThuongHieuVO();
        vo.setTenThuongHieu(null);

        assertThrows(AppException.class, () -> thuongHieuService.save(vo),
                "Phải ném AppException khi tên thương hiệu là null");
    }

    @Test
    void save_shouldThrowWhenNameIsEmpty() {
        ThuongHieuVO vo = new ThuongHieuVO();
        vo.setTenThuongHieu("  ");

        assertThrows(AppException.class, () -> thuongHieuService.save(vo),
                "Phải ném AppException khi tên thương hiệu là chuỗi trắng");
    }

    @Test
    void save_shouldThrowWhenNameTooLong() {
        ThuongHieuVO vo = new ThuongHieuVO();
        vo.setTenThuongHieu("A".repeat(51));

        assertThrows(AppException.class, () -> thuongHieuService.save(vo),
                "Phải ném AppException khi tên thương hiệu vượt quá 50 ký tự");
    }

    @Test
    void save_shouldThrowWhenNameIsDuplicate() {
        ThuongHieuVO vo = new ThuongHieuVO();
        vo.setTenThuongHieu("Nike");

        when(thuongHieuRepository.existsByTenThuongHieu("Nike")).thenReturn(true);

        assertThrows(AppException.class, () -> thuongHieuService.save(vo),
                "Phải ném AppException khi tên thương hiệu đã tồn tại");
    }

    @Test
    void save_shouldSucceedAndGenerateCodeTH0001WhenNoExisting() {
        ThuongHieuVO vo = new ThuongHieuVO();
        vo.setTenThuongHieu("Nike");

        when(thuongHieuRepository.existsByTenThuongHieu(anyString())).thenReturn(false);
        when(thuongHieuRepository.findMaxMaThuongHieuCode()).thenReturn(null);

        ThuongHieu saved = new ThuongHieu();
        saved.setId(1);
        saved.setMaThuongHieu("TH0001");
        saved.setTenThuongHieu("Nike");
        saved.setTrangThai(1);
        when(thuongHieuRepository.save(any(ThuongHieu.class))).thenReturn(saved);

        ThuongHieuDTO result = thuongHieuService.save(vo);

        assertNotNull(result);
        assertEquals("TH0001", result.getMaThuongHieu());
        assertEquals("Nike", result.getTenThuongHieu());
        assertEquals(1, result.getTrangThai());
    }

    @Test
    void save_shouldGenerateNextCodeWhenExistingCodesPresent() {
        ThuongHieuVO vo = new ThuongHieuVO();
        vo.setTenThuongHieu("Adidas");

        when(thuongHieuRepository.existsByTenThuongHieu(anyString())).thenReturn(false);
        when(thuongHieuRepository.findMaxMaThuongHieuCode()).thenReturn(7);

        ThuongHieu saved = new ThuongHieu();
        saved.setId(8);
        saved.setMaThuongHieu("TH0008");
        saved.setTenThuongHieu("Adidas");
        saved.setTrangThai(1);
        when(thuongHieuRepository.save(any(ThuongHieu.class))).thenReturn(saved);

        ThuongHieuDTO result = thuongHieuService.save(vo);

        assertNotNull(result);
        assertEquals("TH0008", result.getMaThuongHieu());
    }

    // --- getById() tests ---

    @Test
    void getById_shouldReturnDTOWhenFound() {
        ThuongHieu entity = new ThuongHieu();
        entity.setId(1);
        entity.setMaThuongHieu("TH0001");
        entity.setTenThuongHieu("Nike");
        entity.setTrangThai(1);

        when(thuongHieuRepository.findById(1)).thenReturn(Optional.of(entity));

        ThuongHieuDTO result = thuongHieuService.getById(1);

        assertNotNull(result);
        assertEquals(1, result.getId());
        assertEquals("TH0001", result.getMaThuongHieu());
        assertEquals("Nike", result.getTenThuongHieu());
    }

    @Test
    void getById_shouldThrowWhenNotFound() {
        when(thuongHieuRepository.findById(99)).thenReturn(Optional.empty());

        assertThrows(NoSuchElementException.class, () -> thuongHieuService.getById(99),
                "Phải ném NoSuchElementException khi không tìm thấy thương hiệu");
    }

    // --- delete() tests ---

    @Test
    void delete_shouldCallRepositoryDeleteById() {
        doNothing().when(thuongHieuRepository).deleteById(1);

        thuongHieuService.delete(1);

        verify(thuongHieuRepository, times(1)).deleteById(1);
    }

    // --- update() tests ---

    @Test
    void update_shouldThrowWhenNameIsEmpty() {
        ThuongHieu existing = new ThuongHieu();
        existing.setId(1);
        existing.setTenThuongHieu("Nike");
        when(thuongHieuRepository.findById(1)).thenReturn(Optional.of(existing));

        ThuongHieuUpdateVO vo = new ThuongHieuUpdateVO();
        vo.setTenThuongHieu("");

        assertThrows(AppException.class, () -> thuongHieuService.update(1, vo),
                "Phải ném AppException khi tên thương hiệu rỗng khi cập nhật");
    }

    @Test
    void update_shouldThrowWhenNameTooLong() {
        ThuongHieu existing = new ThuongHieu();
        existing.setId(1);
        existing.setTenThuongHieu("Nike");
        when(thuongHieuRepository.findById(1)).thenReturn(Optional.of(existing));

        ThuongHieuUpdateVO vo = new ThuongHieuUpdateVO();
        vo.setTenThuongHieu("A".repeat(51));

        assertThrows(AppException.class, () -> thuongHieuService.update(1, vo),
                "Phải ném AppException khi tên thương hiệu vượt quá 50 ký tự");
    }

    @Test
    void update_shouldThrowWhenNewNameDuplicatesAnotherRecord() {
        ThuongHieu existing = new ThuongHieu();
        existing.setId(1);
        existing.setTenThuongHieu("Nike");
        when(thuongHieuRepository.findById(1)).thenReturn(Optional.of(existing));
        when(thuongHieuRepository.existsByTenThuongHieu("Adidas")).thenReturn(true);

        ThuongHieuUpdateVO vo = new ThuongHieuUpdateVO();
        vo.setTenThuongHieu("Adidas");

        assertThrows(AppException.class, () -> thuongHieuService.update(1, vo),
                "Phải ném AppException khi tên mới đã được dùng bởi bản ghi khác");
    }

    @Test
    void update_shouldAllowSameNameSameRecord() {
        ThuongHieu existing = new ThuongHieu();
        existing.setId(1);
        existing.setTenThuongHieu("Nike");
        when(thuongHieuRepository.findById(1)).thenReturn(Optional.of(existing));
        when(thuongHieuRepository.existsByTenThuongHieu("Nike")).thenReturn(true);

        ThuongHieuUpdateVO vo = new ThuongHieuUpdateVO();
        vo.setTenThuongHieu("Nike");

        assertDoesNotThrow(() -> thuongHieuService.update(1, vo),
                "Không được ném ngoại lệ khi cập nhật với chính tên hiện tại");
        verify(thuongHieuRepository, times(1)).save(existing);
    }

    // --- query() tests ---

    @Test
    void query_shouldReturnPagedResultsWithNameFilter() {
        ThuongHieu th1 = new ThuongHieu();
        th1.setId(1);
        th1.setTenThuongHieu("Nike");

        ThuongHieu th2 = new ThuongHieu();
        th2.setId(2);
        th2.setTenThuongHieu("Adidas");

        Page<ThuongHieu> mockPage = new PageImpl<>(Arrays.asList(th1, th2));
        when(thuongHieuRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(mockPage);

        ThuongHieuQueryVO queryVO = new ThuongHieuQueryVO();
        queryVO.setTenThuongHieu("N");
        queryVO.setPage(0);
        queryVO.setSize(10);

        Page<ThuongHieuDTO> result = thuongHieuService.query(queryVO);

        assertEquals(2, result.getTotalElements());
        assertEquals("Nike", result.getContent().get(0).getTenThuongHieu());
    }

    @Test
    void query_shouldFilterByMaThuongHieu() {
        ThuongHieu th = new ThuongHieu();
        th.setId(1);
        th.setMaThuongHieu("TH0001");
        th.setTenThuongHieu("Nike");

        Page<ThuongHieu> mockPage = new PageImpl<>(List.of(th));
        when(thuongHieuRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(mockPage);

        ThuongHieuQueryVO queryVO = new ThuongHieuQueryVO();
        queryVO.setMaThuongHieu("TH0001");
        queryVO.setPage(0);
        queryVO.setSize(10);

        Page<ThuongHieuDTO> result = thuongHieuService.query(queryVO);

        assertEquals(1, result.getTotalElements());
        assertEquals("TH0001", result.getContent().get(0).getMaThuongHieu());
    }

    @Test
    void query_shouldReturnEmptyPageWhenNoResults() {
        Page<ThuongHieu> mockPage = new PageImpl<>(List.of());
        when(thuongHieuRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(mockPage);

        ThuongHieuQueryVO queryVO = new ThuongHieuQueryVO();

        Page<ThuongHieuDTO> result = thuongHieuService.query(queryVO);

        assertNotNull(result);
        assertEquals(0, result.getTotalElements());
    }

    // --- findAll() tests ---

    @Test
    void findAll_shouldReturnAllBrands() {
        ThuongHieu th1 = new ThuongHieu();
        th1.setId(1);
        th1.setTenThuongHieu("Nike");

        ThuongHieu th2 = new ThuongHieu();
        th2.setId(2);
        th2.setTenThuongHieu("Adidas");

        when(thuongHieuRepository.findAll()).thenReturn(Arrays.asList(th1, th2));

        List<ThuongHieuDTO> result = thuongHieuService.findAll();

        assertEquals(2, result.size());
        assertEquals("Nike", result.get(0).getTenThuongHieu());
        assertEquals("Adidas", result.get(1).getTenThuongHieu());
    }

    @Test
    void findAll_shouldReturnEmptyListWhenNoBrands() {
        when(thuongHieuRepository.findAll()).thenReturn(List.of());

        List<ThuongHieuDTO> result = thuongHieuService.findAll();

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }
}
