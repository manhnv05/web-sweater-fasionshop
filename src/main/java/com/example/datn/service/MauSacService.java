package com.example.datn.service;

import com.example.datn.dto.KichThuocDTO;
import com.example.datn.dto.MauSacDTO;
import com.example.datn.entity.KichThuoc;
import com.example.datn.entity.MauSac;
import com.example.datn.entity.TayAo;
import com.example.datn.exception.AppException;
import com.example.datn.exception.ErrorCode;
import com.example.datn.repository.MauSacRepository;
import com.example.datn.vo.kichThuocVO.KichThuocVO;
import com.example.datn.vo.mauSacVO.MauSacQueryVO;
import com.example.datn.vo.mauSacVO.MauSacUpdateVO;
import com.example.datn.vo.mauSacVO.MauSacVO;
import com.example.datn.vo.tayAoVO.TayAoUpdateVO;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
public class MauSacService {

    @Autowired
    private MauSacRepository mauSacRepository;

    private static final Map<String, String> COLOR_NAME_TO_HEX = Map.ofEntries(
            Map.entry("xanh lá", "#4CAF50"),
            Map.entry("xanh dương", "#2196F3"),
            Map.entry("đỏ", "#FF0000"),
            Map.entry("trắng", "#FFFFFF"),
            Map.entry("đen", "#000000"),
            Map.entry("bạc", "#C0C0C0"),
            Map.entry("vàng đất", "#FFD700"),
            Map.entry("xanh ngọc", "#009688"),
            Map.entry("xanh navy", "#001F3F"),
            Map.entry("xám", "#9E9E9E"),
            Map.entry("nâu", "#795548"),
            Map.entry("tím", "#9C27B0"),
            Map.entry("hồng", "#E91E63"),
            Map.entry("cam", "#FF9800"),
            Map.entry("vàng", "#FFEB3B")
    );

    private String getHexColorFromName(String colorName) {
        if (colorName == null) return "#000000";
        String hex = COLOR_NAME_TO_HEX.get(colorName.trim().toLowerCase());
        return hex != null ? hex : "#000000";
    }

    public MauSacDTO save(MauSacVO vO) {
        // Kiểm tra trống
        if (vO.getTenMauSac() == null || vO.getTenMauSac().trim().isEmpty()) {
            throw new AppException(ErrorCode.MAUSAC_NAME_EMPTY);
        }
        // Kiểm tra quá ký tự
        if (vO.getTenMauSac().length() > 50) {
            throw new AppException(ErrorCode.MAUSAC_NAME_TOO_LONG,
                    ErrorCode.MAUSAC_NAME_TOO_LONG.getErrorMessage(50));
        }
        // Kiểm tra trùng tên
        if (mauSacRepository.existsByTenMauSac(vO.getTenMauSac().trim())) {
            throw new AppException(ErrorCode.MAUSAC_NAME_DUPLICATE);
        }

        MauSac bean = new MauSac();

        if ( mauSacRepository.existsByTenMauSac(vO.getTenMauSac())){
            throw new AppException(ErrorCode.THE_COLOR_ALREADY_EXISTS);
        }
        BeanUtils.copyProperties(vO, bean);
        bean.setMaMau(getHexColorFromName(vO.getTenMauSac()));
        bean.setTrangThai(1);
        bean = mauSacRepository.save(bean);

        // Trả về DTO luôn, hoặc nếu muốn trả về id thì return bean.getId();
        MauSacDTO dto = new MauSacDTO();
        BeanUtils.copyProperties(bean, dto);
        return dto;
    }

    public void delete(Integer id) {
        mauSacRepository.deleteById(id);
    }

    public void update(Integer id, MauSacUpdateVO vO) {
        MauSac bean = requireOne(id);
        // Kiểm tra trống
        if (vO.getTenMauSac() == null || vO.getTenMauSac().trim().isEmpty()) {
            throw new AppException(ErrorCode.MAUSAC_NAME_EMPTY);
        }
        // Kiểm tra quá ký tự
        if (vO.getTenMauSac().length() > 50) {
            throw new AppException(ErrorCode.MAUSAC_NAME_TOO_LONG,
                    String.format(ErrorCode.MAUSAC_NAME_TOO_LONG.getErrorMessage(), 50));
        }
        // Kiểm tra trùng tên (trừ chính bản ghi đang sửa)
        String newName = vO.getTenMauSac().trim();
        if (mauSacRepository.existsByTenMauSac(newName)
                && !bean.getTenMauSac().equalsIgnoreCase(newName)) {
            throw new AppException(ErrorCode.MAUSAC_NAME_DUPLICATE);
        }
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