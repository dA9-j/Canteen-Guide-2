// =====================================================
// menu.js : หน้าเมนูทั้งหมด (ค้นหา กรอง เรียงลำดับ)
// หัวใจคือฟังก์ชัน showMenus() ที่อ่านค่าจากฟอร์ม
// แล้วเลือกเมนูที่ตรงเงื่อนไข เรียงลำดับ และวาดการ์ดใหม่
// =====================================================

// หา element ต่าง ๆ ในหน้า (id ตรงกับใน menu.html)
const filterForm = document.getElementById('filter-form');
const menuGrid = document.getElementById('menu-grid');
const resultCount = document.getElementById('result-count');
const searchInput = document.getElementById('q');
const shopSelect = document.getElementById('shop');
const categorySelect = document.getElementById('category');
const priceSelect = document.getElementById('price');
const halalCheckbox = document.getElementById('halal');
const vegetarianCheckbox = document.getElementById('vegetarian');
const sortSelect = document.getElementById('sort');

let data = null; // เก็บข้อมูลที่โหลดมา (ให้ฟังก์ชันอื่นในไฟล์นี้ใช้ได้)
let bestIds = []; // รายการ id เมนูขายดี

// เช็กว่าราคาอยู่ในช่วงที่เลือกหรือไม่
// rangeValue คือค่า value ของตัวเลือกช่วงราคาใน HTML
function isPriceInRange(price, rangeValue) {
  if (rangeValue === 'u30') {
    return price <= 30;
  }
  if (rangeValue === '31-50') {
    return price >= 31 && price <= 50;
  }
  if (rangeValue === '51-80') {
    return price >= 51 && price <= 80;
  }
  if (rangeValue === 'o80') {
    return price > 80;
  }
  return true; // ไม่ได้เลือกช่วงราคา = ผ่านทุกราคา
}

// เลือกเมนูที่ตรงกับเงื่อนไขทุกข้อในฟอร์ม
function getFilteredMenus() {
  const searchText = searchInput.value.trim().toLowerCase(); // ตัดช่องว่างหัวท้าย และทำเป็นตัวพิมพ์เล็ก
  const result = [];

  for (let i = 0; i < data.menus.length; i++) {
    const menu = data.menus[i];
    const shop = findShopById(data.shops, menu.shopId);

    // 1) ค้นหาด้วยข้อความ: ดูในชื่อเมนู ชื่อร้าน และป้าย
    if (searchText !== '') {
      let shopName = '';
      if (shop !== null) {
        shopName = shop.name;
      }
      const allText = (menu.name + ' ' + shopName + ' ' + menu.tags.join(' ')).toLowerCase();
      if (allText.indexOf(searchText) === -1) {
        continue; // ไม่เจอคำค้น ข้ามเมนูนี้ไปเลย
      }
    }

    // 2) กรองตามร้าน
    if (shopSelect.value !== '' && menu.shopId !== shopSelect.value) {
      continue;
    }

    // 3) กรองตามประเภท
    if (categorySelect.value !== '' && menu.category !== categorySelect.value) {
      continue;
    }

    // 4) กรองตามช่วงราคา
    if (isPriceInRange(menu.price, priceSelect.value) === false) {
      continue;
    }

    // 5) ถ้าติ๊กฮาลาล ต้องเป็นเมนูฮาลาลเท่านั้น
    if (halalCheckbox.checked && menu.halal === false) {
      continue;
    }

    // 6) ถ้าติ๊กมังสวิรัติ ต้องเป็นเมนูมังสวิรัติเท่านั้น
    if (vegetarianCheckbox.checked && menu.vegetarian === false) {
      continue;
    }

    // ผ่านทุกเงื่อนไข เก็บไว้
    result.push(menu);
  }

  return result;
}

// กรอง เรียง แล้ววาดการ์ดลงหน้าเว็บ
function showMenus() {
  const menus = getFilteredMenus();

  // เรียงลำดับตามราคา (ถ้าเลือก)
  if (sortSelect.value === 'price-asc') {
    menus.sort(function (a, b) {
      return a.price - b.price; // น้อยไปมาก
    });
  } else if (sortSelect.value === 'price-desc') {
    menus.sort(function (a, b) {
      return b.price - a.price; // มากไปน้อย
    });
  }

  // บอกจำนวนผลลัพธ์ (ช่องนี้มี aria-live จึงถูกอ่านออกเสียงให้ผู้ใช้โปรแกรมอ่านหน้าจอ)
  if (menus.length > 0) {
    resultCount.textContent = 'พบ ' + menus.length + ' เมนู';
  } else {
    resultCount.textContent = 'ไม่พบเมนูที่ตรงกับตัวกรอง';
  }

  menuGrid.innerHTML = ''; // ล้างการ์ดเก่าทั้งหมดก่อน

  if (menus.length === 0) {
    menuGrid.appendChild(makeElement('p', 'empty', 'ลองลบตัวกรองบางข้อ หรือกดปุ่ม “ล้างตัวกรอง”'));
    return;
  }

  for (let i = 0; i < menus.length; i++) {
    const shop = findShopById(data.shops, menus[i].shopId);
    menuGrid.appendChild(createMenuCard(menus[i], shop, bestIds));
  }
}

async function startMenuPage() {
  try {
    data = await loadData();
  } catch (error) {
    showLoadError(menuGrid);
    return;
  }

  bestIds = getBestSellerIds(data.menus);

  // เติมตัวเลือกร้านจากข้อมูล (ไม่ต้องเขียนชื่อร้านใน HTML เอง)
  for (let i = 0; i < data.shops.length; i++) {
    const option = document.createElement('option');
    option.value = data.shops[i].id;
    option.textContent = data.shops[i].name;
    shopSelect.appendChild(option);
  }

  // เติมตัวเลือกประเภท โดยไม่ใส่ซ้ำ
  const categories = [];
  for (let i = 0; i < data.menus.length; i++) {
    if (categories.indexOf(data.menus[i].category) === -1) {
      categories.push(data.menus[i].category);
    }
  }
  for (let i = 0; i < categories.length; i++) {
    const option = document.createElement('option');
    option.value = categories[i];
    option.textContent = categories[i];
    categorySelect.appendChild(option);
  }

  // อ่านค่าเริ่มต้นจาก URL เช่น menu.html?q=กะเพรา&shop=s01
  const params = new URLSearchParams(location.search);

  const queryText = params.get('q');
  if (queryText !== null) {
    searchInput.value = queryText;
  }

  const shopFromUrl = params.get('shop');
  if (shopFromUrl !== null && findShopById(data.shops, shopFromUrl) !== null) {
    shopSelect.value = shopFromUrl;
  }

  const categoryFromUrl = params.get('category');
  if (categoryFromUrl !== null && categories.indexOf(categoryFromUrl) !== -1) {
    categorySelect.value = categoryFromUrl;
  }

  // ทุกครั้งที่ผู้ใช้เปลี่ยนอะไรในฟอร์ม ให้กรองและวาดใหม่
  filterForm.addEventListener('input', showMenus);   // พิมพ์ในช่องค้นหา
  filterForm.addEventListener('change', showMenus);  // เปลี่ยน select หรือ checkbox

  // กด Enter ในช่องค้นหา: ห้ามโหลดหน้าใหม่ แต่ให้กรองแทน
  filterForm.addEventListener('submit', function (event) {
    event.preventDefault();
    showMenus();
  });

  // ปุ่ม "ล้างตัวกรอง": ฟอร์มรีเซ็ตค่าเองหลัง event นี้ จึงต้องรอเล็กน้อยก่อนวาดใหม่
  filterForm.addEventListener('reset', function () {
    setTimeout(showMenus, 0);
  });

  showMenus(); // วาดครั้งแรกตอนเปิดหน้า
}

startMenuPage();
