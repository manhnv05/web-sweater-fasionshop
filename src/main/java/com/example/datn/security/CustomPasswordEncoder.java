package com.example.datn.security;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class CustomPasswordEncoder implements PasswordEncoder {
    private static final Logger logger = LoggerFactory.getLogger(CustomPasswordEncoder.class);

    private final BCryptPasswordEncoder bCryptPasswordEncoder = new BCryptPasswordEncoder();

    @Override
    public String encode(CharSequence rawPassword) {
        String encoded = bCryptPasswordEncoder.encode(rawPassword);
        logger.debug("Đã mã hóa mật khẩu thành công");
        return encoded;
    }

    @Override
    public boolean matches(CharSequence rawPassword, String encodedPassword) {
        if (encodedPassword == null) return false;
        // Hỗ trợ mọi định dạng BCrypt
        if (encodedPassword.startsWith("$2a$") || encodedPassword.startsWith("$2b$") || encodedPassword.startsWith("$2y$")) {
            boolean match = bCryptPasswordEncoder.matches(rawPassword, encodedPassword);
            logger.debug("Kiểm tra mật khẩu BCrypt: {}", match);
            return match;
        }
        // Fallback cho mật khẩu plain text (chỉ dùng khi migrate, nên xóa sau khi migrate xong)
        boolean plainMatch = rawPassword != null && rawPassword.toString().equals(encodedPassword);
        if (plainMatch) {
            logger.warn("Phát hiện mật khẩu plain text, cần migrate sang BCrypt");
        }
        return plainMatch;
    }
}