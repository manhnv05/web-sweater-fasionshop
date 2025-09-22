package com.example.datn.service;

import com.example.datn.dto.ThuongHieuDTO;
import com.example.datn.entity.ThuongHieu;
import com.example.datn.exception.AppException;
import com.example.datn.exception.ErrorCode;
import com.example.datn.repository.ThuongHieuRepository;
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

    public Integer save(ThuongHieuVO vO) {
        ThuongHieu entity = new ThuongHieu();
        if (thuongHieuRepository.existsThuongHieuByTenThuongHieu(vO.getTenThuongHieu())) {
            throw new AppException(ErrorCode.THE_BRAND_ALREADY_EXISTS);
        }
        BeanUtils.copyProperties(vO, entity);
        entity = thuongHieuRepository.save(entity);
        return entity.getId();
    }

    public void delete(Integer id) {
        thuongHieuRepository.deleteById(id);
    }

    public void update(Integer id, ThuongHieuUpdateVO vO) {
        ThuongHieu entity = requireOne(id);
        BeanUtils.copyProperties(vO, entity);
        thuongHieuRepository.save(entity);
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