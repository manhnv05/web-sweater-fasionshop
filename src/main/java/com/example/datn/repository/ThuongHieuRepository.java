package com.example.datn.repository;

import com.example.datn.entity.ThuongHieu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface ThuongHieuRepository extends JpaRepository<ThuongHieu, Integer>, JpaSpecificationExecutor<ThuongHieu> {
    public boolean existsThuongHieuByTenThuongHieu(String tenThuongHieu);
}