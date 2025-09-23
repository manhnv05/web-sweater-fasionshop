package com.example.datn.controller;

import com.example.datn.config.ResponseHelper;
import com.example.datn.dto.ApiResponse;
import com.example.datn.dto.SanPhamDTO;
import com.example.datn.dto.TayAoDTO;
import com.example.datn.service.SanPhamService;
import com.example.datn.vo.sanPham.SanPhamUpdateVO;
import com.example.datn.vo.sanPham.SanPhamQueryVO;
import com.example.datn.vo.sanPham.SanPhamVO;
import com.example.datn.vo.tayAoVO.TayAoUpdateVO;
import com.example.datn.vo.tayAoVO.TayAoVO;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Validated
@RestController
@RequestMapping("/sanPham")
public class SanPhamController {

    @Autowired
    private SanPhamService sanPhamService;

    @PostMapping
    public ResponseEntity<ApiResponse<SanPhamDTO>> save(
            @Valid @RequestBody SanPhamVO vO) {;
        return ResponseHelper.success("Thêm sản phẩm thành công!", sanPhamService.save(vO));
    }
    @DeleteMapping("/{id}")
    public void delete(@Valid @NotNull @PathVariable("id") Integer id) {
        sanPhamService.delete(id);
    }


    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SanPhamDTO>> update(
            @Valid @NotNull @PathVariable("id") Integer id,
            @Valid @RequestBody SanPhamUpdateVO vO) {
        sanPhamService.update(id, vO);
        SanPhamDTO dto = sanPhamService.getById(id);
        return ResponseHelper.success("Cập nhật sản phẩm thành công!", dto);
    }

    @GetMapping("/{id}")
    public SanPhamDTO getById(@Valid @NotNull @PathVariable("id") Integer id) {
        return sanPhamService.getById(id);
    }

    @GetMapping
    public Page<SanPhamDTO> query(@Valid SanPhamQueryVO vO) {
        return sanPhamService.query(vO);
    }

    @GetMapping("/search")
    public List<SanPhamDTO> searchByMaOrTen(@RequestParam("keyword") String keyword) {
        return sanPhamService.searchByMaSanPhamOrTenSanPham(keyword);
    }

    @GetMapping("/all-ten")
    public List<String> getAllTenSanPham() {
        return sanPhamService.getAllTenSanPham();
    }

    @GetMapping("/all-ma")
    public List<String> getAllMaSanPham() {
        return sanPhamService.getAllMaSanPham();
    }
}