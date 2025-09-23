package com.example.datn.repository;

import com.example.datn.entity.TayAo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface TayAoRepository extends JpaRepository<TayAo, Integer>, JpaSpecificationExecutor<TayAo> {
    boolean existsByTenTayAo(String tenTayAo);

    @Query("SELECT MAX(CAST(SUBSTRING(ta.ma, 3) AS int)) FROM TayAo ta WHERE ta.ma LIKE 'TA____'")
    Integer findMaxMaTayAoCode();
}