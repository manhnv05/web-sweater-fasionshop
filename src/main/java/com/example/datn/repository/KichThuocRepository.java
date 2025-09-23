package com.example.datn.repository;

import com.example.datn.entity.KichThuoc;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface KichThuocRepository extends JpaRepository<KichThuoc, Integer>, JpaSpecificationExecutor<KichThuoc> {
    boolean existsByTenKichCo(String tenKichCo);

    @Query("SELECT MAX(CAST(SUBSTRING(kt.ma, 3) AS int)) FROM KichThuoc kt WHERE kt.ma LIKE 'KT____'")
    Integer findMaxMaKichCoCode();
}