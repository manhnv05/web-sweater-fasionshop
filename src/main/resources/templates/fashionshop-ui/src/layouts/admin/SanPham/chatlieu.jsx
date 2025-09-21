import React, { useState, useEffect } from "react";
import Card from "@mui/material/Card";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import Input from "@mui/material/Input";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import SoftBox from "../../../components/SoftBox";
import DashboardLayout from "../../../examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "../../../examples/Navbars/DashboardNavbar";
import Footer from "../../../examples/Footer";
import Icon from "@mui/material/Icon";
import Table from "../../../examples/Tables/Table";
import { FaQrcode, FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import CloseIcon from "@mui/icons-material/Close";
import { toast } from "react-toastify";

const statusList = ["Tất cả", 1, 0];
const viewOptions = [5, 10, 20];

const getStatusText = (value) => {
    if (value === 1 || value === "1" || value === "Hiển thị") return "Hiển thị";
    if (value === 0 || value === "0" || value === "Ẩn") return "Ẩn";
    return value;
};

function getPaginationItems(current, total) {
    if (total <= 5) return Array.from({ length: total }, (_, index) => index);
    if (current <= 1) return [0, 1, "...", total - 2, total - 1];
    if (current >= total - 2) return [0, 1, "...", total - 2, total - 1];
    return [0, 1, "...", current, "...", total - 2, total - 1];
}

function generateMaterialCode(existingList = []) {
    const numbers = existingList
        .map((item) => {
            const match = /^CL(\d{4})$/.exec(item.maChatLieu || "");
            return match ? parseInt(match[1], 10) : null;
        })
        .filter((number) => number !== null)
        .sort((a, b) => a - b);

    let next = 1;
    for (let index = 0; index < numbers.length; index++) {
        if (numbers[index] !== index + 1) {
            next = index + 1;
            break;
        }
        next = numbers.length + 1;
    }
    return "CL" + String(next).padStart(4, "0");
}

function MaterialTable() {
    const [queryParams, setQueryParams] = useState({
        tenChatLieu: "",
        trangThai: "Tất cả",
        page: 0,
        size: 5,
    });

    const [materialsData, setMaterialsData] = useState({
        content: [],
        totalPages: 1,
        number: 0,
        first: true,
        last: true,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [newMaterial, setNewMaterial] = useState({
        maChatLieu: "",
        tenChatLieu: "",
        trangThai: 1,
    });

    const [editMaterial, setEditMaterial] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);

    const [deleteId, setDeleteId] = useState(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const [anchorEl, setAnchorEl] = useState(null);

    useEffect(() => {
        if (showModal && materialsData.content) {
            setNewMaterial((previous) => ({
                ...previous,
                maChatLieu: generateMaterialCode(materialsData.content),
            }));
        }
    }, [showModal, materialsData.content]);

    useEffect(() => {
        setLoading(true);
        setError("");
        let url = `http://localhost:8080/chatLieu?page=${queryParams.page}&size=${queryParams.size}`;
        if (queryParams.tenChatLieu)
            url += `&tenChatLieu=${encodeURIComponent(queryParams.tenChatLieu)}`;
        if (queryParams.trangThai !== "Tất cả")
            url += `&trangThai=${queryParams.trangThai}`;
        fetch(url, {
            credentials: "include", // <-- Thêm dòng này để gửi cookie JSESSIONID cho backend
        })
            .then((response) => {
                if (!response.ok) throw new Error("Lỗi khi tải dữ liệu chất liệu");
                return response.json();
            })
            .then((data) => setMaterialsData(data))
            .catch((err) => setError(err.message || "Lỗi không xác định"))
            .finally(() => setLoading(false));
    }, [queryParams]);


    const handleAddMaterial = () => {
        if (!newMaterial.tenChatLieu) {
            toast.error("Tên chất liệu không được để trống");
            return;
        }
        setLoading(true);
        fetch("http://localhost:8080/chatLieu", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...newMaterial,
                trangThai: Number(newMaterial.trangThai),
            }),
            credentials: "include",
        })
            .then(async (response) => {
            let responseBody;

            try {
                responseBody = await response.json(); // 👈 đọc body dù là lỗi
            } catch (err) {
                throw new Error("Không đọc được phản hồi từ server");
            }

            if (!response.ok) {
               let message =
            responseBody?.errors?.tenChatLieu || responseBody?.message || "Lỗi không xác định";
                throw new Error(message);
            }

            return responseBody;
        })
            .then(() => {
                setShowModal(false);
                setNewMaterial({ maChatLieu: "", tenChatLieu: "", trangThai: 1 });
                setQueryParams({ ...queryParams, page: 0 });
                toast.success("Thêm chất liệu thành công!");
            })
            .catch((err) => {
                setError(err.message || "Lỗi không xác định");
                toast.error(err.message || "Lỗi không xác định");
            })
            .finally(() => setLoading(false));
    };

    const handleEditClick = (material) => {
        setEditMaterial({ ...material });
        setShowEditModal(true);
    };

    const handleSaveEdit = () => {
        if (!editMaterial.tenChatLieu) {
            toast.error("Tên chất liệu không được để trống");
            return;
        }
        setLoading(true);
        fetch(`http://localhost:8080/chatLieu/${editMaterial.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...editMaterial,
                trangThai: Number(editMaterial.trangThai),
            }),
            credentials: "include",
        })
            .then((response) => {
                if (!response.ok) throw new Error("Lỗi khi cập nhật chất liệu");
                return response.text();
            })
            .then(() => {
                setShowEditModal(false);
                setEditMaterial(null);
                setQueryParams({ ...queryParams });
                toast.success("Cập nhật chất liệu thành công!");
            })
            .catch((err) => {
                setError(err.message || "Lỗi không xác định");
                toast.error(err.message || "Lỗi không xác định");
            })
            .finally(() => setLoading(false));
    };

    const handleDelete = (id) => {
        setDeleteId(id);
        setShowDeleteDialog(true);
    };

    const handleConfirmDelete = () => {
        setLoading(true);
        fetch(`http://localhost:8080/chatLieu/${deleteId}`, {
            method: "DELETE",
            credentials: "include",
        })
            .then((response) => {
                if (!response.ok) throw new Error("Lỗi khi xóa chất liệu");
                setShowDeleteDialog(false);
                setDeleteId(null);
                setQueryParams({ ...queryParams });
                toast.success("Xóa chất liệu thành công!");
            })
            .catch((err) => {
                setError(err.message || "Lỗi không xác định");
                toast.error(err.message || "Lỗi không xác định");
            })
            .finally(() => setLoading(false));
    };

    const handlePageChange = (newPage) => {
        setQueryParams({ ...queryParams, page: newPage });
    };

    const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);

    const columns = [
        { name: "stt", label: "STT", align: "center", width: "60px" },
        { name: "maChatLieu", label: "Mã", align: "left", width: "100px" },
        { name: "tenChatLieu", label: "Tên", align: "left", width: "180px" },
        {
            name: "trangThai",
            label: "Trạng thái",
            align: "center",
            width: "120px",
            render: (value) => (
                <span
                    style={{
                        background: getStatusText(value) === "Hiển thị" ? "#e6f4ea" : "#f4f6fb",
                        color: getStatusText(value) === "Hiển thị" ? "#219653" : "#bdbdbd",
                        border: `1px solid ${getStatusText(value) === "Hiển thị" ? "#219653" : "#bdbdbd"}`,
                        borderRadius: 6,
                        fontWeight: 500,
                        padding: "2px 12px",
                        fontSize: 13,
                        display: "inline-block",
                        minWidth: 60,
                        textAlign: "center",
                    }}
                >
                    {getStatusText(value)}
                </span>
            ),
        },
        {
            name: "actions",
            label: "Thao tác",
            align: "center",
            width: "110px",
            render: (_, row) => (
                <SoftBox display="flex" gap={0.5} justifyContent="center">
                    <IconButton
                        size="small"
                        sx={{ color: "#4acbf2" }}
                        title="Sửa"
                        onClick={() => handleEditClick(row)}
                    >
                        <FaEdit />
                    </IconButton>
                    <IconButton
                        size="small"
                        sx={{ color: "#4acbf2" }}
                        title="Xóa"
                        onClick={() => handleDelete(row.id)}
                    >
                        <FaTrash />
                    </IconButton>
                </SoftBox>
            ),
        },
    ];

    const rows =
        materialsData.content && materialsData.content.length
            ? materialsData.content.map((material, index) => ({
                ...material,
                stt: queryParams.page * queryParams.size + index + 1,
            }))
            : [];

    const renderAddMaterialModal = () => (
        <Dialog open={showModal} onClose={() => setShowModal(false)} maxWidth="xs" fullWidth>
            <DialogTitle>
                Thêm mới chất liệu
                <IconButton
                    aria-label="close"
                    onClick={() => setShowModal(false)}
                    sx={{
                        position: "absolute",
                        right: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
                    }}
                    size="large"
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <FormControl fullWidth sx={{ mb: 2 }}>
                    <Input
                        placeholder="Tên chất liệu"
                        value={newMaterial.tenChatLieu}
                        onChange={(event) => setNewMaterial({ ...newMaterial, tenChatLieu: event.target.value })}
                    />
                </FormControl>
                <FormControl fullWidth sx={{ mb: 2 }}>
                    <Select
                        value={Number(newMaterial.trangThai)}
                        onChange={(event) => setNewMaterial({ ...newMaterial, trangThai: Number(event.target.value) })}
                        size="small"
                    >
                        <MenuItem value={1}>Hiển thị</MenuItem>
                        <MenuItem value={0}>Ẩn</MenuItem>
                    </Select>
                </FormControl>
            </DialogContent>
            <DialogActions>
                <Button variant="outlined" onClick={() => setShowModal(false)} disabled={loading}>
                    Đóng
                </Button>
                <Button variant="contained" onClick={handleAddMaterial} disabled={loading}>
                    {loading && <CircularProgress size={18} sx={{ marginRight: 1 }} />}
                    Thêm
                </Button>
            </DialogActions>
        </Dialog>
    );

    const renderEditMaterialModal = () => (
        <Dialog open={showEditModal} onClose={() => setShowEditModal(false)} maxWidth="xs" fullWidth>
            <DialogTitle>
                Sửa chất liệu
                <IconButton
                    aria-label="close"
                    onClick={() => setShowEditModal(false)}
                    sx={{
                        position: "absolute",
                        right: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
                    }}
                    size="large"
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <FormControl fullWidth sx={{ mb: 2 }}>
                    <Input
                        placeholder="Tên chất liệu"
                        value={editMaterial?.tenChatLieu || ""}
                        onChange={(event) => setEditMaterial({ ...editMaterial, tenChatLieu: event.target.value })}
                    />
                </FormControl>
                <FormControl fullWidth sx={{ mb: 2 }}>
                    <Select
                        value={Number(editMaterial?.trangThai)}
                        onChange={(event) => setEditMaterial({ ...editMaterial, trangThai: Number(event.target.value) })}
                        size="small"
                    >
                        <MenuItem value={1}>Hiển thị</MenuItem>
                        <MenuItem value={0}>Ẩn</MenuItem>
                    </Select>
                </FormControl>
            </DialogContent>
            <DialogActions>
                <Button variant="contained" onClick={handleSaveEdit} disabled={loading}>
                    {loading && <CircularProgress size={18} sx={{ marginRight: 1 }} />}
                    Lưu
                </Button>
            </DialogActions>
        </Dialog>
    );

    const renderDeleteDialog = () => (
        <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
            <DialogTitle
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingRight: 2,
                    fontWeight: 700,
                    fontSize: 20,
                    paddingBottom: 1,
                    paddingTop: 2,
                }}
            >
                <span>Bạn chắc chắn muốn xóa chất liệu này?</span>
                <IconButton
                    aria-label="close"
                    onClick={() => setShowDeleteDialog(false)}
                    sx={{
                        color: (theme) => theme.palette.grey[500],
                        marginLeft: 2,
                    }}
                    size="large"
                >
                    <CloseIcon sx={{ fontSize: 26 }} />
                </IconButton>
            </DialogTitle>
            <DialogActions sx={{ paddingBottom: 3, paddingTop: 1, justifyContent: "center" }}>
                <Button
                    variant="outlined"
                    onClick={() => setShowDeleteDialog(false)}
                    disabled={loading}
                    sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 400,
                        color: "#49a3f1",
                        borderColor: "#49a3f1",
                        boxShadow: "none",
                        background: "#fff",
                        marginRight: 1.5,
                        "&:hover": {
                            borderColor: "#1769aa",
                            background: "#f0f6fd",
                            color: "#1769aa",
                        },
                        "&.Mui-disabled": {
                            color: "#49a3f1",
                            borderColor: "#49a3f1",
                            opacity: 0.7,
                            background: "#fff",
                        },
                    }}
                >
                    Hủy
                </Button>
                <Button
                    variant="contained"
                    color="error"
                    onClick={handleConfirmDelete}
                    disabled={loading}
                    sx={{ borderRadius: 2, minWidth: 90, fontWeight: 500 }}
                >
                    {loading && <CircularProgress size={18} sx={{ marginRight: 1 }} />}
                    Xóa
                </Button>
            </DialogActions>
        </Dialog>
    );

    const paginationItems = getPaginationItems(
        materialsData.number,
        materialsData.totalPages || 1
    );

    return (
        <DashboardLayout>
            <DashboardNavbar />
            <SoftBox paddingY={3} sx={{ background: "#F4F6FB", minHeight: "100vh", userSelect: "none" }}>
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
                                placeholder="Tìm chất liệu"
                                value={queryParams.tenChatLieu}
                                onChange={(event) =>
                                    setQueryParams({
                                        ...queryParams,
                                        tenChatLieu: event.target.value,
                                        page: 0,
                                    })
                                }
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
                                    value={queryParams.trangThai}
                                    onChange={(event) =>
                                        setQueryParams({
                                            ...queryParams,
                                            trangThai: event.target.value,
                                            page: 0,
                                        })
                                    }
                                    size="small"
                                    displayEmpty
                                    sx={{ borderRadius: 2, background: "#f5f6fa", height: 40 }}
                                    inputProps={{ "aria-label": "Trạng thái" }}
                                >
                                    <MenuItem value="Tất cả">Tất cả</MenuItem>
                                    <MenuItem value={1}>Hiển thị</MenuItem>
                                    <MenuItem value={0}>Ẩn</MenuItem>
                                </Select>
                            </FormControl>
                        </SoftBox>
                        <SoftBox display="flex" alignItems="center" gap={1}>
                            <IconButton onClick={handleMenuOpen} sx={{ color: "#495057" }}>
                                <Icon fontSize="small">menu</Icon>
                            </IconButton>
                            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                                <MenuItem onClick={handleMenuClose} sx={{ color: "#384D6C" }}>
                                    <FaQrcode className="me-2" style={{ color: "#0d6efd" }} /> Quét mã
                                </MenuItem>
                                <MenuItem onClick={handleMenuClose} sx={{ color: "#384D6C" }}>
                                    <span style={{ color: "#27ae60", marginRight: 8 }}>📥</span> Export Excel
                                </MenuItem>
                            </Menu>
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
                                onClick={() => setShowModal(true)}
                            >
                                Thêm chất liệu
                            </Button>
                        </SoftBox>
                    </SoftBox>
                </Card>

                <Card sx={{ padding: { xs: 2, md: 3 }, marginBottom: 2 }}>
                    {error && (
                        <Alert severity="error" sx={{ marginBottom: 2 }}>
                            {error}
                        </Alert>
                    )}
                    <SoftBox>
                        <Table columns={columns} rows={rows} loading={loading} />
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
                                    value={queryParams.size}
                                    onChange={(event) =>
                                        setQueryParams({
                                            ...queryParams,
                                            size: Number(event.target.value),
                                            page: 0,
                                        })
                                    }
                                    size="small"
                                >
                                    {viewOptions.map((number) => (
                                        <MenuItem key={number} value={number}>
                                            Xem {number}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </SoftBox>
                        <SoftBox display="flex" alignItems="center" gap={1}>
                            <Button
                                variant="text"
                                size="small"
                                disabled={materialsData.first}
                                onClick={() => handlePageChange(queryParams.page - 1)}
                                sx={{ color: materialsData.first ? "#bdbdbd" : "#49a3f1" }}
                            >
                                Trước
                            </Button>
                            {paginationItems.map((item, index) =>
                                item === "..." ? (
                                    <Button
                                        key={`ellipsis-${index}`}
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
                                ) : (
                                    <Button
                                        key={item}
                                        variant={materialsData.number === item ? "contained" : "text"}
                                        color={materialsData.number === item ? "info" : "inherit"}
                                        size="small"
                                        onClick={() => handlePageChange(item)}
                                        sx={{
                                            minWidth: 32,
                                            borderRadius: 2,
                                            color: materialsData.number === item ? "#fff" : "#495057",
                                            background: materialsData.number === item ? "#49a3f1" : "transparent",
                                        }}
                                    >
                                        {item + 1}
                                    </Button>
                                )
                            )}
                            <Button
                                variant="text"
                                size="small"
                                disabled={materialsData.last}
                                onClick={() => handlePageChange(queryParams.page + 1)}
                                sx={{ color: materialsData.last ? "#bdbdbd" : "#49a3f1" }}
                            >
                                Sau
                            </Button>
                        </SoftBox>
                    </SoftBox>
                </Card>
                {renderAddMaterialModal()}
                {renderEditMaterialModal()}
                {renderDeleteDialog()}
            </SoftBox>
            <Footer />
        </DashboardLayout>
    );
}

export default MaterialTable;