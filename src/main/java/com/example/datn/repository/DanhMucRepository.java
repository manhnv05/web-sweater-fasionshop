package com.example.datn.repository;

import com.example.datn.entity.DanhMuc;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface DanhMucRepository extends JpaRepository<DanhMuc, Integer>, JpaSpecificationExecutor<DanhMuc> {
boolean existsDanhMucByTenDanhMuc(String tenDanhMuc);
}