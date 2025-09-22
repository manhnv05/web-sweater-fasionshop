import React, { useEffect, useState, useCallback } from "react";
import PropTypes from "prop-types";
import OrderDetailModal from "./OrderDetailModal";
import axios from "axios"; // Import axios để gọi API
import { Client } from "@stomp/stompjs"; // <-- THÊM MỚI
import SockJS from "sockjs-client";
import { toast } from "react-toastify";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Chip,
  Divider,
  Button,
  CircularProgress,
  Pagination,
  Dialog, // <-- THÊM MỚI
  DialogActions, // <-- THÊM MỚI
  DialogContent, // <-- THÊM MỚI
  DialogContentText, // <-- THÊM MỚI
  DialogTitle,
} from "@mui/material";

// Hàm helper để chuyển đổi trạng thái từ API sang text và màu sắc
const formatOrderStatus = (status) => {
  switch (status) {
    case "TAO_DON_HANG":
      return { text: "Tạo đơn hàng", color: "success" };
    // Thêm các trạng thái đang xử lý khác nếu có
    case "CHO_XAC_NHAN":
      return { text: "Chờ xác nhận", color: "success" };
    // Thêm các trạng thái đang xử lý khác nếu có
    case "DA_XAC_NHAN":
      return { text: "Đã xác nhận", color: "success" };
    // Thêm các trạng thái đang xử lý khác nếu có
    case "CHO_GIAO_HANG":
      return { text: "Chờ giao hàng", color: "success" };
    case "HUY":
      return { text: "Hủy", color: "error" };
    case "DANG_VAN_CHUYEN":
      return { text: "Đang vận chuyển", color: "info" };
    case "HOAN_THANH":
      return { text: "Hoàn thành", color: "success" };
    // Thêm các trạng thái đang xử lý khác nếu có
    default:
      return { text: status, color: "primary" };
  }
};

// Hàm helper để định dạng ngày tháng
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export default function OrderListTab({ user }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrderCode, setSelectedOrderCode] = useState(null);
  const [allOrders, setAllOrders] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1); // BƯỚC 2: Thêm state cho trang hiện tại
  const ORDERS_PER_PAGE = 5; // Số đơn hàng mỗi trang
  const pageCount = Math.ceil(allOrders.length / ORDERS_PER_PAGE);
  const displayedOrders = allOrders.slice((page - 1) * ORDERS_PER_PAGE, page * ORDERS_PER_PAGE);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [isPaid, setIsPaid] = useState(false);
  const handleOpenCancelModal = (order) => {
    setOrderToCancel(order);
    setCancelModalOpen(true);
  };

  const handleCloseCancelModal = () => {
    setCancelModalOpen(false);
    setOrderToCancel(null);
  };

  const checkPaymentStatus = useCallback(async (id) => {
      if (!id) {
        setIsPaid(false); // Reset trạng thái nếu không có orderId
        return;
      }
      try {
        const response = await axios.get(
          `${BASE_SERVER_URL}chiTietThanhToan/lich-su-thanh-toan/${id}`,
          { withCredentials: true }
        );
        const paymentHistory = response.data?.data || [];
        setIsPaid(paymentHistory.length > 0); // Set true nếu có lịch sử, ngược lại false
      } catch (error) {
        console.error("Lỗi khi kiểm tra lịch sử thanh toán:", error);
        // Mặc định là chưa thanh toán nếu có lỗi
        setIsPaid(false);
      }
    }, []);
  const handleConfirmCancel = async () => {
    if (!orderToCancel) return;

    try {
      // API MỚI với URL và payload chính xác
      await axios.put(
        `http://localhost:8080/api/hoa-don/chuyen-trang-thai-huy/${orderToCancel.id}`,
        { ghiChu: "DA_HUY" },
         { withCredentials: true }  // Đây là payload bạn đã cung cấp
      );

      // Cập nhật UI ngay lập tức
      setAllOrders((prevOrders) => prevOrders.filter((order) => order.id !== orderToCancel.id));

      // Đóng modal sau khi thành công
      handleCloseCancelModal();

      // Tùy chọn: hiển thị thông báo thành công
      toast.success(`Đã hủy thành công đơn hàng #${orderToCancel.maHoaDon}`);
    } catch (error) {
      console.error("Lỗi khi hủy đơn hàng:", error);
      toast.error("Có lỗi xảy ra khi hủy đơn hàng. Vui lòng thử lại.");
    }
  };
  // === BƯỚC 2.2: Tạo hàm để mở/đóng Modal ===
  const handleOpenModal = (orderCode) => {
    setSelectedOrderCode(orderCode);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrderCode(null);
  };
  const handlePageChange = (event, value) => {
    setPage(value);
  };

  // <-- BẮT ĐẦU PHẦN THÊM MỚI (HÀM HỦY ĐƠN) -->
  const handleCancelOrder = async (orderId) => {
    // Hỏi người dùng để xác nhận
    if (window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")) {
      try {
        // Gọi API để hủy đơn hàng
        // !!! LƯU Ý: Thay đổi URL này cho đúng với API backend của bạn !!!
        await axios.put(`http://localhost:8080/api/don-hang/huy/${orderId}`),
          { withCredentials: true };

        // Cập nhật giao diện ngay lập tức bằng cách xóa đơn hàng khỏi danh sách
        setAllOrders((prevOrders) => prevOrders.filter((order) => order.id !== orderId));

        // Tùy chọn: hiển thị thông báo thành công
        alert("Đã hủy đơn hàng thành công.");
      } catch (error) {
        console.error("Lỗi khi hủy đơn hàng:", error);
        // Tùy chọn: hiển thị thông báo lỗi
        alert("Có lỗi xảy ra khi hủy đơn hàng. Vui lòng thử lại.");
      }
    }
  };
  const fetchOrdersAndPayments = useCallback(async () => {
    // Sử dụng optional chaining (?.) để kiểm tra user và user.id một cách an toàn
    if (!user?.id) {
      setAllOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:8080/api/lich-su-hoa-don/lay-lich-su/khach-hang/${user.id}`,
        {
          headers: { "Cache-Control": "no-cache", Pragma: "no-cache", Expires: "0" },
          withCredentials: true,
        }
      );

      if (response.data && response.data.data) {
        const pendingOrdersRaw = response.data.data
          .filter((order) => order.trangThai !== "HOAN_THANH" && order.trangThai !== "HUY")
          .map((order) => ({
            id: order.idHoaDon,
            maHoaDon: order.maHoaDon,
            trangThai: order.trangThai,
            ngayTao: order.ngayTao, // Giữ nguyên định dạng date để sort
            tongTien: order.tongTien,
            soLuongSanPham: order.soLuongSanPham,
            diaChi: order.diaChi || "Không có thông tin địa chỉ",
          }));

        const ordersWithPaymentStatusPromises = pendingOrdersRaw.map(async (order) => {
          let hasPaid = false;
          if (order.trangThai === "CHO_XAC_NHAN") {
            try {
              const paymentResponse = await axios.get(
                `http://localhost:8080/chiTietThanhToan/lich-su-thanh-toan/${order.id}`,
                { withCredentials: true }
              );
              if (paymentResponse.data?.data?.length > 0) {
                hasPaid = true;
              }
            } catch (e) {}
          }
          return { ...order, daThanhToan: hasPaid };
        });

        const finalOrders = await Promise.all(ordersWithPaymentStatusPromises);
        // Sắp xếp theo ngày tạo mới nhất
        setAllOrders(finalOrders.sort((a, b) => new Date(b.ngayTao) - new Date(a.ngayTao)));
      } else {
        setAllOrders([]);
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách đơn hàng:", error);
      toast.error("Không thể tải dữ liệu đơn hàng.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]); // ✅ SỬA LỖI: Chỉ phụ thuộc vào user.id, là một giá trị ổn định
  useEffect(() => {
    fetchOrdersAndPayments();
  }, [fetchOrdersAndPayments]);
  useEffect(() => {
    if (user && user.id) {
      const client = new Client({
        webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
        debug: () => {},
        reconnectDelay: 5000,
        onConnect: () => {
          console.log("WebSocket đã kết nối!");
          client.subscribe(`/topic/orders/${user.id}`, (message) => {
            const updatedOrderDTO = JSON.parse(message.body);

            setAllOrders((prevOrders) => {
              const newStatus = updatedOrderDTO.trangThaiMoi;
              const isStillPending = newStatus !== "HOAN_THANH" && newStatus !== "HUY";

              const orderExists = prevOrders.some((o) => o.id == updatedOrderDTO.idHoaDon);

              // Trường hợp 1: Đơn hàng đã có trong danh sách
              if (orderExists) {
                if (isStillPending) {
                  // 1a: Cập nhật trạng thái mới
                  // Dùng .map() để TẠO RA MẢNG MỚI
                  return prevOrders.map((order) =>
                    order.id == updatedOrderDTO.idHoaDon
                      ? { ...order, trangThai: newStatus }
                      : // Dấu hai chấm ":" biểu thị else. Nghĩa là: nếu id không khớp thì giữ nguyên.
                        order
                  );
                } else {
                  // 1b: Xóa khỏi danh sách vì đã hoàn thành/hủy
                  // Dùng .filter() để TẠO RA MẢNG MỚI không chứa đơn hàng cần xóa
                  return prevOrders.filter((order) => order.id != updatedOrderDTO.idHoaDon);
                }
              }
              // Trường hợp 2: Đơn hàng mới xuất hiện
              else {
                if (isStillPending) {
                  // 2a: Thêm vào danh sách nếu là đơn hàng mới đang xử lý
                  const newOrderForState = {
                    id: updatedOrderDTO.idHoaDon,
                    // Giữ các thuộc tính khác khớp với cấu trúc state của bạn
                    maHoaDon: updatedOrderDTO.maHoaDon,
                    trangThai: updatedOrderDTO.trangThaiMoi,
                    ngayTao: formatDate(updatedOrderDTO.ngayTao), // Nên format lại
                    tongTien: updatedOrderDTO.tongTien,
                    soLuongSanPham: updatedOrderDTO.soLuongSanPham,
                    diaChi: updatedOrderDTO.diaChi,
                  };
                  // Dùng spread operator (...) để TẠO RA MẢNG MỚI có chứa đơn hàng mới ở đầu
                  return [newOrderForState, ...prevOrders];
                }
                // 2b: Bỏ qua nếu là đơn hàng mới nhưng đã hoàn thành/hủy
                return prevOrders; // Trả về mảng cũ không thay đổi
              }
            });
          });
        },
        onStompError: (frame) => {
          console.error("Lỗi Stomp: " + frame.headers["message"]);
        },
      });

      client.activate();

      return () => {
        client.deactivate();
      };
    }
  }, [user?.id, fetchOrdersAndPayments]);

  if (!user || !user.id) {
    return (
      <Paper sx={{ p: 6, mt: 8, textAlign: "center" }}>
        <Typography variant="h6">Vui lòng đăng nhập để xem đơn hàng!</Typography>
      </Paper>
    );
  }

  if (loading) {
    return (
      <Stack alignItems="center" mt={6}>
        <CircularProgress />
      </Stack>
    );
  }

  if (allOrders.length === 0) {
    return (
      <Paper sx={{ p: 6, mt: 8, textAlign: "center" }}>
        <Typography variant="h6">Bạn chưa có đơn hàng nào đang xử lý.</Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Typography variant="h6" fontWeight={700} mb={2}>
        Đơn hàng đang xử lý
      </Typography>
      <Stack spacing={2}>
        {displayedOrders.map((order) => {
          const statusInfo = formatOrderStatus(order.trangThai);
          return (
            <Paper key={order.id} sx={{ p: 3, borderRadius: 4, boxShadow: 3 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography fontWeight={700}>Mã đơn: #{order.maHoaDon}</Typography>
                <Chip
                  label={statusInfo.text}
                  color={statusInfo.color}
                  sx={{ fontWeight: 700, fontSize: 14, color: "white" }}
                />
                <Typography ml="auto" color="#888" fontSize={15}>
                  Ngày đặt: {formatDate(order.ngayTao) }
                </Typography>
              </Stack>
              <Divider sx={{ my: 1.5 }} />
              <Box>
                <Typography>
                  Tổng tiền:{" "}
                  <b style={{ color: "#e53935" }}>
                    {order.tongTien != null ? order.tongTien.toLocaleString("vi-VN") + "₫" : "N/A"}
                  </b>
                </Typography>
                <Typography color="#888" fontSize={14} mt={0.5}>
                  Số sản phẩm: {order.soLuongSanPham}
                </Typography>
                <Typography color="#888" fontSize={14} mt={0.5}>
                  Địa chỉ: {order.diaChi}
                </Typography>
              </Box>
              <Stack direction="row" spacing={2} mt={2}>
                <Button
                  variant="outlined"
                  size="medium"
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 400,
                    color: "#49a3f1",
                    borderColor: "#49a3f1",
                    boxShadow: "none",
                    "&:hover": {
                      borderColor: "#1769aa",
                      background: "#f0f6fd",
                      color: "#1769aa",
                    },
                  }}
                  onClick={() => handleOpenModal(order.maHoaDon)}
                >
                  Xem chi tiết
                </Button>
                {order.trangThai === "CHO_XAC_NHAN" && !isPaid &&(
                  <Button
                    variant="outlined"
                    size="medium"
                    sx={{
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 400,
                      color: "#f44336", // Màu đỏ (Material Red 500)
                      borderColor: "#f44336",
                      boxShadow: "none",
                      "&:hover": {
                        borderColor: "#d32f2f", // Màu đỏ đậm hơn
                        background: "#fdecea", // Màu nền nhạt đỏ khi hover
                        color: "#d32f2f",
                      },
                    }}
                    onClick={() => handleOpenCancelModal(order)}
                  >
                    Hủy đơn hàng
                  </Button>
                )}
              </Stack>
            </Paper>
          );
        })}
      </Stack>
      {pageCount > 1 && (
        <Stack alignItems="center" mt={4}>
          <Pagination
            count={pageCount}
            page={page}
            onChange={handlePageChange}
            color="primary"
            size="large"
          />
        </Stack>
      )}
      {isModalOpen && (
        <OrderDetailModal
          open={isModalOpen}
          onClose={handleCloseModal}
          orderCode={selectedOrderCode}
        />
      )}
      <Dialog
        open={cancelModalOpen}
        onClose={handleCloseCancelModal}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Xác nhận hủy đơn hàng"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Bạn có chắc chắn muốn hủy đơn hàng mã
            <b style={{ color: "#333" }}> #{orderToCancel?.maHoaDon} </b>
            không?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCancelModal}>Không</Button>
          <Button onClick={handleConfirmCancel} color="error" autoFocus>
            Có, Hủy đơn
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

OrderListTab.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    role: PropTypes.string,
  }),
};
