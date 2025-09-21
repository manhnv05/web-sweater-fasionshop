package com.example.datn.repository;

import com.example.datn.entity.ChatLieu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ChatLieuRepository extends JpaRepository<ChatLieu, Integer>, JpaSpecificationExecutor<ChatLieu> {
    boolean existsByTenChatLieu(String tenChatLieu);
}