package com.example.datn.controller;

import com.example.datn.config.ResponseHelper;
import com.example.datn.dto.ApiResponse;
import com.example.datn.dto.DanhMucDTO;
import com.example.datn.dto.KichThuocDTO;
import com.example.datn.service.KichThuocService;
import com.example.datn.vo.danhMucVO.DanhMucUpdateVO;
import com.example.datn.vo.danhMucVO.DanhMucVO;
import com.example.datn.vo.kichThuocVO.KichThuocQueryVO;
import com.example.datn.vo.kichThuocVO.KichThuocUpdateVO;
import com.example.datn.vo.kichThuocVO.KichThuocVO;
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
@RequestMapping("/kichThuoc")
public class KichThuocController {

    @Autowired
    private KichThuocService kichThuocService;

    @PostMapping
    public ResponseEntity<ApiResponse<KichThuocDTO>> save(
            @Valid @RequestBody KichThuocVO vO) {;
        return ResponseHelper.success("Thêm kích thước thành công!", kichThuocService.save(vO));
    }
    @DeleteMapping("/{id}")
    public void delete(@Valid @NotNull @PathVariable("id") Integer id) {
        kichThuocService.delete(id);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<KichThuocDTO>> update(
            @Valid @NotNull @PathVariable("id") Integer id,
            @Valid @RequestBody KichThuocUpdateVO vO) {
        kichThuocService.update(id, vO);
        KichThuocDTO dto = kichThuocService.getById(id);
        return ResponseHelper.success("Cập nhật kích thước thành công!", dto);
    }

    @GetMapping("/{id}")
    public KichThuocDTO getById(@Valid @NotNull @PathVariable("id") Integer id) {
        return kichThuocService.getById(id);
    }

    // Sửa lại method query để nhận tham số filter từ query string (chuẩn RESTful)
    @GetMapping
    public Page<KichThuocDTO> query(
            @RequestParam(required = false) Integer id,
            @RequestParam(required = false) String ma,
            @RequestParam(required = false) String tenKichCo,
            @RequestParam(required = false) Integer trangThai,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size
    ) {
        KichThuocQueryVO vO = new KichThuocQueryVO();
        vO.setId(id);
        vO.setMa(ma);
        vO.setTenKichCo(tenKichCo);
        vO.setTrangThai(trangThai);
        vO.setPage(page);
        vO.setSize(size);
        return kichThuocService.query(vO);
    }

    // Thêm API lấy toàn bộ kích thước cho FE select option động
    @GetMapping("/all")
    public List<KichThuocDTO> getAll() {
        return kichThuocService.findAll();
    }
}