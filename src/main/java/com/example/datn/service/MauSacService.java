package com.example.datn.service;

import com.example.datn.dto.MauSacDTO;
import com.example.datn.entity.MauSac;
import com.example.datn.exception.AppException;
import com.example.datn.exception.ErrorCode;
import com.example.datn.repository.MauSacRepository;
import com.example.datn.vo.mauSacVO.MauSacQueryVO;
import com.example.datn.vo.mauSacVO.MauSacUpdateVO;
import com.example.datn.vo.mauSacVO.MauSacVO;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
public class MauSacService {

    @Autowired
    private MauSacRepository mauSacRepository;

    public Integer save(MauSacVO vO) {
        MauSac bean = new MauSac();
        if (mauSacRepository.existsMauSacByTenMauSac(vO.getTenMauSac())){
            throw  new AppException(ErrorCode.THE_COLOR_ALREADY_EXISTS);
        }
        BeanUtils.copyProperties(vO, bean);
        bean = mauSacRepository.save(bean);
        return bean.getId();
    }

    public void delete(Integer id) {
        mauSacRepository.deleteById(id);
    }

    public void update(Integer id, MauSacUpdateVO vO) {
        MauSac bean = requireOne(id);
        BeanUtils.copyProperties(vO, bean);
        mauSacRepository.save(bean);
    }

    public MauSacDTO getById(Integer id) {
        MauSac original = requireOne(id);
        return toDTO(original);
    }

    public Page<MauSacDTO> query(MauSacQueryVO vO) {
        int page = vO.getPage() != null ? vO.getPage() : 0;
        int size = vO.getSize() != null ? vO.getSize() : 10;
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));

        Page<MauSac> entities = mauSacRepository.findAll((root, query, cb) -> {
            var predicates = cb.conjunction();

            if (vO.getTenMauSac() != null && !vO.getTenMauSac().isEmpty()) {
                predicates = cb.and(predicates,
                        cb.like(cb.lower(root.get("tenMauSac")), "%" + vO.getTenMauSac().toLowerCase() + "%"));
            }
            if (vO.getMaMau() != null && !vO.getMaMau().isEmpty()) {
                predicates = cb.and(predicates,
                        cb.like(cb.lower(root.get("maMau")), "%" + vO.getMaMau().toLowerCase() + "%"));
            }
            if (vO.getTrangThai() != null) {
                predicates = cb.and(predicates, cb.equal(root.get("trangThai"), vO.getTrangThai()));
            }
            if (vO.getId() != null) {
                predicates = cb.and(predicates, cb.equal(root.get("id"), vO.getId()));
            }
            return predicates;
        }, pageable);

        return entities.map(this::toDTO);
    }

    // Thêm hàm lấy toàn bộ màu sắc (cho select động FE)
    public List<MauSacDTO> findAll() {
        return mauSacRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private MauSacDTO toDTO(MauSac original) {
        MauSacDTO bean = new MauSacDTO();
        BeanUtils.copyProperties(original, bean);
        return bean;
    }

    private MauSac requireOne(Integer id) {
        return mauSacRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Resource not found: " + id));
    }
}