import React, { useState, useEffect, useRef } from "react";
import Card from "@mui/material/Card";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Input from "@mui/material/Input";
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
import { CircularProgress, Grid, Tooltip, Typography, Box } from "@mui/material";
import CreatableSelect from "react-select/creatable";
import Select from "react-select";
import { FaPlus, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8080";
const apiUrl = (path) => `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;

const normalizeUrl = (url) =>
    url && url.startsWith("http")
        ? url
        : `${API_BASE}${url?.startsWith("/") ? "" : "/"}${url || ""}`;

async function generateMaSanPhamUnique() {
    try {
        const res = await fetch(apiUrl("/sanPham/all-ma"), {
            credentials: "include",
        });
        const data = await res.json();
        if (!Array.isArray(data)) {
            return "SP0001";
        }
        const numbers = data
            .map((ma) => {
                const match = /^SP(\d{4})$/.exec(ma);
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
        return "SP" + String(next).padStart(4, "0");
    } catch {
        return "SP0001";
    }
}

async function fetchAllMaSanPhamChiTiet() {
    try {
        const res = await fetch(apiUrl("/chiTietSanPham/all-ma"), {
            credentials: "include",
        });
        const data = await res.json();
        if (!Array.isArray(data)) return [];
        return data;
    } catch {
        return [];
    }
}

function getUniqueMaSanPhamChiTiet(maSanPhamBase, colorId, sizeId, existedList) {
    let idx = 1;
    let ma = `${maSanPhamBase}-${colorId}-${sizeId}`;
    while (existedList.includes(ma)) {
        idx += 1;
        ma = `${maSanPhamBase}-${colorId}-${sizeId}-${idx}`;
    }
    existedList.push(ma);
    return ma;
}

function getProductVariantsByColors(colors, sizes, productName) {
    const selectedColors = colors.filter(Boolean);
    const selectedSizes = sizes.filter(Boolean);
    if (!selectedColors.length || !selectedSizes.length) return [];
    return selectedColors.map((colorId) => ({
        colorId: colorId,
        products: selectedSizes.map((sizeId) => ({
            name: productName,
            sizeId: sizeId,
            weight: "",
            qty: "",
            price: "",
            unit: "g",
            image: "",
        })),
    }));
}

const getLabelById = (options, id) =>
    options.find((option) => `${option.value}` === `${id}`)?.label || id;

const selectMenuStyle = {
    menu: (base) => ({
        ...base,
        borderRadius: 8,
        marginTop: 2,
        boxShadow: "0 8px 24px 0 rgba(34,82,168,0.11)",
        border: "1px solid #bbdefb",
        background: "#fff",
        color: "#263238",
        zIndex: 20,
    }),
    input: (base, state) => ({
        ...base,
        color: "#263238",
        fontSize: 16,
        background: "transparent",
        opacity: state.isFocused ? 0.5 : 1,
    }),
    placeholder: (base, state) => ({
        ...base,
        color: "#a8b8c3",
        fontSize: 16,
        opacity: state.isFocused ? 0.4 : 1,
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected
            ? "#e3f2fd"
            : state.isFocused
                ? "#f0f6fd"
                : "#fff",
        color: "#263238",
        fontWeight: state.isSelected ? 600 : 400,
        cursor: "pointer",
        fontSize: 16,
        padding: "10px 16px",
    }),
};

function formatCurrencyVND(value) {
    const number = Number(String(value).replace(/[^\d]/g, ""));
    if (Number.isNaN(number) || value === "") return "";
    return number.toLocaleString("vi-VN");
}

function parseCurrencyVND(value) {
    return String(value).replace(/[^\d]/g, "");
}

function ProductForm() {
    const [productCode, setProductCode] = useState("");
    const [productName, setProductName] = useState("");
    const [productNameOptions, setProductNameOptions] = useState([]);
    const [productDesc, setProductDesc] = useState("");
    const [categoryOptions, setCategoryOptions] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [brandOptions, setBrandOptions] = useState([]);
    const [selectedBrand, setSelectedBrand] = useState("");
    const [materialOptions, setMaterialOptions] = useState([]);
    const [selectedMaterial, setSelectedMaterial] = useState("");
    const [countryOptions, setCountryOptions] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState("");
    const [collarOptions, setCollarOptions] = useState([]);
    const [selectedCollar, setSelectedCollar] = useState("");
    const [sleeveOptions, setSleeveOptions] = useState([]);
    const [selectedSleeve, setSelectedSleeve] = useState("");
    const [colorOptions, setColorOptions] = useState([]);
    const [colors, setColors] = useState([]);
    const [sizeOptions, setSizeOptions] = useState([]);
    const [sizes, setSizes] = useState([]);
    const [showImageModal, setShowImageModal] = useState(false);
    const [modalColor, setModalColor] = useState("");
    const [selectedImages, setSelectedImages] = useState({});
    const [tempImages, setTempImages] = useState([]);
    const [imageOptions, setImageOptions] = useState([]);
    const [addLoading, setAddLoading] = useState(false);
    const [productVariants, setProductVariants] = useState([]);
    const [createdSanPhamId, setCreatedSanPhamId] = useState(null);
    const [checkedRows, setCheckedRows] = useState({});
    const [quickWeight, setQuickWeight] = useState({});
    const [quickQty, setQuickQty] = useState({});
    const [quickPrice, setQuickPrice] = useState({});
    const [showAddProductModal, setShowAddProductModal] = useState(false);
    const [newProductName, setNewProductName] = useState("");
    const [newProductCategory, setNewProductCategory] = useState("");
    const [newProductDesc, setNewProductDesc] = useState("");
    const [addProductLoading, setAddProductLoading] = useState(false);
    const [addError, setAddError] = useState("");
    const [addSuccess, setAddSuccess] = useState("");
    const autoFocusRef = useRef(null);
    const [newProductCountry, setNewProductCountry] = useState("");
    const [addProductValidate, setAddProductValidate] = useState({});
    const [isCheckedAllGlobal, setIsCheckedAllGlobal] = useState(false);
    const [showAttributes, setShowAttributes] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (showAddProductModal && autoFocusRef.current) {
            autoFocusRef.current.focus();
        }
    }, [showAddProductModal]);

    useEffect(() => {
        fetch(apiUrl("/danhMuc/all"), { credentials: "include" })
            .then((res) => res.json())
            .then((data) => {
                const opts = Array.isArray(data)
                    ? data
                        .sort((a, b) => b.id - a.id)
                        .map((item) => ({
                            value: item.id,
                            label: item.tenDanhMuc ? item.tenDanhMuc : item,
                        }))
                    : [];
                setCategoryOptions(opts);
                if (opts[0]) setSelectedCategory(opts[0].value);
            })
            .catch(() => setCategoryOptions([]));
    }, []);

    useEffect(() => {
        fetch(apiUrl("/thuongHieu/all"), { credentials: "include" })
            .then((res) => res.json())
            .then((data) => {
                const opts = Array.isArray(data)
                    ? data
                        .sort((a, b) => b.id - a.id)
                        .map((item) => ({
                            value: item.id,
                            label: item.tenThuongHieu ? item.tenThuongHieu : item,
                        }))
                    : [];
                setBrandOptions(opts);
                if (opts[0]) setSelectedBrand(opts[0].value);
            })
            .catch(() => setBrandOptions([]));
    }, []);

    useEffect(() => {
        fetch(apiUrl("/chatLieu/all"), { credentials: "include" })
            .then((res) => res.json())
            .then((data) => {
                let opts = [];
                if (Array.isArray(data)) {
                    if (typeof data[0] === "string") {
                        opts = [...data].reverse().map((name, idx) => ({ value: idx + 1, label: name }));
                    } else {
                        opts = data.sort((a, b) => b.id - a.id).map((item) => ({
                            value: item.id,
                            label: item.tenChatLieu ? item.tenChatLieu : item,
                        }));
                    }
                }
                setMaterialOptions(opts);
                if (opts[0]) setSelectedMaterial(opts[0].value);
                
            })
            .catch(() => setMaterialOptions([]));
    }, []);

    useEffect(() => {
        fetch(apiUrl("/xuatXu/quocGia"), { credentials: "include" })
            .then((res) => res.json())
            .then((data) => {
                const opts = Array.isArray(data)
                    ? data.map((item, idx) => ({
                        value: item.name ? item.name : item ? item : idx,
                        label: item.name ? item.name : item,
                    }))
                    : [];
                setCountryOptions(opts);
                if (opts[0]) setSelectedCountry(opts[0].value);
            })
            .catch(() => setCountryOptions([]));
    }, []);

    useEffect(() => {
        fetch(apiUrl("/coAo/all"), { credentials: "include" })
            .then((res) => res.json())
            .then((data) => {
                const opts = Array.isArray(data)
                    ? data
                        .sort((a, b) =>
                            typeof a.id === "number" && typeof b.id === "number"
                                ? b.id - a.id
                                : 0
                        )
                        .map((item) =>
                            typeof item === "string"
                                ? { value: item, label: item }
                                : {
                                    value: item.id,
                                    label: item.tenCoAo ? item.tenCoAo : item.label ? item.label : item,
                                }
                        )
                    : [];
                setCollarOptions(opts);
                if (opts[0]) setSelectedCollar(opts[0].value);
            })
            .catch(() => setCollarOptions([]));
    }, []);

    useEffect(() => {
        fetch(apiUrl("/tayAo/all"), { credentials: "include" })
            .then((res) => res.json())
            .then((data) => {
                const opts = Array.isArray(data)
                    ? data
                        .sort((a, b) =>
                            typeof a.id === "number" && typeof b.id === "number"
                                ? b.id - a.id
                                : 0
                        )
                        .map((item) =>
                            typeof item === "string"
                                ? { value: item, label: item }
                                : {
                                    value: item.id,
                                    label: item.tenTayAo ? item.tenTayAo : item.label ? item.label : item,
                                }
                        )
                    : [];
                setSleeveOptions(opts);
                if (opts[0]) setSelectedSleeve(opts[0].value);
            })
            .catch(() => setSleeveOptions([]));
    }, []);

    useEffect(() => {
        fetch(apiUrl("/mauSac/all"), { credentials: "include" })
            .then((res) => res.json())
            .then((data) =>
                setColorOptions(
                    Array.isArray(data)
                        ? data
                            .sort((a, b) => b.id - a.id)
                            .map((item) => ({
                                value: item.id,
                                label: item.tenMauSac,
                            }))
                        : []
                )
            )
            .catch(() => setColorOptions([]));

        fetch(apiUrl("/kichThuoc/all"), { credentials: "include" })
            .then((res) => res.json())
            .then((data) =>
                setSizeOptions(
                    Array.isArray(data)
                        ? data
                            .sort((a, b) =>
                                typeof a.id === "number" && typeof b.id === "number"
                                    ? b.id - a.id
                                    : 0
                            )
                            .map((item) =>
                                typeof item === "string"
                                    ? { value: item, label: item }
                                    : {
                                        value: item.id,
                                        label: item.tenKichCo ? item.tenKichCo : item.label ? item.label : item,
                                    }
                            )
                        : []
                )
            )
            .catch(() => setSizeOptions([]));

        fetch(apiUrl("/hinhAnh/all"), { credentials: "include" })
            .then((res) => res.json())
            .then((data) =>
                setImageOptions(
                    Array.isArray(data)
                        ? data
                            .sort((a, b) => b.id - a.id)
                            .map((item) => ({
                                value: item.id,
                                label: item.moTa ? item.moTa : `Ảnh ${item.id}`,
                                url: normalizeUrl(item.duongDanAnh),
                            }))
                        : []
                )
            )
            .catch(() => setImageOptions([]));

        fetch(apiUrl("/sanPham/all-ten"), { credentials: "include" })
            .then((res) => res.json())
            .then((data) => {
                const uniqueNames = Array.isArray(data)
                    ? data.filter(Boolean).map((name) => name.trim())
                    : [];
                const opts = uniqueNames.map((name) => ({
                    value: name,
                    label: name,
                }));
                setProductNameOptions(opts);
                if (opts[0]) setProductName(opts[0].value);
            })
            .catch(() => setProductNameOptions([]));
    }, []);

    useEffect(() => {
        setProductVariants(getProductVariantsByColors(colors, sizes, productName));
    }, [JSON.stringify(colors), JSON.stringify(sizes), productName]);

    useEffect(() => {
        generateMaSanPhamUnique().then(setProductCode);
    }, []);

    useEffect(() => {
        if (productName) {
            fetch(apiUrl(`/sanPham/search?keyword=${encodeURIComponent(productName)}`), { credentials: "include" })
                .then(res => res.json())
                .then(async data => {
                    if (Array.isArray(data) && data.length > 0) {
                        const prod = data[0];
                        setCreatedSanPhamId(prod.id);
                        setProductDesc(prod.moTa ? prod.moTa : "");
                        setSelectedCategory(prod.idDanhMuc ? prod.idDanhMuc : "");
                        setSelectedCountry(prod.xuatXu ? prod.xuatXu : "");
                        setProductCode(prod.maSanPham ? prod.maSanPham : await generateMaSanPhamUnique());
                    } else {
                        setCreatedSanPhamId(null);
                        setProductDesc("");
                        setSelectedCategory(categoryOptions[0]?.value || "");
                        setSelectedCountry(countryOptions[0]?.value || "");
                        setProductCode(await generateMaSanPhamUnique());
                    }
                });
        }
    }, [productName]);

    const handleProductNameChange = (opt) => {
        const name = opt ? opt.value : "";
        setProductName(name);
    };

    const handleVariantValueChange = (colorIdx, prodIdx, field, value) => {
        setProductVariants((prev) => {
            const newArr = [...prev];
            newArr[colorIdx] = {
                ...newArr[colorIdx],
                products: newArr[colorIdx].products.map((p, idx) =>
                    idx === prodIdx
                        ? field === "price"
                            ? { ...p, price: parseCurrencyVND(value) }
                            : { ...p, [field]: value }
                        : p
                ),
            };
            return newArr;
        });
    };

    const handleCheckRow = (colorIdx, prodIdx) => {
        setCheckedRows((prev) => {
            const list = prev[colorIdx] || [];
            if (list.includes(prodIdx)) {
                return { ...prev, [colorIdx]: list.filter((i) => i !== prodIdx) };
            }
            return { ...prev, [colorIdx]: [...list, prodIdx] };
        });
    };

    const handleCheckAllRowsGlobal = (checked) => {
        setIsCheckedAllGlobal(checked);
        if (checked) {
            const checkedAllRows = {};
            productVariants.forEach((variant, colorIdx) => {
                checkedAllRows[colorIdx] = variant.products.map((_, prodIdx) => prodIdx);
            });
            setCheckedRows(checkedAllRows);
        } else {
            setCheckedRows({});
            setQuickWeight({});
            setQuickQty({});
            setQuickPrice({});
        }
    };

    useEffect(() => {
        if (isCheckedAllGlobal) {
            setProductVariants(prev =>
                prev.map(variant => ({
                    ...variant,
                    products: variant.products.map(prod => ({
                        ...prod,
                        weight: quickWeight.global,
                        qty: quickQty.global,
                        price: quickPrice.global
                    }))
                }))
            );
        }
    }, [quickWeight.global, quickQty.global, quickPrice.global, isCheckedAllGlobal]);

    const openImageModal = (colorId) => {
        setModalColor("all");
        setShowImageModal(true);
        setTempImages(Object.values(selectedImages).flat());
    };

    const closeImageModal = () => setShowImageModal(false);
    const handleSaveImages = () => {
        setSelectedImages({ all: [...tempImages] });
        closeImageModal();
    };
    const toggleTempImage = (imgId) => {
        setTempImages(sel =>
            sel.includes(imgId)
                ? sel.filter(id => id !== imgId)
                : [...sel, imgId]
        );
    };
    const findId = (arr, value) => {
        const item = arr.find(
            (x) => `${x.value}` === `${value}` || x.label === value
        );
        return item ? item.value : null;
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        setAddError("");
        setAddSuccess("");
        setAddLoading(true);

        const errors = {};
        if (!productName || !productName.trim()) errors.productName = "Tên sản phẩm không được để trống";
        if (!selectedBrand) errors.selectedBrand = "Thương hiệu không được để trống";
        if (!selectedMaterial) errors.selectedMaterial = "Chất liệu không được để trống";
        if (!selectedCollar) errors.selectedCollar = "Cổ áo không được để trống";
        if (!selectedSleeve) errors.selectedSleeve = "Tay áo không được để trống";
        if (!colors.length) errors.colors = "Màu sắc không được để trống";
        if (!sizes.length) errors.sizes = "Kích thước không được để trống";
        if (!selectedCategory) errors.selectedCategory = "Danh mục không được để trống";
        if (!selectedCountry) errors.selectedCountry = "Xuất xứ không được để trống";

        if (Object.keys(errors).length > 0) {
            setAddProductValidate(errors);
            setAddLoading(false);
            toast.error(Object.values(errors)[0]);
            return;
        }

        if (createdSanPhamId) {
            setAddSuccess("Chọn sản phẩm thành công!");
            setShowAttributes(true);
            setAddLoading(false);
            toast.success("Chọn sản phẩm thành công!");
            return;
        }

        const data = {
            maSanPham: productCode,
            tenSanPham: productName,
            xuatXu: selectedCountry,
            trangThai: 1,
            idDanhMuc: selectedCategory
        };

        try {
            const res = await fetch(apiUrl("/sanPham"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
                credentials: "include",
            });
            if (!res.ok) throw new Error("Lỗi khi thêm sản phẩm");
            const result = await res.json();
            setCreatedSanPhamId(result.id ? result.id : result);
            setAddSuccess("Thêm sản phẩm thành công!");
            setShowAttributes(true);
            toast.success("Thêm sản phẩm thành công!");
        } catch (err) {
            setAddError("Thêm sản phẩm thất bại!");
            toast.error("Thêm sản phẩm thất bại!");
        }
        setAddLoading(false);
    };

    const handleAddProductDetail = async () => {
        setAddError("");
        setAddSuccess("");
        setAddLoading(true);

        const errors = {};
        if (!productName || !productName.trim()) errors.productName = "Tên sản phẩm không được để trống";
        if (!selectedMaterial) errors.selectedMaterial = "Chất liệu không được để trống";
        if (!selectedBrand) errors.selectedBrand = "Thương hiệu không được để trống";
        if (!colors.length) errors.colors = "Màu sắc không được để trống";
        if (!sizes.length) errors.sizes = "Kích thước không được để trống";
        if (!selectedCollar) errors.selectedCollar = "Cổ áo không được để trống";
        if (!selectedSleeve) errors.selectedSleeve = "Tay áo không được để trống";

        for (let variant of productVariants) {
            for (let prod of variant.products) {
                if (!prod.weight || isNaN(prod.weight) || Number(prod.weight) <= 0) {
                    errors.weight = "Trọng lượng phải lớn hơn 0";
                }
                if (prod.qty === "" || prod.qty === null || isNaN(prod.qty) || Number(prod.qty) < 0) {
                    errors.qty = "Số lượng phải lớn hơn hoặc bằng 0";
                }
                if (!prod.price || isNaN(prod.price) || Number(prod.price) <= 0) {
                    errors.price = "Giá phải lớn hơn 0";
                }
            }
        }

        if (Object.keys(errors).length > 0) {
            setAddError(Object.values(errors)[0]);
            toast.error(Object.values(errors)[0]);
            setAddLoading(false);
            return;
        }

        const existedMaChiTietList = await fetchAllMaSanPhamChiTiet();
        const chiTietSanPhams = [];
        const chiTietSanPhamIndexMap = [];
        productVariants.forEach((variant, colorIdx) => {
            variant.products.forEach((prod, prodIdx) => {
                const maChiTiet = getUniqueMaSanPhamChiTiet(
                    productCode,
                    variant.colorId,
                    prod.sizeId,
                    existedMaChiTietList
                );
                chiTietSanPhams.push({
                    idSanPham: createdSanPhamId,
                    idChatLieu: selectedMaterial,
                    idThuongHieu: selectedBrand,
                    idMauSac: findId(colorOptions, variant.colorId),
                    idKichThuoc: findId(sizeOptions, prod.sizeId),
                    idCoAo: selectedCollar,
                    idTayAo: selectedSleeve,
                    gia: Number(prod.price),
                    soLuong: Number(prod.qty),
                    trongLuong: Number(prod.weight),
                    maSanPhamChiTiet: maChiTiet,
                    moTa: "",
                    trangThai: 1,
                    hinhAnhIds: selectedImages.all ?? [],
                });
                chiTietSanPhamIndexMap.push({
                    colorId: variant.colorId,
                    sizeId: prod.sizeId,
                    idxInVariants: { colorIdx: colorIdx, prodIdx: prodIdx },
                });
            });
        });

        try {
            const addDetailPromises = chiTietSanPhams.map((ctsp) =>
                fetch(apiUrl("/chiTietSanPham"), {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(ctsp),
                    credentials: "include",
                }).then((res) => {
                    if (!res.ok) throw new Error("Lỗi khi thêm chi tiết sản phẩm");
                    return res.json();
                })
            );
            const chiTietSanPhamResults = await Promise.all(addDetailPromises);
            setAddSuccess("Thêm chi tiết sản phẩm thành công!");
            toast.success("Thêm chi tiết sản phẩm thành công!");
            setTimeout(() => {
                navigate("/SanPham");
            }, 1000);

            const saveImagePromises = [];
            chiTietSanPhamResults.forEach((ctspResult, idx) => {
                const { colorId } = chiTietSanPhamIndexMap[idx];
                const imgList = selectedImages[colorId] || [];
                imgList.forEach((imgId) => {
                    const img = imageOptions.find((i) => i.value === imgId);
                    if (!img) return;
                    saveImagePromises.push(
                        fetch(apiUrl(`/hinhAnh/${img.value}`), {
                            method: "PUT",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            credentials: "include",
                            body: JSON.stringify({
                                maAnh: img.label ? img.label : `Ảnh ${img.value}`,
                                duongDanAnh: img.url,
                                anhMacDinh: 0,
                                moTa: img.label ? img.label : "",
                                trangThai: 1,
                                idSanPhamChiTiet: ctspResult.id ? ctspResult.id : ctspResult,
                                idSanPham: createdSanPhamId,
                            }),
                        })
                    );
                });
            });
            await Promise.all(saveImagePromises);
        } catch (err) {
            setAddError("Thêm chi tiết sản phẩm thất bại!");
            toast.error("Thêm chi tiết sản phẩm thất bại!");
        }
        setAddLoading(false);
    };

    const handleOpenAddProductModal = async () => {
        setShowAddProductModal(true);
        setNewProductName("");
        setNewProductCategory(selectedCategory ? selectedCategory : "");
        setNewProductCountry(selectedCountry ? selectedCountry : "");
        setNewProductDesc("");
        setAddError("");
        setAddSuccess("");
        setAddProductValidate({});
        const code = await generateMaSanPhamUnique();
        setProductCode(code);
    };

    const handleAddNewProduct = async () => {
        setAddProductLoading(true);
        setAddError("");
        setAddSuccess("");
        const errors = {};
        if (!newProductName || !newProductName.trim()) errors.newProductName = "Tên sản phẩm không được để trống";
        if (!newProductCategory) errors.newProductCategory = "Vui lòng chọn danh mục";
        if (!newProductCountry) errors.newProductCountry = "Vui lòng chọn xuất xứ";
        setAddProductValidate(errors);
        if (Object.keys(errors).length > 0) {
            setAddProductLoading(false);
            toast.error(Object.values(errors)[0]);
            return;
        }
        const productData = {
            maSanPham: await generateMaSanPhamUnique(),
            tenSanPham: newProductName,
            idDanhMuc: newProductCategory,
            xuatXu: newProductCountry,
            moTa: newProductDesc,
            trangThai: 1
        };
        try {
            const res = await fetch(apiUrl("/sanPham"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(productData),
                credentials: "include",
            });
            if (!res.ok) throw new Error("Lỗi khi thêm sản phẩm mới");
            await res.json();
            setAddSuccess("Thêm sản phẩm mới thành công!");
            toast.success("Thêm sản phẩm mới thành công!");

            setTimeout(() => {
                setShowAddProductModal(false);
                setAddSuccess("");
                fetch(apiUrl("/sanPham/all-ten"), { credentials: "include" })
                    .then((res) => res.json())
                    .then((data) => {
                        const uniqueNames = Array.isArray(data)
                            ? data.filter(Boolean).map((name) => name.trim())
                            : [];
                        const opts = uniqueNames.map((name) => ({
                            value: name,
                            label: name,
                        }));
                        setProductNameOptions(opts);
                        if (opts[0]) setProductName(opts[0].value);
                    });
            }, 1200);
        } catch (err) {
            setAddError("Thêm sản phẩm mới thất bại!");
            toast.error("Thêm sản phẩm mới thất bại!");
        }
        setAddProductLoading(false);
    };

    return (
        <DashboardLayout>
            <DashboardNavbar />
            <SoftBox
                py={3}
                sx={{
                    background: "#F4F6FB",
                    minHeight: "100vh",
                    userSelect: "none",
                }}
            >
                <Card
                    sx={{
                        p: { xs: 2, md: 4 },
                        mb: 2,
                        maxWidth: "1400px",
                        margin: "0 auto",
                        boxShadow: 12,
                        borderRadius: 5,
                        background: "linear-gradient(145deg,#fff 65%,#e3f0fa 130%)",
                    }}
                >
                    <Typography
                        variant="h4"
                        color="#1976d2"
                        fontWeight="bold"
                        mb={3}
                        letterSpacing={1}
                        textAlign="center"
                    >
                        Thêm Sản Phẩm Mới
                    </Typography>
                    <form onSubmit={handleAddProduct}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <FormControl fullWidth sx={{ mb: 2 }}>
                                    <label htmlFor="product-name" style={{ fontWeight: "bold", marginBottom: 4, display: "block" }}>
                                        Tên sản phẩm <span style={{ color: "red" }}>*</span>
                                    </label>
                                    <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 2 }}>
                                        <Box flex={1} sx={{ mr: 1 }}>
                                            <CreatableSelect
                                                inputId="product-name-input"
                                                options={productNameOptions}
                                                value={
                                                    productName
                                                        ? { value: productName, label: productName }
                                                        : null
                                                }
                                                onChange={handleProductNameChange}
                                                onInputChange={(inputValue, { action }) => {
                                                    if (action === "input-change") setProductName(inputValue);
                                                }}
                                                placeholder="Chọn hoặc nhập tên sản phẩm"
                                                isClearable
                                                isSearchable
                                                formatCreateLabel={(inputValue) => `Thêm mới: ${inputValue}`}
                                                noOptionsMessage={() => "Không có sản phẩm, nhập tên mới để thêm"}
                                                styles={selectMenuStyle}
                                            />
                                        </Box>
                                        <Tooltip title="Tạo sản phẩm mới nhanh">
                                            <Button
                                                variant="outlined"
                                                size="large"
                                                sx={{
                                                    borderRadius: 3,
                                                    textTransform: "none",
                                                    fontWeight: 500,
                                                    color: "#1976d2",
                                                    borderColor: "#90caf9",
                                                    minWidth: 44,
                                                    minHeight: 44,
                                                    p: 0,
                                                    boxShadow: "none",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    "&:hover": {
                                                        borderColor: "#1769aa",
                                                        background: "#f0f6fd",
                                                        color: "#1769aa",
                                                    },
                                                }}
                                                onClick={handleOpenAddProductModal}
                                            >
                                                <FaPlus size={22} />
                                            </Button>
                                        </Tooltip>
                                    </Box>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth sx={{ mb: 2 }}>
                                    <label htmlFor="brand-input" style={{ fontWeight: "bold", marginBottom: 4, display: "block" }}>
                                        Thương hiệu
                                    </label>
                                    <CreatableSelect
                                        inputId="brand-input"
                                        options={brandOptions}
                                        value={
                                            selectedBrand
                                                ? {
                                                    value: selectedBrand,
                                                    label: getLabelById(brandOptions, selectedBrand),
                                                }
                                                : null
                                        }
                                        onChange={(opt) => setSelectedBrand(opt ? opt.value : "")}
                                        onInputChange={(inputValue, { action }) => {
                                            if (action === "input-change") setSelectedBrand(inputValue);
                                        }}
                                        placeholder="Chọn hoặc nhập thương hiệu"
                                        isClearable
                                        isSearchable
                                        formatCreateLabel={(inputValue) => `Thêm mới: ${inputValue}`}
                                        noOptionsMessage={() => "Không có thương hiệu, nhập tên mới để thêm"}
                                        styles={selectMenuStyle}
                                    />
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth sx={{ mb: 2 }}>
                                    <label htmlFor="material-input" style={{ fontWeight: "bold", marginBottom: 4, display: "block" }}>
                                        Chất liệu
                                    </label>
                                    <CreatableSelect
                                        inputId="material-input"
                                        options={materialOptions}
                                        value={
                                            selectedMaterial
                                                ? {
                                                    value: selectedMaterial,
                                                    label: getLabelById(materialOptions, selectedMaterial),
                                                }
                                                : null
                                        }
                                        onChange={(opt) => setSelectedMaterial(opt ? opt.value : "")}
                                        onInputChange={(inputValue, { action }) => {
                                            if (action === "input-change") setSelectedMaterial(inputValue);
                                        }}
                                        placeholder="Chọn hoặc nhập chất liệu"
                                        isClearable
                                        isSearchable
                                        formatCreateLabel={(inputValue) => `Thêm mới: ${inputValue}`}
                                        noOptionsMessage={() => "Không có chất liệu, nhập tên mới để thêm"}
                                        styles={selectMenuStyle}
                                    />
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth sx={{ mb: 2 }}>
                                    <label htmlFor="collar-input" style={{ fontWeight: "bold", marginBottom: 4, display: "block" }}>
                                        Cổ áo
                                    </label>
                                    <CreatableSelect
                                        inputId="collar-input"
                                        options={collarOptions}
                                        value={
                                            selectedCollar
                                                ? {
                                                    value: selectedCollar,
                                                    label: getLabelById(collarOptions, selectedCollar),
                                                }
                                                : null
                                        }
                                        onChange={(opt) => setSelectedCollar(opt ? opt.value : "")}
                                        onInputChange={(inputValue, { action }) => {
                                            if (action === "input-change") setSelectedCollar(inputValue);
                                        }}
                                        placeholder="Chọn hoặc nhập cổ áo"
                                        isClearable
                                        isSearchable
                                        formatCreateLabel={(inputValue) => `Thêm mới: ${inputValue}`}
                                        noOptionsMessage={() => "Không có cổ áo, nhập tên mới để thêm"}
                                        styles={selectMenuStyle}
                                    />
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth sx={{ mb: 2 }}>
                                    <label htmlFor="sleeve-input" style={{ fontWeight: "bold", marginBottom: 4, display: "block" }}>
                                        Tay áo
                                    </label>
                                    <CreatableSelect
                                        inputId="sleeve-input"
                                        options={sleeveOptions}
                                        value={
                                            selectedSleeve
                                                ? {
                                                    value: selectedSleeve,
                                                    label: getLabelById(sleeveOptions, selectedSleeve),
                                                }
                                                : null
                                        }
                                        onChange={(opt) => setSelectedSleeve(opt ? opt.value : "")}
                                        onInputChange={(inputValue, { action }) => {
                                            if (action === "input-change") setSelectedSleeve(inputValue);
                                        }}
                                        placeholder="Chọn hoặc nhập tay áo"
                                        isClearable
                                        isSearchable
                                        formatCreateLabel={(inputValue) => `Thêm mới: ${inputValue}`}
                                        noOptionsMessage={() => "Không có tay áo, nhập tên mới để thêm"}
                                        styles={selectMenuStyle}
                                    />
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth sx={{ mb: 2 }}>
                                    <label htmlFor="color-input" style={{ fontWeight: "bold", marginBottom: 4, display: "block" }}>
                                        Màu sắc
                                    </label>
                                    <Select
                                        inputId="color-input"
                                        isMulti
                                        options={colorOptions}
                                        value={colorOptions.filter((o) => colors.includes(o.value))}
                                        onChange={(opts) =>
                                            setColors(opts ? opts.map((opt) => opt.value) : [])
                                        }
                                        placeholder="Chọn nhiều màu sắc"
                                        closeMenuOnSelect={false}
                                        styles={selectMenuStyle}
                                    />
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth sx={{ mb: 2 }}>
                                    <label htmlFor="size-input" style={{ fontWeight: "bold", marginBottom: 4, display: "block" }}>
                                        Kích cỡ
                                    </label>
                                    <Select
                                        inputId="size-input"
                                        isMulti
                                        options={sizeOptions}
                                        value={sizeOptions.filter((o) => sizes.includes(o.value))}
                                        onChange={(opts) =>
                                            setSizes(opts ? opts.map((opt) => opt.value) : [])
                                        }
                                        placeholder="Chọn nhiều kích cỡ"
                                        closeMenuOnSelect={false}
                                        styles={selectMenuStyle}
                                    />
                                </FormControl>
                            </Grid>
                        </Grid>
                        <SoftBox my={4}>
                            <SoftBox textAlign="right" mb={2}>
                                <Button
                                    variant="contained"
                                    color="success"
                                    size="large"
                                    onClick={handleAddProductDetail}
                                    sx={{ fontWeight: 600, px: 4, fontSize: 17, borderRadius: 3, boxShadow: 3 }}
                                >
                                    {addLoading && (
                                        <CircularProgress size={22} color="inherit" sx={{ mr: 1 }} />
                                    )}
                                    Thêm sản phẩm chi tiết
                                </Button>
                            </SoftBox>
                            {productVariants.map((variant, colorIdx) => {
                                const allChecked =
                                    checkedRows[colorIdx]?.length === variant.products.length;
                                return (
                                    <Card
                                        key={colorIdx}
                                        sx={{
                                            mb: 2.5,
                                            borderRadius: 3,
                                            boxShadow: 2,
                                            p: 2.5,
                                            background: "#fff",
                                            userSelect: "none",
                                            borderLeft: "7px solid #1976d2",
                                        }}
                                    >
                                        <Box
                                            display="flex"
                                            alignItems="center"
                                            mb={2}
                                            flexWrap="wrap"
                                            gap={2}
                                        >
                                            <SoftBox
                                                fontWeight="bold"
                                                sx={{ color: "#1976d2", fontSize: 16, mr: 2 }}
                                            >
                                                {`Màu: ${getLabelById(colorOptions, variant.colorId)}`}
                                            </SoftBox>
                                            <FormControl sx={{ verticalAlign: "middle" }}>
                                                <Tooltip title={isCheckedAllGlobal ? "Bỏ chọn tất cả" : "Chọn tất cả"}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isCheckedAllGlobal}
                                                        onChange={() => handleCheckAllRowsGlobal(!isCheckedAllGlobal)}
                                                        style={{
                                                            transform: "scale(1.3)",
                                                            marginRight: 5,
                                                            verticalAlign: "middle",
                                                        }}
                                                    />
                                                </Tooltip>
                                                <span style={{ fontWeight: 400, fontSize: 14 }}>Chọn tất cả</span>
                                            </FormControl>
                                            {isCheckedAllGlobal && colorIdx === 0 && (
                                                <Box
                                                    display="flex"
                                                    alignItems="center"
                                                    gap={2}
                                                    sx={{
                                                        background: "#f4f7fd",
                                                        borderRadius: 2,
                                                        px: 2,
                                                        py: 1,
                                                        ml: 2,
                                                    }}
                                                >
                                                    <FormControl sx={{ minWidth: 120, mr: 2 }}>
                                                        <label htmlFor="quick-global-weight" style={{ fontWeight: 400, fontSize: 13, marginBottom: 4, display: "block" }}>
                                                            Trọng lượng (g)
                                                        </label>
                                                        <Input
                                                            id="quick-global-weight"
                                                            type="text"
                                                            value={quickWeight.global ?? ""}
                                                            onChange={e =>
                                                                setQuickWeight(prev => ({ ...prev, global: e.target.value }))
                                                            }
                                                            size="small"
                                                            sx={{ width: 110, background: "#fff" }}
                                                            placeholder="VD: 300"
                                                        />
                                                    </FormControl>
                                                    <FormControl sx={{ minWidth: 120, mr: 2 }}>
                                                        <label htmlFor="quick-global-qty" style={{ fontWeight: 400, fontSize: 13, marginBottom: 4, display: "block" }}>
                                                            Số lượng
                                                        </label>
                                                        <Input
                                                            id="quick-global-qty"
                                                            type="text"
                                                            value={quickQty.global ?? ""}
                                                            onChange={e =>
                                                                setQuickQty(prev => ({ ...prev, global: e.target.value }))
                                                            }
                                                            size="small"
                                                            sx={{ width: 110, background: "#fff" }}
                                                            placeholder="VD: 20"
                                                        />
                                                    </FormControl>
                                                    <FormControl sx={{ minWidth: 120 }}>
                                                        <label htmlFor="quick-global-price" style={{ fontWeight: 400, fontSize: 13, marginBottom: 4, display: "block" }}>
                                                            Giá (₫)
                                                        </label>
                                                        <Input
                                                            id="quick-global-price"
                                                            type="text"
                                                            value={formatCurrencyVND(quickPrice.global)}
                                                            onChange={e =>
                                                                setQuickPrice(prev => ({ ...prev, global: parseCurrencyVND(e.target.value) }))
                                                            }
                                                            size="small"
                                                            sx={{ width: 110, background: "#fff" }}
                                                            placeholder="VD: 150.000đ"
                                                        />
                                                    </FormControl>
                                                </Box>
                                            )}
                                        </Box>
                                        <Table
                                            columns={[
                                                { name: "check", label: "", align: "center", width: 40 },
                                                { name: "name", label: "Sản phẩm", align: "left" },
                                                { name: "size", label: "Kích cỡ", align: "center" },
                                                {
                                                    name: "weight",
                                                    label: "Trọng lượng (g)",
                                                    align: "right",
                                                },
                                                {
                                                    name: "qty",
                                                    label: "Số lượng",
                                                    align: "right"
                                                },
                                                {
                                                    name: "price",
                                                    label: "Giá (₫)",
                                                    align: "right"
                                                },
                                                { name: "image", label: "Ảnh", align: "center" },
                                                { name: "action", label: "", align: "center", width: 40 },
                                            ]}
                                            rows={variant.products.map((p, prodIdx) => ({
                                                check: (
                                                    <input
                                                        type="checkbox"
                                                        checked={checkedRows[colorIdx]?.includes(prodIdx) || false}
                                                        onChange={() => handleCheckRow(colorIdx, prodIdx)}
                                                    />
                                                ),
                                                name: (
                                                    <Tooltip title={p.name || ""}>
                                                        <Input
                                                            value={p.name}
                                                            size="small"
                                                            readOnly
                                                            sx={{ minWidth: 90 }}
                                                        />
                                                    </Tooltip>
                                                ),
                                                size: (
                                                    <Tooltip
                                                        title={getLabelById(sizeOptions, p.sizeId) || ""}
                                                    >
                                                        <Input
                                                            value={getLabelById(sizeOptions, p.sizeId)}
                                                            size="small"
                                                            readOnly
                                                            sx={{ minWidth: 60 }}
                                                        />
                                                    </Tooltip>
                                                ),
                                                weight: (
                                                    <FormControl sx={{ minWidth: 120 }}>
                                                        <Input
                                                            id={`weight-${colorIdx}-${prodIdx}`}
                                                            type="text"
                                                            value={String(p.weight ?? "")}
                                                            onChange={(e) =>
                                                                handleVariantValueChange(
                                                                    colorIdx,
                                                                    prodIdx,
                                                                    "weight",
                                                                    e.target.value
                                                                )
                                                            }
                                                            size="small"
                                                            sx={{ width: 110, background: "#fff" }}
                                                            placeholder="VD: 300"
                                                        />
                                                    </FormControl>
                                                ),
                                                qty: (
                                                    <FormControl sx={{ minWidth: 120 }}>
                                                        <Input
                                                            id={`qty-${colorIdx}-${prodIdx}`}
                                                            type="text"
                                                            value={String(p.qty ?? "")}
                                                            onChange={(e) =>
                                                                handleVariantValueChange(
                                                                    colorIdx,
                                                                    prodIdx,
                                                                    "qty",
                                                                    e.target.value
                                                                )
                                                            }
                                                            size="small"
                                                            sx={{ width: 110, background: "#fff" }}
                                                            placeholder="VD: 20"
                                                        />
                                                    </FormControl>
                                                ),
                                                price: (
                                                    <FormControl sx={{ minWidth: 120 }}>
                                                        <Input
                                                            id={`price-${colorIdx}-${prodIdx}`}
                                                            type="text"
                                                            value={formatCurrencyVND(p.price)}
                                                            onChange={(e) =>
                                                                handleVariantValueChange(
                                                                    colorIdx,
                                                                    prodIdx,
                                                                    "price",
                                                                    e.target.value
                                                                )
                                                            }
                                                            size="small"
                                                            sx={{ width: 110, background: "#fff" }}
                                                            placeholder="VD: 150.000đ"
                                                        />
                                                    </FormControl>
                                                ),
                                                image: (
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                        {Object.values(selectedImages)
                                                            .flat()
                                                            .map((imgId, idx) => {
                                                                const imgObj = imageOptions.find((i) => i.value === imgId);
                                                                if (!imgObj) return null;
                                                                return (
                                                                    <img
                                                                        key={imgId + "-" + idx}
                                                                        src={imgObj.url}
                                                                        alt={imgObj.label}
                                                                        width={38}
                                                                        height={38}
                                                                        style={{
                                                                            borderRadius: 5,
                                                                            border: "1px solid #e3e9f0",
                                                                            objectFit: "cover",
                                                                            background: "#fafbfc",
                                                                            marginRight: 4,
                                                                            boxShadow: "0 2px 8px rgba(25,118,210,0.07)"
                                                                        }}
                                                                    />
                                                                );
                                                            })}
                                                        <Button
                                                            variant="outlined"
                                                            size="small"
                                                            sx={{ minWidth: 54, ml: 1 }}
                                                            onClick={() => openImageModal("all")}
                                                        >
                                                            <Icon fontSize="small">image</Icon>
                                                        </Button>
                                                    </Box>
                                                ),
                                                action: (
                                                    <Tooltip title="Xóa dòng này">
                                                        <IconButton size="small" sx={{ color: "#eb5757" }}>
                                                            <FaTrash />
                                                        </IconButton>
                                                    </Tooltip>
                                                ),
                                            }))}
                                        />
                                    </Card>
                                );
                            })}
                        </SoftBox>
                    </form>
                </Card>
                <Dialog
                    open={showAddProductModal}
                    onClose={() => setShowAddProductModal(false)}
                    maxWidth="xs"
                    fullWidth
                    PaperProps={{ sx: { borderRadius: 4 } }}
                >
                    <DialogTitle sx={{ fontWeight: 700, fontSize: 22, color: "#1976d2" }}>
                        Thêm sản phẩm mới nhanh
                    </DialogTitle>
                    <DialogContent>
                        <SoftBox mb={2}>
                            <label htmlFor="new-product-name" style={{ fontWeight: "bold", marginBottom: 4, display: "block" }}>
                                Tên sản phẩm <span style={{ color: "red" }}>*</span>
                            </label>
                            <Input
                                id="new-product-name"
                                inputRef={autoFocusRef}
                                fullWidth
                                value={newProductName}
                                onChange={e => setNewProductName(e.target.value)}
                                placeholder="Nhập tên sản phẩm mới"
                                sx={{ background: "#f6fafd", borderRadius: 2 }}
                            />
                            {addProductValidate?.newProductName && (
                                <Box sx={{ color: "red", fontSize: 13, mt: 0.5 }}>
                                    {addProductValidate.newProductName}
                                </Box>
                            )}
                        </SoftBox>
                        <SoftBox mb={2}>
                            <label htmlFor="new-product-category" style={{ fontWeight: "bold", marginBottom: 4, display: "block" }}>
                                Danh mục <span style={{ color: "red" }}>*</span>
                            </label>
                            <Select
                                inputId="new-product-category"
                                options={categoryOptions}
                                value={categoryOptions.find(o => o.value === newProductCategory) || null}
                                onChange={opt => setNewProductCategory(opt ? opt.value : "")}
                                placeholder="Chọn danh mục"
                                styles={selectMenuStyle}
                                isClearable
                            />
                            {addProductValidate?.newProductCategory && (
                                <Box sx={{ color: "red", fontSize: 13, mt: 0.5 }}>
                                    {addProductValidate.newProductCategory}
                                </Box>
                            )}
                        </SoftBox>
                        <SoftBox mb={2}>
                            <label htmlFor="new-product-country" style={{ fontWeight: "bold", marginBottom: 4, display: "block" }}>
                                Xuất xứ <span style={{ color: "red" }}>*</span>
                            </label>
                            <Select
                                inputId="new-product-country"
                                options={countryOptions}
                                value={countryOptions.find(o => o.value === newProductCountry) || null}
                                onChange={opt => setNewProductCountry(opt ? opt.value : "")}
                                placeholder="Chọn quốc gia"
                                styles={selectMenuStyle}
                                isClearable
                            />
                            {addProductValidate?.newProductCountry && (
                                <Box sx={{ color: "red", fontSize: 13, mt: 0.5 }}>
                                    {addProductValidate.newProductCountry}
                                </Box>
                            )}
                        </SoftBox>
                        <SoftBox mb={2}>
                            <label htmlFor="new-product-desc" style={{ fontWeight: "bold", marginBottom: 4, display: "block" }}>
                                Mô tả
                            </label>
                            <Input
                                id="new-product-desc"
                                fullWidth
                                value={newProductDesc}
                                onChange={e => setNewProductDesc(e.target.value)}
                                placeholder="Mô tả sản phẩm (không bắt buộc)"
                                sx={{ background: "#f6fafd", borderRadius: 2 }}
                                multiline
                                rows={3}
                            />
                        </SoftBox>
                        {addError && (
                            <SoftBox color="error" mb={1}>
                                {addError}
                            </SoftBox>
                        )}
                        {addSuccess && (
                            <SoftBox color="success" mb={1}>
                                {addSuccess}
                            </SoftBox>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button variant="outlined" onClick={() => setShowAddProductModal(false)}>
                            Đóng
                        </Button>
                        <Button
                            variant="contained"
                            color="info"
                            onClick={handleAddNewProduct}
                            disabled={addProductLoading}
                        >
                            {addProductLoading && (
                                <CircularProgress size={18} color="inherit" sx={{ mr: 1 }} />
                            )}
                            Thêm sản phẩm
                        </Button>
                    </DialogActions>
                </Dialog>
                <Dialog
                    open={showImageModal}
                    onClose={closeImageModal}
                    maxWidth="md"
                    fullWidth
                    PaperProps={{
                        sx: { borderRadius: 4 }
                    }}
                >
                    <DialogTitle sx={{ fontWeight: 700, fontSize: 22, color: "#1976d2" }}>
                        Chọn ảnh cho màu {getLabelById(colorOptions, modalColor)}
                    </DialogTitle>
                    <DialogContent>
                        <SoftBox mb={2} fontWeight="bold">
                            Danh sách ảnh đã chọn
                        </SoftBox>
                        <SoftBox
                            display="flex"
                            alignItems="center"
                            gap={2}
                            flexWrap="wrap"
                            style={{
                                minHeight: 100,
                                border: "1px dashed #d5d5d5",
                                borderRadius: 8,
                                width: "100%",
                                padding: 6,
                                background: "#f9fafc",
                            }}
                        >
                            {tempImages.length === 0 ? (
                                <SoftBox textAlign="center" color="secondary" width="100%">
                                    <img
                                        src="https://cdn-icons-png.flaticon.com/512/4076/4076549.png"
                                        alt="no-img"
                                        style={{ width: 48, opacity: 0.5 }}
                                    />
                                    <div style={{ fontSize: 14, opacity: 0.7 }}>No Data Found</div>
                                </SoftBox>
                            ) : (
                                tempImages.map((id) => {
                                    const img = imageOptions.find((i) => i.value === id);
                                    if (!img) return null;
                                    return (
                                        <SoftBox
                                            key={id}
                                            sx={{
                                                border: "1px solid #ddd",
                                                borderRadius: 2,
                                                p: 0.5,
                                                width: 90,
                                                height: 80,
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                background: "#fafaff",
                                            }}
                                        >
                                            <img
                                                src={img.url}
                                                alt={img.label}
                                                style={{
                                                    width: 70,
                                                    height: 50,
                                                    objectFit: "cover",
                                                    borderRadius: 4,
                                                }}
                                            />
                                            <div style={{ fontSize: 12, textAlign: "center" }}>
                                                {img.label}
                                            </div>
                                        </SoftBox>
                                    );
                                })
                            )}
                        </SoftBox>
                        <SoftBox fontWeight="bold" mt={4} mb={2}>
                            Danh sách ảnh từ hệ thống
                        </SoftBox>
                        <SoftBox display="flex" flexWrap="wrap" gap={2}>
                            {imageOptions.length === 0 ? (
                                <SoftBox textAlign="center" color="secondary" width="100%">
                                    <img
                                        src="https://cdn-icons-png.flaticon.com/512/4076/4076549.png"
                                        alt="no-img"
                                        style={{ width: 48, opacity: 0.5 }}
                                    />
                                    <div style={{ fontSize: 14, opacity: 0.7 }}>No Data Found</div>
                                </SoftBox>
                            ) : (
                                imageOptions.map((img) => (
                                    <SoftBox
                                        key={img.value}
                                        sx={{
                                            border: tempImages.includes(img.value)
                                                ? "2px solid orange"
                                                : "1px dashed #bbb",
                                            borderRadius: 2,
                                            p: 0.5,
                                            position: "relative",
                                            width: 120,
                                            height: 110,
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            cursor: "pointer",
                                            background: "#fff",
                                            transition: "box-shadow 0.2s, border 0.2s",
                                            boxShadow: tempImages.includes(img.value)
                                                ? "0 2px 8px rgba(255,165,0,0.15)"
                                                : "none",
                                        }}
                                        onClick={() => toggleTempImage(img.value)}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={tempImages.includes(img.value)}
                                            readOnly
                                            style={{
                                                position: "absolute",
                                                left: 2,
                                                top: 2,
                                                zIndex: 2,
                                            }}
                                        />
                                        <img
                                            src={img.url}
                                            alt={img.label}
                                            style={{
                                                width: 100,
                                                height: 80,
                                                objectFit: "cover",
                                                borderRadius: 4,
                                            }}
                                        />
                                        <div style={{ fontSize: 14, marginTop: 4 }}>
                                            {img.label}
                                        </div>
                                    </SoftBox>
                                ))
                            )}
                        </SoftBox>
                    </DialogContent>
                    <DialogActions>
                        <Button variant="outlined" onClick={closeImageModal} sx={{ minWidth: 110 }}>
                            Đóng
                        </Button>
                        <Button
                            variant="contained"
                            color="info"
                            onClick={handleSaveImages}
                            disabled={!tempImages.length}
                            sx={{ minWidth: 120, fontWeight: 600 }}
                        >
                            Lưu chọn ảnh
                        </Button>
                    </DialogActions>
                </Dialog>
            </SoftBox>
            <Footer />
        </DashboardLayout>
    );
}

export default ProductForm;