import React, { useState, useEffect } from "react";
import Header from "../components/header";
import Footer from "../components/footer";
import {
    Box,
    Typography,
    Grid,
    Paper,
    Stack,
    Button,
    Chip,
    Tooltip,
    IconButton,
    Rating,
    useMediaQuery,
    CircularProgress,
} from "@mui/material";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import { styled } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ProductSlideshow from "../../admin/BanHangTaiQuay/component/ProductSlideshow";
const OutletBlock = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2.5),
    borderRadius: 18,
    boxShadow: "0 4px 24px 0 #bde0fe22",
    background: "#fff",
    border: "1.5px solid #e3f0fa",
    position: "relative",
    height: 410,
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
}));

export default function OutletSalePage() {
    const isMobile = useMediaQuery("(max-width:900px)");
    const navigate = useNavigate();

    // State cho API
    const [products, setProducts] = useState([]);
    const [ratings, setRatings] = useState([]);
    const [favoriteIndexes, setFavoriteIndexes] = useState([]);
    const [cartIndexes, setCartIndexes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(12);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchProducts(page, pageSize);
        // eslint-disable-next-line
    }, [page, pageSize]);

    const fetchProducts = (page, pageSize) => {
        setLoading(true);
        axios.get("http://localhost:8080/api/outlet/products", {
            params: {
                page: page,
                pageSize: pageSize
            }
        })
            .then(res => {
                setProducts(res.data.content || []);
                setTotalPages(res.data.totalPages || 1);
                setRatings((res.data.content || []).map(() => 4));
                setLoading(false);
            })
            .catch(() => {
                setProducts([]);
                setTotalPages(1);
                setRatings([]);
                setLoading(false);
            });
    };

    const handleToggleFavorite = (index) => {
        setFavoriteIndexes((prev) =>
            prev.includes(index)
                ? prev.filter(i => i !== index)
                : [...prev, index]
        );
    };

    const handleAddToCart = (product) => {
        // Chuyển sang trang chi tiết sản phẩm cha khi ấn Mua ngay
        navigate(`/shop/detail/${product.id}`);
    };

    const handleChangeRating = (index, value) => {
        setRatings(prev => prev.map((r, i) => (i === index ? value : r)));
    };

    // Chuyển hướng sang trang chi tiết sản phẩm (id sản phẩm cha) khi click vào card
    const handleGoToDetail = (product) => {
        navigate(`/shop/detail/${product.id}`);
    };

    // Phân trang dạng 1 2 3 ... cuối-1 cuối nếu > 5 trang
    const getPaginationItems = () => {
        if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i);
        if (page <= 2) return [0, 1, 2, "...", totalPages - 2, totalPages - 1];
        if (page >= totalPages - 3) return [0, 1, "...", totalPages - 3, totalPages - 2, totalPages - 1];
        return [0, 1, "...", page, "...", totalPages - 2, totalPages - 1];
    };

    return (
        <Box sx={{ bgcolor: "#f7fafc", minHeight: "100vh" }}>
            <Header />
            <Box
                sx={{
                    width: "100%",
                    height: 160,
                    bgcolor: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 3,
                    mt: 2,
                    background: "linear-gradient(90deg,#ffe259 0%,#ffa751 100%)",
                    borderRadius: { xs: "0 0 18px 18px", md: "0 0 36px 36px" },
                    boxShadow: "0 8px 32px 0 #ffd58033"
                }}
            >
                <Typography
                    variant={isMobile ? "h4" : "h3"}
                    fontWeight={900}
                    sx={{
                        color: "#b71c1c",
                        letterSpacing: 1.5,
                        textShadow: "0 3px 20px #fff6",
                        bgcolor: "rgba(255,255,255,0.82)",
                        px: isMobile ? 3 : 7,
                        py: 1.2,
                        borderRadius: 8,
                        border: "1.5px solid #ffe259"
                    }}
                >
                    OUTLET SALE - GIẢM GIÁ CỰC SỐC
                </Typography>
            </Box>

            <Box sx={{ maxWidth: 1220, mx: "auto", px: { xs: 1, md: 3 } }}>
                <Paper
                    elevation={0}
                    sx={{
                        mb: 4,
                        p: { xs: 2, md: 3 },
                        borderRadius: 4,
                        background: "#fffbe6",
                        border: "1.5px solid #ffe259",
                        textAlign: "center"
                    }}
                >
                    <Typography variant="h5" fontWeight={800} color="#b71c1c" sx={{ letterSpacing: 1.2 }}>
                        ⚡ Chỉ áp dụng cho các sản phẩm outlet, số lượng cực giới hạn!
                    </Typography>
                    <Typography sx={{ mt: 0.8, color: "#a67c00", fontSize: 17, fontWeight: 700 }}>
                        Sản phẩm không đổi trả, không áp dụng cùng các khuyến mãi khác.
                    </Typography>
                </Paper>
                {loading ? (
                    <Stack alignItems="center" py={8}>
                        <CircularProgress />
                    </Stack>
                ) : (
                    <Grid container spacing={4}>
                        {products.length === 0 ? (
                            <Grid item xs={12}>
                                <Typography align="center" color="text.secondary" sx={{ mt: 8, fontSize: 20 }}>
                                    Không có sản phẩm outlet nào!
                                </Typography>
                            </Grid>
                        ) : (
                            products.map((item, idx) => (
                                <Grid item xs={12} sm={6} md={4} key={item.id}>
                                    <OutletBlock
                                        onClick={() => handleGoToDetail(item)}
                                        sx={{
                                            cursor: "pointer",
                                            "&:hover": {
                                                boxShadow: "0 10px 36px 0 #ffd58055",
                                                border: "1.5px solid #ffb300",
                                                transform: "translateY(-8px) scale(1.03)"
                                            }
                                        }}
                                    >
                                        <Chip
                                            label={`-${item.phanTramGiamGia || 0}%`}
                                            color="error"
                                            sx={{
                                                position: "absolute",
                                                top: 18,
                                                left: 18,
                                                fontWeight: 900,
                                                bgcolor: "#e53935",
                                                color: "#fff",
                                                fontSize: 15,
                                                px: 1.4,
                                                zIndex: 3,
                                                letterSpacing: 1,
                                                boxShadow: "0 2px 8px 0 #ff525288"
                                            }}
                                            size="small"
                                            onClick={e => e.stopPropagation()}
                                        />
                                        <Chip
                                            label="OUTLET"
                                            sx={{
                                                position: "absolute",
                                                top: 18,
                                                right: 18,
                                                bgcolor: "#ffd600",
                                                color: "#e53935",
                                                fontWeight: 900,
                                                fontSize: 15,
                                                px: 1.3,
                                                zIndex: 3,
                                                boxShadow: "0 2px 12px 0 #ffe60077"
                                            }}
                                            size="small"
                                            onClick={e => e.stopPropagation()}
                                        />
                                        <Box
                                            sx={{
                                                width: "100%",
                                                aspectRatio: "4/3",
                                                borderRadius: 4,
                                                overflow: "hidden",
                                                boxShadow: "0 2px 10px 0 #bde0fe22",
                                                border: "1.5px solid #ffe259",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                background: "#fff8e1",
                                                mb: 2
                                            }}
                                        >
                                            <Box
                                               
                                            />
                                             <ProductSlideshow product={{ listUrlImage: item.img }} sx={{
                                                width: "100%",
                                                height: "100%",
                                              }} />
                                        </Box>
                                        <Typography fontWeight={900} sx={{ fontSize: 17.2, mb: 0.6, color: "#b71c1c", letterSpacing: 0.3 }}>
                                            {item.tenSanPham}
                                        </Typography>
                                        <Rating
                                            size="small"
                                            precision={0.5}
                                            value={ratings[idx]}
                                            sx={{ mb: 0.7 }}
                                            onChange={(_, value) => handleChangeRating(idx, value)}
                                            onClick={e => e.stopPropagation()}
                                        />
                                        <Stack direction="row" spacing={1.1} alignItems="center" justifyContent="center" sx={{ mb: 1.2 }}>
                                            <Typography sx={{ fontWeight: 900, fontSize: 17, color: "#e53935" }}>
                                                {item.giaSauKhiGiam ? item.giaSauKhiGiam.toLocaleString("vi-VN") : ""}₫
                                            </Typography>
                                            <Typography sx={{ color: "#bbb", textDecoration: "line-through", fontSize: 15.2, fontWeight: 700 }}>
                                                {item.giaTruocKhiGiam ? item.giaTruocKhiGiam.toLocaleString("vi-VN") : ""}₫
                                            </Typography>
                                        </Stack>
                                        <Box sx={{ mt: "auto", width: "100%" }}>
                                            <Stack direction="row" justifyContent="center" alignItems="center" spacing={2}>
                                                <Tooltip title={favoriteIndexes.includes(idx) ? "Bỏ yêu thích" : "Yêu thích"}>
                                                    <IconButton
                                                        sx={{
                                                            color: favoriteIndexes.includes(idx) ? "#e53935" : "#bbb",
                                                            border: favoriteIndexes.includes(idx) ? "2px solid #e53935" : "2px solid #ececec",
                                                            bgcolor: "#fff",
                                                            borderRadius: "50%",
                                                            boxShadow: favoriteIndexes.includes(idx) ? "0 4px 16px #ffe6e6" : "none",
                                                            "&:hover": {
                                                                color: "#e53935",
                                                                border: "2px solid #e53935",
                                                                background: "#ffe6e6"
                                                            },
                                                            transition: "all 0.15s"
                                                        }}
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            handleToggleFavorite(idx);
                                                        }}
                                                    >
                                                        {favoriteIndexes.includes(idx) ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Mua ngay">
                                                    <Button
                                                        variant="contained"
                                                        color="primary"
                                                        startIcon={<ShoppingCartIcon />}
                                                        sx={{
                                                            fontWeight: 700,
                                                            borderRadius: 3,
                                                            px: 2.2,
                                                            fontSize: 15,
                                                            boxShadow: "0 2px 8px 0 #ffd58066",
                                                            background: "#ffe259",
                                                            color: "#b71c1c",
                                                            "&:hover": { background: "#ffb300", color: "#fff" }
                                                        }}
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            handleAddToCart(item);
                                                        }}
                                                    >
                                                        Mua ngay
                                                    </Button>
                                                </Tooltip>
                                            </Stack>
                                        </Box>
                                    </OutletBlock>
                                </Grid>
                            ))
                        )}
                    </Grid>
                )}
                {/* Phân trang */}
                <Stack direction="row" justifyContent="center" alignItems="center" mt={5} spacing={2}>
                    <Button
                        variant="outlined"
                        size="small"
                        disabled={page === 0}
                        onClick={() => setPage(page - 1)}
                        sx={{
                            minWidth: 38,
                            borderRadius: 2.3,
                            color: page === 0 ? "#bdbdbd" : "#b71c1c",
                            borderColor: "#ffe259",
                            fontWeight: 600
                        }}
                    >
                        Trước
                    </Button>
                    {getPaginationItems().map((item, idx) =>
                        item === "..." ? (
                            <Typography key={idx} sx={{ mx: 1, color: "#888", minWidth: 24, textAlign: "center" }}>...</Typography>
                        ) : (
                            <Button
                                key={item}
                                variant={item === page ? "contained" : "outlined"}
                                size="small"
                                sx={{
                                    minWidth: 38,
                                    borderRadius: 2.3,
                                    color: item === page ? "#fff" : "#b71c1c",
                                    borderColor: "#ffe259",
                                    bgcolor: item === page ? "#b71c1c" : "#fff",
                                    fontWeight: item === page ? 700 : 500,
                                    "&:hover": { borderColor: "#e53935", bgcolor: "#fffbe6" }
                                }}
                                onClick={() => setPage(item)}
                            >
                                {item + 1}
                            </Button>
                        )
                    )}
                    <Button
                        variant="outlined"
                        size="small"
                        disabled={page === totalPages - 1 || totalPages === 0}
                        onClick={() => setPage(page + 1)}
                        sx={{
                            minWidth: 38,
                            borderRadius: 2.3,
                            color: page === totalPages - 1 || totalPages === 0 ? "#bdbdbd" : "#b71c1c",
                            borderColor: "#ffe259",
                            fontWeight: 600
                        }}
                    >
                        Sau
                    </Button>
                </Stack>
            </Box>
            <Box mt={8}>
                <Footer />
            </Box>
        </Box>
    );
}