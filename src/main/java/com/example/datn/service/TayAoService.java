package com.example.datn.service;

import com.example.datn.dto.TayAoDTO;
import com.example.datn.entity.TayAo;
import com.example.datn.exception.AppException;
import com.example.datn.exception.ErrorCode;
import com.example.datn.repository.TayAoRepository;
import com.example.datn.vo.tayAoVO.TayAoQueryVO;
import com.example.datn.vo.tayAoVO.TayAoUpdateVO;
import com.example.datn.vo.tayAoVO.TayAoVO;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
public class TayAoService {

    @Autowired
    private TayAoRepository tayAoRepository;

    public Integer save(TayAoVO vO) {
        TayAo bean = new TayAo();
        if (tayAoRepository.existsTayAoByTenTayAo(vO.getTenTayAo())){
            throw new AppException(ErrorCode.TAY_AO_ALREADY_EXISTS);
        }
        BeanUtils.copyProperties(vO, bean);
        bean = tayAoRepository.save(bean);
        return bean.getId();
    }

    public void delete(Integer id) {
        tayAoRepository.deleteById(id);
    }

    public void update(Integer id, TayAoUpdateVO vO) {
        TayAo bean = requireOne(id);
        BeanUtils.copyProperties(vO, bean);
        tayAoRepository.save(bean);
    }

    public TayAoDTO getById(Integer id) {
        TayAo original = requireOne(id);
        return toDTO(original);
    }

    public Page<TayAoDTO> query(TayAoQueryVO vO) {
        int page = vO.getPage() != null ? vO.getPage() : 0;
        int size = vO.getSize() != null ? vO.getSize() : 10;
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));

        Page<TayAo> entities = tayAoRepository.findAll((root, query, cb) -> {
            var predicates = cb.conjunction();

            if (vO.getMa() != null && !vO.getMa().isEmpty()) {
                predicates = cb.and(predicates,
                        cb.like(cb.lower(root.get("ma")), "%" + vO.getMa().toLowerCase() + "%"));
            }
            if (vO.getTenTayAo() != null && !vO.getTenTayAo().isEmpty()) {
                predicates = cb.and(predicates,
                        cb.like(cb.lower(root.get("tenTayAo")), "%" + vO.getTenTayAo().toLowerCase() + "%"));
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

    // Thêm hàm lấy toàn bộ tay áo (cho select option động ở FE)
    public List<TayAoDTO> findAll() {
        return tayAoRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private TayAoDTO toDTO(TayAo original) {
        TayAoDTO bean = new TayAoDTO();
        BeanUtils.copyProperties(original, bean);
        return bean;
    }

    private TayAo requireOne(Integer id) {
        return tayAoRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Resource not found: " + id));
    }
}