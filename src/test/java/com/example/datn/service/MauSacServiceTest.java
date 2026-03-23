package com.example.datn.service;

import com.example.datn.dto.MauSacDTO;
import com.example.datn.entity.MauSac;
import com.example.datn.exception.AppException;
import com.example.datn.repository.MauSacRepository;
import com.example.datn.vo.mauSacVO.MauSacQueryVO;
import com.example.datn.vo.mauSacVO.MauSacUpdateVO;
import com.example.datn.vo.mauSacVO.MauSacVO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
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

class MauSacServiceTest {

    @Mock
    private MauSacRepository mauSacRepository;

    @InjectMocks
    private MauSacService mauSacService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    // --- save() validation tests ---

    @Test
    void save_shouldThrowWhenNameIsNull() {
        MauSacVO vo = new MauSacVO();
        vo.setTenMauSac(null);

        assertThrows(AppException.class, () -> mauSacService.save(vo),
                "Phải ném AppException khi tên màu sắc là null");
    }

    @Test
    void save_shouldThrowWhenNameIsEmpty() {
        MauSacVO vo = new MauSacVO();
        vo.setTenMauSac("   ");

        assertThrows(AppException.class, () -> mauSacService.save(vo),
                "Phải ném AppException khi tên màu sắc là chuỗi trắng");
    }

    @Test
    void save_shouldThrowWhenNameTooLong() {
        MauSacVO vo = new MauSacVO();
        vo.setTenMauSac("A".repeat(51));

        assertThrows(AppException.class, () -> mauSacService.save(vo),
                "Phải ném AppException khi tên màu sắc vượt quá 50 ký tự");
    }

    @Test
    void save_shouldThrowWhenNameIsDuplicate() {
        MauSacVO vo = new MauSacVO();
        vo.setTenMauSac("đỏ");

        when(mauSacRepository.existsByTenMauSac("đỏ")).thenReturn(true);

        assertThrows(AppException.class, () -> mauSacService.save(vo),
                "Phải ném AppException khi tên màu sắc đã tồn tại");
    }

    @Test
    void save_shouldSetKnownHexColorForRed() {
        MauSacVO vo = new MauSacVO();
        vo.setTenMauSac("đỏ");

        when(mauSacRepository.existsByTenMauSac(anyString())).thenReturn(false);

        MauSac saved = new MauSac();
        saved.setId(1);
        saved.setTenMauSac("đỏ");
        saved.setMaMau("#FF0000");
        saved.setTrangThai(1);
        when(mauSacRepository.save(any(MauSac.class))).thenReturn(saved);

        mauSacService.save(vo);

        ArgumentCaptor<MauSac> captor = ArgumentCaptor.forClass(MauSac.class);
        verify(mauSacRepository).save(captor.capture());
        assertEquals("#FF0000", captor.getValue().getMaMau(),
                "Màu đỏ phải được map sang hex #FF0000");
    }

    @Test
    void save_shouldSetKnownHexColorForGreen() {
        MauSacVO vo = new MauSacVO();
        vo.setTenMauSac("xanh lá");

        when(mauSacRepository.existsByTenMauSac(anyString())).thenReturn(false);

        MauSac saved = new MauSac();
        saved.setId(2);
        saved.setTenMauSac("xanh lá");
        saved.setMaMau("#4CAF50");
        saved.setTrangThai(1);
        when(mauSacRepository.save(any(MauSac.class))).thenReturn(saved);

        mauSacService.save(vo);

        ArgumentCaptor<MauSac> captor = ArgumentCaptor.forClass(MauSac.class);
        verify(mauSacRepository).save(captor.capture());
        assertEquals("#4CAF50", captor.getValue().getMaMau(),
                "Màu xanh lá phải được map sang hex #4CAF50");
    }

    @Test
    void save_shouldSetDefaultHexForUnknownColor() {
        MauSacVO vo = new MauSacVO();
        vo.setTenMauSac("màu lạ không xác định");

        when(mauSacRepository.existsByTenMauSac(anyString())).thenReturn(false);

        MauSac saved = new MauSac();
        saved.setId(3);
        saved.setTenMauSac("màu lạ không xác định");
        saved.setMaMau("#000000");
        saved.setTrangThai(1);
        when(mauSacRepository.save(any(MauSac.class))).thenReturn(saved);

        mauSacService.save(vo);

        ArgumentCaptor<MauSac> captor = ArgumentCaptor.forClass(MauSac.class);
        verify(mauSacRepository).save(captor.capture());
        assertEquals("#000000", captor.getValue().getMaMau(),
                "Màu không xác định phải dùng hex mặc định #000000");
    }

    @Test
    void save_shouldSetDefaultHexForNullColorName() {
        // getHexColorFromName with null returns #000000
        MauSacVO vo = new MauSacVO();
        // tenMauSac = "test" but simulate the private method with a name not in the map
        vo.setTenMauSac("unknown");

        when(mauSacRepository.existsByTenMauSac(anyString())).thenReturn(false);

        MauSac saved = new MauSac();
        saved.setId(4);
        saved.setTenMauSac("unknown");
        saved.setMaMau("#000000");
        saved.setTrangThai(1);
        when(mauSacRepository.save(any(MauSac.class))).thenReturn(saved);

        mauSacService.save(vo);

        ArgumentCaptor<MauSac> captor = ArgumentCaptor.forClass(MauSac.class);
        verify(mauSacRepository).save(captor.capture());
        assertEquals("#000000", captor.getValue().getMaMau());
    }

    @Test
    void save_shouldSucceedAndReturnDTO() {
        MauSacVO vo = new MauSacVO();
        vo.setTenMauSac("trắng");

        when(mauSacRepository.existsByTenMauSac(anyString())).thenReturn(false);

        MauSac saved = new MauSac();
        saved.setId(5);
        saved.setTenMauSac("trắng");
        saved.setMaMau("#FFFFFF");
        saved.setTrangThai(1);
        when(mauSacRepository.save(any(MauSac.class))).thenReturn(saved);

        MauSacDTO result = mauSacService.save(vo);

        assertNotNull(result);
        assertEquals("trắng", result.getTenMauSac());
        assertEquals("#FFFFFF", result.getMaMau());
        assertEquals(1, result.getTrangThai());
    }

    // --- getById() tests ---

    @Test
    void getById_shouldReturnDTOWhenFound() {
        MauSac entity = new MauSac();
        entity.setId(1);
        entity.setTenMauSac("đen");
        entity.setMaMau("#000000");
        entity.setTrangThai(1);

        when(mauSacRepository.findById(1)).thenReturn(Optional.of(entity));

        MauSacDTO result = mauSacService.getById(1);

        assertNotNull(result);
        assertEquals(1, result.getId());
        assertEquals("đen", result.getTenMauSac());
        assertEquals("#000000", result.getMaMau());
    }

    @Test
    void getById_shouldThrowWhenNotFound() {
        when(mauSacRepository.findById(99)).thenReturn(Optional.empty());

        assertThrows(NoSuchElementException.class, () -> mauSacService.getById(99),
                "Phải ném NoSuchElementException khi không tìm thấy màu sắc");
    }

    // --- delete() tests ---

    @Test
    void delete_shouldCallRepositoryDeleteById() {
        doNothing().when(mauSacRepository).deleteById(1);

        mauSacService.delete(1);

        verify(mauSacRepository, times(1)).deleteById(1);
    }

    // --- update() tests ---

    @Test
    void update_shouldThrowWhenNameIsEmpty() {
        MauSac existing = new MauSac();
        existing.setId(1);
        existing.setTenMauSac("đỏ");
        when(mauSacRepository.findById(1)).thenReturn(Optional.of(existing));

        MauSacUpdateVO vo = new MauSacUpdateVO();
        vo.setTenMauSac("");

        assertThrows(AppException.class, () -> mauSacService.update(1, vo),
                "Phải ném AppException khi tên màu rỗng khi cập nhật");
    }

    @Test
    void update_shouldThrowWhenNameTooLong() {
        MauSac existing = new MauSac();
        existing.setId(1);
        existing.setTenMauSac("đỏ");
        when(mauSacRepository.findById(1)).thenReturn(Optional.of(existing));

        MauSacUpdateVO vo = new MauSacUpdateVO();
        vo.setTenMauSac("A".repeat(51));

        assertThrows(AppException.class, () -> mauSacService.update(1, vo),
                "Phải ném AppException khi tên màu vượt quá 50 ký tự");
    }

    @Test
    void update_shouldThrowWhenNewNameDuplicatesAnotherRecord() {
        MauSac existing = new MauSac();
        existing.setId(1);
        existing.setTenMauSac("đỏ");
        when(mauSacRepository.findById(1)).thenReturn(Optional.of(existing));
        when(mauSacRepository.existsByTenMauSac("xanh")).thenReturn(true);

        MauSacUpdateVO vo = new MauSacUpdateVO();
        vo.setTenMauSac("xanh");

        assertThrows(AppException.class, () -> mauSacService.update(1, vo),
                "Phải ném AppException khi tên mới đã được dùng bởi bản ghi khác");
    }

    @Test
    void update_shouldAllowSameNameSameRecord() {
        MauSac existing = new MauSac();
        existing.setId(1);
        existing.setTenMauSac("đỏ");
        when(mauSacRepository.findById(1)).thenReturn(Optional.of(existing));
        when(mauSacRepository.existsByTenMauSac("đỏ")).thenReturn(true);

        MauSacUpdateVO vo = new MauSacUpdateVO();
        vo.setTenMauSac("đỏ");

        assertDoesNotThrow(() -> mauSacService.update(1, vo),
                "Không được ném ngoại lệ khi cập nhật với chính tên hiện tại");
        verify(mauSacRepository, times(1)).save(existing);
    }

    // --- query() tests ---

    @Test
    void query_shouldReturnPagedResultsWithNameFilter() {
        MauSac ms1 = new MauSac();
        ms1.setId(1);
        ms1.setTenMauSac("đỏ");

        MauSac ms2 = new MauSac();
        ms2.setId(2);
        ms2.setTenMauSac("xanh lá");

        Page<MauSac> mockPage = new PageImpl<>(Arrays.asList(ms1, ms2));
        when(mauSacRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(mockPage);

        MauSacQueryVO queryVO = new MauSacQueryVO();
        queryVO.setTenMauSac("đỏ");
        queryVO.setPage(0);
        queryVO.setSize(10);

        Page<MauSacDTO> result = mauSacService.query(queryVO);

        assertEquals(2, result.getTotalElements());
        assertEquals("đỏ", result.getContent().get(0).getTenMauSac());
    }

    @Test
    void query_shouldReturnEmptyPageWhenNoResults() {
        Page<MauSac> mockPage = new PageImpl<>(List.of());
        when(mauSacRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(mockPage);

        MauSacQueryVO queryVO = new MauSacQueryVO();

        Page<MauSacDTO> result = mauSacService.query(queryVO);

        assertNotNull(result);
        assertEquals(0, result.getTotalElements());
    }

    // --- findAll() tests ---

    @Test
    void findAll_shouldReturnAllColors() {
        MauSac ms1 = new MauSac();
        ms1.setId(1);
        ms1.setTenMauSac("đỏ");

        MauSac ms2 = new MauSac();
        ms2.setId(2);
        ms2.setTenMauSac("xanh dương");

        when(mauSacRepository.findAll()).thenReturn(Arrays.asList(ms1, ms2));

        List<MauSacDTO> result = mauSacService.findAll();

        assertEquals(2, result.size());
        assertEquals("đỏ", result.get(0).getTenMauSac());
        assertEquals("xanh dương", result.get(1).getTenMauSac());
    }

    @Test
    void findAll_shouldReturnEmptyListWhenNoColors() {
        when(mauSacRepository.findAll()).thenReturn(List.of());

        List<MauSacDTO> result = mauSacService.findAll();

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }
}
