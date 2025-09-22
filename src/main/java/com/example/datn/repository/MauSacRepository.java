package com.example.datn.repository;

import com.example.datn.entity.MauSac;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface MauSacRepository extends JpaRepository<MauSac, Integer>, JpaSpecificationExecutor<MauSac> {
public  boolean existsMauSacByTenMauSac(String tenMauSac);
}