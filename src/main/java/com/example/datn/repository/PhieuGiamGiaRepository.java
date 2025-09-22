package com.example.datn.repository;

import com.example.datn.vo.phieuGiamGiaVO.PhieuGiamVOSearch;
import com.example.datn.entity.PhieuGiamGia;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PhieuGiamGiaRepository extends JpaRepository<PhieuGiamGia, Integer> {
    @Query("""
    SELECT s FROM PhieuGiamGia s
    WHERE
        ((:#{#search.maPhieuGiamGia} IS NULL OR s.maPhieuGiamGia LIKE %:#{#search.maPhieuGiamGia}%)
        OR (:#{#search.tenPhieu} IS NULL OR s.tenPhieu LIKE %:#{#search.tenPhieu}%))
        AND (
            (:#{#search.ngayBatDau} IS NULL OR :#{#search.ngayKetThuc} IS NULL)
             OR (
                s.ngayBatDau >= :#{#search.ngayBatDau}
                AND s.ngayKetThuc <= :#{#search.ngayKetThuc}
             )
        )
        AND (:#{#search.trangThai} IS NULL OR s.trangThai = :#{#search.trangThai})
    ORDER BY s.id DESC
    """)
    Page<PhieuGiamGia> findAllBySearch(@Param("search") PhieuGiamVOSearch search, Pageable pageable);
    List<PhieuGiamGia> findByNgayKetThucBeforeAndTrangThaiNot(LocalDateTime now , int trangThai);
    List<PhieuGiamGia> findByNgayBatDauAfterAndTrangThaiNotIn(LocalDateTime now, List<Integer> trangThais);
    @Query("""
    SELECT p FROM PhieuGiamGia p
    WHERE
    (p.ngayKetThuc > p.ngayBatDau AND p.ngayKetThuc > :now AND p.ngayBatDau < :now AND p.trangThai != 0 AND p.trangThai !=3)
    """)
    List<PhieuGiamGia> findValidPromotions(@Param("now") LocalDateTime now);

    @Query("""
    SELECT p FROM PhieuGiamGia p
    WHERE
    (p.loaiPhieu = 0 AND p.trangThai = 1 AND p.soLuong > 0)
    """)
    List<PhieuGiamGia> getPhieuGiamGiaByTrangThai();

    List<PhieuGiamGia> getPhieuGiamGiaByMaPhieuGiamGia(String maPhieuGiamGia);

    Boolean getPhieuGiamGiaByTenPhieu(String tenPhieu);

//    timfggg
    @Query("""
    SELECT p FROM PhieuGiamGia p
    WHERE p.maPhieuGiamGia = :ma
    """)
    PhieuGiamGia findByMaPhieuGiamGia(@Param("ma") String maPhieuGiamGia);

    @Query("SELECT pgg FROM PhieuGiamGia pgg WHERE " +
            "pgg.loaiPhieu = 0 AND " +       // Điều kiện loại phiếu công khai
            "pgg.trangThai = 1 AND " +      // Điều kiện đang hoạt động
            "pgg.soLuong > 0 AND " +        // Điều kiện còn số lượng
            ":now BETWEEN pgg.ngayBatDau AND pgg.ngayKetThuc") // Điều kiện còn hạn sử dụng
    List<PhieuGiamGia> findActivePublicVouchers(@Param("now") LocalDateTime now);

}
