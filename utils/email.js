const nodemailer = require('nodemailer');

// Cấu hình transporter gửi email bằng Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Hàm gửi email xác nhận đặt vé thành công chuẩn mẫu Azuki Team
 * @param {Object} donHang Thông tin đơn hàng (Ma_Don_Hang, STT, Ho_Ten, Email, So_Dien_Thoai, So_Luong, Thoi_Gian_Dat)
 */
async function guiEmailXacNhan(donHang) {
  // Định dạng Số thứ tự vé dạng 3 chữ số (ví dụ: 001, 027)
  const sttVe = String(donHang.STT || donHang.Ma_Don_Hang || '01').padStart(3, '0');
  
  // Lấy thời gian đặt vé
  const thoiGianDat = donHang.Thoi_Gian_Dat || new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

  // Tạo URL mã QR động từ STT vé
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(sttVe)}`;

  const mailOptions = {
    from: `"Azuki Team" <${process.env.EMAIL_USER}>`,
    to: donHang.Email,
    subject: `XÁC NHẬN MUA VÉ AZUKI MINI OFFLINE THÀNH CÔNG 🎊`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #000000; line-height: 1.6; max-width: 650px; margin: 0 auto; padding: 15px;">
        
        <p style="font-size: 15px; margin-bottom: 15px;">Bạn thân mến,</p>
        
        <p style="font-size: 15px; font-weight: bold; margin-bottom: 15px;">
          BTC Azuki Team xin thông báo yêu cầu đặt vé của bạn đã được xác nhận thành công.
        </p>

        <ul style="padding-left: 20px; font-size: 15px; margin-bottom: 20px; list-style-type: disc;">
          <li style="margin-bottom: 6px;"><b>Loại vé:</b> Online</li>
          <li style="margin-bottom: 6px;"><b>Số lượng vé:</b> ${donHang.So_Luong || 1}</li>
          <li style="margin-bottom: 6px;"><b>Số thứ tự vé:</b> ${sttVe}</li>
          <li style="margin-bottom: 6px;"><b>Tên người mua:</b> ${donHang.Ho_Ten}</li>
          <li style="margin-bottom: 6px;"><b>Số điện thoại:</b> ${donHang.So_Dien_Thoai}</li>
          <li style="margin-bottom: 6px;"><b>Thời gian đặt vé:</b> ${thoiGianDat}</li>
        </ul>

        <!-- KHU VỰC HIỂN THỊ MÃ QR -->
        <div style="text-align: center; margin: 25px 0;">
          <p style="font-size: 15px; font-weight: bold; margin-bottom: 10px;">MÃ QR CHECK-IN CỦA BẠN</p>
          <img src="${qrCodeUrl}" alt="Mã QR Vé ${sttVe}" style="width: 180px; height: 180px; border: 1px solid #dddddd; padding: 8px; background: #ffffff; display: inline-block;" />
          <p style="font-size: 13px; color: #555555; margin-top: 6px;">Vui lòng đưa mã này cho BTC tại quầy check-in</p>
        </div>

        <div style="border-top: 1px solid #000000; width: 100%; margin: 20px 0;"></div>

        <div style="font-size: 14px; margin-bottom: 20px;">
          <p style="font-weight: bold; margin-bottom: 6px;">!! Lưu ý:</p>
          <p style="margin: 0 0 4px 15px;">- Người mua chịu trách nhiệm bảo mật thông tin vé.</p>
          <p style="margin: 0 0 10px 15px;">- Khi đến offline, bạn hãy đưa mã QR để được nhận vé. </p>
          <p style="margin-top: 12px;">Mọi thắc mắc vui lòng liên hệ cho fanpage Azuki để được hỗ trợ giải đáp.</p>
        </div>

        <p style="font-size: 15px; margin-bottom: 15px;">
          Một lần nữa Azuki xin cảm ơn tình iu từ mọi người, và đừng quên cuộc hẹn của chúng ta vào ngày 27 tháng 09 này tại Goller Study Cafe nhé ฅ•ᴥ•ฅ
        </p>

        <div style="font-size: 14px; color: #111111;">
          <p style="margin-bottom: 6px;">
            <b>『 AZUKI TEAM – from GROUP <span style="color: #2b569a;">AN GIANG COSPLAY (Official)</span> 』 🧧🏮 AZUKI MINI-OFF TRUNG THU</b>
          </p>
          <p style="margin-bottom: 4px;">⏰ <b>Thời gian:</b> 12:00 – 17:00 | 27/09/2026</p>
          <p style="margin-bottom: 4px;">⛩️ <b>Địa điểm:</b> Goller Study Cafe, Quảng trường khu dân cư Golden City, Long Xuyên, An Giang</p>
        </div>

      </div>
    `
  };

  return await transporter.sendMail(mailOptions);
}

module.exports = { guiEmailXacNhan };
