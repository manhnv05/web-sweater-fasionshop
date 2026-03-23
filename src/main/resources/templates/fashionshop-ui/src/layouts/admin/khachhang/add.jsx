import React, { useState, useEffect } from "react";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import Avatar from "@mui/material/Avatar";
import UploadIcon from "@mui/icons-material/Upload";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "../../../examples/Navbars/DashboardNavbar";
import Fade from "@mui/material/Fade";
import Paper from "@mui/material/Paper";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { styled } from "@mui/material/styles";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormLabel from "@mui/material/FormLabel";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import SafeAutocomplete from "../nhanvien/component/SafeAutocomplete";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import EmailIcon from "@mui/icons-material/Email";
import Autocomplete from "@mui/material/Autocomplete";
const GHN_API_BASE_URL = "https://online-gateway.ghn.vn/shiip/public-api/master-data";
const GHN_API_TOKEN = process.env.REACT_APP_GHN_TOKEN; // Token GHN của bạn
const GHN_API_CONFIG = {
  headers: {
    token: GHN_API_TOKEN,
  },
};
const API_URL = "http://localhost:8080/khachHang/with-address";
import axios from "axios";

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
  { value: 1, label: "Đang hoạt động" },
  { value: 0, label: "Ngừng hoạt động" },
];

function arraySafe(array) {
  return Array.isArray(array) ? array : [];
}
function findById(array, value, key) {
  if (!array || !value) return null;
  if (!key) key = "id";
  return array.find((item) => item && item[key] === value) || null;
}
function generateMaKhachHang() {
  const randomNumber = Math.floor(10000000 + Math.random() * 90000000);
  return "KH" + randomNumber;
}
function generateMatKhau() {
  let result = "";
  for (let i = 0; i < 10; i++) result += Math.floor(Math.random() * 10).toString();
  return result;
}

export default function AddKhachHangForm() {
  const [khachHang, setKhachHang] = useState({
    maKhachHang: "",
    matKhau: "",
    tenKhachHang: "",
    email: "",
    gioiTinh: "",
    sdt: "",
    ngaySinh: "",
    hinhAnh: "",
    trangThai: 1,
  });
  const [diaChi, setDiaChi] = useState({
    tinhThanhPho: "",
    xaPhuong: "",
    trangThai: 1,
  });
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedWard, setSelectedWard] = useState(null);
  const [diaChiChiTiet, setDiaChiChiTiet] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setKhachHang((prev) => ({
      ...prev,
      maKhachHang: generateMaKhachHang(),
      matKhau: generateMatKhau(),
    }));
  }, []);

  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const response = await axios.get(`${GHN_API_BASE_URL}/province`, GHN_API_CONFIG);
        if (Array.isArray(response.data.data)) {
          setProvinces(response.data.data);
        }
      } catch (error) {
        console.error("Lỗi API Tỉnh/Thành phố (GHN):", error);
        toast.error("Không thể tải danh sách Tỉnh/Thành phố.");
      }
    };
    fetchProvinces();
  }, []);

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
    // Reset các lựa chọn cấp dưới khi Tỉnh thay đổi
    setDistricts([]);
    setWards([]);
    setSelectedDistrict(null);
    setSelectedWard(null);
  }, [selectedProvince]);
  // 3. Lấy Xã/Phường khi Quận/Huyện thay đổi
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
    // Reset lựa chọn Xã/Phường khi Quận/Huyện thay đổi
    setWards([]);
    setSelectedWard(null);
  }, [selectedDistrict]);
  function handleKhachHangChange(event) {
    const { name, value } = event.target;
    setKhachHang((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }
  function handleDateChange(event) {
    let value = event.target.value;
    setKhachHang((prev) => ({
      ...prev,
      ngaySinh: value,
    }));
    setErrors((prev) => ({
      ...prev,
      ngaySinh: undefined,
    }));
  }
  function handleAvatarChange(event) {
    const file = event.target.files[0];
    if (file) {
      setKhachHang((prev) => ({
        ...prev,
        hinhAnh: file.name,
      }));
      setAvatarPreview(URL.createObjectURL(file));
      setImageFile(file);
    }
  }
  function handleDiaChiField(field, value) {
    setDiaChi((prev) => ({
      ...prev,
      [field]: value,
    }));
    setErrors((prev) => ({
      ...prev,
      [field]: undefined,
    }));
  }
  const clearError = (fieldName) => {
  if (errors[fieldName]) {
    setErrors((prev) => ({ ...prev, [fieldName]: undefined }));
  }
};
  const validate = () => {
    let newErrors = {};
    if (!khachHang.tenKhachHang) newErrors.tenKhachHang = "Vui lòng nhập tên khách hàng";
    if (!khachHang.email) newErrors.email = "Vui lòng nhập email";
    if (khachHang.gioiTinh === "" || khachHang.gioiTinh === undefined)
      newErrors.gioiTinh = "Vui lòng chọn giới tính";
    if (!khachHang.sdt) newErrors.sdt = "Vui lòng nhập số điện thoại";
    if (!khachHang.ngaySinh) newErrors.ngaySinh = "Vui lòng chọn ngày sinh";

    // Validate cho địa chỉ mới
    if (!selectedProvince) newErrors.tinhThanhPho = "Vui lòng chọn Tỉnh/Thành phố";
    if (!selectedDistrict) newErrors.quanHuyen = "Vui lòng chọn Quận/Huyện";
    if (!selectedWard) newErrors.xaPhuong = "Vui lòng chọn Phường/Xã";
    if (!diaChiChiTiet.trim()) newErrors.diaChiChiTiet = "Vui lòng nhập địa chỉ chi tiết";

    return newErrors;
  };
  async function handleSubmit(event) {
    event.preventDefault();
    const error = validate();
    if (Object.keys(error).length) {
      setErrors(error);
      toast.error(Object.values(error)[0]);
      return;
    }
    setLoading(true);
    setSuccess(false);
    const foundProvince = provinces.find((item) => item.id === diaChi.tinhThanhPho);
    const foundWard = wards.find((item) => item.name === diaChi.xaPhuong);

    const vO = {
      khachHang,
      diaChi: {
        tinhThanhPho: selectedProvince?.ProvinceName || "",
        quanHuyen: selectedDistrict?.DistrictName || "", // THÊM QUẬN/HUYỆN
        xaPhuong: selectedWard?.WardName || "",
  diaChiCuThe: diaChiChiTiet,
        trangThai: 1,
      },
    };

    const formData = new FormData();
    formData.append("vO", new Blob([JSON.stringify(vO)], { type: "application/json" }));
    if (imageFile) {
      formData.append("imageFile", imageFile);
    }

    try {
      await fetch(API_URL, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      setSuccess(true);
      toast.success("Thêm khách hàng thành công!");
      setTimeout(() => {
        setLoading(false);
        navigate(-1);
      }, 1200);
    } catch {
      setLoading(false);
      setSuccess(false);
      toast.error("Đã có lỗi, vui lòng thử lại!");
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
              Thêm Khách Hàng Mới
            </Typography>
            <form onSubmit={handleSubmit} autoComplete="off">
              <Grid container spacing={4}>
                {/* Avatar và trạng thái */}
                <Grid item xs={12} md={4}>
                  <ProfileSection>
                    <Avatar
                      src={avatarPreview || "/default-avatar.png"}
                      alt={khachHang.tenKhachHang || "Khách hàng"}
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
                      {khachHang.tenKhachHang
                        ? khachHang.tenKhachHang.charAt(0).toUpperCase()
                        : "K"}
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
                    <FormControl component="fieldset" error={!!errors.gioiTinh}>
                      <FormLabel
                        component="legend"
                        sx={{ color: "#1769aa", fontWeight: 700, mb: 1 }}
                      >
                        Giới tính
                      </FormLabel>
                      <RadioGroup
                        row
                        name="gioiTinh"
                        value={khachHang.gioiTinh}
                        onChange={handleKhachHangChange}
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
                      {errors.gioiTinh && (
                        <Typography color="error" fontSize={13} mt={1}>
                          {errors.gioiTinh}
                        </Typography>
                      )}
                    </FormControl>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                      <label style={labelStyle}>Trạng thái</label>
                      <TextField
                        select
                        name="trangThai"
                        value={khachHang.trangThai}
                        onChange={handleKhachHangChange}
                        size="small"
                        sx={{ bgcolor: "#f7fbfd", borderRadius: 2 }}
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <MenuItem key={status.value} value={status.value}>
                            {status.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    </FormControl>
                  </ProfileSection>
                </Grid>
                {/* Thông tin khách hàng và địa chỉ */}
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
                          Thông Tin Cá Nhân
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <label>Họ và tên</label>
                            <TextField
                              name="tenKhachHang"
                              value={khachHang.tenKhachHang}
                              onChange={handleKhachHangChange}
                              fullWidth
                              size="small"
                              sx={{ mb: 2 }}
                              error={!!errors.tenKhachHang}
                              helperText={errors.tenKhachHang}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <label>Mã khách hàng</label>
                            <TextField
                              name="maKhachHang"
                              value={khachHang.maKhachHang}
                              onChange={handleKhachHangChange}
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
                              value={khachHang.ngaySinh}
                              onChange={handleDateChange}
                              fullWidth
                              size="small"
                              sx={{ mb: 2 }}
                              InputLabelProps={{ shrink: true }}
                              error={!!errors.ngaySinh}
                              helperText={errors.ngaySinh}
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
                              value={khachHang.sdt}
                              onChange={handleKhachHangChange}
                              fullWidth
                              size="small"
                              sx={{ mb: 2 }}
                              error={!!errors.sdt}
                              helperText={errors.sdt}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <label>Email</label>
                            <TextField
                              name="email"
                              value={khachHang.email}
                              onChange={handleKhachHangChange}
                              fullWidth
                              size="small"
                              sx={{ mb: 2 }}
                              error={!!errors.email}
                              helperText={errors.email}
                            />
                          </Grid>
                        </Grid>
                      </InfoCard>
                    </Grid>
                    <Grid item xs={12}>
                      <InfoCard>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: "#1769aa", mb: 3 }}>
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
                                clearError("tinhThanhPho");
                              }}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  size="small"
                                  sx={{ mb: 2 }}
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
                                clearError("quanHuyen");
                              }}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  size="small"
                                  sx={{ mb: 2 }}
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
                                clearError("xaPhuong");
                              }}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  size="small"
                                  sx={{ mb: 2 }}
                                  error={!!errors.xaPhuong}
                                  helperText={errors.xaPhuong}
                                />
                              )}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <label>Địa chỉ chi tiết</label>
                            <TextField
                              name="diaChiChiTiet"
                              value={diaChiChiTiet}
                              onChange={(e) => {
                                setDiaChiChiTiet(e.target.value);
                                clearError("diaChiChiTiet");
                              }}
                              fullWidth
                              size="small"
                              sx={{ mb: 2 }}
                              error={!!errors.diaChiChiTiet}
                              helperText={errors.diaChiChiTiet}
                              placeholder="Số nhà, tên đường..."
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
                          onClick={() => navigate(-1)}
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
                          {loading ? "Đang lưu..." : success ? "Thành công!" : "Thêm khách hàng"}
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
