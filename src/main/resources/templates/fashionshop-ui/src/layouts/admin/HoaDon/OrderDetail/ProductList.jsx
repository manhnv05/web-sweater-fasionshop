import React from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import styles from "./ProductList.module.css";
import PropTypes from "prop-types";
import { useState, useEffect, useCallback } from "react";
import ProductSlideshow from "../../BanHangTaiQuay/component/ProductSlideshow.jsx";
import ProductSelectionModalOrderDetail from "./ProductSelectionModalOrderDetail";
import axios from "axios";
import { toast } from "react-toastify";
// import { useAuth } from "../../BanHangTaiQuay/AuthProvider.jsx";
const BASE_SERVER_URL = "http://localhost:8080/";

const ProductList = ({ orderId, orderStatus, onProductChange }) => {
  const [orderData, setOrderData] = useState(null);
  const [productsInOrder, setProductsInOrder] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quantityInput, setQuantityInput] = useState({});
  const [stockData, setStockData] = useState({});
  const [isPaid, setIsPaid] = useState(false);
// const { user } = useAuth();
  const logChange = async (orderId, message) => {
    try {
      
      const nguoiThucHien = "Admin";

      const logPayload = {
        idHoaDon: orderId,
        noiDungThayDoi: message,
        nguoiThucHien: nguoiThucHien,
        ghiChu: "Cập nhật số lượng sản phẩm",
      };

      await axios.post(`${BASE_SERVER_URL}api/lich-su-hoa-don/log`, logPayload, {
        withCredentials: true,
      });
      console.log("Ghi log thành công:", message);
    } catch (error) {
      console.error("Lỗi khi ghi log:", error);
      // Không cần thông báo lỗi này cho người dùng, chỉ cần log ra console
    }
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
  const fetchAllStock = useCallback(async () => {
    try {
      const response = await axios.get(`${BASE_SERVER_URL}api/hoa-don/get-all-so-luong-ton-kho`, {
        withCredentials: true,
      });
      const stockList = response.data?.data || [];
      // Chuyển đổi mảng thành một object để tra cứu nhanh hơn (dạng {id: soLuong})
      const stockMap = stockList.reduce((map, item) => {
        map[item.idChitietSanPham] = item.soLuongTonKho;
        return map;
      }, {});
      setStockData(stockMap);
    } catch (error) {
      console.error("Lỗi khi tải danh sách tồn kho:", error);
      toast.error("Không thể tải dữ liệu tồn kho.");
    }
  }, []);
  // Hàm tải dữ liệu gốc của hóa đơn
  const fetchListProductOrder = useCallback(async () => {
    if (!orderId) {
      console.log("DEBUG: fetchListProductOrder dừng vì không có orderId.");
      setProductsInOrder([]);
      setOrderData(null);
      return;
    }
    setLoading(true);
    console.log(`DEBUG: Bắt đầu fetchListProductOrder cho orderId: ${orderId}`);
    try {
      // API này cần trả về đầy đủ thông tin hóa đơn, bao gồm cả list sản phẩm
      const response = await axios.get(`${BASE_SERVER_URL}api/hoa-don/${orderId}`, {
        withCredentials: true,
      });
      const fetchedOrder = response.data || {};
      const fetchedProducts = fetchedOrder.danhSachChiTiet || [];
      setOrderData(fetchedOrder);
      setProductsInOrder(fetchedProducts);

      const initialQuantities = {};
      fetchedProducts.forEach((product) => {
        initialQuantities[product.idSanPhamChiTiet] = product.soLuong;
      });
      setQuantityInput(initialQuantities);

      if (onProductChange) {
        onProductChange(fetchedOrder); // Gửi toàn bộ dữ liệu hóa đơn mới về component cha
      }
    } catch (error) {
      console.error("Không thể fetch dữ liệu:", error);
      toast.error("Không thể tải dữ liệu hóa đơn.");
    } finally {
      setLoading(false);
    }
  }, [orderId, onProductChange]);

  useEffect(() => {
    fetchListProductOrder();
  }, [fetchListProductOrder]);

  // HÀM TRUNG TÂM XỬ LÝ MỌI THAY ĐỔI CỦA ĐƠN HÀNG
  const handleOrderChange = async (updatedProducts) => {
    setLoading(true);
    // Cập nhật giao diện tạm thời để người dùng thấy thay đổi ngay lập tức
    setProductsInOrder(updatedProducts);

    try {
      // 1. Tính tổng tiền tạm thời từ danh sách sản phẩm mới
      const tongTienHoaDon = updatedProducts.reduce((total, product) => {
        return total + product.gia * product.soLuong;
      }, 0);

      // 2. Tự động tìm phiếu giảm giá tốt nhất
      let bestCouponId = null;
      if (tongTienHoaDon > 0) {
        try {
          const couponResponse = await axios.post(
            `${BASE_SERVER_URL}/PhieuGiamGiaKhachHang/query`,
            {
              khachHang: orderData?.khachHang?.id || null,
              tongTienHoaDon: tongTienHoaDon,
            }
          );
          if (couponResponse.data?.data?.content?.length > 0) {
            bestCouponId = couponResponse.data.data.content[0].id;
          }
        } catch (couponError) {
          console.error("Lỗi khi tìm phiếu giảm giá:", couponError);
        }
      }

      // 3. Chuẩn bị payload cho API update_hoadon
      const payload = {
        idHoaDon: orderId,
        phieuGiamGia: bestCouponId ? String(bestCouponId) : null,
        danhSachSanPham: updatedProducts.map((p) => ({
          id: p.idSanPhamChiTiet,
          soLuong: p.soLuong,
          donGia: p.gia,
        })),
        // Giữ lại các thông tin khác của hóa đơn nếu có
        ghiChu: orderData?.ghiChu,
        tenKhachHang: orderData?.tenKhachHang,
        sdt: orderData?.sdt,
        diaChi: orderData?.diaChi,
        khachHang: orderData?.idKhachHang ? String(orderData.idKhachHang) : null,
        nhanVien: orderData?.nhanVien?.id ? String(orderData.nhanVien.id) : null,
      };

      // 4. Gọi API cập nhật hóa đơn tổng thể
      await axios.put(`${BASE_SERVER_URL}api/hoa-don/update-hoa-don-da-luu`, payload, {
        withCredentials: true,
      });

      toast.success("Cập nhật đơn hàng thành công!");
    } catch (error) {
      console.error("Lỗi khi cập nhật hóa đơn:", error);
      const errorMessage = error.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại.";
      toast.error(`Cập nhật thất bại: ${errorMessage}`);
    } finally {
      // 5. Tải lại toàn bộ dữ liệu hóa đơn từ server để đảm bảo đồng bộ
      await fetchListProductOrder();
      // setLoading(false) đã có trong fetchListProductOrder
    }
  };
  useEffect(() => {
    fetchListProductOrder();
    fetchAllStock();
     if (orderId) {
      checkPaymentStatus(orderId);
    }
  }, [fetchListProductOrder, fetchAllStock,checkPaymentStatus, orderId]);
  // Hàm xử lý khi người dùng thay đổi số lượng
  const handleUpdateQuantity = async (productId, newQuantity) => {
    const parsedQuantity = parseInt(newQuantity, 10);
    const productToUpdate = productsInOrder.find((p) => p.idSanPhamChiTiet === productId);
    let logMessage = "";
    const productName = `${productToUpdate.tenSanPham} (${productToUpdate.maSanPhamChiTiet})   ${productToUpdate.tenMauSac}-Size:${productToUpdate.tenKichThuoc}` ;

    
    if (!productToUpdate) return;
    const currentQuantity = productToUpdate.soLuong;
    const oldQuantity = productToUpdate.soLuong;
    // Chỉ thực hiện khi số lượng thực sự thay đổi và hợp lệ
    if (isNaN(parsedQuantity) || parsedQuantity < 0 || parsedQuantity === oldQuantity) {
      // Nếu số lượng không hợp lệ hoặc không đổi thì không làm gì cả
      // và khôi phục lại giá trị input về số lượng cũ
      setQuantityInput((prev) => ({ ...prev, [productId]: oldQuantity }));
      return;
    }
    const soLuongTonKho = stockData[productId] || 0;
    const effectiveStock = soLuongTonKho + currentQuantity;
    if (parsedQuantity > effectiveStock) {
      toast.warn(`Số lượng sản phẩm không đủ.`);
      return;
    }
    if (productsInOrder.length <= 1 && parsedQuantity === 0) {
      toast.warn("Không thể xóa sản phẩm cuối cùng.");
      return;
    }
    
if (parsedQuantity > oldQuantity) {
      logMessage = `Tăng số lượng sản phẩm "${productName}" từ ${oldQuantity} lên ${parsedQuantity}.`;
    } else if (parsedQuantity < oldQuantity && parsedQuantity > 0) {
      logMessage = `Giảm số lượng sản phẩm "${productName}" từ ${oldQuantity} xuống ${parsedQuantity}.`;
    } else if (parsedQuantity === 0) {
      logMessage = `Xóa sản phẩm "${productName}" (số lượng từ ${oldQuantity} về 0).`;
    }
    // Gọi hàm ghi log NẾU có sự thay đổi
    if (logMessage) {
      await logChange(orderId, logMessage);
    }
    console.log(parsedQuantity, productToUpdate);
    setLoading(true);
    try {
      // BƯỚC 1: CẬP NHẬT TỒN KHO
      const chenhLech = parsedQuantity - currentQuantity;
      if (chenhLech > 0) {
        await axios.put(
          `${BASE_SERVER_URL}api/hoa-don/giam-so-luong-san-pham/${productId}?soLuong=${chenhLech}`,
          {},
          { withCredentials: true }
        );
      } else {
        await axios.put(
          `${BASE_SERVER_URL}api/hoa-don/tang-so-luong-san-pham/${productId}?soLuong=${Math.abs(
            chenhLech
          )}`,
          {},
          { withCredentials: true }
        );
      }

      // BƯỚC 2: CẬP NHẬT HÓA ĐƠN
      let updatedProducts;
      if (parsedQuantity === 0) {
        updatedProducts = productsInOrder.filter((p) => p.idSanPhamChiTiet !== productId);
      } else {
        updatedProducts = productsInOrder.map((p) =>
          p.idSanPhamChiTiet === productId ? { ...p, soLuong: parsedQuantity } : p
        );
      }
      await updateOrderDetails(updatedProducts); // Gọi hàm helper
      toast.success("Cập nhật đơn hàng thành công!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Cập nhật số lượng thất bại.");
    } finally {
      await fetchListProductOrder();
      await fetchAllStock();
    }
  };
  const updateOrderDetails = async (updatedProducts) => {
    const subTotal = updatedProducts.reduce(
      (total, product) => total + product.gia * product.soLuong,
      0
    );
    const phiVanChuyen = orderData?.phiVanChuyen || 0;
    const tongTienHoaDon = subTotal;

    let bestCouponId = null;
    if (tongTienHoaDon > 0) {
      try {
        const couponResponse = await axios.post(`${BASE_SERVER_URL}PhieuGiamGiaKhachHang/query`, {
          khachHang: orderData?.khachHang?.id || null,
          tongTienHoaDon: tongTienHoaDon,
        });
        if (couponResponse.data?.data?.content?.length > 0) {
          bestCouponId = couponResponse.data.data.content[0].id;
        }
      } catch (couponError) {
        console.error("Lỗi khi tìm phiếu giảm giá:", couponError);
      }
    }

    const payload = {
      idHoaDon: orderId,
      phieuGiamGia: bestCouponId ? String(bestCouponId) : null,
      danhSachSanPham: updatedProducts.map((p) => ({
        id: p.idSanPhamChiTiet,
        soLuong: p.soLuong,
        donGia: p.gia,
      })),
      phiVanChuyen: orderData.phiVanChuyen,
      ghiChu: orderData?.ghiChu,
      tenKhachHang: orderData?.tenKhachHang,
      sdt: orderData?.sdt,
      diaChi: orderData?.diaChi,
      khachHang: orderData?.idKhachHang ? String(orderData.idKhachHang) : null,
      nhanVien: orderData?.idNhanVien ? String(orderData.idNhanVien) : null,
    };

    await axios.put(`${BASE_SERVER_URL}api/hoa-don/update-hoa-don-da-luu`, payload, {
      withCredentials: true,
    });
  };

  // Hàm xử lý khi thêm sản phẩm từ modal
  const handleAddProduct = async (productToAdd) => {
    console.log("Sản phẩm được chọn để thêm:", productToAdd);
    setLoading(true);
    try {
      const { idChiTietSanPham, quantity, soLuongTonKho } = productToAdd;
      if (quantity > soLuongTonKho) {
        toast.warn(`Số lượng tồn kho chỉ còn ${soLuongTonKho}.`);
        return;
      }

      // BƯỚC 1: CẬP NHẬT TỒN KHO
      await axios.put(
        `${BASE_SERVER_URL}api/hoa-don/giam-so-luong-san-pham/${idChiTietSanPham}?soLuong=${quantity}`,
        {},
        { withCredentials: true }
      );

      // BƯỚC 2: CẬP NHẬT HÓA ĐƠN
      const existingProduct = productsInOrder.find((p) => p.idSanPhamChiTiet === idChiTietSanPham);
     const productName = `${productToAdd.tenSanPham} (${productToAdd.maSanPham}) - ${productToAdd.mauSac} - Size: ${productToAdd.kichThuoc}`;
      let updatedProducts;
       let logMessage = ""; 
if (existingProduct) {
        // Trường hợp sản phẩm đã có -> Tăng số lượng
        const oldQuantity = existingProduct.soLuong;
        const newQuantity = oldQuantity + quantity;
        logMessage = `Tăng số lượng sản phẩm "${productName}" từ ${oldQuantity} lên ${newQuantity}.`;
      } else {
        // Trường hợp sản phẩm chưa có -> Thêm mới
        logMessage = `Thêm sản phẩm mới "${productName}" vào đơn hàng với số lượng ${quantity}.`;
      }

      // Gọi hàm ghi log
      await logChange(orderId, logMessage);
      if (existingProduct) {
        const newQuantity = existingProduct.soLuong + quantity;
        updatedProducts = productsInOrder.map((p) =>
          p.idSanPhamChiTiet === idChiTietSanPham ? { ...p, soLuong: newQuantity } : p
        );
        console.log(newQuantity, idChiTietSanPham);
      } else {
        const price =
          productToAdd.giaTienSauKhiGiam !== null &&
          productToAdd.giaTienSauKhiGiam < productToAdd.gia
            ? productToAdd.giaTienSauKhiGiam
            : productToAdd.gia;
        const newProduct = {
          ...productToAdd,
          id: null,
          idSanPhamChiTiet: idChiTietSanPham,
          soLuong: quantity,
          gia: price,
        };
        updatedProducts = [...productsInOrder, newProduct];
        console.log(quantity, idChiTietSanPham);
      }
      // handleUpdateQuantity(,newQuantity )
      await updateOrderDetails(updatedProducts); // Gọi hàm helper
      toast.success("Thêm sản phẩm thành công!");
      fetchListProductOrder();
    } catch (error) {
      console.error("Lỗi khi thêm sản phẩm:", error);
      toast.error(error.response?.data?.message || "Thêm sản phẩm thất bại.");
    } finally {
      await fetchListProductOrder();
      await fetchAllStock();
    }
  };

  const handleQuantityInputChange = (productId, value) => {
    setQuantityInput((prev) => ({ ...prev, [productId]: value }));
  };

  const handleConfirmQuantityChange = (e, productId) => {
    if ((e.type === "keydown" && e.key === "Enter") || e.type === "blur") {
      handleUpdateQuantity(productId, e.target.value);
    }
  };

  return (
    <div className={styles["product-list"]}>
      {(orderStatus === "CHO_XAC_NHAN" &&!isPaid) && (
        <div className={styles["product-list-header"]}>
          <button
            className={`${styles.btn} ${styles.btnConfirm}`}
            onClick={() => setIsModalOpen(true)}
            disabled={loading}
          >
            Thêm sản phẩm
          </button>
        </div>
      )}

      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" height="200px">
          <CircularProgress color="info" />
          <Typography variant="body2" ml={2}>
            Đang xử lý...
          </Typography>
        </Box>
      )}

      {!loading && productsInOrder.length === 0 ? (
        <div className={styles.emptyMessage}>Không có sản phẩm nào trong đơn hàng này.</div>
      ) : (
        !loading &&
        productsInOrder.map((product) => (
          <div key={product.maSanPhamChiTiet} className={styles["product-item"]}>
            <Box sx={{ position: "relative", width: 150, height: 150, ml: 2 }}>
              <ProductSlideshow
                product={{
                  ...product,
                  listUrlImage: product.duongDanAnh ? [product.duongDanAnh] : [],
                }}
              />
            </Box>
            <div className={styles["product-details"]}>
              <p className={styles["product-name"]}>
                {product.tenSanPham} ({product.maSanPhamChiTiet})
              </p>
              <p className={styles["product-price"]}>
                {(product.gia || 0).toLocaleString("vi-VN")} VND
              </p>
              <p className={styles["product-info"]}>{product.tenMauSac}</p>
              <p className={styles["product-info"]}>Size: {product.tenKichThuoc}</p>
              <p className={styles["product-info"]}>x{product.soLuong}</p>
            </div>

            {(orderStatus === "CHO_XAC_NHAN" ) && (
              <div className={styles["product-quantity-control"]}>
                <button
                  onClick={() =>
                    handleUpdateQuantity(
                      product.idSanPhamChiTiet,
                      (parseInt(quantityInput[product.idSanPhamChiTiet], 10) || 0) - 1
                    )
                  }
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantityInput[product.idSanPhamChiTiet] || ""}
                  onChange={(e) =>
                    handleQuantityInputChange(product.idSanPhamChiTiet, e.target.value)
                  }
                  onBlur={(e) => handleConfirmQuantityChange(e, product.idSanPhamChiTiet)}
                  onKeyDown={(e) => handleConfirmQuantityChange(e, product.idSanPhamChiTiet)}
                  className={styles["quantity-input"]}
                  min="0"
                    disabled={isPaid}
                />
                <button
                  onClick={() =>
                    handleUpdateQuantity(
                      product.idSanPhamChiTiet,
                      (parseInt(quantityInput[product.idSanPhamChiTiet], 10) || 0) + 1
                    )
                  }
                    disabled={isPaid}
                >
                  +
                </button>
              </div>
            )}
           <div className={styles["product-total-price"]}>
  {/* DÒNG THÊM VÀO */}
  <p className={styles["total-price-label"]}>Thành tiền</p>

  {/* Dòng giá tiền gốc của bạn */}
  <span>
    {((product.gia || 0) * (product.soLuong || 0)).toLocaleString("vi-VN")} VND
  </span>
</div>
          </div>
        ))
      )}

      <ProductSelectionModalOrderDetail
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectProduct={handleAddProduct}
      />
    </div>
  );
};

ProductList.propTypes = {
  orderId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  orderStatus: PropTypes.string.isRequired,
  onProductChange: PropTypes.func,
};

export default ProductList;
