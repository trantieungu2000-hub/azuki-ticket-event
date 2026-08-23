const fs = require('fs');
const path = require('path');

const fileGoc = path.join(__dirname, 'data', 'tickets.db');
const thuMucBackup = path.join(__dirname, 'backups');

if (!fs.existsSync(fileGoc)) {
  console.error('❌ Không tìm thấy file Database tại data/tickets.db!');
  process.exit(1);
}

if (!fs.existsSync(thuMucBackup)) {
  fs.mkdirSync(thuMucBackup);
}

const tenFileBackup = `azuki_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.db`;
const duongDanDich = path.join(thuMucBackup, tenFileBackup);

fs.copyFileSync(fileGoc, duongDanDich);
console.log(`✔ Đã sao lưu Database thành công: backups/${tenFileBackup}`);