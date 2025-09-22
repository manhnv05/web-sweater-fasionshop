package com.example.datn.repository;

import com.example.datn.entity.TayAo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface TayAoRepository extends JpaRepository<TayAo, Integer>, JpaSpecificationExecutor<TayAo> {
    public boolean existsTayAoByTenTayAo(String tenTayAo);
}