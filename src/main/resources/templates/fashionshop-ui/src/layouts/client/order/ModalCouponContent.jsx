import React, { useEffect, useState, useMemo } from "react";
import PropTypes from "prop-types";
import { Box, Typography, Button, IconButton, CircularProgress, Paper, Stack } from "@mui/material";
import ConfirmationNumberOutlinedIcon from "@mui/icons-material/ConfirmationNumberOutlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import CloseIcon from "@mui/icons-material/Close";
import { PRIMARY_BLUE, WHITE, LIGHT_BLUE_BG, BORDER_COLOR, MAIN_TEXT_COLOR } from "./constants";
import axios from "axios";
// --- Helpers ---
const formatCurrency = (amount) => `${Number(amount).toLocaleString("vi-VN")}₫`;

// Hàm tính giá trị giảm giá thực tế của một voucher dựa trên tổng tiền
const calculateActualDiscount = (coupon, subtotal) => {
  if (!coupon || subtotal <= 0) return 0;
  let discount = 0;
  // Giảm theo %
  if ( (coupon.phamTramGiamGia && coupon.phamTramGiamGia > 0)) {
    discount = subtotal * (coupon.phamTramGiamGia / 100);
    if (coupon.giamToiDa > 0) {
      discount = Math.min(discount, coupon.giamToiDa);
    }
  } 
  // Giảm thẳng tiền
  else if (coupon.loaiPhieu === 1 || (coupon.soTienGiam && coupon.soTienGiam > 0)) {
    discount = coupon.soTienGiam;
  }
  return discount;
};

const formatVoucherDetails = (voucher) => {
    if (!voucher) return "";
    let details = [];
  
    // Theo ý bạn: loaiPhieu === 0 là giảm thẳng tiền
    if ( voucher.soTienGiam > 0) {
      details.push(`Giảm ${formatCurrency(voucher.soTienGiam)}`);
    } 
    // Theo ý bạn: loaiPhieu === 1 là giảm theo %
    else if ( voucher.phamTramGiamGia > 0) {
      details.push(`Giảm ${voucher.phamTramGiamGia}%`);
      if (voucher.giamToiDa > 0) {
        details.push(`tối đa ${formatCurrency(voucher.giamToiDa)}`);
      }
    }
  
    // Điều kiện tối thiểu vẫn giữ nguyên
    if (voucher.dieuKienGiam > 0) {
      details.push(`cho đơn từ ${formatCurrency(voucher.dieuKienGiam)}`);
    }
  
    // Xử lý trường hợp không có thông tin giảm giá rõ ràng
    if (details.length === 0) {
        return "Khuyến mãi đặc biệt";
    }
  
    return details.join(" ");
};
// Dùng API động, không lấy AVAILABLE_COUPONS cứng nữa
export default function ModalCouponContent({ onClose, handleQuickCouponSelect ,itemSubtotal, user}) {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Gọi API lấy danh sách mã giảm giá động, có thể truyền thêm props để fetch đúng tổng tiền
        // Ở đây demo: lấy tất cả mã, bạn có thể truyền prop "subtotal" để lọc phù hợp
        const fetchCoupons = async () => {
            setLoading(true);
            try {
                // Thay thế bằng API thực tế của bạn, ví dụ /PhieuGiamGiaKhachHang/query
                const response = await axios.post(
                    "http://localhost:8080/PhieuGiamGiaKhachHang/query",
                    {  tongTienHoaDon: itemSubtotal,
          khachHang: user && user.id ?  user.id : null }
                );
                setCoupons(response.data?.data?.content || []);
            } catch {
                setCoupons([]);
            }
            setLoading(false);
        };
        fetchCoupons();
    }, [itemSubtotal, user]);

    // Sắp xếp để tìm coupon tốt nhất dựa trên giá trị giảm giá thực tế
  const sortedCoupons = useMemo(() => {
    if (!coupons || coupons.length === 0) return [];
    return [...coupons].sort((a, b) => {
        const discountA = calculateActualDiscount(a, itemSubtotal);
        const discountB = calculateActualDiscount(b, itemSubtotal);
        return discountB - discountA; // Sắp xếp giảm dần
    });
  }, [coupons, itemSubtotal]);
    // Tìm coupon tốt nhất (ví dụ: giảm nhiều nhất)
   const bestCoupon = sortedCoupons.length > 0 ? sortedCoupons[0] : null;
  const otherCoupons = sortedCoupons.length > 1 ? sortedCoupons.slice(1) : [];

  
  return (
    <Paper
      sx={{
        bgcolor: WHITE, borderRadius: 3, width: 450, maxWidth: "90vw",
        mx: "auto", p: 0, boxShadow: 8, outline: "none",
        display: 'flex', flexDirection: 'column'
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", borderBottom: `1px solid ${BORDER_COLOR}`, p: 2, pb: 1.5, flexShrink: 0 }}>
        <IconButton size="small" sx={{ mr: 1 }} onClick={onClose}> <CloseIcon /> </IconButton>
        <Typography sx={{ fontWeight: 700, flex: 1, textAlign: "center", fontSize: 17, color: MAIN_TEXT_COLOR }}>
          Chọn mã khuyến mãi
        </Typography>
        <Box width={32} />
      </Box>

      <Box sx={{ p: 2, flex: 1, overflowY: 'auto', minHeight: 300, maxHeight: '70vh' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : coupons.length === 0 ? (
          <Box sx={{ textAlign: 'center', my: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <LocalOfferOutlinedIcon sx={{ color: "#ccc", fontSize: 56, mb: 2 }} />
            <Typography color="#888" fontWeight={500}>
              Không có mã khuyến mãi phù hợp
            </Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            {bestCoupon && (
              <Box>
                <Typography sx={{ fontWeight: 700, color: PRIMARY_BLUE, mb: 1, fontSize: 15 }}>
                  Đề xuất tốt nhất
                </Typography>
                <VoucherCard coupon={bestCoupon} onSelect={handleQuickCouponSelect} subtotal={itemSubtotal} isBest />
              </Box>
            )}
            {otherCoupons.length > 0 && (
              <Box>
                <Typography sx={{ fontWeight: 700, color: MAIN_TEXT_COLOR, mb: 1, fontSize: 15 }}>
                  Các mã khác
                </Typography>
                <Stack spacing={1.5}>
                  {otherCoupons.map((coupon) => (
                    <VoucherCard key={coupon.id} coupon={coupon} onSelect={handleQuickCouponSelect} subtotal={itemSubtotal} />
                  ))}
                </Stack>
              </Box>
            )}
          </Stack>
        )}
      </Box>
    </Paper>
  );
}

// Component con để render từng thẻ Voucher
const VoucherCard = ({ coupon, onSelect, subtotal, isBest = false }) => {
    const actualDiscount = calculateActualDiscount(coupon, subtotal);

    return (
        <Paper 
            variant="outlined"
            sx={{
                p: 1.5,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                borderColor: isBest ? PRIMARY_BLUE : BORDER_COLOR,
                borderWidth: isBest ? '1.5px' : '1px',
                bgcolor: isBest ? LIGHT_BLUE_BG : 'transparent',
            }}
        >
            <Box sx={{ mr: 2, textAlign: 'center', color: PRIMARY_BLUE }}>
                <ConfirmationNumberOutlinedIcon sx={{ fontSize: 40 }}/>
            </Box>
            <Box flex={1}>
                <Typography fontWeight={700} color={MAIN_TEXT_COLOR}>{coupon.tenPhieu}</Typography>
                <Typography fontSize={14} color={isBest ? PRIMARY_BLUE : "#444"} fontWeight={500}>{formatVoucherDetails(coupon)}</Typography>
                <Typography fontSize={13} color="#777">HSD: {new Date(coupon.ngayKetThuc).toLocaleDateString('vi-VN')}</Typography>
            </Box>
            <Button
                variant="text"
                onClick={() => onSelect(coupon)}
                sx={{ fontWeight: 700, color: PRIMARY_BLUE, ml: 1, alignSelf: 'center' }}
            >
                Dùng
            </Button>
        </Paper>
    )
}


ModalCouponContent.propTypes = {
  onClose: PropTypes.func.isRequired,
  handleQuickCouponSelect: PropTypes.func.isRequired,
  // Thêm propTypes cho các props mới
  itemSubtotal: PropTypes.number.isRequired,
  user: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  })
};

ModalCouponContent.defaultProps = {
    user: null
};
VoucherCard.propTypes = {
    coupon: PropTypes.object.isRequired,
    onSelect: PropTypes.func.isRequired,
    subtotal: PropTypes.number.isRequired,
    isBest: PropTypes.bool
};