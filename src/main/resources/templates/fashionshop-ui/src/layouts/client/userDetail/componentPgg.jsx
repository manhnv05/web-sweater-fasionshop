import React, { useEffect, useState } from "react";
import {
    Box,
    Tabs,
    Tab,
    Typography,
    Paper,
    Stack,
    IconButton,
    Modal,
    Tooltip,
    Chip
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FolderOffIcon from "@mui/icons-material/FolderOff";
import PropTypes from "prop-types";
import { styled } from "@mui/material/styles";
import logoImg from "assets/images/logo4.png";
import CircularProgress from "@mui/material/CircularProgress";

const SOFT_PRIMARY = "#2563eb";
const SOFT_BORDER = "#e5e7eb";
const SOFT_CARD_SHADOW = "0 8px 32px 0 #2563eb1a";
const SOFT_BG_GRADIENT = "linear-gradient(120deg, #f4f8fe 80%, #e0e7ef 100%)";
const SOFT_BADGE = "#22c55e";
const SOFT_BADGE_TEXT = "#fff";

const VoucherCard = styled(Paper)(({ theme, active }) => ({
    display: "flex",
    alignItems: "center",
    gap: "22px",
    transition: "border-color 0.25s, box-shadow 0.25s, background 0.25s",
    boxShadow: SOFT_CARD_SHADOW,
    border: `2px solid ${active ? SOFT_BADGE : SOFT_BORDER}`,
    background: active ? "rgba(34,197,94,0.09)" : "rgba(255,255,255,0.98)",
    borderRadius: 18,
    padding: "20px 28px",
    marginBottom: 18,
    position: "relative",
    cursor: "pointer",
    "&:hover": {
        borderColor: SOFT_PRIMARY,
        boxShadow: "0 8px 32px #2563eb22"
    }
}));

const LogoBox = styled(Box)({
    width: 78,
    height: 78,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#f1f5f9",
    boxShadow: "0 2px 8px #2563eb22",
    flexShrink: 0
});

const ViewButton = styled("button")({
    border: "none",
    background: "none",
    padding: 0,
    cursor: "pointer",
    font: "inherit",
    color: SOFT_PRIMARY,
    textDecoration: "underline",
    fontWeight: 700,
    fontSize: "1.05rem"
});

const BadgeChip = styled(Chip)({
    background: SOFT_BADGE,
    color: SOFT_BADGE_TEXT,
    fontWeight: 700,
    fontSize: 14,
    height: 26,
    minWidth: 0,
    display: "flex",
    alignItems: "center",
    gap: 4,
    paddingLeft: 10,
    paddingRight: 10,
    boxShadow: "0 2px 8px #22c55e33"
});

function TabPanel({ children, value, index }) {
    return (
        <div role="tabpanel" hidden={value !== index}>
            {value === index && <Box sx={{ p: { xs: 1, md: 3 } }}>{children}</Box>}
        </div>
    );
}
function formatNumberVN(number) {
    return number ? number.toLocaleString('vi-VN') : "";
}

TabPanel.propTypes = {
    children: PropTypes.node,
    value: PropTypes.number.isRequired,
    index: PropTypes.number.isRequired,
};

export default function VoucherTabs({ idCustomer }) {
    const [tab, setTab] = useState(0);
    const [vouchers, setVouchers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [selectedVoucher, setSelectedVoucher] = useState(null);

    const handleOpen = (voucher) => {
        setSelectedVoucher(voucher);
        setOpen(true);
    };
    const handleClose = () => setOpen(false);

    const handleChange = (event, newValue) => setTab(newValue);

    const loadPgg = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:8080/PhieuGiamGiaKhachHang/pddkh-online?idKhachHang=${idCustomer}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });
            const result = await res.json();
            setVouchers(result.data || []);
        } catch (error) {
            // show error toast if needed
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPgg();
    }, [idCustomer]);

    const renderEmpty = () => (
        <Stack
            spacing={2}
            alignItems="center"
            justifyContent="center"
            sx={{ minHeight: 220 }}
        >
            <FolderOffIcon sx={{ fontSize: 70, color: SOFT_PRIMARY }} />
            <Typography variant="h6" color="text.secondary" fontWeight={700} fontSize={17}>
                Không có phiếu giảm giá
            </Typography>
        </Stack>
    );

    const renderVoucherCard = (voucher) => (
        <VoucherCard
            active={voucher.trangThai === 1}
            key={voucher.id}
            onClick={() => handleOpen(voucher)}
        >
            <LogoBox>
                <img
                    src={logoImg}
                    alt="Voucher Logo"
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
            </LogoBox>
            <Box sx={{ flex: 1 }}>
                <Stack spacing={0.7}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <Typography fontWeight={800} fontSize={18} color={SOFT_PRIMARY}>
                            {voucher.tenPhieu}
                        </Typography>
                        {voucher.trangThai === 1 && (
                            <BadgeChip label="Đang hoạt động" />
                        )}
                    </Box>
                    <Typography fontWeight={700} fontSize={15.5} color="#222">
                        <strong style={{ color: "#2563eb" }}>Mã:</strong> {voucher.maPhieuGiamGia}
                    </Typography>
                    <Typography fontWeight={700} fontSize={15.5} color="#222">
                        <strong style={{ color: "#22c55e" }}>Giảm:</strong>{" "}
                        {voucher.soTienGiam
                            ? `${formatNumberVN(voucher.soTienGiam)}₫`
                            : `${voucher.phamTramGiamGia}%`}
                    </Typography>
                    <Typography fontWeight={700} fontSize={15.5} color="#222">
                        <strong style={{ color: "#eab308" }}>HSD:</strong> {new Date(voucher.ngayKetThuc).toLocaleDateString()}
                    </Typography>
                    <ViewButton>Xem</ViewButton>
                </Stack>
            </Box>
        </VoucherCard>
    );

    const publicVouchers = vouchers.filter(v => v.loaiPhieu === 0);
    const personalVouchers = vouchers.filter(v => v.loaiPhieu === 1);

    return (
        <Paper
            elevation={3}
            sx={{
                width: "100%",
                p: { xs: 1.5, md: 3 },
                background: SOFT_BG_GRADIENT,
                boxShadow: SOFT_CARD_SHADOW
            }}
        >
            <Typography
                variant="h5"
                fontWeight={900}
                gutterBottom
                sx={{
                    color: SOFT_PRIMARY,
                    letterSpacing: "-0.03em",
                    fontSize: { xs: "1.2rem", md: "1.5rem" }
                }}
            >
                Phiếu giảm giá của bạn
            </Typography>

            <Tabs
                value={tab}
                onChange={handleChange}
                textColor="primary"
                indicatorColor="primary"
                sx={{
                    borderRadius: 12,
                    background: "#fff",
                    boxShadow: "0 2px 8px #2563eb10",
                    mb: 3
                }}
            >
                <Tab label="Công khai" sx={{ fontWeight: 700, fontSize: "1rem" }} />
                <Tab label="Cá nhân" sx={{ fontWeight: 700, fontSize: "1rem" }} />
            </Tabs>

            <TabPanel value={tab} index={0}>
                {loading
                    ? <Box align="center" py={3}><CircularProgress color="primary" /></Box>
                    : publicVouchers.length > 0
                        ? publicVouchers.map(renderVoucherCard)
                        : renderEmpty()}
            </TabPanel>

            <TabPanel value={tab} index={1}>
                {loading
                    ? <Box align="center" py={3}><CircularProgress color="primary" /></Box>
                    : personalVouchers.length > 0
                        ? personalVouchers.map(renderVoucherCard)
                        : renderEmpty()}
            </TabPanel>

            <Modal
                open={open && selectedVoucher}
                onClose={handleClose}
                aria-labelledby="voucher-detail-modal"
                sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
            >
                <Paper
                    elevation={4}
                    sx={{
                        width: { xs: "99vw", sm: 650 },
                        maxWidth: "99vw",
                        // borderRadius: 3.5,
                        px: { xs: 2, md: 4 },
                        pt: { xs: 2, md: 3 },
                        pb: { xs: 2, md: 4 },
                        outline: "none",
                        boxShadow: SOFT_CARD_SHADOW,
                        position: "relative",
                        background: SOFT_BG_GRADIENT
                    }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                        <Typography
                            id="voucher-detail-modal"
                            fontWeight={900}
                            fontSize={24}
                            color={SOFT_PRIMARY}
                            flex={1}
                        >
                            Chi tiết phiếu giảm giá
                        </Typography>
                        <IconButton onClick={handleClose} sx={{ ml: 1, color: SOFT_PRIMARY }}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                    {selectedVoucher && (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <VoucherCard
                                active={selectedVoucher.trangThai === 1}
                                sx={{ mb: 1, boxShadow: SOFT_CARD_SHADOW }}
                            >
                                <LogoBox>
                                    <img
                                        src={logoImg}
                                        alt="Voucher Logo"
                                        style={{ width: "100%", height: "100%", objectFit: "contain" }}
                                    />
                                </LogoBox>
                                <Box sx={{ flex: 1 }}>
                                    <Typography fontWeight={800} fontSize={18} color={SOFT_PRIMARY}>
                                        {selectedVoucher.tenPhieu}
                                    </Typography>
                                    <Typography fontWeight={700} fontSize={15.5} color="#222">
                                        Mã: {selectedVoucher.maPhieuGiamGia}
                                    </Typography>
                                    <Typography fontWeight={700} fontSize={15.5} color="#222">
                                        Giảm:{" "}
                                        {selectedVoucher.soTienGiam
                                            ? `${formatNumberVN(selectedVoucher.soTienGiam)}₫`
                                            : `${selectedVoucher.phamTramGiamGia}%`}
                                    </Typography>
                                    <Typography fontWeight={700} fontSize={15.5} color="#222">
                                        HSD: {new Date(selectedVoucher.ngayKetThuc).toLocaleDateString()}
                                    </Typography>
                                </Box>
                            </VoucherCard>

                            <Stack gap={1.2}>
                                <Typography fontWeight={900} fontSize={20} color={SOFT_PRIMARY}>
                                    Hạn sử dụng
                                </Typography>
                                <Typography fontWeight={500} fontSize={16} color="#333">
                                    {`${selectedVoucher.ngayBatDau} ---- ${selectedVoucher.ngayKetThuc}`}
                                </Typography>
                            </Stack>

                            <Stack gap={1.2}>
                                <Typography fontWeight={900} fontSize={20} color={SOFT_PRIMARY}>
                                    Ưu đãi
                                </Typography>
                                <Typography fontWeight={500} fontSize={16} color="#333">
                                    Lượt sử dụng có hạn. Nhanh tay kẻo lỡ bạn nhé!
                                </Typography>
                                <Typography fontWeight={500} fontSize={16} color="#333">
                                    {`Giảm ${selectedVoucher.soTienGiam
                                        ? `${formatNumberVN(selectedVoucher.giamToiDa)}₫ cho đơn hàng`
                                        : `${selectedVoucher.phamTramGiamGia}%`} cho đơn hàng. Đơn tối thiểu: ${formatNumberVN(selectedVoucher.dieuKienGiam)} đ`}
                                </Typography>
                                {selectedVoucher.soTienGiam
                                    ? null
                                    : (
                                        <Typography fontWeight={500} fontSize={16} color="#333">
                                            Giảm tối đa: {formatNumberVN(selectedVoucher.giamToiDa)} đ
                                        </Typography>
                                    )}
                            </Stack>

                            <Stack gap={1.2}>
                                <Typography fontWeight={900} fontSize={20} color={SOFT_PRIMARY}>
                                    Chi tiết
                                </Typography>
                                <Typography fontWeight={500} fontSize={16} color="#333">
                                    Mã: {selectedVoucher.maPhieuGiamGia}
                                </Typography>
                                <Typography fontWeight={500} fontSize={16} color="#333">
                                    Tên: {selectedVoucher.tenPhieu}
                                </Typography>
                                <Typography fontWeight={500} fontSize={16} color="#333">
                                    Kiểu: {selectedVoucher.loaiPhieu === 0 ? "Công khai" : "Cá nhân"}
                                </Typography>
                                <Typography fontWeight={500} fontSize={16} color="#333">
                                    Số lượng: {selectedVoucher.soLuong}
                                </Typography>
                            </Stack>

                            <Stack gap={1.2}>
                                <Typography fontWeight={900} fontSize={20} color={SOFT_PRIMARY}>
                                    Lưu ý
                                </Typography>
                                <Typography fontWeight={500} fontSize={16} color="#333">
                                    Đối với những phiếu giảm giá kiểu <strong style={{ fontWeight: 900, color: SOFT_PRIMARY }}>công khai</strong>, phiếu giảm giá sẽ được sử dụng trên tất cả khách hàng.
                                </Typography>
                            </Stack>
                        </Box>
                    )}
                </Paper>
            </Modal>
        </Paper>
    );
}

VoucherTabs.propTypes = {
    idCustomer: PropTypes.number.isRequired,
};