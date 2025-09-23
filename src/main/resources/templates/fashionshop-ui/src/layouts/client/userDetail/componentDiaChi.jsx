import React, { useEffect, useState } from "react";
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, IconButton, CircularProgress,
    Tooltip, Chip, Paper, Autocomplete, TextField, Grid
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import PlaceIcon from "@mui/icons-material/Place";
import CloseIcon from "@mui/icons-material/Close";
import { MapPin, Plus } from "lucide-react";
import { toast } from "react-toastify";
import PropTypes from "prop-types";
import axios from "axios";
import { styled } from "@mui/material/styles";

// --- Style Constants ---
const SOFT_PRIMARY = "#2563eb";
const SOFT_BG_GRADIENT = "linear-gradient(120deg, #f4f8fe 80%, #e0e7ef 100%)";
const SOFT_BORDER = "#e0e7ef";
const SOFT_GREEN = "#22c55e";
const SOFT_BADGE_TEXT = "#fff";
const SOFT_CARD_SHADOW = "0 8px 32px #2563eb1a";
const API_BASE_URL = "http://localhost:8080";
const GHN_API_BASE_URL = "https://online-gateway.ghn.vn/shiip/public-api/master-data";
const GHN_API_TOKEN = "03b71be1-6891-11f0-9e03-7626358ab3e0";
const GHN_API_CONFIG = { headers: { token: GHN_API_TOKEN } };

// --- Styled Components ---
const GreenBadge = styled(Chip)({
    background: SOFT_GREEN,
    color: SOFT_BADGE_TEXT,
    fontWeight: 700,
    fontSize: 13,
    height: 24,
    minWidth: 0,
    display: "flex",
    alignItems: "center",
    gap: 4,
    paddingLeft: 8,
    paddingRight: 8,
    boxShadow: "0 2px 8px #22c55e33"
});

const SmallActionIconButton = styled(IconButton)(({ theme }) => ({
    borderRadius: 10,
    background: SOFT_BG_GRADIENT,
    padding: 8,
    fontSize: 20,
    color: theme.palette.action.active,
    marginLeft: 10,
    boxShadow: "0 2px 8px #2563eb12",
    transition: "background 0.18s, color 0.18s, box-shadow 0.18s",
    "&:hover": {
        background: "#2563eb12",
        color: SOFT_PRIMARY,
        boxShadow: `0 0 0 4px ${SOFT_PRIMARY}33`
    },
    "&.set-default:hover": {
        color: SOFT_GREEN,
        boxShadow: `0 0 0 4px #16a34a33`
    },
    "&.edit:hover": {
        color: "#f59e0b",
        boxShadow: `0 0 0 4px #f59e0b33`
    },
    "&.delete:hover": {
        color: "#ef4444",
        boxShadow: `0 0 0 4px #ef444433`
    }
}));

const AnimatedCard = styled(Paper)(({ theme }) => ({
    transition: "border-color 0.25s, box-shadow 0.25s, background 0.25s",
    boxShadow: SOFT_CARD_SHADOW,
    border: `2px solid ${SOFT_BORDER}`,
    background: "rgba(255,255,255,0.97)",
    borderRadius: 18,
    padding: "20px 28px",
    marginBottom: 18,
    "&.fade-in": {
        animation: "fadeIn 0.48s"
    },
    "&:hover": {
        borderColor: SOFT_PRIMARY,
        background: "linear-gradient(90deg,#f4f8fe 80%,#e0e7ef 100%)"
    },
    "@keyframes fadeIn": {
        from: { opacity: 0, transform: "translateY(20px)" },
        to: { opacity: 1, transform: "none" }
    }
}));

const AddAddressButton = styled(Button)({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.7rem",
    height: "2.7rem",
    padding: "0 1.15rem",
    borderRadius: "0.65rem",
    background: "linear-gradient(90deg,#2563eb 60%,#60a5fa 100%)",
    color: "#fff",
    fontSize: "1.05rem",
    fontWeight: 700,
    textTransform: "none",
    letterSpacing: "0.02em",
    transition: "all 0.18s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 2px 10px #2563eb1a",
    "&:hover": {
        background: "linear-gradient(90deg,#1744a3 60%,#2563eb 100%)",
        boxShadow: "0 0 0 4px #2563eb22"
    }
});

// --- Address Form Section ---
function AddressFormSection({ open, onClose, onSubmit, initialData, isEdit }) {
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);
    const [selectedProvince, setSelectedProvince] = useState(null);
    const [selectedDistrict, setSelectedDistrict] = useState(null);
    const [selectedWard, setSelectedWard] = useState(null);
    const [diaChiCuThe, setdiaChiCuThe] = useState("");
    const [isDefault, setIsDefault] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (open) {
            const fetchProvinces = async () => {
                try {
                    const res = await axios.get(`${GHN_API_BASE_URL}/province`, GHN_API_CONFIG);
                    setProvinces(res.data?.data || []);
                } catch {
                    toast.error("Lỗi khi tải danh sách Tỉnh/Thành");
                }
            };
            fetchProvinces();
        }
    }, [open]);

    useEffect(() => {
        if (selectedProvince) {
            const fetchDistricts = async () => {
                try {
                    const res = await axios.get(`${GHN_API_BASE_URL}/district?province_id=${selectedProvince.ProvinceID}`, GHN_API_CONFIG);
                    setDistricts(res.data?.data || []);
                } catch {
                    toast.error("Lỗi khi tải danh sách Quận/Huyện");
                }
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
                } catch {
                    toast.error("Lỗi khi tải danh sách Phường/Xã");
                }
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
            setdiaChiCuThe(initialData.diaChiCuThe || "");
            setIsDefault(initialData.trangThai === 1);
        } else if (open && !isEdit) {
            setSelectedProvince(null);
            setSelectedDistrict(null);
            setSelectedWard(null);
            setdiaChiCuThe("");
            setIsDefault(false);
            setErrors({});
        }
    }, [open, isEdit, initialData, provinces]);

    const validate = () => {
        const newErrors = {};
        if (!selectedProvince) newErrors.province = "Vui lòng chọn Tỉnh/Thành phố";
        if (!selectedDistrict) newErrors.district = "Vui lòng chọn Quận/Huyện";
        if (!selectedWard) newErrors.ward = "Vui lòng chọn Phường/Xã";
        if (!diaChiCuThe.trim()) newErrors.diaChiCuThe = "Vui lòng nhập địa chỉ cụ thể";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

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
            diaChiCuThe: diaChiCuThe,
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
        <AnimatedCard elevation={4} className="fade-in" sx={{ mt: 3, p: 3, borderColor: SOFT_PRIMARY }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={800} sx={{ color: SOFT_PRIMARY }}>
                    {isEdit ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ mới"}
                </Typography>
                <IconButton onClick={onClose} size="small" sx={{ color: SOFT_PRIMARY }}>
                    <CloseIcon />
                </IconButton>
            </Box>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <Autocomplete options={provinces} getOptionLabel={(o) => o.ProvinceName || ""} value={selectedProvince} isOptionEqualToValue={(option, value) => option.ProvinceID === value?.ProvinceID} onChange={(e, v) => setSelectedProvince(v)} renderInput={(params) => <TextField {...params} label="Tỉnh/Thành phố" fullWidth error={!!errors.province} helperText={errors.province} />} />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Autocomplete options={districts} getOptionLabel={(o) => o.DistrictName || ""} value={selectedDistrict} disabled={!selectedProvince} isOptionEqualToValue={(option, value) => option.DistrictID === value?.DistrictID} onChange={(e, v) => setSelectedDistrict(v)} renderInput={(params) => <TextField {...params} label="Quận/Huyện" fullWidth error={!!errors.district} helperText={errors.district} />} />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Autocomplete options={wards} getOptionLabel={(o) => o.WardName || ""} value={selectedWard} disabled={!selectedDistrict} isOptionEqualToValue={(option, value) => option.WardCode === value?.WardCode} onChange={(e, v) => setSelectedWard(v)} renderInput={(params) => <TextField {...params} label="Phường/Xã" fullWidth error={!!errors.ward} helperText={errors.ward} />} />
                </Grid>
                <Grid item xs={12}>
                    <TextField label="Địa chỉ cụ thể (Số nhà, tên đường)" fullWidth value={diaChiCuThe} onChange={(e) => setdiaChiCuThe(e.target.value)} error={!!errors.diaChiCuThe} helperText={errors.diaChiCuThe} />
                </Grid>
            </Grid>
            {!isEdit && (
                <Box display="flex" alignItems="center" gap={1.2} mt={2} ml={0.5}>
                    <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} id="default-address-checkbox" style={{ cursor: 'pointer', accentColor: SOFT_PRIMARY }} />
                    <label htmlFor="default-address-checkbox" style={{ fontWeight: 600, color: SOFT_PRIMARY, cursor: "pointer", fontSize: "1.1rem" }}>
                        Đặt làm địa chỉ mặc định
                    </label>
                </Box>
            )}
            <Box display="flex" gap={2} mt={3}>
                <Button onClick={handleSubmit} variant="contained" color="primary" disabled={loading} sx={{ minWidth: 110, fontWeight: 700 }}>
                    {loading ? <CircularProgress size={24} /> : (isEdit ? "Cập nhật" : "Lưu")}
                </Button>
                <Button onClick={onClose} variant="outlined" sx={{ minWidth: 80, fontWeight: 600 }}>Hủy</Button>
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
        diaChiCuThe: PropTypes.string,
        xaPhuong: PropTypes.string,
        trangThai: PropTypes.number,
        id: PropTypes.number
    }),
    isEdit: PropTypes.bool
};

// --- Main AddressManager Component ---
export default function AddressManager({ customerId }) {
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
        if (customerId) initialize();
    }, [customerId]);

    const initialize = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_BASE_URL}/khachHang/${customerId}`, { withCredentials: true });
            const customerRes = response?.data?.data || response?.data;
            setCustomerInfo(customerRes);
            setAddresses(sortAddressesWithDefaultFirst(customerRes?.diaChis || []));
        } catch {
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
            setAddresses(sortAddressesWithDefaultFirst(res.data.data || []));
        } catch {
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
        if (addresses.length === 1) {
            setConfirmDialog({
                open: true,
                type: "delete",
                title: "Xác nhận xóa địa chỉ",
                message: `Bạn có chắc chắn muốn xóa địa chỉ "${address.tinhThanhPho}, ${address.xaPhuong}"? Đây là địa chỉ duy nhất của khách hàng.`,
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

    // --- Render ---
    return (
        <Box sx={{
            maxWidth: "950px",
            width: "100%",
            margin: "0 auto",
            padding: { xs: "1.5rem", md: "2.5rem" },
            background: SOFT_BG_GRADIENT,
            // borderRadius: 34,
            boxShadow: "0 8px 38px #2563eb18"
        }}>
            {/* Header */}
            <Box sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: "1.5rem",
                gap: "0.375rem",
                alignItems: "center"
            }}>
                <Typography
                    variant="h2"
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.8rem",
                        fontSize: { xs: "1.15rem", md: "1.45rem" },
                        fontWeight: 900,
                        letterSpacing: "-0.04em",
                        color: SOFT_PRIMARY,
                        fontFamily: "ui-sans-serif, system-ui, sans-serif"
                    }}
                >
                    <MapPin
                        size={26}
                        color={SOFT_PRIMARY}
                        style={{ marginRight: "0.55rem" }}
                    />
                    Địa chỉ của <span style={{ color: "#111", fontWeight: 900, marginLeft: 7 }}>{customerInfo?.tenKhachHang}</span>
                </Typography>
                <AddAddressButton
                    onClick={handleAddClick}
                    startIcon={<Plus size={20} />}
                    disabled={addresses.length >= 5}
                >
                    Thêm địa chỉ
                </AddAddressButton>
            </Box>

            {/* Content */}
            {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight={120}>
                    <CircularProgress color="primary" size={32} />
                    <Typography ml={2} color={SOFT_PRIMARY} fontSize={17}>
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
                        background: SOFT_BG_GRADIENT,
                        p: 6,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center"
                    }}
                >
                    <PlaceIcon sx={{ fontSize: 56, color: SOFT_PRIMARY, mb: 2 }} />
                    <Typography color="text.secondary" fontSize={18} textAlign="center">
                        Chưa có địa chỉ nào. Nhấn Thêm địa chỉ để bắt đầu.
                    </Typography>
                </AnimatedCard>
            ) : (
                <Box display="flex" flexDirection="column" gap={2} mt={2}>
                    {addresses.map((address, idx) => (
                        <AnimatedCard
                            key={address.id}
                            elevation={address.trangThai === 1 ? 6 : 2}
                            className="fade-in"
                            sx={{
                                border:
                                    address.trangThai === 1
                                        ? `2px solid #16a34a`
                                        : `2px solid #e0e7ef`,
                                background: address.trangThai === 1 ? "rgba(34,197,94,0.09)" : "rgba(255,255,255,0.98)",
                                position: "relative"
                            }}
                        >
                            <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                                <Box display="flex" alignItems="center" gap={1.2}>
                                    <Typography
                                        fontWeight={800}
                                        fontSize={16}
                                        color={address.trangThai === 1 ? SOFT_GREEN : "#222"}
                                    >
                                        Địa chỉ {idx + 1}
                                    </Typography>
                                    {address.trangThai === 1 && (
                                        <GreenBadge
                                            icon={<StarIcon sx={{ fontSize: 16, color: SOFT_GREEN, mr: 0.5 }} />}
                                            label="Mặc định"
                                            color="primary"
                                            size="small"
                                            sx={{ ml: 1 }}
                                        />
                                    )}
                                </Box>
                                <Box display="flex" alignItems="center" gap={2}>
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
                                                    <StarBorderIcon sx={{ fontSize: 19 }} />
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
                                            <EditOutlinedIcon sx={{ fontSize: 19 }} />
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
                                            <DeleteIcon sx={{ fontSize: 19 }} />
                                        </SmallActionIconButton>
                                    </Tooltip>
                                </Box>
                            </Box>
                            <Typography fontWeight={700} fontSize={17} color="#222" mt={1}>
                                {`${address.diaChiCuThe}, ${address.xaPhuong}, ${address.quanHuyen}, ${address.tinhThanhPho}`}
                            </Typography>
                        </AnimatedCard>
                    ))}
                </Box>
            )}

            {/* Form Section */}
            <AddressFormSection
                open={formSectionOpen}
                onClose={handleFormClose}
                onSubmit={formSectionEdit ? handleEditAddress : handleAddAddress}
                initialData={formSectionData}
                isEdit={formSectionEdit}
            />

            {/* Confirm Delete Default Address Dialog */}
            {confirmDelete && confirmDelete.isDefault && addresses.length > 1 && (
                <Dialog open onClose={() => setConfirmDelete(null)} maxWidth="sm" fullWidth>
                    <DialogTitle
                        sx={{
                            color: "#d32f2f",
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            gap: 1
                        }}
                    >
                        <DeleteIcon sx={{ fontSize: 25 }} />
                        Xác nhận xóa địa chỉ mặc định
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="body1" sx={{ mb: 2, color: "#666" }}>
                                Bạn đang xóa địa chỉ mặc định. Vui lòng chọn một địa chỉ khác làm địa chỉ mặc định trước khi xóa.
                            </Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#d32f2f", mb: 1 }}>
                                Địa chỉ sẽ bị xóa:
                            </Typography>
                            <Paper sx={{ p: 2, bgcolor: "#fff3e0", border: "1.5px solid #ffb74d", borderRadius: 2 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {addresses.find((a) => a.id === confirmDelete.addressId)?.tinhThanhPho},{" "}
                                    {addresses.find((a) => a.id === confirmDelete.addressId)?.xaPhuong}
                                </Typography>
                            </Paper>
                        </Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: SOFT_PRIMARY, mb: 2 }}>
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
                                            border: selectDefaultId === address.id ? "2px solid #2563eb" : "1.5px solid #e0e7ef",
                                            bgcolor: selectDefaultId === address.id ? "#f4f8fe" : "#fff",
                                            transition: "all 0.22s",
                                            "&:hover": {
                                                borderColor: "#2563eb",
                                                bgcolor: selectDefaultId === address.id ? "#f4f8fe" : "#f5f5f5"
                                            }
                                        }}
                                        onClick={() => setSelectDefaultId(address.id)}
                                    >
                                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 700, color: "#222" }}>
                                                    Địa chỉ {index + 1}
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: "#666", mt: 0.5, fontSize: "0.95rem" }}>
                                                    {address.tinhThanhPho}, {address.xaPhuong}
                                                </Typography>
                                            </Box>
                                            {selectDefaultId === address.id && (
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, ml: 1 }}>
                                                    <StarIcon sx={{ fontSize: 18, color: SOFT_PRIMARY }} />
                                                    <Typography
                                                        variant="caption"
                                                        sx={{ color: SOFT_PRIMARY, fontWeight: 700, fontSize: "0.8rem" }}
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
                            <Typography variant="caption" sx={{ color: "#d32f2f", mt: 1, display: "block", fontWeight: 700 }}>
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
                                fontWeight: 700,
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
                            sx={{ minWidth: 170, fontWeight: 700 }}
                        >
                            Xóa & Thiết lập mặc định
                        </Button>
                    </DialogActions>
                </Dialog>
            )}

            {/* Confirm Delete Non-Default Address Dialog */}
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
                                fontWeight: 700,
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
                            sx={{ fontWeight: 700 }}
                        >
                            Xóa
                        </Button>
                    </DialogActions>
                </Dialog>
            )}

            {/* General Confirm Dialog */}
            {confirmDialog.open && (
                <Dialog open onClose={closeConfirmDialog} maxWidth="sm" fullWidth>
                    <DialogTitle
                        sx={{
                            color: confirmDialog.confirmColor === "error" ? "#d32f2f" : SOFT_PRIMARY,
                            fontWeight: 700
                        }}
                    >
                        {confirmDialog.title}
                    </DialogTitle>
                    <DialogContent>
                        <Typography sx={{ whiteSpace: "pre-line", lineHeight: 1.7, fontWeight: 700 }}>
                            {confirmDialog.message}
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ p: 2, gap: 1 }}>
                        <Button
                            onClick={closeConfirmDialog}
                            variant="outlined"
                            sx={{
                                minWidth: 100,
                                fontWeight: 700,
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
                            sx={{ minWidth: 120, fontWeight: 700 }}
                        >
                            {confirmDialog.confirmText}
                        </Button>
                    </DialogActions>
                </Dialog>
            )}
        </Box>
    );
}

AddressManager.propTypes = {
    customerId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
};