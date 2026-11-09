// =====================================================
// shops.js : หน้ารายชื่อร้านอาหาร
// โหลดข้อมูล แล้วสร้างการ์ดร้านทุกร้าน
// =====================================================

const shopGrid = document.getElementById('shop-grid');

async function startShopsPage() {
  let data = null;
  try {
    data = await loadData();
  } catch (error) {
    showLoadError(shopGrid);
    return;
  }

  const reviews = getAllReviews(data); // ใช้คิดคะแนนเฉลี่ยในการ์ดแต่ละร้าน

  shopGrid.innerHTML = ''; // ล้างข้อความ "กำลังโหลด"
  for (let i = 0; i < data.shops.length; i++) {
    shopGrid.appendChild(createShopCard(data.shops[i], reviews));
  }
}

startShopsPage();
