import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import CloseIcon from "@mui/icons-material/Close";
import { FaPlus, FaTrash, FaDownload } from "react-icons/fa";
import { QRCodeCanvas } from "qrcode.react";
import CreatableSelect from "react-select/creatable";
import Select from "react-select";
import { toast } from "react-toastify";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8080";
const apiUrl = (path) => `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;

const selectMenuStyle = {
    menu: (base) => ({
        ...base,
        borderRadius: 12,
        zIndex: 25,
        boxShadow: "0 6px 24px 0 rgba(0,0,0,0.12)",
        fontSize: 16,
    }),
    control: (base, state) => ({
        ...base,
        borderRadius: 12,
        background: state.isDisabled ? "#f4f6fb" : "#fafdff",
        fontSize: 16,
        minHeight: 44,
        borderColor: state.isFocused ? "#1976d2" : "#e3e9f0",
        boxShadow: state.isFocused ? "0 0 0 2px #1976d2" : "none",
        "&:hover": { borderColor: "#1976d2" },
        paddingLeft: 6,
        paddingRight: 6,
    }),
    placeholder: (base) => ({
        ...base,
        color: "#a8b8c3",
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected
            ? "#e3f2fd"
            : state.isFocused
                ? "#f0f7fa"
                : "#fff",
        color: "#263238",
        fontWeight: state.isSelected ? 600 : 500,
        cursor: "pointer",
        fontSize: 16,
        padding: "11px 16px",
    }),
};

const statusOptions = [
    { value: 1, label: "Đang bán" },
    { value: 0, label: "Ngừng bán" },
];

function getOptionByValue(options, value) {
    if (value === undefined || value === null || value === "") return null;
    return options.find(option => String(option.value) === String(value)) || null;
}

function formatCurrencyVND(value) {
    if (value === "" || value === null || value === undefined) return "";
    const number = Number(String(value).replace(/[^\d]/g, ""));
    if (Number.isNaN(number)) return "";
    return number.toLocaleString("vi-VN");
}

function parseCurrencyVND(value) {
    return String(value).replace(/[^\d]/g, "");
}

function ProductDetailUpdateModal({ open, onClose, detail, onSuccess }) {
    const [brandOptions, setBrandOptions] = useState([]);
    const [materialOptions, setMaterialOptions] = useState([]);
    const [collarOptions, setCollarOptions] = useState([]);
    const [sleeveOptions, setSleeveOptions] = useState([]);
    const [colorOptions, setColorOptions] = useState([]);
    const [sizeOptions, setSizeOptions] = useState([]);
    const [isLoadingOptions, setIsLoadingOptions] = useState(true);
    const [form, setForm] = useState({
        idThuongHieu: "",
        idChatLieu: "",
        idCoAo: "",
        idTayAo: "",
        idMauSac: "",
        idKichThuoc: "",
        gia: "",
        soLuong: "",
        trongLuong: "",
        trangThai: 1,
        images: [],
    });
    const [imagePreview, setImagePreview] = useState([]);
    const [imageFiles, setImageFiles] = useState([]);
    const [systemImages, setSystemImages] = useState([]);
    const [selectedSystemImages, setSelectedSystemImages] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState("");
    const qrRef = useRef();

    useEffect(() => {
        if (!open) return;
        setIsLoadingOptions(true);
        Promise.all([
            fetch(apiUrl("/thuongHieu/all"), { credentials: "include" }).then(response => response.json()),
            fetch(apiUrl("/chatLieu/all"), { credentials: "include" }).then(response => response.json()),
            fetch(apiUrl("/coAo/all"), { credentials: "include" }).then(response => response.json()),
            fetch(apiUrl("/tayAo/all"), { credentials: "include" }).then(response => response.json()),
            fetch(apiUrl("/mauSac/all"), { credentials: "include" }).then(response => response.json()),
            fetch(apiUrl("/kichThuoc/all"), { credentials: "include" }).then(response => response.json()),
            fetch(apiUrl("/hinhAnh/all"), { credentials: "include" }).then(response => response.json()),
        ]).then(([brands, materials, collars, sleeves, colors, sizes, images]) => {
            setBrandOptions((brands || []).map(item => ({
                value: String(item.id), label: item.tenThuongHieu
            })));
            setMaterialOptions((materials || []).map(item => ({
                value: String(item.id), label: item.tenChatLieu
            })));
            setCollarOptions((collars || []).map(item => ({
                value: String(item.id), label: item.tenCoAo
            })));
            setSleeveOptions((sleeves || []).map(item => ({
                value: String(item.id), label: item.tenTayAo
            })));
            setColorOptions((colors || []).map(item => ({
                value: String(item.id), label: item.tenMauSac
            })));
            setSizeOptions((sizes || []).map(item => ({
                value: String(item.id), label: item.tenKichCo || item.tenKichThuoc
            })));
            setSystemImages((images || []).filter(i => !!i.duongDanAnh));
            setIsLoadingOptions(false);
        }).catch(() => {
            setIsLoadingOptions(false);
        });
    }, [open]);

    useEffect(() => {
        if (!open || !detail?.id) return;
        fetch(apiUrl(`/hinhAnh/by-product-detail/${detail.id}`), { credentials: "include" })
            .then(response => response.json())
            .then(images => {
                const urls = [];
                (images || []).forEach(img => {
                    if (img.duongDanAnh && !urls.includes(img.duongDanAnh)) {
                        urls.push(img.duongDanAnh);
                    }
                });
                setImagePreview(urls);
                setImageFiles([]);
                setSelectedSystemImages([]);
            })
            .catch(() => {
                setImagePreview([]);
                setSelectedSystemImages([]);
            });
    }, [open, detail?.id]);

    useEffect(() => {
        if (!isLoadingOptions && detail) {
            setForm({
                idThuongHieu: detail?.idThuongHieu !== undefined ? String(detail?.idThuongHieu) : "",
                idChatLieu: detail?.idChatLieu !== undefined ? String(detail?.idChatLieu) : "",
                idCoAo: detail?.idCoAo !== undefined ? String(detail?.idCoAo) : "",
                idTayAo: detail?.idTayAo !== undefined ? String(detail?.idTayAo) : "",
                idMauSac: detail?.idMauSac !== undefined ? String(detail?.idMauSac) : "",
                idKichThuoc: detail?.idKichThuoc !== undefined ? String(detail?.idKichThuoc) : "",
                gia: detail?.gia ? formatCurrencyVND(detail.gia) : "",
                soLuong: detail?.soLuong || "",
                trongLuong: detail?.trongLuong || "",
                trangThai: detail?.trangThai === 1 ? 1 : 0,
                images: [],
            });
        }
    }, [detail, isLoadingOptions]);

    function handleChange(key, value) {
        setForm(previous => ({ ...previous, [key]: value }));
    }
    function handleGiaChange(event) {
        const input = event.target.value;
        const numericValue = parseCurrencyVND(input);
        setForm(previous => ({
            ...previous,
            gia: formatCurrencyVND(numericValue)
        }));
    }
    function handleImageChange(event) {
        const files = Array.from(event.target.files);
        const previews = files.map(file => URL.createObjectURL(file));
        setImagePreview(previous => [...previous, ...previews]);
        setImageFiles(previous => [...previous, ...files]);
    }
    function handleImageRemove(image) {
        setImagePreview(previous => previous.filter(i => i !== image));
        setSelectedSystemImages(prev => prev.filter(i => i !== image));
        setImageFiles(previous => {
            const idx = imagePreview.indexOf(image);
            if (idx !== -1) {
                const arr = [...previous];
                arr.splice(idx, 1);
                return arr;
            }
            return previous;
        });
    }
    function handleSystemImageToggle(url) {
        setSelectedSystemImages(prev =>
            prev.includes(url)
                ? prev.filter((x) => x !== url)
                : [...prev, url]
        );
        setImagePreview(prev =>
            prev.includes(url)
                ? prev.filter((x) => x !== url)
                : [...prev, url]
        );
    }
    function validateForm() {
        if (!form.idThuongHieu) {
            toast.error("Vui lòng chọn thương hiệu");
            return false;
        }
        if (!form.idChatLieu) {
            toast.error("Vui lòng chọn chất liệu");
            return false;
        }
        const giaNumber = Number(parseCurrencyVND(form.gia));
        if (!form.gia || isNaN(giaNumber) || giaNumber <= 0) {
            toast.error("Vui lòng nhập giá lớn hơn 0");
            return false;
        }
        if (!form.soLuong || isNaN(form.soLuong) || Number(form.soLuong) < 0) {
            toast.error("Vui lòng nhập số lượng không âm");
            return false;
        }
        if (!form.trongLuong || isNaN(form.trongLuong) || Number(form.trongLuong) <= 0) {
            toast.error("Vui lòng nhập trọng lượng lớn hơn 0");
            return false;
        }
        if (!form.idMauSac) {
            toast.error("Vui lòng chọn màu sắc");
            return false;
        }
        if (!form.idKichThuoc) {
            toast.error("Vui lòng chọn kích cỡ");
            return false;
        }
        return true;
    }
    async function handleUpdate() {
        setIsSubmitting(true);
        setFormError("");
        if (!validateForm()) {
            setIsSubmitting(false);
            return;
        }

        const systemImageIds = systemImages
            .filter(img => selectedSystemImages.includes(img.duongDanAnh))
            .map(img => img.id);

        let uploadedImageIds = [];
        if (imageFiles.length > 0) {
            const imgForm = new window.FormData();
            imgForm.append("ma_anh", `SPCT_${detail.id}`);
            imgForm.append("anh_mac_dinh", 0);
            imgForm.append("mo_ta", "");
            imgForm.append("trang_thai", 1);
            imgForm.append("id_san_pham_chi_tiet", detail.id);
            imageFiles.forEach(f => imgForm.append("duong_dan_anh", f));
            const res = await fetch(apiUrl("/hinhAnh/multi"), {
                method: "POST",
                body: imgForm,
                credentials: "include",
            });
            if (res.ok) {
                const result = await res.json();
                uploadedImageIds = Array.isArray(result) ? result.map(img => img.id) : [];
            }
        }

        const hinhAnhIds = [...systemImageIds, ...uploadedImageIds];

        const jsonData = {
            idSanPham: detail.idSanPham,
            maSanPhamChiTiet: detail.maSanPhamChiTiet,
            idThuongHieu: form.idThuongHieu,
            idChatLieu: form.idChatLieu,
            idCoAo: form.idCoAo,
            idTayAo: form.idTayAo,
            idMauSac: form.idMauSac,
            idKichThuoc: form.idKichThuoc,
            gia: Number(parseCurrencyVND(form.gia)),
            soLuong: form.soLuong,
            trongLuong: form.trongLuong,
            trangThai: form.trangThai,
            hinhAnhIds
        };

        try {
            const response = await fetch(apiUrl(`/chiTietSanPham/${detail?.id}`), {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify(jsonData)
            });
            if (!response.ok) {
                const error = await response.json();
                setFormError(error.message || "Cập nhật thất bại");
                setIsSubmitting(false);
                toast.error(error.message || "Cập nhật thất bại");
                return;
            }
            toast.success("Cập nhật thành công!");
            setIsSubmitting(false);
            onClose();
            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            setFormError("Có lỗi hệ thống");
            setIsSubmitting(false);
            toast.error("Có lỗi hệ thống");
        }
    }
    function handleDownloadQRCode() {
        const canvas = qrRef.current.querySelector("canvas");
        if (canvas) {
            const url = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.href = url;
            link.download = `${detail?.maSanPhamChiTiet || "qr-code"}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
    function renderSelectOrLoading(component) {
        if (isLoadingOptions) {
            return (
                <Box display="flex" alignItems="center" justifyContent="center" py={2}>
                    <CircularProgress size={22} color="info" />
                </Box>
            );
        }
        return component;
    }
    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 6, p: 0 } }}>
            <DialogTitle sx={{ fontWeight: 800, fontSize: 26, pb: 1.5, color: "#1976d2", letterSpacing: 0.5 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <span>Cập nhật sản phẩm chi tiết</span>
                    <IconButton
                        aria-label="close"
                        onClick={onClose}
                        sx={{
                            color: "#eb5757",
                            ml: 2,
                            background: "#f5f6fa",
                            "&:hover": { background: "#ffeaea" }
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>
            <Divider sx={{ mb: 1 }} />
            <DialogContent dividers sx={{ background: "#f7fbff", pb: 3 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={8}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <Typography fontWeight={700} mb={0.5} color="#1769aa">
                                    Thương hiệu <span style={{ color: "#e74c3c" }}>*</span>
                                </Typography>
                                {renderSelectOrLoading(
                                    <CreatableSelect
                                        options={brandOptions}
                                        value={getOptionByValue(brandOptions, form.idThuongHieu)}
                                        onChange={option => handleChange("idThuongHieu", option ? option.value : "")}
                                        styles={selectMenuStyle}
                                        isClearable
                                        placeholder="Chọn thương hiệu"
                                        noOptionsMessage={() => "Không có dữ liệu"}
                                    />
                                )}
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography fontWeight={700} mb={0.5} color="#1769aa">
                                    Chất liệu <span style={{ color: "#e74c3c" }}>*</span>
                                </Typography>
                                {renderSelectOrLoading(
                                    <CreatableSelect
                                        options={materialOptions}
                                        value={getOptionByValue(materialOptions, form.idChatLieu)}
                                        onChange={option => handleChange("idChatLieu", option ? option.value : "")}
                                        styles={selectMenuStyle}
                                        isClearable
                                        placeholder="Chọn chất liệu"
                                        noOptionsMessage={() => "Không có dữ liệu"}
                                    />
                                )}
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography fontWeight={700} mb={0.5} color="#1769aa">Cổ áo</Typography>
                                {renderSelectOrLoading(
                                    <CreatableSelect
                                        options={collarOptions}
                                        value={getOptionByValue(collarOptions, form.idCoAo)}
                                        onChange={option => handleChange("idCoAo", option ? option.value : "")}
                                        styles={selectMenuStyle}
                                        isClearable
                                        placeholder="Chọn cổ áo"
                                        noOptionsMessage={() => "Không có dữ liệu"}
                                    />
                                )}
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography fontWeight={700} mb={0.5} color="#1769aa">Tay áo</Typography>
                                {renderSelectOrLoading(
                                    <CreatableSelect
                                        options={sleeveOptions}
                                        value={getOptionByValue(sleeveOptions, form.idTayAo)}
                                        onChange={option => handleChange("idTayAo", option ? option.value : "")}
                                        styles={selectMenuStyle}
                                        isClearable
                                        placeholder="Chọn tay áo"
                                        noOptionsMessage={() => "Không có dữ liệu"}
                                    />
                                )}
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography fontWeight={700} mb={0.5} color="#1769aa">
                                    Màu sắc <span style={{ color: "#e74c3c" }}>*</span>
                                </Typography>
                                {renderSelectOrLoading(
                                    <Select
                                        options={colorOptions}
                                        value={getOptionByValue(colorOptions, form.idMauSac)}
                                        onChange={option => handleChange("idMauSac", option ? option.value : "")}
                                        styles={selectMenuStyle}
                                        isClearable
                                        placeholder="Chọn màu sắc"
                                        noOptionsMessage={() => "Không có dữ liệu"}
                                    />
                                )}
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography fontWeight={700} mb={0.5} color="#1769aa">
                                    Kích cỡ <span style={{ color: "#e74c3c" }}>*</span>
                                </Typography>
                                {renderSelectOrLoading(
                                    <Select
                                        options={sizeOptions}
                                        value={getOptionByValue(sizeOptions, form.idKichThuoc)}
                                        onChange={option => handleChange("idKichThuoc", option ? option.value : "")}
                                        styles={selectMenuStyle}
                                        isClearable
                                        placeholder="Chọn kích cỡ"
                                        noOptionsMessage={() => "Không có dữ liệu"}
                                    />
                                )}
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    label="Giá (₫)"
                                    value={form.gia}
                                    size="small"
                                    fullWidth
                                    InputProps={{
                                        sx: { background: "#fafdff", borderRadius: 2 }
                                    }}
                                    onChange={handleGiaChange}
                                    type="text"
                                    inputProps={{ min: 0, inputMode: "numeric", pattern: "[0-9]*" }}
                                    placeholder="VD: 2.000"
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    label="Số lượng"
                                    value={form.soLuong}
                                    size="small"
                                    fullWidth
                                    InputProps={{
                                        sx: { background: "#fafdff", borderRadius: 2 }
                                    }}
                                    onChange={(event) => handleChange("soLuong", event.target.value)}
                                    type="number"
                                    inputProps={{ min: 0 }}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    label="Trọng lượng (g)"
                                    value={form.trongLuong}
                                    size="small"
                                    fullWidth
                                    InputProps={{
                                        sx: { background: "#fafdff", borderRadius: 2 }
                                    }}
                                    onChange={(event) => handleChange("trongLuong", event.target.value)}
                                    type="number"
                                    inputProps={{ min: 0 }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography fontWeight={700} mb={0.5} color="#1769aa">Trạng thái</Typography>
                                <Select
                                    options={statusOptions}
                                    value={getOptionByValue(statusOptions, form.trangThai)}
                                    onChange={option => handleChange("trangThai", option ? option.value : 0)}
                                    styles={selectMenuStyle}
                                    isClearable
                                    placeholder="Chọn trạng thái"
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography fontWeight={700} mb={0.5} color="#1769aa">
                                    Mã QR
                                </Typography>
                                <Box mt={2} display="flex" alignItems="center" justifyContent="start" height={100} gap={1}>
                                    <Box
                                        ref={qrRef}
                                        sx={{
                                            background: "#fff",
                                            border: "1.5px solid #e3e9f0",
                                            borderRadius: 3,
                                            p: 1,
                                            boxShadow: 2,
                                            width: 104,
                                            height: 104,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            position: "relative"
                                        }}>
                                        <QRCodeCanvas value={detail?.maSanPhamChiTiet || "QR"} size={90} />
                                    </Box>
                                    <Tooltip title="Tải ảnh QR về">
                                        <IconButton
                                            onClick={handleDownloadQRCode}
                                            color="info"
                                            sx={{
                                                ml: 1,
                                                background: "#f0f4fa",
                                                borderRadius: 2,
                                                border: "1.5px solid #e3e9f0",
                                                boxShadow: 1,
                                                "&:hover": { background: "#e3f2fd" }
                                            }}
                                        >
                                            <FaDownload />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Typography fontWeight={700} mb={1} color="#1769aa">
                            Hình ảnh sản phẩm
                        </Typography>
                        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap" minHeight={90}>
                            {(imagePreview || []).map((image, index) => (
                                <Box key={index} sx={{ position: "relative", mb: 1 }}>
                                    <Tooltip title="Xóa ảnh">
                                        <IconButton
                                            size="small"
                                            sx={{
                                                position: "absolute",
                                                top: -10,
                                                right: -10,
                                                background: "#fff",
                                                border: "1px solid #eee",
                                                zIndex: 2
                                            }}
                                            onClick={() => handleImageRemove(image)}
                                        >
                                            <FaTrash color="#e74c3c" />
                                        </IconButton>
                                    </Tooltip>
                                    <img
                                        src={image}
                                        alt="Ảnh sản phẩm"
                                        width={82}
                                        height={82}
                                        style={{
                                            borderRadius: 10,
                                            border: "1.5px solid #e3e9f0",
                                            objectFit: "cover",
                                            background: "#fafbfc",
                                            boxShadow: "0 2px 8px rgba(25,118,210,0.07)"
                                        }}
                                    />
                                </Box>
                            ))}
                            <Tooltip title="Tải ảnh lên từ máy">
                                <Button
                                    variant="outlined"
                                    component="label"
                                    sx={{
                                        borderRadius: 3,
                                        height: 82,
                                        width: 82,
                                        minWidth: 0,
                                        borderStyle: "dashed",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "#1976d2",
                                        fontWeight: 600,
                                        fontSize: 29,
                                        background: "#fafdff",
                                        boxShadow: "none"
                                    }}
                                >
                                    <FaPlus />
                                    <input
                                        type="file"
                                        hidden
                                        multiple
                                        accept="image/*"
                                        onChange={handleImageChange}
                                    />
                                </Button>
                            </Tooltip>
                        </Box>
                        <Typography variant="caption" color="#bdbdbd" mt={1} display="block">
                            Bạn có thể chọn nhiều ảnh, ảnh đầu tiên là ảnh đại diện.
                        </Typography>
                        <Box mt={2}>
                            <Typography fontWeight={700} mb={1} color="#1769aa">
                                Chọn ảnh từ hệ thống
                            </Typography>
                            <Box display="flex" alignItems="center" gap={2} flexWrap="wrap" minHeight={60}>
                                {systemImages.length === 0 ? (
                                    <Typography color="textSecondary">
                                        Không có ảnh hệ thống nào
                                    </Typography>
                                ) : (
                                    systemImages.map((img) => (
                                        <Box
                                            key={img.id}
                                            sx={{
                                                border: selectedSystemImages.includes(img.duongDanAnh)
                                                    ? "2px solid #1976d2"
                                                    : "1px dashed #bbb",
                                                borderRadius: 2,
                                                p: 0.5,
                                                width: 70,
                                                height: 70,
                                                cursor: "pointer",
                                                position: "relative",
                                                boxShadow: selectedSystemImages.includes(img.duongDanAnh)
                                                    ? "0 2px 8px rgba(25,118,210,0.10)"
                                                    : "none",
                                                background: "#fff",
                                            }}
                                            onClick={() => handleSystemImageToggle(img.duongDanAnh)}
                                        >
                                            <img
                                                src={img.duongDanAnh}
                                                alt={img.moTa}
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "cover",
                                                    borderRadius: 6,
                                                }}
                                            />
                                            <input
                                                type="checkbox"
                                                checked={selectedSystemImages.includes(img.duongDanAnh)}
                                                readOnly
                                                style={{
                                                    position: "absolute",
                                                    left: 2,
                                                    top: 2,
                                                    zIndex: 2,
                                                }}
                                            />
                                        </Box>
                                    ))
                                )}
                            </Box>
                            <Typography variant="caption" color="#bdbdbd" mt={1} display="block">
                                Nhấn vào ảnh để chọn hoặc bỏ chọn. Có thể chọn cả ảnh hệ thống và tải lên ảnh mới.
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
                {formError && (
                    <Box sx={{ my: 2 }}>
                        <Typography color="error" fontWeight={600}>{formError}</Typography>
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ p: 2, background: "#fafdff" }}>
                <Button onClick={onClose} color="inherit" variant="outlined" sx={{ borderRadius: 2, fontWeight: 600 }}>
                    Hủy
                </Button>
                <Button
                    onClick={handleUpdate}
                    variant="contained"
                    color="info"
                    sx={{ borderRadius: 2, minWidth: 120, fontWeight: 700, fontSize: 17, boxShadow: 3 }}
                    disabled={isLoadingOptions || isSubmitting}
                >
                    {isSubmitting ? <CircularProgress size={24} color="inherit" /> : "Cập nhật"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

ProductDetailUpdateModal.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    detail: PropTypes.object,
    onSuccess: PropTypes.func,
};

ProductDetailUpdateModal.defaultProps = {
    detail: {},
    onSuccess: undefined,
};

export default ProductDetailUpdateModal;