import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  Autocomplete,
  Button,
  Box,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SoftTypography from "../../../../components/SoftTypography";
import PropTypes from 'prop-types';

// === THAY ĐỔI: API ENDPOINTS CỦA GIAO HÀNG NHANH ===
const GHN_API_BASE_URL = "https://online-gateway.ghn.vn/shiip/public-api/master-data";
const GHN_API_TOKEN = process.env.REACT_APP_GHN_TOKEN; // <<< !!! THAY THẾ BẰNG TOKEN CỦA BẠN !!!

const GHN_API_CONFIG = {
  headers: {
    token: GHN_API_TOKEN,
  },
};

function AddAddressModal({ open, onClose, customerId, onAddressAdded }) {
  // === THÊM STATE CHO QUẬN/HUYỆN ===
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]); // State cho Quận/Huyện
  const [wards, setWards] = useState([]);
  
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null); // State cho lựa chọn Quận/Huyện
  const [selectedWard, setSelectedWard] = useState(null);
  const [detailedAddress, setDetailedAddress] = useState("");

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Reset form và lỗi khi modal được mở
  useEffect(() => {
    if (open) {
      setSelectedProvince(null);
      setSelectedDistrict(null); // Reset Quận/Huyện
      setSelectedWard(null);
      setDetailedAddress("");
      setDistricts([]); // Reset danh sách Quận/Huyện
      setWards([]);
      setErrors({});
    }
  }, [open]);

  // === CẬP NHẬT LOGIC LẤY ĐỊA CHỈ TỪ GHN ===

  // 1. Lấy danh sách Tỉnh/Thành phố khi modal mở
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
        }
      };
      fetchProvinces();
    }
  }, [open]);
  
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
    setWards([]);
    setSelectedWard(null);
  }, [selectedDistrict]);

  // Hàm validate, thêm kiểm tra cho Quận/Huyện
  const validateForm = () => {
    const newErrors = {};
    if (!selectedProvince) {
      newErrors.tinhThanhPho = "Vui lòng chọn Tỉnh/Thành phố.";
    }
    if (!selectedDistrict) { // Thêm validation cho Quận/Huyện
      newErrors.quanHuyen = "Vui lòng chọn Quận/Huyện.";
    }
    if (!selectedWard) {
      newErrors.xaPhuong = "Vui lòng chọn Xã/Phường.";
    }
   if (!detailedAddress.trim()) {
      newErrors.diaChiChiTiet = "Vui lòng nhập địa chỉ chi tiết.";
    }
    setErrors(newErrors);
    return newErrors;
  };

  const handleSave = async () => {
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      return;
    }
    
    setLoading(true);
    // Cập nhật payload với Quận/Huyện
    const payload = {
      idKhachHang: customerId,
      tinhThanhPho: selectedProvince.ProvinceName,
      quanHuyen: selectedDistrict.DistrictName, // Thêm Quận/Huyện
      xaPhuong: selectedWard.WardName,
      diaChiCuThe: detailedAddress,
      trangThai: 1,
    };

    try {
      await axios.post("http://localhost:8080/diaChi", payload, {
        withCredentials: true // <-- SỬA ở đây: gửi kèm cookie/session khi gọi API backend
      });
      onAddressAdded(); 
    } catch (error) {
      console.error("Lỗi khi thêm địa chỉ:", error);
    } finally {
      setLoading(false);
    }
  };

  const clearError = (fieldName) => {
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: undefined }));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <SoftTypography variant="h5">Thêm địa chỉ mới</SoftTypography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Autocomplete
          options={provinces}
          getOptionLabel={(option) => option.ProvinceName || ""}
          value={selectedProvince}
          onChange={(e, value) => {
            setSelectedProvince(value);
            clearError('tinhThanhPho');
          }}
          renderInput={(params) => (
            <TextField 
              {...params} 
              label="Tỉnh/Thành phố" 
              margin="normal" 
              error={!!errors.tinhThanhPho}
              helperText={errors.tinhThanhPho || ""}
            />
          )}
        />
        
        {/* <<< THÊM: AUTOCOMPLETE CHO QUẬN/HUYỆN >>> */}
        <Autocomplete
          options={districts}
          getOptionLabel={(option) => option.DistrictName || ""}
          value={selectedDistrict}
          disabled={!selectedProvince}
          onChange={(e, value) => {
            setSelectedDistrict(value);
            clearError('quanHuyen');
          }}
          renderInput={(params) => (
            <TextField 
              {...params} 
              label="Quận/Huyện" 
              margin="normal" 
              error={!!errors.quanHuyen}
              helperText={errors.quanHuyen || ""}
            />
          )}
        />

        <Autocomplete
          options={wards}
          getOptionLabel={(option) => option.WardName || ""}
          value={selectedWard}
          disabled={!selectedDistrict} // Disable dựa trên Quận/Huyện
          onChange={(e, value) => {
            setSelectedWard(value);
            clearError('xaPhuong');
          }}
          renderInput={(params) => (
            <TextField 
              {...params} 
              label="Xã/Phường" 
              margin="normal" 
              error={!!errors.xaPhuong}
              helperText={errors.xaPhuong || ""}
            />
          )}
        />
<TextField
  label="Địa chỉ chi tiết"
  fullWidth
  margin="normal"
  placeholder="Số nhà, tên đường, thôn, xóm..."
  value={detailedAddress}
  onChange={(e) => {
    setDetailedAddress(e.target.value);
    clearError('diaChiChiTiet');
  }}
  error={!!errors.diaChiChiTiet}
  helperText={errors.diaChiChiTiet || ""}
/>
        
     </DialogContent>
  <DialogActions sx={{ paddingX: 3, paddingBottom: 2 }}> {/* Thêm padding cho đẹp */}
    <Button
      onClick={onClose}
      color="secondary"
      variant="text"
      sx={{
        textTransform: 'none',
        fontWeight: 'bold',
        borderRadius: '8px',
      }}
    >
      Hủy
    </Button>
    <Button
      onClick={handleSave}
      color="info"
      variant="contained"
      disabled={loading}
      sx={{
        textTransform: 'none',
        fontWeight: 'bold',
        borderRadius: '8px',
        boxShadow: 'none',
        '&:hover': {
          boxShadow: 'none',
        }
      }}
    >
      {loading ? <CircularProgress size={24} color="inherit" /> : "Lưu địa chỉ"}
    </Button>
  </DialogActions>
</Dialog>
  );
}

AddAddressModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  customerId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onAddressAdded: PropTypes.func.isRequired,
};

export default AddAddressModal;