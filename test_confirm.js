async function testXacNhan() {
  const maDon = 'AZK-38551'; // Thay bằng mã đơn có trong Database của bạn
  
  try {
    const response = await fetch(`http://localhost:3000/api/azuki/${maDon}/xac-nhan`, {
      method: 'POST'
    });

    const text = await response.text();

    try {
      const data = JSON.parse(text);
      console.log('KẾT QUẢ XÁC NHẬN:', data);
    } catch (err) {
      console.log('Server trả về nội dung không phải JSON:');
      console.log(text);
    }
  } catch (error) {
    console.error('Lỗi kết nối:', error.message);
  }
}

testXacNhan();