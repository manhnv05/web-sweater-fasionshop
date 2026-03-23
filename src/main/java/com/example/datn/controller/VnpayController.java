package com.example.datn.controller;

import com.example.datn.config.VNPayConfig;
import com.example.datn.dto.HoaDonDTO;
import com.example.datn.service.ChiTietThanhToanService;
import com.example.datn.service.HoaDonService;
import com.example.datn.service.VNPayService;
import com.example.datn.vo.chiTietThanhToanVO.ChiTietThanhToanVO;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequestMapping("/api/vnpay")
public class VnpayController {

    private static final Logger logger = LoggerFactory.getLogger(VnpayController.class);

    @Autowired
    private VNPayService vnPayService;

    @Autowired
    private VNPayConfig vnPayConfig;

    @Autowired
    private HoaDonService hoaDonService;
    @Autowired
    private ChiTietThanhToanService chiTietThanhToanService;
    @Autowired
    private ObjectMapper objectMapper;

    @GetMapping("")
    public String home(){
        return "index";
    }

    // Nhận JSON từ FE để tạo link thanh toán
    @PostMapping("/submitOrder")
    public String submitOrder(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        int orderTotal = Integer.parseInt(body.get("amount").toString());
        String orderInfo = body.get("orderInfo").toString(); // Chú ý: nên là JSON string
        String bankcode = body.get("bankcode").toString();
        String ordertype = body.get("ordertype").toString();
        String promocode = body.get("promocode").toString();
        String locale = body.get("locale").toString();

        String urlReturn = body.containsKey("urlReturn") ? body.get("urlReturn").toString() : vnPayConfig.getReturnUrl();
        String vnpayUrl = vnPayService.createOrder(orderTotal, orderInfo, bankcode, ordertype, promocode, locale, urlReturn);

        logger.info("[submitOrder] orderTotal={}, orderInfo={}, bankcode={}, ordertype={}, locale={}",
                orderTotal, orderInfo, bankcode, ordertype, locale);

        // FE sẽ redirect sang link` này
        return "redirect:" + vnpayUrl;
    }

    // Callback sau khi thanh toán thành công từ VNPAY
    @GetMapping("/vnpay-payment")
    public String vnpayCallback(HttpServletRequest request, Model model) {
        int paymentStatus = vnPayService.orderReturn(request);

        String orderInfo     = request.getParameter("vnp_OrderInfo");
        String bankcode      = request.getParameter("vnp_BankCode");
        String promocode     = request.getParameter("vnp_PromoCode");
        String paymentTime   = request.getParameter("vnp_PayDate");
        String amountRaw     = request.getParameter("vnp_Amount");
        String locale        = request.getParameter("vnp_Locale");
        String transactionNo = request.getParameter("vnp_TransactionNo");
        String txnRef        = request.getParameter("vnp_TxnRef"); // fallback

        logger.info("[vnpayCallback] orderInfo={}, paymentStatus={}, bankcode={}, paymentTime={}, transactionNo={}",
                orderInfo, paymentStatus, bankcode, paymentTime, transactionNo);

        // Chuẩn hóa số tiền (VNPAY trả về nhân 100)
        int amount = 0;
        try {
            if (amountRaw != null) {
                long parsed = Long.parseLong(amountRaw) / 100L;
                amount = (parsed > Integer.MAX_VALUE) ? Integer.MAX_VALUE : (int) parsed;
            }
            logger.debug("[vnpayCallback] amount sau chuẩn hóa: {}", amount);
        } catch (NumberFormatException e) {
            logger.error("[vnpayCallback] Lỗi parse amountRaw: {}", amountRaw);
        }

        // Fallback mã giao dịch nếu thiếu transactionNo
        String transactionId = (transactionNo != null && !transactionNo.isBlank()) ? transactionNo : txnRef;

        model.addAttribute("orderId", orderInfo);
        model.addAttribute("bankcode", bankcode);
        model.addAttribute("promocode", promocode);
        model.addAttribute("totalPrice", amount);
        model.addAttribute("paymentTime", paymentTime);
        model.addAttribute("transactionNo", transactionId);
        model.addAttribute("locale", locale);

        // Chỉ xử lý lưu DB khi thanh toán hợp lệ
        if (paymentStatus != 1) {
            logger.warn("[vnpayCallback] paymentStatus != 1, trả về orderfail");
            return "orderfail";
        }

        try {
            String decodedOrderInfo = URLDecoder.decode(orderInfo, StandardCharsets.UTF_8.name());
            logger.debug("[vnpayCallback] decodedOrderInfo={}", decodedOrderInfo);

            int hoaDonId = Integer.parseInt(decodedOrderInfo);
            logger.debug("[vnpayCallback] hoaDonId={}", hoaDonId);

            HoaDonDTO hoaDonDTO = hoaDonService.getHoaDonById(hoaDonId);

            if (hoaDonDTO == null) {
                logger.error("[vnpayCallback] Không tìm thấy hóa đơn với id={}", hoaDonId);
                return "orderfail";
            }

            boolean existed = chiTietThanhToanService
                    .getChiTietThanhToanByHoaDonId(hoaDonId)
                    .stream()
                    .anyMatch(ct -> transactionId != null && transactionId.equals(ct.getMaGiaoDich()));

            if (!existed) {
                ChiTietThanhToanVO vo = new ChiTietThanhToanVO();
                vo.setIdHoaDon(hoaDonDTO.getId());
                vo.setIdHinhThucThanhToan(2);
                vo.setMaGiaoDich(transactionId);
                vo.setSoTienThanhToan(amount);
                vo.setTrangThaiThanhToan(1);
                vo.setGhiChu("Thanh toán qua VNPAY");

                chiTietThanhToanService.save(vo);
            }

            logger.info("[vnpayCallback] Thanh toán thành công, hoaDonId={}", hoaDonId);
            return "ordersuccess";
        } catch (Exception ex) {
            logger.error("[vnpayCallback] Exception: {}", ex.getMessage(), ex);
            return "orderfail";
        }
    }
}