package com.example.datn.service;

import com.example.datn.config.CloudinaryService;
import com.example.datn.dto.HinhAnhDTO;
import com.example.datn.entity.HinhAnh;
import com.example.datn.entity.ChiTietSanPham;
import com.example.datn.repository.HinhAnhRepository;
import com.example.datn.repository.ChiTietSanPhamRepository;
import com.example.datn.repository.SpctHinhAnhRepository;
import com.example.datn.vo.hinhAnhVO.HinhAnhQueryVO;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class HinhAnhService {

    @Autowired
    private HinhAnhRepository hinhAnhRepository;

    @Autowired
    private CloudinaryService cloudinaryService;

    @Autowired
    private SpctHinhAnhRepository spctHinhAnhRepository;

    public Integer save(
            String maAnh,
            Integer anhMacDinh,
            String moTa,
            Integer trangThai,
            MultipartFile duongDanAnh
    ) {
        Integer maxCode = hinhAnhRepository.findMaxMaHinhAnhCode();
        int nextCode = (maxCode != null ? maxCode : 0) + 1;
        String maHinhAnh = String.format("HA%04d", nextCode);

        HinhAnh bean = new HinhAnh();
        bean.setMaAnh(maHinhAnh);
        bean.setAnhMacDinh(anhMacDinh);
        bean.setMoTa(moTa);
        bean.setTrangThai(1);

        if (duongDanAnh != null && !duongDanAnh.isEmpty()) {
            try {
                String url = cloudinaryService.uploadImage(duongDanAnh);
                bean.setDuongDanAnh(url);
            } catch (IOException e) {
                throw new RuntimeException("Không thể upload ảnh lên Cloudinary: " + e.getMessage(), e);
            }
        }

        bean = hinhAnhRepository.save(bean);
        return bean.getId();
    }

    public void delete(Integer id) {
        hinhAnhRepository.deleteById(id);
    }

    public void deleteImage(Integer id){
        spctHinhAnhRepository.deleteById(id);
    }

    public void update(
            Integer id,
            String maAnh,
            Integer anhMacDinh,
            String moTa,
            Integer trangThai,
            String duongDanAnh
    ) {
        HinhAnh bean = requireOne(id);
        bean.setMaAnh(maAnh);
        bean.setAnhMacDinh(anhMacDinh);
        bean.setMoTa(moTa);
        bean.setTrangThai(trangThai);

        if (duongDanAnh != null && !duongDanAnh.isEmpty()) {
            bean.setDuongDanAnh(duongDanAnh);
        }
        hinhAnhRepository.save(bean);
    }

    public HinhAnhDTO getById(Integer id) {
        HinhAnh original = requireOne(id);
        return toDTO(original);
    }

    public Page<HinhAnhDTO> query(HinhAnhQueryVO vO) {
        int page = vO.getPage() != null ? vO.getPage() : 0;
        int size = vO.getSize() != null ? vO.getSize() : 10;
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));

        Specification<HinhAnh> spec = (root, query, cb) -> {
            var predicates = cb.conjunction();
            if (vO.getId() != null) {
                predicates = cb.and(predicates, cb.equal(root.get("id"), vO.getId()));
            }
            if (vO.getMaAnh() != null && !vO.getMaAnh().isEmpty()) {
                predicates = cb.and(predicates, cb.like(cb.lower(root.get("maAnh")), "%" + vO.getMaAnh().toLowerCase() + "%"));
            }
            if (vO.getDuongDanAnh() != null && !vO.getDuongDanAnh().isEmpty()) {
                predicates = cb.and(predicates, cb.like(cb.lower(root.get("duongDanAnh")), "%" + vO.getDuongDanAnh().toLowerCase() + "%"));
            }
            if (vO.getAnhMacDinh() != null) {
                predicates = cb.and(predicates, cb.equal(root.get("anhMacDinh"), vO.getAnhMacDinh()));
            }
            if (vO.getMoTa() != null && !vO.getMoTa().isEmpty()) {
                predicates = cb.and(predicates, cb.like(cb.lower(root.get("moTa")), "%" + vO.getMoTa().toLowerCase() + "%"));
            }
            if (vO.getTrangThai() != null) {
                predicates = cb.and(predicates, cb.equal(root.get("trangThai"), vO.getTrangThai()));
            }
            return predicates;
        };

        Page<HinhAnh> entities = hinhAnhRepository.findAll(spec, pageable);
        return entities.map(this::toDTO);
    }

    private HinhAnhDTO toDTO(HinhAnh original) {
        HinhAnhDTO bean = new HinhAnhDTO();
        BeanUtils.copyProperties(original, bean);
        return bean;
    }

    private HinhAnh requireOne(Integer id) {
        Optional<HinhAnh> optional = hinhAnhRepository.findById(id);
        if (optional.isPresent()) {
            return optional.get();
        } else {
            throw new NoSuchElementException("Resource not found: " + id);
        }
    }

    public List<HinhAnhDTO> findAll() {
        return hinhAnhRepository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<HinhAnhDTO> findByIdSanPhamChiTiet(Integer idSanPhamChiTiet) {
        List<HinhAnh> images = hinhAnhRepository.findBySpctHinhAnhs_ChiTietSanPham_Id(idSanPhamChiTiet);
        return images.stream().map(this::toDTO).collect(Collectors.toList());
    }

    public HinhAnhDTO findByIdHinhAnh(Integer idHinhAnh) {
        HinhAnh hinhAnh = hinhAnhRepository.findById(idHinhAnh).orElseThrow(() -> new NoSuchElementException("Resource not found: " + idHinhAnh));
        return toDTO(hinhAnh);
    }

    public List<HinhAnhDTO> findHinhAnhChuaGanSanPham() {
        List<HinhAnh> list = hinhAnhRepository.findHinhAnhChuaGanSanPham();
        return list.stream().map(this::toDTO).collect(Collectors.toList());
    }
}