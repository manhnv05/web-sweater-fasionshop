package com.example.datn.service;

import com.example.datn.dto.CoAoDTO;
import com.example.datn.entity.CoAo;
import com.example.datn.exception.AppException;
import com.example.datn.exception.ErrorCode;
import com.example.datn.repository.CoAoRepository;
import com.example.datn.vo.coAoVO.CoAoQueryVO;
import com.example.datn.vo.coAoVO.CoAoUpdateVO;
import com.example.datn.vo.coAoVO.CoAoVO;
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

    public Integer save(CoAoVO vO) {
        CoAo bean = new CoAo();
        if (coAoRepository.existsByTenCoAo(vO.getTenCoAo())){
            throw  new AppException(ErrorCode.CO_AO_ALREADY_EXISTS);
        }
        BeanUtils.copyProperties(vO, bean);
        bean = coAoRepository.save(bean);
        return bean.getId();
    }

    public void delete(Integer id) {
        coAoRepository.deleteById(id);
    }

    public void update(Integer id, CoAoUpdateVO vO) {
        CoAo bean = requireOne(id);
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