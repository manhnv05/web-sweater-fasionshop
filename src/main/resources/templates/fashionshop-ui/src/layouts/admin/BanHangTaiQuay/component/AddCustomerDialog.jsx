import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
  IconButton,
  Typography,
  Divider,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  FormControl,
  Autocomplete,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import PropTypes from "prop-types";

// === THAY ĐỔI: API ENDPOINTS CỦA GIAO HÀNG NHANH ===
const GHN_API_BASE_URL = "https://online-gateway.ghn.vn/shiip/public-api/master-data";
const GHN_API_TOKEN = process.env.REACT_APP_GHN_TOKEN; // <<< !!! THAY THẾ BẰNG TOKEN CỦA BẠN !!!

const GHN_API_CONFIG = {
  headers: {
    token: GHN_API_TOKEN,
  },
};

const initialCustomerState = {
  tenKhachHang: "",
  email: "",
  soDienThoai: "",
  ngaySinh: "",
  gioiTinh: "",
  address: {
    diaChiChiTiet: "",
  },
};

function AddCustomerDialog({ open, onClose, onCustomerAdded, showNotification }) {
  const [newCustomer, setNewCustomer] = useState(initialCustomerState);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // === STATE MỚI CHO VIỆC CHỌN ĐỊA CHỈ (GHN) ===
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]); // Thêm state cho Quận/Huyện
  const [wards, setWards] = useState([]);

  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null); // Thêm state cho lựa chọn Quận/Huyện
  const [selectedWard, setSelectedWard] = useState(null);
  // ===============================================

  // Reset state khi dialog được mở
  useEffect(() => {
    if (open) {
      setNewCustomer(initialCustomerState);
      setErrors({});
      setSelectedProvince(null);
      setSelectedDistrict(null);
      setSelectedWard(null);
      setProvinces([]);
      setDistricts([]);
      setWards([]);
    }
  }, [open]);

  // === API LOGIC: LẤY DỮ LIỆU ĐỊA CHỈ TỪ GHN ===

  // 1. Lấy danh sách Tỉnh/Thành phố khi dialog mở
  useEffect(() => {
    if (open) {
      const fetchProvinces = async () => {
        try {
          const response = await axios.get(`${GHN_API_BASE_URL}/province`, GHN_API_CONFIG);
          if (Array.isArray(response.data.data)) {
            setProvinces(response.data.data);
          }
        } catch (error) {
          console.error("Lỗi API Tỉnh/Thành phố (GHN):", error);
          showNotification({
            open: true,
            message: "Không thể tải danh sách Tỉnh/Thành. Vui lòng kiểm tra token API.",
            severity: "error",
          });
        }
      };
      fetchProvinces();
    }
  }, [open, showNotification]);

  // 2. Lấy danh sách Quận/Huyện khi Tỉnh/Thành phố thay đổi
  useEffect(() => {
    if (selectedProvince) {
      const fetchDistricts = async () => {
        try {
          const response = await axios.get(
            `${GHN_API_BASE_URL}/district?province_id=${selectedProvince.ProvinceID}`,
            GHN_API_CONFIG
          );
          if (Array.isArray(response.data.data)) {
            setDistricts(response.data.data);
          }
        } catch (error) {
          console.error("Lỗi API Quận/Huyện (GHN):", error);
        }
      };
      fetchDistricts();
    }
    // Reset các lựa chọn cấp dưới khi chọn lại tỉnh
    setDistricts([]);
    setWards([]);
    setSelectedDistrict(null);
    setSelectedWard(null);
  }, [selectedProvince]);

  // 3. Lấy danh sách Xã/Phường khi Quận/Huyện thay đổi
  useEffect(() => {
    if (selectedDistrict) {
      const fetchWards = async () => {
        try {
          const response = await axios.get(
            `${GHN_API_BASE_URL}/ward?district_id=${selectedDistrict.DistrictID}`,
            GHN_API_CONFIG
          );
          if (Array.isArray(response.data.data)) {
            setWards(response.data.data);
          }
        } catch (error) {
          console.error("Lỗi API Xã/Phường (GHN):", error);
        }
      };
      fetchWards();
    }
    // Reset lựa chọn xã khi chọn lại huyện
    setWards([]);
    setSelectedWard(null);
  }, [selectedDistrict]);
  // ========================================

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "diaChiChiTiet") {
      setNewCustomer((prev) => ({ ...prev, address: { ...prev.address, diaChiChiTiet: value } }));
    } else {
      setNewCustomer((prev) => ({ ...prev, [name]: value }));
    }
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Cập nhật hàm validate
  const validateForm = () => {
    const newErrors = {};
    if (!newCustomer.tenKhachHang.trim()) newErrors.tenKhachHang = "Tên không được để trống.";
    if (!newCustomer.email.trim()) newErrors.email = "Email không được để trống.";
    else if (!/\S+@\S+\.\S+/.test(newCustomer.email)) newErrors.email = "Email không hợp lệ.";
    if (!newCustomer.soDienThoai.trim())
      newErrors.soDienThoai = "Số điện thoại không được để trống.";
    else if (!/^\d{10,11}$/.test(newCustomer.soDienThoai))
      newErrors.soDienThoai = "Số điện thoại không hợp lệ.";
    if (!newCustomer.gioiTinh) newErrors.gioiTinh = "Vui lòng chọn giới tính.";

    // Validate cho địa chỉ
    if (!selectedProvince) newErrors.tinhThanhPho = "Vui lòng chọn Tỉnh/Thành phố.";
    if (!selectedDistrict) newErrors.quanHuyen = "Vui lòng chọn Quận/Huyện."; // Thêm validate Quận/Huyện
    if (!selectedWard) newErrors.xaPhuong = "Vui lòng chọn Xã/Phường.";
   if (!newCustomer.address.diaChiChiTiet.trim()) {
      newErrors.diaChiChiTiet = "Vui lòng nhập địa chỉ chi tiết.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Cập nhật hàm thêm mới
  const handleAddNewCustomer = async () => {
    if (!validateForm()) return;
    setLoading(true);

    const payload = {
      khachHang: {
        tenKhachHang: newCustomer.tenKhachHang,
        email: newCustomer.email,
        sdt: newCustomer.soDienThoai,
        gioiTinh: newCustomer.gioiTinh === "Nam" ? 1 : newCustomer.gioiTinh === "Nữ" ? 0 : 2,
        ngaySinh: newCustomer.ngaySinh ? dayjs(newCustomer.ngaySinh).format("YYYY-MM-DD") : null,
        trangThai: 1,
      },
      diaChi: {
        tinhThanhPho: selectedProvince ? selectedProvince.ProvinceName : null,
        quanHuyen: selectedDistrict ? selectedDistrict.DistrictName : null, // Thêm quận/huyện
        xaPhuong: selectedWard ? selectedWard.WardName : null,
        diaChiChiTiet: newCustomer.address.diaChiChiTiet, // Gửi cả địa chỉ chi tiết
        trangThai: 1,
      },
    };
 console.log('Payload TRƯỚC KHI GỬI:', JSON.stringify(payload, null, 2));
    try {
      await axios.post("http://localhost:8080/khachHang/them-khach-hang-ban-tai-quay", payload, {
        
        withCredentials: true,
      });
      onCustomerAdded();
      onClose();
    } catch (err) {
      console.error("Lỗi khi thêm khách hàng:", err.response || err);
      const apiError = err.response?.data?.message || "Đã xảy ra lỗi khi thêm khách hàng.";
      toast.error(apiError);
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        Thêm khách hàng
        <IconButton aria-label="close" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {/* Các trường thông tin cá nhân (giữ nguyên) */}
        <TextField
          label="Tên khách hàng"
          name="tenKhachHang"
          fullWidth
          margin="normal"
          value={newCustomer.tenKhachHang}
          onChange={handleChange}
          error={!!errors.tenKhachHang}
          helperText={errors.tenKhachHang}
        />
        <TextField
          label="Email"
          name="email"
          fullWidth
          margin="normal"
          value={newCustomer.email}
          onChange={handleChange}
          error={!!errors.email}
          helperText={errors.email}
        />
        <TextField
          label="Số điện thoại"
          name="soDienThoai"
          fullWidth
          margin="normal"
          value={newCustomer.soDienThoai}
          onChange={handleChange}
          error={!!errors.soDienThoai}
          helperText={errors.soDienThoai}
        />
        <TextField
          label="Ngày sinh"
          name="ngaySinh"
          type="date"
          fullWidth
          margin="normal"
          value={newCustomer.ngaySinh}
          onChange={handleChange}
          InputLabelProps={{ shrink: true }}
        />
        <FormControl component="fieldset" margin="normal" error={!!errors.gioiTinh}>
          <FormLabel component="legend">Giới tính</FormLabel>
          <RadioGroup row name="gioiTinh" value={newCustomer.gioiTinh} onChange={handleChange}>
            <FormControlLabel value="Nam" control={<Radio />} label="Nam" />
            <FormControlLabel value="Nữ" control={<Radio />} label="Nữ" />
            <FormControlLabel value="Khác" control={<Radio />} label="Khác" />
          </RadioGroup>
          {errors.gioiTinh && (
            <Typography color="error" variant="caption" sx={{ pl: 2 }}>
              {errors.gioiTinh}
            </Typography>
          )}
        </FormControl>

        <Divider sx={{ my: 2 }} />

        {/* === THAY ĐỔI: SỬ DỤNG AUTOCOMPLETE CHO ĐỊA CHỈ (GHN) === */}
        <Typography variant="h6" gutterBottom>
          Địa chỉ
        </Typography>

        <Autocomplete
          options={provinces}
          getOptionLabel={(option) => option.ProvinceName || ""}
          value={selectedProvince}
          onChange={(event, newValue) => setSelectedProvince(newValue)}
          isOptionEqualToValue={(option, value) => option.ProvinceID === value.ProvinceID}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Tỉnh/Thành phố"
              margin="normal"
              error={!!errors.tinhThanhPho}
              helperText={errors.tinhThanhPho}
            />
          )}
        />

        {/* --- THÊM AUTOCOMPLETE CHO QUẬN/HUYỆN --- */}
        <Autocomplete
          options={districts}
          getOptionLabel={(option) => option.DistrictName || ""}
          value={selectedDistrict}
          disabled={!selectedProvince}
          onChange={(event, newValue) => setSelectedDistrict(newValue)}
          isOptionEqualToValue={(option, value) => option.DistrictID === value.DistrictID}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Quận/Huyện"
              margin="normal"
              error={!!errors.quanHuyen}
              helperText={errors.quanHuyen}
            />
          )}
        />
        {/* -------------------------------------- */}

        <Autocomplete
          options={wards}
          getOptionLabel={(option) => option.WardName || ""}
          value={selectedWard}
          disabled={!selectedDistrict} // Thay đổi disable dựa trên selectedDistrict
          onChange={(event, newValue) => setSelectedWard(newValue)}
          isOptionEqualToValue={(option, value) => option.WardCode === value.WardCode}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Xã/Phường"
              margin="normal"
              error={!!errors.xaPhuong}
              helperText={errors.xaPhuong}
            />
          )}
        />
<TextField
  label="Địa chỉ chi tiết"
  name="diaChiChiTiet"
  fullWidth
  margin="normal"
  placeholder="Số nhà, tên đường, thôn, xóm..."
  value={newCustomer.address.diaChiChiTiet}
  onChange={handleChange}
  error={!!errors.diaChiChiTiet}
  helperText={errors.diaChiChiTiet}
/>
      
        {/* =================================================== */}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Hủy
        </Button>
        <Button onClick={handleAddNewCustomer} color="info" variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={24} color="inherit" /> : "Thêm"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

AddCustomerDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onCustomerAdded: PropTypes.func.isRequired,
  showNotification: PropTypes.func.isRequired,
};

export default AddCustomerDialog;
