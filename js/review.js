// =====================================================
// review.js : หน้ารีวิวร้านอาหาร
// ทำ 3 อย่าง: ตรวจฟอร์ม (validation), บันทึกรีวิว, แสดงรีวิวกับคะแนนเฉลี่ย
// =====================================================

const reviewForm = document.getElementById('review-form');
const reviewShopSelect = document.getElementById('shop');
const nameInput = document.getElementById('reviewer');
const commentInput = document.getElementById('comment');
const commentCounter = document.getElementById('comment-count');
const formMessage = document.getElementById('form-message');
const shopSummaryBox = document.getElementById('shop-summary');
const reviewListBox = document.getElementById('review-list');
const firstRatingRadio = document.getElementById('rating-1');

// รูปแบบของชื่อที่ยอมรับ (regex): ตัวอักษรอังกฤษ ไทย ตัวเลข เว้นวรรค _ . - ยาว 2 ถึง 30 ตัว
const NAME_PATTERN = /^[A-Za-z0-9ก-๙ _.\-]{2,30}$/;

let data = null;

// แสดงคะแนนเฉลี่ยรายร้าน และรีวิวล่าสุด
function showReviews() {
  const reviews = getAllReviews(data);

  // --- คะแนนเฉลี่ยรายร้าน ---
  shopSummaryBox.innerHTML = '';
  const summaryList = makeElement('ul', 'summary-list');
  for (let i = 0; i < data.shops.length; i++) {
    const shop = data.shops[i];
    const rating = getShopRating(reviews, shop.id);

    const item = makeElement('li');
    item.appendChild(makeElement('strong', '', shop.name));
    item.appendChild(document.createElement('br'));
    item.appendChild(makeRatingElement(rating.average, rating.count));
    summaryList.appendChild(item);
  }
  shopSummaryBox.appendChild(summaryList);

  // --- รีวิวล่าสุด 10 อัน (รีวิวเรียงใหม่สุดมาก่อนแล้ว) ---
  reviewListBox.innerHTML = '';
  for (let i = 0; i < reviews.length && i < 10; i++) {
    const review = reviews[i];
    const shop = findShopById(data.shops, review.shopId);

    let shopName = 'ร้านอาหาร';
    if (shop !== null) {
      shopName = shop.name;
    }
    // แปลงวันที่เป็นแบบไทย เช่น 5 พ.ย. 2569
    const dateText = new Date(review.date).toLocaleDateString('th-TH', { dateStyle: 'medium' });

    const article = makeElement('article', 'review-item');
    article.appendChild(makeElement('h3', '', shopName));

    const ratingLine = makeElement('p');
    ratingLine.appendChild(makeStarSpan(Number(review.rating)));
    ratingLine.appendChild(document.createTextNode(' ' + review.rating + ' / 5'));
    article.appendChild(ratingLine);

    article.appendChild(makeElement('p', '', review.comment));
    article.appendChild(makeElement('p', 'meta', 'โดย ' + review.name + ' เมื่อ ' + dateText));
    reviewListBox.appendChild(article);
  }
}

// ----- ตรวจฟอร์ม -----

// ตรวจ 1 ช่อง: ถ้าผ่าน ล้างข้อความ error ถ้าไม่ผ่าน แสดงข้อความ error ใต้ช่อง
// control = ช่องที่ตรวจ, isOk = ผ่านหรือไม่, errorId = id ของที่แสดง error, message = ข้อความ
function checkField(control, isOk, errorId, message) {
  const errorBox = document.getElementById(errorId);
  if (isOk) {
    errorBox.textContent = '';
    control.setAttribute('aria-invalid', 'false');
  } else {
    errorBox.textContent = '⚠ ' + message;
    control.setAttribute('aria-invalid', 'true'); // CSS จะทำกรอบสีแดงให้ช่องนี้
  }
}

// ตรวจทั้งฟอร์ม คืนช่องแรกที่ผิด (หรือ null ถ้าผ่านทั้งหมด)
// ตรวจครบทุกช่องเสมอ ผู้ใช้จะได้เห็นข้อผิดพลาดทุกช่องพร้อมกัน
function validateForm() {
  let firstInvalid = null;

  // 1) ต้องเลือกร้าน
  const shopOk = reviewShopSelect.value !== '';
  checkField(reviewShopSelect, shopOk, 'shop-error', 'กรุณาเลือกร้านที่ต้องการรีวิว');
  if (shopOk === false && firstInvalid === null) {
    firstInvalid = reviewShopSelect;
  }

  // 2) ต้องให้คะแนน (radio ที่ถูกเลือก)
  const checkedRating = reviewForm.querySelector('input[name="rating"]:checked');
  const ratingOk = checkedRating !== null;
  checkField(firstRatingRadio, ratingOk, 'rating-error', 'กรุณาให้คะแนน 1–5');
  if (ratingOk === false && firstInvalid === null) {
    firstInvalid = firstRatingRadio;
  }

  // 3) ชื่อต้องตรงรูปแบบ
  const nameOk = NAME_PATTERN.test(nameInput.value.trim());
  checkField(nameInput, nameOk, 'reviewer-error', 'ชื่อต้องยาว 2–30 ตัวอักษร ใช้ได้เฉพาะตัวอักษร ตัวเลข เว้นวรรค . _ -');
  if (nameOk === false && firstInvalid === null) {
    firstInvalid = nameInput;
  }

  // 4) ความคิดเห็นต้องยาว 10–300 ตัวอักษร
  const commentLength = commentInput.value.trim().length;
  const commentOk = commentLength >= 10 && commentLength <= 300;
  checkField(commentInput, commentOk, 'comment-error', 'ความคิดเห็นต้องมี 10–300 ตัวอักษร (ตอนนี้ ' + commentLength + ')');
  if (commentOk === false && firstInvalid === null) {
    firstInvalid = commentInput;
  }

  return firstInvalid;
}

// นับตัวอักษรในช่องความคิดเห็นทุกครั้งที่พิมพ์
commentInput.addEventListener('input', function () {
  commentCounter.textContent = commentInput.value.length + ' / 300 ตัวอักษร';
});

// ----- ตอนกดส่งรีวิว -----
reviewForm.addEventListener('submit', function (event) {
  event.preventDefault(); // ห้ามโหลดหน้าใหม่

  formMessage.className = '';
  formMessage.textContent = '';

  const invalidField = validateForm();
  if (invalidField !== null) {
    invalidField.focus(); // พาโฟกัสไปที่ช่องแรกที่ผิด
    return;               // ไม่บันทึก
  }

  // ผ่านหมดแล้ว สร้างรีวิวใหม่
  const newReview = {
    id: 'u' + Date.now(),                 // id ไม่ซ้ำ ใช้เวลาปัจจุบัน (u = user)
    shopId: reviewShopSelect.value,
    name: nameInput.value.trim(),
    rating: Number(reviewForm.querySelector('input[name="rating"]:checked').value),
    comment: commentInput.value.trim(),
    date: new Date().toISOString()        // เช่น 2026-11-09T10:00:00.000Z
  };

  const saved = addReview(newReview);
  if (saved === false) {
    formMessage.className = 'alert alert-error';
    formMessage.textContent = '⚠ บันทึกรีวิวไม่สำเร็จ เบราว์เซอร์อาจปิดการเก็บข้อมูล';
    return;
  }

  // บันทึกสำเร็จ: ล้างฟอร์ม และล้างสถานะ error ทุกช่อง
  reviewForm.reset();
  commentCounter.textContent = '0 / 300 ตัวอักษร';
  const markedFields = reviewForm.querySelectorAll('[aria-invalid]');
  for (let i = 0; i < markedFields.length; i++) {
    markedFields[i].setAttribute('aria-invalid', 'false');
  }

  formMessage.className = 'alert alert-ok';
  formMessage.textContent = '✔ ขอบคุณสำหรับรีวิว บันทึกเรียบร้อยแล้ว';
  showReviews(); // วาดรีวิวใหม่ รีวิวที่เพิ่งเขียนจะขึ้นบนสุด
});

// ----- เริ่มทำงาน -----
async function startReviewPage() {
  try {
    data = await loadData();
  } catch (error) {
    showLoadError(reviewListBox);
    shopSummaryBox.innerHTML = '';
    // ปิดทุกช่องในฟอร์ม เพราะไม่มีรายชื่อร้านให้เลือก
    const controls = reviewForm.querySelectorAll('input, select, textarea, button');
    for (let i = 0; i < controls.length; i++) {
      controls[i].disabled = true;
    }
    return;
  }

  // เติมรายชื่อร้านลงช่องเลือก
  for (let i = 0; i < data.shops.length; i++) {
    const option = document.createElement('option');
    option.value = data.shops[i].id;
    option.textContent = data.shops[i].name;
    reviewShopSelect.appendChild(option);
  }

  // ถ้ามาจากปุ่ม "เขียนรีวิว" ของการ์ดร้าน (review.html?shop=s01) ให้เลือกร้านนั้นไว้ก่อน
  const shopFromUrl = new URLSearchParams(location.search).get('shop');
  if (shopFromUrl !== null && findShopById(data.shops, shopFromUrl) !== null) {
    reviewShopSelect.value = shopFromUrl;
  }

  showReviews();
}

startReviewPage();
