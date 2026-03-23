import { useState, useEffect ,useCallback } from "react";
import {
    Box,
    TextField,
    Button,
    Typography,
    Stack,
    Autocomplete,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    CircularProgress,
} from "@mui/material";
import PropTypes from "prop-types";
import axios from "axios";
import { toast } from "react-toastify";

// --- GHN API Configuration ---
const GHN_API_BASE_URL = "https://online-gateway.ghn.vn/shiip/public-api";
const GHN_TOKEN = process.env.REACT_APP_GHN_TOKEN; // Replace with your actual token
const ghnApi = axios.create({
    baseURL: GHN_API_BASE_URL,
    headers: {
        token: GHN_TOKEN,
        "Content-Type": "application/json",
    },
});

// --- Helper Functions ---
function tachDiaChi(diaChi = "") {
    if (!diaChi) return { chiTiet: '', xa: '', huyen: '', tinh: '' };
    const parts = diaChi.split(',').map(part => part.trim());
    // Handles cases with fewer than 4 parts by providing empty strings
    return {
        chiTiet: parts[0] || '',
        xa: parts[1] || '',
        huyen: parts[2] || '',
        tinh: parts[3] || ''
    };
}

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
const formatCurrency = (amount) => {
    if (typeof amount !== "number") return "0 ₫";
    return `${amount.toLocaleString("vi-VN")} ₫`;
};

const EditRecipientModal = ({ open, onClose, recipientData, onSave }) => {
   
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingProvinces, setIsFetchingProvinces] = useState(true);
 const [initialData, setInitialData] = useState(null); // LƯU DỮ LIỆU BAN ĐẦU
  const [isSaving, setIsSaving] = useState(false); 
    const [form, setForm] = useState({
        tenKhachHang: "",
        sdt: "",
        diaChi: "",
         ghiChu: "", // This will hold only the specific part of the address
        province: null,
        district: null,
        ward: null,
    });
useEffect(() => {
 if (open && recipientData && provinces.length > 0) {
 // LƯU LẠI DỮ LIỆU GỐC KHI MODAL MỞ
setInitialData(recipientData); 
 const addressParts = tachDiaChi(recipientData.diaChi);
 setForm({
 tenKhachHang: recipientData.tenKhachHang || "",
 sdt: recipientData.sdt || "",
 diaChi: addressParts.chiTiet || "",
 province: null, district: null, ward: null,
   ghiChu: recipientData.ghiChu || "",
 });
 if (addressParts.tinh) loadAddressFromData(addressParts);
 }
}, [open, recipientData, provinces]);
    // --- Effects for managing address data ---
 const calculateShippingFee = useCallback(async (toDistrictId, toWardCode) => {
        if (!toDistrictId || !toWardCode) return null;
        try {
            const response = await ghnApi.get("/v2/shipping-order/fee", {
                params: {
                    service_type_id: 2, // Dịch vụ chuẩn
                    to_district_id: toDistrictId,
                    to_ward_code: toWardCode,
                    height: 15, length: 15, weight: 1000, width: 15, // Cân nặng/kích thước giả định
                },
            });
            return response.data?.data?.total || null;
        } catch (error) {
            console.error("Lỗi tính phí vận chuyển:", error);
            toast.error("Không thể tính lại phí vận chuyển.");
            return null;
        }
    }, []);
    // 1. Fetch provinces from GHN when the component mounts
    useEffect(() => {
        const fetchProvinces = async () => {
            setIsFetchingProvinces(true);
            try {
                const response = await ghnApi.get("/master-data/province");
                if (response.data?.data) {
                    setProvinces(response.data.data);
                }
            } catch (error) {
                console.error("Error fetching provinces:", error);
                toast.error("Không thể tải danh sách tỉnh/thành phố.");
            } finally {
                setIsFetchingProvinces(false);
            }
        };
        fetchProvinces();
    }, []);

    // 2. Populate form and auto-select address when modal opens with data
    useEffect(() => {
        if (open && recipientData && provinces.length > 0) {
            const addressParts = tachDiaChi(recipientData.diaChi);
            
            setForm({
                tenKhachHang: recipientData.tenKhachHang || "",
                sdt: recipientData.sdt || "",
                diaChi: addressParts.chiTiet || "",
                 ghiChu: recipientData.ghiChu || "", 
                province: null, district: null, ward: null,
            });

            if (addressParts.tinh) {
                loadAddressFromData(addressParts);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, recipientData, provinces]);

    // 3. Fetch districts when a province is selected by the user
    useEffect(() => {
        if (!form.province) {
            setDistricts([]);
            setWards([]);
            setForm(prev => ({ ...prev, district: null, ward: null }));
            return;
        }
        
        const fetchDistricts = async () => {
            try {
                const response = await ghnApi.get("/master-data/district", {
                    params: { province_id: form.province.ProvinceID },
                });
                setDistricts(response.data?.data || []);
            } catch (error) {
                console.error("Error fetching districts:", error);
                toast.error("Không thể tải danh sách quận/huyện.");
            }
        };
        fetchDistricts();
    }, [form.province]);

    // 4. Fetch wards when a district is selected by the user
    useEffect(() => {
        if (!form.district) {
            setWards([]);
            setForm(prev => ({ ...prev, ward: null }));
            return;
        }

        const fetchWards = async () => {
            try {
                const response = await ghnApi.get("/master-data/ward", {
                    params: { district_id: form.district.DistrictID },
                });
                setWards(response.data?.data || []);
            } catch (error) {
                console.error("Error fetching wards:", error);
                toast.error("Không thể tải danh sách phường/xã.");
            }
        };
        fetchWards();
    }, [form.district]);


    // --- Core Logic Functions ---

    const loadAddressFromData = async (addressParts) => {
        setIsLoading(true);
        try {
            // Find Province
            const provinceObj = provinces.find(p => 
                normalizeString(p.ProvinceName).includes(normalizeString(addressParts.tinh))
            );
            if (!provinceObj) {
                toast.warn(`Không tìm thấy tỉnh/thành phố: "${addressParts.tinh}"`);
                return;
            }
            setForm(prev => ({ ...prev, province: provinceObj }));

            // Fetch and Find District
            const districtResponse = await ghnApi.get("/master-data/district", {
                params: { province_id: provinceObj.ProvinceID },
            });
            const districtsData = districtResponse.data?.data || [];
            setDistricts(districtsData);
            const districtObj = districtsData.find(d => 
                normalizeString(d.DistrictName).includes(normalizeString(addressParts.huyen))
            );
            if (!districtObj) {
                toast.warn(`Không tìm thấy quận/huyện: "${addressParts.huyen}"`);
                return;
            }
            setForm(prev => ({ ...prev, district: districtObj }));

            // Fetch and Find Ward
            const wardResponse = await ghnApi.get("/master-data/ward", {
                params: { district_id: districtObj.DistrictID },
            });
            const wardsData = wardResponse.data?.data || [];
            setWards(wardsData);
            const wardObj = wardsData.find(w => 
                normalizeString(w.WardName).includes(normalizeString(addressParts.xa))
            );
            if (wardObj) {
                setForm(prev => ({ ...prev, ward: wardObj }));
            } else {
                 toast.warn(`Không tìm thấy phường/xã: "${addressParts.xa}"`);
            }
        } catch (error) {
            console.error("Error auto-loading address:", error);
            toast.warn("Không thể tự động tìm thấy địa chỉ chi tiết.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSave = async () => {
        // --- Validation (giữ nguyên) ---
        if (!form.tenKhachHang.trim() || !form.sdt.trim() || !form.diaChi.trim() || !form.province || !form.district || !form.ward) {
            toast.error("Vui lòng điền đầy đủ thông tin bắt buộc.");
            return;
        }

        setIsSaving(true);
        let logMessage = "Cập nhật thông tin đơn hàng:\n";
        let hasChanges = false;
        let newShippingFee = initialData.phiVanChuyen; // Mặc định là phí cũ

        // 1. So sánh thông tin cơ bản
        if (form.tenKhachHang !== initialData.tenKhachHang) {
            logMessage += `- Tên người nhận: "${initialData.tenKhachHang}" -> "${form.tenKhachHang}"\n`;
            hasChanges = true;
        }
        if (form.sdt !== initialData.sdt) {
            logMessage += `- SĐT: "${initialData.sdt}" -> "${form.sdt}"\n`;
            hasChanges = true;
        }
  
        // So sánh Ghi chú <<-- THÊM MỚI
        if (form.ghiChu !== initialData.ghiChu) {
            logMessage += `- Ghi chú: "${initialData.ghiChu || ''}" -> "${form.ghiChu}"\n`;
            hasChanges = true;
        }
        // 2. So sánh địa chỉ và tính lại phí nếu cần
        const newFullAddress = `${form.diaChi}, ${form.ward.WardName}, ${form.district.DistrictName}, ${form.province.ProvinceName}`;
        if (newFullAddress !== initialData.diaChi) {
            logMessage += `- Địa chỉ: "${initialData.diaChi}" -> "${newFullAddress}"\n`;
            hasChanges = true;

            // Tính lại phí vận chuyển
            const calculatedFee = await calculateShippingFee(form.district.DistrictID, form.ward.WardCode);
            if (calculatedFee !== null) {
                newShippingFee = calculatedFee;
                if (newShippingFee !== initialData.phiVanChuyen) {
                    logMessage += `- Phí vận chuyển: "${formatCurrency(initialData.phiVanChuyen)}" -> "${formatCurrency(newShippingFee)}"\n`;
                }
            } else {
                // Nếu tính phí lỗi, không cho phép lưu
                setIsSaving(false);
                return;
            }
        }

        // 3. Trả về dữ liệu cho component cha
        if (hasChanges) {
            const finalData = {
                recipient: { // Dữ liệu người nhận mới
                    tenKhachHang: form.tenKhachHang,
                    sdt: form.sdt,
                    diaChi: newFullAddress,
                    ghiChu: form.ghiChu,
                },
                newShippingFee, // Phí vận chuyển mới
                logMessage: logMessage.trim(), // Nội dung log
            };
            onSave(finalData); // Gửi object chứa tất cả thông tin
        } else {
            toast.info("Không có thay đổi nào để lưu.");
        }

        setIsSaving(false);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ fontWeight: 'bold' }}>Sửa thông tin người nhận</DialogTitle>
            <DialogContent>
                <TextField
                    margin="dense" label="Tên người nhận" name="tenKhachHang" fullWidth
                    value={form.tenKhachHang} onChange={handleChange} required
                />
                <TextField
                    margin="dense" label="Số điện thoại" name="sdt" fullWidth
                    value={form.sdt} onChange={handleChange} required
                />
                <TextField
                    margin="dense" label="Địa chỉ cụ thể" name="diaChi" fullWidth
                    value={form.diaChi} onChange={handleChange}
                    placeholder="Số nhà, tên đường..." required
                />
 <TextField
                    margin="dense"
                    label="Ghi chú"
                    name="ghiChu"
                    fullWidth
                    value={form.ghiChu}
                    onChange={handleChange}
                    placeholder="Ghi chú cho đơn hàng (tùy chọn)..."
                />
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 2 }}>
                    <Autocomplete
                        options={provinces}
                        getOptionLabel={(opt) => opt?.ProvinceName || ""}
                        value={form.province}
                        onChange={(e, val) => setForm(prev => ({ ...prev, province: val, district: null, ward: null }))}
                        isOptionEqualToValue={(opt, val) => opt?.ProvinceID === val?.ProvinceID}
                        renderInput={(params) => <TextField {...params} label="Tỉnh / Thành phố *" />}
                        fullWidth
                        loading={isFetchingProvinces}
                        disabled={isLoading || isFetchingProvinces}
                    />
                    <Autocomplete
                        options={districts}
                        getOptionLabel={(opt) => opt?.DistrictName || ""}
                        value={form.district}
                        onChange={(e, val) => setForm(prev => ({ ...prev, district: val, ward: null }))}
                        isOptionEqualToValue={(opt, val) => opt?.DistrictID === val?.DistrictID}
                        disabled={!form.province || isLoading}
                        renderInput={(params) => <TextField {...params} label="Quận / Huyện *" />}
                        fullWidth
                    />
                    <Autocomplete
                        options={wards}
                        getOptionLabel={(opt) => opt?.WardName || ""}
                        value={form.ward}
                        onChange={(e, val) => setForm(prev => ({ ...prev, ward: val }))}
                        isOptionEqualToValue={(opt, val) => opt?.WardCode === val?.WardCode}
                        disabled={!form.district || isLoading}
                        renderInput={(params) => <TextField {...params} label="Phường / Xã *" />}
                        fullWidth
                    />
                </Stack>
                {isLoading && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <CircularProgress size={20} />
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                            Đang tự động điền địa chỉ...
                        </Typography>
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ p: '16px 24px' }}>
                <Button onClick={onClose} disabled={isLoading}>Hủy</Button>
                <Button variant="contained" onClick={handleSave} disabled={isLoading}>
                    Lưu
                </Button>
            </DialogActions>
        </Dialog>
    );
};

EditRecipientModal.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    recipientData: PropTypes.shape({
        tenKhachHang: PropTypes.string,
        sdt: PropTypes.string,
        diaChi: PropTypes.string,
          ghiChu: PropTypes.string,
    }),
    onSave: PropTypes.func.isRequired,
};

export default EditRecipientModal;
