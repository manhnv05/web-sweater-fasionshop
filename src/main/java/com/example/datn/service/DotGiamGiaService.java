package com.example.datn.service;

import com.example.datn.dto.DotGiamGiaDTO;
import com.example.datn.entity.DotGiamGia;
import com.example.datn.repository.DotGiamGiaRepository;
import com.example.datn.repository.ChiTietDotGiamGiaRepository;
import com.example.datn.vo.dotGiamGiaVO.DotGiamGiaQueryRequestVO;
import com.example.datn.vo.dotGiamGiaVO.DotGiamGiaQueryVO;
import com.example.datn.vo.dotGiamGiaVO.DotGiamGiaUpdateVO;
import com.example.datn.vo.dotGiamGiaVO.DotGiamGiaVO;
import jakarta.persistence.criteria.Predicate;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class DotGiamGiaService {

    @Autowired
    private DotGiamGiaRepository dotGiamGiaRepository;

    @Autowired
    private ChiTietDotGiamGiaRepository chiTietDotGiamGiaRepository;

    public Integer save(DotGiamGiaVO vO) {
        DotGiamGia bean = new DotGiamGia();
        BeanUtils.copyProperties(vO, bean);
        bean.setMaDotGiamGia(generateMaDotGiamGia());
        bean = dotGiamGiaRepository.save(bean);
        return bean.getId();
    }

    @Transactional
    public void delete(Integer id) {
        chiTietDotGiamGiaRepository.deleteByDotGiamGiaId(id);
        dotGiamGiaRepository.deleteById(id);
    }

    public void update(Integer id, DotGiamGiaUpdateVO vO) {
        DotGiamGia bean = requireOne(id);
        String maDotGiamGia = bean.getMaDotGiamGia();
        BeanUtils.copyProperties(vO, bean);
        bean.setMaDotGiamGia(maDotGiamGia);
        dotGiamGiaRepository.save(bean);
    }

    public DotGiamGiaDTO getById(Integer id) {
        DotGiamGia original = requireOne(id);
        return toDTO(original);
    }

    public Page<DotGiamGiaDTO> query(DotGiamGiaQueryRequestVO vO) {
        int page = vO.getPage() != null ? vO.getPage() : 0;
        int size = vO.getSize() != null ? vO.getSize() : 5;
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));

        Specification<DotGiamGia> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (vO.getTenDotGiamGia() != null && !vO.getTenDotGiamGia().isBlank()) {
                predicates.add(
                        cb.like(cb.lower(root.get("tenDotGiamGia")), "%" + vO.getTenDotGiamGia().toLowerCase() + "%")
                );
            }

            if (vO.getTrangThai() != null) {
                predicates.add(cb.equal(root.get("trangThai"), vO.getTrangThai()));
            }

            if (vO.getNgayBatDau() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("ngayBatDau"), vO.getNgayBatDau()));
            }

            if (vO.getNgayKetThuc() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("ngayKetThuc"), vO.getNgayKetThuc()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return dotGiamGiaRepository.findAll(spec, pageable).map(this::toDTO);
    }

    private DotGiamGiaDTO toDTO(DotGiamGia original) {
        DotGiamGiaDTO bean = new DotGiamGiaDTO();
        BeanUtils.copyProperties(original, bean);
        return bean;
    }

    private String generateMaDotGiamGia() {
        String date = java.time.LocalDate.now()
                .format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd"));
        String prefix = "DGG" + date;
        return dotGiamGiaRepository
                .findFirstByMaDotGiamGiaStartingWithOrderByMaDotGiamGiaDesc(prefix)
                .map(DotGiamGia::getMaDotGiamGia)
                .map(last -> {
                    String[] parts = last.split("-");
                    int next = 1;
                    if (parts.length > 1) {
                        try {
                            next = Integer.parseInt(parts[1]) + 1;
                        } catch (NumberFormatException ignored) {
                        }
                    }
                    return prefix + "-" + String.format("%03d", next);
                })
                .orElse(prefix + "-001");
    }

    private DotGiamGia requireOne(Integer id) {
        return dotGiamGiaRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Resource not found: " + id));
    }
}
