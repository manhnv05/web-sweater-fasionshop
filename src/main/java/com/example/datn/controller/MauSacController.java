package com.example.datn.controller;

import com.example.datn.config.ResponseHelper;
import com.example.datn.dto.ApiResponse;
import com.example.datn.dto.KichThuocDTO;
import com.example.datn.dto.MauSacDTO;
import com.example.datn.service.MauSacService;
import com.example.datn.vo.kichThuocVO.KichThuocUpdateVO;
import com.example.datn.vo.kichThuocVO.KichThuocVO;
import com.example.datn.vo.mauSacVO.MauSacQueryVO;
import com.example.datn.vo.mauSacVO.MauSacUpdateVO;
import com.example.datn.vo.mauSacVO.MauSacVO;
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
@RequestMapping("/mauSac")
public class MauSacController {

    @Autowired
    private MauSacService mauSacService;

    @PostMapping
    public ResponseEntity<ApiResponse<MauSacDTO>> save(
            @Valid @RequestBody MauSacVO vO) {;
        return ResponseHelper.success("Thêm màu sắc thành công!", mauSacService.save(vO));
    }
    @DeleteMapping("/{id}")
    public void delete(@Valid @NotNull @PathVariable("id") Integer id) {
        mauSacService.delete(id);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MauSacDTO>> update(
            @Valid @NotNull @PathVariable("id") Integer id,
            @Valid @RequestBody MauSacUpdateVO vO) {
        mauSacService.update(id, vO);
        MauSacDTO dto = mauSacService.getById(id);
        return ResponseHelper.success("Cập nhật màu sắc thành công!", dto);
    }

    @GetMapping("/{id}")
    public MauSacDTO getById(@Valid @NotNull @PathVariable("id") Integer id) {
        return mauSacService.getById(id);
    }

    // Sửa hàm query để nhận filter từ query string (chuẩn RESTful)
    @GetMapping
    public Page<MauSacDTO> query(
            @RequestParam(required = false) Integer id,
            @RequestParam(required = false) String tenMauSac,
            @RequestParam(required = false) String maMau,
            @RequestParam(required = false) Integer trangThai,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size
    ) {
        MauSacQueryVO vO = new MauSacQueryVO();
        vO.setId(id);
        vO.setTenMauSac(tenMauSac);
        vO.setMaMau(maMau);
        vO.setTrangThai(trangThai);
        vO.setPage(page);
        vO.setSize(size);
        return mauSacService.query(vO);
    }

    // Thêm API lấy tất cả màu sắc (cho FE select động)
    @GetMapping("/all")
    public List<MauSacDTO> getAll() {
        return mauSacService.findAll();
    }
}