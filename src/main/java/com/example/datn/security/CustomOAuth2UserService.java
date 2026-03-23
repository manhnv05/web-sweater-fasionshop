package com.example.datn.security;

import com.example.datn.entity.KhachHang;
import com.example.datn.repository.KhachHangRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.*;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private static final Logger logger = LoggerFactory.getLogger(CustomOAuth2UserService.class);

    @Autowired
    private KhachHangRepository khachHangRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");

        logger.info("[OAuth2] Đăng nhập: email={}, name={}", email, name);

        Optional<KhachHang> khOpt = khachHangRepository.findByEmail(email);
        if (khOpt.isEmpty()) {
            KhachHang kh = new KhachHang();
            kh.setEmail(email);
            kh.setTenKhachHang(name);
            khachHangRepository.save(kh);
            logger.info("[OAuth2] Tạo mới khách hàng: {}", email);
        } else {
            logger.info("[OAuth2] Khách hàng đã tồn tại: {}", email);
        }

        List<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("ROLE_KHACHHANG")
        );
        logger.debug("[OAuth2] Authorities: {}", authorities);

        // Trả về user có quyền đúng cho Spring Security
        return new DefaultOAuth2User(authorities, oAuth2User.getAttributes(), "email");
    }
}