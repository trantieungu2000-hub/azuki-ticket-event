const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const db = require('./data/db');
const { guiEmailXacNhan } = require('./utils/email');

const app = express();
const PORT = process.env.PORT || 3000;
const GIOI_HAN_VE = 60; 
const GIA_VE = 50000;   

app.use(express.json());
app.use(cors());

// Hàm hỗ trợ lấy kết nối SQLite an toàn
const getDb = () => (db && db.prepare ? db : (db.db || db));

// Middleware bảo mật trang Admin & Check-in (Basic Auth chuẩn HTML cho trình duyệt di động)
const baoMatPhatVe = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Azuki Admin"');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(401).send('<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><h3>Cần đăng nhập để truy cập!</h3></body></html>');
  }

  const [user, pass] = Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');

  if (user === 'HuaTrachDepTrai' && pass === 'azuki123') {
    next();
  } else {
    res.setHeader('WWW-Authenticate', 'Basic realm="Azuki Admin"');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(401).send('<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><h3>Sai tài khoản hoặc mật khẩu!</h3></body></html>');
  }
};

// Hàm gửi file HTML chuẩn Header (Ép điện thoại mở web, không tự động tải file)
const guiFileHtml = (res, fileName) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.sendFile(path.join(__dirname, 'public', fileName));
};

// --- ROUTE TRANG WEB ---
app.get('/', (req, res) => guiFileHtml(res, 'index.html'));
app.get('/index.html', (req, res) => guiFileHtml(res, 'index.html'));
app.get('/admin.html', baoMatPhatVe, (req, res) => guiFileHtml(res, 'admin.html'));
app.get('/checkin.html', baoMatPhatVe, (req, res) => guiFileHtml(res, 'checkin.html'));

// Phục vụ file tĩnh trong thư mục public
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
    }
  }
}));

// --- CÁC API HỆ THỐNG ---

// 1. API Lấy danh sách toàn bộ đơn hàng
app.get('/api/azuki', (req, res) => {
  try {
    const list = getDb().prepare('SELECT * FROM don_hang ORDER BY Ngay_Tao DESC').all();
    res.json(list);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. API Lấy số lượng vé còn lại
app.get('/api/azuki/ve-con-lai', (req, res) => {
  try {
    const result = getDb().prepare("SELECT SUM(So_Luong) as tong FROM don_hang WHERE Trang_Thai != 'da_huy'").get();
    const tongVeDaDat = result?.tong || 0;
    res.json({ veConLai: Math.max(0, GIOI_HAN_VE - tongVeDaDat) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. API Tạo đơn hàng mới & Trả về mã VietQR
const xuLyDatVe = (req, res) => {
  try {
    const body = req.body;
    const Ho_Ten = body.Ho_Ten || body.hoTen;
    const Email = body.Email || body.email;
    const So_Dien_Thoai = body.So_Dien_Thoai || body.So_Thoai || body.sdt;
    const So_Luong = Number(body.So_Luong || body.soLuong || 1);

    if (!Ho_Ten || !Email || !So_Dien_Thoai || !So_Luong) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin!' });
    }

    const result = getDb().prepare("SELECT SUM(So_Luong) as tong FROM don_hang WHERE Trang_Thai != 'da_huy'").get();
    const tongVeDaDat = result?.tong || 0;
    const veConLai = GIOI_HAN_VE - tongVeDaDat;

    if (veConLai <= 0) {
      return res.status(400).json({ success: false, message: 'Rất tiếc! Sự kiện đã HẾT VÉ.' });
    }

    if (So_Luong > veConLai) {
      return res.status(400).json({ success: false, message: `Sự kiện chỉ còn lại ${veConLai} vé.` });
    }

    const Tong_Tien = So_Luong * GIA_VE;
    const Ma_Don_Hang = 'AZK' + Date.now().toString().slice(-6);

    const qrUrl = `https://img.vietqr.io/image/VCB-1050565461-compact.png?amount=${Tong_Tien}&addInfo=${Ma_Don_Hang}&accountName=HUA%20GIA%20HAN`;

    getDb().prepare(`
      INSERT INTO don_hang (Ma_Don_Hang, Ho_Ten, Email, So_Dien_Thoai, So_Luong, Tong_Tien, Trang_Thai)
      VALUES (?, ?, ?, ?, ?, ?, 'cho_thanh_toan')
    `).run(Ma_Don_Hang, Ho_Ten, Email, So_Dien_Thoai, So_Luong, Tong_Tien);

    const donHangMoi = {
      Ma_Don_Hang,
      Ho_Ten,
      Email,
      So_Dien_Thoai,
      So_Luong,
      Tong_Tien,
      Trang_Thai: 'cho_thanh_toan',
      qrUrl
    };

    res.status(201).json({ success: true, message: 'Tạo đơn thành công!', donHang: donHangMoi });
  } catch (error) {
    console.error('Lỗi Backend:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

app.post('/api/azuki/dat-ve', xuLyDatVe);
app.post('/api/azuki', xuLyDatVe);

// 4. API Admin duyệt thanh toán -> Đổi trạng thái & gửi Email vé
app.post('/api/azuki/:ma/xac-nhan', async (req, res) => {
  try {
    const maDonHang = req.params.ma;
    const donHang = getDb().prepare('SELECT * FROM don_hang WHERE Ma_Don_Hang = ?').get(maDonHang);

    if (!donHang) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng!' });
    }

    getDb().prepare("UPDATE don_hang SET Trang_Thai = 'da_thanh_toan' WHERE Ma_Don_Hang = ?").run(maDonHang);

    const donHangCapNhat = getDb().prepare('SELECT * FROM don_hang WHERE Ma_Don_Hang = ?').get(maDonHang);
    await guiEmailXacNhan(donHangCapNhat);

    res.json({ success: true, message: 'Đã xác nhận thanh toán và gửi email thành công!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. API Soát vé (Check-in tại cổng)
app.post('/api/azuki/:ma/check-in', (req, res) => {
  try {
    const maDonHang = req.params.ma;
    const donHang = getDb().prepare('SELECT * FROM don_hang WHERE Ma_Don_Hang = ?').get(maDonHang);

    if (!donHang) {
      return res.status(404).json({ success: false, message: 'Mã vé không tồn tại trên hệ thống!' });
    }

    if (donHang.Trang_Thai === 'cho_thanh_toan') {
      return res.status(400).json({ success: false, message: 'Vé chưa được thanh toán! Vui lòng liên hệ Admin.' });
    }

    if (donHang.Trang_Thai === 'da_checkin') {
      return res.status(400).json({ success: false, message: 'CẢNH BÁO: Vé này ĐÃ ĐƯỢC CHECK-IN trước đó!' });
    }

    getDb().prepare("UPDATE don_hang SET Trang_Thai = 'da_checkin' WHERE Ma_Don_Hang = ?").run(maDonHang);

    res.json({
      success: true,
      message: 'Check-in thành công! Cho phép vào cổng.',
      donHang: { ...donHang, Trang_Thai: 'da_checkin' }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 6. API Thống kê cho Admin
app.get('/api/azuki/thong-ke', (req, res) => {
  try {
    const tongSo = getDb().prepare('SELECT COUNT(*) as count FROM don_hang').get().count;
    const daThanhToan = getDb().prepare("SELECT COUNT(*) as count FROM don_hang WHERE Trang_Thai = 'da_thanh_toan'").get().count;
    const daCheckin = getDb().prepare("SELECT COUNT(*) as count FROM don_hang WHERE Trang_Thai = 'da_checkin'").get().count;
    const tongDoanhThu = getDb().prepare("SELECT SUM(Tong_Tien) as total FROM don_hang WHERE Trang_Thai != 'cho_thanh_toan'").get().total || 0;

    res.json({
      success: true,
      data: { tongSo, daThanhToan, daCheckin, tongDoanhThu }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 7. API Xuất danh sách vé ra file CSV UTF-8
app.get('/api/azuki/xuat-csv', (req, res) => {
  try {
    const rows = getDb().prepare('SELECT * FROM don_hang ORDER BY Ngay_Tao DESC').all();
    
    let csv = '\uFEFFMã Đơn,Họ Tên,Email,Số Điện Thoại,Số Lượng,Tổng Tiền,Trạng Thái,Ngày Tạo\n';
    
    rows.forEach(r => {
      csv += `"${r.Ma_Don_Hang}","${r.Ho_Ten}","${r.Email}","${r.So_Dien_Thoai}",${r.So_Luong},${r.Tong_Tien},"${r.Trang_Thai}","${r.Ngay_Tao}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=Danh_Sach_Ve_Azuki.csv');
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Auto-clean: Tự động hủy đơn quá hạn 15 phút
setInterval(() => {
  try {
    const ketQua = getDb().prepare(`
      UPDATE don_hang 
      SET Trang_Thai = 'da_huy' 
      WHERE Trang_Thai = 'cho_thanh_toan' 
        AND strftime('%s', 'now') - strftime('%s', Ngay_Tao) > 900
    `).run();

    if (ketQua.changes > 0) {
      console.log(`[Auto-Clean] Đã tự động hủy ${ketQua.changes} đơn hàng quá hạn thanh toán.`);
    }
  } catch (err) {
    console.error('[Auto-Clean Error]', err.message);
  }
}, 60000);

// Khởi chạy Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server đang chạy tại: http://localhost:${PORT}`);
});
module.exports = app;