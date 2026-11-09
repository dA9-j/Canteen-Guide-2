// =====================================================
// index.js : หน้าแรก
// ทำ 3 อย่าง: แสดงร้านแนะนำ, แสดงเมนูแนะนำ, ปุ่มสุ่มเมนู
// =====================================================

// หา element ในหน้าที่เราจะใส่ข้อมูลลงไป (id ตรงกับที่เขียนไว้ใน index.html)
const featuredShopsBox = document.getElementById('featured-shops');
const popularMenusBox = document.getElementById('popular-menus');
const randomButton = document.getElementById('random-btn');
const randomResultBox = document.getElementById('random-result');
const randomHintText = document.getElementById('random-hint');

// ประเภทที่ถือว่าเป็น "อาหารจานหลัก" (ตอนสุ่มจะไม่สุ่มเครื่องดื่มหรือของหวาน)
const MAIN_CATEGORIES = ['อาหารจานเดียว', 'ก๋วยเตี๋ยว', 'ขนมจีน'];

// เขียนข้อความบอกว่าจะสุ่มภายใต้เงื่อนไขอะไร
function updateRandomHint() {
  const budget = getBudget();
  if (budget === null) {
    randomHintText.textContent = 'ยังไม่ได้ตั้งงบวันนี้ จะสุ่มจากอาหารจานหลักทุกเมนู (ตั้งงบได้ที่หน้าตะกร้า)';
  } else {
    randomHintText.textContent = 'สุ่มจากอาหารจานหลักที่ราคาไม่เกินงบ ' + budget + ' บาท';
  }
}

// ฟังก์ชันหลักของหน้านี้ (ต้อง async เพราะมี await รอโหลดข้อมูล)
async function startIndexPage() {
  updateRandomHint();

  // ลองโหลดข้อมูล ถ้าพังให้แสดง error แล้วจบ
  let data = null;
  try {
    data = await loadData();
  } catch (error) {
    showLoadError(featuredShopsBox);
    popularMenusBox.innerHTML = '';
    randomButton.disabled = true; // ไม่มีข้อมูลให้สุ่ม จึงปิดปุ่ม
    return;
  }

  const reviews = getAllReviews(data);
  const bestIds = getBestSellerIds(data.menus);

  // --- ร้านแนะนำ: เรียงตามคะแนนเฉลี่ยจากมากไปน้อย เอา 3 ร้านแรก ---
  const rankedShops = [];
  for (let i = 0; i < data.shops.length; i++) {
    const shop = data.shops[i];
    const rating = getShopRating(reviews, shop.id);
    rankedShops.push({ shop: shop, average: rating.average });
  }
  rankedShops.sort(function (a, b) {
    return b.average - a.average; // ค่ามากอยู่ก่อน
  });

  featuredShopsBox.innerHTML = ''; // ล้างข้อความ "กำลังโหลด"
  for (let i = 0; i < rankedShops.length && i < 3; i++) {
    featuredShopsBox.appendChild(createShopCard(rankedShops[i].shop, reviews));
  }

  // --- เมนูแนะนำ: เมนูขายดีขึ้นก่อน แล้วตามด้วยเมนูอื่น เอา 4 อัน ---
  const pickedMenus = [];
  for (let i = 0; i < data.menus.length; i++) {
    if (bestIds.indexOf(data.menus[i].id) !== -1) {
      pickedMenus.push(data.menus[i]); // รอบแรก: เก็บเฉพาะเมนูขายดี
    }
  }
  for (let i = 0; i < data.menus.length; i++) {
    if (bestIds.indexOf(data.menus[i].id) === -1) {
      pickedMenus.push(data.menus[i]); // รอบสอง: เก็บเมนูที่เหลือ
    }
  }

  popularMenusBox.innerHTML = '';
  for (let i = 0; i < pickedMenus.length && i < 4; i++) {
    const menu = pickedMenus[i];
    const shop = findShopById(data.shops, menu.shopId);
    popularMenusBox.appendChild(createMenuCard(menu, shop, bestIds));
  }

  // --- ปุ่มสุ่มเมนู ---
  randomButton.addEventListener('click', function () {
    updateRandomHint();
    const budget = getBudget();

    // เลือกเฉพาะเมนูที่เข้าเงื่อนไข: เป็นอาหารจานหลัก และ (ไม่ได้ตั้งงบ หรือ ราคาไม่เกินงบ)
    const pool = [];
    for (let i = 0; i < data.menus.length; i++) {
      const menu = data.menus[i];
      const isMainDish = MAIN_CATEGORIES.indexOf(menu.category) !== -1;
      const priceOk = (budget === null) || (menu.price <= budget);
      if (isMainDish && priceOk) {
        pool.push(menu);
      }
    }

    randomResultBox.innerHTML = '';

    if (pool.length === 0) {
      randomResultBox.appendChild(
        makeElement('p', 'alert alert-info', 'ไม่พบเมนูที่ราคาไม่เกิน ' + budget + ' บาท ลองเพิ่มงบที่หน้าตะกร้า')
      );
      return;
    }

    // Math.random() ได้เลข 0 ถึงน้อยกว่า 1 คูณจำนวนเมนู แล้วปัดลง จะได้ตำแหน่งสุ่ม
    const randomIndex = Math.floor(Math.random() * pool.length);
    const picked = pool[randomIndex];
    randomResultBox.appendChild(makeElement('h3', '', 'เมนูที่สุ่มได้'));
    randomResultBox.appendChild(
      createMenuCard(picked, findShopById(data.shops, picked.shopId), getBestSellerIds(data.menus))
    );
  });
}

startIndexPage(); // เริ่มทำงาน
