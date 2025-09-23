package com.example.datn.service;

import com.example.datn.dto.CoAoDTO;
import com.example.datn.dto.DanhMucDTO;
import com.example.datn.entity.CoAo;
import com.example.datn.entity.DanhMuc;
import com.example.datn.exception.AppException;
import com.example.datn.exception.ErrorCode;
import com.example.datn.repository.CoAoRepository;
import com.example.datn.vo.coAoVO.CoAoQueryVO;
import com.example.datn.vo.coAoVO.CoAoUpdateVO;
import com.example.datn.vo.coAoVO.CoAoVO;
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
public class CoAoService {

    @Autowired
    private CoAoRepository coAoRepository;

    public CoAoDTO save(CoAoVO vO) {
        if (vO.getTenCoAo() == null || vO.getTenCoAo().trim().isEmpty()) {
            throw new AppException(ErrorCode.COAO_NAME_EMPTY);
        }
        // Kiểm tra quá ký tự
        if (vO.getTenCoAo().length() > 50) {
            throw new AppException(ErrorCode.COAO_NAME_TOO_LONG,
                    ErrorCode.COAO_NAME_TOO_LONG.getErrorMessage(50));
        }
        // Kiểm tra trùng tên
        if (coAoRepository.existsByTenCoAo(vO.getTenCoAo().trim())) {
            throw new AppException(ErrorCode.COAO_NAME_DUPLICATE);
        }
        Integer maxCode = coAoRepository.findMaxMaCoAoCode();
        int nextCode = (maxCode != null ? maxCode : 0) + 1;
        String maCoAo = String.format("CA%04d", nextCode);

        CoAo bean = new CoAo();

        if ( coAoRepository.existsByTenCoAo(vO.getTenCoAo())){
            throw new AppException(ErrorCode.CO_AO_ALREADY_EXISTS);
        }
        BeanUtils.copyProperties(vO, bean);
        bean.setMa(maCoAo);
        bean.setTrangThai(1);
        bean = coAoRepository.save(bean);

        // Trả về DTO luôn, hoặc nếu muốn trả về id thì return bean.getId();
        CoAoDTO dto = new CoAoDTO();
        BeanUtils.copyProperties(bean, dto);
        return dto;
    }

    public void delete(Integer id) {
        coAoRepository.deleteById(id);
    }

    public void update(Integer id, CoAoUpdateVO vO) {
        CoAo bean = requireOne(id);
        // Kiểm tra trống
        if (vO.getTenCoAo() == null || vO.getTenCoAo().trim().isEmpty()) {
            throw new AppException(ErrorCode.COAO_NAME_EMPTY);
        }
        // Kiểm tra quá ký tự
        if (vO.getTenCoAo().length() > 50) {
            throw new AppException(ErrorCode.COAO_NAME_TOO_LONG,
                    String.format(ErrorCode.COAO_NAME_TOO_LONG.getErrorMessage(), 50));
        }
        // Kiểm tra trùng tên (trừ chính bản ghi đang sửa)
        String newName = vO.getTenCoAo().trim();
        if (coAoRepository.existsByTenCoAo(newName)
                && !bean.getTenCoAo().equalsIgnoreCase(newName)) {
            throw new AppException(ErrorCode.COAO_NAME_DUPLICATE);
        }
        BeanUtils.copyProperties(vO, bean);
        coAoRepository.save(bean);
    }

    public CoAoDTO getById(Integer id) {
        CoAo original = requireOne(id);
        return toDTO(original);
    }

    public Page<CoAoDTO> query(CoAoQueryVO vO) {
        int page = vO.getPage() != null ? vO.getPage() : 0;
        int size = vO.getSize() != null ? vO.getSize() : 10;
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));

        Page<CoAo> entities = coAoRepository.findAll((root, query, cb) -> {
            var predicates = cb.conjunction();

            if (vO.getMa() != null && !vO.getMa().isEmpty()) {
                predicates = cb.and(predicates,
                        cb.like(cb.lower(root.get("ma")), "%" + vO.getMa().toLowerCase() + "%"));
            }
            if (vO.getTenCoAo() != null && !vO.getTenCoAo().isEmpty()) {
                predicates = cb.and(predicates,
                        cb.like(cb.lower(root.get("tenCoAo")), "%" + vO.getTenCoAo().toLowerCase() + "%"));
            }
            if (vO.getId() != null) {
                predicates = cb.and(predicates, cb.equal(root.get("id"), vO.getId()));
            }
            // BỔ SUNG FILTER TRẠNG THÁI
            if (vO.getTrangThai() != null) {
                predicates = cb.and(predicates, cb.equal(root.get("trangThai"), vO.getTrangThai()));
            }
            return predicates;
        }, pageable);

        return entities.map(this::toDTO);
    }

    // Thêm hàm lấy toàn bộ cổ áo cho FE select động
    public List<CoAoDTO> findAll() {
        return coAoRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private CoAoDTO toDTO(CoAo original) {
        CoAoDTO bean = new CoAoDTO();
        BeanUtils.copyProperties(original, bean);
        return bean;
    }

    private CoAo requireOne(Integer id) {
        return coAoRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Resource not found: " + id));
    }
}