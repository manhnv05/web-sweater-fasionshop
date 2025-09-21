package com.example.datn.service.impl;
import java.math.BigDecimal;

import com.example.datn.config.EmailService;
import com.example.datn.dto.*;
import com.example.datn.mapper.HoaDonChiTietMapper;
import com.example.datn.mapper.HoaDonUpdateMapper;
import com.example.datn.mapper.PhieuGiamGiaMapper;
import com.example.datn.service.EmailThongBaoHoaDonService;
import com.example.datn.vo.hoaDonVO.*;
import com.example.datn.vo.khachHangVO.CapNhatKhachRequestVO;
import com.example.datn.vo.phieuGiamGiaVO.CapNhatPGG;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.BaseFont;
import jakarta.mail.MessagingException;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
//import com.example.datn.dto.response.*;
import com.example.datn.entity.*;
import com.example.datn.enums.TrangThai;
import com.example.datn.exception.AppException;
import com.example.datn.exception.ErrorCode;
import com.example.datn.mapper.HoaDonMapper;
import com.example.datn.repository.*;
import com.example.datn.service.HoaDonService;
import com.example.datn.service.LichSuHoaDonService;
import com.example.datn.specification.HoaDonSpecification;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.List;
import java.util.stream.Collectors;
import java.math.RoundingMode;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.itextpdf.text.Image;
import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;

import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.stream.Stream;
import com.example.datn.dto.HoaDonPdfResult;

import static java.util.Locale.filter;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class HoaDonServiceImpl implements HoaDonService {
    HoaDonRepository hoaDonRepository;
    HoaDonChiTietRepository hoaDonChiTietRepository;
    ChiTietSanPhamRepository chiTietSanPhamRepository;
    KhachHangRepository khachHangRepository;
    NhanVienRepository nhanVienRepository;
    HoaDonMapper hoaDonMapper;
    LichSuHoaDonService lichSuHoaDonService;
    HoaDonChiTietMapper hoaDonChiTietMapper;
    ChiTietThanhToanRepository chiTietThanhToanRepository;
    HinhThucThanhToanRepository hinhThucThanhToanRepository;
    DotGiamGiaRepository dotGiamGiaRepository;
    PhieuGiamGiaRepository phieuGiamGiaRepository;
    EmailService emailService;
    ChiTietPhieuGiamGiaRepository chiTietPhieuGiamGiaRepository;
    EmailThongBaoHoaDonService emailThongBaoHoaDonService;
    SimpMessagingTemplate messagingTemplate;
    @Override
    @Transactional
    public List<HoaDonChiTietDTO> updateDanhSachSanPhamChiTiet(Integer idHoaDon, List<CapNhatSanPhamChiTietDonHangVO> danhSachCapNhatSanPham) {
        //Lấy hóa dơn cần cập nhật
        HoaDon hoaDon = hoaDonRepository.findById(idHoaDon)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
//        if (hoaDon.getTrangThai() != TrangThai.TAO_DON_HANG&& hoaDon.getTrangThai() != TrangThai.CHO_XAC_NHAN) {
//            throw new AppException(ErrorCode.INVALID_STATUS);
//        }
        Map<Integer,HoaDonChiTiet> chiTietHoaDonMap = hoaDonChiTietRepository.findByHoaDon(hoaDon)
                .stream().collect(Collectors.toMap(HoaDonChiTiet::getId, chiTiet -> chiTiet));
        List<HoaDonChiTiet> updatedChiTietList = new ArrayList<>();
        Set<Integer> cacSanPhamDaXuLy= new HashSet<>();
        for (CapNhatSanPhamChiTietDonHangVO capNhatSanPhamChiTietDonHangVO:danhSachCapNhatSanPham){
            Integer idSanPhamChiTiet = capNhatSanPhamChiTietDonHangVO.getId();
            Integer soLuongYeuCau = capNhatSanPhamChiTietDonHangVO.getSoLuong();
            if(idSanPhamChiTiet==null|| soLuongYeuCau==null || soLuongYeuCau<=0){
                throw new AppException(ErrorCode.INSUFFICIENT_QUANTITY);
            }
            if(soLuongYeuCau==0){
                continue;
            }
            cacSanPhamDaXuLy.add(idSanPhamChiTiet);
            ChiTietSanPham chiTietSanPham = chiTietSanPhamRepository.findById(idSanPhamChiTiet)
                    .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
            int soLuongTonKhoVatLy=chiTietSanPham.getSoLuong();
            int soLuongDangCoTrongHoaDon = hoaDonChiTietRepository.getSoLuongDangCho(idSanPhamChiTiet);
            int soLuongCoTheBan = soLuongTonKhoVatLy - soLuongDangCoTrongHoaDon;
            int soLuongDaCoTrongGioHang= chiTietHoaDonMap.get(idSanPhamChiTiet) != null ? chiTietHoaDonMap.get(idSanPhamChiTiet).getSoLuong() : 0;
            int soLuongChenhLech= soLuongYeuCau - soLuongDaCoTrongGioHang;
            //Cái này kiểm tra xem sản phẩm có trong chi tiết hóa đơn chưa có rồi thì cập nhật, nếu chưa có thì tạo mới
            HoaDonChiTiet hoaDonChiTiet = chiTietHoaDonMap.getOrDefault(idSanPhamChiTiet, new HoaDonChiTiet());
            hoaDonChiTiet.setHoaDon(hoaDon);
            hoaDonChiTiet.setSoLuong(soLuongYeuCau);
            hoaDonChiTiet.setGia(chiTietSanPham.getGia());
            hoaDonChiTiet.setSanPhamChiTiet(chiTietSanPham);
            hoaDonChiTiet.setThanhTien(hoaDonChiTiet.getGia()* soLuongYeuCau);
            updatedChiTietList.add(hoaDonChiTiet);
            List<HoaDonChiTiet> danhSachCanXoa = chiTietHoaDonMap.values().stream()
                    .filter(ct -> !cacSanPhamDaXuLy.contains(ct.getSanPhamChiTiet().getId()))
                    .collect(Collectors.toList());
            if (!danhSachCanXoa.isEmpty()) {
                hoaDonChiTietRepository.deleteAllInBatch(danhSachCanXoa);
            }
            if (!updatedChiTietList.isEmpty()) {
                hoaDonChiTietRepository.saveAll(updatedChiTietList);
            }
        }
        List<HoaDonChiTiet> chiTietCuoiCung = hoaDonChiTietRepository.findAllByHoaDon_Id(idHoaDon);
        return hoaDonChiTietMapper.toDtoList(chiTietCuoiCung);
    }


    @Override
    public List<SanPhamTonKhoDTO> GetAllSanPhamTonKho() {
        List<ChiTietSanPham> chiTietSanPhamList = chiTietSanPhamRepository.findAll();
        if (chiTietSanPhamList.isEmpty()) {
            throw new AppException(ErrorCode.PRODUCT_NOT_FOUND);
        }
        return chiTietSanPhamList.stream()
                .map(chiTiet -> new SanPhamTonKhoDTO(
                        chiTiet.getId(),
                        chiTiet.getSoLuong()
                ))
                .collect(Collectors.toList());
    }

    private void recalculateHoaDonTotals(HoaDon hoaDon, List<HoaDonChiTiet> chiTietList) {
        int tongTien = chiTietList.stream()
                .mapToInt(HoaDonChiTiet::getThanhTien)
                .sum();
        hoaDon.setTongTien(tongTien);
    }
    public static String generateShortRandomMaHoaDonUUID() {
        // Lấy một phần của UUID, ví dụ 8 ký tự đầu
        return "HD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        // Ví dụ: HD-A1B2C3D4
    }
    @Override
    public HoaDonChoDTO taoHoaDonCho(HoaDonChoRequestVO request) {
        NhanVien nhanVienDuocGanVaoHoaDon = nhanVienRepository.findById(request.getIdNhanVien())
                .orElseThrow(() -> new AppException(ErrorCode.EMPLOYEE_NOT_FOUND));
        HoaDon hoaDon = new HoaDon();
        hoaDon.setNhanVien(nhanVienDuocGanVaoHoaDon);
        hoaDon.setNgayTao(LocalDateTime.now());
        hoaDon.setTrangThai(TrangThai.valueOf("TAO_DON_HANG"));
        hoaDon.setTongTien(0);
        hoaDon.setTongTienBanDau(0);
        hoaDon.setPhiVanChuyen(0);
        hoaDon.setTongHoaDon(0); // Nếu bạn sử dụng trường này
        hoaDon.setGhiChu(null);
        hoaDon.setSdt(null);
        hoaDon.setDiaChi(null);
        hoaDon.setNgayGiaoDuKien(null);
        hoaDon.setPhieuGiamGia(null);
        hoaDon.setLoaiHoaDon(request.getLoaiHoaDon());
        hoaDon.setMaHoaDon(generateShortRandomMaHoaDonUUID());
        HoaDon saveHoaDon=   hoaDonRepository.save(hoaDon);
        lichSuHoaDonService.ghiNhanLichSuHoaDon(
                hoaDon,
                "Hóa đơn được tạo với trạng thái: " + hoaDon.getTrangThai().getDisplayName(),
                nhanVienDuocGanVaoHoaDon.getHoVaTen(), // Người thực hiện được xác định ở trên
                "Tạo hóa đơn ban đầu",
                hoaDon.getTrangThai()
        );
        return new HoaDonChoDTO(saveHoaDon.getId(),saveHoaDon.getMaHoaDon());
    }

    private Image createQrCode(String data, int size) throws Exception {
        QRCodeWriter writer = new QRCodeWriter();
        BitMatrix bitMatrix = writer.encode(data, BarcodeFormat.QR_CODE, size, size);
        BufferedImage bufferedImage = MatrixToImageWriter.toBufferedImage(bitMatrix);

        // Chuyển BufferedImage thành Image của iText
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(bufferedImage, "png", baos);
        return Image.getInstance(baos.toByteArray());
    }

    @Override
    public HoaDonPdfResult hoadonToPDF(String idHoaDon) {
        HoaDon hoaDon = hoaDonRepository.findById(Integer.valueOf(idHoaDon))
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        Document document = new Document();
        ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
        try {
            PdfWriter.getInstance(document, byteArrayOutputStream);
            document.open();
            InputStream fontStream = getClass().getClassLoader().getResourceAsStream("fonts/ARIAL.TTF");
            BaseFont baseFont = BaseFont.createFont(
                    "ARIAL.TTF",
                    BaseFont.IDENTITY_H,
                    BaseFont.EMBEDDED,
                    true,
                    fontStream.readAllBytes(),
                    null
            );
            Font font = new Font(baseFont, 12);
            Font fontTitle = new Font(baseFont, 16, Font.BOLD);
            Paragraph title2 = new Paragraph("Fashion Shop", fontTitle);
            Paragraph titleDSSP = new Paragraph("Danh Sách sản phẩm", fontTitle);
            Paragraph sdt = new Paragraph("Số điện thoại: 0192345544", font);
            Paragraph email = new Paragraph("Email: shop@gmail.com", font);
            Paragraph diaChi = new Paragraph("Địa chỉ: FPT , Phúc diên, Bắc Từ liêm, Hà Nội", font);
            PdfPTable headerTable = new PdfPTable(2); // Bảng có 2 cột
            headerTable.setWidthPercentage(100);
            headerTable.setWidths(new float[]{1, 4}); // Cột QR chiếm 1 phần, cột thông tin chiếm 4 phần
            headerTable.setSpacingAfter(20f); // Tạo khoảng cách với phần "HÓA ĐƠN BÁN HÀNG" bên dưới
// Cột 1 (Trái): Chứa mã QR
            PdfPCell qrCell = new PdfPCell();
            Image qrImage = createQrCode(hoaDon.getMaHoaDon(), 80); // Tạo QR kích thước 80x80 pixels
            qrCell.addElement(qrImage);
            qrCell.setBorder(Rectangle.NO_BORDER); // Xóa viền ô
            headerTable.addCell(qrCell);
// Cột 2 (Phải): Chứa thông tin cửa hàng
            PdfPCell shopInfoCell = new PdfPCell();
// Bỏ căn giữa để chữ căn trái tự nhiên
            title2.setAlignment(Element.ALIGN_LEFT);
            sdt.setAlignment(Element.ALIGN_LEFT);
            email.setAlignment(Element.ALIGN_LEFT);
            diaChi.setAlignment(Element.ALIGN_LEFT);
// Thêm các dòng thông tin vào ô bên phải
            shopInfoCell.addElement(title2);
            shopInfoCell.addElement(sdt);
            shopInfoCell.addElement(email);
            shopInfoCell.addElement(diaChi);
            shopInfoCell.setBorder(Rectangle.NO_BORDER); // Xóa viền ô
            headerTable.addCell(shopInfoCell);
// Thêm bảng header vừa tạo vào văn bản
            document.add(headerTable);
// Căn giữa cho tiêu đề "DANH SÁCH SẢN PHẨM"
            titleDSSP.setAlignment(Element.ALIGN_CENTER);
            // Tiêu đề
            Paragraph title = new Paragraph("HÓA ĐƠN BÁN HÀNG", fontTitle);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            document.add(new Paragraph(" ", font));
            // Thông tin hóa đơn
// Bảng 2 cột: Trái là thông tin khách hàng, phải là thông tin đơn hàng
            PdfPTable bangThongTin = new PdfPTable(2);
            bangThongTin.setWidthPercentage(100);
            bangThongTin.setWidths(new int[]{1, 1}); // Chia đều 2 cột
            PdfPCell oThongTinKhach = new PdfPCell();
            oThongTinKhach.setBorder(Rectangle.NO_BORDER);
            StringBuilder noiDungKhachHang = new StringBuilder();
            if (hoaDon.getKhachHang() != null) {
                noiDungKhachHang.append("Khách hàng: ").append(hoaDon.getKhachHang().getTenKhachHang()).append("\n");
                noiDungKhachHang.append("SĐT: ").append(hoaDon.getKhachHang().getSdt()).append("\n");
                noiDungKhachHang.append("Email: ").append(hoaDon.getKhachHang().getEmail()).append("\n");
                noiDungKhachHang.append("Địa chỉ: ").append(hoaDon.getDiaChi()).append("\n");
            } else {
                noiDungKhachHang.append("Khách hàng: \n");
                noiDungKhachHang.append("SĐT: \n");
                noiDungKhachHang.append("Email: \n");
                noiDungKhachHang.append("Địa chỉ: \n");
            }
            oThongTinKhach.addElement(new Paragraph(noiDungKhachHang.toString(), font));
            PdfPCell oThongTinHoaDon = new PdfPCell();
            oThongTinHoaDon.setBorder(Rectangle.NO_BORDER);
            StringBuilder noiDungHoaDon = new StringBuilder();
            noiDungHoaDon.append("Mã HĐ: ").append(hoaDon.getMaHoaDon()).append("\n");
            noiDungHoaDon.append("Ngày tạo: ").append(hoaDon.getNgayTao()).append("\n");
            noiDungHoaDon.append("Tổng tiền: ").append(hoaDon.getTongTien()).append(" VND");
            oThongTinHoaDon.addElement(new Paragraph(noiDungHoaDon.toString(), font));
            bangThongTin.addCell(oThongTinKhach);
            bangThongTin.addCell(oThongTinHoaDon);
            document.add(bangThongTin);
            document.add(new Paragraph(" ", font));
            // Bảng chi tiết
            PdfPTable table = new PdfPTable(3);
            table.setWidthPercentage(100);
            table.setWidths(new int[]{4, 2, 2});
            document.add(titleDSSP);
            document.add(new Paragraph(" ", font));
            // Header bảng
            Stream.of("Sản phẩm", "Số lượng" , "Thành tiền")
                    .forEach(headerTitle -> {
                        PdfPCell header = new PdfPCell();
                        header.setPhrase(new Phrase(headerTitle, font));
                        header.setHorizontalAlignment(Element.ALIGN_CENTER);
                        header.setBackgroundColor(BaseColor.LIGHT_GRAY);
                        table.addCell(header);
                    });
            // Dòng dữ liệu
            for (HoaDonChiTiet cthd : hoaDon.getHoaDonChiTietList()) {
                table.addCell(new Phrase(cthd.getSanPhamChiTiet().getSanPham().getTenSanPham() + "-" + cthd.getSanPhamChiTiet().getKichThuoc().getTenKichCo() + "-" + cthd.getSanPhamChiTiet().getMauSac().getTenMauSac() , font));
                table.addCell(new Phrase(String.valueOf(cthd.getSoLuong()), font));
                table.addCell(new Phrase(String.valueOf(cthd.getThanhTien()), font));
            }
            PdfPTable table2 = new PdfPTable(2); // 2 cột
            table2.setWidthPercentage(100);
            // Tạo cột trái
            Font fontLeft = new Font(baseFont, 12);
            PdfPCell leftCell2 = new PdfPCell(new Phrase("Tổng tiền hàng:", fontLeft));
            leftCell2.setBorder(Rectangle.NO_BORDER);
            table2.addCell(leftCell2);
            Font fontRight = new Font(baseFont, 12, Font.BOLD);
            PdfPCell rightCell2 = new PdfPCell(new Phrase(hoaDon.getTongTienBanDau() + " VNĐ", fontRight));
            rightCell2.setHorizontalAlignment(Element.ALIGN_RIGHT);
            rightCell2.setBorder(Rectangle.NO_BORDER);
            table2.addCell(rightCell2);
            table2.addCell(createLeftCell("Giảm giá:", fontLeft));
            if(hoaDon.getPhieuGiamGia() != null) {
                table2.addCell(createRightCell(hoaDon.getTongTienBanDau() - hoaDon.getTongTien() + " VND", fontRight));
            }
            else {
                table2.addCell(createRightCell("0 VNĐ", fontRight));
            }
            table2.addCell(createLeftCell("Phí giao hàng:", fontLeft));
            table2.addCell(createRightCell(hoaDon.getPhiVanChuyen() + " VND", fontRight));
            table2.addCell(createLeftCell("Tổng tiền cần thanh toán:", fontLeft));
            table2.addCell(createRightCell(hoaDon.getTongHoaDon() + " VND", fontRight));
            document.add(table);
            document.add(new Paragraph(" ", font));
            document.add(table2);
            document.close();
        } catch (DocumentException | IOException e) {
            e.printStackTrace();
            throw new RuntimeException("Lỗi khi tạo PDF hóa đơn: " + e.getMessage());
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        return new HoaDonPdfResult(hoaDon.getMaHoaDon(), new ByteArrayInputStream(byteArrayOutputStream.toByteArray()));
    }

    private PdfPCell createLeftCell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setHorizontalAlignment(Element.ALIGN_LEFT);
        cell.setBorder(Rectangle.NO_BORDER);
        return cell;
    }

    private PdfPCell createRightCell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        cell.setBorder(Rectangle.NO_BORDER);
        return cell;
    }

    @Override
    public void capNhatSoLuongSanPhamTrongKho(HoaDon hoaDon, boolean isDeducting) {
        // Lấy tất cả chi tiết hóa đơn của hóa đơn này
        List<HoaDonChiTiet> chiTietList = hoaDonChiTietRepository.findAllByHoaDon_Id(hoaDon.getId());
        for (HoaDonChiTiet chiTiet : chiTietList) {
            ChiTietSanPham sanPhamCanUpdate = chiTiet.getSanPhamChiTiet();
            int soLuongTrongDon = chiTiet.getSoLuong();
            if (isDeducting) {
                // TRỪ KHỎI KHO: Khi xác nhận/hoàn thành đơn
                int soLuongTonKhoHienTai = sanPhamCanUpdate.getSoLuong();
                if (soLuongTonKhoHienTai < soLuongTrongDon) {
                    // Ném ra lỗi nếu kho không đủ, đây là bước kiểm tra an toàn cuối cùng
                    throw new AppException(ErrorCode.INSUFFICIENT_QUANTITY);
                }
                sanPhamCanUpdate.setSoLuong(soLuongTonKhoHienTai - soLuongTrongDon);
            } else {
                // CỘNG TRẢ VÀO KHO: Khi hủy đơn
                sanPhamCanUpdate.setSoLuong(sanPhamCanUpdate.getSoLuong() + soLuongTrongDon);
            }
            // Lưu lại thông tin sản phẩm đã được cập nhật số lượng
            chiTietSanPhamRepository.save(sanPhamCanUpdate);
        }
    }

    @Override
    public TongTienHoaDonDto getThongTinGiamGiaByHoaDonId(Integer idHoaDon) {
        HoaDon hoaDon = hoaDonRepository.findById(idHoaDon)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        PhieuGiamGia phieuGiamGia = hoaDon.getPhieuGiamGia();
        TongTienHoaDonDto tongTienHoaDonDto = new TongTienHoaDonDto();
        if (phieuGiamGia != null) {
            tongTienHoaDonDto.setPhieuGiamGia(phieuGiamGia.getMaPhieuGiamGia());
            tongTienHoaDonDto.setGiamGia(hoaDon.getTongTienBanDau() - hoaDon.getTongTien());
        } else {
            tongTienHoaDonDto.setPhieuGiamGia(null);
            tongTienHoaDonDto.setGiamGia(0);
        }
        tongTienHoaDonDto.setTongTien(hoaDon.getTongTien());
        tongTienHoaDonDto.setPhiVanChuyen(hoaDon.getPhiVanChuyen());
        tongTienHoaDonDto.setTongTienHang(hoaDon.getTongTienBanDau());
        tongTienHoaDonDto.setTongHoaDon(hoaDon.getTongHoaDon());
        return tongTienHoaDonDto;
    }

    @Override
    public int tinhGiaCuoiCung(ChiTietSanPham spct) {
        int giaGoc= spct.getGia();
        List<DotGiamGia> dotGiamGiaList= dotGiamGiaRepository.findAll();
        Optional<DotGiamGia> dotGiamGiaOptional = dotGiamGiaList.stream().filter(dotGiamGia -> dotGiamGia.getTrangThai()==1
                        && !LocalDateTime.now().isBefore(dotGiamGia.getNgayBatDau()) &&
                        !LocalDateTime.now().isAfter(dotGiamGia.getNgayKetThuc()))
                .findFirst();
        if (dotGiamGiaOptional.isPresent()) {
            DotGiamGia dotGiamGia = dotGiamGiaOptional.get();
            DotGiamGia dgg = dotGiamGiaOptional.get();
            Integer phanTramGiam = dotGiamGia.getPhanTramGiamGia();
            Integer giaSauGiam = (int) Math.round(giaGoc * (1 - phanTramGiam / 100.0));
            return giaSauGiam;
        }
        return giaGoc;
    }

    @Override
    public String capNhatKhachHangVaoHoaDon(CapNhatKhachRequestVO capNhatKhachRequest) {
        HoaDon hoaDon = hoaDonRepository.findById(capNhatKhachRequest.getIdHoaDon())
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        if (capNhatKhachRequest.getIdKhachHang() != null) {
            KhachHang  khachHang = khachHangRepository.findById(capNhatKhachRequest.getIdKhachHang())
                    .orElseThrow(() -> new AppException(ErrorCode.CUSTOMER_NOT_FOUND));
            hoaDon.setKhachHang(khachHang);
        }else {
            hoaDon.setKhachHang(null);
        }
        hoaDonRepository.save(hoaDon);
        return "Cập nhật khách hàng thành công!";
    }

    @Override
    public HoaDonDTOMess capnhatPGGVaoHoaDon(CapNhatPGG capNhatPGG) {
        HoaDon hoaDon = hoaDonRepository.findById(capNhatPGG.getIdHoaDon())
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        String newMaPgg = capNhatPGG.getMaPgg();
        if ((newMaPgg == null || newMaPgg.trim().isEmpty()) && hoaDon.getPhieuGiamGia() != null) {
            hoaDon.setPhieuGiamGia(null);
            hoaDonRepository.save(hoaDon);
            PhieuGiamGiaDTO hoaDonDTO = PhieuGiamGiaMapper.INSTANCE.toResponse(hoaDon.getPhieuGiamGia());
            HoaDonDTOMess hoaDonDTOMess = new HoaDonDTOMess();
            hoaDonDTOMess.setPhieuGiamGiaDTO(hoaDonDTO);
            hoaDonDTOMess.setMess("Đã xóa phiếu giảm giá khỏi hóa đơn!");
            return hoaDonDTOMess;
        }
        // Tìm phiếu giảm giá
        PhieuGiamGia newPGG = phieuGiamGiaRepository.findByMaPhieuGiamGia(newMaPgg);
        if (newPGG != null) {
            PhieuGiamGia currentPGG = hoaDon.getPhieuGiamGia();
            // Nếu hóa đơn chưa có PGG hoặc mã khác với mã mới => cập nhật
            if (currentPGG == null) {
                hoaDon.setPhieuGiamGia(newPGG);
                hoaDonRepository.save(hoaDon);
                PhieuGiamGiaDTO hoaDonDTO = PhieuGiamGiaMapper.INSTANCE.toResponse(hoaDon.getPhieuGiamGia());
                HoaDonDTOMess hoaDonDTOMess = new HoaDonDTOMess();
                hoaDonDTOMess.setPhieuGiamGiaDTO(hoaDonDTO);
                hoaDonDTOMess.setMess("Đã thêm phiếu giảm giá vào hóa đơn!");
                return hoaDonDTOMess;
            } else if (!currentPGG.getMaPhieuGiamGia().equals(newMaPgg)) {
                hoaDon.setPhieuGiamGia(newPGG);
                hoaDonRepository.save(hoaDon);
                PhieuGiamGiaDTO hoaDonDTO = PhieuGiamGiaMapper.INSTANCE.toResponse(hoaDon.getPhieuGiamGia());
                HoaDonDTOMess hoaDonDTOMess = new HoaDonDTOMess();
                hoaDonDTOMess.setPhieuGiamGiaDTO(hoaDonDTO);
                hoaDonDTOMess.setMess("Đã cập nhật phiếu giảm giá mới cho hóa đơn!");
                return hoaDonDTOMess;
            }
        }
        // Nếu giống nhau thì không cần làm gì
        HoaDonDTOMess hoaDonDTOMess = new HoaDonDTOMess();
        hoaDonDTOMess.setMess("");
        hoaDonDTOMess.setPhieuGiamGiaDTO(null);
        return hoaDonDTOMess;
    }



    @Override
    public CapNhatTrangThaiDTO capNhatTrangThaiHoaDon(Integer idHoaDon, TrangThai trangThaiMoi, String ghiChu, String nguoiThucHien) {
        HoaDon hoaDon = hoaDonRepository.findById(idHoaDon)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        TrangThai trangThaiCu = hoaDon.getTrangThai();
        if (trangThaiCu == trangThaiMoi) {
            throw new AppException(ErrorCode.NO_STATUS_CHANGE);
        }
        // Nên lấy người thực hiện từ ngữ cảnh bảo mật (ví dụ: Spring Security) thay vì giả lập
        String nguoiThucHienThayDoi;
        if (nguoiThucHien != null) {
            // 1. Ưu tiên người thực hiện được truyền vào (ví dụ: admin)
            nguoiThucHienThayDoi = nguoiThucHien;
        } else if (hoaDon.getNhanVien() != null) {
            // 2. Nếu không có, lấy tên nhân viên từ hóa đơn (nếu có)
            nguoiThucHienThayDoi = hoaDon.getNhanVien().getHoVaTen();
        } else {
            // 3. Nếu cả hai đều không có, mặc định là "Khách hàng"
            nguoiThucHienThayDoi = "Khách hàng";
        }
        hoaDon.setTrangThai(trangThaiMoi);
        HoaDon updatedHoaDon = hoaDonRepository.save(hoaDon);
        String noiDungThayDoi = String.format("Trạng thái hóa đơn thay đổi từ '%s' sang '%s'",
                trangThaiCu.getDisplayName(), trangThaiMoi.getDisplayName());
        lichSuHoaDonService.ghiNhanLichSuHoaDon(updatedHoaDon, noiDungThayDoi, nguoiThucHienThayDoi, ghiChu, trangThaiMoi);

        emailThongBaoHoaDonService.guiThongBaoCapNhatTrangThai(updatedHoaDon.getId(),trangThaiMoi);
        return new CapNhatTrangThaiDTO(
                updatedHoaDon.getId(),
                updatedHoaDon.getTrangThai().name(),
                updatedHoaDon.getTrangThai().getDisplayName(),
                "Cập nhật trạng thái thành công!"
        );
    }

    @Override
    public CapNhatTrangThaiDTO capNhatTrangThaiHoaDonKhiQuayLai(Integer idHoaDon, TrangThai trangThaiMoi, String ghiChu, String nguoiThucHien) {
        HoaDon hoaDon = hoaDonRepository.findById(idHoaDon)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        TrangThai trangThaiCu = hoaDon.getTrangThai();
        if (trangThaiCu == trangThaiMoi) {
            throw new AppException(ErrorCode.NO_STATUS_CHANGE);
        }
        if (!trangThaiCu.canRevertTo(trangThaiMoi)) { // Kiểm tra lùi lại
            throw new AppException(ErrorCode.INVALID_STATUS_TRANSITION);
        }
        String nguoiThucHienThayDoi = nguoiThucHien != null ? nguoiThucHien : hoaDon.getNhanVien().getHoVaTen();
        hoaDon.setTrangThai(trangThaiMoi);
        HoaDon updatedHoaDon = hoaDonRepository.save(hoaDon);
        String noiDungThayDoi = String.format("Trạng thái hóa đơn thay đổi từ '%s' sang '%s'",
                trangThaiCu.getDisplayName(), trangThaiMoi.getDisplayName());
        lichSuHoaDonService.ghiNhanLichSuHoaDon(updatedHoaDon, noiDungThayDoi, nguoiThucHienThayDoi, ghiChu, trangThaiMoi);
        return new CapNhatTrangThaiDTO(
                updatedHoaDon.getId(),
                updatedHoaDon.getTrangThai().name(),
                updatedHoaDon.getTrangThai().getDisplayName(),
                "Cập nhật trạng thái thành công!"
        );
    }

    @Override
    public List<HoaDonHistoryDTO> layLichSuThayDoiTrangThai(String maHoaDon) {
        return lichSuHoaDonService.layLichSuThayDoiTrangThai(maHoaDon);
    }

    @Override
    public HoaDonDTO getHoaDonById(Integer id) {
        HoaDon hoaDon = hoaDonRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        HoaDonDTO hoaDonResponse = hoaDonMapper.toHoaDonResponse(hoaDon);

        if (hoaDon.getKhachHang() != null) {
            hoaDonResponse.setIdKhachHang(hoaDon.getKhachHang().getId());
        }
        if (hoaDon.getNhanVien() != null) {
            hoaDonResponse.setIdNhanVien(hoaDon.getNhanVien().getId());
        }
        hoaDonResponse.setDanhSachChiTiet(
                hoaDonChiTietRepository.findAllByHoaDon_Id(hoaDon.getId()).stream()
                        .map(hoaDonChiTiet -> {
                            HoaDonChiTietDTO chiTietResponse = new HoaDonChiTietDTO();
                            chiTietResponse.setId(hoaDonChiTiet.getId());
                            if (hoaDonChiTiet.getSanPhamChiTiet() != null) {
                                chiTietResponse.setMaSanPhamChiTiet(hoaDonChiTiet.getSanPhamChiTiet().getMaSanPhamChiTiet());
                                chiTietResponse.setIdSanPhamChiTiet(hoaDonChiTiet.getSanPhamChiTiet().getId());
                                chiTietResponse.setTenSanPham(hoaDonChiTiet.getSanPhamChiTiet().getSanPham().getTenSanPham());
                                chiTietResponse.setTenKichThuoc(hoaDonChiTiet.getSanPhamChiTiet().getKichThuoc().getTenKichCo());
                                chiTietResponse.setTenMauSac(hoaDonChiTiet.getSanPhamChiTiet().getMauSac().getTenMauSac());
                                if (hoaDonChiTiet.getSanPhamChiTiet() != null
                                        && hoaDonChiTiet.getSanPhamChiTiet().getSpctHinhAnhs() != null
                                        && !hoaDonChiTiet.getSanPhamChiTiet().getSpctHinhAnhs().isEmpty()
                                        && hoaDonChiTiet.getSanPhamChiTiet().getSpctHinhAnhs().getFirst().getHinhAnh() != null) {

                                    chiTietResponse.setDuongDanAnh(
                                            String.valueOf(
                                                    hoaDonChiTiet.getSanPhamChiTiet()
                                                            .getSpctHinhAnhs()
                                                            .getFirst()
                                                            .getHinhAnh()
                                                            .getDuongDanAnh()
                                            )
                                    );
                                } else {
                                    chiTietResponse.setDuongDanAnh("no-image.png"); // ảnh mặc định khi không có
                                }
                            }
                            chiTietResponse.setSoLuong(hoaDonChiTiet.getSoLuong());
                            chiTietResponse.setGia(hoaDonChiTiet.getGia());
                            chiTietResponse.setThanhTien(hoaDonChiTiet.getThanhTien());
                            chiTietResponse.setGhiChu(hoaDonChiTiet.getGhiChu());
                            chiTietResponse.setTrangThai(hoaDonChiTiet.getTrangThai());
                            return chiTietResponse;
                        }).collect(Collectors.toList())
        );
        return hoaDonResponse;
    }

    @Override
    public Page<HoaDonDTO> getFilteredHoaDon( // Đây là phương thức duy nhất để lọc
                                              TrangThai trangThai,
                                              String loaiHoaDon,
                                              LocalDate ngayTaoStart,
                                              LocalDate ngayTaoEnd,
                                              String searchTerm,
                                              Pageable pageable) {
        Pageable newPageable = PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize()
        );
        Specification<HoaDon> spec = HoaDonSpecification.filterHoaDon(
                trangThai, loaiHoaDon, ngayTaoStart, ngayTaoEnd, searchTerm
        );
        Page<HoaDon> hoaDonPage = hoaDonRepository.findAll(spec, newPageable);
        return hoaDonPage.map(this::convertToHoaDonResponseWithDetails);
    }

    @Override
    public Map<TrangThai, Long> getStatusCounts() {
        List<CountTrangThaiHoaDon> counts = hoaDonRepository.getCoutnTrangThaiHoaDon();
        return counts.stream()
                .collect(Collectors.toMap(CountTrangThaiHoaDon::getTrangThai, CountTrangThaiHoaDon::getSoLuong));
    }

    private String normalize(String input) {
        if (input == null) return "";
        return Normalizer.normalize(input, Normalizer.Form.NFC).trim().toLowerCase(new Locale("vi", "VN"));
    }

    @Override
    public CapNhatTrangThaiDTO chuyenTrangThaiTiepTheo(Integer idHoaDon, String ghiChu, String nguoiThucHien) {
        HoaDon hoaDon = hoaDonRepository.findById(idHoaDon)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        List<TrangThai> listTrangThai;
        String loaiHoaDon = normalize(hoaDon.getLoaiHoaDon());
        if (loaiHoaDon.contains("tại quầy")) {
            listTrangThai = Arrays.asList(
                    TrangThai.TAO_DON_HANG,
                    TrangThai.DA_XAC_NHAN,
                    TrangThai.CHO_GIAO_HANG,
                    TrangThai.DANG_VAN_CHUYEN,
                    TrangThai.HOAN_THANH
            );
        } else {
            listTrangThai = Arrays.asList(
                    TrangThai.TAO_DON_HANG,
                    TrangThai.CHO_XAC_NHAN,
                    TrangThai.CHO_GIAO_HANG,
                    TrangThai.DANG_VAN_CHUYEN,
                    TrangThai.HOAN_THANH
            );
        }
        TrangThai trangThaiCu = hoaDon.getTrangThai();
        int currentIndex = listTrangThai.indexOf(trangThaiCu);
        if (currentIndex == -1 || currentIndex >= listTrangThai.size() - 1) {
//            throw new AppException(ErrorCode.INVALID_STATUS_TRANSITION);
        }
        TrangThai trangThaiMoi = listTrangThai.get(currentIndex + 1);
        return capNhatTrangThaiHoaDon(idHoaDon, trangThaiMoi, ghiChu, nguoiThucHien);
    }
    private CapNhatTrangThaiDTO mapToCapNhatTrangThaiDTO(HoaDon hoaDon) {
        // Định dạng ngày tháng cho nhất quán với frontend
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        String ngayTaoFormatted = hoaDon.getNgayTao() != null ? hoaDon.getNgayTao().format(formatter) : "N/A";

        // SỬ DỤNG CONSTRUCTOR ĐẦY ĐỦ ĐỂ TẠO DTO CHO REAL-TIME
        return new CapNhatTrangThaiDTO(
                hoaDon.getId(),
                hoaDon.getTrangThai().name(), // trangThaiMoi
                hoaDon.getTrangThai().getDisplayName(), // tenTrangThaiMoi (theo yêu cầu của bạn)
                "Cập nhật trạng thái thành công!", // message (theo yêu cầu của bạn)
                hoaDon.getMaHoaDon(),
                ngayTaoFormatted,
                hoaDon.getKhachHang().getId(),
                new BigDecimal(hoaDon.getTongTien()),
                hoaDon.getHoaDonChiTietList().size(),
                hoaDon.getDiaChi()
        );
    }
    @Override
    public CapNhatTrangThaiDTO huyHoaDon(Integer idHoaDon, String ghiChu, String nguoiThucHien) {
        HoaDon hoaDon = hoaDonRepository.findById(idHoaDon)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        TrangThai trangThaiCu = hoaDon.getTrangThai();
        if (trangThaiCu == TrangThai.HUY) {
            throw new AppException(ErrorCode.ORDER_HAS_BEEN_CANCELLED);
        }
        if (!trangThaiCu.canTransitionTo(TrangThai.HUY)) {
            throw new AppException(ErrorCode.INVALID_STATUS_TRANSITION);
        }
        if (hoaDon.getPhieuGiamGia() != null){
         PhieuGiamGia phieuGiamGia = phieuGiamGiaRepository.findById(hoaDon.getPhieuGiamGia().getId()).orElse(null);

         if (phieuGiamGia.getLoaiPhieu()==0){
             phieuGiamGia.setSoLuong(
                     phieuGiamGia.getSoLuong().add(BigDecimal.ONE));
             phieuGiamGiaRepository.save(phieuGiamGia);
         } else if (phieuGiamGia.getLoaiPhieu()==1) {
             ChiTietPhieuGiamGia chiTietPhieuGiamGia = new ChiTietPhieuGiamGia();
             chiTietPhieuGiamGia.setKhachHang(hoaDon.getKhachHang());
             chiTietPhieuGiamGia.setPhieuGiamGia(hoaDon.getPhieuGiamGia());
             chiTietPhieuGiamGia.setTrangThai("1");
             chiTietPhieuGiamGiaRepository.save(chiTietPhieuGiamGia);
         }
        }
        List<HoaDonChiTiet> chiTietList = hoaDonChiTietRepository.findAllByHoaDon_Id(idHoaDon);
        for (HoaDonChiTiet chiTiet : chiTietList) {
            tangSoLuongSanPhamChiTiet(
                    chiTiet.getSanPhamChiTiet().getId(),
                    chiTiet.getSoLuong()
            );
        }
        // Gọi hàm cập nhật trạng thái như cũ
        CapNhatTrangThaiDTO result = capNhatTrangThaiHoaDon(idHoaDon, TrangThai.HUY, ghiChu, nguoiThucHien);

        // --- BẮT ĐẦU PHẦN THÊM MỚI ---
        // Sau khi cập nhật thành công, gửi thông báo WebSocket
        if (result != null) {
            // Tạo payload để gửi đi
            Map<String, Object> orderUpdatePayload = new HashMap<>();
            orderUpdatePayload.put("idHoaDon", idHoaDon);
            orderUpdatePayload.put("maHoaDon", hoaDon.getMaHoaDon()); // Lấy mã hóa đơn từ object đã load
            orderUpdatePayload.put("trangThaiMoi", TrangThai.HUY.name());
            orderUpdatePayload.put("thongBao", "Đơn hàng " + hoaDon.getMaHoaDon() + " đã được khách hàng hủy.");

            System.out.println("PAYLOAD: " + orderUpdatePayload.toString());
            // Gửi thông báo đến kênh của TẤT CẢ admin
            String adminTopic = "/topic/admin/order-updates";
            System.out.println("CHUẨN BỊ GỬI WEBSOCKET ĐẾN TOPIC: " + adminTopic);
            messagingTemplate.convertAndSend(adminTopic, orderUpdatePayload);
            System.out.println("ĐÃ GỌI HÀM convertAndSend.");

            if (hoaDon.getKhachHang() != null && hoaDon.getKhachHang().getId() != null) {
                // Lấy ID của khách hàng từ đơn hàng
                Integer userId = hoaDon.getKhachHang().getId();
                String userTopic = "/topic/orders/" + userId;

                // Cập nhật lại thông báo cho phù hợp với client
                orderUpdatePayload.put("thongBao", "Đơn hàng #" + hoaDon.getMaHoaDon() + " của bạn đã bị hủy.");

                System.out.println("CHUẨN BỊ GỬI WEBSOCKET ĐẾN CLIENT: " + userTopic);
                messagingTemplate.convertAndSend(userTopic, orderUpdatePayload);
            }

        }
        // --- KẾT THÚC PHẦN THÊM MỚI ---

        return result;
    }


    @Override
    public CapNhatTrangThaiDTO quayLaiTrangThaiTruoc(Integer idHoaDon, String ghiChu, String nguoiThucHien) {
        HoaDon hoaDon = hoaDonRepository.findById(idHoaDon)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        TrangThai trangThaiHienTai = hoaDon.getTrangThai();
        HoaDonHistoryDTO lichSuGanNhat = lichSuHoaDonService.layLichSuThayDoiTrangThaiGanNhat(idHoaDon);
        if (lichSuGanNhat==null) {
            throw new AppException(ErrorCode.NO_PREVIOUS_STATUS);
        }
        TrangThai trangThai= TrangThai.valueOf(lichSuGanNhat.getTrangThaiHoaDon());
        TrangThai trangThaiQuayLai = trangThai;
        if (!trangThaiHienTai.canRevertTo(trangThaiQuayLai)) {
            throw new AppException(ErrorCode.INVALID_STATUS_TRANSITION);
        }
        return capNhatTrangThaiHoaDonKhiQuayLai(idHoaDon, trangThaiQuayLai, ghiChu, nguoiThucHien);

    }

    @Override
    public String capNhatThongTinHoaDon(Integer idHoaDon, HoaDonUpdateVO request) {
        HoaDon hoaDon = hoaDonRepository.findById(idHoaDon)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        hoaDon.setSdt(request.getSdt());
        hoaDon.setDiaChi(request.getDiaChi());
        hoaDon.setTenKhachHang(request.getTenKhachHang());
        hoaDon.setGhiChu(request.getGhiChu());
        hoaDon.setPhiVanChuyen(request.getPhiVanChuyen());
        Integer tongTien=    hoaDon.getTongTien();
        Integer phiVanChuyen= request.getPhiVanChuyen();
        hoaDon.setTongHoaDon(tongTien+phiVanChuyen);
        hoaDonRepository.save(hoaDon);
        return "Cập nhật thong tin đơn hàng thành công";
    }



    @Override
    public List<HoaDonChiTietSanPhamDTO> findChiTietHoaDon(Integer idHoaDon) {
        if (idHoaDon==null || idHoaDon<=0){
            throw new AppException(ErrorCode.ORDER_NOT_FOUND);
        }
        if (!hoaDonRepository.existsById(idHoaDon)){
            throw new AppException(ErrorCode.ORDER_NOT_FOUND);
        }
        List<HoaDonChiTiet> listHoaDonChiTiet = hoaDonChiTietRepository.findChiTietHoaDon(idHoaDon);
        List<HoaDonChiTietSanPhamDTO> hoaDonChiTietSanPhamDTOS= new ArrayList<>();
        for (HoaDonChiTiet hoaDonChiTiet : listHoaDonChiTiet) {
            List<String> listHinhAnh = new ArrayList<>();
            for (SpctHinhAnh spctHinhAnh: hoaDonChiTiet.getSanPhamChiTiet().getSpctHinhAnhs()){
                listHinhAnh.add(spctHinhAnh.getHinhAnh().getDuongDanAnh());
            }
            HoaDonChiTietSanPhamDTO chiTietDTO = new HoaDonChiTietSanPhamDTO();
            chiTietDTO.setId(hoaDonChiTiet.getId());
            chiTietDTO.setMaSanPhamChiTiet(hoaDonChiTiet.getSanPhamChiTiet().getMaSanPhamChiTiet());
            chiTietDTO.setTenSanPham(hoaDonChiTiet.getSanPhamChiTiet().getSanPham().getTenSanPham());
            chiTietDTO.setTenKichThuoc(hoaDonChiTiet.getSanPhamChiTiet().getKichThuoc().getTenKichCo());
            chiTietDTO.setTenMauSac(hoaDonChiTiet.getSanPhamChiTiet().getMauSac().getTenMauSac());
            chiTietDTO.setSoLuong(hoaDonChiTiet.getSoLuong());
            chiTietDTO.setGia(hoaDonChiTiet.getGia());
            chiTietDTO.setThanhTien(hoaDonChiTiet.getThanhTien());
            chiTietDTO.setGhiChu(hoaDonChiTiet.getGhiChu());
            chiTietDTO.setTrangThai(hoaDonChiTiet.getTrangThai());
            chiTietDTO.setHinhAnhctsp(listHinhAnh);
            hoaDonChiTietSanPhamDTOS.add(chiTietDTO);
        }
        return hoaDonChiTietSanPhamDTOS;
    }

    @Override
    @Transactional
    public String tangSoLuongSanPhamChiTiet(Integer idSanPhamChiTiet, Integer soLuong) {
        if (idSanPhamChiTiet == null || idSanPhamChiTiet <= 0) {
            throw new AppException(ErrorCode.PRODUCT_NOT_FOUND);
        }
        ChiTietSanPham chiTietSanPham = chiTietSanPhamRepository.findById(idSanPhamChiTiet)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
        if (soLuong == null || soLuong <= 0) {
            throw new AppException(ErrorCode.INVALID_QUANTITY);
        }
        int soLuongHienTai = chiTietSanPham.getSoLuong();
        chiTietSanPham.setSoLuong(soLuongHienTai + soLuong);
        chiTietSanPhamRepository.save(chiTietSanPham);
        return "Cập nhật số lượng sản phẩm thành công";
    }

    @Override
    @Transactional
    public String giamSoLuongSanPhamChiTiet(Integer idSanPhamChiTiet, Integer soLuong) {
        if (idSanPhamChiTiet == null || idSanPhamChiTiet <= 0) {
            throw new AppException(ErrorCode.PRODUCT_NOT_FOUND);
        }
        ChiTietSanPham chiTietSanPham = chiTietSanPhamRepository.findById(idSanPhamChiTiet)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
        if (soLuong == null || soLuong <= 0) {
            throw new AppException(ErrorCode.INVALID_QUANTITY);
        }
        int soLuongHienTai = chiTietSanPham.getSoLuong();
        chiTietSanPham.setSoLuong(soLuongHienTai - soLuong);
        chiTietSanPhamRepository.save(chiTietSanPham);
        return "Cập nhật số lượng sản phẩm thành công";
    }

    @Transactional
    @Override
    public HoaDonDTO saveHoaDonOnlineChuaDangNhap(HoaDonOnlineRequest hoaDonOnlineRequest,String email) {
        HoaDon hoaDon = new HoaDon();
        hoaDon.setMaHoaDon(generateShortRandomMaHoaDonUUID());
        hoaDon.setNgayTao(LocalDateTime.now());
        hoaDon.setLoaiHoaDon(hoaDonOnlineRequest.getLoaiHoaDon());

        // Tạo chi tiết hóa đơn
        if (hoaDonOnlineRequest.getDanhSachSanPham() != null) {
            for (HoaDonOnlineRequest.SanPhamCapNhatVO sanPhamMoi : hoaDonOnlineRequest.getDanhSachSanPham()) {
                ChiTietSanPham spct = chiTietSanPhamRepository.findById(sanPhamMoi.getId())
                        .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
                HoaDonChiTiet chiTietMoi = new HoaDonChiTiet();
                chiTietMoi.setHoaDon(hoaDon);
                chiTietMoi.setSanPhamChiTiet(spct);
                chiTietMoi.setSoLuong(sanPhamMoi.getSoLuong());
                chiTietMoi.setGia(sanPhamMoi.getDonGia());
                // Tính thành tiền
                int thanhTien = sanPhamMoi.getDonGia() * sanPhamMoi.getSoLuong();
                chiTietMoi.setThanhTien(thanhTien);

                //Giảm số lượng trong kho
                giamSoLuongSanPhamChiTiet(spct.getId(), sanPhamMoi.getSoLuong());
                hoaDon.getHoaDonChiTietList().add(chiTietMoi);
            }
        }

        // Tính tổng tiền ban đầu
        int tongTienBanDau = hoaDon.getHoaDonChiTietList().stream()
                .mapToInt(HoaDonChiTiet::getThanhTien)
                .sum();
        hoaDon.setTongTienBanDau(tongTienBanDau);
        hoaDon.setTongTien(tongTienBanDau);

        // Map các trường còn lại
        hoaDonMapper.toHoaDonUpdate(hoaDon, hoaDonOnlineRequest);

        // Áp dụng phiếu giảm giá nếu có
        if (hoaDonOnlineRequest.getPhieuGiamGia() != null && !hoaDonOnlineRequest.getPhieuGiamGia().describeConstable().isEmpty()) {
            PhieuGiamGia pgg = phieuGiamGiaRepository.findById(Integer.valueOf(hoaDonOnlineRequest.getPhieuGiamGia()))
                    .orElseThrow(() -> new AppException(ErrorCode.PHIEU_GIAM_GIA_KHACH_HANG_NOT_FOUND));
            hoaDon.setPhieuGiamGia(pgg);

            if (pgg.getTrangThai() != 1) {
                throw new AppException(ErrorCode.PHIEU_GIAM_GIA_DA_HET_HAN);
            }
            if (pgg.getSoLuong() == null || pgg.getSoLuong().compareTo(BigDecimal.ZERO) <= 0) {
                throw new AppException(ErrorCode.PHIEU_GIAM_GIA_HET_SO_LUONG);
            }

            BigDecimal soTienDuocGiam = BigDecimal.ZERO;
            BigDecimal tongTienGocBD = BigDecimal.valueOf(tongTienBanDau);

            // Giảm theo phần trăm
            if (pgg.getPhamTramGiamGia() != null && pgg.getPhamTramGiamGia().compareTo(BigDecimal.ZERO) > 0) {
                soTienDuocGiam = tongTienGocBD.multiply(pgg.getPhamTramGiamGia()).divide(BigDecimal.valueOf(100));
                if (pgg.getGiamToiDa() != null && soTienDuocGiam.compareTo(pgg.getGiamToiDa()) > 0) {
                    soTienDuocGiam = pgg.getGiamToiDa();
                }
            } else if (pgg.getSoTienGiam() != null) {
                soTienDuocGiam = pgg.getSoTienGiam();
                // Nếu có giamToiDa, lấy min
                if (pgg.getGiamToiDa() != null && soTienDuocGiam.compareTo(pgg.getGiamToiDa()) > 0) {
                    soTienDuocGiam = pgg.getGiamToiDa();
                }
            }

            BigDecimal tongTienCuoiCung = tongTienGocBD.subtract(soTienDuocGiam);
            hoaDon.setTongTien(tongTienCuoiCung.intValue());
            // Giảm số lượng phiếu
            pgg.setSoLuong(pgg.getSoLuong().subtract(BigDecimal.ONE));
            phieuGiamGiaRepository.save(pgg);
        } else {
            hoaDon.setPhieuGiamGia(null);
        }

        // Phí vận chuyển
        Integer phiVanChuyen = (hoaDon.getPhiVanChuyen() != null) ? hoaDon.getPhiVanChuyen() : 0;
        hoaDon.setTongHoaDon(hoaDon.getTongTien() + phiVanChuyen);

        // Trạng thái hóa đơn mặc định: Chờ xác nhận (vì chưa thanh toán)
        hoaDon.setTrangThai(TrangThai.CHO_XAC_NHAN);

        // Save hóa đơn
        HoaDon hoaDonDaLuu = hoaDonRepository.save(hoaDon);

        // Gửi mail (nếu cần - nên enable lại nếu đã config mail)
        // sendMailHoaDonToKhachHang(hoaDonDaLuu.getId(), hoaDonOnlineRequest.getEmail());
        if (hoaDonDaLuu.getTrangThai() == TrangThai.CHO_XAC_NHAN) {
            emailThongBaoHoaDonService.guiThongBaoCapNhatTrangThaiVoiEmail(
                    hoaDonDaLuu.getId(),
                    hoaDonDaLuu.getTrangThai(),
                    email
            );
        }
        // Lịch sử hóa đơn
        String nguoiThucHienCapNhat = "Hệ thống";
        String noiDungLichSu;
        switch (hoaDonDaLuu.getTrangThai()) {
            case CHO_XAC_NHAN:
                noiDungLichSu = "Đơn hàng đã được tạo thành công và đang chờ xác nhận.";
                break;
            case HOAN_THANH:
                noiDungLichSu = "Hóa đơn đã được thanh toán và hoàn thành.";
                break;
            case DA_XAC_NHAN:
                noiDungLichSu = "Đơn hàng đã được xác nhận và đang chờ giao.";
                break;
            case HUY:
                noiDungLichSu = "Hóa đơn đã bị hủy.";
                break;
            default:
                noiDungLichSu = "Hóa đơn được cập nhật trạng thái thành: " + hoaDonDaLuu.getTrangThai().name();
                break;
        }

        lichSuHoaDonService.ghiNhanLichSuHoaDon(
                hoaDonDaLuu,
                noiDungLichSu,
                nguoiThucHienCapNhat,
                hoaDonOnlineRequest.getGhiChu(),
                hoaDonDaLuu.getTrangThai()
        );

        return HoaDonUpdateMapper.INSTANCE.toResponseDTO(hoaDonDaLuu);
    }

    @Transactional
    @Override
    public HoaDonDTO saveHoaDonOnline(HoaDonOnlineRequest hoaDonOnlineRequest) {
        // 1. Lấy thông tin khách hàng từ idKhachHang
        if (hoaDonOnlineRequest.getIdKhachHang() == null) {
            throw new AppException(ErrorCode.CUSTOMER_NOT_FOUND);
        }
        KhachHang khachHang = khachHangRepository.findById(hoaDonOnlineRequest.getIdKhachHang())
                .orElseThrow(() -> new AppException(ErrorCode.CUSTOMER_NOT_FOUND));

        HoaDon hoaDon = new HoaDon();
        hoaDon.setMaHoaDon(generateShortRandomMaHoaDonUUID());
        hoaDon.setNgayTao(LocalDateTime.now());
        hoaDon.setLoaiHoaDon(hoaDonOnlineRequest.getLoaiHoaDon());
        hoaDon.setKhachHang(khachHang); // <-- Lưu idKhachHang ở đây
        if (hoaDonOnlineRequest.getIdNhanVien() != null) {
            NhanVien nv = nhanVienRepository.findById(hoaDonOnlineRequest.getIdNhanVien()).orElse(null);
            hoaDon.setNhanVien(nv);
        }

        // 2. Tạo chi tiết hóa đơn
        if (hoaDonOnlineRequest.getDanhSachSanPham() != null) {
            for (HoaDonOnlineRequest.SanPhamCapNhatVO sanPhamMoi : hoaDonOnlineRequest.getDanhSachSanPham()) {
                ChiTietSanPham spct = chiTietSanPhamRepository.findById(sanPhamMoi.getId())
                        .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
                HoaDonChiTiet chiTietMoi = new HoaDonChiTiet();
                chiTietMoi.setHoaDon(hoaDon);
                chiTietMoi.setSanPhamChiTiet(spct);
                chiTietMoi.setSoLuong(sanPhamMoi.getSoLuong());
                chiTietMoi.setGia(sanPhamMoi.getDonGia());
                // Tính thành tiền
                int thanhTien = sanPhamMoi.getDonGia() * sanPhamMoi.getSoLuong();
                chiTietMoi.setThanhTien(thanhTien);
                //trừ số lượng trong kho
                giamSoLuongSanPhamChiTiet(spct.getId(), sanPhamMoi.getSoLuong());
                hoaDon.getHoaDonChiTietList().add(chiTietMoi);
            }
        }

        // Tính tổng tiền ban đầu
        int tongTienBanDau = hoaDon.getHoaDonChiTietList().stream()
                .mapToInt(HoaDonChiTiet::getThanhTien)
                .sum();
        hoaDon.setTongTienBanDau(tongTienBanDau);
        hoaDon.setTongTien(tongTienBanDau);

        // Map các trường còn lại
        hoaDonMapper.toHoaDonUpdate(hoaDon, hoaDonOnlineRequest);

        // Áp dụng phiếu giảm giá nếu có
        if (hoaDonOnlineRequest.getPhieuGiamGia() != null && !hoaDonOnlineRequest.getPhieuGiamGia().describeConstable().isEmpty()) {
            PhieuGiamGia pgg = phieuGiamGiaRepository.findById(Integer.valueOf(hoaDonOnlineRequest.getPhieuGiamGia()))
                    .orElseThrow(() -> new AppException(ErrorCode.PHIEU_GIAM_GIA_KHACH_HANG_NOT_FOUND));
            hoaDon.setPhieuGiamGia(pgg);

            if (pgg.getTrangThai() != 1) {
                throw new AppException(ErrorCode.PHIEU_GIAM_GIA_DA_HET_HAN);
            }
            if (pgg.getSoLuong() == null || pgg.getSoLuong().compareTo(BigDecimal.ZERO) <= 0) {
                throw new AppException(ErrorCode.PHIEU_GIAM_GIA_HET_SO_LUONG);
            }

            BigDecimal soTienDuocGiam = BigDecimal.ZERO;
            BigDecimal tongTienGocBD = BigDecimal.valueOf(tongTienBanDau);

            // Giảm theo phần trăm
            if (pgg.getPhamTramGiamGia() != null && pgg.getPhamTramGiamGia().compareTo(BigDecimal.ZERO) > 0) {
                soTienDuocGiam = tongTienGocBD.multiply(pgg.getPhamTramGiamGia()).divide(BigDecimal.valueOf(100));
                if (pgg.getGiamToiDa() != null && soTienDuocGiam.compareTo(pgg.getGiamToiDa()) > 0) {
                    soTienDuocGiam = pgg.getGiamToiDa();
                }
            } else if (pgg.getSoTienGiam() != null) {
                soTienDuocGiam = pgg.getSoTienGiam();
                // Nếu có giamToiDa, lấy min
                if (pgg.getGiamToiDa() != null && soTienDuocGiam.compareTo(pgg.getGiamToiDa()) > 0) {
                    soTienDuocGiam = pgg.getGiamToiDa();
                }
            }

            BigDecimal tongTienCuoiCung = tongTienGocBD.subtract(soTienDuocGiam);
            hoaDon.setTongTien(tongTienCuoiCung.intValue());
            // Giảm số lượng phiếu
            pgg.setSoLuong(pgg.getSoLuong().subtract(BigDecimal.ONE));
            phieuGiamGiaRepository.save(pgg);
        } else {
            hoaDon.setPhieuGiamGia(null);
        }

        // Phí vận chuyển
        Integer phiVanChuyen = (hoaDon.getPhiVanChuyen() != null) ? hoaDon.getPhiVanChuyen() : 0;
        hoaDon.setTongHoaDon(hoaDon.getTongTien() + phiVanChuyen);

        // Trạng thái hóa đơn mặc định: Chờ xác nhận (vì chưa thanh toán)
        hoaDon.setTrangThai(TrangThai.CHO_XAC_NHAN);

        // Save hóa đơn
        HoaDon hoaDonDaLuu = hoaDonRepository.save(hoaDon);
        if (hoaDonDaLuu.getTrangThai() == TrangThai.CHO_XAC_NHAN) {
            emailThongBaoHoaDonService.guiThongBaoCapNhatTrangThai(
                    hoaDonDaLuu.getId(),
                    hoaDonDaLuu.getTrangThai()
            );
        }
        // Gửi mail (nếu cần - nên enable lại nếu đã config mail)
        // sendMailHoaDonToKhachHang(hoaDonDaLuu.getId(), hoaDonOnlineRequest.getEmail());

        // Lịch sử hóa đơn
        String nguoiThucHienCapNhat = "Hệ thống"; // Hoặc lấy từ security context
        String noiDungLichSu;
        switch (hoaDonDaLuu.getTrangThai()) {
            case CHO_XAC_NHAN:
                noiDungLichSu = "Đơn hàng đã được tạo thành công và đang chờ xác nhận.";
                break;
            case HOAN_THANH:
                noiDungLichSu = "Hóa đơn đã được thanh toán và hoàn thành.";
                break;
            case DA_XAC_NHAN:
                noiDungLichSu = "Đơn hàng đã được xác nhận và đang chờ giao.";
                break;
            case HUY:
                noiDungLichSu = "Hóa đơn đã bị hủy.";
                break;
            default:
                noiDungLichSu = "Hóa đơn được cập nhật trạng thái thành: " + hoaDonDaLuu.getTrangThai().name();
                break;
        }

        lichSuHoaDonService.ghiNhanLichSuHoaDon(
                hoaDonDaLuu,
                noiDungLichSu,
                nguoiThucHienCapNhat,
                hoaDonOnlineRequest.getGhiChu(),
                hoaDonDaLuu.getTrangThai()
        );
// === BẮT ĐẦU GỬI WEBSOCKET ===
        System.out.println("\n[DEBUG] --- BẮT ĐẦU GỬI WEBSOCKET ---");
        Map<String, Object> notificationPayload = new HashMap<>();
        notificationPayload.put("type", "NEW_ORDER");
        notificationPayload.put("idHoaDon", hoaDonDaLuu.getId());
        notificationPayload.put("maHoaDon", hoaDonDaLuu.getMaHoaDon());
        notificationPayload.put("tenKhachHang", hoaDonDaLuu.getKhachHang().getTenKhachHang());
        notificationPayload.put("tongHoaDon", hoaDonDaLuu.getTongHoaDon());
        notificationPayload.put("thoiGian", LocalDateTime.now().toString());

        System.out.println("[DEBUG] Payload: " + notificationPayload.toString());

        String adminTopic = "/topic/admin/order-updates";
        System.out.println("[DEBUG] Topic: " + adminTopic);

        try {
            System.out.println("[DEBUG] Đang gọi messagingTemplate.convertAndSend...");
            messagingTemplate.convertAndSend(adminTopic, notificationPayload);
            System.out.println("[DEBUG] ĐÃ GỬI WEBSOCKET THÀNH CÔNG.");
        } catch (Exception e) {
            System.out.println("[DEBUG] LỖI KHI GỬI WEBSOCKET: " + e.getMessage());
            // In ra stack trace để xem chi tiết lỗi
            e.printStackTrace();
        }
        System.out.println("[DEBUG] --- KẾT THÚC GỬI WEBSOCKET ---\n");
        // === KẾT THÚC PHẦN THÊM MỚI ===
        return HoaDonUpdateMapper.INSTANCE.toResponseDTO(hoaDonDaLuu);
    }

    @Override
    public void sendMailHoaDonToKhachHang(Integer idHoaDon, String email) {
        HoaDon hoaDon = hoaDonRepository.findById(idHoaDon).orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        try {
            sendInvoiceEmail(hoaDon, email);
        }
        catch (Exception e) {
            throw new AppException(ErrorCode.ERROR_SEND_MAIL);
        }
    }

    @Override
    @Transactional
    public HoaDonDTO updateHoaDon(HoaDonRequestUpdateVO request) {
        // 1. Tìm hóa đơn trong DB hoặc ném lỗi nếu không tìm thấy
        HoaDon hoaDon = hoaDonRepository.findById(request.getIdHoaDon())
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        // 2. [LOGIC MỚI] Xóa và tạo lại danh sách chi tiết hóa đơn từ request
        if (request.getDanhSachSanPham() != null) {
            // Xóa toàn bộ chi tiết hóa đơn cũ để đảm bảo không bị trùng lặp hay sai giá
            hoaDon.getHoaDonChiTietList().clear();
            // Lặp qua danh sách sản phẩm từ request để tạo lại chi tiết hóa đơn
            for (HoaDonRequestUpdateVO.SanPhamCapNhatVO sanPhamMoi : request.getDanhSachSanPham()) {
                ChiTietSanPham spct = chiTietSanPhamRepository.findById(sanPhamMoi.getId())
                        .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
                HoaDonChiTiet chiTietMoi = new HoaDonChiTiet();
                chiTietMoi.setHoaDon(hoaDon);
                chiTietMoi.setSanPhamChiTiet(spct);
                chiTietMoi.setSoLuong(sanPhamMoi.getSoLuong());
                // Quan trọng: Set giá từ request, KHÔNG tính toán lại!
                chiTietMoi.setGia(sanPhamMoi.getDonGia().intValue());
                // Tính thành tiền dựa trên giá từ request
                BigDecimal thanhTien = BigDecimal.valueOf(sanPhamMoi.getDonGia())
                        .multiply(BigDecimal.valueOf(sanPhamMoi.getSoLuong()));
                int tienInt = thanhTien.intValue();
                chiTietMoi.setThanhTien(tienInt);
                // Thêm chi tiết mới vào hóa đơn
                hoaDon.getHoaDonChiTietList().add(chiTietMoi);
            }
            int tongTienBanDau = hoaDon.getHoaDonChiTietList().stream()
                    .mapToInt(HoaDonChiTiet::getThanhTien)
                    .sum();
            hoaDon.setTongTienBanDau(tongTienBanDau);
            hoaDon.setTongTien(tongTienBanDau);
        }
        // 3. Cập nhật các thông tin chung của hóa đơn từ request
        HoaDonUpdateMapper.INSTANCE.updateHoaDon(hoaDon, request);
        // Cập nhật Nhân viên
        if (request.getNhanVien() != null && !request.getNhanVien().isEmpty()) {
            NhanVien nhanVien = nhanVienRepository.findById(Integer.parseInt(request.getNhanVien()))
                    .orElseThrow(() -> new AppException(ErrorCode.EMPLOYEE_NOT_FOUND));
            hoaDon.setNhanVien(nhanVien);
        }

        // Cập nhật Khách hàng (xử lý an toàn cho khách lẻ)
        if (request.getKhachHang() != null && !request.getKhachHang().trim().isEmpty()) {
            try {
                Integer idKhachHang = Integer.parseInt(request.getKhachHang());
                KhachHang khachHang = khachHangRepository.findById(idKhachHang).orElse(null);
                hoaDon.setKhachHang(khachHang);
            } catch (NumberFormatException e) {
                hoaDon.setKhachHang(null); // Gán là khách lẻ nếu ID không hợp lệ
            }
        } else {
            // Mặc định cho một nhân viên nào đó nếu cần
            NhanVien nhanVien = nhanVienRepository.findById(8).orElseThrow(() -> new AppException(ErrorCode.EMPLOYEE_NOT_FOUND));
            hoaDon.setKhachHang(null); // Khách lẻ
        }

        // 4. Tính toán lại giá trị hóa đơn
        int tongTienBanDau = hoaDon.getHoaDonChiTietList().stream()
                .mapToInt(HoaDonChiTiet::getThanhTien)
                .sum();
        hoaDon.setTongTienBanDau(tongTienBanDau);
        hoaDon.setTongTien(tongTienBanDau); // Gán tạm, sẽ cập nhật lại sau khi có giảm giá

        // 5. Áp dụng phiếu giảm giá (sử dụng BigDecimal để chính xác)
        if (StringUtils.isNotEmpty(request.getPhieuGiamGia())) {
            PhieuGiamGia pgg = phieuGiamGiaRepository.findById(Integer.valueOf(request.getPhieuGiamGia())).orElse(null);
            hoaDon.setPhieuGiamGia(pgg);
            if (pgg != null) {
                if (pgg.getTrangThai() != 1){
                    throw new AppException(ErrorCode.PHIEU_GIAM_GIA_DA_HET_HAN);
                }
                BigDecimal tongTienGocBD = BigDecimal.valueOf(tongTienBanDau);
                BigDecimal soTienDuocGiam = BigDecimal.ZERO;

                if (pgg.getPhamTramGiamGia() != null && pgg.getPhamTramGiamGia().compareTo(BigDecimal.ZERO) > 0) {
                    // Giảm theo phần trăm
                    soTienDuocGiam = tongTienGocBD.multiply(pgg.getPhamTramGiamGia()).divide(BigDecimal.valueOf(100));
                    if (pgg.getGiamToiDa() != null && soTienDuocGiam.compareTo(pgg.getGiamToiDa()) > 0) {
                        soTienDuocGiam = pgg.getGiamToiDa();
                    }
                } else if (pgg.getSoTienGiam() != null) {
                    // Giảm theo số tiền cố định
                    soTienDuocGiam = pgg.getGiamToiDa();
                }

                BigDecimal tongTienCuoiCung = tongTienGocBD.subtract(soTienDuocGiam);
                hoaDon.setTongTien(tongTienCuoiCung.intValue());
            }
        } else {
            hoaDon.setPhieuGiamGia(null);
        }

        // 6. Tính tổng hóa đơn cuối cùng (bao gồm phí vận chuyển)
        // Giả sử mapper đã set `phiVanChuyen` vào `hoaDon`
        Integer phiVanChuyen = (hoaDon.getPhiVanChuyen() != null) ? hoaDon.getPhiVanChuyen() : 0;
        hoaDon.setTongHoaDon(hoaDon.getTongTien() + phiVanChuyen);

        // 7. Cập nhật trạng thái hóa đơn dựa trên thanh toán và loại đơn
        Integer tongTienDaTraRaw = chiTietThanhToanRepository.sumSoTienThanhToanByIdHoaDon(hoaDon.getId());
        int tongTienDaTra = (tongTienDaTraRaw != null) ? tongTienDaTraRaw : 0;

        boolean laDonGiaoHang = StringUtils.isNotEmpty(request.getDiaChi());

        if (!laDonGiaoHang) { // Đơn tại quầy
            if (tongTienDaTra >= hoaDon.getTongTien()) {
                hoaDon.setTrangThai(TrangThai.HOAN_THANH);
            } else {
                // Với đơn tại quầy, nếu bấm lưu/thanh toán thì phải trả đủ tiền
                // Bạn có thể giữ hoặc bỏ Exception này tùy nghiệp vụ
                throw new AppException(ErrorCode.NOT_YET_PAID);
            }
        } else { // Đơn giao hàng
            // Với đơn giao hàng, có thể chưa thanh toán hết (COD)
            if (tongTienDaTra >= hoaDon.getTongTien()) {
                hoaDon.setTrangThai(TrangThai.HOAN_THANH);
            } else {

                hoaDon.setTrangThai(TrangThai.DA_XAC_NHAN); // hoặc trạng thái phù hợp khác
            }
            hoaDon.setNgayGiaoDuKien(LocalDate.now().plusDays(3).atStartOfDay());
        }

        // 8. Lưu hóa đơn vào DB
        HoaDon hoaDonDaLuu = hoaDonRepository.save(hoaDon);
        if (laDonGiaoHang && hoaDonDaLuu.getTrangThai() == TrangThai.DA_XAC_NHAN) {
            emailThongBaoHoaDonService.guiThongBaoCapNhatTrangThai(
                    hoaDonDaLuu.getId(),
                    hoaDonDaLuu.getTrangThai()
            );
        }
        // 9. Ghi nhận lịch sử hoạt động
        String nguoiThucHienCapNhat = hoaDonDaLuu.getNhanVien().getHoVaTen();
        String noiDungLichSu;
        switch (hoaDonDaLuu.getTrangThai()) {
            case HOAN_THANH:
                noiDungLichSu = "Hóa đơn đã được thanh toán và hoàn thành.";
                break;
            case DA_XAC_NHAN:
                noiDungLichSu = "Đơn hàng đã được xác nhận và đang chờ giao.";
                break;
            case HUY:
                noiDungLichSu = "Hóa đơn đã bị hủy.";
                break;
            default:
                noiDungLichSu = "Hóa đơn được cập nhật trạng thái thành: " + hoaDonDaLuu.getTrangThai().name();
                break;
        }
        lichSuHoaDonService.ghiNhanLichSuHoaDon(
                hoaDonDaLuu,
                noiDungLichSu,
                nguoiThucHienCapNhat,
                request.getGhiChu(),
                hoaDonDaLuu.getTrangThai()
        );

        // 10. Trả về DTO cho client
        return HoaDonUpdateMapper.INSTANCE.toResponseDTO(hoaDonDaLuu);
    }

    @Override
    public HoaDonDTO updateHoaDonDetail(HoaDonRequestUpdateVO request) {
        // 1. Tìm hóa đơn trong DB hoặc ném lỗi nếu không tìm thấy
        HoaDon hoaDon = hoaDonRepository.findById(request.getIdHoaDon())
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        // 2. [LOGIC MỚI] Xóa và tạo lại danh sách chi tiết hóa đơn từ request
        if (request.getDanhSachSanPham() != null) {
            // Xóa toàn bộ chi tiết hóa đơn cũ để đảm bảo không bị trùng lặp hay sai giá
            hoaDon.getHoaDonChiTietList().clear();

            // Lặp qua danh sách sản phẩm từ request để tạo lại chi tiết hóa đơn
            for (HoaDonRequestUpdateVO.SanPhamCapNhatVO sanPhamMoi : request.getDanhSachSanPham()) {
                ChiTietSanPham spct = chiTietSanPhamRepository.findById(sanPhamMoi.getId())
                        .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

                HoaDonChiTiet chiTietMoi = new HoaDonChiTiet();
                chiTietMoi.setHoaDon(hoaDon);
                chiTietMoi.setSanPhamChiTiet(spct);
                chiTietMoi.setSoLuong(sanPhamMoi.getSoLuong());

                // Quan trọng: Set giá từ request, KHÔNG tính toán lại!
                chiTietMoi.setGia(sanPhamMoi.getDonGia().intValue());

                // Tính thành tiền dựa trên giá từ request
                BigDecimal thanhTien = BigDecimal.valueOf(sanPhamMoi.getDonGia())
                        .multiply(BigDecimal.valueOf(sanPhamMoi.getSoLuong()));
                int tienInt = thanhTien.intValue();
                chiTietMoi.setThanhTien(tienInt);

                // Thêm chi tiết mới vào hóa đơn
                hoaDon.getHoaDonChiTietList().add(chiTietMoi);
            }
            int tongTienBanDau = hoaDon.getHoaDonChiTietList().stream()
                    .mapToInt(HoaDonChiTiet::getThanhTien)
                    .sum();
            hoaDon.setTongTienBanDau(tongTienBanDau);
            hoaDon.setTongTien(tongTienBanDau);
        }

        // 3. Cập nhật các thông tin chung của hóa đơn từ request
        HoaDonUpdateMapper.INSTANCE.updateHoaDon(hoaDon, request);

        // Cập nhật Nhân viên
        if (request.getNhanVien() != null && !request.getNhanVien().isEmpty()) {
            NhanVien nhanVien = nhanVienRepository.findById(Integer.parseInt(request.getNhanVien()))
                    .orElseThrow(() -> new AppException(ErrorCode.EMPLOYEE_NOT_FOUND));
            hoaDon.setNhanVien(nhanVien);
        }
        // Cập nhật Khách hàng (xử lý an toàn cho khách lẻ)
        if (request.getKhachHang() != null && !request.getKhachHang().trim().isEmpty()) {
            try {
                Integer idKhachHang = Integer.parseInt(request.getKhachHang());
                KhachHang khachHang = khachHangRepository.findById(idKhachHang).orElse(null);
                hoaDon.setKhachHang(khachHang);
            } catch (NumberFormatException e) {
                hoaDon.setKhachHang(null); // Gán là khách lẻ nếu ID không hợp lệ
            }
        } else {
            hoaDon.setKhachHang(null); // Khách lẻ
        }
        // 4. Tính toán lại giá trị hóa đơn
        int tongTienBanDau = hoaDon.getHoaDonChiTietList().stream()
                .mapToInt(HoaDonChiTiet::getThanhTien)
                .sum();
        hoaDon.setTongTienBanDau(tongTienBanDau);
        hoaDon.setTongTien(tongTienBanDau); // Gán tạm, sẽ cập nhật lại sau khi có giảm giá
        // 5. Áp dụng phiếu giảm giá (sử dụng BigDecimal để chính xác)
        if (StringUtils.isNotEmpty(request.getPhieuGiamGia())) {
            PhieuGiamGia pgg = phieuGiamGiaRepository.findById(Integer.valueOf(request.getPhieuGiamGia())).orElse(null);
            hoaDon.setPhieuGiamGia(pgg);
            if (pgg != null) {
                if (pgg.getTrangThai() != 1){
                    throw new AppException(ErrorCode.PHIEU_GIAM_GIA_DA_HET_HAN);
                }
                BigDecimal tongTienGocBD = BigDecimal.valueOf(tongTienBanDau);
                BigDecimal soTienDuocGiam = BigDecimal.ZERO;
                if (pgg.getPhamTramGiamGia() != null && pgg.getPhamTramGiamGia().compareTo(BigDecimal.ZERO) > 0) {
                    // Giảm theo phần trăm
                    soTienDuocGiam = tongTienGocBD.multiply(pgg.getPhamTramGiamGia()).divide(BigDecimal.valueOf(100));
                    if (pgg.getGiamToiDa() != null && soTienDuocGiam.compareTo(pgg.getGiamToiDa()) > 0) {
                        soTienDuocGiam = pgg.getGiamToiDa();
                    }
                } else if (pgg.getSoTienGiam() != null) {
                    // Giảm theo số tiền cố định
                    soTienDuocGiam = pgg.getGiamToiDa();
                }
                BigDecimal tongTienCuoiCung = tongTienGocBD.subtract(soTienDuocGiam);
                hoaDon.setTongTien(tongTienCuoiCung.intValue());
            }
        } else {
            hoaDon.setPhieuGiamGia(null);
        }

        // 6. Tính tổng hóa đơn cuối cùng (bao gồm phí vận chuyển)
        // Giả sử mapper đã set `phiVanChuyen` vào `hoaDon`
        Integer phiVanChuyen = (hoaDon.getPhiVanChuyen() != null) ? hoaDon.getPhiVanChuyen() : 0;
        hoaDon.setTongHoaDon(hoaDon.getTongTien() + phiVanChuyen);
        // 7. Cập nhật trạng thái hóa đơn dựa trên thanh toán và loại đơn
        Integer tongTienDaTraRaw = chiTietThanhToanRepository.sumSoTienThanhToanByIdHoaDon(hoaDon.getId());
        int tongTienDaTra = (tongTienDaTraRaw != null) ? tongTienDaTraRaw : 0;

        // 8. Lưu hóa đơn vào DB
        HoaDon hoaDonDaLuu = hoaDonRepository.save(hoaDon);
        return HoaDonUpdateMapper.INSTANCE.toResponseDTO(hoaDonDaLuu);
    }

    // Phương thức helper để chuyển đổi và thêm chi tiết hóa đơn
    private HoaDonDTO convertToHoaDonResponseWithDetails(HoaDon hoaDon) {
        HoaDonDTO response = hoaDonMapper.toHoaDonResponse(hoaDon);
        response.setDanhSachChiTiet(
                hoaDonChiTietRepository.findAllByHoaDon_Id(hoaDon.getId()).stream()
                        .map(hoaDonChiTiet -> {
                            HoaDonChiTietDTO chiTietResponse = new HoaDonChiTietDTO();
                            chiTietResponse.setId(hoaDonChiTiet.getId());
                            if (hoaDonChiTiet.getSanPhamChiTiet() != null) {
                                chiTietResponse.setMaSanPhamChiTiet(hoaDonChiTiet.getSanPhamChiTiet().getMaSanPhamChiTiet());
                            }
                            chiTietResponse.setSoLuong(hoaDonChiTiet.getSoLuong());
                            chiTietResponse.setGia(hoaDonChiTiet.getGia());
                            chiTietResponse.setThanhTien(hoaDonChiTiet.getThanhTien());
                            chiTietResponse.setGhiChu(hoaDonChiTiet.getGhiChu());
                            chiTietResponse.setTrangThai(hoaDonChiTiet.getTrangThai());
                            return chiTietResponse;
                        }).collect(Collectors.toList())
        );
        return response;
    }


    public void sendInvoiceEmail(HoaDon hoaDon, String email) throws MessagingException {
        String subject = "Hóa đơn thanh toán từ cửa hàng ...";
        String to = email;
        // Tính tổng tiền:
        Integer tongTien = hoaDon.getTongHoaDon();
        String giamGia = "0₫";
        if (hoaDon.getPhieuGiamGia() != null) {
            if (hoaDon.getPhieuGiamGia().getSoTienGiam() != null) {
                giamGia = String.format("%,.0f₫", hoaDon.getPhieuGiamGia().getSoTienGiam().doubleValue());
            } else if (hoaDon.getPhieuGiamGia().getPhamTramGiamGia() != null) {
                giamGia = hoaDon.getPhieuGiamGia().getPhamTramGiamGia() + "%";
            }
        }
        // Tạo bảng sản phẩm HTML
        StringBuilder tableRows = new StringBuilder();
        int index = 1;
        for (HoaDonChiTiet ctsp : hoaDon.getHoaDonChiTietList()) {
            Integer thanhTien = ctsp.getThanhTien();
            tableRows.append(String.format("""
            <tr>
              <td>%d</td>
              <td>%s</td>
              <td>%d</td>
              <td>%,.0f₫</td>
              <td>%,.0f₫</td>
            </tr>
        """, index++, ctsp.getHoaDon().getMaHoaDon(), ctsp.getSoLuong(),
                    (double) ctsp.getGia(), thanhTien.doubleValue()));
        }

        // HTML content
        String html = String.format("""
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background-color: #f7f9fc;
      color: #333;
      line-height: 1.6;
    }
    .invoice-container {
      max-width: 800px;
      margin: auto;
      background: #fff;
      padding: 20px 30px;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    h2 {
      text-align: center;
      color: #2a9d8f;
      margin-bottom: 20px;
    }
    table {
      width: 100%%;
      border-collapse: collapse;
      margin-top: 15px;
    }
    th {
      background-color: #2a9d8f;
      color: white;
      padding: 10px;
      text-align: center;
    }
    td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: center;
    }
    tr:nth-child(even) {
      background-color: #f4f6f8;
    }
    tr:hover {
      background-color: #eef2f5;
    }
    .total-row td {
      font-weight: bold;
      background-color: #f1faee;
    }
    .footer {
      margin-top: 20px;
      text-align: center;
      font-size: 14px;
      color: #666;
    }
    .customer-info p {
      margin: 5px 0;
    }
    .order-message {
      margin-bottom: 20px;
      padding: 15px;
      background-color: #f1f5f9;
      border-left: 5px solid #2a9d8f;
    }
    .order-message a {
      color: #1d4ed8;
      text-decoration: none;
    }
    .order-message a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="invoice-container">

    <!-- Phần lời chào -->
    <div class="order-message">
      <p><strong>Chào %s,</strong></p>
      <p>Đơn hàng của bạn đã được nhận và sẽ được xử lý ngay khi bạn xác nhận thanh toán.<br>
         Để xem chi tiết đơn hàng của mình tại <strong>Cửa hàng ABC</strong>, bạn có thể 
         <a href="https://example.com" target="_blank">nhấn vào đây</a>.
      </p>
    </div>

    <!-- Hóa đơn -->
    <h2>Hóa đơn thanh toán</h2>
    <div class="customer-info">
      <p><strong>Khách hàng:</strong> %s</p>
      <p><strong>SĐT:</strong> %s</p>
      <p><strong>Địa chỉ:</strong> %s</p>
      <p><strong>Loại hóa đơn:</strong> %s</p>
    </div>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Mã Hóa Đơn</th>
          <th>Số lượng</th>
          <th>Đơn giá</th>
          <th>Thành tiền</th>
        </tr>
      </thead>
      <tbody>
        %s
      </tbody>
      <tfoot>
        <tr class="total-row">
          <td colspan="4" style="text-align:right;">Phí vận chuyển:</td>
          <td>%d ₫</td>
        </tr>
        <tr class="total-row">
          <td colspan="4" style="text-align:right;">Giảm giá:</td>
          <td>%s</td>
        </tr>
        <tr class="total-row">
          <td colspan="4" style="text-align:right;">Tổng thanh toán:</td>
          <td>%,.0f₫</td>
        </tr>
      </tfoot>
    </table>

    <p><strong>Ghi chú:</strong> %s</p>
    <div class="footer">
      <p>Cảm ơn bạn đã mua hàng tại cửa hàng chúng tôi!</p>
    </div>
  </div>
</body>
</html>
""",
                hoaDon.getTenKhachHang(), // Lời chào
                hoaDon.getTenKhachHang(),
                hoaDon.getSdt(),
                hoaDon.getDiaChi(),
                hoaDon.getLoaiHoaDon(),
                tableRows.toString(),
                hoaDon.getPhiVanChuyen(),
                giamGia,
                tongTien.doubleValue(),
                hoaDon.getGhiChu()
        );
        // Gửi mail
        emailService.sendEmail(to, subject, html);
    }
}