import React, { useEffect, useState } from "react";
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, IconButton, CircularProgress,
    MenuItem, Tooltip, Chip, FormControl, Select, Paper, Autocomplete, TextField, Grid
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import AddIcon from "@mui/icons-material/Add";
import PlaceIcon from "@mui/icons-material/Place";
import CloseIcon from "@mui/icons-material/Close";
import { MapPin, X, Plus } from "lucide-react";
import { toast } from "react-toastify";
import PropTypes from "prop-types";
import axios from "axios";
import { styled } from "@mui/material/styles";

const SOFT_PRIMARY = "#2563eb";
const SOFT_BG = "#f8fafc";
const SOFT_BORDER = "#e5e7eb";
const SOFT_GREEN = "#22c55e";
const SOFT_BADGE_TEXT = "#fff";
const SOFT_CARD_SHADOW = "0 1px 0 0 #dbeafe";
const API_BASE_URL = "http://localhost:8080";
const GHN_API_BASE_URL = "https://online-gateway.ghn.vn/shiip/public-api/master-data";
const GHN_API_TOKEN = "03b71be1-6891-11f0-9e03-7626358ab3e0"; // Replace with your token
const GHN_API_CONFIG = { headers: { token: GHN_API_TOKEN } };

const GreenBadge = styled(Chip)(({ theme }) => ({
    background: SOFT_GREEN,
    color: SOFT_BADGE_TEXT,
    fontWeight: 700,
    fontSize: 12,
    height: 22,
    minWidth: 0,
    display: "flex",
    alignItems: "center",
    gap: 4,
    paddingLeft: 6,
    paddingRight: 6,
    ".MuiChip-icon": {
        fontSize: 15,
        marginRight: 3
    }
}));

const SmallActionIconButton = styled(IconButton)(({ theme }) => ({
    border: "none",
    borderRadius: 6,
    background: "none",
    padding: 5,
    fontSize: 18,
    color: theme.palette.action.active,
    marginLeft: 8,
    marginRight: 0,
    transition: "background 0.15s, color 0.15s",
    "&:hover": {
        background: "none",
        color: SOFT_PRIMARY,
        boxShadow: `0 0 0 2px ${SOFT_PRIMARY}33`
    },
    "&:first-of-type": {
        marginLeft: 0
    },
    "&.set-default:hover": {
        color: "#16a34a",
        boxShadow: `0 0 0 2px #16a34a33`
    },
    "&.edit:hover": {
        color: "#f59e0b",
        boxShadow: `0 0 0 2px #f59e0b33`
    },
    "&.delete:hover": {
        color: "#ef4444",
        boxShadow: `0 0 0 2px #ef444433`
    }
}));

const AnimatedCard = styled(Paper)(({ theme }) => ({
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxShadow: "none",
    border: `1.5px solid ${SOFT_BORDER}`,
    background: "#fff",
    borderRadius: 8,
    padding: "14px 18px",
    marginBottom: 10,
    cursor: "pointer", // Thêm cursor pointer để hiển thị rằng có thể click
    "&.fade-in": {
        animation: "fadeIn 0.5s"
    },
    "&:hover": {
        borderColor: SOFT_PRIMARY,
        boxShadow: SOFT_CARD_SHADOW
    },
    "@keyframes fadeIn": {
        from: { opacity: 0, transform: "translateY(20px)" },
        to: { opacity: 1, transform: "none" }
    }
}));

const AddAddressButton = styled(Button)(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    height: "2.25rem",
    padding: "0 0.75rem",
    borderRadius: "0.375rem",
    backgroundColor: "hsl(210, 100%, 47%)",
    color: "hsl(0, 0%, 100%)",
    fontSize: "0.875rem",
    fontWeight: 500,
    textTransform: "none",
    whiteSpace: "nowrap",
    transition: "color 0.15s, box-shadow 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
    cursor: "pointer",
    border: "0",
    boxShadow: "none",
    "&:hover": {
        backgroundColor: "hsl(210, 100%, 47%)",
        boxShadow: "0 0 0 4px rgba(37, 99, 235, 0.15)",
        filter: "none",
        transform: "none"
    }
}));

function AddressFormSection({ open, onClose, onSubmit, initialData, isEdit }) {
    const [form, setForm] = useState({
        tinhThanhPho: "",
        xaPhuong: "",
        trangThai: 0
    });
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);

    // State for selected values in the form
    const [selectedProvince, setSelectedProvince] = useState(null);
    const [selectedDistrict, setSelectedDistrict] = useState(null);
    const [selectedWard, setSelectedWard] = useState(null);
    const [diaChiCuThe, setDiaChiCuThe] = useState("");
    const [isDefault, setIsDefault] = useState(false);

    // UI State
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (open) {
            const fetchProvinces = async () => {
                try {
                    const res = await axios.get(`${GHN_API_BASE_URL}/province`, GHN_API_CONFIG);
                    setProvinces(res.data?.data || []);
                } catch (error) { toast.error("Lỗi khi tải danh sách Tỉnh/Thành"); }
            };
            fetchProvinces();
        }
    }, [open]);

    // 2. Fetch districts when a province is selected
    useEffect(() => {
        if (selectedProvince) {
            const fetchDistricts = async () => {
                try {
                    const res = await axios.get(`${GHN_API_BASE_URL}/district?province_id=${selectedProvince.ProvinceID}`, GHN_API_CONFIG);
                    setDistricts(res.data?.data || []);
                } catch (error) { toast.error("Lỗi khi tải danh sách Quận/Huyện"); }
            };
            fetchDistricts();
        }
        setDistricts([]);
        setWards([]);
        setSelectedDistrict(null);
        setSelectedWard(null);
    }, [selectedProvince]);

    useEffect(() => {
        if (selectedDistrict) {
            const fetchWards = async () => {
                try {
                    const res = await axios.get(`${GHN_API_BASE_URL}/ward?district_id=${selectedDistrict.DistrictID}`, GHN_API_CONFIG);
                    setWards(res.data?.data || []);
                } catch (error) { toast.error("Lỗi khi tải danh sách Phường/Xã"); }
            };
            fetchWards();
        }
        setWards([]);
        setSelectedWard(null);
    }, [selectedDistrict]);
    useEffect(() => {
        if (open && isEdit && initialData && provinces.length > 0) {
            const province = provinces.find(p => p.ProvinceName === initialData.tinhThanhPho);
            if (province) setSelectedProvince(province);
              setDiaChiCuThe(initialData.diaChiCuThe || ""); 
            setIsDefault(initialData.trangThai === 1);
        } else if (open && !isEdit) {
            // Reset form when opening in "add new" mode
            setSelectedProvince(null);
            setSelectedDistrict(null);
            setSelectedWard(null);
            setDiaChiCuThe("");
            setIsDefault(false);
            setErrors({});
        }
    }, [open, isEdit, initialData, provinces]);

    const labelStyle = {
        fontWeight: 600,
        color: "#1769aa",
        mb: 0.5,
        fontSize: 15,
        display: "block"
    };

    const validate = () => {
        const newErrors = {};
        if (!selectedProvince) newErrors.province = "Vui lòng chọn Tỉnh/Thành phố";
        if (!selectedDistrict) newErrors.district = "Vui lòng chọn Quận/Huyện";
        if (!selectedWard) newErrors.ward = "Vui lòng chọn Phường/Xã";
 if (!diaChiCuThe.trim()) newErrors.diaChiCuThe = "Vui lòng nhập địa chỉ cụ thể"; // Dòng code thêm vào
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateBeforeSubmit = () => {
        const validationError = validate();
        if (validationError) {
            toast.error(validationError);
            return false;
        }
        return true;
    };

    function getProvinceNameById(id) {
        const found = provinces.find((p) => String(p.id) === String(id));
        return found ? found.province : "";
    }
    function getWardNameById(name) {
        const found = wards.find((w) => w.name === name);
        return found ? found.name : name;
    }

    const handleSubmit = async () => {
        if (!validate()) {
            toast.error("Vui lòng điền đầy đủ thông tin địa chỉ.");
            return;
        }
        setLoading(true);
        const submitData = {
            tinhThanhPho: selectedProvince.ProvinceName,
            quanHuyen: selectedDistrict.DistrictName,
            xaPhuong: selectedWard.WardName,
             diaChiCuThe: diaChiCuThe.trim(), 
            trangThai: isDefault ? 1 : 0,
        };
        if (isEdit && initialData?.id) {
            submitData.id = initialData.id;
        }
        await onSubmit(submitData);
        setLoading(false);
    };
    if (!open) return null;

    return (
        <AnimatedCard elevation={3} className="fade-in" sx={{ mt: 2, p: 3, borderColor: "primary.main" }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={700}>{isEdit ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ mới"}</Typography>
                <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
            </Box>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <Autocomplete options={provinces} getOptionLabel={(o) => o.ProvinceName || ""} value={selectedProvince} isOptionEqualToValue={(option, value) => option.ProvinceID === value.ProvinceID} onChange={(e, v) => setSelectedProvince(v)} renderInput={(params) => <TextField {...params} label="Tỉnh/Thành phố" fullWidth error={!!errors.province} helperText={errors.province} />} />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Autocomplete options={districts} getOptionLabel={(o) => o.DistrictName || ""} value={selectedDistrict} disabled={!selectedProvince} isOptionEqualToValue={(option, value) => option.DistrictID === value.DistrictID} onChange={(e, v) => setSelectedDistrict(v)} renderInput={(params) => <TextField {...params} label="Quận/Huyện" fullWidth error={!!errors.district} helperText={errors.district} />} />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Autocomplete options={wards} getOptionLabel={(o) => o.WardName || ""} value={selectedWard} disabled={!selectedDistrict} isOptionEqualToValue={(option, value) => option.WardCode === value.WardCode} onChange={(e, v) => setSelectedWard(v)} renderInput={(params) => <TextField {...params} label="Phường/Xã" fullWidth error={!!errors.ward} helperText={errors.ward} />} />
                </Grid>
 <Grid item xs={12}>
                    <TextField
                        label="Địa chỉ chi tiết (Số nhà, tên đường)"
                        fullWidth
                        value={diaChiCuThe}
                        onChange={(e) => setDiaChiCuThe(e.target.value)}
                        error={!!errors.diaChiCuThe}
                        helperText={errors.diaChiCuThe}
                    />
                </Grid>
            </Grid>
            {!isEdit && (
                <Box display="flex" alignItems="center" gap={1} mt={2}>
                    <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} id="default-address-checkbox" style={{ cursor: 'pointer' }} />
                    <label htmlFor="default-address-checkbox" style={{ fontWeight: 500, color: "#1976d2", cursor: "pointer" }}>
                        Đặt làm địa chỉ mặc định
                    </label>
                </Box>
            )}
            <Box display="flex" gap={2} mt={3}>
                <Button onClick={handleSubmit} variant="contained" color="primary" disabled={loading}>{loading ? <CircularProgress size={24} /> : (isEdit ? "Cập nhật" : "Lưu")}</Button>
                <Button onClick={onClose} variant="outlined">Hủy</Button>
            </Box>
        </AnimatedCard>
    );
}

AddressFormSection.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    initialData: PropTypes.shape({
        tinhThanhPho: PropTypes.string,
        xaPhuong: PropTypes.string,
         diaChiCuThe: PropTypes.string,
        trangThai: PropTypes.number,
        id: PropTypes.number
    }),
    isEdit: PropTypes.bool
};

function AddressDialogClient({ customerId, open, onClose, onAddressSelect }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [selectDefaultId, setSelectDefaultId] = useState(null);
    const [formSectionOpen, setFormSectionOpen] = useState(false);
    const [formSectionEdit, setFormSectionEdit] = useState(false);
    const [formSectionData, setFormSectionData] = useState(null);
    const [customerInfo, setCustomerInfo] = useState(null);
    const [addresses, setAddresses] = useState([]);
    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        type: null,
        title: "",
        message: "",
        confirmText: "",
        cancelText: "",
        confirmColor: "primary",
        addressId: null,
        addressData: null
    });

    useEffect(() => {
        if (open && customerId) initialize();
        // eslint-disable-next-line
    }, [open, customerId]);
 console.log("State 'addresses' TRƯỚC KHI RENDER:", addresses);
    const chonDiaChi = async (address) => {
        console.log('Địa chỉ được chọn:', address);

        // Gọi callback function để truyền địa chỉ được chọn về component cha
        if (onAddressSelect) {
            onAddressSelect(address);
        }

        // Đóng modal
        onClose();
    };

    const initialize = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_BASE_URL}/khachHang/${customerId}`, { withCredentials: true });
            const customerRes = response?.data?.data || response?.data;
             console.log("Dữ liệu địa chỉ nhận được KHI MỞ DIALOG:", customerRes?.diaChis);
            setCustomerInfo(customerRes);
            setAddresses(sortAddressesWithDefaultFirst(customerRes?.diaChis || []));
        } catch (e) {
            toast.error("Không thể tải thông tin khách hàng hoặc danh sách địa chỉ.");
        } finally {
            setLoading(false);
        }
    };

    const sortAddressesWithDefaultFirst = (addressesArr) => {
        return [...addressesArr].sort((a, b) => {
            if (a.trangThai === 1 && b.trangThai !== 1) return -1;
            if (a.trangThai !== 1 && b.trangThai === 1) return 1;
            return 0;
        });
    };

    const fetchAddressesCustomer = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${API_BASE_URL}/khachHang/${customerId}/diaChis`, { withCredentials: true });
             console.log("Dữ liệu địa chỉ nhận được từ API:", res.data.data);
            setAddresses(sortAddressesWithDefaultFirst(res.data.data || []));
        } catch (e) {
            toast.error("Không thể tải danh sách địa chỉ của khách hàng.");
        } finally {
            setLoading(false);
        }
    };

    const handleSetDefault = async (addressId) => {
        try {
            await axios.patch(`${API_BASE_URL}/khachHang/${customerId}/diaChi/${addressId}/setDefault`, null, { withCredentials: true });
            toast.success("Thiết lập địa chỉ mặc định thành công!");
            fetchAddressesCustomer();
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Không thể thiết lập địa chỉ mặc định.";
            toast.error(errorMessage);
        }
    };

    const openSetDefaultConfirm = (address) => {
        setConfirmDialog({
            open: true,
            type: "setDefault",
            title: "Xác nhận thiết lập địa chỉ mặc định",
            message: `Bạn có chắc chắn muốn thiết lập địa chỉ "${address.tinhThanhPho}, ${address.xaPhuong}" làm địa chỉ mặc định? Địa chỉ mặc định hiện tại sẽ được chuyển thành địa chỉ phụ.`,
            confirmText: "Thiết lập mặc định",
            cancelText: "Hủy bỏ",
            confirmColor: "primary",
            addressId: address.id,
            addressData: address
        });
    };

    const openDeleteConfirm = (address) => {
         const fullAddress = `${address.diaChiCuThe}, ${address.xaPhuong}, ${address.quanHuyen}, ${address.tinhThanhPho}`;
        if (addresses.length === 1) {
            setConfirmDialog({
                open: true,
                type: "delete",
                title: "Xác nhận xóa địa chỉ",
                message: `Bạn có chắc chắn muốn xóa địa chỉ "${fullAddress}"? Đây là địa chỉ duy nhất của khách hàng.`,
                confirmText: "Xóa địa chỉ",
                cancelText: "Hủy bỏ",
                confirmColor: "error",
                addressId: address.id,
                addressData: address
            });
        } else if (address.trangThai === 1) {
            setConfirmDelete({ addressId: address.id, isDefault: true });
        } else {
            setConfirmDialog({
                open: true,
                type: "delete",
                title: "Xác nhận xóa địa chỉ",
                message: `Bạn có chắc chắn muốn xóa địa chỉ "${address.tinhThanhPho}, ${address.xaPhuong}"?`,
                confirmText: "Xóa địa chỉ",
                cancelText: "Hủy bỏ",
                confirmColor: "error",
                addressId: address.id,
                addressData: address
            });
        }
    };

    const handleConfirmAction = () => {
        const { type, addressId } = confirmDialog;
        switch (type) {
            case "setDefault":
                closeConfirmDialog();
                handleSetDefault(addressId);
                break;
            case "delete":
                closeConfirmDialog();
                doDelete(addressId);
                break;
            default:
                closeConfirmDialog();
        }
    };

    const closeConfirmDialog = () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
    };

    const handleEdit = (address) => {
        setFormSectionOpen(true);
        setFormSectionEdit(true);
        setFormSectionData(address);
    };

    const handleEditAddress = async (data) => {
        try {
            await axios.patch(`${API_BASE_URL}/khachHang/${customerId}/diaChi/${data.id}`, data, { withCredentials: true });
            toast.success("Cập nhật địa chỉ thành công!");
            fetchAddressesCustomer();
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Không thể cập nhật địa chỉ.";
            toast.error(errorMessage);
        }
    };

    const doDelete = async (addressId, newDefaultId) => {
        try {
            if (newDefaultId) {
                await axios.patch(`${API_BASE_URL}/khachHang/${customerId}/diaChi/${newDefaultId}/setDefault`, null, { withCredentials: true });
            }
            await axios.delete(`${API_BASE_URL}/khachHang/${customerId}/diaChi/${addressId}`, { withCredentials: true });
            setConfirmDelete(null);
            setSelectDefaultId(null);
            toast.success("Xóa địa chỉ thành công!");
            fetchAddressesCustomer();
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Không thể xóa địa chỉ.";
            toast.error(errorMessage);
            setConfirmDelete(null);
            setSelectDefaultId(null);
        }
    };

    const handleAddAddress = async (data) => {
        try {
            await axios.post(`${API_BASE_URL}/khachHang/${customerId}/diaChi`, data, { withCredentials: true });
            toast.success("Thêm địa chỉ thành công!");
            fetchAddressesCustomer();
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Không thể thêm địa chỉ.";
            toast.error(errorMessage);
        }
    };

    const handleAddClick = () => {
        setFormSectionOpen(true);
        setFormSectionEdit(false);
        setFormSectionData(null);
    };

    const handleFormClose = () => {
        setFormSectionOpen(false);
        setFormSectionEdit(false);
        setFormSectionData(null);
    };

    // Hàm xử lý sự kiện click trên card, ngăn chặn việc kích hoạt khi click vào các nút action
    const handleAddressCardClick = (address, event) => {
        // Kiểm tra xem click có phải trên button action không
        const isActionButton = event.target.closest('.MuiIconButton-root');
        const isTooltip = event.target.closest('.MuiTooltip-tooltip');

        if (!isActionButton && !isTooltip) {
            chonDiaChi(address);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginBottom: "1rem",
                        gap: "0.375rem",
                        textAlign: { xs: "center", sm: "left" },
                        fontFamily:
                            'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
                        color: "hsl(222.2, 84%, 4.9%)"
                    }}
                >
                    <Typography
                        variant="h2"
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            fontSize: "1.25rem",
                            fontWeight: 600,
                            letterSpacing: "-0.025em",
                            color: "hsl(222.2, 84%, 4.9%)",
                            fontFamily: "ui-sans-serif, system-ui, sans-serif"
                        }}
                    >
                        <MapPin
                            size={20}
                            color="hsl(210, 100%, 47%)"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            fill="none"
                            style={{ marginRight: "0.5rem" }}
                        />
                        Danh sách địa chỉ của {customerInfo?.tenKhachHang} (Mã KH: {customerInfo?.maKhachHang})
                    </Typography>
                    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                        <IconButton
                            onClick={onClose}
                            aria-label="Đóng"
                            sx={{
                                width: 28,
                                height: 28,
                                padding: "2px",
                                opacity: 0.7,
                                transition: "opacity 0.2s, box-shadow 0.2s, border-color 0.2s",
                                border: "2px solid transparent",
                                borderRadius: "8px",
                                boxShadow: "none",
                                "&:hover": {
                                    opacity: 1
                                },
                                "&:focus-visible, &:active": {
                                    borderColor: "#2563eb",
                                    boxShadow: "0 0 0 0px #2563eb",
                                    outline: "none",
                                    opacity: 1,
                                    backgroundColor: "#f8fafc"
                                }
                            }}
                            tabIndex={0}
                        >
                            <X size={15} color="#2563eb" />
                        </IconButton>
                    </Box>
                </Box>
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 2,
                        fontFamily: "ui-sans-serif, system-ui, sans-serif",
                        color: "hsl(222.2, 84%, 4.9%)"
                    }}
                >
                    <Typography
                        variant="h3"
                        sx={{
                            fontFamily:
                                'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
                            fontWeight: 500,
                            fontSize: "1.125rem",
                            lineHeight: "1.75rem",
                            color: "hsl(222.2, 84%, 4.9%)",
                            margin: 0
                        }}
                    >
                        Địa chỉ ({addresses.length}/5) - Click để chọn địa chỉ
                    </Typography>
                    <AddAddressButton
                        onClick={handleAddClick}
                        startIcon={<Plus size={16} />}
                        disabled={addresses.length >= 5}
                    >
                        Thêm địa chỉ
                    </AddAddressButton>
                </Box>
                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight={120}>
                        <CircularProgress color="primary" size={28} />
                        <Typography ml={2} color={SOFT_PRIMARY} fontSize={15}>
                            Đang tải...
                        </Typography>
                    </Box>
                ) : error ? (
                    <Typography color="error">{error}</Typography>
                ) : addresses.length === 0 ? (
                    <AnimatedCard
                        elevation={0}
                        className="fade-in"
                        sx={{
                            border: `2px dashed ${SOFT_PRIMARY}`,
                            background: SOFT_BG,
                            p: 5,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center"
                        }}
                    >
                        <PlaceIcon sx={{ fontSize: 48, color: SOFT_PRIMARY, mb: 2 }} />
                        <Typography color="text.secondary" fontSize={16} textAlign="center">
                            Chưa có địa chỉ nào. Nhấn Thêm địa chỉ để bắt đầu.
                        </Typography>
                    </AnimatedCard>
                ) : (
                    <Box display="flex" flexDirection="column" gap={1.5} mt={1}>
                        {addresses.map((address, idx) => (
                            <AnimatedCard
                                onClick={(event) => handleAddressCardClick(address, event)}
                                key={address.id}
                                elevation={address.trangThai === 1 ? 3 : 0}
                                className="fade-in"
                                sx={{
                                    border:
                                        address.trangThai === 1
                                            ? `1.5px solid #16a34a`
                                            : `1.5px solid #e2e8f0`,
                                    background: address.trangThai === 1 ? "#f0fdf4" : "#fff",
                                    transition: "all 0.2s ease-in-out",
                                    "&:hover": {
                                        transform: "translateY(-2px)",
                                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)"
                                    }
                                }}
                            >
                                <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Typography
                                            fontWeight={700}
                                            fontSize={13.5}
                                            color={address.trangThai === 1 ? "#16a34a" : "#333"}
                                        >
                                            Địa chỉ {idx + 1}
                                        </Typography>
                                        {address.trangThai === 1 && (
                                            <GreenBadge
                                                icon={<StarIcon sx={{ fontSize: 14, color: "#16a34a", mr: 0.5 }} />}
                                                label="Mặc định"
                                                color="primary"
                                                size="small"
                                                sx={{ ml: 1 }}
                                            />
                                        )}
                                    </Box>
                                    <Box display="flex" alignItems="center" gap={1.5}>
                                        {address.trangThai !== 1 && (
                                            <Tooltip title="Đặt làm mặc định">
                                                <span>
                                                    <SmallActionIconButton
                                                        edge="end"
                                                        color="primary"
                                                        aria-label="Đặt làm mặc định"
                                                        onClick={() => openSetDefaultConfirm(address)}
                                                        className="set-default"
                                                    >
                                                        <StarBorderIcon sx={{ fontSize: 17 }} />
                                                    </SmallActionIconButton>
                                                </span>
                                            </Tooltip>
                                        )}
                                        <Tooltip title="Chỉnh sửa">
                                            <SmallActionIconButton
                                                edge="end"
                                                aria-label="Chỉnh sửa"
                                                className="edit"
                                                onClick={() => handleEdit(address)}
                                            >
                                                <EditOutlinedIcon sx={{ fontSize: 17 }} />
                                            </SmallActionIconButton>
                                        </Tooltip>
                                        <Tooltip title="Xóa địa chỉ">
                                            <SmallActionIconButton
                                                edge="end"
                                                color="error"
                                                aria-label="Xóa"
                                                className="delete"
                                                onClick={() => openDeleteConfirm(address)}
                                            >
                                                <DeleteIcon sx={{ fontSize: 17 }} />
                                            </SmallActionIconButton>
                                        </Tooltip>
                                    </Box>
                                </Box>
                                <Typography fontWeight={600} fontSize={15.5} color="#333">
                                     {`${address.diaChiCuThe}, ${address.xaPhuong}, ${address.quanHuyen}, ${address.tinhThanhPho}`}
                                </Typography>
                            </AnimatedCard>
                        ))}
                    </Box>
                )}
                <AddressFormSection
                    open={formSectionOpen}
                    onClose={handleFormClose}
                    onSubmit={formSectionEdit ? handleEditAddress : handleAddAddress}
                    initialData={formSectionData}
                    isEdit={formSectionEdit}
                />
            </DialogContent>
            {confirmDelete && confirmDelete.isDefault && addresses.length > 1 && (
                <Dialog open onClose={() => setConfirmDelete(null)} maxWidth="sm" fullWidth>
                    <DialogTitle
                        sx={{
                            color: "#d32f2f",
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: 1
                        }}
                    >
                        <DeleteIcon sx={{ fontSize: 24 }} />
                        Xác nhận xóa địa chỉ mặc định
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="body1" sx={{ mb: 2, color: "#666" }}>
                                Bạn đang xóa địa chỉ mặc định. Vui lòng chọn một địa chỉ khác làm địa chỉ mặc định trước khi xóa.
                            </Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#d32f2f", mb: 1 }}>
                                Địa chỉ sẽ bị xóa:
                            </Typography>
                            <Paper sx={{ p: 2, bgcolor: "#fff3e0", border: "1px solid #ffb74d", borderRadius: 2 }}>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {addresses.find((a) => a.id === confirmDelete.addressId)?.tinhThanhPho},{" "}
                                    {addresses.find((a) => a.id === confirmDelete.addressId)?.xaPhuong}
                                </Typography>
                            </Paper>
                        </Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#1976d2", mb: 2 }}>
                            Chọn địa chỉ mới làm mặc định:
                        </Typography>
                        <Box sx={{ maxHeight: 250, overflowY: "auto" }}>
                            {addresses
                                .filter((a) => a.id !== confirmDelete.addressId)
                                .map((address, index) => (
                                    <Paper
                                        key={address.id}
                                        sx={{
                                            p: 1.5,
                                            mb: 1,
                                            cursor: "pointer",
                                            border: selectDefaultId === address.id ? "2px solid #1976d2" : "1px solid #e0e0e0",
                                            bgcolor: selectDefaultId === address.id ? "#e3f2fd" : "#fff",
                                            transition: "all 0.2s",
                                            "&:hover": {
                                                borderColor: "#1976d2",
                                                bgcolor: selectDefaultId === address.id ? "#e3f2fd" : "#f5f5f5"
                                            }
                                        }}
                                        onClick={() => setSelectDefaultId(address.id)}
                                    >
                                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 600, color: "#333" }}>
                                                    Địa chỉ {index + 1}
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: "#666", mt: 0.5, fontSize: "0.875rem" }}>
                                                     {address.diaChiCuThe}, {address.xaPhuong}, {address.quanHuyen}, {address.tinhThanhPho}
                                                </Typography>
                                            </Box>
                                            {selectDefaultId === address.id && (
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, ml: 1 }}>
                                                    <StarIcon sx={{ fontSize: 18, color: "#1976d2" }} />
                                                    <Typography
                                                        variant="caption"
                                                        sx={{ color: "#1976d2", fontWeight: 600, fontSize: "0.75rem" }}
                                                    >
                                                        Mặc định
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    </Paper>
                                ))}
                        </Box>
                        {!selectDefaultId && (
                            <Typography variant="caption" sx={{ color: "#d32f2f", mt: 1, display: "block" }}>
                                ⚠️ Vui lòng chọn một địa chỉ làm mặc định
                            </Typography>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ p: 2, gap: 1 }}>
                        <Button
                            onClick={() => {
                                setConfirmDelete(null);
                                setSelectDefaultId(null);
                            }}
                            variant="outlined"
                            sx={{
                                minWidth: 80,
                                fontWeight: 600,
                                borderColor: "#bdbdbd",
                                color: "#757575",
                                "&:hover": {
                                    borderColor: "#9e9e9e",
                                    backgroundColor: "#f5f5f5"
                                }
                            }}
                        >
                            Hủy bỏ
                        </Button>
                        <Button
                            onClick={() => doDelete(confirmDelete.addressId, selectDefaultId)}
                            disabled={!selectDefaultId}
                            variant="contained"
                            color="error"
                            startIcon={<DeleteIcon />}
                            sx={{ minWidth: 160, fontWeight: 600 }}
                        >
                            Xóa & Thiết lập mặc định
                        </Button>
                    </DialogActions>
                </Dialog>
            )}
            {confirmDelete && !confirmDelete.isDefault && (
                <Dialog open onClose={() => setConfirmDelete(null)}>
                    <DialogTitle>Xác nhận xóa địa chỉ</DialogTitle>
                    <DialogContent>
                        <Typography>Bạn có chắc chắn muốn xóa địa chỉ này?</Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button
                            onClick={() => setConfirmDelete(null)}
                            variant="outlined"
                            sx={{
                                fontWeight: 600,
                                borderColor: "#bdbdbd",
                                color: "#757575",
                                "&:hover": {
                                    borderColor: "#9e9e9e",
                                    backgroundColor: "#f5f5f5"
                                }
                            }}
                        >
                            Hủy bỏ
                        </Button>
                        <Button
                            onClick={() => doDelete(confirmDelete.addressId)}
                            color="error"
                            variant="contained"
                            sx={{ fontWeight: 600 }}
                        >
                            Xóa
                        </Button>
                    </DialogActions>
                </Dialog>
            )}
            {confirmDialog.open && (
                <Dialog open onClose={closeConfirmDialog} maxWidth="sm" fullWidth>
                    <DialogTitle
                        sx={{
                            color: confirmDialog.confirmColor === "error" ? "#d32f2f" : "#1976d2",
                            fontWeight: 600
                        }}
                    >
                        {confirmDialog.title}
                    </DialogTitle>
                    <DialogContent>
                        <Typography sx={{ whiteSpace: "pre-line", lineHeight: 1.6 }}>
                            {confirmDialog.message}
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ p: 2, gap: 1 }}>
                        <Button
                            onClick={closeConfirmDialog}
                            variant="outlined"
                            sx={{
                                minWidth: 100,
                                fontWeight: 600,
                                borderColor: "#bdbdbd",
                                color: "#757575",
                                "&:hover": {
                                    borderColor: "#9e9e9e",
                                    backgroundColor: "#f5f5f5"
                                }
                            }}
                        >
                            {confirmDialog.cancelText}
                        </Button>
                        <Button
                            onClick={handleConfirmAction}
                            variant="contained"
                            color={confirmDialog.confirmColor}
                            sx={{ minWidth: 120, fontWeight: 600 }}
                        >
                            {confirmDialog.confirmText}
                        </Button>
                    </DialogActions>
                </Dialog>
            )}
        </Dialog>
    );
}

AddressDialogClient.propTypes = {
  customerId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onAddressSelect: PropTypes.func // Prop mới
};
export default AddressDialogClient;