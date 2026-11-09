// =====================================================
// common.js : ฟังก์ชันที่ "ทุกหน้า" ใช้ร่วมกัน
// ทุกหน้าโหลดไฟล์นี้ก่อน แล้วค่อยโหลดไฟล์ของหน้านั้น ๆ
// ดังนั้นไฟล์อื่นเรียกใช้ฟังก์ชันในนี้ได้เลย เช่น loadData()
// =====================================================

// ชื่อที่ใช้เก็บข้อมูลใน localStorage
// ตั้งเป็นค่าคงที่ (const) ไว้ จะได้ไม่พิมพ์ชื่อผิดในหลายที่
const CART_KEY = 'canteen.cart';       // ตะกร้า
const BUDGET_KEY = 'canteen.budget';   // งบวันนี้
const REVIEWS_KEY = 'canteen.reviews'; // รีวิวที่ผู้ใช้เขียนเอง
const SALES_KEY = 'canteen.sales';     // นับว่าแต่ละเมนูถูกเพิ่มลงตะกร้ากี่ครั้ง (ใช้ทำป้ายขายดี)

let toastTimer = null; // ตัวจับเวลาของกล่องแจ้งเตือน


// ---------- 1) อ่าน/เขียน localStorage ----------

// อ่านข้อมูลจาก localStorage
// key = ชื่อที่เก็บ, defaultValue = ค่าที่จะใช้ถ้าไม่มีข้อมูล
function getFromStorage(key, defaultValue) {
  try {
    const text = localStorage.getItem(key);   // ได้เป็นข้อความ หรือ null ถ้ายังไม่เคยเก็บ
    if (text === null) {
      return defaultValue;
    }
    return JSON.parse(text);                  // แปลงข้อความกลับเป็นข้อมูลจริง (ตัวเลข, อาร์เรย์, อ็อบเจ็กต์)
  } catch (error) {
    // ถ้าเบราว์เซอร์ไม่ให้ใช้ localStorage หรือข้อมูลเสีย ก็ใช้ค่าตั้งต้นแทน เว็บจะได้ไม่พัง
    return defaultValue;
  }
}

// เก็บข้อมูลลง localStorage (localStorage เก็บได้แค่ข้อความ จึงต้องแปลงด้วย JSON.stringify ก่อน)
function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;   // เก็บสำเร็จ
  } catch (error) {
    return false;  // เก็บไม่สำเร็จ
  }
}


// ---------- 2) โหลดข้อมูลจากไฟล์ JSON ----------

// async = ฟังก์ชันที่ต้อง "รอ" อะไรบางอย่าง (เช่น รอไฟล์โหลด)
// await = สั่งให้รอจนเสร็จก่อน แล้วค่อยทำบรรทัดถัดไป
async function loadData() {
  const response = await fetch('data/canteen.json'); // ขอไฟล์ แล้วรอคำตอบ
  if (response.ok === false) {
    // เช่น หาไฟล์ไม่เจอ (404) ให้โยน error ออกไป ให้คนที่เรียกใช้จัดการต่อ
    throw new Error('โหลดข้อมูลไม่สำเร็จ (HTTP ' + response.status + ')');
  }
  const data = await response.json(); // แปลงเนื้อหาไฟล์เป็นข้อมูลที่ JavaScript ใช้ได้
  return data;
}

// หาร้านจาก id เช่น findShopById(data.shops, 's01')
function findShopById(shops, shopId) {
  for (let i = 0; i < shops.length; i++) {
    if (shops[i].id === shopId) {
      return shops[i];
    }
  }
  return null; // ไม่เจอ
}

// หาเมนูจาก id
function findMenuById(menus, menuId) {
  for (let i = 0; i < menus.length; i++) {
    if (menus[i].id === menuId) {
      return menus[i];
    }
  }
  return null;
}


// ---------- 3) ตัวช่วยสร้าง element ----------

// สร้าง element ใหม่ พร้อมใส่ class และข้อความ (ข้อความใส่หรือไม่ใส่ก็ได้)
// ใช้ textContent เพื่อใส่ข้อความธรรมดา จะไม่ถูกแปลงเป็น HTML (ปลอดภัยกว่า innerHTML)
function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  if (text !== undefined) {
    element.textContent = text;
  }
  return element;
}

// แสดงข้อความ error สีแดงในกล่องที่ส่งมา (ใช้ตอนโหลดข้อมูลไม่สำเร็จ)
function showLoadError(box) {
  box.innerHTML = ''; // ล้างของเดิมในกล่อง
  const message = makeElement('p', 'alert alert-error', '⚠ โหลดข้อมูลไม่สำเร็จ กรุณารีเฟรชหน้านี้ หากเปิดไฟล์โดยตรงให้เปิดผ่าน Live Server แทน');
  message.setAttribute('role', 'alert'); // ให้โปรแกรมอ่านหน้าจออ่านข้อความนี้ทันที
  box.appendChild(message);
}


// ---------- 4) ตะกร้า ----------
// ตะกร้าเก็บเป็นอ็อบเจ็กต์ เช่น { m001: 2, m017: 1 }
// หมายถึงเมนู m001 สองจาน และเมนู m017 หนึ่งแก้ว

function getCart() {
  const cart = getFromStorage(CART_KEY, {});
  // กันกรณีข้อมูลในเครื่องเพี้ยน: ต้องเป็นอ็อบเจ็กต์เท่านั้น
  if (typeof cart !== 'object' || cart === null || Array.isArray(cart)) {
    return {};
  }
  return cart;
}

function saveCart(cart) {
  saveToStorage(CART_KEY, cart);
  updateCartBadge(); // อัปเดตตัวเลขบนไอคอนตะกร้า
}

// เพิ่มเมนู 1 หน่วยลงตะกร้า
function addToCart(menuId) {
  const cart = getCart();
  if (cart[menuId] === undefined) {
    cart[menuId] = 0;              // ยังไม่เคยมีเมนูนี้ เริ่มจาก 0
  }
  cart[menuId] = cart[menuId] + 1; // บวกเพิ่ม 1
  saveCart(cart);

  // นับยอดไว้ใช้ทำป้าย "ขายดี"
  const sales = getFromStorage(SALES_KEY, {});
  if (sales[menuId] === undefined) {
    sales[menuId] = 0;
  }
  sales[menuId] = sales[menuId] + 1;
  saveToStorage(SALES_KEY, sales);
}

// เพิ่มหรือลดจำนวน (change เป็น 1 หรือ -1)
function changeQuantity(menuId, change) {
  const cart = getCart();
  if (cart[menuId] === undefined) {
    return; // ไม่มีเมนูนี้ในตะกร้า ไม่ต้องทำอะไร
  }
  cart[menuId] = cart[menuId] + change;
  if (cart[menuId] <= 0) {
    delete cart[menuId]; // เหลือ 0 ก็ลบออกจากตะกร้าเลย
  }
  saveCart(cart);
}

// ลบเมนูออกจากตะกร้าทั้งรายการ
function removeFromCart(menuId) {
  const cart = getCart();
  delete cart[menuId];
  saveCart(cart);
}

// ล้างตะกร้าทั้งหมด
function clearCart() {
  saveCart({});
}

// นับจำนวนชิ้นรวมทุกเมนูในตะกร้า
function countCartItems() {
  const cart = getCart();
  let total = 0;
  for (const menuId in cart) {   // for...in วนทุกชื่อ (key) ในอ็อบเจ็กต์
    total = total + cart[menuId];
  }
  return total;
}

// สรุปตะกร้า: รายการเมนู, ราคารวม, พลังงานรวม, จำนวนชิ้นรวม
function getCartSummary(menus) {
  const cart = getCart();
  const items = [];
  let total = 0;
  let kcal = 0;
  let count = 0;
  for (const menuId in cart) {
    const menu = findMenuById(menus, menuId);
    if (menu === null) {
      continue; // เมนูนี้ไม่อยู่ในข้อมูลแล้ว ข้ามไป
    }
    const quantity = cart[menuId];
    items.push({ menu: menu, quantity: quantity });
    total = total + menu.price * quantity;
    kcal = kcal + menu.kcal * quantity;
    count = count + quantity;
  }
  return { items: items, total: total, kcal: kcal, count: count };
}

// แสดงจำนวนชิ้นบนไอคอนตะกร้าใน nav
function updateCartBadge() {
  const badge = document.getElementById('cart-count');
  if (badge === null) {
    return; // หน้านี้ไม่มีไอคอนตะกร้า
  }
  const number = countCartItems();
  badge.textContent = number;
  const link = badge.parentElement; // ลิงก์ <a> ที่ครอบตัวเลขอยู่
  link.setAttribute('aria-label', 'ตะกร้า ' + number + ' รายการ'); // ให้โปรแกรมอ่านหน้าจออ่านได้ถูกต้อง
}


// ---------- 5) งบวันนี้ ----------

// คืนตัวเลขงบ หรือ null ถ้ายังไม่ได้ตั้ง
function getBudget() {
  const value = getFromStorage(BUDGET_KEY, null);
  if (typeof value === 'number') {
    return value;
  }
  return null;
}

function setBudget(value) {
  saveToStorage(BUDGET_KEY, value);
}

function clearBudget() {
  try {
    localStorage.removeItem(BUDGET_KEY);
  } catch (error) {
    // ถ้าลบไม่ได้ก็ไม่ต้องทำอะไร
  }
}


// ---------- 6) ป้าย "ขายดี" ----------

// คืนรายการ id ของเมนูที่ถูกเพิ่มลงตะกร้าบ่อยที่สุด 3 อันดับ
function getBestSellerIds(menus) {
  const sales = getFromStorage(SALES_KEY, {});
  const list = [];
  for (const menuId in sales) {
    if (sales[menuId] > 0 && findMenuById(menus, menuId) !== null) {
      list.push({ id: menuId, count: sales[menuId] });
    }
  }
  // sort เรียงลำดับ: ถ้า b.count มากกว่า a.count ให้ b มาก่อน (เรียงจากมากไปน้อย)
  list.sort(function (a, b) {
    return b.count - a.count;
  });
  const ids = [];
  for (let i = 0; i < list.length && i < 3; i++) {
    ids.push(list[i].id);
  }
  return ids;
}


// ---------- 7) รีวิว ----------

// รวมรีวิวตัวอย่างในไฟล์ JSON กับรีวิวที่ผู้ใช้เขียนเอง แล้วเรียงใหม่สุดขึ้นก่อน
function getAllReviews(data) {
  const myReviews = getFromStorage(REVIEWS_KEY, []);
  const all = [];
  for (let i = 0; i < data.reviews.length; i++) {
    all.push(data.reviews[i]);
  }
  if (Array.isArray(myReviews)) {
    for (let i = 0; i < myReviews.length; i++) {
      all.push(myReviews[i]);
    }
  }
  // วันที่เก็บเป็นข้อความ เช่น 2026-11-05T10:00:00 เทียบกันตามตัวอักษรได้เลย
  all.sort(function (a, b) {
    return b.date.localeCompare(a.date);
  });
  return all;
}

// เพิ่มรีวิวใหม่ของผู้ใช้ (คืน true ถ้าเก็บสำเร็จ)
function addReview(review) {
  const myReviews = getFromStorage(REVIEWS_KEY, []);
  if (Array.isArray(myReviews) === false) {
    return saveToStorage(REVIEWS_KEY, [review]);
  }
  myReviews.push(review);
  return saveToStorage(REVIEWS_KEY, myReviews);
}

// หาคะแนนเฉลี่ยของร้านหนึ่ง
function getShopRating(reviews, shopId) {
  let sum = 0;
  let count = 0;
  for (let i = 0; i < reviews.length; i++) {
    if (reviews[i].shopId === shopId) {
      sum = sum + Number(reviews[i].rating);
      count = count + 1;
    }
  }
  if (count === 0) {
    return { average: 0, count: 0 }; // ยังไม่มีรีวิว ไม่หารด้วย 0
  }
  return { average: sum / count, count: count };
}

// สร้างข้อความดาว เช่น rating 4 ได้ ★★★★☆
function makeStarSpan(rating) {
  const fullStars = Math.round(rating); // ปัดเป็นจำนวนดาวเต็ม
  let starText = '';
  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      starText = starText + '★';
    } else {
      starText = starText + '☆';
    }
  }
  const span = makeElement('span', 'stars', starText);
  span.setAttribute('aria-hidden', 'true'); // โปรแกรมอ่านหน้าจอไม่ต้องอ่านดาว เพราะมีตัวเลขอยู่แล้ว
  return span;
}

// สร้างส่วนแสดงดาว + คะแนนเฉลี่ย เช่น ★★★★☆ 4.5 / 5 (2 รีวิว)
function makeRatingElement(average, count) {
  const wrapper = makeElement('span', 'rating');
  if (count === 0) {
    wrapper.textContent = 'ยังไม่มีรีวิว';
    return wrapper;
  }
  wrapper.appendChild(makeStarSpan(average));
  wrapper.appendChild(document.createTextNode(' ' + average.toFixed(1) + ' / 5 (' + count + ' รีวิว)'));
  return wrapper;
}


// ---------- 8) ร้านเปิดอยู่ไหม ----------

// แปลงเวลา '07:30' เป็นจำนวนนาทีนับจากเที่ยงคืน (7 x 60 + 30 = 450)
function timeToMinutes(timeText) {
  const parts = timeText.split(':'); // แยกที่เครื่องหมาย : ได้ ['07', '30']
  return Number(parts[0]) * 60 + Number(parts[1]);
}

function isShopOpen(shop) {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return nowMinutes >= timeToMinutes(shop.open) && nowMinutes < timeToMinutes(shop.close);
}


// ---------- 9) กล่องแจ้งเตือนสั้น ๆ ----------

function showToast(message) {
  let box = document.getElementById('toast');
  if (box === null) {
    // ถ้าในหน้าไม่มีกล่องนี้ ให้สร้างขึ้นมาใหม่
    box = makeElement('div', 'toast');
    box.id = 'toast';
    box.setAttribute('role', 'status');
    box.setAttribute('aria-live', 'polite');
    document.body.appendChild(box);
  }
  box.textContent = message;
  box.classList.add('show'); // class show ทำให้กล่องปรากฏ (ดูใน style.css)
  clearTimeout(toastTimer);  // ยกเลิกตัวจับเวลาเก่า (กรณีกดซ้ำเร็ว ๆ)
  // อีก 2.5 วินาที เอา class show ออก กล่องก็จะหายไป
  toastTimer = setTimeout(function () {
    box.classList.remove('show');
  }, 2500);
}


// ---------- 10) การ์ดเมนู ----------

// สร้างการ์ดเมนู 1 ใบ
// menu = ข้อมูลเมนู, shop = ข้อมูลร้านของเมนูนี้, bestIds = รายการ id เมนูขายดี
function createMenuCard(menu, shop, bestIds) {
  const card = makeElement('article', 'card menu-card');

  // --- รูป ---
  const image = document.createElement('img');
  image.src = menu.image;
  if (shop !== null) {
    image.alt = menu.name + ' จากร้าน' + shop.name; // alt = ข้อความแทนรูป
  } else {
    image.alt = menu.name;
  }
  image.width = 400;
  image.height = 300;
  image.loading = 'lazy'; // รูปที่ยังไม่ถึงจอ ค่อยโหลดทีหลัง
  let usedFallback = false;
  image.addEventListener('error', function () {
    // ถ้ารูปโหลดไม่ขึ้น ให้เปลี่ยนเป็นรูปสำรอง (ทำแค่ครั้งเดียว กันวนซ้ำ)
    if (usedFallback === false) {
      usedFallback = true;
      image.src = 'images/placeholder.svg';
    }
  });
  card.appendChild(image);

  // --- ส่วนข้อความ ---
  const body = makeElement('div', 'card-body');
  body.appendChild(makeElement('h3', '', menu.name));

  let shopText = '';
  if (shop !== null) {
    // ถ้าชื่อร้านขึ้นต้นด้วยคำว่า "ร้าน" อยู่แล้ว ไม่ต้องเติมซ้ำ
    if (shop.name.indexOf('ร้าน') === 0) {
      shopText = shop.name;
    } else {
      shopText = 'ร้าน' + shop.name;
    }
  }
  body.appendChild(makeElement('p', 'meta', shopText));
  body.appendChild(makeElement('p', 'meta', menu.category + ', ประมาณ ' + menu.kcal + ' kcal'));

  // --- ป้ายต่าง ๆ ---
  const badges = makeElement('ul', 'badges');
  badges.setAttribute('aria-label', 'ป้ายอาหาร');
  if (bestIds.indexOf(menu.id) !== -1) {  // indexOf ได้ -1 แปลว่าไม่เจอ
    badges.appendChild(makeElement('li', 'badge badge-hot', 'ขายดี'));
  }
  if (menu.halal === true) {
    badges.appendChild(makeElement('li', 'badge badge-halal', 'ฮาลาล'));
  }
  if (menu.vegetarian === true) {
    badges.appendChild(makeElement('li', 'badge badge-veg', 'มังสวิรัติ'));
  }
  for (let i = 0; i < menu.tags.length; i++) {
    badges.appendChild(makeElement('li', 'badge badge-tag', menu.tags[i]));
  }
  if (badges.children.length > 0) {
    body.appendChild(badges); // ใส่เฉพาะตอนมีป้ายอย่างน้อย 1 อัน
  }

  // --- ราคา + ปุ่ม ---
  const foot = makeElement('div', 'card-foot');
  foot.appendChild(makeElement('p', 'price-tag', '฿' + menu.price));

  const button = makeElement('button', 'btn btn-primary', 'เพิ่มลงตะกร้า');
  button.type = 'button';
  button.setAttribute('aria-label', 'เพิ่มลงตะกร้า: ' + menu.name);
  button.addEventListener('click', function () {
    addToCart(menu.id);
    showToast('เพิ่ม “' + menu.name + '” ลงตะกร้าแล้ว');
  });
  foot.appendChild(button);

  body.appendChild(foot);
  card.appendChild(body);
  return card;
}


// ---------- 11) การ์ดร้านอาหาร ----------

function createShopCard(shop, reviews) {
  const rating = getShopRating(reviews, shop.id);
  const open = isShopOpen(shop);
  const encodedId = encodeURIComponent(shop.id); // ทำให้ id ใช้ต่อท้าย URL ได้อย่างปลอดภัย

  const card = makeElement('article', 'card shop-card');
  const body = makeElement('div', 'card-body');

  body.appendChild(makeElement('h3', '', shop.name));

  let zoneText = shop.zone;
  if (zoneText.indexOf('โซน') !== 0) {
    zoneText = 'โซน' + zoneText;
  }
  body.appendChild(makeElement('p', 'meta', zoneText));
  body.appendChild(makeElement('p', 'meta', 'เปิด ' + shop.open + '–' + shop.close + ' น.'));

  // ป้ายเปิด/ปิด (มีทั้งข้อความและสัญลักษณ์ ไม่พึ่งสีอย่างเดียว)
  const statusParagraph = makeElement('p');
  if (open) {
    statusParagraph.appendChild(makeElement('span', 'badge badge-open', '● เปิดอยู่ตอนนี้'));
  } else {
    statusParagraph.appendChild(makeElement('span', 'badge badge-closed', '○ ปิดแล้ว'));
  }
  body.appendChild(statusParagraph);

  const ratingParagraph = makeElement('p');
  ratingParagraph.appendChild(makeRatingElement(rating.average, rating.count));
  body.appendChild(ratingParagraph);

  body.appendChild(makeElement('p', '', shop.description));

  // ลิงก์ไปหน้าเมนู และหน้ารีวิว ของร้านนี้ (ส่ง id ร้านผ่านท้าย URL)
  const foot = makeElement('div', 'card-foot');
  const menuLink = makeElement('a', 'btn btn-primary', 'ดูเมนู');
  menuLink.href = 'menu.html?shop=' + encodedId;
  menuLink.setAttribute('aria-label', 'ดูเมนูร้าน' + shop.name);
  foot.appendChild(menuLink);

  const reviewLink = makeElement('a', 'btn btn-secondary', 'เขียนรีวิว');
  reviewLink.href = 'review.html?shop=' + encodedId;
  reviewLink.setAttribute('aria-label', 'เขียนรีวิวร้าน' + shop.name);
  foot.appendChild(reviewLink);

  body.appendChild(foot);
  card.appendChild(body);
  return card;
}


// ---------- 12) ทำงานทันทีที่โหลดไฟล์นี้ ----------

updateCartBadge(); // แสดงตัวเลขตะกร้าตอนเปิดหน้า

// ถ้าแท็บอื่นแก้ localStorage (เช่น เพิ่มของลงตะกร้า) ให้ตัวเลขในแท็บนี้อัปเดตตาม
window.addEventListener('storage', updateCartBadge);
