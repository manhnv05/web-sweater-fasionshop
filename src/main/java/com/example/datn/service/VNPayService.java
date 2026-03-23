package com.example.datn.service;

import com.example.datn.config.VNPayConfig;
import com.example.datn.service.impl.HoaDonServiceImpl;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@Service
public class VNPayService {

    @Autowired
    private VNPayConfig vnPayConfig;

    // Tạo URL thanh toán VNPAY
    public String createOrder(int total, String orderInfor, String bankcode, String ordertype, String promocode, String locale, String urlReturn) {
        String vnp_Version = "2.1.1";
        String vnp_Command = "pay";
        String vnp_TxnRef = HoaDonServiceImpl.generateShortRandomMaHoaDonUUID();
        String vnp_IpAddr = "127.0.0.1";
        String vnp_TmnCode = vnPayConfig.getTmnCode();

        Map<String, String> vnp_Params = new HashMap<>();
        vnp_Params.put("vnp_Version", vnp_Version);
        vnp_Params.put("vnp_Command", vnp_Command);
        vnp_Params.put("vnp_TmnCode", vnp_TmnCode);
        vnp_Params.put("vnp_Amount", String.valueOf(total * 100));
        vnp_Params.put("vnp_CurrCode", "VND");
        vnp_Params.put("vnp_TxnRef", vnp_TxnRef);
        vnp_Params.put("vnp_OrderInfo", orderInfor);
        vnp_Params.put("vnp_OrderType", ordertype);
        vnp_Params.put("vnp_BankCode", bankcode);
        vnp_Params.put("vnp_PromoCode", promocode);
        vnp_Params.put("vnp_Locale", locale);
        vnp_Params.put("vnp_ReturnUrl", urlReturn);
        vnp_Params.put("vnp_IpAddr", vnp_IpAddr);
        //vnp_Params.put("vnp_IpnUrl", VNPayConfig.vnp_IpnUrl);


        Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        String vnp_CreateDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_CreateDate", vnp_CreateDate);

        cld.add(Calendar.MINUTE, 15);
        String vnp_ExpireDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_ExpireDate", vnp_ExpireDate);

        // Build data to hash and query string
        List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = vnp_Params.get(fieldName);
            if ((fieldValue != null) && (fieldValue.length() > 0)) {
                hashData.append(fieldName).append('=').append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII));
                query.append('=');
                query.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                if (itr.hasNext()) {
                    query.append('&');
                    hashData.append('&');
                }
            }
        }
        String queryUrl = query.toString();
        String vnp_SecureHash = VNPayConfig.hmacSHA512(vnPayConfig.getHashSecret(), hashData.toString());
        queryUrl += "&vnp_SecureHash=" + vnp_SecureHash;
        String paymentUrl = vnPayConfig.getPayUrl() + "?" + queryUrl;
        return paymentUrl;
    }

    // Xử lý kết quả trả về của VNPAY (trang redirect, hoặc IPN)
    public int orderReturn(HttpServletRequest request) {
        // Lấy tất cả tham số từ request (không encode key và value khi check chữ ký)
        Map<String, String> fields = new HashMap<>();
        for (Enumeration<String> params = request.getParameterNames(); params.hasMoreElements(); ) {
            String fieldName = params.nextElement();
            String fieldValue = request.getParameter(fieldName);
            if ((fieldValue != null) && (fieldValue.length() > 0)) {
                fields.put(fieldName, fieldValue);
            }
        }

        // Lấy secure hash từ request
        String vnp_SecureHash = request.getParameter("vnp_SecureHash");

        // Remove các trường hash khỏi fields trước khi hash lại
        fields.remove("vnp_SecureHashType");
        fields.remove("vnp_SecureHash");

        // Hash lại toàn bộ fields (đúng thứ tự alphabet key)
        String signValue = vnPayConfig.hashAllFields(fields);

        // So sánh chữ ký hợp lệ
        if (signValue.equals(vnp_SecureHash)) {
            // Kiểm tra mã giao dịch thành công
            // VNPAY trả về vnp_ResponseCode = "00" (IPN) hoặc vnp_TransactionStatus = "00" (trang redirect)
            String responseCode = request.getParameter("vnp_ResponseCode");
            String transactionStatus = request.getParameter("vnp_TransactionStatus");
            if ("00".equals(responseCode) || "00".equals(transactionStatus)) {
                return 1; // Thành công
            } else {
                return 0; // Không thành công
            }
        } else {
            return -1; // Chữ ký không hợp lệ
        }
    }
}