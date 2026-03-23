import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import Avatar from "@mui/material/Avatar";
import UploadIcon from "@mui/icons-material/Upload";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../../examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "../../../examples/Navbars/DashboardNavbar";
import Fade from "@mui/material/Fade";
import Paper from "@mui/material/Paper";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import axios from "axios";
import { styled } from "@mui/material/styles";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SafeAutocomplete from "../nhanvien/component/SafeAutocomplete";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormLabel from "@mui/material/FormLabel";
import FormControlLabel from "@mui/material/FormControlLabel";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import Autocomplete from "@mui/material/Autocomplete";

const GHN_API_BASE_URL = "https://online-gateway.ghn.vn/shiip/public-api/master-data";
const GHN_API_TOKEN = process.env.REACT_APP_GHN_TOKEN; // Thay bằng token của bạn
const GHN_API_CONFIG = { headers: { token: GHN_API_TOKEN } };
const khachHangDetailAPI = (id) => `http://localhost:8080/khachHang/${id}`;
const khachHangUpdateAPI = (id) => `http://localhost:8080/khachHang/${id}`;


const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 20,
  background: "linear-gradient(135deg, #ffffff 0%, #f8faff 100%)",
  boxShadow: "0 20px 60px rgba(0, 0, 0, 0.08)",
  padding: theme.spacing(4),
  position: "relative",
  overflow: "visible",
  width: "100%",
  margin: "0 auto",
  border: "0px solid rgba(23, 105, 170, 0.1)",
  height: "100%",
  [theme.breakpoints.up("md")]: { maxWidth: "100%" },
  [theme.breakpoints.down("md")]: { padding: theme.spacing(2) },
}));

const ProfileSection = styled(Box)(({ theme }) => ({
  background: "linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)",
  borderRadius: 16,
  padding: theme.spacing(3),
  textAlign: "center",
  position: "relative",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background:
      "linear-gradient(45deg, rgba(23, 105, 170, 0.05) 0%, rgba(156, 39, 176, 0.05) 100%)",
    borderRadius: 16,
    zIndex: 0,
  },
}));

const InfoCard = styled(Paper)(({ theme }) => ({
  background: "linear-gradient(135deg, #ffffff 0%, #fafbff 100%)",
  borderRadius: 12,
  padding: theme.spacing(2.5),
  border: "1px solid rgba(23, 105, 170, 0.08)",
  transition: "all 0.3s ease",
  marginBottom: theme.spacing(3),
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 8px 25px rgba(23, 105, 170, 0.15)",
  },
}));

const labelStyle = {
  fontWeight: 600,
  color: "#1769aa",
  marginBottom: 4,
  fontSize: 15,
  display: "block",
  letterSpacing: "0.3px",
};

const GENDER_OPTIONS = [
  { value: 1, label: "Nam" },
  { value: 0, label: "Nữ" },
  { value: 2, label: "Khác" },
];
const STATUS_OPTIONS = [
  { value: 1, label: "Online" },
  { value: 0, label: "Offline" },
];

function arraySafe(array) {
  return Array.isArray(array) ? array : [];
}
function findById(array, value, key) {
  if (!array || !value) return null;
  if (!key) key = "id";
  return array.find((item) => item && item[key] === value) || null;
}
function normalizeString(str) {
  return (str || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
function findProvinceByName(name, provinces) {
  if (!name || !Array.isArray(provinces)) return null;
  const normalize = (str) =>
    (str || "")
      .toLowerCase()
      .replace(/\s+/g, "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  return provinces.find((p) => normalize(p.province) === normalize(name));
}
function getDiaChiString({ xaPhuong, tinhThanhPho }, provinces, wards) {
  let xa = "";
  let tinh = "";
  if (wards.length > 0 && xaPhuong) {
    const foundWard = wards.find((w) => w.name === xaPhuong);
    xa = foundWard && foundWard.name ? foundWard.name : xaPhuong;
  } else {
    xa = xaPhuong;
  }
  if (provinces.length > 0 && tinhThanhPho) {
    const foundProvince = provinces.find((p) => p.id === tinhThanhPho);
    tinh = foundProvince && foundProvince.province ? foundProvince.province : tinhThanhPho;
  } else {
    tinh = tinhThanhPho;
  }
  return [xa, tinh].filter(Boolean).join(", ");
}

export default function UpdateKhachHangForm({ id: propId, onClose }) {
  const params = useParams();
  const id = propId || params.id;
  const [customer, setCustomer] = useState({
    tenKhachHang: "",
    hinhAnh: "",
    gioiTinh: "",
    ngaySinh: "",
    sdt: "",
    email: "",
    trangThai: 1,
    tinhThanhPho: "",
    xaPhuong: "",
    maKhachHang: "",
    matKhau: "",
    diaChi: "",
  });
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [focusField, setFocusField] = useState("");
  const navigate = useNavigate();
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedWard, setSelectedWard] = useState(null);
  const [provinceInput, setProvinceInput] = useState("");
  const [wardInput, setWardInput] = useState("");
  const [wardsLoading, setWardsLoading] = useState(false);
  const [initialAddress, setInitialAddress] = useState(null);
   const [diaChiChiTiet, setDiaChiChiTiet] = useState("")
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const response = await axios.get(`${GHN_API_BASE_URL}/province`, GHN_API_CONFIG);
        setProvinces(Array.isArray(response.data.data) ? response.data.data : []);
      } catch (error) {
        console.error("Lỗi API Tỉnh/Thành phố (GHN):", error);
      }
    };
    fetchProvinces();
  }, []);

  // 2. Lấy thông tin chi tiết khách hàng khi có ID và danh sách tỉnh
  useEffect(() => {
    if (id && provinces.length > 0) {
      const fetchCustomerDetails = async () => {
        try {
          const res = await axios.get(khachHangDetailAPI(id), { withCredentials: true });
          const data = res.data.data || res.data;

          // Cập nhật state thông tin cơ bản
          setCustomer({
            tenKhachHang: data.tenKhachHang || "",
            hinhAnh: data.hinhAnh || "",
            gioiTinh: data.gioiTinh !== null ? data.gioiTinh : "",
            ngaySinh: data.ngaySinh || "",
            sdt: data.sdt || "",
            email: data.email || "",
            trangThai: data.trangThai !== null ? data.trangThai : 1,
            maKhachHang: data.maKhachHang || "",
          });
          setAvatarPreview(data.hinhAnh || "");

          // Tìm và lưu địa chỉ mặc định (hoặc đầu tiên)
          const defaultAddress = Array.isArray(data.diaChis)
            ? data.diaChis.find((dc) => dc.trangThai === 1) || data.diaChis[0]
            : null;

          if (defaultAddress) {
            setInitialAddress(defaultAddress); // Lưu lại để xử lý bất đồng bộ
            setDiaChiChiTiet(defaultAddress.diaChiChiTiet || "");
          }
        } catch (error) {
          console.error("Lỗi khi lấy thông tin khách hàng:", error);
          toast.error("Không thể tải thông tin khách hàng.");
        }
      };
      fetchCustomerDetails();
    }
  }, [id, provinces]);

  // 3. Xử lý logic địa chỉ sau khi đã có địa chỉ ban đầu và danh sách tỉnh/thành
  useEffect(() => {
    if (initialAddress && provinces.length > 0) {
      const province = provinces.find((p) => p.ProvinceName === initialAddress.tinhThanhPho);
      setSelectedProvince(province || null);
    }
  }, [initialAddress, provinces]);

  // 4. Lấy Quận/Huyện khi Tỉnh/Thành được chọn
  useEffect(() => {
    if (selectedProvince) {
      const fetchDistricts = async () => {
        try {
          const response = await axios.get(
            `${GHN_API_BASE_URL}/district?province_id=${selectedProvince.ProvinceID}`,
            GHN_API_CONFIG
          );
          const districtData = Array.isArray(response.data.data) ? response.data.data : [];
          setDistricts(districtData);
          // Nếu có địa chỉ ban đầu, tự động chọn quận/huyện tương ứng
          if (initialAddress) {
            const district = districtData.find((d) => d.DistrictName === initialAddress.quanHuyen);
            setSelectedDistrict(district || null);
          }
        } catch (error) {
          console.error("Lỗi API Quận/Huyện (GHN):", error);
        }
      };
      fetchDistricts();
    } else {
      setDistricts([]);
      setSelectedDistrict(null);
    }
  }, [selectedProvince, initialAddress]);

  // 5. Lấy Xã/Phường khi Quận/Huyện được chọn
  useEffect(() => {
    if (selectedDistrict) {
      const fetchWards = async () => {
        try {
          const response = await axios.get(
            `${GHN_API_BASE_URL}/ward?district_id=${selectedDistrict.DistrictID}`,
            GHN_API_CONFIG
          );
          const wardData = Array.isArray(response.data.data) ? response.data.data : [];
          setWards(wardData);
          // Nếu có địa chỉ ban đầu, tự động chọn xã/phường tương ứng
          if (initialAddress) {
            const ward = wardData.find((w) => w.WardName === initialAddress.xaPhuong);
            setSelectedWard(ward || null);
          }
        } catch (error) {
          console.error("Lỗi API Xã/Phường (GHN):", error);
        }
      };
      fetchWards();
    } else {
      setWards([]);
      setSelectedWard(null);
    }
  }, [selectedDistrict, initialAddress]);

  function handleCustomerChange(event) {
    const name = event.target.name;
    const value = event.target.value;
    setCustomer(function (previous) {
      return { ...previous, [name]: value };
    });
  }

  function handleGenderChange(event) {
    const value = event.target.value;
    setCustomer(function (previous) {
      return { ...previous, gioiTinh: value };
    });
  }

  function handleAvatarChange(event) {
    const file = event.target.files[0];
    if (file) {
      setAvatarFile(file);
      setCustomer(function (previous) {
        return { ...previous, hinhAnh: file.name };
      });
      setAvatarPreview(URL.createObjectURL(file));
    }
  }

  const validate = () => {
    let newErrors = {};
    if (!customer.tenKhachHang) newErrors.tenKhachHang = "Vui lòng nhập tên khách hàng";
     if (!customer.sdt) {
    newErrors.sdt = "Vui lòng nhập số điện thoại";
  } else if (!/^(0[3|5|7|8|9])+([0-9]{8})$/.test(customer.sdt)) {
    newErrors.sdt = "Số điện thoại không hợp lệ";
  }

  // Validate Email
  if (!customer.email) {
    newErrors.email = "Vui lòng nhập email";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
    newErrors.email = "Email không đúng định dạng";
  }

    if (!selectedProvince) newErrors.tinhThanhPho = "Vui lòng chọn Tỉnh/Thành phố";
    if (!selectedDistrict) newErrors.quanHuyen = "Vui lòng chọn Quận/Huyện";
    if (!selectedWard) newErrors.xaPhuong = "Vui lòng chọn Phường/Xã";
 

    return newErrors;
  };

  async function handleSubmit(event) {
  event.preventDefault();
  const formErrors = validate(); // Hàm validate của bạn đã đúng
  if (Object.keys(formErrors).length) {
    setErrors(formErrors);
    toast.error(Object.values(formErrors)[0]);
    return;
  }
  setLoading(true);
  setSuccess(false);

  // === PHẦN SỬA LỖI BẮT ĐẦU TỪ ĐÂY ===

  // 1. Tạo payload vO từ các state đã được tách biệt và cập nhật
  const vO = {
    // Lấy thông tin cá nhân từ state 'customer'
    tenKhachHang: customer.tenKhachHang,
    gioiTinh: customer.gioiTinh,
    ngaySinh: customer.ngaySinh,
    sdt: customer.sdt,
    email: customer.email,
    trangThai: customer.trangThai,
    maKhachHang: customer.maKhachHang,
    
    // Lấy thông tin địa chỉ MỚI NHẤT từ các state 'selected...'
    tinhThanhPho: selectedProvince?.ProvinceName || "",
    quanHuyen: selectedDistrict?.DistrictName || "",
    xaPhuong: selectedWard?.WardName || "",
    diaChiChiTiet: diaChiChiTiet,
  };

  const formData = new FormData();
  formData.append("vO", new Blob([JSON.stringify(vO)], { type: "application/json" }));
  if (avatarFile) {
    formData.append("imageFile", avatarFile);
  }

  // === KẾT THÚC PHẦN SỬA LỖI ===

  try {
    await axios.put(khachHangUpdateAPI(id), formData, { withCredentials: true });

    setSuccess(true);
    toast.success("Cập nhật khách hàng thành công!");
    setTimeout(function () {
      setLoading(false);
      if (onClose) {
        onClose();
      } else {
        navigate(-1);
      }
    }, 1200);
  } catch (err) {
    setLoading(false);
    setSuccess(false);
    toast.error("Đã có lỗi, vui lòng thử lại!");
    console.error("Update Error:", err.response?.data || err); // Log lỗi chi tiết hơn
  }
}

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <Box
        sx={{
          minHeight: "100vh",
          background: "linear-gradient(130deg,#f2f9fe 70%,#e9f0fa 100%)",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          py: 4,
        }}
      >
        <Fade in timeout={600}>
          <StyledCard>
            <Typography
              variant="h4"
              sx={{ fontWeight: 800, color: "#1769aa", textAlign: "center", mb: 3 }}
            >
              Cập nhật Khách Hàng
            </Typography>
            <form onSubmit={handleSubmit} autoComplete="off">
              <Grid container spacing={4}>
                <Grid item xs={12} md={4}>
                  <ProfileSection>
                    <Avatar
                      src={avatarPreview || "/default-avatar.png"}
                      alt={customer.tenKhachHang || "Khách hàng"}
                      sx={{
                        width: 180,
                        height: 180,
                        mx: "auto",
                        mb: 2,
                        border: "4px solid white",
                        boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
                        fontSize: "3rem",
                        backgroundColor: "#1769aa",
                      }}
                    >
                      {customer.tenKhachHang ? customer.tenKhachHang.charAt(0).toUpperCase() : "K"}
                    </Avatar>
                    <Box>
                      <Button
                        variant="contained"
                        component="label"
                        startIcon={<UploadIcon />}
                        sx={{ mt: 2, borderRadius: 2, fontWeight: 600, px: 3 }}
                      >
                        Đổi ảnh
                        <input type="file" hidden accept="image/*" onChange={handleAvatarChange} />
                      </Button>
                    </Box>
                    <Divider sx={{ my: 2, opacity: 0.3 }} />
                    <FormControl component="fieldset" fullWidth sx={{ mt: 2, mb: 2 }}>
                      <FormLabel
                        component="legend"
                        sx={{ color: "#1769aa", fontWeight: 700, mb: 1 }}
                      >
                        Giới tính
                      </FormLabel>
                      <RadioGroup
                        row
                        name="gioiTinh"
                        value={customer.gioiTinh}
                        onChange={handleGenderChange}
                      >
                        {GENDER_OPTIONS.map((gender) => (
                          <FormControlLabel
                            key={gender.value}
                            value={gender.value}
                            control={<Radio />}
                            label={gender.label}
                          />
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                      <FormLabel sx={labelStyle}>Trạng thái</FormLabel>
                      <Select
                        name="trangThai"
                        value={customer.trangThai}
                        onChange={handleCustomerChange}
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <MenuItem value={status.value} key={status.value}>
                            {status.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </ProfileSection>
                </Grid>
                <Grid item xs={12} md={8}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <InfoCard>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            color: "#1769aa",
                            mb: 3,
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <PersonIcon />
                          Thông Tin Cá Nhân
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <label>Họ và tên</label>
                            <TextField
                              name="tenKhachHang"
                              value={customer.tenKhachHang}
                              onChange={handleCustomerChange}
                              fullWidth
                              size="small"
                              sx={{ mb: 2 }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <label>Mã khách hàng</label>
                            <TextField
                              name="maKhachHang"
                              value={customer.maKhachHang}
                              onChange={handleCustomerChange}
                              fullWidth
                              size="small"
                              sx={{ mb: 2 }}
                              disabled
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <label>Ngày sinh</label>
                            <TextField
                              name="ngaySinh"
                              type="date"
                              value={customer.ngaySinh}
                              onChange={handleCustomerChange}
                              fullWidth
                              size="small"
                              sx={{ mb: 2 }}
                              InputLabelProps={{ shrink: true }}
                            />
                          </Grid>
                        </Grid>
                      </InfoCard>
                    </Grid>
                    <Grid item xs={12}>
                      <InfoCard>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            color: "#1769aa",
                            mb: 3,
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <EmailIcon />
                          Thông Tin Liên Hệ
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <label>Số điện thoại</label>
                            <TextField
                              name="sdt"
                              value={customer.sdt}
                              onChange={handleCustomerChange}
                              fullWidth
                              size="small"
                              sx={{ mb: 2 }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <label>Email</label>
                            <TextField
                              name="email"
                              value={customer.email}
                              onChange={handleCustomerChange}
                              fullWidth
                              size="small"
                              sx={{ mb: 2 }}
                            />
                          </Grid>
                        </Grid>
                      </InfoCard>
                    </Grid>
                    <Grid item xs={12}>
                      <InfoCard>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            color: "#1769aa",
                            mb: 3,
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <LocationOnIcon />
                          Thông Tin Địa Chỉ
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <label>Tỉnh/Thành phố</label>
                            <Autocomplete
                              options={provinces}
                              getOptionLabel={(option) => option.ProvinceName || ""}
                              value={selectedProvince}
                              onChange={(e, value) => {
                                setSelectedProvince(value);
                                // Khi chọn tỉnh mới, reset các cấp dưới
                                setSelectedDistrict(null);
                                setSelectedWard(null);
                              }}
                              isOptionEqualToValue={(option, value) =>
                                option.ProvinceID === value.ProvinceID
                              }
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  size="small"
                                  error={!!errors.tinhThanhPho}
                                  helperText={errors.tinhThanhPho}
                                />
                              )}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <label>Quận/Huyện</label>
                            <Autocomplete
                              options={districts}
                              getOptionLabel={(option) => option.DistrictName || ""}
                              value={selectedDistrict}
                              disabled={!selectedProvince}
                              onChange={(e, value) => {
                                setSelectedDistrict(value);
                                // Khi chọn quận/huyện mới, reset xã/phường
                                setSelectedWard(null);
                              }}
                              isOptionEqualToValue={(option, value) =>
                                option.DistrictID === value.DistrictID
                              }
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  size="small"
                                  error={!!errors.quanHuyen}
                                  helperText={errors.quanHuyen}
                                />
                              )}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <label>Phường/Xã</label>
                            <Autocomplete
                              options={wards}
                              getOptionLabel={(option) => option.WardName || ""}
                              value={selectedWard}
                              disabled={!selectedDistrict}
                              onChange={(e, value) => {
                                setSelectedWard(value);
                              }}
                              isOptionEqualToValue={(option, value) =>
                                option.WardCode === value.WardCode
                              }
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  size="small"
                                  error={!!errors.xaPhuong}
                                  helperText={errors.xaPhuong}
                                />
                              )}
                            />
                          </Grid>
                         
                        </Grid>
                      </InfoCard>
                    </Grid>
                    <Grid item xs={12}>
                      <Divider sx={{ mb: 2, mt: 3, background: "#1976d2", opacity: 0.2 }} />
                      <Box display="flex" justifyContent="center" gap={2}>
                        <Button
                          variant="outlined"
                          color="inherit"
                          size="large"
                          onClick={() => {
                            if (onClose) onClose();
                            else navigate(-1);
                          }}
                          sx={{
                            color: "#020205",
                            fontWeight: 700,
                            borderRadius: 3,
                            minWidth: 120,
                            background: "#fafdff",
                            border: "2px solid #b0bec5",
                            "&:hover": {
                              background: "#eceff1",
                              borderColor: "#90caf9",
                            },
                          }}
                          disabled={loading}
                        >
                          Hủy bỏ
                        </Button>
                        <Button
                          variant="contained"
                          color={success ? "success" : "info"}
                          size="large"
                          type="submit"
                          sx={{
                            fontWeight: 800,
                            fontSize: 18,
                            px: 8,
                            borderRadius: 3,
                            minWidth: 200,
                            boxShadow: "0 2px 10px 0 #90caf9",
                            transition: "all 0.3s",
                          }}
                          disabled={loading}
                          startIcon={
                            loading ? (
                              <CircularProgress color="inherit" size={22} />
                            ) : success ? (
                              <CheckCircleIcon fontSize="large" />
                            ) : undefined
                          }
                        >
                          {loading
                            ? "Đang lưu..."
                            : success
                            ? "Thành công!"
                            : "Cập nhật khách hàng"}
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </form>
          </StyledCard>
        </Fade>
      </Box>
    </DashboardLayout>
  );
}

UpdateKhachHangForm.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onClose: PropTypes.func,
};
