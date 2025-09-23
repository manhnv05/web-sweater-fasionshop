package com.example.datn.vo.chatLieuVO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.io.Serializable;

@Data
public class ChatLieuVO implements Serializable {
    private static final long serialVersionUID = 1L;

    private String maChatLieu;
    @NotBlank(message = "Tên chất liệu không được để trống")
    @Size(max = 50, message = "Tên chất liệu không được vượt quá 50 ký tự")
    private String tenChatLieu;
    private Integer trangThai;
}