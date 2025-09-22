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

const getTrangThaiText = (val) => {
    if (val === 1 || val === "1" || val === "Hiển thị") return "Hiển thị";
    if (val === 0 || val === "0" || val === "Ẩn") return "Ẩn";
    return val;
};

function getPaginationItems(current, total) {
    if (total <= 5) return Array.from({ length: total }, (_, i) => i);
    if (current <= 1) return [0, 1, "...", total - 2, total - 1];
    if (current >= total - 2) return [0, 1, "...", total - 2, total - 1];
    return [0, 1, "...", current, "...", total - 2, total - 1];
}

function generateMaCoAo(existingList = []) {
    const numbers = existingList
        .map((item) => {
            const match = /^CA(\d{4})$/.exec(item.ma || "");
            return match ? parseInt(match[1], 10) : null;
        })
        .filter((num) => num !== null)
        .sort((a, b) => a - b);
    let next = 1;
    for (let i = 0; i < numbers.length; i++) {
        if (numbers[i] !== i + 1) {
            next = i + 1;
            break;
        }
        next = numbers.length + 1;
    }
    return "CA" + String(next).padStart(4, "0");
}

function CollarTable() {
    const [queryParams, setQueryParams] = useState({
        tenCoAo: "",
        trangThai: "Tất cả",
        page: 0,
        size: 5,
    });

    const [collarsData, setCollarsData] = useState({
        content: [],
        totalPages: 1,
        number: 0,
        first: true,
        last: true,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [newCollar, setNewCollar] = useState({
        ma: "",
        tenCoAo: "",
        trangThai: 1,
    });

    const [editCollar, setEditCollar] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);


    useEffect(() => {
        if (showModal && collarsData.content) {
            setNewCollar((prev) => ({
                ...prev,
                ma: generateMaCoAo(collarsData.content),
            }));
        }
    }, [showModal, collarsData.content]);

    useEffect(() => {
        setLoading(true);
        setError("");
        let url = `http://localhost:8080/coAo?page=${queryParams.page}&size=${queryParams.size}`;
        if (queryParams.tenCoAo)
            url += `&tenCoAo=${encodeURIComponent(queryParams.tenCoAo)}`;
        if (queryParams.trangThai !== "Tất cả")
            url += `&trangThai=${queryParams.trangThai}`;
        fetch(url, {
            credentials: "include", // <-- Thêm dòng này để gửi cookie JSESSIONID cho backend
        })
            .then((res) => {
                if (!res.ok) throw new Error("Lỗi khi tải dữ liệu cổ áo");
                return res.json();
            })
            .then((data) => setCollarsData(data))
            .catch((err) => setError(err.message || "Lỗi không xác định"))
            .finally(() => setLoading(false));
    }, [queryParams]);

    const handleAddCollar = () => {
        if (!newCollar.tenCoAo) {
            toast.error("Tên cổ áo không được để trống");
            return;
        }
        setLoading(true);
        fetch("http://localhost:8080/coAo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...newCollar,
                trangThai: Number(newCollar.trangThai),
            }),
            credentials: "include",
        })
            .then(async (res) => {
        let responseBody;

        try {
          responseBody = await res.json(); // 👈 Đọc body JSON
        } catch (err) {
          throw new Error("Không thể đọc phản hồi từ server");
        }
        
        if (!res.ok) {
          // 👇 Lấy message từ các trường phù hợp
           let message =
            responseBody?.errors?.tenCoAo || responseBody?.message || "Lỗi không xác định";
                throw new Error(message);
        }

        return responseBody;
            })
            .then(() => {
                setShowModal(false);
                setNewCollar({ ma: "", tenCoAo: "", trangThai: 1 });
                setQueryParams({ ...queryParams, page: 0 });
                toast.success("Thêm cổ áo thành công!");
            })
            .catch((err) => {
                setError(err.message || "Lỗi không xác định");
                toast.error(err.message || "Lỗi không xác định");
            })
            .finally(() => setLoading(false));
    };

    const handleEditClick = (collar) => {
        setEditCollar({ ...collar });
        setShowEditModal(true);
    };

    const handleSaveEdit = () => {
        if (!editCollar.tenCoAo) {
            toast.error("Tên cổ áo không được để trống");
            return;
        }
        setLoading(true);
        fetch(`http://localhost:8080/coAo/${editCollar.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...editCollar,
                trangThai: Number(editCollar.trangThai),
            }),
            credentials: "include",
        })
            .then((res) => {
                if (!res.ok) throw new Error("Lỗi khi cập nhật cổ áo");
                return res.text();
            })
            .then(() => {
                setShowEditModal(false);
                setEditCollar(null);
                setQueryParams({ ...queryParams });
                toast.success("Cập nhật cổ áo thành công!");
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

    const columns = [
        { name: "stt", label: "STT", align: "center", width: "60px" },
        { name: "ma", label: "Mã", align: "left", width: "100px" },
        { name: "tenCoAo", label: "Tên", align: "left", width: "180px" },
        {
            name: "trangThai",
            label: "Trạng thái",
            align: "center",
            width: "120px",
            render: (value) => (
                <span
                    style={{
                        background: getTrangThaiText(value) === "Hiển thị" ? "#e6f4ea" : "#f4f6fb",
                        color: getTrangThaiText(value) === "Hiển thị" ? "#219653" : "#bdbdbd",
                        border: `1px solid ${getTrangThaiText(value) === "Hiển thị" ? "#219653" : "#bdbdbd"}`,
                        borderRadius: 6,
                        fontWeight: 500,
                        padding: "2px 12px",
                        fontSize: 13,
                        display: "inline-block",
                        minWidth: 60,
                        textAlign: "center",
                    }}
                >
                    {getTrangThaiText(value)}
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
                </SoftBox>
            ),
        },
    ];

    const rows =
        collarsData.content && collarsData.content.length
            ? collarsData.content.map((collar, idx) => ({
                ...collar,
                stt: queryParams.page * queryParams.size + idx + 1,
            }))
            : [];

    const renderAddCollarModal = () => (
        <Dialog open={showModal} onClose={() => setShowModal(false)} maxWidth="xs" fullWidth>
            <DialogTitle>
                Thêm mới cổ áo
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
                        placeholder="Tên cổ áo"
                        value={newCollar.tenCoAo}
                        onChange={(e) => setNewCollar({ ...newCollar, tenCoAo: e.target.value })}
                    />
                </FormControl>
                <FormControl fullWidth sx={{ mb: 2 }}>
                    <Select
                        value={Number(newCollar.trangThai)}
                        onChange={(e) => setNewCollar({ ...newCollar, trangThai: Number(e.target.value) })}
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
                <Button variant="contained" onClick={handleAddCollar} disabled={loading}>
                    {loading && <CircularProgress size={18} sx={{ mr: 1 }} />}
                    Thêm
                </Button>
            </DialogActions>
        </Dialog>
    );

    const renderEditCollarModal = () => (
        <Dialog open={showEditModal} onClose={() => setShowEditModal(false)} maxWidth="xs" fullWidth>
            <DialogTitle>
                Sửa cổ áo
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
                        placeholder="Tên cổ áo"
                        value={editCollar?.tenCoAo || ""}
                        onChange={(e) => setEditCollar({ ...editCollar, tenCoAo: e.target.value })}
                    />
                </FormControl>
                <FormControl fullWidth sx={{ mb: 2 }}>
                    <Select
                        value={Number(editCollar?.trangThai)}
                        onChange={(e) => setEditCollar({ ...editCollar, trangThai: Number(e.target.value) })}
                        size="small"
                    >
                        <MenuItem value={1}>Hiển thị</MenuItem>
                        <MenuItem value={0}>Ẩn</MenuItem>
                    </Select>
                </FormControl>
            </DialogContent>
            <DialogActions>
                <Button variant="contained" onClick={handleSaveEdit} disabled={loading}>
                    {loading && <CircularProgress size={18} sx={{ mr: 1 }} />}
                    Lưu
                </Button>
            </DialogActions>
        </Dialog>
    );

    const paginationItems = getPaginationItems(collarsData.number, collarsData.totalPages || 1);

    return (
        <DashboardLayout>
            <DashboardNavbar />
            <SoftBox py={3} sx={{ background: "#F4F6FB", minHeight: "100vh", userSelect: "none" }}>
                <Card sx={{ p: { xs: 2, md: 3 }, mb: 2 }}>
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
                                placeholder="Tìm cổ áo"
                                value={queryParams.tenCoAo}
                                onChange={(e) =>
                                    setQueryParams({
                                        ...queryParams,
                                        tenCoAo: e.target.value,
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
                                sx={{ background: "#f5f6fa", borderRadius: 2, p: 0.5, color: "#222" }}
                            />
                            <FormControl sx={{ minWidth: 140 }}>
                                <Select
                                    value={queryParams.trangThai}
                                    onChange={(e) =>
                                        setQueryParams({
                                            ...queryParams,
                                            trangThai: e.target.value,
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
                                Thêm cổ áo
                            </Button>
                        </SoftBox>
                    </SoftBox>
                </Card>

                <Card sx={{ p: { xs: 2, md: 3 }, mb: 2 }}>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
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
                        mt={2}
                        flexWrap="wrap"
                        gap={2}
                    >
                        <SoftBox>
                            <FormControl sx={{ minWidth: 120 }}>
                                <Select
                                    value={queryParams.size}
                                    onChange={(e) =>
                                        setQueryParams({
                                            ...queryParams,
                                            size: Number(e.target.value),
                                            page: 0,
                                        })
                                    }
                                    size="small"
                                >
                                    {viewOptions.map((n) => (
                                        <MenuItem key={n} value={n}>
                                            Xem {n}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </SoftBox>
                        <SoftBox display="flex" alignItems="center" gap={1}>
                            <Button
                                variant="text"
                                size="small"
                                disabled={collarsData.first}
                                onClick={() => handlePageChange(queryParams.page - 1)}
                                sx={{ color: collarsData.first ? "#bdbdbd" : "#49a3f1" }}
                            >
                                Trước
                            </Button>
                            {paginationItems.map((item, idx) =>
                                item === "..." ? (
                                    <Button
                                        key={`ellipsis-${idx}`}
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
                                        variant={collarsData.number === item ? "contained" : "text"}
                                        color={collarsData.number === item ? "info" : "inherit"}
                                        size="small"
                                        onClick={() => handlePageChange(item)}
                                        sx={{
                                            minWidth: 32,
                                            borderRadius: 2,
                                            color: collarsData.number === item ? "#fff" : "#495057",
                                            background: collarsData.number === item ? "#49a3f1" : "transparent",
                                        }}
                                    >
                                        {item + 1}
                                    </Button>
                                )
                            )}
                            <Button
                                variant="text"
                                size="small"
                                disabled={collarsData.last}
                                onClick={() => handlePageChange(queryParams.page + 1)}
                                sx={{ color: collarsData.last ? "#bdbdbd" : "#49a3f1" }}
                            >
                                Sau
                            </Button>
                        </SoftBox>
                    </SoftBox>
                </Card>
                {renderAddCollarModal()}
                {renderEditCollarModal()}
            </SoftBox>
            <Footer />
        </DashboardLayout>
    );
}

export default CollarTable;