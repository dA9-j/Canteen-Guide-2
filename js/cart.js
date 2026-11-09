// =====================================================
// cart.js : หน้าตะกร้าและงบประมาณ
// ทำ 3 อย่าง: ตั้งงบ, แสดงรายการในตะกร้า, ปุ่ม เพิ่ม/ลด/ลบ
// =====================================================

const cartContent = document.getElementById('cart-content');
const cartHeading = document.getElementById('cart-heading');
const budgetForm = document.getElementById('budget-form');
const budgetInput = document.getElementById('budget');
const budgetError = document.getElementById('budget-error');
const budgetStatus = document.getElementById('budget-status');
const clearBudgetButton = document.getElementById('clear-budget');

let data = null; // ข้อมูลเมนู (ยังไม่โหลด = null)

// ถ้าเคยตั้งงบไว้ ให้ใส่ลงในช่องกรอก
const savedBudget = getBudget();
if (savedBudget !== null) {
  budgetInput.value = savedBudget;
}

// แสดงสถานะงบ: เทียบราคารวมกับงบที่ตั้งไว้
function showBudgetStatus(total) {
  const budget = getBudget();

  if (budget === null) {
    budgetStatus.className = 'alert alert-info';
    budgetStatus.textContent = 'ยังไม่ได้ตั้งงบวันนี้';
  } else if (total > budget) {
    // เกินงบ: กล่องสีแดง + ข้อความเตือน (ใส่ ⚠ ด้วย เพื่อไม่พึ่งสีอย่างเดียว)
    budgetStatus.className = 'alert alert-error';
    budgetStatus.textContent = '⚠ เกินงบ ' + (total - budget) + ' บาท (งบ ' + budget + ' บาท, ราคารวม ' + total + ' บาท)';
  } else {
    // ไม่เกินงบ: กล่องสีเขียว
    budgetStatus.className = 'alert alert-ok';
    budgetStatus.textContent = '✔ อยู่ในงบ เหลืออีก ' + (budget - total) + ' บาท (งบ ' + budget + ' บาท)';
  }
}

// สร้างปุ่มเล็ก ๆ สำหรับ เพิ่ม / ลด
// action = 'inc' (เพิ่ม) หรือ 'dec' (ลด), label = ข้อความที่โปรแกรมอ่านหน้าจอจะอ่าน
function makeIconButton(action, text, label, menuId) {
  const button = makeElement('button', 'btn btn-secondary btn-icon', text);
  button.type = 'button';
  button.setAttribute('data-action', action); // เก็บชื่อการกระทำไว้บนปุ่ม (ใช้ค้นหาปุ่มกลับมาภายหลัง)
  button.setAttribute('data-id', menuId);
  button.setAttribute('aria-label', label);
  button.addEventListener('click', function () {
    handleCartAction(action, menuId);
  });
  return button;
}

// เพิ่มแถวหนึ่งในกล่องสรุป (ชื่อหัวข้อ + ค่า)
function addSummaryRow(list, label, value, extraClass) {
  list.appendChild(makeElement('dt', extraClass, label));
  list.appendChild(makeElement('dd', extraClass, value));
}

// วาดตะกร้าใหม่ทั้งหมด (เรียกทุกครั้งที่ตะกร้าเปลี่ยน)
function showCart() {
  const summary = getCartSummary(data.menus);
  showBudgetStatus(summary.total);

  cartContent.innerHTML = ''; // ล้างของเดิม

  // ตะกร้าว่าง
  if (summary.items.length === 0) {
    const emptyText = makeElement('p', 'empty', 'ตะกร้ายังว่าง ');
    emptyText.appendChild(makeElement('a', '', 'ไปเลือกเมนู'));
    emptyText.lastChild.href = 'menu.html';
    cartContent.appendChild(emptyText);
    return;
  }

  // รายการเมนูในตะกร้า
  const list = makeElement('ul', 'cart-list');
  for (let i = 0; i < summary.items.length; i++) {
    const menu = summary.items[i].menu;
    const quantity = summary.items[i].quantity;
    const shop = findShopById(data.shops, menu.shopId);

    const item = makeElement('li', 'cart-item');

    // ชื่อเมนู + ชื่อร้าน + ราคาต่อหน่วย
    const info = makeElement('div', 'cart-info');
    info.appendChild(makeElement('h3', '', menu.name));
    let shopName = '';
    if (shop !== null) {
      shopName = shop.name + ', ';
    }
    info.appendChild(makeElement('p', 'meta', shopName + '฿' + menu.price + ' ต่อรายการ'));
    item.appendChild(info);

    // ปุ่ม ลด / จำนวน / เพิ่ม
    const controls = makeElement('div', 'qty-controls');
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', 'จำนวน ' + menu.name);
    controls.appendChild(makeIconButton('dec', '−', 'ลดจำนวน ' + menu.name, menu.id));
    controls.appendChild(makeElement('span', 'qty', quantity));
    controls.appendChild(makeIconButton('inc', '+', 'เพิ่มจำนวน ' + menu.name, menu.id));
    item.appendChild(controls);

    // ราคารวมของรายการนี้
    item.appendChild(makeElement('p', 'line-total', '฿' + menu.price * quantity));

    // ปุ่มลบ
    const removeButton = makeElement('button', 'btn btn-danger', 'ลบ');
    removeButton.type = 'button';
    removeButton.setAttribute('data-action', 'remove');
    removeButton.setAttribute('data-id', menu.id);
    removeButton.setAttribute('aria-label', 'ลบ ' + menu.name + ' ออกจากตะกร้า');
    removeButton.addEventListener('click', function () {
      handleCartAction('remove', menu.id);
    });
    item.appendChild(removeButton);

    list.appendChild(item);
  }
  cartContent.appendChild(list);

  // กล่องสรุป: จำนวนรายการ / พลังงานรวม / ราคารวม
  const summaryList = makeElement('dl', 'summary');
  addSummaryRow(summaryList, 'จำนวนรายการ', summary.count + ' รายการ', '');
  addSummaryRow(summaryList, 'พลังงานรวมโดยประมาณ', summary.kcal + ' kcal', '');
  addSummaryRow(summaryList, 'ราคารวม', '฿' + summary.total, 'summary-total');
  cartContent.appendChild(summaryList);

  // ปุ่มล้างตะกร้า
  const clearButton = makeElement('button', 'btn btn-secondary', 'ล้างตะกร้า');
  clearButton.type = 'button';
  clearButton.addEventListener('click', function () {
    handleCartAction('clear', '');
  });
  cartContent.appendChild(clearButton);
}

// ทำตามปุ่มที่ผู้ใช้กด แล้ววาดตะกร้าใหม่
function handleCartAction(action, menuId) {
  if (action === 'inc') {
    changeQuantity(menuId, 1);
  } else if (action === 'dec') {
    changeQuantity(menuId, -1);
  } else if (action === 'remove') {
    removeFromCart(menuId);
  } else if (action === 'clear') {
    clearCart();
  }

  showCart(); // วาดใหม่ ปุ่มเก่าจึงหายไป

  // ปุ่มเก่าหายไป ทำให้โฟกัสคีย์บอร์ดหลุด จึงต้องหาปุ่มเดิมแล้วโฟกัสกลับ
  // ถ้าหาไม่เจอ (เช่น ลบรายการไปแล้ว) ให้โฟกัสที่หัวข้อแทน
  let sameButton = null;
  if (menuId !== '') {
    sameButton = cartContent.querySelector('button[data-action="' + action + '"][data-id="' + menuId + '"]');
  }
  if (sameButton !== null) {
    sameButton.focus();
  } else {
    cartHeading.focus();
  }
}

// ----- ตั้งงบ -----
budgetForm.addEventListener('submit', function (event) {
  event.preventDefault(); // ห้ามโหลดหน้าใหม่

  const text = budgetInput.value.trim();
  const value = Number(text);

  // ตรวจว่า: ไม่ว่าง, เป็นจำนวนเต็ม, อยู่ระหว่าง 1 ถึง 5000
  if (text === '' || Number.isInteger(value) === false || value < 1 || value > 5000) {
    budgetError.textContent = '⚠ กรุณากรอกงบเป็นจำนวนเต็ม 1–5,000 บาท';
    budgetInput.setAttribute('aria-invalid', 'true'); // บอกว่าช่องนี้กรอกผิด (CSS จะทำกรอบแดง)
    budgetInput.focus();
    return;
  }

  budgetError.textContent = '';
  budgetInput.setAttribute('aria-invalid', 'false');
  setBudget(value);
  if (data !== null) {
    showCart(); // วาดใหม่ เพื่อคำนวณสถานะงบ
  }
  showToast('บันทึกงบวันนี้ ' + value + ' บาทแล้ว');
});

// ----- ล้างงบ -----
clearBudgetButton.addEventListener('click', function () {
  clearBudget();
  budgetInput.value = '';
  budgetError.textContent = '';
  budgetInput.setAttribute('aria-invalid', 'false');
  if (data !== null) {
    showCart();
  } else {
    showBudgetStatus(0);
  }
  budgetInput.focus();
});

// ----- เริ่มทำงาน: โหลดข้อมูลเมนู (ต้องรู้ชื่อและราคาถึงจะวาดตะกร้าได้) -----
async function startCartPage() {
  try {
    data = await loadData();
  } catch (error) {
    showLoadError(cartContent);
    showBudgetStatus(0);
    return;
  }
  showCart();
}

startCartPage();
