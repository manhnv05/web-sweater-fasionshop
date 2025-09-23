package com.example.datn.service;

import com.example.datn.dto.ChatLieuDTO;
import com.example.datn.dto.KichThuocDTO;
import com.example.datn.entity.ChatLieu;
import com.example.datn.entity.KichThuoc;
import com.example.datn.exception.AppException;
import com.example.datn.exception.ErrorCode;
import com.example.datn.repository.KichThuocRepository;
import com.example.datn.vo.chatLieuVO.ChatLieuUpdateVO;
import com.example.datn.vo.chatLieuVO.ChatLieuVO;
import com.example.datn.vo.kichThuocVO.KichThuocQueryVO;
import com.example.datn.vo.kichThuocVO.KichThuocUpdateVO;
import com.example.datn.vo.kichThuocVO.KichThuocVO;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
public class KichThuocService {

    @Autowired
    private KichThuocRepository kichThuocRepository;

    public KichThuocDTO save(KichThuocVO vO) {
        // Kiểm tra trống
        if (vO.getTenKichCo() == null || vO.getTenKichCo().trim().isEmpty()) {
            throw new AppException(ErrorCode.KICHCO_NAME_EMPTY);
        }
        // Kiểm tra quá ký tự
        if (vO.getTenKichCo().length() > 50) {
            throw new AppException(ErrorCode.KICHCO_NAME_TOO_LONG,
                    ErrorCode.KICHCO_NAME_TOO_LONG.getErrorMessage(50));
        }
        // Kiểm tra trùng tên
        if (kichThuocRepository.existsByTenKichCo(vO.getTenKichCo().trim())) {
            throw new AppException(ErrorCode.KICHCO_NAME_DUPLICATE);
        }

        Integer maxCode = kichThuocRepository.findMaxMaKichCoCode();
        int nextCode = (maxCode != null ? maxCode : 0) + 1;
        String maKichThuoc = String.format("KT%04d", nextCode);

        KichThuoc bean = new KichThuoc();

        if ( kichThuocRepository.existsByTenKichCo(vO.getTenKichCo())){
            throw new AppException(ErrorCode.THE_SIZE_ALREADY_EXISTS);
        }
        BeanUtils.copyProperties(vO, bean);
        bean.setMa(maKichThuoc);
        bean.setTrangThai(1);
        bean = kichThuocRepository.save(bean);

        // Trả về DTO luôn, hoặc nếu muốn trả về id thì return bean.getId();
        KichThuocDTO dto = new KichThuocDTO();
        BeanUtils.copyProperties(bean, dto);
        return dto;
    }

    public void delete(Integer id) {
        kichThuocRepository.deleteById(id);
    }

    public void update(Integer id, KichThuocUpdateVO vO) {
        KichThuoc bean = requireOne(id);
        // Kiểm tra trống
        if (vO.getTenKichCo() == null || vO.getTenKichCo().trim().isEmpty()) {
            throw new AppException(ErrorCode.KICHCO_NAME_EMPTY);
        }
        // Kiểm tra quá ký tự
        if (vO.getTenKichCo().length() > 50) {
            throw new AppException(ErrorCode.KICHCO_NAME_TOO_LONG,
                    String.format(ErrorCode.KICHCO_NAME_TOO_LONG.getErrorMessage(), 50));
        }
        // Kiểm tra trùng tên (trừ chính bản ghi đang sửa)
        String newName = vO.getTenKichCo().trim();
        if (kichThuocRepository.existsByTenKichCo(newName)
                && !bean.getTenKichCo().equalsIgnoreCase(newName)) {
            throw new AppException(ErrorCode.KICHCO_NAME_DUPLICATE);
        }
        BeanUtils.copyProperties(vO, bean);
        kichThuocRepository.save(bean);
    }

    public KichThuocDTO getById(Integer id) {
        KichThuoc original = requireOne(id);
        return toDTO(original);
    }

    public Page<KichThuocDTO> query(KichThuocQueryVO vO) {
        int page = vO.getPage() != null ? vO.getPage() : 0;
        int size = vO.getSize() != null ? vO.getSize() : 10;
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));

        Page<KichThuoc> entities = kichThuocRepository.findAll((root, query, cb) -> {
            var predicates = cb.conjunction();

            if (vO.getMa() != null && !vO.getMa().isEmpty()) {
                predicates = cb.and(predicates,
                        cb.like(cb.lower(root.get("ma")), "%" + vO.getMa().toLowerCase() + "%"));
            }
            if (vO.getTenKichCo() != null && !vO.getTenKichCo().isEmpty()) {
                predicates = cb.and(predicates,
                        cb.like(cb.lower(root.get("tenKichCo")), "%" + vO.getTenKichCo().toLowerCase() + "%"));
            }
            if (vO.getTrangThai() != null) {
                predicates = cb.and(predicates, cb.equal(root.get("trangThai"), vO.getTrangThai()));
            }
            return predicates;
        }, pageable);

        return entities.map(this::toDTO);
    }

    // Thêm hàm lấy toàn bộ kích thước cho FE select option động
    public List<KichThuocDTO> findAll() {
        return kichThuocRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private KichThuocDTO toDTO(KichThuoc original) {
        KichThuocDTO bean = new KichThuocDTO();
        BeanUtils.copyProperties(original, bean);
        return bean;
    }

    private KichThuoc requireOne(Integer id) {
        return kichThuocRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Resource not found: " + id));
    }
}