import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Grid, TextField, Divider, Box, Autocomplete } from "@mui/material";
import PropTypes from 'prop-types';
import Ghn from "../../../../assets/images/ghn.png"
// Import components
import SoftBox from "../../../../components/SoftBox";
import SoftTypography from "../../../../components/SoftTypography";
import SoftButton from "../../../../components/SoftButton";
import SoftInput from "../../../../components/SoftInput";
import DeliveryDiningIcon from "@mui/icons-material/DeliveryDining";

// --- Cấu hình API của Giao Hàng Nhanh ---
const GHN_API_BASE_URL = "https://online-gateway.ghn.vn/shiip/public-api";
// !!! THAY TOKEN CỦA BẠN VÀO ĐÂY !!!
const GHN_TOKEN = process.env.REACT_APP_GHN_TOKEN; 

const ghnApi = axios.create({
  baseURL: GHN_API_BASE_URL,
  headers: {
    'token': GHN_TOKEN,
    'Content-Type': 'application/json'
  }
});


function ShippingForm({ initialCustomer, initialAddress, onOpenAddressModal, onFormChange }) {
  // State cho các trường trong form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [detailedAddress, setDetailedAddress] = useState("");

  // State cho việc lấy và chọn địa chỉ từ API
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedWard, setSelectedWard] = useState(null);

  // Gửi dữ liệu form thay đổi ra component cha
  useEffect(() => {
    if (onFormChange) {
      const formData = {
        name,
        phone,
        detailedAddress,
        province: selectedProvince?.ProvinceName || "",
        district: selectedDistrict?.DistrictName || "",
        ward: selectedWard?.WardName || "",
        // Thêm các ID nếu cần thiết
        provinceId: selectedProvince?.ProvinceID || null,
        districtId: selectedDistrict?.DistrictID || null,
        wardCode: selectedWard?.WardCode || null,
      };
      onFormChange(formData);
    }
  }, [name, phone, detailedAddress, selectedProvince, selectedDistrict, selectedWard, onFormChange]);

  // 1. Lấy danh sách Tỉnh/Thành phố khi component được mount
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const response = await ghnApi.get('/master-data/province');
        if (response.data?.data) {
          setProvinces(response.data.data);
        }
      } catch (error) {
        console.error("Lỗi API tỉnh/thành phố GHN:", error);
      }
    };
    fetchProvinces();
  }, []);

  // 2. Lấy danh sách Quận/Huyện khi một Tỉnh/Thành phố được chọn
  useEffect(() => {
    if (selectedProvince) {
      const fetchDistricts = async () => {
        try {
          const response = await ghnApi.get('/master-data/district', {
            params: { province_id: selectedProvince.ProvinceID }
          });
          if (response.data?.data) {
            setDistricts(response.data.data);
          }
        } catch (error) {
          console.error("Lỗi API quận/huyện GHN:", error);
        }
      };
      fetchDistricts();
    }
    // Reset quận/huyện và phường/xã khi tỉnh thay đổi
    setSelectedDistrict(null);
    setSelectedWard(null);
    setDistricts([]);
    setWards([]);
  }, [selectedProvince]);
  
  

  // 3. Lấy danh sách Phường/Xã khi một Quận/Huyện được chọn
  useEffect(() => {
    if (selectedDistrict) {
      const fetchWards = async () => {
        try {
          const response = await ghnApi.get('/master-data/ward', {
            params: { district_id: selectedDistrict.DistrictID }
          });
          if (response.data?.data) {
            setWards(response.data.data);
          }
        } catch (error) {
          console.error("Lỗi API phường/xã GHN:", error);
        }
      };
      fetchWards();
    }
    // Reset phường/xã khi quận/huyện thay đổi
    setSelectedWard(null);
    setWards([]);
  }, [selectedDistrict]);

  // Xử lý khi có địa chỉ ban đầu được truyền vào
  useEffect(() => {
    if (initialCustomer) {
      setName(initialCustomer.tenKhachHang || "");
      setPhone(initialCustomer.sdt || "");
    }
    if (initialAddress && provinces.length > 0) {
         setDetailedAddress(initialAddress.diaChiCuThe || "");

        const provinceToSet = provinces.find(p => p.ProvinceName === initialAddress.tinhThanhPho);
        if (provinceToSet) {
            setSelectedProvince(provinceToSet);
        }
    }
  }, [initialCustomer, initialAddress, provinces]);
  
  // Xử lý khi quận huyện được tải xong và có địa chỉ ban đầu
    useEffect(() => {
        if (initialAddress && districts.length > 0) {
            const districtToSet = districts.find(d => d.DistrictName === initialAddress.quanHuyen);
            if (districtToSet) {
                setSelectedDistrict(districtToSet);
            }
        }
    }, [initialAddress, districts]);

    // Xử lý khi phường xã được tải xong và có địa chỉ ban đầu
    useEffect(() => {
        if (initialAddress && wards.length > 0) {
            const wardToSet = wards.find(w => w.WardName === initialAddress.xaPhuong);
            if (wardToSet) {
                setSelectedWard(wardToSet);
            }
        }
    }, [initialAddress, wards]);

  return (
    <SoftBox>
      <SoftButton
        variant="outlined"
        color="info"
        onClick={onOpenAddressModal}
        disabled={!initialCustomer || !initialCustomer.id}
      >
        Chọn một địa chỉ có sẵn
      </SoftButton>

      <Grid container spacing={2} mt={1}>
        <Grid item xs={12} md={6}>
          <SoftInput
            placeholder="Tên người nhận"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <SoftInput
            placeholder="Số điện thoại"
            fullWidth
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </Grid>
        
        {/* --- Tỉnh/Thành phố --- */}
        <Grid item xs={12} md={4}>
          <Autocomplete
            options={provinces}
            getOptionLabel={(option) => option.ProvinceName || ""}
            value={selectedProvince}
            onChange={(event, newValue) => setSelectedProvince(newValue)}
            isOptionEqualToValue={(option, value) => option.ProvinceID === value.ProvinceID}
            renderInput={(params) => <TextField {...params} label="Tỉnh/Thành phố" />}
          />
        </Grid>

        {/* --- Quận/Huyện (THÊM MỚI) --- */}
        <Grid item xs={12} md={4}>
          <Autocomplete
            options={districts}
            getOptionLabel={(option) => option.DistrictName || ""}
            value={selectedDistrict}
            onChange={(event, newValue) => setSelectedDistrict(newValue)}
            disabled={!selectedProvince}
            isOptionEqualToValue={(option, value) => option.DistrictID === value.DistrictID}
            renderInput={(params) => <TextField {...params} label="Quận/Huyện" />}
          />
        </Grid>

        {/* --- Xã/Phường --- */}
        <Grid item xs={12} md={4}>
          <Autocomplete
            options={wards}
            getOptionLabel={(option) => option.WardName || ""}
            value={selectedWard}
            onChange={(event, newValue) => setSelectedWard(newValue)}
            disabled={!selectedDistrict}
            isOptionEqualToValue={(option, value) => option.WardCode === value.WardCode}
            renderInput={(params) => <TextField {...params} label="Xã/Phường" />}
          />
        </Grid>

        <Grid item xs={12}>
          <SoftInput
            placeholder="Địa chỉ cụ thể (Số nhà, tên đường...)"
            fullWidth
            multiline
            rows={2}
            value={detailedAddress}
            onChange={(e) => setDetailedAddress(e.target.value)}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Box display="flex" alignItems="center" >
        <img src={Ghn} alt="Giao hàng nhanh" style={{ width: 300, height: 100, objectFit: "contain" ,margin: 0 }} />
        <Box>
          <SoftTypography variant="body1" fontWeight="medium">
            Đơn vị vận chuyển: Giao hàng nhanh
          </SoftTypography>
        </Box>
      </Box>
    </SoftBox>
  );
}

// Cập nhật PropTypes để bao gồm cả quận/huyện
ShippingForm.propTypes = {
  onOpenAddressModal: PropTypes.func.isRequired,
  initialCustomer: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    tenKhachHang: PropTypes.string,
    sdt: PropTypes.string,
  }),
  initialAddress: PropTypes.shape({
    diaChiChiTiet: PropTypes.string,
    tinhThanhPho: PropTypes.string,
    quanHuyen: PropTypes.string, // Thêm quận huyện
    xaPhuong: PropTypes.string,
    diaChiCuThe:PropTypes.string
  }),
  onFormChange: PropTypes.func.isRequired,
};

ShippingForm.defaultProps = {
    initialCustomer: null,
    initialAddress: null,
};

export default ShippingForm;