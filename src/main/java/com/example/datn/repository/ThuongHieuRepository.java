package com.example.datn.repository;

import com.example.datn.entity.ThuongHieu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface ThuongHieuRepository extends JpaRepository<ThuongHieu, Integer>, JpaSpecificationExecutor<ThuongHieu> {
    boolean existsByTenThuongHieu(String tenThuongHieu);

    @Query("SELECT MAX(CAST(SUBSTRING(th.maThuongHieu, 3) AS int)) FROM ThuongHieu th WHERE th.maThuongHieu LIKE 'TH____'")
    Integer findMaxMaThuongHieuCode();
}