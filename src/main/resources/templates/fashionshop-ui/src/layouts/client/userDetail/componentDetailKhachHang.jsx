import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import CircularProgress from "@mui/material/CircularProgress";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { styled } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import BadgeIcon from "@mui/icons-material/Badge";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

// API endpoint
const khachHangDetailAPI = "http://localhost:8080/khachHang";

// Styled Components
const StyledCard = styled(Card)(({ theme }) => ({
    borderRadius: 32,
    background: "rgba(255,255,255,0.85)",
    boxShadow: "0 16px 50px 0 rgba(23,105,170,0.13)",
    padding: theme.spacing(5),
    position: "relative",
    overflow: "visible",
    width: "100%",
    maxWidth: "1200px",
    margin: "0 auto",
    border: "0px solid rgba(23, 105, 170, 0.1)",
    minHeight: "calc(100vh - 80px)",
    [theme.breakpoints.down('md')]: {
        padding: theme.spacing(2),
        margin: theme.spacing(1)
    },
}));

const ProfileSection = styled(Box)(({ theme }) => ({
    background: "linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)",
    borderRadius: 24,
    padding: theme.spacing(4),
    textAlign: "center",
    position: "relative",
    boxShadow: "0 6px 24px rgba(76,110,245,0.09)",
    marginBottom: theme.spacing(2),
    "&::before": {
        content: '""',
        position: "absolute",
        top: 0, left: 0, right: 0, bottom: 0,
        background: "linear-gradient(45deg, rgba(23,105,170,0.08) 0%, rgba(156,39,176,0.07) 100%)",
        borderRadius: 24,
        zIndex: 0,
    },
}));

const InfoCard = styled(Paper)(({ theme }) => ({
    background: "rgba(255,255,255,0.85)",
    borderRadius: 18,
    padding: theme.spacing(3),
    border: "1px solid rgba(23, 105, 170, 0.08)",
    transition: "all 0.3s",
    boxShadow: "0 4px 18px rgba(23,105,170,0.07)",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    "&:hover": {
        transform: "translateY(-2px)",
        boxShadow: "0 12px 32px rgba(23,105,170,0.13)",
        background: "linear-gradient(90deg, #f9fbfc 60%, #eef7ff 100%)"
    },
}));

const StatusChip = styled(Chip)(({ status, theme }) => {
    let isActive = false;
    if (typeof status === "number") isActive = status === 1;
    else if (typeof status === "string") {
        const st = status.trim().toLowerCase();
        isActive = st === "1" || st === "online" || st === "đang hoạt động" || st === "active";
    }
    return {
        fontWeight: 700,
        fontSize: "1rem",
        padding: "6px 14px",
        borderRadius: 24,
        backgroundColor: isActive
            ? "rgba(76,175,80,0.14)"
            : "rgba(244,67,54,0.13)",
        color: isActive
            ? theme.palette.success.main
            : theme.palette.error.main,
        border: `1.5px solid ${isActive
            ? theme.palette.success.main
            : theme.palette.error.main}`,
    };
});

const GenderChip = styled(Chip)(({ gender, theme }) => {
    let isMale = false;
    if (typeof gender === "number") isMale = gender === 1;
    else if (typeof gender === "string") {
        const gt = gender.trim().toLowerCase();
        isMale = gt === "nam" || gt === "male";
    }
    return {
        fontWeight: 700,
        fontSize: "1rem",
        padding: "6px 14px",
        borderRadius: 24,
        backgroundColor: isMale
            ? "rgba(33,150,243,0.12)"
            : "rgba(233,30,99,0.14)",
        color: isMale
            ? theme.palette.primary.main
            : theme.palette.secondary.main,
        border: `1.5px solid ${isMale
            ? theme.palette.primary.main
            : theme.palette.secondary.main}`,
    };
});

// Utility functions
function formatDate(dateString) {
    if (!dateString) return "Chưa cập nhật";
    try {
        let parts = [];
        if (typeof dateString === 'string' && dateString.includes('-')) {
            parts = dateString.split('-');
            if (parts.length === 3) {
                if (parts[0].length === 4) {
                    const year = parseInt(parts[0], 10);
                    const month = parseInt(parts[1], 10) - 1;
                    const day = parseInt(parts[2], 10);
                    const date = new Date(year, month, day);
                    if (!isNaN(date.getTime())) {
                        return date.toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                        });
                    }
                }
                if (parts[2].length === 4) {
                    const day = parseInt(parts[0], 10);
                    const month = parseInt(parts[1], 10) - 1;
                    const year = parseInt(parts[2], 10);
                    const date = new Date(year, month, day);
                    if (!isNaN(date.getTime())) {
                        return date.toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                        });
                    }
                }
            }
        }
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
            return date.toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        }
        return "Chưa cập nhật";
    } catch (error) {
        return "Chưa cập nhật";
    }
}

function getGenderLabel(gioiTinh) {
    if (gioiTinh === undefined || gioiTinh === null) return "Chưa cập nhật";
    if (typeof gioiTinh === "number") {
        return gioiTinh === 1 ? "Nam" : gioiTinh === 0 ? "Nữ" : "Khác";
    }
    const gt = gioiTinh.trim().toLowerCase();
    if (gt === "nam" || gt === "male") return "Nam";
    if (gt === "nữ" || gt === "nu" || gt === "female") return "Nữ";
    return "Khác";
}

function getStatusLabel(trangThai) {
    if (trangThai === undefined || trangThai === null) return "Chưa cập nhật";
    if (typeof trangThai === "number") {
        return trangThai === 1 ? "Online" : trangThai === 0 ? "Offline" : "Không xác định";
    }
    const st = String(trangThai).trim().toLowerCase();
    if (st === "1" || st === "online" || st === "đang hoạt động" || st === "active") return "Online";
    if (st === "0" || st === "offline" || st === "ngừng hoạt động" || st === "inactive") return "Offline";
    return "Không xác định";
}

function InfoField({ icon, label, value, color = "#1769aa" }) {
    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <Box
                sx={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: 44, height: 44,
                    borderRadius: "50%", background: `linear-gradient(120deg, ${color}22 60%, #fff 100%)`,
                    color: color, boxShadow: "0 2px 8px #1769aa22"
                }}
            >
                {icon}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                    variant="caption"
                    sx={{
                        color: "#666", fontSize: "0.82rem", fontWeight: 600,
                        textTransform: "uppercase", letterSpacing: "0.5px"
                    }}
                >
                    {label}
                </Typography>
                <Typography
                    variant="body1"
                    sx={{
                        color: "#222", fontSize: "1.09rem", fontWeight: 700, mt: 0.5,
                        wordWrap: "break-word", overflowWrap: "break-word"
                    }}
                >
                    {value || "Chưa cập nhật"}
                </Typography>
            </Box>
        </Box>
    );
}

InfoField.propTypes = {
    icon: PropTypes.node.isRequired,
    label: PropTypes.string.isRequired,
    value: PropTypes.string,
    color: PropTypes.string,
};

function calculateAge(dateString) {
    if (!dateString) return null;
    let day, month, year;
    if (typeof dateString === 'string' && dateString.includes('-')) {
        const parts = dateString.split('-');
        if (parts.length === 3) {
            if (parts[0].length === 4) { year = parseInt(parts[0], 10); month = parseInt(parts[1], 10) - 1; day = parseInt(parts[2], 10); }
            else if (parts[2].length === 4) { day = parseInt(parts[0], 10); month = parseInt(parts[1], 10) - 1; year = parseInt(parts[2], 10); }
        }
    }
    if (year && month >= 0 && day) {
        const today = new Date();
        let age = today.getFullYear() - year;
        if (today.getMonth() < month || (today.getMonth() === month && today.getDate() < day)) age--;
        return age;
    }
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
        const today = new Date();
        let age = today.getFullYear() - date.getFullYear();
        if (today.getMonth() < date.getMonth() || (today.getMonth() === date.getMonth() && today.getDate() < date.getDate())) age--;
        return age;
    }
    return null;
}

function getDiaChiFormatted(diaChis) {
    if (!Array.isArray(diaChis) || diaChis.length === 0) return "Chưa cập nhật";
    const dc = diaChis.find(dc => dc.trangThai === 1) || diaChis[0];
    let arr = [];
    if (dc.soNha) arr.push(dc.soNha);
    if (dc.xaPhuong) arr.push(dc.xaPhuong);
    if (dc.quanHuyen) arr.push(dc.quanHuyen);
    if (dc.tinhThanhPho) arr.push(dc.tinhThanhPho);
    return arr.join(", ") || "Chưa cập nhật";
}

export default function KhachHangDetail({ id }) {
    const navigate = useNavigate();
    const [khachHang, setKhachHang] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!id) return;
        const fetchCustomerData = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await axios.get(`${khachHangDetailAPI}/${id}`, { withCredentials: true });
                await new Promise(resolve => setTimeout(resolve, 500));
                setKhachHang(response.data.data || response.data);
            } catch (err) {
                setError("Không thể tải thông tin khách hàng. Vui lòng thử lại.");
            } finally {
                setLoading(false);
            }
        };
        fetchCustomerData();
    }, [id]);

    const handleEdit = () => navigate(`/khachhang/update/${id}`);

    if (loading) {
        return (
            <Box
                sx={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "linear-gradient(120deg,#fafbff 60%,#f3e5f5 100%)"
                }}
            >
                <Box textAlign="center">
                    <CircularProgress size={70} sx={{
                        color: "#1769aa",
                        mb: 3,
                        animation: "gradient-spin 1.2s linear infinite"
                    }} />
                    <Typography variant="h6" fontWeight={700} sx={{
                        color: "transparent",
                        background: "linear-gradient(90deg,#1769aa,#e91e63)",
                        backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
                    }}>
                        Đang tải thông tin khách hàng...
                    </Typography>
                </Box>
            </Box>
        );
    }

    if (error) {
        return (
            <Box
                sx={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "linear-gradient(120deg,#fafbff 60%,#f3e5f5 100%)"
                }}
            >
                <Box textAlign="center">
                    <Typography variant="h6" color="error" fontWeight={700} mb={2}>
                        {error}
                    </Typography>
                </Box>
            </Box>
        );
    }

    if (!khachHang) {
        return (
            <Box
                sx={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Box textAlign="center">
                    <Typography variant="h6" color="error" fontWeight={700} mb={2}>
                        Không tìm thấy thông tin khách hàng
                    </Typography>
                </Box>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                minHeight: "100vh",
                py: { xs: 2, md: 5 },
                px: { xs: 0, md: 2 },
                background: "linear-gradient(120deg,#fafbff 60%,#e3f2fd 100%)"
            }}
        >
            {/* Floating Edit Button */}
            <Tooltip title="Sửa hồ sơ">
                <IconButton
                    color="primary"
                    onClick={handleEdit}
                    sx={{
                        position: "fixed",
                        right: { xs: 18, md: 40 },
                        bottom: { xs: 18, md: 40 },
                        zIndex: 1001,
                        bgcolor: "#fff",
                        boxShadow: "0 4px 24px #1769aa22",
                        "&:hover": { bgcolor: "#e3f2fd" },
                        borderRadius: "50%",
                        width: 64,
                        height: 64
                    }}
                >
                    <EditIcon sx={{ fontSize: 32 }} />
                </IconButton>
            </Tooltip>

            <StyledCard>
                {/* Header section */}
                <Box sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 4,
                    flexWrap: "wrap",
                    gap: 2
                }}>
                    <Typography
                        variant="h3"
                        sx={{
                            fontWeight: 900,
                            color: "transparent",
                            background: "linear-gradient(90deg,#1769aa,#e91e63)",
                            backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                            textAlign: "center",
                            flex: 1,
                            fontSize: { xs: "1.4rem", md: "2.4rem" },
                            letterSpacing: 0.5,
                            order: { xs: 3, md: 2 },
                            width: { xs: "100%", md: "auto" }
                        }}
                    >
                        Hồ Sơ Khách Hàng
                    </Typography>
                </Box>

                {/* Content Grid */}
                <Grid container spacing={5} sx={{ alignItems: "flex-start" }}>
                    {/* Profile Section */}
                    <Grid item xs={12} md={4}>
                        <ProfileSection>
                            <Box sx={{
                                position: "relative",
                                mb: 2,
                                width: "100%",
                                display: "flex",
                                justifyContent: "center"
                            }}>
                                <Avatar
                                    src={khachHang.hinhAnh}
                                    alt={khachHang.tenKhachHang || "Khách hàng"}
                                    sx={{
                                        width: { xs: 130, md: 180 },
                                        height: { xs: 130, md: 180 },
                                        mx: "auto",
                                        mb: 0,
                                        border: "5px solid white",
                                        boxShadow: "0 8px 25px rgba(23,105,170,0.15)",
                                        fontSize: { xs: "2.4rem", md: "3.6rem" },
                                        background: "linear-gradient(120deg,#1769aa 60%,#e91e63 100%)",
                                        color: "#fff"
                                    }}
                                >
                                    {khachHang.tenKhachHang ? khachHang.tenKhachHang.charAt(0).toUpperCase() : "K"}
                                </Avatar>
                                {/* Overlay badge */}
                                <Chip
                                    label={getStatusLabel(khachHang.trangThai)}
                                    color={khachHang.trangThai === 1 ? "success" : "error"}
                                    sx={{
                                        position: "absolute",
                                        bottom: 12,
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                        fontWeight: 700,
                                        fontSize: "1rem",
                                        px: 2,
                                        borderRadius: 18,
                                        boxShadow: "0 2px 8px #1769aa22"
                                    }}
                                />
                            </Box>
                            <Typography
                                variant="h5"
                                sx={{
                                    fontWeight: 700,
                                    color: "#1769aa",
                                    mb: 1,
                                    fontSize: { xs: "1.4rem", md: "1.8rem" },
                                    wordWrap: "break-word"
                                }}
                            >
                                {khachHang.tenKhachHang || "Chưa cập nhật"}
                            </Typography>
                            <Divider sx={{ my: 2, opacity: 0.18 }} />
                            <Box sx={{
                                display: "flex",
                                gap: 1,
                                justifyContent: "center",
                                mb: 2,
                                flexWrap: "wrap"
                            }}>
                                <StatusChip
                                    label={getStatusLabel(khachHang.trangThai)}
                                    status={khachHang.trangThai}
                                    size="medium"
                                />
                                <GenderChip
                                    label={getGenderLabel(khachHang.gioiTinh)}
                                    gender={khachHang.gioiTinh}
                                    size="medium"
                                />
                            </Box>
                        </ProfileSection>
                    </Grid>

                    {/* Info Section */}
                    <Grid item xs={12} md={8}>
                        <Grid container spacing={3} sx={{ height: "100%" }}>
                            {/* Personal Information Card */}
                            <Grid item xs={12}>
                                <InfoCard>
                                    <Typography
                                        variant="h5"
                                        sx={{
                                            fontWeight: 800,
                                            color: "#1769aa",
                                            mb: 3,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                            letterSpacing: 0.2
                                        }}
                                    >
                                        <PersonIcon />
                                        Thông Tin Cá Nhân
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <InfoField
                                                icon={<PersonIcon />}
                                                label="Họ và tên"
                                                value={khachHang.tenKhachHang}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <InfoField
                                                icon={<BadgeIcon />}
                                                label="Mã khách hàng"
                                                value={khachHang.maKhachHang}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <InfoField
                                                icon={<CalendarTodayIcon />}
                                                label={
                                                    (() => {
                                                        const age = calculateAge(khachHang.ngaySinh);
                                                        return age !== null && !isNaN(age)
                                                            ? `Ngày sinh (${age} tuổi)`
                                                            : "Ngày sinh";
                                                    })()
                                                }
                                                value={formatDate(khachHang.ngaySinh)}
                                            />
                                        </Grid>
                                    </Grid>
                                </InfoCard>
                            </Grid>

                            {/* Contact Information Card */}
                            <Grid item xs={12}>
                                <InfoCard>
                                    <Typography
                                        variant="h5"
                                        sx={{
                                            fontWeight: 800,
                                            color: "#1769aa",
                                            mb: 3,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                            letterSpacing: 0.2
                                        }}
                                    >
                                        <EmailIcon />
                                        Thông Tin Liên Hệ
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <InfoField
                                                icon={<EmailIcon />}
                                                label="Email"
                                                value={khachHang.email}
                                                color="#e91e63"
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <InfoField
                                                icon={<PhoneIcon />}
                                                label="Số điện thoại"
                                                value={khachHang.sdt}
                                                color="#ff9800"
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <InfoField
                                                icon={<LocationOnIcon />}
                                                label="Địa chỉ"
                                                value={getDiaChiFormatted(khachHang.diaChis)}
                                                color="#4caf50"
                                            />
                                        </Grid>
                                    </Grid>
                                </InfoCard>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </StyledCard>
        </Box>
    );
}

KhachHangDetail.propTypes = {
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    onClose: PropTypes.func,
};