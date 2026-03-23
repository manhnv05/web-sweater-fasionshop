package com.example.datn.security;

import com.example.datn.dto.QuenMatKhauDTO;
import com.example.datn.dto.RegisterKhachHangDTO;
import com.example.datn.dto.ResetMatKhauDTO;
import com.example.datn.dto.TaiKhoanResponseDTO;
import com.example.datn.entity.KhachHang;
import com.example.datn.entity.NhanVien;
import com.example.datn.repository.KhachHangRepository;
import com.example.datn.repository.NhanVienRepository;
import com.example.datn.vo.clientVO.ChangePasswordDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletResponse;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private KhachHangRepository khachHangRepository;

    @Autowired
    private NhanVienRepository nhanVienRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private JwtUtil jwtUtil;

    @Value("${cookie.secure:false}")
    private boolean cookieSecure;

    // Lưu mã xác nhận quên mật khẩu (tạm thời, production nên lưu DB/Redis)
    private final Map<String, String> passwordResetCodes = new ConcurrentHashMap<>();
    private final Random random = new Random();

    /**
     * Xử lý API đăng nhập (trả accessToken cho FE, refreshToken lưu ở httpOnly cookie)
     */
    @PostMapping("/login")
    public Map<String, Object> login(
            @RequestParam String username,
            @RequestParam String password,
            HttpServletResponse response
    ) {
        logger.info("Yêu cầu đăng nhập cho user: {}", username);

        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, password)
            );
        } catch (BadCredentialsException e) {
            logger.warn("Đăng nhập thất bại cho user: {} - Lý do: Sai thông tin đăng nhập", username);
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            Map<String, Object> error = new HashMap<>();
            error.put("message", "Sai tên đăng nhập hoặc mật khẩu");
            return error;
        } catch (Exception e) {
            logger.warn("Đăng nhập thất bại cho user: {} - Lý do: {}", username, e.getMessage());
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            Map<String, Object> error = new HashMap<>();
            error.put("message", "Lỗi xác thực: " + e.getMessage());
            return error;
        }

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String role = userDetails.getAuthorities().stream()
                .findFirst()
                .map(auth -> auth.getAuthority().replace("ROLE_", ""))
                .orElse("KHACHHANG");

        logger.info("Đăng nhập thành công cho user: {}, role: {}", username, role);

        // --- Thêm đoạn này để lấy id từ DB ---
        Integer id = null;
        if (role.equals("NHANVIEN") || role.equals("QUANLY") || role.equals("QUANTRIVIEN")) {
            Optional<NhanVien> nvOpt = nhanVienRepository.findByEmail(username);
            if (nvOpt.isPresent()) {
                id = nvOpt.get().getId();
            }
        } else {
            Optional<KhachHang> khOpt = khachHangRepository.findByEmail(username);
            if (khOpt.isPresent()) {
                id = khOpt.get().getId();
            }
        }
        // -----------------------------------

        // Sinh access token và refresh token JWT
        String accessToken = jwtUtil.generateToken(username);
        String refreshToken = jwtUtil.generateToken(username);

        // Set refresh token vào httpOnly cookie
        ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", refreshToken)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite("Strict")
                .path("/")
                .maxAge(Duration.ofDays(7))
                .build();
        response.addHeader("Set-Cookie", refreshCookie.toString());

        Map<String, Object> res = new HashMap<>();
        res.put("id", id); // <-- Thêm dòng này!
        res.put("role", role);
        res.put("username", username);
        res.put("accessToken", accessToken); // FE sẽ dùng token này cho gọi API các chức năng
        res.put("message", "Login successful");
        return res;
    }

    /**
     * API đăng ký tài khoản khách hàng.
     */
    private String generateMaKhachHang() {
        Random random = new Random();
        // Tạo một số ngẫu nhiên trong khoảng từ 10,000,000 đến 99,999,999
        int randomNumber = 10000000 + random.nextInt(90000000);
        return "KH" + randomNumber;
    }
    @PostMapping("/register")
    public ResponseEntity<?> registerKhachHang(@RequestBody RegisterKhachHangDTO request) {
        logger.info("Yêu cầu đăng ký tài khoản cho khách hàng: {}", request.getEmail());

        // Kiểm tra email đã tồn tại chưa
        if (khachHangRepository.findByEmail(request.getEmail()).isPresent()) {
            logger.warn("Email đã tồn tại: {}", request.getEmail());
            return ResponseEntity.badRequest().body("Email đã tồn tại!");
        }

        // Kiểm tra dữ liệu đầu vào (có thể bổ sung validate nâng cao hơn)
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()
                || request.getMatKhau() == null || request.getMatKhau().trim().isEmpty()
                || request.getTenKhachHang() == null || request.getTenKhachHang().trim().isEmpty()
                || request.getSdt() == null || request.getSdt().trim().isEmpty()) {
            logger.warn("Thiếu thông tin đăng ký khách hàng: {}", request);
            return ResponseEntity.badRequest().body("Vui lòng nhập đầy đủ thông tin!");
        }

        KhachHang kh = new KhachHang();
        kh.setEmail(request.getEmail());
        kh.setMatKhau(passwordEncoder.encode(request.getMatKhau()));
        kh.setTenKhachHang(request.getTenKhachHang());
        kh.setSdt(request.getSdt());
        kh.setMaKhachHang(generateMaKhachHang());
        kh.setTrangThai(1);
        // Thiết lập các trường khác nếu cần

        khachHangRepository.save(kh);

        logger.info("Đăng ký thành công cho khách hàng: {}", request.getEmail());
        return ResponseEntity.ok("Đăng ký tài khoản thành công!");
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordDTO request) {
        logger.info("Yêu cầu đổi mật khẩu cho khách hàng: {}", request.getEmail());

        // Tìm khách hàng theo email
        Optional<KhachHang> optionalKhachHang = khachHangRepository.findByEmail(request.getEmail());
        if (optionalKhachHang.isEmpty()) {
            logger.warn("Không tìm thấy khách hàng với email: {}", request.getEmail());
            return ResponseEntity.badRequest().body("Email không tồn tại!");
        }

        KhachHang khachHang = optionalKhachHang.get();

        // Kiểm tra mật khẩu cũ
        if (!passwordEncoder.matches(request.getOldPassword(), khachHang.getMatKhau())) {
            logger.warn("Mật khẩu cũ không đúng cho email: {}", request.getEmail());
            return ResponseEntity.badRequest().body("Mật khẩu cũ không đúng!");
        }

        // Cập nhật mật khẩu mới
        khachHang.setMatKhau(passwordEncoder.encode(request.getNewPassword()));
        khachHangRepository.save(khachHang);

        logger.info("Đổi mật khẩu thành công cho email: {}", request.getEmail());
        return ResponseEntity.ok("Đổi mật khẩu thành công!");
    }

    /**
     * API logout: xóa refreshToken cookie
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        ResponseCookie deleteCookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite("Strict")
                .path("/")
                .maxAge(0)
                .build();
        response.addHeader("Set-Cookie", deleteCookie.toString());
        // Trả về JSON
        return ResponseEntity.ok(Collections.singletonMap("message", "Đã đăng xuất!"));
    }

    /**
     * API gửi mã xác nhận quên mật khẩu
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody QuenMatKhauDTO request) {
        String email = request.getEmail();
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Vui lòng nhập email!");
        }
        // Kiểm tra email tồn tại (Khách hàng hoặc Nhân viên)
        boolean khExist = khachHangRepository.findByEmail(email).isPresent();
        boolean nvExist = nhanVienRepository.findByEmail(email).isPresent();
        if (!khExist && !nvExist) {
            return ResponseEntity.badRequest().body("Email không tồn tại!");
        }
        // Sinh mã xác nhận tạm thời (6 số)
        String code = String.format("%06d", random.nextInt(1000000));
        passwordResetCodes.put(email, code);

        logger.info("Gửi mã reset password '{}' cho email {}", code, email);

        // Gửi mã qua email HTML đẹp
        emailService.sendOtpHtml(email, code);

        Map<String, Object> res = new HashMap<>();
        res.put("message", "Mã xác nhận đã được gửi tới email của bạn.");
        // res.put("code", code); // Chỉ để dev test, production không nên trả về code này!
        return ResponseEntity.ok(res);
    }

    /**
     * API xác nhận mã và đổi mật khẩu mới
     */
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetMatKhauDTO request) {
        String email = request.getEmail();
        String code = request.getCode();
        String newPassword = request.getMatKhauMoi();
        String confirmPassword = request.getXacNhanMatKhauMoi();

        if (email == null || code == null || newPassword == null || confirmPassword == null
                || email.trim().isEmpty() || code.trim().isEmpty() || newPassword.trim().isEmpty() || confirmPassword.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Vui lòng nhập đầy đủ thông tin!");
        }

        if (!newPassword.equals(confirmPassword)) {
            return ResponseEntity.badRequest().body("Mật khẩu mới và xác nhận mật khẩu không khớp!");
        }

        // Kiểm tra mã xác nhận
        String storedCode = passwordResetCodes.get(email);
        if (storedCode == null || !storedCode.equals(code)) {
            return ResponseEntity.badRequest().body("Mã xác nhận không đúng hoặc đã hết hạn!");
        }

        // Đổi mật khẩu cho Khách hàng nếu tồn tại
        Optional<KhachHang> khOpt = khachHangRepository.findByEmail(email);
        if (khOpt.isPresent()) {
            KhachHang kh = khOpt.get();
            kh.setMatKhau(passwordEncoder.encode(newPassword));
            khachHangRepository.save(kh);
            passwordResetCodes.remove(email);
            logger.info("Đổi mật khẩu thành công cho khách hàng email {}", email);
            return ResponseEntity.ok(Collections.singletonMap("message", "Đặt lại mật khẩu thành công!"));
        }

        // Nếu không phải khách hàng, kiểm tra nhân viên
        Optional<NhanVien> nvOpt = nhanVienRepository.findByEmail(email);
        if (nvOpt.isPresent()) {
            NhanVien nv = nvOpt.get();
            nv.setMatKhau(passwordEncoder.encode(newPassword));
            nhanVienRepository.save(nv);
            passwordResetCodes.remove(email);
            logger.info("Đổi mật khẩu thành công cho nhân viên email {}", email);
            return ResponseEntity.ok(Collections.singletonMap("message", "Đặt lại mật khẩu thành công!"));
        }

        return ResponseEntity.badRequest().body("Email không hợp lệ!");
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpServletResponse.SC_UNAUTHORIZED)
                    .body(Collections.singletonMap("message", "Chưa đăng nhập"));
        }

        String username = authentication.getName();

        // Kiểm tra nhân viên trước
        Optional<NhanVien> nvOpt = nhanVienRepository.findByEmail(username);
        if (nvOpt.isPresent()) {
            NhanVien nv = nvOpt.get();
            Map<String, Object> res = new HashMap<>();
            res.put("id", nv.getId()); // id nhân viên
            res.put("username", nv.getEmail());
            res.put("maNhanVien", nv.getMaNhanVien());
            res.put("tenNhanVien", nv.getHoVaTen());
            res.put("hinhAnh", nv.getHinhAnh());
            res.put("role", "NHANVIEN");
            return ResponseEntity.ok(res);
        }

        // Nếu không phải nhân viên thì check khách hàng
        Optional<KhachHang> khOpt = khachHangRepository.findByEmail(username);
        if (khOpt.isPresent()) {
            KhachHang kh = khOpt.get();
            Map<String, Object> res = new HashMap<>();
            res.put("id", kh.getId()); // id khách hàng
            res.put("username", kh.getEmail());
            res.put("role", "KHACHHANG");
            res.put("hinhAnh", kh.getHinhAnh());
            res.put("sdt", kh.getSdt());
            res.put("gioiTinh", kh.getGioiTinh());
            res.put("tenKh", kh.getTenKhachHang());
            res.put("maKh", kh.getMaKhachHang());
            res.put("email", kh.getEmail());
            return ResponseEntity.ok(res);
        }

        // Không tìm thấy user
        return ResponseEntity.status(HttpServletResponse.SC_UNAUTHORIZED)
                .body(Collections.singletonMap("message", "Không tìm thấy thông tin người dùng"));
    }
    @GetMapping("/lay-thong-tin/nguoi-dung-hien-tai")
    public ResponseEntity<?> getUser(Authentication authentication) {
        // 1. Kiểm tra trạng thái đăng nhập
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpServletResponse.SC_UNAUTHORIZED)
                    .body(Collections.singletonMap("message", "Chưa đăng nhập"));
        }

        String username = authentication.getName(); // Lấy email từ phiên đăng nhập

        // 2. Ưu tiên tìm trong bảng Nhân Viên trước
        Optional<NhanVien> nvOpt = nhanVienRepository.findByEmail(username);
        if (nvOpt.isPresent()) {
            NhanVien nv = nvOpt.get();
            // Xác định vai trò dựa trên id_vai_tro
            String vaiTro = (nv.getVaiTro().getId() == 2) ? "ADMIN" : "NHANVIEN";

            // Tạo DTO hợp nhất từ thông tin Nhân Viên
            TaiKhoanResponseDTO dto = new TaiKhoanResponseDTO(
                    nv.getId(),
                    nv.getMaNhanVien(),
                    nv.getHoVaTen(),
                    nv.getEmail(),
                    nv.getHinhAnh(),
                    vaiTro
            );
            // Trả về đối tượng DTO duy nhất
            return ResponseEntity.ok(dto);
        }

        // 3. Nếu không phải Nhân Viên, tìm trong bảng Khách Hàng
        Optional<KhachHang> khOpt = khachHangRepository.findByEmail(username);
        if (khOpt.isPresent()) {
            KhachHang kh = khOpt.get();

            // Tạo DTO hợp nhất từ thông tin Khách Hàng
            TaiKhoanResponseDTO dto = new TaiKhoanResponseDTO(
                    kh.getId(),
                    kh.getMaKhachHang(), // Giả sử khách hàng có mã
                    kh.getTenKhachHang(),
                    kh.getEmail(),
                    kh.getHinhAnh(),
                    "KHACHHANG"
            );
            // Trả về đối tượng DTO duy nhất
            return ResponseEntity.ok(dto);
        }

        // 4. Nếu không tìm thấy thông tin ở cả 2 bảng
        return ResponseEntity.status(HttpServletResponse.SC_UNAUTHORIZED)
                .body(Collections.singletonMap("message", "Không tìm thấy thông tin người dùng"));
    }
}