import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Avatar,
    Stack,
    Link,
    TextField,
    Button,
    InputAdornment,
    IconButton,
    Fade,
    Paper
} from '@mui/material';
import {
    AccountCircleOutlined,
    PersonOutline,
    LocationOnOutlined,
    ConfirmationNumberOutlined,
    LockOutlined,
    EditOutlined,
    Visibility,
    VisibilityOff
} from '@mui/icons-material';

import Header from "../components/header";
import Footer from "../components/footer";

import KhachHangDetail from './componentDetailKhachHang';
import AddressManager from './componentDiaChi';
import VoucherTabs from "./componentPgg";
import { toast } from 'react-toastify';
import axios from 'axios';

// --- Component Form Đổi Mật Khẩu (Nội dung chính) ---
const ChangePasswordForm = () => {
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.newPassword !== formData.confirmPassword) {
            toast.warning("Mật khẩu mới không khớp!");
            return;
        }
        try {
            const response = await axios.post('http://localhost:8080/api/auth/change-password', {
                email: formData.email,
                oldPassword: formData.currentPassword,
                newPassword: formData.newPassword,
            }, { withCredentials: true });
            toast.success(response.data);
            setFormData({
                email: '',
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
            setShowCurrentPassword(false);
            setShowNewPassword(false);
            setShowConfirmPassword(false);
        } catch (error) {
            toast.error(error.response?.data || 'Đổi mật khẩu thất bại');
        }
    };

    return (
        <Paper elevation={6} sx={{
            width: '100%',
            maxWidth: 500,
            mx: 'auto',
            p: { xs: 3, sm: 5 },
            borderRadius: 6,
            backdropFilter: 'blur(3px)',
            background: 'rgba(255,255,255,0.85)',
            boxShadow: '0 8px 32px rgba(76,110,245,0.11)'
        }}>
            <Stack spacing={2} mb={5} alignItems="center">
                <Typography variant="h4" fontWeight="bold"
                            sx={{ background: 'linear-gradient(90deg,#49a3f1,#1769aa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Đổi mật khẩu
                </Typography>
                <Typography variant="body1" color="text.secondary" textAlign="center">
                    Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu cho người khác
                </Typography>
            </Stack>
            <form onSubmit={handleSubmit}>
                <Stack spacing={3}>
                    <TextField
                        fullWidth
                        label="Email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        sx={{ borderRadius: 3, background: "#f9fbfc" }}
                    />
                    <TextField
                        required
                        fullWidth
                        name="currentPassword"
                        label="Mật khẩu hiện tại"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={formData.currentPassword}
                        onChange={handleChange}
                        sx={{ '& .MuiInputBase-root': { height: 55, fontSize: '1rem', borderRadius: 3, background: "#f9fbfc" } }}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => setShowCurrentPassword(!showCurrentPassword)} edge="end">
                                        {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                    <TextField
                        required
                        fullWidth
                        name="newPassword"
                        label="Mật khẩu mới"
                        type={showNewPassword ? 'text' : 'password'}
                        value={formData.newPassword}
                        onChange={handleChange}
                        sx={{ '& .MuiInputBase-root': { height: 55, fontSize: '1rem', borderRadius: 3, background: "#f9fbfc" } }}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end">
                                        {showNewPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                    <TextField
                        required
                        fullWidth
                        name="confirmPassword"
                        label="Nhập lại mật khẩu mới"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        sx={{ '& .MuiInputBase-root': { height: 55, fontSize: '1rem', borderRadius: 3, background: "#f9fbfc" } }}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                    <Button type="submit"
                            variant="contained"
                            color="primary"
                            size="large"
                            sx={{
                                boxShadow: "0 3px 12px #49a3f133",
                                borderRadius: 3,
                                fontWeight: 700,
                                letterSpacing: 1,
                                background: "linear-gradient(90deg,#49a3f1,#1769aa)",
                                transition: "all .2s",
                                '&:hover': { background: "linear-gradient(90deg,#1769aa,#49a3f1)" }
                            }}>
                        Đổi mật khẩu
                    </Button>
                </Stack>
            </form>
        </Paper>
    );
};

const PlaceholderContent = ({ title }) => (
    <Fade in>
        <Box sx={{
            p: 4,
            width: '100%',
            borderRadius: 4,
            bgcolor: "rgba(250,250,253,0.95)",
            boxShadow: "0 2px 10px #49a3f133",
            textAlign: "center"
        }}>
            <Typography variant="h4" fontWeight={700} sx={{ color: "#49a3f1" }}>{title}</Typography>
            <Typography mt={2}>Nội dung cho mục &apos;{title}&apos; sẽ được hiển thị ở đây.</Typography>
        </Box>
    </Fade>
);

PlaceholderContent.propTypes = {
    title: PropTypes.string.isRequired,
};

const Sidebar = ({ selectedItem, onSelectItem, nameUser }) => {
    const menuItems = [
        { key: 'profile', text: 'Hồ sơ', icon: <PersonOutline /> },
        { key: 'address', text: 'Địa chỉ', icon: <LocationOnOutlined /> },
        { key: 'vouchers', text: 'Phiếu giảm giá', icon: <ConfirmationNumberOutlined /> },
        { key: 'change-password', text: 'Đổi mật khẩu', icon: <LockOutlined /> },
    ];
    return (
        <Paper elevation={0} sx={{
            width: { xs: '100%', md: 320 },
            flexShrink: 0,
            borderRight: { md: '1px solid #E0E0E0' },
            py: 5,
            px: 0,
            bgcolor: "rgba(249,251,252,0.85)",
            borderRadius: { xs: 0, md: "32px" },
            boxShadow: "0 6px 28px rgba(76,110,245,0.13)",
            minHeight: { md: "90vh" }
        }}>
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                p: 4,
                gap: 3,
                borderBottom: '1px solid #E0E0E0',
                background: 'linear-gradient(90deg,#f9fbfc,#f5f4ee 80%)',
                borderRadius: "24px 24px 0 0",
            }}>
                <Avatar
                    alt={nameUser}
                    src="/static/images/avatar/1.jpg"
                    sx={{
                        width: 72,
                        height: 72,
                        boxShadow: "0 2px 8px #49a3f155",
                        border: "3px solid #49a3f1"
                    }}
                />
                <Stack>
                    <Typography fontWeight="bold" variant="h5" sx={{ color: "#1769aa" }}>{nameUser}</Typography>
                    <Link href="#" underline="none" color="text.secondary"
                          sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                              fontSize: '1rem',
                              transition: "color .2s",
                              '&:hover': { color: "#49a3f1" }
                          }}>
                        <EditOutlined sx={{ fontSize: '1rem' }} /> Sửa hồ sơ
                    </Link>
                </Stack>
            </Box>
            <List sx={{ mt: 4 }}>
                <ListItem disablePadding>
                    <ListItemButton>
                        <ListItemIcon><AccountCircleOutlined sx={{ color: "#49a3f1" }} /></ListItemIcon>
                        <ListItemText primary="Tài khoản của tôi"
                                      primaryTypographyProps={{
                                          fontWeight: 'bold',
                                          fontSize: '1.2rem',
                                          color: "#1769aa"
                                      }} />
                    </ListItemButton>
                </ListItem>
                <Box sx={{ pl: 3 }}>
                    {menuItems.map((item) => (
                        <ListItem key={item.key} disablePadding>
                            <ListItemButton
                                selected={selectedItem === item.key}
                                onClick={() => onSelectItem(item.key)}
                                sx={{
                                    borderRadius: 3,
                                    textTransform: "none",
                                    fontWeight: 500,
                                    color: selectedItem === item.key ? "#49a3f1" : "#333",
                                    background: selectedItem === item.key ? "linear-gradient(90deg,#eef7ff,#f9fbfc)" : "transparent",
                                    border: selectedItem === item.key ? "2px solid #49a3f1" : "2px solid transparent",
                                    boxShadow: selectedItem === item.key ? "0 2px 10px #49a3f122" : "none",
                                    py: 2,
                                    my: 1,
                                    transition: "all .2s",
                                    "&:hover": {
                                        borderColor: "#1769aa",
                                        background: "linear-gradient(90deg,#f0f6fd,#eef7ff)",
                                        color: "#1769aa",
                                        "& .MuiListItemIcon-root": { color: "#1769aa" },
                                    },
                                    "&.Mui-selected": {
                                        backgroundColor: "transparent !important",
                                        color: "#49a3f1",
                                        "& .MuiListItemIcon-root": { color: "#49a3f1" },
                                    },
                                    "&.Mui-selected:hover": {
                                        backgroundColor: "#f0f6fd !important",
                                    },
                                }}
                            >
                                <ListItemIcon>{item.icon}</ListItemIcon>
                                <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: "1.1rem" }} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </Box>
            </List>
        </Paper>
    );
};

Sidebar.propTypes = {
    selectedItem: PropTypes.string.isRequired,
    onSelectItem: PropTypes.func.isRequired,
    nameUser: PropTypes.string.isRequired,
};

const ProfileLayout = () => {
    const [selectedContent, setSelectedContent] = useState('change-password');
    const [user, setUser] = useState(null);

    const loadUser = async () => {
        const res = await fetch(`http://localhost:8080/api/auth/me`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include"
        });
        const result = await res.json();
        setUser(result);
    };

    useEffect(() => {
        loadUser();
    }, []);

    const renderContent = () => {
        switch (selectedContent) {
            case 'profile':
                return user ? <KhachHangDetail id={user.id} /> : <Typography>Đang tải...</Typography>;
            case 'address':
                return user ? <AddressManager customerId={user.id} /> : <Typography>Đang tải...</Typography>;
            case 'vouchers':
                return user ? <VoucherTabs idCustomer={user.id} /> : <Typography>Đang tải...</Typography>;
            case 'change-password':
                return <ChangePasswordForm />;
            default:
                return <PlaceholderContent title="Chào mừng" />;
        }
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            background: "linear-gradient(150deg,#f9fbfc 70%,#f5f4ee 100%)"
        }}>
            <Header />
            <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                minHeight: '95vh',
                background: 'linear-gradient(150deg,#f5f5f5 80%,#eaf6ff 100%)',
                pt: { xs: 0, md: 6 }
            }}>
                {user && (<Sidebar selectedItem={selectedContent} onSelectItem={setSelectedContent} nameUser={user.tenKh} />)}
                <Box component="main" sx={{
                    flexGrow: 1,
                    p: { xs: 3, sm: 7 },
                    backgroundColor: 'transparent',
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}>
                    <Fade in>
                        <Box sx={{ width: "100%" }}>
                            {renderContent()}
                        </Box>
                    </Fade>
                </Box>
            </Box>
            <Footer />
        </Box>
    );
};

export default ProfileLayout;