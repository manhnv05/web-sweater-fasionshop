import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";

// === IMPORT LAYOUT COMPONENTS ===
import DashboardLayout from "../../../../examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "../../../../examples/Navbars/DashboardNavbar";
import Footer from "../../../../examples/Footer";

// === IMPORT CÁC COMPONENT TỪ @mui/material VÀ SOFT UI ===
import SoftBox from "../../../../components/SoftBox";
import SoftTypography from "../../../../components/SoftTypography";
import Card from "@mui/material/Card";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import SoftButton from "../../../../components/SoftButton";

import OrderHistory from "../OrderDetail/OrderHistory";
import OrderInfo from "../OrderDetail/OrderInfo";
import PaymentHistory from "../OrderDetail/PaymentHistory";
import ProductList from "../OrderDetail/ProductList";
import OrderSummary from "../OrderDetail/OrderSummary";
import OrderHistoryModal from "../OrderHistoryModal/OrderHistoryModal";
import CancelOrderDialog from "../OrderDetail/CancelOrderDialog/CancelOrderDialog";
import UpdateOrderInfo from "../UpdateOrderInfo/UpdateOrderInfo";
import { useReactToPrint } from "react-to-print";
import { useAuth } from "../../BanHangTaiQuay/AuthProvider.jsx";
import { toast } from "react-toastify";
import InHoaDon from "../InHoaDon/InHoaDon.jsx";
import PropTypes from "prop-types";
import ConfirmationDialog from "../OrderDetail/ConfirmationDialog";
const statusMap = {
  HOAN_THANH: "Hoàn thành",
  CHO_XAC_NHAN: "Chờ xác nhận",
  DANG_GIAO: "Đang giao",
  DA_XAC_NHAN: "Đã xác nhận",
  HUY: "Đã hủy",
  CHO_THANH_TOAN: "Chờ thanh toán",
  DA_THANH_TOAN: "Đã thanh toán",
  CHO_GIAO_HANG: "Chờ giao hàng",
  DANG_VAN_CHUYEN: "Đang vận chuyển",
  TAO_DON_HANG: "Tạo đơn hàng",
};
const paymentStatusMap = { HOAN_THANH: "Đã thanh toán", CHO_XAC_NHAN: "Chờ thanh toán" };
const orderTypeMap = { tai_quay: "Tại quầy", giao_hang: "Giao hàng", online: "Trực tuyến" };

const mapStatus = (apiStatus) => statusMap[apiStatus] || apiStatus;
const mapPaymentStatus = (apiStatus) => paymentStatusMap[apiStatus] || apiStatus;
const mapOrderType = (apiType) => orderTypeMap[apiType] || apiType;

const OrderDetailPage = () => {
  const { user } = useAuth();
  console.log("Dữ liệu người dùng (user):", user);
  // === HOOKS VÀ STATE ===
  const { orderId } = useParams();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [nguoiThucHienAction] = useState("Admin");
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const componentRef = useRef();
  const [isCancelling, setIsCancelling] = useState(false);

  const handleShowHistoryModal = () => setShowHistoryModal(true);
  const handleCloseHistoryModal = () => setShowHistoryModal(false);
  const handleOpenUpdateModal = () => setShowUpdateModal(true);
  const handleCloseUpdateModal = () => setShowUpdateModal(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const currentInvoiceId = orderId;
  const [isCancelModalOpen, setCancelModalOpen] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [confirmation, setConfirmation] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    isLoading: false,
  });
  const confirmStatus = () => {
    setConfirmation({
      isOpen: true,
      title: "Xác nhận chuyển trạng thái",
      message: "Bạn có chắc chắn muốn chuyển đơn hàng sang trạng thái tiếp theo không?",
      onConfirm: executeStatusChange, // Gán hành động sẽ thực thi
      isLoading: false,
    });
  };
  const handleCloseConfirmation = () => {
    setConfirmation((prev) => ({ ...prev, isOpen: false }));
  };

  const handleOpenCancelModal = () => {
    setCancelModalOpen(true);
  };

  const handleCloseCancelModal = () => {
    setCancelModalOpen(false);
  };
  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const fetchOrderDetail = useCallback(async () => {
    if (!orderId) {
      setError(new Error("Không tìm thấy ID đơn hàng trong URL."));
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:8080/api/hoa-don/${orderId}`, {
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const transformedData = {
        id: data.id,
        maHoaDon: data.maHoaDon,
        customerName: data.tenKhachHang,
        phoneNumber: data.sdt || "N/A",
        type: mapOrderType(data.loaiHoaDon),
        receiverName: data.tenKhachHang,
        status: mapStatus(data.trangThai),
        ngayTao: data.ngayTao,
        diaChi: data.diaChi,
        StaffName: data.tenNhanVien,
        products: (data.danhSachChiTiet || []).map((item) => ({
          id: item.id,
          name: item.tenSanPhamChiTiet || `Sản phẩm ${item.maSanPhamChiTiet}`,
          price: item.gia,
          size: "N/A",
          quantity: item.soLuong,
          imageUrl: item.linkAnh || "/assets/img/logo.jpg",
          maSanPhamChiTiet: item.maSanPhamChiTiet,
        })),
        discountCode: "Không có",
        shopDiscount:
          data.tongGiaGiam && data.tongTienBanDau
            ? `${((data.tongGiaGiam * 100) / data.tongTienBanDau).toFixed(0)}%`
            : "0%",
        shippingFee: data.phiVanChuyen ?? 0,
        totalItemsPrice: data.tongTienBanDau ?? 0,
        totalDiscount: data.tongGiaGiam ?? 0,
        totalAmount: data.tongHoaDon ?? 0,
        payments: (data.lichSuThanhToan || []).map((p) => ({
          method: p.hinhThucThanhToan || "Chưa xác định",
          amount: p.soTienThanhToan,
          date: p.thoiGian ? new Date(p.thoiGian).toLocaleString("vi-VN") : "N/A",
          status: mapPaymentStatus(p.trangThaiThanhToan),
        })),
        trangThaiGoc: data.trangThai,
      };
      setOrderData(transformedData);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrderDetail();
  }, [fetchOrderDetail]);

  const handleConfirmCancellation = async (ghiChuFromDialog) => {
    setIsCancelling(true);
    try {
      const payload = {
        ghiChu: ghiChuFromDialog,
        nguoiThucHien: user.tenNhanVien,
      };
      const response = await fetch(
        `http://localhost:8080/api/hoa-don/chuyen-trang-thai-huy/${orderId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include",
        }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Lỗi HTTP! Trạng thái: ${response.status}`);
      }
      toast.success("Đơn hàng đã được hủy thành công!");
      await fetchOrderDetail();
    } catch (err) {
      console.error("Lỗi khi hủy đơn hàng:", err);
      toast.error(err.message || "Có lỗi xảy ra khi hủy đơn hàng.");
    } finally {
      setIsCancelling(false);
      handleCloseCancelModal();
    }
  };

  const executeStatusChange = async () => {
    // Bật trạng thái loading trên hộp thoại xác nhận
    setConfirmation((prev) => ({ ...prev, isLoading: true }));
    setActionLoading(true);
    setActionError(null);

    // --- Bắt đầu logic gốc từ hàm handleConfirmStatus của bạn ---
    if (orderData?.trangThaiGoc === "DANG_VAN_CHUYEN") {
      try {
        const response = await fetch(
          `http://localhost:8080/chiTietThanhToan/lich-su-thanh-toan/${orderId}`,
          { credentials: "include" }
        );
        if (!response.ok) {
          throw new Error("Không thể lấy lịch sử thanh toán.");
        }
        const historyData = await response.json();
        let totalPaid = 0;
        if (historyData.code === 1000 && Array.isArray(historyData.data)) {
          totalPaid = historyData.data.reduce((sum, payment) => sum + payment.soTienThanhToan, 0);
        }
        if (totalPaid < orderData.totalAmount) {
          toast.error("Đơn hàng chưa được thanh toán đủ. Không thể hoàn thành.");

          // Đóng dialog và dừng thực thi
          handleCloseConfirmation();
          setActionLoading(false);
          return;
        }
      } catch (err) {
        toast.error(err.message || "Không thể xác thực trạng thái thanh toán.");

        // Đóng dialog và dừng thực thi
        handleCloseConfirmation();
        setActionLoading(false);
        return;
      }
    }
    const originalStatus = orderData?.trangThaiGoc;

    try {
      const payload = {
        ghiChu: "Chuyển trạng thái tự động",
        nguoiThucHien: user.tenNhanVien,
      };
      const response = await fetch(
        `http://localhost:8080/api/hoa-don/chuyen-trang-thai-tiep-theo/${orderId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include",
        }
      );
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      toast.success("Đã chuyển trạng thái thành công!");
      if (originalStatus === "CHO_XAC_NHAN" || originalStatus === "DA_XAC_NHAN") {
        handleOpenModal();
      }
      await fetchOrderDetail();
    } catch (err) {
      console.error("Lỗi khi chuyển trạng thái tiếp theo:", err);
      setActionError(err.message || "Có lỗi xảy ra khi chuyển trạng thái. Vui lòng thử lại.");
    } finally {
      setActionLoading(false);
      // Đóng hộp thoại xác nhận sau khi hoàn tất
      handleCloseConfirmation();
    }
    // --- Kết thúc logic gốc ---
  };

  // 2. HÀM MỚI ĐỂ MỞ HỘP THOẠI XÁC NHẬN
  // Hàm này sẽ được gọi khi nhấn nút "Xác nhận (Trạng thái tiếp theo)".
  const handleConfirmStatus = () => {
    setConfirmation({
      isOpen: true,
      title: "Xác nhận chuyển trạng thái",
      message: "Bạn có chắc chắn muốn chuyển đơn hàng sang trạng thái tiếp theo không?",
      onConfirm: executeStatusChange, // Gán hành động sẽ thực thi khi nhấn "Có"
      isLoading: false,
    });
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
  // Derived state
  const isConfirmButtonDisabled =
    orderData && (orderData.status === "Hoàn thành" || orderData.status === "Đã hủy");
  const isCancelButtonDisabled = orderData && orderData?.status !== "Chờ xác nhận";
  const canUpdateInfo =
    orderData &&
    (orderData.status === "Tạo đơn hàng" ||
      orderData.status === "Chờ xác nhận" ||
      orderData.status === "Đã xác nhận");

  const initialUpdateData = orderData
    ? {
        tenNguoiNhan: orderData.receiverName,
        soDienThoai: orderData.phoneNumber,
        diaChi: orderData.diaChi,
        phiVanChuyen: orderData.shippingFee,
      }
    : {};

  // Hàm xử lý in hóa đơn
  const viewPdf = async (orderId) => {
    try {
      const apiUrl = `http://localhost:8080/api/hoa-don/${orderId}/pdf`;
      const response = await fetch(apiUrl, { credentials: "include" });
      if (!response.ok) {
        throw new Error("Không thể tải file PDF!");
      }
      const pdfBlob = await response.blob();
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl);
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 100);
    } catch (error) {
      console.error("Lỗi khi hiển thị PDF:", error);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <SoftBox
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="calc(100vh - 150px)"
        >
          <CircularProgress color="info" />
          <SoftTypography variant="h5" ml={2}>
            Đang tải chi tiết đơn hàng...
          </SoftTypography>
        </SoftBox>
        <Footer />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <SoftBox p={3}>
          <Alert severity="error">{error.message}. Không thể tải chi tiết đơn hàng.</Alert>
        </SoftBox>
        <Footer />
      </DashboardLayout>
    );
  }

  if (!orderData) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <SoftBox p={3}>
          <Alert severity="warning">Không tìm thấy đơn hàng.</Alert>
        </SoftBox>
        <Footer />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        {actionError && (
          <SoftBox mb={2} px={3}>
            <Alert severity="error">{actionError}</Alert>
          </SoftBox>
        )}

        {/* Phần Lịch sử đơn hàng và các nút hành động */}
        <SoftBox mb={3}>
          <Card>
            <SoftBox p={3}>
              <SoftTypography variant="h5" fontWeight="medium" mb={3} sx={{ color: "#6ea8fe" }}>
                Lịch sử đơn hàng / {orderData.maHoaDon}
              </SoftTypography>

              <OrderHistory orderId={orderData.maHoaDon} onOrderUpdate={fetchOrderDetail} />
              <SoftBox display="flex" justifyContent="flex-end" mt={3} gap={1.5}>
                {!isConfirmButtonDisabled && (
                  <SoftButton
                    variant="outlined"
                    size="large"
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
                    onClick={handleConfirmStatus}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      "Xác nhận (Trạng thái tiếp theo)"
                    )}
                  </SoftButton>
                )}
                {!isCancelButtonDisabled && orderData?.type !== "Tại quầy" && isPaid && (
                  <SoftButton
                    onClick={handleOpenCancelModal}
                    disabled={isCancelButtonDisabled || actionLoading}
                    variant="outlined"
                    color="error"
                    sx={{
                      textTransform: "none",
                      ...(isCancelButtonDisabled && {
                        opacity: 0.5,
                        cursor: "not-allowed",
                      }),
                    }}
                  >
                    {actionLoading && !isConfirmButtonDisabled ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      "Hủy đơn"
                    )}
                  </SoftButton>
                )}
                <SoftButton
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
                  onClick={setShowHistoryModal}
                >
                  Chi tiết
                </SoftButton>
                <SoftButton
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
                  onClick={handleOpenModal}
                >
                  In hóa đơn
                </SoftButton>
              </SoftBox>
            </SoftBox>
          </Card>
        </SoftBox>

        {/* Thông tin đơn hàng và nút cập nhật */}
        <SoftBox mb={3}>
          <Card>
            <SoftBox p={3}>
              <SoftTypography variant="h5" fontWeight="medium" mb={3} sx={{ color: "#6ea8fe" }}>
                Thông tin đơn hàng
              </SoftTypography>

              <OrderInfo order={orderData} />
              {!isCancelButtonDisabled && orderData?.type !== "Tại quầy" && !isPaid && (
                <SoftBox display="flex" justifyContent="flex-end" mt={3}>
                  <SoftButton
                    variant="outlined"
                    size="large"
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
                    onClick={handleOpenUpdateModal}
                  >
                    Cập nhật
                  </SoftButton>
                </SoftBox>
              )}
            </SoftBox>
          </Card>
        </SoftBox>

        {/* Lịch sử thanh toán */}
        <SoftBox mb={3}>
          <Card>
            <SoftBox p={3}>
              <SoftTypography variant="h5" fontWeight="medium" mb={3} sx={{ color: "#6ea8fe" }}>
                Lịch sử thanh toán
              </SoftTypography>
              <PaymentHistory orderData={orderData} />
            </SoftBox>
          </Card>
        </SoftBox>

        {/* Danh sách sản phẩm */}
        <SoftBox mb={3}>
          <Card>
            <SoftBox p={3}>
              <SoftTypography variant="h5" fontWeight="medium" mb={3} sx={{ color: "#6ea8fe" }}>
                Danh sách sản phẩm
              </SoftTypography>
              <ProductList orderId={orderId} orderStatus={orderData.trangThaiGoc} />
            </SoftBox>
          </Card>
        </SoftBox>

        {/* Tổng tiền */}
        <SoftBox mb={3}>
          <Card>
            <SoftBox p={3}>
              <SoftTypography variant="h5" fontWeight="medium" mb={3}>
                Tổng tiền
              </SoftTypography>
              <OrderSummary orderId={orderData.id} />
            </SoftBox>
          </Card>
        </SoftBox>

        {/* Modals và Dialogs */}
        {showHistoryModal && orderData && (
          <OrderHistoryModal
            maHoaDon={orderData.maHoaDon}
            onClose={handleCloseHistoryModal}
            onOrderUpdate={fetchOrderDetail}
          />
        )}

        <CancelOrderDialog
          isOpen={isCancelModalOpen}
          onClose={handleCloseCancelModal}
          onConfirmCancel={handleConfirmCancellation}
          isLoading={isCancelling}
        />
        <ConfirmationDialog
          open={confirmation.isOpen}
          onClose={handleCloseConfirmation}
          onConfirm={confirmation.onConfirm}
          title={confirmation.title}
          message={confirmation.message}
          isLoading={confirmation.isLoading}
        />
        {showUpdateModal && orderData && (
          <UpdateOrderInfo
            show={showUpdateModal}
            onClose={handleCloseUpdateModal}
            orderId={orderData.id}
            initialData={initialUpdateData}
            onUpdateSuccess={fetchOrderDetail}
            currentUser={user?.tenNhanVien || "Không xác định"}
          />
        )}

        <InHoaDon isOpen={isModalOpen} onClose={handleCloseModal} hoaDonId={currentInvoiceId} />

        <div style={{ display: "none" }}>
          {orderData && <InHoaDon ref={componentRef} orderData={orderData} />}
        </div>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
};

CancelOrderDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirmCancel: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

export default OrderDetailPage;
