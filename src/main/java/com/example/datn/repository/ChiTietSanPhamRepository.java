package com.example.datn.repository;

import com.example.datn.entity.ChiTietSanPham;
import com.example.datn.vo.chiTietSanPhamVO.ChiTietSanPhamBanHangTaiQuayVO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChiTietSanPhamRepository extends JpaRepository<ChiTietSanPham, Integer>, JpaSpecificationExecutor<ChiTietSanPham> {

    List<ChiTietSanPham> findByMaSanPhamChiTietContainingIgnoreCase(String maSanPhamChiTiet);

    List<ChiTietSanPham> findBySanPhamId(Integer idSanPham);

    ChiTietSanPham findByMaSanPhamChiTiet(String maSanPhamChiTiet);

    @Query("SELECT c.maSanPhamChiTiet FROM ChiTietSanPham c")
    List<String> findAllMaChiTietSanPham();

    @Query(value = """
      SELECT
         ctsp.id,
         ha.duong_dan_anh,
         sp.ten_san_pham,
         sp.ma_san_pham,
         th.ten_thuong_hieu,
         ctsp.so_luong,
         dm.ten_danh_muc,
         cl.ten_chat_lieu,
         ms.ten_mau_sac,
         kt.ten_kich_co,
         co.ten,
         ta.ten,
         ctsp.gia
     FROM
         chi_tiet_san_pham ctsp
     LEFT JOIN san_pham sp ON ctsp.id_san_pham = sp.id
     LEFT JOIN mau_sac ms ON ms.id = ctsp.id_mau_sac
     LEFT JOIN danh_muc dm ON sp.id_danh_muc = dm.id
     LEFT JOIN chat_lieu cl ON cl.id = ctsp.id_chat_lieu
     LEFT JOIN kich_thuoc kt ON kt.id = ctsp.id_kich_thuoc
     LEFT JOIN co_ao co ON co.id = ctsp.id_co_ao
     LEFT JOIN tay_ao ta ON ta.id = ctsp.id_tay_ao
     LEFT JOIN thuong_hieu th ON ctsp.id_thuong_hieu = th.id
     LEFT JOIN spct_hinhanh ha ON ha.id_san_pham_chi_tiet = ctsp.id
     WHERE
         ctsp.so_luong > 0
         and ctsp.trang_thai =1
     order by ctsp.id desc
    """, nativeQuery = true)
    List<ChiTietSanPhamBanHangTaiQuayVO> findChiTietSanPhamBanHangTaiQuay();

    @Query("""
        SELECT ctsp FROM ChiTietSanPham ctsp
        WHERE ctsp.soLuong < :slQuery
        ORDER BY ctsp.soLuong desc
    """)
    Page<ChiTietSanPham> getChiTietSanPhamSapHetHan(Pageable pageable, @Param("slQuery") Integer slQuery);

    @Query("""
        SELECT ctsp FROM ChiTietSanPham ctsp
        WHERE ctsp.soLuong > 0 AND ctsp.trangThai = 1
        ORDER BY ctsp.id desc
    """)
    List<ChiTietSanPham> getChiTietSanPhamTrangThai();

    @Query("SELECT c FROM ChiTietSanPham c WHERE c.sanPham.id = :idSanPham AND c.mauSac.id = :idMauSac AND c.kichThuoc.id = :idKichThuoc")
    ChiTietSanPham findExisting(@Param("idSanPham") Integer idSanPham,
                                @Param("idMauSac") Integer idMauSac,
                                @Param("idKichThuoc") Integer idKichThuoc);

    @Query("SELECT MAX(ctsp.gia) FROM ChiTietSanPham ctsp WHERE ctsp.trangThai = 1")
    Double findMaxPriceFromChiTiet();
    List<ChiTietSanPham> findBySanPhamIdAndTrangThai(Integer sanPhamId, int trangThai);

    boolean existsBySanPham_TenSanPham(String sanPhamTenSanPham);

}