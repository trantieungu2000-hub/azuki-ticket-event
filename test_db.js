const db = require('./data/db');

console.log('=== KIỂM TRA BÀI 2 ===');

try {
  db.taoDonHang({
    Ma_Don_Hang: 'AZUKI-TEST',
    Ho_Ten: 'Nguyen Van A',
    Email: 'test@gmail.com',
    So_Dien_Thoai: '0912345678',
    So_Luong: 2,
    Tong_Tien: 500000
  });
  console.log('1. Thêm đơn hàng thử nghiệm: THÀNH CÔNG');
} catch (error) {
  console.log('1. Lỗi thêm đơn hàng:', error.message);
}

const danhSach = db.layTatCaDonHang();
console.log('2. Dữ liệu trong Database:', danhSach);