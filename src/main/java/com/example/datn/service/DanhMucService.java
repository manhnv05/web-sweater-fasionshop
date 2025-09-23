package com.example.datn.service;

import com.example.datn.dto.ChatLieuDTO;
import com.example.datn.dto.DanhMucDTO;
import com.example.datn.entity.ChatLieu;
import com.example.datn.entity.DanhMuc;
import com.example.datn.exception.AppException;
import com.example.datn.exception.ErrorCode;
import com.example.datn.repository.DanhMucRepository;
import com.example.datn.vo.chatLieuVO.ChatLieuUpdateVO;
import com.example.datn.vo.danhMucVO.DanhMucQueryVO;
import com.example.datn.vo.danhMucVO.DanhMucUpdateVO;
import com.example.datn.vo.danhMucVO.DanhMucVO;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
public class DanhMucService {

    @Autowired
    private DanhMucRepository danhMucRepository;

    public DanhMucDTO save(DanhMucVO vO) {
        if (vO.getTenDanhMuc() == null || vO.getTenDanhMuc().trim().isEmpty()) {
            throw new AppException(ErrorCode.DANHMUC_NAME_EMPTY);
        }
        // Kiểm tra quá ký tự
        if (vO.getTenDanhMuc().length() > 50) {
            throw new AppException(ErrorCode.DANHMUC_NAME_TOO_LONG,
                    ErrorCode.DANHMUC_NAME_TOO_LONG.getErrorMessage(50));
        }
        // Kiểm tra trùng tên
        if (danhMucRepository.existsByTenDanhMuc(vO.getTenDanhMuc().trim())) {
            throw new AppException(ErrorCode.DANHMUC_NAME_DUPLICATE);
        }
        Integer maxCode = danhMucRepository.findMaxMaDanhMucCode();
        int nextCode = (maxCode != null ? maxCode : 0) + 1;
        String maDanhMuc = String.format("DM%04d", nextCode);

        DanhMuc bean = new DanhMuc();

        if ( danhMucRepository.existsByTenDanhMuc(vO.getTenDanhMuc())){
            throw new AppException(ErrorCode.THE_DIRECTORY_ALREADY_EXISTS);
        }
        BeanUtils.copyProperties(vO, bean);
        bean.setMaDanhMuc(maDanhMuc);
        bean.setTrangThai(1);
        bean = danhMucRepository.save(bean);

        // Trả về DTO luôn, hoặc nếu muốn trả về id thì return bean.getId();
        DanhMucDTO dto = new DanhMucDTO();
        BeanUtils.copyProperties(bean, dto);
        return dto;
    }

    public void delete(Integer id) {
        danhMucRepository.deleteById(id);
    }

    public void update(Integer id, DanhMucUpdateVO vO) {
        DanhMuc bean = requireOne(id);
        // Kiểm tra trống
        if (vO.getTenDanhMuc() == null || vO.getTenDanhMuc().trim().isEmpty()) {
            throw new AppException(ErrorCode.DANHMUC_NAME_EMPTY);
        }
        // Kiểm tra quá ký tự
        if (vO.getTenDanhMuc().length() > 50) {
            throw new AppException(ErrorCode.DANHMUC_NAME_TOO_LONG,
                    String.format(ErrorCode.DANHMUC_NAME_TOO_LONG.getErrorMessage(), 50));
        }
        // Kiểm tra trùng tên (trừ chính bản ghi đang sửa)
        String newName = vO.getTenDanhMuc().trim();
        if (danhMucRepository.existsByTenDanhMuc(newName)
                && !bean.getTenDanhMuc().equalsIgnoreCase(newName)) {
            throw new AppException(ErrorCode.DANHMUC_NAME_DUPLICATE);
        }
        BeanUtils.copyProperties(vO, bean);
        danhMucRepository.save(bean);
    }

    public DanhMucDTO getById(Integer id) {
        DanhMuc original = requireOne(id);
        return toDTO(original);
    }

    // Đã cài đặt phân trang và lọc theo các trường truy vấn
    public Page<DanhMucDTO> query(DanhMucQueryVO vO) {
        int page = vO.getPage() != null ? vO.getPage() : 0;
        int size = vO.getSize() != null ? vO.getSize() : 10;
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));

        Page<DanhMuc> entities = danhMucRepository.findAll((root, query, cb) -> {
            var predicates = cb.conjunction();

            if (vO.getTenDanhMuc() != null && !vO.getTenDanhMuc().isEmpty()) {
                predicates = cb.and(predicates,
                        cb.like(cb.lower(root.get("tenDanhMuc")), "%" + vO.getTenDanhMuc().toLowerCase() + "%"));
            }
            if (vO.getMaDanhMuc() != null && !vO.getMaDanhMuc().isEmpty()) {
                predicates = cb.and(predicates,
                        cb.like(cb.lower(root.get("maDanhMuc")), "%" + vO.getMaDanhMuc().toLowerCase() + "%"));
            }
            if (vO.getTrangThai() != null) {
                predicates = cb.and(predicates, cb.equal(root.get("trangThai"), vO.getTrangThai()));
            }
            return predicates;
        }, pageable);

        return entities.map(this::toDTO);
    }

    // Thêm hàm lấy tất cả danh mục để phục vụ FE select động
    public List<DanhMucDTO> findAll() {
        return danhMucRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private DanhMucDTO toDTO(DanhMuc original) {
        DanhMucDTO bean = new DanhMucDTO();
        BeanUtils.copyProperties(original, bean);
        return bean;
    }

    private DanhMuc requireOne(Integer id) {
        return danhMucRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Resource not found: " + id));
    }
}