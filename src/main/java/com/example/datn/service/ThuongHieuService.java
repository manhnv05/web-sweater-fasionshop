package com.example.datn.service;

import com.example.datn.dto.TayAoDTO;
import com.example.datn.dto.ThuongHieuDTO;
import com.example.datn.entity.TayAo;
import com.example.datn.entity.ThuongHieu;
import com.example.datn.exception.AppException;
import com.example.datn.exception.ErrorCode;
import com.example.datn.repository.ThuongHieuRepository;
import com.example.datn.vo.tayAoVO.TayAoVO;
import com.example.datn.vo.thuongHieuVO.ThuongHieuQueryVO;
import com.example.datn.vo.thuongHieuVO.ThuongHieuUpdateVO;
import com.example.datn.vo.thuongHieuVO.ThuongHieuVO;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
public class ThuongHieuService {

    @Autowired
    private ThuongHieuRepository thuongHieuRepository;

    public ThuongHieuDTO save(ThuongHieuVO vO) {
        // Kiểm tra trống
        if (vO.getTenThuongHieu() == null || vO.getTenThuongHieu().trim().isEmpty()) {
            throw new AppException(ErrorCode.THUONGHIEU_NAME_EMPTY);
        }
        // Kiểm tra quá ký tự
        if (vO.getTenThuongHieu().length() > 50) {
            throw new AppException(ErrorCode.THUONGHIEU_NAME_TOO_LONG,
                    ErrorCode.THUONGHIEU_NAME_TOO_LONG.getErrorMessage(50));
        }
        // Kiểm tra trùng tên
        if (thuongHieuRepository.existsByTenThuongHieu(vO.getTenThuongHieu().trim())) {
            throw new AppException(ErrorCode.THUONGHIEU_NAME_DUPLICATE);
        }

        Integer maxCode = thuongHieuRepository.findMaxMaThuongHieuCode();
        int nextCode = (maxCode != null ? maxCode : 0) + 1;
        String maThuongHieu = String.format("TH%04d", nextCode);

        ThuongHieu bean = new ThuongHieu();

        if ( thuongHieuRepository.existsByTenThuongHieu(vO.getTenThuongHieu())){
            throw new AppException(ErrorCode.THE_BRAND_ALREADY_EXISTS);
        }
        BeanUtils.copyProperties(vO, bean);
        bean.setMaThuongHieu(maThuongHieu);
        bean.setTrangThai(1);
        bean = thuongHieuRepository.save(bean);

        // Trả về DTO luôn, hoặc nếu muốn trả về id thì return bean.getId();
        ThuongHieuDTO dto = new ThuongHieuDTO();
        BeanUtils.copyProperties(bean, dto);
        return dto;
    }

    public void delete(Integer id) {
        thuongHieuRepository.deleteById(id);
    }

    public void update(Integer id, ThuongHieuUpdateVO vO) {
        ThuongHieu bean = requireOne(id);
        // Kiểm tra trống
        if (vO.getTenThuongHieu() == null || vO.getTenThuongHieu().trim().isEmpty()) {
            throw new AppException(ErrorCode.THUONGHIEU_NAME_EMPTY);
        }
        // Kiểm tra quá ký tự
        if (vO.getTenThuongHieu().length() > 50) {
            throw new AppException(ErrorCode.THUONGHIEU_NAME_TOO_LONG,
                    String.format(ErrorCode.THUONGHIEU_NAME_TOO_LONG.getErrorMessage(), 50));
        }
        // Kiểm tra trùng tên (trừ chính bản ghi đang sửa)
        String newName = vO.getTenThuongHieu().trim();
        if (thuongHieuRepository.existsByTenThuongHieu(newName)
                && !bean.getTenThuongHieu().equalsIgnoreCase(newName)) {
            throw new AppException(ErrorCode.THUONGHIEU_NAME_DUPLICATE);
        }
        BeanUtils.copyProperties(vO, bean);
        thuongHieuRepository.save(bean);
    }

    public ThuongHieuDTO getById(Integer id) {
        ThuongHieu original = requireOne(id);
        return toDTO(original);
    }

    // Query động theo tên/mã/trạng thái, phân trang
    public Page<ThuongHieuDTO> query(ThuongHieuQueryVO vO) {
        int page = vO.getPage() != null ? vO.getPage() : 0;
        int size = vO.getSize() != null ? vO.getSize() : 10;
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));

        Page<ThuongHieu> entities = thuongHieuRepository.findAll((root, query, cb) -> {
            var predicates = cb.conjunction();

            if (vO.getTenThuongHieu() != null && !vO.getTenThuongHieu().isEmpty()) {
                predicates = cb.and(predicates,
                        cb.like(cb.lower(root.get("tenThuongHieu")), "%" + vO.getTenThuongHieu().toLowerCase() + "%"));
            }
            if (vO.getMaThuongHieu() != null && !vO.getMaThuongHieu().isEmpty()) {
                predicates = cb.and(predicates,
                        cb.like(cb.lower(root.get("maThuongHieu")), "%" + vO.getMaThuongHieu().toLowerCase() + "%"));
            }
            if (vO.getTrangThai() != null) {
                predicates = cb.and(predicates, cb.equal(root.get("trangThai"), vO.getTrangThai()));
            }
            return predicates;
        }, pageable);

        return entities.map(this::toDTO);
    }

    // Lấy toàn bộ thương hiệu (cho /thuongHieu/all)
    public List<ThuongHieuDTO> findAll() {
        return thuongHieuRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private ThuongHieuDTO toDTO(ThuongHieu original) {
        ThuongHieuDTO bean = new ThuongHieuDTO();
        BeanUtils.copyProperties(original, bean);
        return bean;
    }

    private ThuongHieu requireOne(Integer id) {
        return thuongHieuRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Resource not found: " + id));
    }
}