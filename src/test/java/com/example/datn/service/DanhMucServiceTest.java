package com.example.datn.service;

import com.example.datn.dto.DanhMucDTO;
import com.example.datn.entity.DanhMuc;
import com.example.datn.exception.AppException;
import com.example.datn.repository.DanhMucRepository;
import com.example.datn.vo.danhMucVO.DanhMucQueryVO;
import com.example.datn.vo.danhMucVO.DanhMucUpdateVO;
import com.example.datn.vo.danhMucVO.DanhMucVO;
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

class DanhMucServiceTest {

    @Mock
    private DanhMucRepository danhMucRepository;

    @InjectMocks
    private DanhMucService danhMucService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    // --- save() validation tests ---

    @Test
    void save_shouldThrowWhenNameIsNull() {
        DanhMucVO vo = new DanhMucVO();
        vo.setTenDanhMuc(null);

        assertThrows(AppException.class, () -> danhMucService.save(vo),
                "Phải ném AppException khi tên danh mục là null");
    }

    @Test
    void save_shouldThrowWhenNameIsEmpty() {
        DanhMucVO vo = new DanhMucVO();
        vo.setTenDanhMuc("  ");

        assertThrows(AppException.class, () -> danhMucService.save(vo),
                "Phải ném AppException khi tên danh mục là chuỗi trắng");
    }

    @Test
    void save_shouldThrowWhenNameTooLong() {
        DanhMucVO vo = new DanhMucVO();
        vo.setTenDanhMuc("A".repeat(51));

        assertThrows(AppException.class, () -> danhMucService.save(vo),
                "Phải ném AppException khi tên danh mục vượt quá 50 ký tự");
    }

    @Test
    void save_shouldThrowWhenNameIsDuplicate() {
        DanhMucVO vo = new DanhMucVO();
        vo.setTenDanhMuc("Áo khoác");

        when(danhMucRepository.existsByTenDanhMuc("Áo khoác")).thenReturn(true);

        assertThrows(AppException.class, () -> danhMucService.save(vo),
                "Phải ném AppException khi tên danh mục đã tồn tại");
    }

    @Test
    void save_shouldSucceedAndGenerateCodeDM0001WhenNoExisting() {
        DanhMucVO vo = new DanhMucVO();
        vo.setTenDanhMuc("Áo khoác");

        when(danhMucRepository.existsByTenDanhMuc(anyString())).thenReturn(false);
        when(danhMucRepository.findMaxMaDanhMucCode()).thenReturn(null);

        DanhMuc saved = new DanhMuc();
        saved.setId(1);
        saved.setMaDanhMuc("DM0001");
        saved.setTenDanhMuc("Áo khoác");
        saved.setTrangThai(1);
        when(danhMucRepository.save(any(DanhMuc.class))).thenReturn(saved);

        DanhMucDTO result = danhMucService.save(vo);

        assertNotNull(result);
        assertEquals("DM0001", result.getMaDanhMuc());
        assertEquals("Áo khoác", result.getTenDanhMuc());
        assertEquals(1, result.getTrangThai());
    }

    @Test
    void save_shouldGenerateNextCodeWhenExistingCodesPresent() {
        DanhMucVO vo = new DanhMucVO();
        vo.setTenDanhMuc("Quần dài");

        when(danhMucRepository.existsByTenDanhMuc(anyString())).thenReturn(false);
        when(danhMucRepository.findMaxMaDanhMucCode()).thenReturn(3);

        DanhMuc saved = new DanhMuc();
        saved.setId(4);
        saved.setMaDanhMuc("DM0004");
        saved.setTenDanhMuc("Quần dài");
        saved.setTrangThai(1);
        when(danhMucRepository.save(any(DanhMuc.class))).thenReturn(saved);

        DanhMucDTO result = danhMucService.save(vo);

        assertNotNull(result);
        assertEquals("DM0004", result.getMaDanhMuc());
    }

    // --- getById() tests ---

    @Test
    void getById_shouldReturnDTOWhenFound() {
        DanhMuc entity = new DanhMuc();
        entity.setId(1);
        entity.setMaDanhMuc("DM0001");
        entity.setTenDanhMuc("Áo khoác");
        entity.setTrangThai(1);

        when(danhMucRepository.findById(1)).thenReturn(Optional.of(entity));

        DanhMucDTO result = danhMucService.getById(1);

        assertNotNull(result);
        assertEquals(1, result.getId());
        assertEquals("DM0001", result.getMaDanhMuc());
        assertEquals("Áo khoác", result.getTenDanhMuc());
    }

    @Test
    void getById_shouldThrowWhenNotFound() {
        when(danhMucRepository.findById(99)).thenReturn(Optional.empty());

        assertThrows(NoSuchElementException.class, () -> danhMucService.getById(99),
                "Phải ném NoSuchElementException khi không tìm thấy danh mục");
    }

    // --- delete() tests ---

    @Test
    void delete_shouldCallRepositoryDeleteById() {
        doNothing().when(danhMucRepository).deleteById(1);

        danhMucService.delete(1);

        verify(danhMucRepository, times(1)).deleteById(1);
    }

    // --- update() tests ---

    @Test
    void update_shouldThrowWhenNameIsEmpty() {
        DanhMuc existing = new DanhMuc();
        existing.setId(1);
        existing.setTenDanhMuc("Áo khoác");
        when(danhMucRepository.findById(1)).thenReturn(Optional.of(existing));

        DanhMucUpdateVO vo = new DanhMucUpdateVO();
        vo.setTenDanhMuc("");

        assertThrows(AppException.class, () -> danhMucService.update(1, vo),
                "Phải ném AppException khi tên danh mục rỗng khi cập nhật");
    }

    @Test
    void update_shouldThrowWhenNameTooLong() {
        DanhMuc existing = new DanhMuc();
        existing.setId(1);
        existing.setTenDanhMuc("Áo khoác");
        when(danhMucRepository.findById(1)).thenReturn(Optional.of(existing));

        DanhMucUpdateVO vo = new DanhMucUpdateVO();
        vo.setTenDanhMuc("A".repeat(51));

        assertThrows(AppException.class, () -> danhMucService.update(1, vo),
                "Phải ném AppException khi tên danh mục vượt quá 50 ký tự");
    }

    @Test
    void update_shouldThrowWhenNewNameDuplicatesAnotherRecord() {
        DanhMuc existing = new DanhMuc();
        existing.setId(1);
        existing.setTenDanhMuc("Áo khoác");
        when(danhMucRepository.findById(1)).thenReturn(Optional.of(existing));
        when(danhMucRepository.existsByTenDanhMuc("Quần dài")).thenReturn(true);

        DanhMucUpdateVO vo = new DanhMucUpdateVO();
        vo.setTenDanhMuc("Quần dài");

        assertThrows(AppException.class, () -> danhMucService.update(1, vo),
                "Phải ném AppException khi tên mới đã được dùng bởi bản ghi khác");
    }

    @Test
    void update_shouldAllowSameNameSameRecord() {
        DanhMuc existing = new DanhMuc();
        existing.setId(1);
        existing.setTenDanhMuc("Áo khoác");
        when(danhMucRepository.findById(1)).thenReturn(Optional.of(existing));
        when(danhMucRepository.existsByTenDanhMuc("Áo khoác")).thenReturn(true);

        DanhMucUpdateVO vo = new DanhMucUpdateVO();
        vo.setTenDanhMuc("Áo khoác");

        assertDoesNotThrow(() -> danhMucService.update(1, vo),
                "Không được ném ngoại lệ khi cập nhật với chính tên hiện tại");
        verify(danhMucRepository, times(1)).save(existing);
    }

    // --- query() tests ---

    @Test
    void query_shouldReturnPagedResultsWithNameFilter() {
        DanhMuc dm1 = new DanhMuc();
        dm1.setId(1);
        dm1.setTenDanhMuc("Áo khoác");

        DanhMuc dm2 = new DanhMuc();
        dm2.setId(2);
        dm2.setTenDanhMuc("Quần dài");

        Page<DanhMuc> mockPage = new PageImpl<>(Arrays.asList(dm1, dm2));
        when(danhMucRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(mockPage);

        DanhMucQueryVO queryVO = new DanhMucQueryVO();
        queryVO.setTenDanhMuc("Áo");
        queryVO.setPage(0);
        queryVO.setSize(10);

        Page<DanhMucDTO> result = danhMucService.query(queryVO);

        assertEquals(2, result.getTotalElements());
        assertEquals("Áo khoác", result.getContent().get(0).getTenDanhMuc());
    }

    @Test
    void query_shouldFilterByMaDanhMuc() {
        DanhMuc dm = new DanhMuc();
        dm.setId(1);
        dm.setMaDanhMuc("DM0001");
        dm.setTenDanhMuc("Áo khoác");

        Page<DanhMuc> mockPage = new PageImpl<>(List.of(dm));
        when(danhMucRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(mockPage);

        DanhMucQueryVO queryVO = new DanhMucQueryVO();
        queryVO.setMaDanhMuc("DM0001");
        queryVO.setPage(0);
        queryVO.setSize(10);

        Page<DanhMucDTO> result = danhMucService.query(queryVO);

        assertEquals(1, result.getTotalElements());
        assertEquals("DM0001", result.getContent().get(0).getMaDanhMuc());
    }

    @Test
    void query_shouldReturnEmptyPageWhenNoResults() {
        Page<DanhMuc> mockPage = new PageImpl<>(List.of());
        when(danhMucRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(mockPage);

        DanhMucQueryVO queryVO = new DanhMucQueryVO();

        Page<DanhMucDTO> result = danhMucService.query(queryVO);

        assertNotNull(result);
        assertEquals(0, result.getTotalElements());
    }

    // --- findAll() tests ---

    @Test
    void findAll_shouldReturnAllCategories() {
        DanhMuc dm1 = new DanhMuc();
        dm1.setId(1);
        dm1.setTenDanhMuc("Áo khoác");

        DanhMuc dm2 = new DanhMuc();
        dm2.setId(2);
        dm2.setTenDanhMuc("Quần dài");

        when(danhMucRepository.findAll()).thenReturn(Arrays.asList(dm1, dm2));

        List<DanhMucDTO> result = danhMucService.findAll();

        assertEquals(2, result.size());
        assertEquals("Áo khoác", result.get(0).getTenDanhMuc());
        assertEquals("Quần dài", result.get(1).getTenDanhMuc());
    }

    @Test
    void findAll_shouldReturnEmptyListWhenNoCategories() {
        when(danhMucRepository.findAll()).thenReturn(List.of());

        List<DanhMucDTO> result = danhMucService.findAll();

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }
}
