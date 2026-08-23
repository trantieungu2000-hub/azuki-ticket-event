const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Tự động tạo thư mục data nếu chưa tồn tại
const dataDir = path.join(__dirname);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Khởi tạo CSDL SQLite
const dbPath = path.join(dataDir, 'tickets.db');
const db = new Database(dbPath);

// Tự động tạo bảng don_hang với đầy đủ các cột chuẩn
db.exec(`
  CREATE TABLE IF NOT EXISTS don_hang (
    Ma_Don_Hang TEXT PRIMARY KEY,
    Ho_Ten TEXT NOT NULL,
    Email TEXT NOT NULL,
    So_Dien_Thoai TEXT NOT NULL,
    So_Luong INTEGER NOT NULL,
    Tong_Tien INTEGER NOT NULL,
    Trang_Thai TEXT DEFAULT 'cho_thanh_toan',
    Ngay_Tao DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

module.exports = db;