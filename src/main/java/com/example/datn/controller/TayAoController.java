package com.example.datn.controller;

import com.example.datn.config.ResponseHelper;
import com.example.datn.dto.ApiResponse;
import com.example.datn.dto.KichThuocDTO;
import com.example.datn.dto.TayAoDTO;
import com.example.datn.service.TayAoService;
import com.example.datn.vo.kichThuocVO.KichThuocUpdateVO;
import com.example.datn.vo.kichThuocVO.KichThuocVO;
import com.example.datn.vo.tayAoVO.TayAoQueryVO;
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
@RequestMapping("/tayAo")
public class TayAoController {

    @Autowired
    private TayAoService tayAoService;

    @PostMapping
    public ResponseEntity<ApiResponse<TayAoDTO>> save(
            @Valid @RequestBody TayAoVO vO) {;
        return ResponseHelper.success("Thêm tay áo thành công!", tayAoService.save(vO));
    }
    @DeleteMapping("/{id}")
    public void delete(@Valid @NotNull @PathVariable("id") Integer id) {
        tayAoService.delete(id);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TayAoDTO>> update(
            @Valid @NotNull @PathVariable("id") Integer id,
            @Valid @RequestBody TayAoUpdateVO vO) {
        tayAoService.update(id, vO);
        TayAoDTO dto = tayAoService.getById(id);
        return ResponseHelper.success("Cập nhật tay áo thành công!", dto);
    }

    @GetMapping("/{id}")
    public TayAoDTO getById(@Valid @NotNull @PathVariable("id") Integer id) {
        return tayAoService.getById(id);
    }

    // Query động theo filter truyền qua query string (chuẩn RESTful)
    @GetMapping
    public Page<TayAoDTO> query(
            @RequestParam(required = false) Integer id,
            @RequestParam(required = false) String ma,
            @RequestParam(required = false) String tenTayAo,
            @RequestParam(required = false) Integer trangThai,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size
    ) {
        TayAoQueryVO vO = new TayAoQueryVO();
        vO.setId(id);
        vO.setMa(ma);
        vO.setTenTayAo(tenTayAo);
        vO.setTrangThai(trangThai);
        vO.setPage(page);
        vO.setSize(size);
        return tayAoService.query(vO);
    }

    // Lấy toàn bộ kiểu tay áo (cho FE select option động)
    @GetMapping("/all")
    public List<TayAoDTO> getAll() {
        return tayAoService.findAll();
    }
}