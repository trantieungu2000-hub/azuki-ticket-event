// test_api.js
async function testTaoDon() {
  const response = await fetch('http://localhost:3000/api/azuki', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      Ho_Ten: 'Tran Van B',
      Email: 'tranvanb@gmail.com',
      So_Dien_Thoai: '0988777666',
      So_Luong: 3
    })
  });

  const data = await response.json();
  console.log('KẾT QUẢ TẠO ĐƠN:');
  console.log(JSON.stringify(data, null, 2));
}

testTaoDon();