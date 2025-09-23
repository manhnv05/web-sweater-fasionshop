package com.example.datn.service;

import com.example.datn.dto.KichThuocDTO;
import com.example.datn.dto.TayAoDTO;
import com.example.datn.entity.KichThuoc;
import com.example.datn.entity.TayAo;
import com.example.datn.exception.AppException;
import com.example.datn.exception.ErrorCode;
import com.example.datn.repository.TayAoRepository;
import com.example.datn.vo.kichThuocVO.KichThuocUpdateVO;
import com.example.datn.vo.kichThuocVO.KichThuocVO;
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

    public TayAoDTO save(TayAoVO vO) {
        // Kiểm tra trống
        if (vO.getTenTayAo() == null || vO.getTenTayAo().trim().isEmpty()) {
            throw new AppException(ErrorCode.TAYAO_NAME_EMPTY);
        }
        // Kiểm tra quá ký tự
        if (vO.getTenTayAo().length() > 50) {
            throw new AppException(ErrorCode.TAYAO_NAME_TOO_LONG,
                    ErrorCode.TAYAO_NAME_TOO_LONG.getErrorMessage(50));
        }
        // Kiểm tra trùng tên
        if (tayAoRepository.existsByTenTayAo(vO.getTenTayAo().trim())) {
            throw new AppException(ErrorCode.TAYAO_NAME_DUPLICATE);
        }

        Integer maxCode = tayAoRepository.findMaxMaTayAoCode();
        int nextCode = (maxCode != null ? maxCode : 0) + 1;
        String maTayAo = String.format("TA%04d", nextCode);

        TayAo bean = new TayAo();

        if ( tayAoRepository.existsByTenTayAo(vO.getTenTayAo())){
            throw new AppException(ErrorCode.TAY_AO_ALREADY_EXISTS);
        }
        BeanUtils.copyProperties(vO, bean);
        bean.setMa(maTayAo);
        bean.setTrangThai(1);
        bean = tayAoRepository.save(bean);

        // Trả về DTO luôn, hoặc nếu muốn trả về id thì return bean.getId();
        TayAoDTO dto = new TayAoDTO();
        BeanUtils.copyProperties(bean, dto);
        return dto;
    }

    public void delete(Integer id) {
        tayAoRepository.deleteById(id);
    }

    public void update(Integer id, TayAoUpdateVO vO) {
        TayAo bean = requireOne(id);
        // Kiểm tra trống
        if (vO.getTenTayAo() == null || vO.getTenTayAo().trim().isEmpty()) {
            throw new AppException(ErrorCode.TAYAO_NAME_EMPTY);
        }
        // Kiểm tra quá ký tự
        if (vO.getTenTayAo().length() > 50) {
            throw new AppException(ErrorCode.TAYAO_NAME_TOO_LONG,
                    String.format(ErrorCode.TAYAO_NAME_TOO_LONG.getErrorMessage(), 50));
        }
        // Kiểm tra trùng tên (trừ chính bản ghi đang sửa)
        String newName = vO.getTenTayAo().trim();
        if (tayAoRepository.existsByTenTayAo(newName)
                && !bean.getTenTayAo().equalsIgnoreCase(newName)) {
            throw new AppException(ErrorCode.TAYAO_NAME_DUPLICATE);
        }
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