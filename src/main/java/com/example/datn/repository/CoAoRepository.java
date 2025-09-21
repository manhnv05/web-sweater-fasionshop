package com.example.datn.repository;

import com.example.datn.entity.CoAo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface CoAoRepository extends JpaRepository<CoAo, Integer>, JpaSpecificationExecutor<CoAo> {
    public boolean existsByTenCoAo(String tenCoAo);
}