import React, { useState, useEffect } from "react";
import Card from "@mui/material/Card";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import Input from "@mui/material/Input";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import SoftBox from "../../../components/SoftBox";
import DashboardLayout from "../../../examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "../../../examples/Navbars/DashboardNavbar";
import Footer from "../../../examples/Footer";
import Icon from "@mui/material/Icon";
import Table from "../../../examples/Tables/Table";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaEye, FaEdit, FaTrash } from "react-icons/fa";
import axios from "axios";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import MenuItemMui from "@mui/material/MenuItem";
import ReactSelect from "react-select";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import Divider from "@mui/material/Divider";
import DialogContentText from "@mui/material/DialogContentText";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const selectMenuStyle = {
    menu: (base) => ({
        ...base,
        borderRadius: 12,
        zIndex: 25,
        boxShadow: "0 6px 24px 0 rgba(0,0,0,0.12)",
        fontSize: 16,
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

function getOptionByValue(options, value) {
    if (value === undefined || value === null || value === "") return null;
    return options.find(function (option) { return String(option.value) === String(value); }) || null;
}

function formatPrice(value) {
    if (value !== undefined && value !== null) {
        return value.toLocaleString("vi-VN") + " ₫";
    }
    return "";
}

function getTrangThaiText(status) {
    if (status === 1 || status === "Đang bán" || status === "Hiển thị") {
        return "Đang bán";
    }
    return "Ngừng bán";
}

const statusList = ["Tất cả", "Đang bán", "Ngừng bán"];
const viewOptions = [5, 10, 20];

function getPriceRangeText(min, max) {
    if (min === undefined && max === undefined) return "";
    if (min === max || max === undefined) return formatPrice(min);
    return formatPrice(min) + " - " + formatPrice(max);
}

function getPaginationItems(current, total) {
    if (total <= 4) return Array.from({ length: total }, function (_, i) { return i; });
    if (current <= 1) return [0, 1, "...", total - 2, total - 1];
    if (current >= total - 2) return [0, 1, "...", total - 2, total - 1];
    return [0, 1, "...", current, "...", total - 2, total - 1];
}

function validateEditForm(form) {
    const errors = {};
    if (!form.maSanPham || !form.maSanPham.trim()) {
        errors.maSanPham = "Vui lòng nhập mã sản phẩm";
    }
    if (!form.tenSanPham || !form.tenSanPham.trim()) {
        errors.tenSanPham = "Vui lòng nhập tên sản phẩm";
    }
    if (!form.idDanhMuc || !String(form.idDanhMuc).trim()) {
        errors.idDanhMuc = "Vui lòng chọn danh mục";
    }
    return errors;
}

function ProductTable() {
    const [productsData, setProductsData] = useState({
        content: [],
        totalPages: 0,
        number: 0,
        first: true,
        last: true,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("Tất cả");
    const [viewCount, setViewCount] = useState(5);
    const [page, setPage] = useState(0);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [editForm, setEditForm] = useState({
        tenSanPham: "",
        maSanPham: "",
        xuatXu: "",
        trangThai: 1,
        idDanhMuc: "",
        moTa: "",
    });
    const [editFormErrors, setEditFormErrors] = useState({});
    const [editSaving, setEditSaving] = useState(false);
    const [xuatXuList, setXuatXuList] = useState([]);
    const [danhMucList, setDanhMucList] = useState([]);
    const [danhMucOptions, setDanhMucOptions] = useState([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingProduct, setDeletingProduct] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(function () {
        async function fetchCountries() {
            try {
                const response = await axios.get("http://localhost:8080/xuatXu/quocGia", { withCredentials: true });
                setXuatXuList(response.data || []);
            } catch (error) {
                setXuatXuList([]);
            }
        }
        fetchCountries();
    }, []);

    useEffect(function () {
        async function fetchDanhMuc() {
            try {
                const response = await axios.get("http://localhost:8080/danhMuc/all", { withCredentials: true });
                setDanhMucList(response.data || []);
                setDanhMucOptions(
                    (response.data || []).map(function (danhMuc) {
                        return {
                            value: String(danhMuc.id),
                            label: danhMuc.tenDanhMuc
                        };
                    })
                );
            } catch (error) {
                setDanhMucList([]);
                setDanhMucOptions([]);
            }
        }
        fetchDanhMuc();
    }, []);

    async function fetchProducts() {
        setLoading(true);
        setError(null);
        try {
            let params = {
                page: page,
                size: viewCount,
                tenSanPham: search,
            };
            if (statusFilter !== "Tất cả") {
                params.trangThai = statusFilter === "Đang bán" ? 1 : 0;
            }
            const response = await axios.get("http://localhost:8080/sanPham", { params: params, withCredentials: true });
            const productList = (response.data.content || []).filter(function (product) {
                return product.trangThai === 0 || product.trangThai === 1;
            });
            const results = await Promise.all(
                productList.map(async function (product) {
                    try {
                        const detailResponse = await axios.get("http://localhost:8080/chiTietSanPham/by-san-pham/" + product.id, { withCredentials: true });
                        const detailList = detailResponse.data || [];
                        const totalQuantity = detailList.reduce(function (sum, detail) { return sum + (detail.soLuong || 0); }, 0);
                        let minPrice;
                        let maxPrice;
                        const prices = detailList
                            .filter(function (detail) { return detail.gia !== undefined && detail.gia !== null; })
                            .map(function (detail) { return detail.gia; });
                        if (prices.length > 0) {
                            minPrice = Math.min.apply(null, prices);
                            maxPrice = Math.max.apply(null, prices);
                        }
                        return {
                            id: product.id,
                            maSanPham: product.maSanPham,
                            tenSanPham: product.tenSanPham,
                            xuatXu: product.xuatXu,
                            trangThai: product.trangThai,
                            giaMin: minPrice,
                            giaMax: maxPrice,
                            quantity: totalQuantity,
                            idDanhMuc: product.danhMuc ? product.danhMuc.id : "",
                        };
                    } catch (error) {
                        return {
                            id: product.id,
                            maSanPham: product.maSanPham,
                            tenSanPham: product.tenSanPham,
                            xuatXu: product.xuatXu,
                            trangThai: product.trangThai,
                            giaMin: undefined,
                            giaMax: undefined,
                            quantity: 0,
                            idDanhMuc: product.danhMuc ? product.danhMuc.id : "",
                        };
                    }
                })
            );
            setProductsData({
                ...response.data,
                content: results,
            });
        } catch (error) {
            setError("Không thể tải dữ liệu. Vui lòng thử lại sau.");
            setProductsData({
                content: [],
                totalPages: 0,
                number: 0,
                first: true,
                last: true,
            });
        } finally {
            setLoading(false);
        }
    }

    useEffect(function () {
        fetchProducts();
    }, [search, statusFilter, viewCount, page]);

    function handlePageChange(newPage) {
        if (
            typeof newPage === "number" &&
            newPage >= 0 &&
            newPage < productsData.totalPages &&
            newPage !== page
        ) {
            setPage(newPage);
        }
    }

    function handleSearchChange(event) {
        setSearch(event.target.value);
        setPage(0);
    }

    function handleStatusFilterChange(event) {
        setStatusFilter(event.target.value);
        setPage(0);
    }

    function handleViewCountChange(event) {
        setViewCount(Number(event.target.value));
        setPage(0);
    }

    async function handleEditOpen(product) {
        setEditingProduct(product);
        setEditFormErrors({});
        try {
            const response = await axios.get("http://localhost:8080/sanPham/" + product.id, { withCredentials: true });
            const detail = response.data;
            setEditForm({
                tenSanPham: detail.tenSanPham || "",
                maSanPham: detail.maSanPham || "",
                xuatXu: detail.xuatXu || "",
                trangThai: detail.trangThai !== undefined ? detail.trangThai : 1,
                idDanhMuc: detail.idDanhMuc ? String(detail.idDanhMuc) : (detail.danhMuc && detail.danhMuc.id ? String(detail.danhMuc.id) : ""),
                moTa: detail.moTa || "",
            });
        } catch (error) {
            setEditForm({
                tenSanPham: product.tenSanPham || "",
                maSanPham: product.maSanPham || "",
                xuatXu: product.xuatXu || "",
                trangThai: product.trangThai !== undefined ? product.trangThai : 1,
                idDanhMuc: product.idDanhMuc ? String(product.idDanhMuc) : "",
                moTa: product.moTa || "",
            });
        }
        setEditModalOpen(true);
    }

    function handleEditClose() {
        setEditModalOpen(false);
        setEditingProduct(null);
        setEditForm({
            tenSanPham: "",
            maSanPham: "",
            xuatXu: "",
            trangThai: 1,
            idDanhMuc: "",
            moTa: "",
        });
        setEditFormErrors({});
    }

    function handleEditChange(event) {
        let value = event.target.value;
        if (event.target.name === "trangThai") {
            value = Number(value);
        }
        setEditForm({ ...editForm, [event.target.name]: value });
    }

    async function handleEditSave() {
        if (!editingProduct) return;
        setEditSaving(true);
        const errors = validateEditForm(editForm);
        setEditFormErrors(errors);
        if (Object.keys(errors).length > 0) {
            toast.error(Object.values(errors)[0]);
            setEditSaving(false);
            return;
        }
        try {
            await axios.put("http://localhost:8080/sanPham/" + editingProduct.id, {
                tenSanPham: editForm.tenSanPham,
                maSanPham: editForm.maSanPham,
                xuatXu: editForm.xuatXu,
                trangThai: editForm.trangThai,
                idDanhMuc: editForm.idDanhMuc,
                moTa: editForm.moTa,
            },{ withCredentials: true });
            handleEditClose();
            toast.success("Cập nhật sản phẩm thành công!");
            fetchProducts();
        } catch (error) {
            toast.error("Sửa sản phẩm thất bại!");
        } finally {
            setEditSaving(false);
        }
    }

    function handleDeleteOpen(product) {
        setDeletingProduct(product);
        setDeleteDialogOpen(true);
    }

    function handleDeleteClose() {
        setDeleteDialogOpen(false);
        setDeletingProduct(null);
    }

    async function handleDeleteConfirm() {
        if (!deletingProduct) return;
        setDeleteLoading(true);
        try {
            await axios.delete("http://localhost:8080/sanPham/" + deletingProduct.id, { withCredentials: true });
            handleDeleteClose();
            toast.success("Xóa sản phẩm thành công!");
            fetchProducts();
        } catch (error) {
            toast.error("Xóa sản phẩm thất bại!");
        } finally {
            setDeleteLoading(false);
        }
    }

    const columns = [
        { name: "stt", label: "STT", align: "center", width: "60px" },
        { name: "maSanPham", label: "Mã", align: "left", width: "110px" },
        { name: "tenSanPham", label: "Tên sản phẩm", align: "left", width: "180px" },
        {
            name: "gia",
            label: "Giá",
            align: "center",
            width: "180px",
            render: function (value, row) { return getPriceRangeText(row.giaMin, row.giaMax); },
        },
        {
            name: "quantity",
            label: "Số lượng",
            align: "center",
            width: "100px",
            render: function (value) { return value !== undefined && value !== null ? value : 0; },
        },
        {
            name: "status",
            label: "Trạng thái",
            align: "center",
            width: "120px",
            render: function (value) {
                return (
                    <span
                        style={{
                            background: getTrangThaiText(value) === "Đang bán" ? "#e6f4ea" : "#f4f6fb",
                            color: getTrangThaiText(value) === "Đang bán" ? "#219653" : "#bdbdbd",
                            border: "1px solid " + (getTrangThaiText(value) === "Đang bán" ? "#219653" : "#bdbdbd"),
                            borderRadius: 6,
                            fontWeight: 500,
                            padding: "2px 12px",
                            fontSize: 13,
                            display: "inline-block",
                        }}
                    >
                        {getTrangThaiText(value)}
                    </span>
                );
            },
        },
        {
            name: "actions",
            label: "Thao tác",
            align: "center",
            width: "110px",
            render: function (_, row) {
                return (
                    <SoftBox display="flex" gap={0.5} justifyContent="center">
                        <IconButton
                            size="small"
                            sx={{ color: "#4acbf2" }}
                            title="Chi tiết"
                            onClick={function () { navigate("/SanPham/ChiTietSanPham/" + row.id); }}
                        >
                            <FaEye />
                        </IconButton>
                        <IconButton
                            size="small"
                            sx={{ color: "#4acbf2" }}
                            title="Sửa"
                            onClick={function () { handleEditOpen(row); }}
                        >
                            <FaEdit />
                        </IconButton>
                        <IconButton
                            size="small"
                            sx={{ color: "#e74c3c" }}
                            title="Xóa"
                            onClick={function () { handleDeleteOpen(row); }}
                        >
                            <FaTrash />
                        </IconButton>
                    </SoftBox>
                );
            },
        },
    ];

    const rows = productsData.content.map(function (item, idx) {
        return {
            stt: page * viewCount + idx + 1,
            id: item.id,
            maSanPham: item.maSanPham,
            tenSanPham: item.tenSanPham,
            xuatXu: item.xuatXu,
            giaMin: item.giaMin,
            giaMax: item.giaMax,
            status: item.trangThai,
            quantity: item.quantity,
            idDanhMuc: item.idDanhMuc,
            actions: "",
        };
    });

    const paginationItems = getPaginationItems(productsData.number, productsData.totalPages);

    return (
        <DashboardLayout>
            <DashboardNavbar />
            <SoftBox py={3} sx={{ background: "#F4F6FB", minHeight: "100vh", userSelect: "none" }}>
                <Card sx={{ padding: { xs: 2, md: 3 }, marginBottom: 2 }}>
                    <SoftBox
                        display="flex"
                        flexDirection={{ xs: "column", md: "row" }}
                        alignItems="center"
                        justifyContent="space-between"
                        gap={2}
                    >
                        <SoftBox flex={1} display="flex" alignItems="center" gap={2} maxWidth={600}>
                            <Input
                                fullWidth
                                placeholder="Tìm kiếm sản phẩm"
                                value={search}
                                onChange={handleSearchChange}
                                startAdornment={
                                    <InputAdornment position="start">
                                        <Icon fontSize="small" sx={{ color: "#868686" }}>
                                            search
                                        </Icon>
                                    </InputAdornment>
                                }
                                sx={{ background: "#f5f6fa", borderRadius: 2, padding: 0.5, color: "#222" }}
                            />
                            <FormControl sx={{ minWidth: 140 }}>
                                <Select
                                    value={statusFilter}
                                    onChange={handleStatusFilterChange}
                                    size="small"
                                    displayEmpty
                                    sx={{ borderRadius: 2, background: "#f5f6fa", height: 40 }}
                                    inputProps={{ "aria-label": "Trạng thái" }}
                                >
                                    {statusList.map(function (status) {
                                        return (
                                            <MenuItem key={status} value={status}>
                                                {status}
                                            </MenuItem>
                                        );
                                    })}
                                </Select>
                            </FormControl>
                        </SoftBox>
                        <SoftBox display="flex" alignItems="center" gap={1}>
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<FaPlus />}
                                sx={{
                                    borderRadius: 2,
                                    textTransform: "none",
                                    fontWeight: 400,
                                    color: "#49a3f1",
                                    borderColor: "#49a3f1",
                                    boxShadow: "none",
                                    "&:hover": {
                                        borderColor: "#1769aa",
                                        background: "#f0f6fd",
                                        color: "#1769aa",
                                    },
                                }}
                                onClick={function () { navigate("/SanPham/ThemMoi"); }}
                            >
                                Thêm sản phẩm
                            </Button>
                        </SoftBox>
                    </SoftBox>
                </Card>
                <Card sx={{ padding: { xs: 2, md: 3 }, marginBottom: 2 }}>
                    <SoftBox>
                        {error ? (
                            <div className="alert alert-danger">{error}</div>
                        ) : (
                            <Table columns={columns} rows={rows} loading={loading} />
                        )}
                    </SoftBox>
                    <SoftBox
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        marginTop={2}
                        flexWrap="wrap"
                        gap={2}
                    >
                        <SoftBox>
                            <FormControl sx={{ minWidth: 120 }}>
                                <Select
                                    value={viewCount}
                                    onChange={handleViewCountChange}
                                    size="small"
                                >
                                    {viewOptions.map(function (number) {
                                        return (
                                            <MenuItem key={number} value={number}>
                                                Xem {number}
                                            </MenuItem>
                                        );
                                    })}
                                </Select>
                            </FormControl>
                        </SoftBox>
                        <SoftBox display="flex" alignItems="center" gap={1}>
                            <Button
                                variant="text"
                                size="small"
                                disabled={productsData.first}
                                onClick={function () { handlePageChange(page - 1); }}
                                sx={{ color: productsData.first ? "#bdbdbd" : "#49a3f1" }}
                            >
                                Trước
                            </Button>
                            {paginationItems.map(function (item, idx) {
                                if (item === "...") {
                                    return (
                                        <Button
                                            key={"ellipsis-" + idx}
                                            variant="text"
                                            size="small"
                                            disabled
                                            sx={{
                                                minWidth: 32,
                                                borderRadius: 2,
                                                color: "#bdbdbd",
                                                pointerEvents: "none",
                                                fontWeight: 700,
                                            }}
                                        >
                                            ...
                                        </Button>
                                    );
                                }
                                return (
                                    <Button
                                        key={item}
                                        variant={productsData.number === item ? "contained" : "text"}
                                        color={productsData.number === item ? "info" : "inherit"}
                                        size="small"
                                        onClick={function () { handlePageChange(item); }}
                                        sx={{
                                            minWidth: 32,
                                            borderRadius: 2,
                                            color: productsData.number === item ? "#fff" : "#495057",
                                            background: productsData.number === item ? "#49a3f1" : "transparent",
                                        }}
                                    >
                                        {item + 1}
                                    </Button>
                                );
                            })}
                            <Button
                                variant="text"
                                size="small"
                                disabled={productsData.last}
                                onClick={function () { handlePageChange(page + 1); }}
                                sx={{ color: productsData.last ? "#bdbdbd" : "#49a3f1" }}
                            >
                                Sau
                            </Button>
                        </SoftBox>
                    </SoftBox>
                </Card>
            </SoftBox>
            <Dialog open={editModalOpen} onClose={handleEditClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4, background: "#fafdff" } }}>
                <DialogTitle sx={{ fontWeight: 800, fontSize: 26, paddingBottom: 1, color: "#1976d2", letterSpacing: 0.5 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <span>Cập nhật sản phẩm</span>
                        <IconButton
                            aria-label="close"
                            onClick={handleEditClose}
                            sx={{
                                color: "#eb5757",
                                marginLeft: 1,
                                background: "#f5f6fa",
                                "&:hover": { background: "#ffeaea" }
                            }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <Divider sx={{ marginBottom: 1 }} />
                <DialogContent sx={{ background: "#f7fbff", paddingBottom: 2 }}>
                    <Box display="flex" flexDirection="column" gap={2}>
                        <Box>
                            <Typography fontWeight={700} marginBottom={0.5} color="#1769aa">
                                Tên sản phẩm <span style={{ color: "#e74c3c" }}>*</span>
                            </Typography>
                            <TextField
                                value={editForm.tenSanPham}
                                name="tenSanPham"
                                onChange={handleEditChange}
                                fullWidth
                                size="small"
                                placeholder="Nhập tên sản phẩm"
                                sx={{ background: "#fff", borderRadius: 2 }}
                                error={!!editFormErrors.tenSanPham}
                                helperText={editFormErrors.tenSanPham}
                            />
                        </Box>
                        <Box>
                            <Typography fontWeight={700} marginBottom={0.5} color="#1769aa">
                                Xuất xứ
                            </Typography>
                            <FormControl fullWidth size="small" sx={{ background: "#fff", borderRadius: 2 }}>
                                <Select
                                    name="xuatXu"
                                    value={editForm.xuatXu}
                                    onChange={handleEditChange}
                                    displayEmpty
                                    inputProps={{ "aria-label": "Xuất xứ" }}
                                >
                                    <MenuItemMui value=""><em>Chọn xuất xứ</em></MenuItemMui>
                                    {xuatXuList.map(function (xuatXu) {
                                        return (
                                            <MenuItemMui key={xuatXu} value={xuatXu}>{xuatXu}</MenuItemMui>
                                        );
                                    })}
                                </Select>
                            </FormControl>
                        </Box>
                        <Box>
                            <Typography fontWeight={700} marginBottom={0.5} color="#1769aa">
                                Danh mục <span style={{ color: "#e74c3c" }}>*</span>
                            </Typography>
                            <ReactSelect
                                options={danhMucOptions}
                                value={getOptionByValue(danhMucOptions, editForm.idDanhMuc)}
                                onChange={function (option) { setEditForm({ ...editForm, idDanhMuc: option ? option.value : "" }); }}
                                styles={{
                                    ...selectMenuStyle,
                                    control: (base, state) => ({
                                        ...base,
                                        borderColor: editFormErrors.idDanhMuc ? "#e74c3c" : base.borderColor,
                                        boxShadow: "none",
                                        "&:hover": { borderColor: "#1769aa" }
                                    }),
                                }}
                                isClearable
                                placeholder="Chọn danh mục"
                                noOptionsMessage={function () { return "Không có dữ liệu"; }}
                            />
                            {editFormErrors.idDanhMuc && (
                                <Box sx={{ color: "#e74c3c", fontSize: 13, mt: 0.5 }}>
                                    {editFormErrors.idDanhMuc}
                                </Box>
                            )}
                        </Box>
                        <Box>
                            <Typography fontWeight={700} marginBottom={0.5} color="#1769aa">
                                Mô tả
                            </Typography>
                            <TextField
                                value={editForm.moTa}
                                name="moTa"
                                onChange={handleEditChange}
                                fullWidth
                                size="small"
                                placeholder="Nhập mô tả"
                                multiline
                                minRows={3}
                                sx={{ background: "#fff", borderRadius: 2 }}
                                error={!!editFormErrors.moTa}
                                helperText={editFormErrors.moTa}
                            />
                        </Box>
                        <Box>
                            <Typography fontWeight={700} marginBottom={0.5} color="#1769aa">
                                Trạng thái
                            </Typography>
                            <FormControl fullWidth size="small" sx={{ background: "#fff", borderRadius: 2 }}>
                                <Select
                                    name="trangThai"
                                    value={editForm.trangThai}
                                    onChange={handleEditChange}
                                >
                                    <MenuItemMui value={1}>Đang bán</MenuItemMui>
                                    <MenuItemMui value={0}>Ngừng bán</MenuItemMui>
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ padding: 2, background: "#fafdff", borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}>
                    <Button onClick={handleEditClose} disabled={editSaving} color="inherit" variant="outlined" sx={{ borderRadius: 2, fontWeight: 600 }}>
                        Hủy
                    </Button>
                    <Button onClick={handleEditSave} disabled={editSaving} variant="contained" color="info" sx={{ borderRadius: 2, minWidth: 120, fontWeight: 700, fontSize: 17, boxShadow: 3 }} startIcon={editSaving ? <CircularProgress size={18} color="inherit" /> : null}>
                        Lưu
                    </Button>
                </DialogActions>
            </Dialog>
            <Dialog open={deleteDialogOpen} onClose={handleDeleteClose} maxWidth="xs" fullWidth>
                <DialogTitle fontWeight={800} color="#e74c3c" sx={{ fontSize: 22 }}>
                    Xác nhận xóa sản phẩm
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Bạn có chắc chắn muốn xóa sản phẩm <strong>{deletingProduct && deletingProduct.tenSanPham}</strong> không? Thao tác này không thể hoàn tác.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ padding: 2 }}>
                    <Button onClick={handleDeleteClose} disabled={deleteLoading} variant="outlined" color="inherit" sx={{ borderRadius: 2, fontWeight: 600 }}>
                        Hủy
                    </Button>
                    <Button onClick={handleDeleteConfirm} disabled={deleteLoading} variant="contained" color="error" sx={{ borderRadius: 2, minWidth: 110, fontWeight: 700 }} startIcon={deleteLoading ? <CircularProgress size={18} color="inherit" /> : null}>
                        Xóa
                    </Button>
                </DialogActions>
            </Dialog>
            <Footer />
        </DashboardLayout>
    );
}

export default ProductTable;