package com.example.datn.security;
import org.springframework.security.config.Customizer;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private static final Logger logger = LoggerFactory.getLogger(SecurityConfig.class);

    @Autowired
    private CustomOAuth2UserService oAuth2UserService; // Inject Custom OAuth2 User Service

    /**
     * SuccessHandler cho login truyền thống (API/fetch): trả JSON có role
     */
    private final AuthenticationSuccessHandler apiLoginSuccessHandler = (request, response, authentication) -> {
        String role = authentication.getAuthorities().stream()
                .findFirst()
                .map(auth -> auth.getAuthority().replace("ROLE_", ""))
                .orElse("KHACHHANG");
        logger.info("[DEBUG] apiLoginSuccessHandler CALLED, role={}", role);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("{\"message\": \"Login successful\", \"role\": \"" + role + "\"}");
        response.getWriter().flush();
    };

    // SuccessHandler cho OAuth2 login (Google, Facebook...): redirect về FE
    private final AuthenticationSuccessHandler oauth2SuccessHandler = (request, response, authentication) -> {
        String role = authentication.getAuthorities().stream()
                .findFirst()
                .map(auth -> {
                    logger.info("[DEBUG] oauth2SuccessHandler CALLED, authority={}", auth.getAuthority());
                    return auth.getAuthority().replace("ROLE_", "");
                })
                .orElse("KHACHHANG");
        logger.info("[DEBUG] oauth2SuccessHandler ROLE={}, redirecting...", role);
        String redirectUrl = "http://localhost:3000/oauth2/redirect?role=" + role;
        logger.info("[DEBUG] oauth2SuccessHandler set Location header: {}", redirectUrl);
        response.setStatus(HttpServletResponse.SC_FOUND);
        response.setHeader("Location", redirectUrl);
    };

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        logger.info("Cấu hình SecurityFilterChain: cho phép đăng nhập truyền thống và OAuth2");

        http
                .cors(Customizer.withDefaults())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth

                        .requestMatchers(
                                "/api/public/**",
                                "/oauth2/**",
                                "/login/**",
                                "/api/auth/forgot-password",
                                "/api/home/**",
                                 "/api/auth/reset-password",
                                "/api/auth/login",
                                "/phieu_giam_gia/public",
                                "/api/auth/register",
                                "/ws/**",
                                "/PhieuGiamGiaKhachHang/query",
                                "/kichThuoc/all",
                                "/mauSac/all",
                                "/thuongHieu/all",
                                "/danhMuc/all",
                                "/api/shop/**",
                                "/api/v1/**",
                                "/api/outlet/**",
                                "/api/hoa-don/luu-hoa-don-online-chua-dang-nhap",
                                "/chiTietThanhToan",
                                "/api/hoa-don/tra-cuu-hoa-don/**",
                                "/api/hoa-don/get-all-so-luong-ton-kho",
                                "/api/vnpay/**",
                                "/api/chatbot/**",
                                "/danhMuc/**"


                        ).permitAll()
                        // CHẶN QUYỀN TRUY CẬP API QUẢN TRỊ: chỉ cho phép các role quản trị
                        .requestMatchers("/thong_ke/**", "/dashboard/**").hasAnyRole("NHANVIEN", "QUANLY", "QUANTRIVIEN")
                        .anyRequest().authenticated()
                )
                .formLogin(formLogin -> formLogin
                        .loginPage("/api/auth/login")
                        .successHandler(apiLoginSuccessHandler) // trả JSON có role
                        .failureHandler((request, response, exception) -> {
                            logger.info("[DEBUG] formLogin FAILURE HANDLER called");
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType("application/json");
                            response.getWriter().write("{\"message\": \"Login failed\"}");
                            response.getWriter().flush();
                        })
                        .permitAll()
                )
                .oauth2Login(oauth2 -> oauth2
                        .loginPage("/oauth2/authorization/google")
                        .userInfoEndpoint(userInfo -> userInfo
                                .userService(oAuth2UserService)
                        )
                        .successHandler(oauth2SuccessHandler) // redirect về FE!
                )
                .logout(logout -> logout
                        // 1. Endpoint để kích hoạt đăng xuất (phía FE sẽ gọi POST đến URL này)
                        .logoutUrl("/api/auth/logout")

                        // 2. Vô hiệu hóa session trên server (dọn dẹp "ngăn tủ")
                        .invalidateHttpSession(true)

                        // 3. Yêu cầu trình duyệt xóa các cookie này
                        .deleteCookies("SESSION", "refreshToken")

                        // 4. Xử lý sau khi logout thành công (trả về JSON cho FE)
                        .logoutSuccessHandler((request, response, authentication) -> {
                            response.setStatus(HttpServletResponse.SC_OK);
                            response.setContentType("application/json");
                            response.getWriter().write("{\"message\": \"Đã đăng xuất thành công!\"}");
                            response.getWriter().flush();
                        })
                )
                .httpBasic(httpBasic -> httpBasic.disable())
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint((request, response, authException) -> {
                            logger.info("[DEBUG] exceptionHandling AUTH ENTRYPOINT called");
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType("application/json");
                            response.getWriter().write("{\"message\": \"Unauthorized\"}");
                        })
                );
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        logger.info("Khởi tạo bean PasswordEncoder (CustomPasswordEncoder)");
        return new CustomPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        logger.info("Khởi tạo bean CorsConfigurationSource cho CORS");
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:3000"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("Authorization", "Content-Type"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        logger.info("Khởi tạo bean AuthenticationManager");
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public CustomUserDetailsService customUserDetailsService() {
        logger.info("Khởi tạo bean CustomUserDetailsService");
        return new CustomUserDetailsService();
    }
}