package com.example.datn.repository;

import com.example.datn.entity.ChatLieu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

public interface ChatLieuRepository extends JpaRepository<ChatLieu, Integer>, JpaSpecificationExecutor<ChatLieu> {
    boolean existsByMaChatLieu(String maChatLieu);
    boolean existsByTenChatLieu(String tenChatLieu);

    // Lấy số lớn nhất phía sau mã chất liệu dạng "CLxxxx"
    @Query("SELECT MAX(CAST(SUBSTRING(c.maChatLieu, 3) AS int)) FROM ChatLieu c WHERE c.maChatLieu LIKE 'CL____'")
    Integer findMaxMaChatLieuCode();
}