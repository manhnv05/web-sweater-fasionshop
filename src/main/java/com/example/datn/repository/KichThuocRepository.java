package com.example.datn.repository;

import com.example.datn.entity.KichThuoc;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface KichThuocRepository extends JpaRepository<KichThuoc, Integer>, JpaSpecificationExecutor<KichThuoc> {
    boolean existsKichThuocByTenKichCo(String tenKichCo);
}