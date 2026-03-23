package com.example.datn.service.impl;

import com.example.datn.dto.HoaDonChiTietDTO;
import com.example.datn.entity.HoaDonChiTiet;
import com.example.datn.entity.SpctHinhAnh;
import com.example.datn.repository.HoaDonChiTietRepository;
import com.example.datn.service.HoaDonChiTietService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HoaDonChiTietServiceImpl implements HoaDonChiTietService {
    private final HoaDonChiTietRepository hoaDonChiTietRepository;
    @Override
    public List<HoaDonChiTietDTO> getHoaDonChiTiet(String maHoaDon) {
        List<HoaDonChiTiet> listEntities = hoaDonChiTietRepository.findByHoaDonMaHoaDon(maHoaDon);
        List<HoaDonChiTietDTO> listDtos = new ArrayList<>();
        for (HoaDonChiTiet hdct : listEntities) {
            HoaDonChiTietDTO dto = new HoaDonChiTietDTO();

            // Lấy dữ liệu từ các bảng liên quan thông qua các mối quan hệ Entity
            dto.setIdSanPhamChiTiet(hdct.getSanPhamChiTiet().getId());
            dto.setTenSanPham(hdct.getSanPhamChiTiet().getSanPham().getTenSanPham());

            // *** ĐÂY LÀ NHỮNG TRƯỜNG BỊ NULL CỦA BẠN ***
            dto.setMaSanPhamChiTiet(hdct.getSanPhamChiTiet().getMaSanPhamChiTiet());
            dto.setTenMauSac(hdct.getSanPhamChiTiet().getMauSac().getTenMauSac());
            dto.setTenKichThuoc(hdct.getSanPhamChiTiet().getKichThuoc().getTenKichCo());

            // Lấy ảnh đầu tiên (như đã làm ở lần trước)
            String anhDauTien = null;
            List<SpctHinhAnh> danhSachHinhAnh = hdct.getSanPhamChiTiet().getSpctHinhAnhs();
            if (danhSachHinhAnh != null && !danhSachHinhAnh.isEmpty()) {
                SpctHinhAnh firstHinhAnh = danhSachHinhAnh.get(0);
                if (firstHinhAnh.getHinhAnh() != null) {
                    anhDauTien = firstHinhAnh.getHinhAnh().getDuongDanAnh();
                }
            }
            dto.setDuongDanAnh(anhDauTien);

            // Lấy các thông tin còn lại
            dto.setSoLuong(hdct.getSoLuong());
            dto.setGia(hdct.getGia());
            dto.setThanhTien(hdct.getThanhTien());
            listDtos.add(dto);
        }

        return listDtos; // 3. Trả về danh sách DTO đã có đầy đủ dữ liệu
    }
    }

