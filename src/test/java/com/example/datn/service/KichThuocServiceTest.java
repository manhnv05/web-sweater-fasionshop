package com.example.datn.service;

import com.example.datn.dto.KichThuocDTO;
import com.example.datn.entity.KichThuoc;
import com.example.datn.exception.AppException;
import com.example.datn.repository.KichThuocRepository;
import com.example.datn.vo.kichThuocVO.KichThuocQueryVO;
import com.example.datn.vo.kichThuocVO.KichThuocUpdateVO;
import com.example.datn.vo.kichThuocVO.KichThuocVO;
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

class KichThuocServiceTest {

    @Mock
    private KichThuocRepository kichThuocRepository;

    @InjectMocks
    private KichThuocService kichThuocService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    // --- save() tests ---

    @Test
    void save_shouldThrowWhenNameIsNull() {
        KichThuocVO vo = new KichThuocVO();
        vo.setTenKichCo(null);

        assertThrows(AppException.class, () -> kichThuocService.save(vo),
                "Phải ném AppException khi tên kích cỡ là null");
    }

    @Test
    void save_shouldThrowWhenNameIsEmpty() {
        KichThuocVO vo = new KichThuocVO();
        vo.setTenKichCo("   ");

        assertThrows(AppException.class, () -> kichThuocService.save(vo),
                "Phải ném AppException khi tên kích cỡ là chuỗi trắng");
    }

    @Test
    void save_shouldThrowWhenNameTooLong() {
        KichThuocVO vo = new KichThuocVO();
        vo.setTenKichCo("A".repeat(51));

        assertThrows(AppException.class, () -> kichThuocService.save(vo),
                "Phải ném AppException khi tên kích cỡ vượt quá 50 ký tự");
    }

    @Test
    void save_shouldThrowWhenNameIsDuplicate() {
        KichThuocVO vo = new KichThuocVO();
        vo.setTenKichCo("Small");

        when(kichThuocRepository.existsByTenKichCo("Small")).thenReturn(true);

        assertThrows(AppException.class, () -> kichThuocService.save(vo),
                "Phải ném AppException khi tên kích cỡ đã tồn tại");
    }

    @Test
    void save_shouldSucceedAndGenerateCodeKT0001WhenNoExisting() {
        KichThuocVO vo = new KichThuocVO();
        vo.setTenKichCo("Small");

        when(kichThuocRepository.existsByTenKichCo(anyString())).thenReturn(false);
        when(kichThuocRepository.findMaxMaKichCoCode()).thenReturn(null);

        KichThuoc saved = new KichThuoc();
        saved.setId(1);
        saved.setMa("KT0001");
        saved.setTenKichCo("Small");
        saved.setTrangThai(1);
        when(kichThuocRepository.save(any(KichThuoc.class))).thenReturn(saved);

        KichThuocDTO result = kichThuocService.save(vo);

        assertNotNull(result);
        assertEquals("KT0001", result.getMa());
        assertEquals("Small", result.getTenKichCo());
        assertEquals(1, result.getTrangThai());
    }

    @Test
    void save_shouldGenerateNextCodeWhenExistingCodesPresent() {
        KichThuocVO vo = new KichThuocVO();
        vo.setTenKichCo("XL");

        when(kichThuocRepository.existsByTenKichCo(anyString())).thenReturn(false);
        when(kichThuocRepository.findMaxMaKichCoCode()).thenReturn(5);

        KichThuoc saved = new KichThuoc();
        saved.setId(6);
        saved.setMa("KT0006");
        saved.setTenKichCo("XL");
        saved.setTrangThai(1);
        when(kichThuocRepository.save(any(KichThuoc.class))).thenReturn(saved);

        KichThuocDTO result = kichThuocService.save(vo);

        assertNotNull(result);
        assertEquals("KT0006", result.getMa());
    }

    // --- getById() tests ---

    @Test
    void getById_shouldReturnDTOWhenFound() {
        KichThuoc entity = new KichThuoc();
        entity.setId(1);
        entity.setMa("KT0001");
        entity.setTenKichCo("Small");
        entity.setTrangThai(1);

        when(kichThuocRepository.findById(1)).thenReturn(Optional.of(entity));

        KichThuocDTO result = kichThuocService.getById(1);

        assertNotNull(result);
        assertEquals(1, result.getId());
        assertEquals("KT0001", result.getMa());
        assertEquals("Small", result.getTenKichCo());
    }

    @Test
    void getById_shouldThrowWhenNotFound() {
        when(kichThuocRepository.findById(99)).thenReturn(Optional.empty());

        assertThrows(NoSuchElementException.class, () -> kichThuocService.getById(99),
                "Phải ném NoSuchElementException khi không tìm thấy kích cỡ");
    }

    // --- delete() tests ---

    @Test
    void delete_shouldCallRepositoryDeleteById() {
        doNothing().when(kichThuocRepository).deleteById(1);

        kichThuocService.delete(1);

        verify(kichThuocRepository, times(1)).deleteById(1);
    }

    // --- update() tests ---

    @Test
    void update_shouldThrowWhenNameIsEmpty() {
        KichThuoc existing = new KichThuoc();
        existing.setId(1);
        existing.setTenKichCo("Small");
        when(kichThuocRepository.findById(1)).thenReturn(Optional.of(existing));

        KichThuocUpdateVO vo = new KichThuocUpdateVO();
        vo.setTenKichCo("");

        assertThrows(AppException.class, () -> kichThuocService.update(1, vo),
                "Phải ném AppException khi tên kích cỡ rỗng khi cập nhật");
    }

    @Test
    void update_shouldThrowWhenNameTooLong() {
        KichThuoc existing = new KichThuoc();
        existing.setId(1);
        existing.setTenKichCo("Small");
        when(kichThuocRepository.findById(1)).thenReturn(Optional.of(existing));

        KichThuocUpdateVO vo = new KichThuocUpdateVO();
        vo.setTenKichCo("A".repeat(51));

        assertThrows(AppException.class, () -> kichThuocService.update(1, vo),
                "Phải ném AppException khi tên kích cỡ vượt quá 50 ký tự");
    }

    @Test
    void update_shouldThrowWhenNewNameDuplicatesAnotherRecord() {
        KichThuoc existing = new KichThuoc();
        existing.setId(1);
        existing.setTenKichCo("Small");
        when(kichThuocRepository.findById(1)).thenReturn(Optional.of(existing));
        when(kichThuocRepository.existsByTenKichCo("Medium")).thenReturn(true);

        KichThuocUpdateVO vo = new KichThuocUpdateVO();
        vo.setTenKichCo("Medium");

        assertThrows(AppException.class, () -> kichThuocService.update(1, vo),
                "Phải ném AppException khi tên mới đã được dùng bởi bản ghi khác");
    }

    @Test
    void update_shouldAllowSameNameSameRecord() {
        KichThuoc existing = new KichThuoc();
        existing.setId(1);
        existing.setTenKichCo("Small");
        when(kichThuocRepository.findById(1)).thenReturn(Optional.of(existing));
        // existsByTenKichCo returns true but it is the same record → no duplicate exception
        when(kichThuocRepository.existsByTenKichCo("Small")).thenReturn(true);

        KichThuocUpdateVO vo = new KichThuocUpdateVO();
        vo.setTenKichCo("Small");

        assertDoesNotThrow(() -> kichThuocService.update(1, vo),
                "Không được ném ngoại lệ khi cập nhật với chính tên hiện tại");
        verify(kichThuocRepository, times(1)).save(existing);
    }

    // --- query() tests ---

    @Test
    void query_shouldReturnPagedResultsWithNameFilter() {
        KichThuoc kt1 = new KichThuoc();
        kt1.setId(1);
        kt1.setTenKichCo("Small");
        kt1.setTrangThai(1);

        KichThuoc kt2 = new KichThuoc();
        kt2.setId(2);
        kt2.setTenKichCo("Medium");
        kt2.setTrangThai(1);

        Page<KichThuoc> mockPage = new PageImpl<>(Arrays.asList(kt1, kt2));
        when(kichThuocRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(mockPage);

        KichThuocQueryVO queryVO = new KichThuocQueryVO();
        queryVO.setTenKichCo("m");
        queryVO.setPage(0);
        queryVO.setSize(10);

        Page<KichThuocDTO> result = kichThuocService.query(queryVO);

        assertEquals(2, result.getTotalElements());
        assertEquals("Small", result.getContent().get(0).getTenKichCo());
        assertEquals("Medium", result.getContent().get(1).getTenKichCo());
    }

    @Test
    void query_shouldUseDefaultPageSizeWhenNotProvided() {
        Page<KichThuoc> mockPage = new PageImpl<>(List.of());
        when(kichThuocRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(mockPage);

        KichThuocQueryVO queryVO = new KichThuocQueryVO();
        // page and size are null → defaults to 0 and 10

        Page<KichThuocDTO> result = kichThuocService.query(queryVO);

        assertNotNull(result);
        assertEquals(0, result.getTotalElements());
    }

    // --- findAll() tests ---

    @Test
    void findAll_shouldReturnAllSizes() {
        KichThuoc kt1 = new KichThuoc();
        kt1.setId(1);
        kt1.setTenKichCo("Small");

        KichThuoc kt2 = new KichThuoc();
        kt2.setId(2);
        kt2.setTenKichCo("Large");

        when(kichThuocRepository.findAll()).thenReturn(Arrays.asList(kt1, kt2));

        List<KichThuocDTO> result = kichThuocService.findAll();

        assertEquals(2, result.size());
        assertEquals("Small", result.get(0).getTenKichCo());
        assertEquals("Large", result.get(1).getTenKichCo());
    }

    @Test
    void findAll_shouldReturnEmptyListWhenNoSizes() {
        when(kichThuocRepository.findAll()).thenReturn(List.of());

        List<KichThuocDTO> result = kichThuocService.findAll();

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }
}
