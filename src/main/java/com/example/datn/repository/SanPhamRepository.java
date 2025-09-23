package com.example.datn.repository;

import com.example.datn.entity.DanhMuc;
import com.example.datn.entity.SanPham;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SanPhamRepository extends JpaRepository<SanPham, Integer>, JpaSpecificationExecutor<SanPham> {

    List<SanPham> findByMaSanPhamOrTenSanPham(String maSanPham, String tenSanPham);
    List<SanPham> findByMaSanPhamContainingIgnoreCaseOrTenSanPhamContainingIgnoreCase(String maSanPham, String tenSanPham);

    @Query("SELECT s.tenSanPham FROM SanPham s WHERE s.trangThai IN (0, 1)")
    List<String> findAllTenSanPham();

    @Modifying
    @Transactional
    @Query("UPDATE SanPham s SET s.trangThai = 3 WHERE s.id = :id")
    void softDeleteById(Integer id);

    @Query("SELECT s FROM SanPham s WHERE s.trangThai IN (0, 1) ORDER BY s.id DESC")
    List<SanPham> findActiveSanPhamOrderByIdDesc();

    @Query("SELECT s FROM SanPham s WHERE s.trangThai IN (0, 1)")
    Page<SanPham> findAllActive(Pageable pageable);

    @Query("SELECT s FROM SanPham s WHERE s.trangThai IN (0, 1) AND LOWER(s.tenSanPham) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<SanPham> searchByTenSanPhamActive(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT s.maSanPham FROM SanPham s")
    List<String> findAllMaSanPham();

    @Query("SELECT DISTINCT sp FROM SanPham sp " +
            "LEFT JOIN sp.chiTietSanPhams ctsp " +
            "LEFT JOIN ctsp.mauSac ms " +
            "LEFT JOIN ctsp.kichThuoc kt " +
            "LEFT JOIN ctsp.thuongHieu th " +
            "LEFT JOIN ctsp.chatLieu cl " +
            "LEFT JOIN ctsp.coAo ca " +
            "LEFT JOIN ctsp.tayAo ta " +
            "LEFT JOIN sp.danhMuc dm " +
            "WHERE (:keyword IS NULL OR :keyword = '' OR LOWER(sp.tenSanPham) LIKE CONCAT('%', LOWER(:keyword), '%') OR LOWER(sp.maSanPham) LIKE CONCAT('%', LOWER(:keyword), '%')) " +
            "AND (:color IS NULL OR :color = '' OR LOWER(ms.tenMauSac) = LOWER(:color) OR LOWER(ms.maMau) = LOWER(:color)) " +
            "AND (:size IS NULL OR :size = '' OR LOWER(kt.tenKichCo) = LOWER(:size) OR LOWER(kt.ma) = LOWER(:size)) " +
            "AND (:brand IS NULL OR :brand = '' OR LOWER(th.tenThuongHieu) = LOWER(:brand) OR LOWER(th.tenThuongHieu) LIKE CONCAT('%', LOWER(:brand), '%') OR LOWER(th.maThuongHieu) = LOWER(:brand)) " +
            "AND (:category IS NULL OR :category = '' OR LOWER(dm.tenDanhMuc) LIKE CONCAT('%', LOWER(:category), '%')) " +
            "AND (:material IS NULL OR :material = '' OR LOWER(cl.tenChatLieu) = LOWER(:material) OR LOWER(cl.maChatLieu) = LOWER(:material)) " +
            "AND (:collar IS NULL OR :collar = '' OR LOWER(ca.tenCoAo) = LOWER(:collar) OR LOWER(ca.ma) = LOWER(:collar)) " +
            "AND (:sleeve IS NULL OR :sleeve = '' OR LOWER(ta.tenTayAo) = LOWER(:sleeve) OR LOWER(ta.ma) = LOWER(:sleeve)) " +
            "AND (:priceMin IS NULL OR ctsp.gia >= :priceMin) " +
            "AND (:priceMax IS NULL OR ctsp.gia <= :priceMax) " +
            "AND sp.trangThai = 1 "+

            "AND (ctsp IS NULL OR ctsp.trangThai = 1)")
    Page<SanPham> searchWithFilter(
            @Param("keyword") String keyword,
            @Param("color") String color,
            @Param("size") String size,
            @Param("brand") String brand,
            @Param("category") String category,
            @Param("material") String material,
            @Param("collar") String collar,
            @Param("sleeve") String sleeve,
            @Param("priceMin") Integer priceMin,
            @Param("priceMax") Integer priceMax,
            Pageable pageable
    );

    List<SanPham> findByDanhMucAndIdNot(DanhMuc danhMuc, Integer id, Pageable pageable);

    // ===== Thông tin tổng hợp từ bảng sản phẩm để show ShopInfo =====

    @Query("SELECT DISTINCT th.tenThuongHieu FROM SanPham sp " +
            "LEFT JOIN sp.chiTietSanPhams ctsp " +
            "LEFT JOIN ctsp.thuongHieu th " +
            "WHERE sp.trangThai IN (0,1) AND (ctsp.trangThai = 1 OR ctsp IS NULL) AND th.tenThuongHieu IS NOT NULL")
    List<String> findDistinctThuongHieu();

    @Query("SELECT DISTINCT dm.tenDanhMuc FROM SanPham sp " +
            "LEFT JOIN sp.danhMuc dm " +
            "WHERE sp.trangThai IN (0,1) AND dm.tenDanhMuc IS NOT NULL")
    List<String> findDistinctDanhMuc();

    @Query("SELECT DISTINCT cl.tenChatLieu FROM SanPham sp " +
            "LEFT JOIN sp.chiTietSanPhams ctsp " +
            "LEFT JOIN ctsp.chatLieu cl " +
            "WHERE sp.trangThai IN (0,1) AND (ctsp.trangThai = 1 OR ctsp IS NULL) AND cl.tenChatLieu IS NOT NULL")
    List<String> findDistinctChatLieu();

    @Query("SELECT DISTINCT ca.tenCoAo FROM SanPham sp " +
            "LEFT JOIN sp.chiTietSanPhams ctsp " +
            "LEFT JOIN ctsp.coAo ca " +
            "WHERE sp.trangThai IN (0,1) AND (ctsp.trangThai = 1 OR ctsp IS NULL) AND ca.tenCoAo IS NOT NULL")
    List<String> findDistinctCoAo();

    @Query("SELECT DISTINCT ta.tenTayAo FROM SanPham sp " +
            "LEFT JOIN sp.chiTietSanPhams ctsp " +
            "LEFT JOIN ctsp.tayAo ta " +
            "WHERE sp.trangThai IN (0,1) AND (ctsp.trangThai = 1 OR ctsp IS NULL) AND ta.tenTayAo IS NOT NULL")
    List<String> findDistinctTayAo();

    @Query("SELECT DISTINCT ms.tenMauSac FROM SanPham sp " +
            "LEFT JOIN sp.chiTietSanPhams ctsp " +
            "LEFT JOIN ctsp.mauSac ms " +
            "WHERE sp.trangThai IN (0,1) AND (ctsp.trangThai = 1 OR ctsp IS NULL) AND ms.tenMauSac IS NOT NULL")
    List<String> findDistinctMauSac();

    @Query("SELECT DISTINCT kt.tenKichCo FROM SanPham sp " +
            "LEFT JOIN sp.chiTietSanPhams ctsp " +
            "LEFT JOIN ctsp.kichThuoc kt " +
            "WHERE sp.trangThai IN (0,1) AND (ctsp.trangThai = 1 OR ctsp IS NULL) AND kt.tenKichCo IS NOT NULL")
    List<String> findDistinctKichThuoc();

    boolean existsByTenSanPham(String tenSanPham);

    @Query("SELECT MAX(CAST(SUBSTRING(sp.maSanPham, 3) AS int)) FROM SanPham sp WHERE sp.maSanPham LIKE 'SP____'")
    Integer findMaxSanPhamCode();
}