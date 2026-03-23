import React, { useState, useEffect, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import { toast } from "react-toastify";
import axios from "axios";

// --- MUI Imports ---
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Backdrop,
  CircularProgress,
  Typography,
  IconButton,
  Box,
  Autocomplete,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import "react-toastify/dist/ReactToastify.css";

// --- GHN API Configuration ---
const GHN_API_BASE_URL = "https://online-gateway.ghn.vn/shiip/public-api";
// IMPORTANT: Replace with your actual GHN Token and Shop ID
const GHN_TOKEN = process.env.REACT_APP_GHN_TOKEN; // Example Token
const GHN_SHOP_ID = 5908591; // Example Shop ID

const ghnApi = axios.create({
  baseURL: GHN_API_BASE_URL,
  headers: {
    token: GHN_TOKEN,
    "Content-Type": "application/json",
  },
});

// --- Helper Functions ---
const normalizeString = (str = "") => {
  if (typeof str !== "string") return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[\s,.-]|(thành phố|tỉnh|quận|huyện|phường|xã|thị xã|thị trấn)/g, "");
};

const formatCurrency = (value) => {
  if (typeof value !== "number") return "N/A";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
};

const getEstimatedShippingFee = (to_district_id) => {
  // This is a fallback function. You can implement more complex logic if needed.
  if (to_district_id > 1500) return 35000;
  return 25000;
};

const UpdateOrderInfo = ({ show, onClose, orderId, initialData, onUpdateSuccess, currentUser }) => {
  const isInitialRender = useRef(true);
  // --- Component State ---
  console.log("currentUser in UpdateOrderInfo:", currentUser);
  const [formData, setFormData] = useState({ tenNguoiNhan: "", soDienThoai: "", diaChiCuThe: "" });
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedWard, setSelectedWard] = useState(null);
  const [isPreloading, setIsPreloading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [historyNote, setHistoryNote] = useState("");
  // --- NEW: State for Shipping Fee ---
  const [shippingFee, setShippingFee] = useState(null);
  const [isCalculatingFee, setIsCalculatingFee] = useState(false);

  // --- Data Fetching and Initialization Effects ---

  // Effect 1: Fetch provinces once when the modal is opened
  useEffect(() => {
    const fetchProvinces = async () => {
      if (provinces.length === 0) {
        setIsPreloading(true);
        try {
          const response = await ghnApi.get("/master-data/province");
          if (response.data?.data) {
            setProvinces(response.data.data);
          }
        } catch (error) {
          console.error("Error fetching provinces from GHN:", error);
          toast.error("Không thể tải danh sách Tỉnh/Thành phố.");
        } finally {
          setIsPreloading(false);
        }
      }
    };
    if (show) {
      fetchProvinces();
    }
  }, [show, provinces.length]);

  // Effect 2: Populate form with initial data and parse address
  useEffect(() => {
    if (!show || !initialData || provinces.length === 0) {
      return;
    }
    isInitialRender.current = true;
    
    const populateAddressData = async () => {
      setIsPreloading(true);
      setFormData({
        tenNguoiNhan: initialData.tenNguoiNhan || "",
        soDienThoai: initialData.soDienThoai || "",
        diaChiCuThe: initialData.diaChi || "",
      });
      setSelectedProvince(null);
      setSelectedDistrict(null);
      setSelectedWard(null);
      setDistricts([]);
      setWards([]);
      setShippingFee(initialData.phiVanChuyen || null); // Set initial fee

      const addressString = initialData.diaChi || "";
      const addressParts = addressString.split(",").map((part) => part.trim());

      // 1. Find Province
      const foundProvince = provinces.find((p) =>
        addressParts.some((part) => normalizeString(part) === normalizeString(p.ProvinceName))
      );
      if (!foundProvince) {
        console.warn("Could not match province for:", addressString);
        setIsPreloading(false);
        return;
      }
      setSelectedProvince(foundProvince);

      try {
        // 2. Fetch and find District
        const districtResponse = await ghnApi.get("/master-data/district", {
          params: { province_id: foundProvince.ProvinceID },
        });
        const availableDistricts = districtResponse.data?.data || [];
        setDistricts(availableDistricts);

        const foundDistrict = availableDistricts.find((d) =>
          addressParts.some((part) => normalizeString(part) === normalizeString(d.DistrictName))
        );
        if (!foundDistrict) {
          console.warn("Could not match district for:", addressString);
          const specificAddress = addressString
            .replace(new RegExp(`,\\s*${foundProvince.ProvinceName}\\s*$`, "i"), "")
            .trim();
          setFormData((prev) => ({ ...prev, diaChiCuThe: specificAddress }));
          setIsPreloading(false);
          return;
        }
        setSelectedDistrict(foundDistrict);

        // 3. Fetch and find Ward
        const wardResponse = await ghnApi.get("/master-data/ward", {
          params: { district_id: foundDistrict.DistrictID },
        });
        const availableWards = wardResponse.data?.data || [];
        setWards(availableWards);

        const foundWard = availableWards.find((w) =>
          addressParts.some((part) => normalizeString(part) === normalizeString(w.WardName))
        );
        if (foundWard) {
          setSelectedWard(foundWard);
          // 4. Calculate final specific address
          const specificAddress = addressParts
            .filter(
              (part) =>
                normalizeString(part) !== normalizeString(foundProvince.ProvinceName) &&
                normalizeString(part) !== normalizeString(foundDistrict.DistrictName) &&
                normalizeString(part) !== normalizeString(foundWard.WardName)
            )
            .join(", ");
          setFormData((prev) => ({ ...prev, diaChiCuThe: specificAddress }));
        } else {
          console.warn("Could not match ward for:", addressString);
          let specificAddress = addressString.replace(
            new RegExp(`,\\s*${foundProvince.ProvinceName}\\s*$`, "i"),
            ""
          );
          specificAddress = specificAddress
            .replace(new RegExp(`,\\s*${foundDistrict.DistrictName}\\s*$`, "i"), "")
            .trim();
          setFormData((prev) => ({ ...prev, diaChiCuThe: specificAddress }));
        }
      } catch (error) {
        console.error("Error during address parsing:", error);
        toast.error("Đã xảy ra lỗi khi tự động điền địa chỉ.");
      } finally {
        setIsPreloading(false);
      }
    };

    populateAddressData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, initialData, provinces]);

  // --- NEW: Shipping Fee Calculation Logic ---
  const calculateShippingFee = useCallback(async (to_district_id, to_ward_code) => {
    if (!to_district_id || !to_ward_code) {
      setShippingFee(0);
      return;
    }

    setIsCalculatingFee(true);
    setShippingFee(null);

    // List of alternative "from" locations to try if one fails
    const alternativeDistricts = [
      { district_id: 1450, ward_code: "217010", name: "Cầu Giấy (Primary)" },
      { district_id: 1442, ward_code: "21211", name: "Ba Đình" },
      { district_id: 1443, ward_code: "21311", name: "Hoàn Kiếm" },
      { district_id: 1447, ward_code: "21711", name: "Đống Đa" },
    ];

    let calculatedFee = null;

    for (const altDistrict of alternativeDistricts) {
      const from_district_id = altDistrict.district_id;

      try {
        // Step 1: Check for available services
        const serviceResponse = await ghnApi.get("/v2/shipping-order/available-services", {
          params: {
            shop_id: GHN_SHOP_ID,
            from_district: from_district_id,
            to_district: to_district_id,
          },
        });

        if (!serviceResponse.data?.data || serviceResponse.data.data.length === 0) {
          console.log(`No GHN service available for from_district: ${altDistrict.name}`);
          continue; // Try the next alternative
        }

        const service = serviceResponse.data.data[0]; // Use the first available service

        // Step 2: Calculate the fee with the found service
        const feePayload = {
          from_district_id: from_district_id,
          from_ward_code: altDistrict.ward_code,
          to_district_id: to_district_id,
          to_ward_code: to_ward_code,
          service_id: service.service_id,
          insurance_value: 0, // Modify as needed
          coupon: null,
          weight: 500, // Example weight in grams
          length: 30, // Example dimensions in cm
          width: 15,
          height: 20,
        };

        const feeResponse = await ghnApi.post("/v2/shipping-order/fee", feePayload, {
          headers: { ShopId: GHN_SHOP_ID },
        });

        if (feeResponse.data?.code === 200 && feeResponse.data?.data?.total) {
          console.log(
            `Successfully calculated fee with ${altDistrict.name}. Fee: ${feeResponse.data.data.total}`
          );
          calculatedFee = feeResponse.data.data.total;
          if (altDistrict.district_id !== 1450) {
          }
          break; // Exit loop on success
        }
      } catch (error) {
        console.error(
          `Error calculating fee with ${altDistrict.name}:`,
          error.response?.data || error.message
        );
        continue; // Try next on error
      }
    }

    if (calculatedFee === null) {
      console.warn("All GHN fee calculation attempts failed. Using fallback estimate.");
      calculatedFee = getEstimatedShippingFee(to_district_id);
      toast.warning(
        `Không thể tính phí chính xác. Sử dụng phí ước tính: ${formatCurrency(calculatedFee)}`
      );
    }

    setShippingFee(calculatedFee);
    setIsCalculatingFee(false);
  }, []);

useEffect(() => {
    

    if (isInitialRender.current) {
        isInitialRender.current = false;
       
        return;
    }

    
    if (selectedDistrict && selectedWard) {
        calculateShippingFee(selectedDistrict.DistrictID, selectedWard.WardCode);
    } else {
        setShippingFee(null);
    }
}, [selectedDistrict, selectedWard, calculateShippingFee]);

  // --- Event Handlers ---

  const handleProvinceChange = async (newValue) => {
    setSelectedProvince(newValue);
    setSelectedDistrict(null);
    setDistricts([]);
    setSelectedWard(null);
    setWards([]);

    if (newValue) {
      try {
        const response = await ghnApi.get("/master-data/district", {
          params: { province_id: newValue.ProvinceID },
        });
        setDistricts(response.data?.data || []);
      } catch (error) {
        toast.error("Không thể tải danh sách Quận/Huyện.");
      }
    }
  };

  const handleDistrictChange = async (newValue) => {
    setSelectedDistrict(newValue);
    setSelectedWard(null);
    setWards([]);

    if (newValue) {
      try {
        const response = await ghnApi.get("/master-data/ward", {
          params: { district_id: newValue.DistrictID },
        });
        setWards(response.data?.data || []);
      } catch (error) {
        toast.error("Không thể tải danh sách Phường/Xã.");
      }
    }
  };
  const generateChangeLog = (initial, current) => {
    const changes = [];

    // 1. So sánh Tên người nhận
    if (initial.tenNguoiNhan !== current.tenNguoiNhan) {
      changes.push(
        `- Tên người nhận: từ "${initial.tenNguoiNhan || "trống"}" thành "${current.tenNguoiNhan}".`
      );
    }

    // 2. So sánh Số điện thoại
    if (initial.soDienThoai !== current.soDienThoai) {
      changes.push(`- SĐT: từ "${initial.soDienThoai || "trống"}" thành "${current.soDienThoai}".`);
    }

    // 3. So sánh Địa chỉ đầy đủ
    if (initial.diaChi !== current.diaChi) {
      changes.push(`- Địa chỉ: từ "${initial.diaChi || "trống"}" thành "${current.diaChi}".`);
    }

    // 4. So sánh Phí vận chuyển
    if (initial.phiVanChuyen !== current.phiVanChuyen) {
      const initialFee = formatCurrency(initial.phiVanChuyen || 0);
      const currentFee = formatCurrency(current.phiVanChuyen || 0);
      changes.push(`- Phí vận chuyển: từ ${initialFee} thành ${currentFee}.`);
    }

    if (changes.length === 0) {
      return null; // Trả về null nếu không có gì thay đổi
    }

    // Trả về một chuỗi, mỗi thay đổi trên một dòng
    return changes.join("\n");
  };
  const logOrderHistory = async (logData) => {
    try {
      // API endpoint bạn vừa tạo
      await axios.post("http://localhost:8080/api/lich-su-hoa-don/log", logData, {
        withCredentials: true,
      });
    } catch (error) {
      console.error("Lỗi khi ghi log lịch sử:", error);
      // Không cần thông báo lỗi này cho người dùng
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let newErrors = {};
    if (!formData.tenNguoiNhan.trim()) newErrors.tenNguoiNhan = "Tên người nhận là bắt buộc.";
    const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
    if (!formData.soDienThoai.trim()) newErrors.soDienThoai = "Số điện thoại là bắt buộc.";
    else if (!phoneRegex.test(formData.soDienThoai.trim()))
      newErrors.soDienThoai = "Định dạng số điện thoại không hợp lệ.";
    if (!selectedProvince) newErrors.province = "Vui lòng chọn Tỉnh/Thành phố.";
    if (!selectedDistrict) newErrors.district = "Vui lòng chọn Quận/Huyện.";
    if (!selectedWard) newErrors.ward = "Vui lòng chọn Phường/Xã.";
    if (!formData.diaChiCuThe.trim()) newErrors.diaChiCuThe = "Vui lòng nhập địa chỉ cụ thể.";
    if (shippingFee === null || isCalculatingFee)
      newErrors.fee = "Phí vận chuyển đang được tính toán.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    const fullAddress = [
      formData.diaChiCuThe,
      selectedWard?.WardName,
      selectedDistrict?.DistrictName,
      selectedProvince?.ProvinceName,
    ]
      .filter(Boolean)
      .join(", ");

    const requestPayload = {
      tenKhachHang: formData.tenNguoiNhan,
      sdt: formData.soDienThoai,
      diaChi: fullAddress,
      phiVanChuyen: shippingFee, // NEW: Include shipping fee
      ghiChu: "Cập nhật thông tin giao hàng",
    };

    try {
      // IMPORTANT: Replace with your actual backend API URL
      const backendApiUrl = `http://localhost:8080/api/hoa-don/cap-nhat-thong-tin/${orderId}`;
      await axios.put(backendApiUrl, requestPayload, {
        withCredentials: true, // Sửa ở đây: gửi cookie/session
      });
      toast.success("Cập nhật thông tin đơn hàng thành công!");
      const changeLogMessage = generateChangeLog(
        initialData, // Dữ liệu cũ
        {
          // Dữ liệu mới
          tenNguoiNhan: formData.tenNguoiNhan,
          soDienThoai: formData.soDienThoai,
          diaChi: fullAddress,
          phiVanChuyen: shippingFee,
        }
      );
      if (changeLogMessage) {
        await logOrderHistory({
          idHoaDon: orderId,
          noiDungThayDoi: changeLogMessage,
          nguoiThucHien: currentUser || "Hệ thống",
          ghiChu: historyNote,
        });
      }
      setTimeout(() => {
        if (onClose) onClose();
        if (onUpdateSuccess) onUpdateSuccess();
      }, 500);
    } catch (error) {
      console.error("Error submitting update:", error);
      toast.error(`Lỗi: ${error.response?.data?.message || "Không thể cập nhật đơn hàng."}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  // --- Render Method ---
  return (
    <Dialog
      open={show}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      component="form"
      onSubmit={handleSubmit}
    >
      <DialogTitle sx={{ m: 0, p: 2, fontWeight: "bold" }}>
        Cập nhật thông tin giao hàng
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Backdrop
          sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 2, position: "absolute" }}
          open={isPreloading}
        >
          <Box display="flex" flexDirection="column" alignItems="center">
            <CircularProgress color="inherit" />
            <Typography sx={{ mt: 2 }}>Đang tải dữ liệu ban đầu...</Typography>
          </Box>
        </Backdrop>
        <Grid container spacing={3} sx={{ pt: 1 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              name="tenNguoiNhan"
              label="Tên người nhận"
              value={formData.tenNguoiNhan}
              onChange={(e) => setFormData({ ...formData, tenNguoiNhan: e.target.value })}
              error={!!errors.tenNguoiNhan}
              helperText={errors.tenNguoiNhan || " "}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              name="soDienThoai"
              label="Số điện thoại"
              type="tel"
              value={formData.soDienThoai}
              onChange={(e) => setFormData({ ...formData, soDienThoai: e.target.value })}
              error={!!errors.soDienThoai}
              helperText={errors.soDienThoai || " "}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Autocomplete
              options={provinces}
              getOptionLabel={(option) => option.ProvinceName || ""}
              isOptionEqualToValue={(option, value) => option.ProvinceID === value.ProvinceID}
              value={selectedProvince}
              onChange={(event, newValue) => handleProvinceChange(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tỉnh/Thành phố"
                  required
                  error={!!errors.province}
                  helperText={errors.province || " "}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Autocomplete
              options={districts}
              disabled={!selectedProvince}
              getOptionLabel={(option) => option.DistrictName || ""}
              isOptionEqualToValue={(option, value) => option.DistrictID === value.DistrictID}
              value={selectedDistrict}
              onChange={(event, newValue) => handleDistrictChange(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Quận/Huyện"
                  required
                  error={!!errors.district}
                  helperText={errors.district || " "}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Autocomplete
              options={wards}
              disabled={!selectedDistrict}
              getOptionLabel={(option) => option.WardName || ""}
              isOptionEqualToValue={(option, value) => option.WardCode === value.WardCode}
              value={selectedWard}
              onChange={(event, newValue) => setSelectedWard(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Phường/Xã"
                  required
                  error={!!errors.ward}
                  helperText={errors.ward || " "}
                />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              name="diaChiCuThe"
              label="Địa chỉ cụ thể"
              placeholder="Tên đường, số nhà..."
              value={formData.diaChiCuThe}
              onChange={(e) => setFormData({ ...formData, diaChiCuThe: e.target.value })}
              error={!!errors.diaChiCuThe}
              helperText={errors.diaChiCuThe || "Nhập tên đường, số nhà, v.v."}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              name="historyNote"
              label="Ghi chú cho lịch sử thay đổi"
              placeholder="Lý do cập nhật thông tin..."
              value={historyNote}
              onChange={(e) => setHistoryNote(e.target.value)}
              multiline
              rows={2}
              helperText="Ghi chú này sẽ được lưu vào dòng lịch sử của hành động này."
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: "16px 24px" }}>
        <Button onClick={onClose} color="secondary">
          Hủy
        </Button>
        <Button
          type="submit"
          variant="contained"
          size="medium"
          disabled={isSubmitting || isPreloading || isCalculatingFee}
          startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

UpdateOrderInfo.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  orderId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  initialData: PropTypes.shape({
    tenNguoiNhan: PropTypes.string,
    soDienThoai: PropTypes.string,
    diaChi: PropTypes.string,
    phiVanChuyen: PropTypes.number, // Expect initial fee
  }).isRequired,
  onUpdateSuccess: PropTypes.func,
  currentUser: PropTypes.string,
};

export default UpdateOrderInfo;
