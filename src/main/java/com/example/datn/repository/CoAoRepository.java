package com.example.datn.repository;

import com.example.datn.entity.CoAo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface CoAoRepository extends JpaRepository<CoAo, Integer>, JpaSpecificationExecutor<CoAo> {

    boolean existsByTenCoAo(String tenCoAo);

    @Query("SELECT MAX(CAST(SUBSTRING(ca.ma, 3) AS int)) FROM CoAo ca WHERE ca.ma LIKE 'CA____'")
    Integer findMaxMaCoAoCode();
}