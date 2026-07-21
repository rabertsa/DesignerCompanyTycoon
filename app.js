/* ============================================================
   AYARLAR / DENGE TABLOLARI
   ============================================================ */
const SLOTS_PER_FLOOR = 3;
const STARTING_MONEY = 500;

const STAR_INCOME = [
  [10, 40], [40, 100], [100, 250], [250, 600], [600, 1400], [1400, 3000]
];
const STAR_TIME = [8, 10, 12, 15, 18, 22];
const STAR_ICON = ['🎨', '🖌️', '🖊️', '🖍️', '✏️', '🖋️'];

const MAX_PART = 4;
const PART_BONUS = 0.10;

const GRAD_BASE = [1200, 5000, 20000, 75000, 260000];
const GRAD_FLOOR_FACTOR = 0.10;
const MINOR_FRACTIONS = [0.12, 0.22, 0.38, 0.60];

const HIRE_BASE = 250, HIRE_PER_FLOOR = 180, HIRE_SLOT_GROWTH = 1.6;
const FLOOR_BASE = 900, FLOOR_GROWTH = 1.68;

const REBIRTH_REQUIRED_FLOOR = 30;
const REBIRTH_BONUS_PER = 0.10;

const AD_WINDOW_MS = 24 * 60 * 60 * 1000;
const AD_CHARGES_MAX = 2;
const AD_BUFF_MS = 15 * 60 * 1000;
const AD_SPEED_MULT = 2;
const PERM_SPEED_MULT = 2;

const SPIN_COOLDOWN = 24 * 60 * 60 * 1000;
const WHEEL_REWARDS = [
  { type: 'artist', weight: 1 },
  { type: 'speed5x2', weight: 3 },
  { type: 'tryAgain', weight: 7 },
  { type: 'lose', weight: 15 },
  { type: 'money', weight: 10 }
];
const WHEEL_COLORS = ['#f5a623', '#5b8def', '#a78bfa', '#8a97ab', '#3ac47d'];

const MARKET_ITEM_IDS = ['doubleIncome', 'autoCollect', 'adBonus', 'autoRebirth', 'permSpeedX2', 'autoUpgrade'];
const MARKET_ICONS = { doubleIncome: '💎', autoCollect: '🤖', adBonus: '📺', autoRebirth: '🔁', permSpeedX2: '⚡', autoUpgrade: '⬆️' };

function floorTier(floorIdx) {
  if (floorIdx <= 10) return 3;
  if (floorIdx <= 20) return 4;
  return 5;
}
function floorCost(floorIdx) {
  return Math.round(FLOOR_BASE * Math.pow(FLOOR_GROWTH, floorIdx - 2));
}
function hireCost(floorIdx, hiredCountOnFloor) {
  return Math.round((HIRE_BASE + floorIdx * HIRE_PER_FLOOR) * Math.pow(HIRE_SLOT_GROWTH, hiredCountOnFloor));
}
function gradCost(star, floorIdx) {
  const base = GRAD_BASE[Math.min(star, GRAD_BASE.length - 1)];
  return Math.round(base * (1 + floorIdx * GRAD_FLOOR_FACTOR));
}
function minorCost(star, targetPart, floorIdx) {
  return Math.round(gradCost(star, floorIdx) * MINOR_FRACTIONS[targetPart - 1]);
}
function incomeMultiplier(part) {
  return Math.pow(1 + PART_BONUS, part);
}
function rebirthBonusMultiplier(count) {
  return Math.pow(1 + REBIRTH_BONUS_PER, count || 0);
}
function nextUpgradeCostFor(slot, floorIdx, tier) {
  if (slot.part < MAX_PART) return minorCost(slot.star, slot.part + 1, floorIdx);
  const atGlobalMax = slot.star >= STAR_INCOME.length - 1;
  const atFloorCap = slot.star >= tier;
  if (!atGlobalMax && !atFloorCap) return gradCost(slot.star, floorIdx);
  return null;
}
function grantPartsBoost(slot, floorIdx, tier, amount) {
  let remaining = amount;
  while (remaining > 0) {
    if (slot.part < MAX_PART) { slot.part++; remaining--; }
    else {
      const atGlobalMax = slot.star >= STAR_INCOME.length - 1;
      const atFloorCap = slot.star >= tier;
      if (!atGlobalMax && !atFloorCap) { slot.star++; slot.part = 0; remaining--; }
      else break;
    }
  }
}

function activeBuffMultipliers() {
  let incomeMult = 1, speedMult = 1;
  const now = Date.now();
  incomeMult *= rebirthBonusMultiplier(state.prestigeCount);
  if (marketOn('doubleIncome')) incomeMult *= 2;
  if (marketOn('permSpeedX2')) speedMult *= PERM_SPEED_MULT;
  if (state.adBuffUntil && now < state.adBuffUntil) speedMult *= AD_SPEED_MULT;
  if (state.wheelSpeedBuffUntil && now < state.wheelSpeedBuffUntil) speedMult *= 2;
  return { incomeMult, speedMult };
}
function currentIncomeRange(star, part) {
  const mult = incomeMultiplier(part);
  const { incomeMult } = activeBuffMultipliers();
  const [min, max] = STAR_INCOME[star];
  return [Math.round(min * mult * incomeMult), Math.round(max * mult * incomeMult)];
}
function neededProductionTime(star) {
  const { speedMult } = activeBuffMultipliers();
  return STAR_TIME[star] / speedMult;
}

/* ============================================================
   OYUN DURUMU
   ============================================================ */
function emptySlots() {
  return Array.from({ length: SLOTS_PER_FLOOR }, () => ({
    hired: false, star: 0, part: 0, startedAt: 0, ready: false
  }));
}
function freshMarketState() {
  const m = {};
  MARKET_ITEM_IDS.forEach(id => { m[id] = { owned: false, on: false }; });
  m.adBonus.owned = true; m.adBonus.on = true; // Reklam Bonusu baştan ücretsiz kullanılabilir
  return m;
}
function freshState() {
  return {
    companyName: '',
    money: STARTING_MONEY,
    floors: [{ slots: emptySlots() }],
    milestonesSeen: [],
    market: freshMarketState(),
    adBuffUntil: null,
    adWindowStart: null,
    adChargesUsed: 0,
    wheelSpeedBuffUntil: null,
    lastSpinAt: null,
    realPrizeCodes: [],
    prestigeCount: 0
  };
}
let state = freshState();
let dialogueQueue = [];
let dialogueShown = false;

function marketOwned(id) { return !!(state.market[id] && state.market[id].owned); }
function marketOn(id) { return marketOwned(id) && !!state.market[id].on; }

/* ============================================================
   KAYIT: localStorage + XOR gizleme + checksum
   ============================================================ */
const SAVE_KEY = 'kuleOfisSave_v1';
const XOR_KEY = 'KuleOfis_Gizli_Anahtar_2026!';

function xorBytes(bytes, keyStr) {
  const key = new TextEncoder().encode(keyStr);
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) out[i] = bytes[i] ^ key[i % key.length];
  return out;
}
function bytesToBase64(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function base64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function simpleChecksum(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h.toString(36);
}
function saveGame() {
  try {
    const payload = JSON.stringify(state);
    const sum = simpleChecksum(payload);
    const wrapped = JSON.stringify({ payload, sum });
    const bytes = new TextEncoder().encode(wrapped);
    localStorage.setItem(SAVE_KEY, bytesToBase64(xorBytes(bytes, XOR_KEY)));
  } catch (e) { console.error('Kayıt yazılamadı:', e); }
}
function loadGame() {
  try {
    const b64 = localStorage.getItem(SAVE_KEY);
    if (!b64) return null;
    const back = xorBytes(base64ToBytes(b64), XOR_KEY);
    const { payload, sum } = JSON.parse(new TextDecoder().decode(back));
    if (simpleChecksum(payload) !== sum) { console.warn('Kayıt bütünlüğü uyuşmuyor, yok sayılıyor.'); return null; }
    return JSON.parse(payload);
  } catch (e) { console.error('Kayıt okunamadı:', e); return null; }
}
function clearSave() { localStorage.removeItem(SAVE_KEY); }

/* ============================================================
   NATIVE KÖPRÜ STUB'LARI
   ============================================================ */
function nativePurchase(productId, onResult) {
  if (window.AndroidBilling && window.AndroidBilling.purchase) {
    window.AndroidBilling.purchase(productId, onResult);
  } else {
    const ok = confirm('[TEST MODE] The real app would open the Google Play payment screen here.\nNo real money was charged. Enable as demo?');
    onResult(ok);
  }
}
function showRewardedAd(onReward) {
  if (window.AndroidAds && window.AndroidAds.showRewarded) {
    window.AndroidAds.showRewarded(onReward);
  } else {
    setTimeout(onReward, 1200);
  }
}

/* ============================================================
   BAŞLANGIÇ EKRANI
   ============================================================ */
const nameInput = document.getElementById('nameInput');
const startBtn = document.getElementById('startBtn');
nameInput.addEventListener('input', () => { startBtn.disabled = nameInput.value.trim().length === 0; });
nameInput.addEventListener('keydown', e => { if (e.key === 'Enter' && !startBtn.disabled) startBtn.click(); });
startBtn.addEventListener('click', () => {
  state.companyName = nameInput.value.trim();
  enterGame();
  queueDialogue(L.dlgWelcome1(state.companyName));
  queueDialogue(L.dlgWelcome2);
  advanceDialogue();
  saveGame();
});
function enterGame() {
  document.getElementById('startScreen').style.display = 'none';
  document.getElementById('topbar').style.display = 'flex';
  document.getElementById('companyName').innerHTML = state.companyName + '<span>' + L.studioSuffix + '</span>';
  renderAll();
  updateIconButtons();
  updateAdBuffWidget();
}

/* ============================================================
   RENDER: BİNA (performans için sadece son 5 kat DOM'da tutulur)
   ============================================================ */
const buildingEl = document.getElementById('building');

function topFloorFullyStaffed() {
  const top = state.floors[state.floors.length - 1];
  return top.slots.every(s => s.hired);
}

let renderedFloorCount = 5; // aynı anda DOM'da tutulan kat sayısı (performans için)

function visibleFloorStartIndex() {
  return Math.max(0, state.floors.length - renderedFloorCount);
}
function floorIsRendered(floorIdx) {
  return floorIdx > visibleFloorStartIndex();
}
function renderShowMoreBar(hiddenCount) {
  const wrap = document.createElement('div');
  wrap.className = 'show-more-bar';
  const n = Math.min(5, hiddenCount);
  wrap.textContent = currentLang === 'en'
    ? `▼ Show ${n} older floors (${hiddenCount} hidden)`
    : `▼ ${n} eski katı göster (${hiddenCount} kat gizli)`;
  wrap.addEventListener('click', () => { renderedFloorCount += 5; renderAll(); });
  return wrap;
}

function renderAll() {
  buildingEl.innerHTML = '';
  const startIdx = visibleFloorStartIndex();
  if (startIdx > 0) buildingEl.appendChild(renderShowMoreBar(startIdx));
  for (let i = startIdx; i < state.floors.length; i++) {
    buildingEl.appendChild(renderFloor(state.floors[i], i + 1));
  }
  buildingEl.appendChild(renderLockedFloor(state.floors.length + 1));
  document.getElementById('moneyVal').textContent = Math.floor(state.money).toLocaleString('tr-TR');
}
function refreshMoneyLabel() {
  document.getElementById('moneyVal').textContent = Math.floor(state.money).toLocaleString('tr-TR');
}

function renderFloor(floor, idx) {
  const tier = floorTier(idx);
  const wrap = document.createElement('div');
  wrap.className = 'floor';
  wrap.innerHTML = `
    <div class="floor-head">
      <div class="floor-title">🏬 ${L.floor(idx)}</div>
      <div class="floor-tier">${L.maxStars(tier + 1)}</div>
    </div>
    <div class="slots" id="slots-${idx}"></div>
  `;
  const slotsEl = wrap.querySelector('.slots');
  floor.slots.forEach((slot, sIdx) => slotsEl.appendChild(renderSlot(slot, floor, idx, sIdx, tier)));
  return wrap;
}

function slotProgress(slot) {
  if (!slot.hired) return 0;
  if (slot.ready) return 1;
  const elapsed = (Date.now() - slot.startedAt) / 1000;
  return Math.min(1, elapsed / neededProductionTime(slot.star));
}

function renderSlot(slot, floor, floorIdx, slotIdx, tier) {
  const el = document.createElement('div');
  el.dataset.floor = floorIdx;
  el.dataset.slot = slotIdx;

  if (!slot.hired) {
    const hiredCount = floor.slots.filter(s => s.hired).length;
    const cost = hireCost(floorIdx, hiredCount);
    el.className = 'slot empty';
    el.innerHTML = `<div class="plus">+</div><div class="hire-cost">${cost.toLocaleString('tr-TR')} ₺</div>`;
    el.addEventListener('click', () => openHirePopup(floorIdx, slotIdx));
  } else {
    const pct = slotProgress(slot) * 100;
    const parts = Array.from({ length: MAX_PART }, (_, i) => i < slot.part).map(f => `<span class="${f ? 'filled' : ''}"></span>`).join('');
    el.className = 'slot hired' + (slot.ready ? ' ready' : '');
    el.innerHTML = `
      ${slot.ready ? '<div class="ready-badge">' + (currentLang === 'en' ? 'Ready!' : 'Hazır!') + '</div>' : ''}
      <div class="avatar">${STAR_ICON[slot.star]}</div>
      <div class="stars-row">${'★'.repeat(slot.star + 1)}${'☆'.repeat(5 - slot.star)}</div>
      <div class="parts-row">${parts}</div>
      <div class="prog-wrap"><div class="prog-bar" style="width:${pct}%"></div></div>
      <div class="lvl-label">${slot.star + 1}⭐ · ${slot.part}/${MAX_PART}</div>
    `;
    el.addEventListener('click', (e) => {
      if (slot.ready) collectSlot(floorIdx, slotIdx, e);
      else openUpgradePopup(floorIdx, slotIdx, tier);
    });
  }
  return el;
}

function refreshSlotDOM(floorIdx, slotIdx) {
  if (!floorIsRendered(floorIdx)) return; // DOM'da yoksa hiçbir şey yapma
  const floor = state.floors[floorIdx - 1];
  const slot = floor.slots[slotIdx];
  const tier = floorTier(floorIdx);
  const old = buildingEl.querySelector(`.slot[data-floor="${floorIdx}"][data-slot="${slotIdx}"]`);
  if (!old) return;
  const fresh = renderSlot(slot, floor, floorIdx, slotIdx, tier);
  old.replaceWith(fresh);
}

function updateLockedFloorButton() {
  const idx = state.floors.length + 1;
  const cost = floorCost(idx);
  const staffed = topFloorFullyStaffed();
  const btn = buildingEl.querySelector('.floor-locked button');
  if (btn) btn.disabled = !staffed || state.money < cost;
}

function buyFloor(idx, cost) {
  if (state.money < cost || !topFloorFullyStaffed()) return;
  state.money -= cost;
  state.floors.push({ slots: emptySlots() });
  renderAll();
  const msgs = [L.dlgNewFloor(idx)];
  if (idx === 11) msgs.push(L.dlgFloor11);
  if (idx === 21) msgs.push(L.dlgFloor21);
  if (idx === REBIRTH_REQUIRED_FLOOR) msgs.push(L.dlgFloorRebirth(REBIRTH_REQUIRED_FLOOR));
  msgs.forEach(queueDialogue);
  advanceDialogue();
  saveGame();
  updateIconButtons();
}

function renderLockedFloor(idx) {
  const cost = floorCost(idx);
  const staffed = topFloorFullyStaffed();
  const wrap = document.createElement('div');
  wrap.className = 'floor-locked';
  const smallText = staffed ? `${L.maxStars(floorTier(idx) + 1)} · ${L.newSlots(SLOTS_PER_FLOOR)}` : L.needFillFloor;
  wrap.innerHTML = `
    <div class="lock-info">🔒 ${L.floor(idx)}
      <small>${smallText}</small>
    </div>
    <button class="buy-btn" ${(!staffed || state.money < cost) ? 'disabled' : ''}>${cost.toLocaleString('tr-TR')} ₺</button>
  `;
  wrap.querySelector('button').addEventListener('click', () => buyFloor(idx, cost));
  return wrap;
}

/* ============================================================
   POPUP: İŞE ALMA / YÜKSELTME
   ============================================================ */
const popupOverlay = document.getElementById('popupOverlay');
const popupCard = document.getElementById('popupCard');
function closePopup() { popupOverlay.classList.remove('open'); }
popupOverlay.addEventListener('click', e => { if (e.target === popupOverlay) closePopup(); });

function openHirePopup(floorIdx, slotIdx) {
  const floor = state.floors[floorIdx - 1];
  const hiredCount = floor.slots.filter(s => s.hired).length;
  const cost = hireCost(floorIdx, hiredCount);
  const [min, max] = currentIncomeRange(0, 0);
  popupCard.innerHTML = `
    <h3>${L.hireTitle}</h3>
    <div class="sub">${L.hireSub(floorIdx, slotIdx + 1)}</div>
    <div class="popup-row"><span>${L.hireCostLabel}</span><span>${cost.toLocaleString('tr-TR')} ₺</span></div>
    <div class="popup-row"><span>${L.hireIncomeLabel}</span><span>${min}–${max} ₺</span></div>
    <button class="buy-btn" style="width:100%;margin-top:6px;" ${state.money < cost ? 'disabled' : ''}>${L.hireBtn}</button>
    <div class="popup-close" id="popupCloseBtn">${L.cancelBtn}</div>
  `;
  popupCard.querySelector('.buy-btn').addEventListener('click', () => {
    if (state.money < cost) return;
    state.money -= cost;
    const slot = floor.slots[slotIdx];
    slot.hired = true; slot.star = 0; slot.part = 0; slot.startedAt = Date.now(); slot.ready = false;
    closePopup(); renderAll();
    queueDialogue(L.dlgHired);
    advanceDialogue();
    saveGame();
  });
  popupCard.querySelector('#popupCloseBtn').addEventListener('click', closePopup);
  popupOverlay.classList.add('open');
}

function openUpgradePopup(floorIdx, slotIdx, tier) {
  const slot = state.floors[floorIdx - 1].slots[slotIdx];
  const [curMin, curMax] = currentIncomeRange(slot.star, slot.part);
  const atGlobalMax = slot.star >= STAR_INCOME.length - 1;
  const atFloorCap = slot.star >= tier;
  const canMinor = slot.part < MAX_PART;
  const canGraduate = slot.part === MAX_PART && !atGlobalMax && !atFloorCap;
  const fullyMaxed = atGlobalMax && slot.part === MAX_PART;

  let actionHtml = '';
  if (fullyMaxed) {
    actionHtml = `<div class="popup-row"><span>${currentLang === 'en' ? 'Status' : 'Durum'}</span><span>${L.maxLevel}</span></div>`;
  } else if (canMinor) {
    const cost = minorCost(slot.star, slot.part + 1, floorIdx);
    const [nMin, nMax] = currentIncomeRange(slot.star, slot.part + 1);
    actionHtml = `
      <div class="popup-row"><span>${L.nextPartIncome}</span><span>${nMin}–${nMax} ₺</span></div>
      <button class="buy-btn" style="width:100%;margin-top:6px;" ${state.money < cost ? 'disabled' : ''}>${L.upgradePartBtn(slot.part + 1, MAX_PART, cost.toLocaleString('tr-TR'))}</button>
    `;
  } else if (canGraduate) {
    const cost = gradCost(slot.star, floorIdx);
    const [nMin, nMax] = STAR_INCOME[slot.star + 1];
    actionHtml = `
      <div class="popup-row"><span>${L.nextStarIncome(slot.star + 2)}</span><span>${nMin}–${nMax} ₺</span></div>
      <button class="buy-btn" style="width:100%;margin-top:6px;" ${state.money < cost ? 'disabled' : ''}>${L.upgradeStarBtn(slot.star + 2, cost.toLocaleString('tr-TR'))}</button>
    `;
  } else if (atFloorCap) {
    actionHtml = `<div class="popup-row"><span>${currentLang === 'en' ? 'Status' : 'Durum'}</span><span>${L.floorLocked(slot.star + 2)}</span></div>`;
  }

  popupCard.innerHTML = `
    <h3>${STAR_ICON[slot.star]} ${L.artistInfoTitle}</h3>
    <div class="sub">${L.artistInfoSub(floorIdx, slotIdx + 1, slot.star + 1, slot.part, MAX_PART)}</div>
    <div class="popup-row"><span>${L.curIncomeLabel}</span><span>${curMin}–${curMax} ₺</span></div>
    <div class="popup-row"><span>${L.prodTimeLabel}</span><span>${neededProductionTime(slot.star).toFixed(1)} ${currentLang === 'en' ? 's' : 'sn'}</span></div>
    ${actionHtml}
    <div class="popup-close" id="popupCloseBtn">${L.closeBtn}</div>
  `;

  const actionBtn = popupCard.querySelector('.buy-btn');
  if (actionBtn) {
    actionBtn.addEventListener('click', () => {
      if (canMinor) {
        const cost = minorCost(slot.star, slot.part + 1, floorIdx);
        if (state.money < cost) return;
        state.money -= cost; slot.part += 1;
        closePopup(); renderAll();
        queueDialogue(L.dlgPartUp(slot.part, MAX_PART));
        advanceDialogue();
      } else if (canGraduate) {
        const cost = gradCost(slot.star, floorIdx);
        if (state.money < cost) return;
        state.money -= cost; slot.star += 1; slot.part = 0;
        closePopup(); renderAll();
        queueDialogue(L.dlgStarUp(slot.star + 1));
        advanceDialogue();
      }
      saveGame();
    });
  }
  popupCard.querySelector('#popupCloseBtn').addEventListener('click', closePopup);
  popupOverlay.classList.add('open');
}

/* ============================================================
   ÇARK
   ============================================================ */
let wheelCurrentRotation = 0;

function canSpinWheel() { return !state.lastSpinAt || (Date.now() - state.lastSpinAt) >= SPIN_COOLDOWN; }
function timeUntilNextSpin() {
  const rem = SPIN_COOLDOWN - (Date.now() - state.lastSpinAt);
  const h = Math.max(0, Math.floor(rem / 3600000)), m = Math.max(0, Math.floor((rem % 3600000) / 60000));
  return currentLang === 'en' ? `${h}h ${m}m` : `${h}s ${m}dk`;
}
function pickWeighted(list) {
  const total = list.reduce((s, r) => s + r.weight, 0);
  let roll = Math.random() * total;
  for (const r of list) { if (roll < r.weight) return r; roll -= r.weight; }
  return list[list.length - 1];
}

function buildWheelMarkup() {
  const n = WHEEL_REWARDS.length;
  const slice = 360 / n;
  const stops = WHEEL_REWARDS.map((r, i) => `${WHEEL_COLORS[i % WHEEL_COLORS.length]} ${i * slice}deg ${(i + 1) * slice}deg`);
  const gradient = `conic-gradient(${stops.join(',')})`;
  const labels = WHEEL_REWARDS.map((r, i) => {
    const angle = i * slice + slice / 2;
    return `<div class="wheel-label" style="transform:rotate(${angle}deg) translate(0,-78px) rotate(${-angle}deg)">${L.wheelIcons[r.type]}</div>`;
  }).join('');
  return { gradient, labels, slice };
}

function openWheelPopup() {
  const ready = canSpinWheel();
  const { gradient, labels, slice } = buildWheelMarkup();
  popupCard.innerHTML = `
    <h3>${L.wheelTitle}</h3>
    <div class="sub" id="wheelSub">${ready ? L.wheelReadySub : L.wheelWaitSub(timeUntilNextSpin())}</div>
    <div class="wheel-outer">
      <div class="wheel-pointer">▼</div>
      <div class="wheel-disc" id="wheelDisc" style="background:${gradient};transform:rotate(${wheelCurrentRotation}deg);">${labels}</div>
      <div class="wheel-hub"></div>
    </div>
    <button class="buy-btn" id="spinBtn" style="width:100%;margin-top:6px;" ${ready ? '' : 'disabled'}>${L.wheelSpinBtn}</button>
    <div class="popup-close" id="popupCloseBtn">${L.closeBtn}</div>
  `;
  const spinBtn = popupCard.querySelector('#spinBtn');
  if (spinBtn) {
    spinBtn.addEventListener('click', () => {
      spinBtn.disabled = true;
      spinWheelAnimation(slice, 4);
    });
  }
  popupCard.querySelector('#popupCloseBtn').addEventListener('click', closePopup);
  popupOverlay.classList.add('open');
}

function spinWheelAnimation(slice, retriesLeft) {
  const reward = pickWeighted(WHEEL_REWARDS);
  const idx = WHEEL_REWARDS.indexOf(reward);
  const targetCenter = idx * slice + slice / 2;
  const extraSpins = 5;
  const jitter = (Math.random() - 0.5) * (slice * 0.6);
  const finalRotation = wheelCurrentRotation + extraSpins * 360 + (360 - targetCenter) + jitter;
  wheelCurrentRotation = ((finalRotation % 360) + 360) % 360;

  const disc = document.getElementById('wheelDisc');
  disc.style.transition = 'transform 3.2s cubic-bezier(.14,.68,.15,1)';
  disc.style.transform = `rotate(${finalRotation}deg)`;

  setTimeout(() => {
    if (reward.type === 'tryAgain' && retriesLeft > 0) {
      const sub = popupCard.querySelector('#wheelSub');
      if (sub) sub.textContent = L.wheelRetryMsg;
      setTimeout(() => spinWheelAnimation(slice, retriesLeft - 1), 800);
      return;
    }
    state.lastSpinAt = Date.now();
    const finalType = (reward.type === 'tryAgain') ? 'lose' : reward.type;
    const msg = applyWheelReward(finalType);
    renderAll(); updateIconButtons(); saveGame();
    popupCard.innerHTML = `
      <h3>${L.wheelResultTitle}</h3>
      <div class="sub">${msg}</div>
      <div class="popup-close" id="popupCloseBtn">${L.closeBtn}</div>
    `;
    popupCard.querySelector('#popupCloseBtn').addEventListener('click', closePopup);
  }, 3300);
}

function applyWheelReward(type) {
  const topIdx = state.floors.length;
  const topFloor = state.floors[topIdx - 1];
  const tier = floorTier(topIdx);
  let msg = '';

  if (type === 'money') {
    const hiredSlots = topFloor.slots.filter(s => s.hired);
    let amt;
    if (hiredSlots.length > 0) {
      const slot = hiredSlots[Math.floor(Math.random() * hiredSlots.length)];
      const cost = nextUpgradeCostFor(slot, topIdx, tier);
      amt = cost ? Math.round(cost * 0.25) : 500;
    } else {
      amt = 300;
    }
    state.money += amt;
    msg = L.wheelMoneyMsg(amt.toLocaleString('tr-TR'));

  } else if (type === 'artist') {
    const emptySlot = topFloor.slots.find(s => !s.hired);
    if (emptySlot) {
      emptySlot.hired = true; emptySlot.star = 0; emptySlot.part = 0; emptySlot.startedAt = Date.now(); emptySlot.ready = false;
      msg = L.wheelArtistFreeMsg(topIdx);
    } else {
      const slot = topFloor.slots[Math.floor(Math.random() * topFloor.slots.length)];
      grantPartsBoost(slot, topIdx, tier, 2);
      msg = L.wheelArtistBoostMsg(topIdx);
    }

  } else if (type === 'speed5x2') {
    state.wheelSpeedBuffUntil = Date.now() + 5 * 60 * 1000;
    msg = L.wheelSpeedMsg;

  } else if (type === 'lose') {
    msg = L.wheelLoseMsg;
  }
  return msg;
}

/* ============================================================
   MARKET
   ============================================================ */
function openMarketPopup() {
  const rows = MARKET_ITEM_IDS.map(id => {
    const info = L.marketItems[id];
    let action;
    if (id === 'adBonus') {
      const active = adBuffActive();
      const remaining = adChargesRemaining();
      if (active) action = `<button class="buy-mini" disabled>${L.activeLabel}</button>`;
      else if (remaining <= 0) action = `<button class="buy-mini" disabled>${L.noneLabel}</button>`;
      else action = `<button class="buy-mini" id="watchAdRowBtn">${L.watchBtn}</button>`;
    } else {
      const st = state.market[id];
      action = st.owned
        ? `<div class="toggle ${st.on ? 'on' : ''}" data-id="${id}"><div class="knob"></div></div>`
        : `<button class="buy-mini" data-id="${id}">${L.buyBtn}</button>`;
    }
    return `
      <div class="market-item">
        <div class="market-item-icon">${MARKET_ICONS[id]}</div>
        <div class="market-item-info">
          <div class="market-item-title">${info.title}</div>
          <div class="market-item-desc">${info.desc}</div>
        </div>
        <div class="market-item-action">${action}</div>
      </div>`;
  }).join('');

  popupCard.innerHTML = `
    <h3>${L.marketTitle}</h3>
    <div class="sub">${L.marketSub}</div>
    ${rows}
    <div class="popup-close" id="popupCloseBtn">${L.closeBtn}</div>
  `;

  popupCard.querySelectorAll('.buy-mini[data-id]').forEach(btn => {
    btn.addEventListener('click', () => purchaseMarketItem(btn.dataset.id));
  });
  popupCard.querySelectorAll('.toggle').forEach(t => {
    t.addEventListener('click', () => toggleMarketItem(t.dataset.id));
  });

  const watchBtn = popupCard.querySelector('#watchAdRowBtn');
  if (watchBtn) {
    watchBtn.addEventListener('click', () => {
      watchBtn.disabled = true;
      watchBtn.textContent = L.watchingLabel;
      showRewardedAd(() => {
        state.adChargesUsed++;
        activateAdBuff();
      });
    });
  }

  popupCard.querySelector('#popupCloseBtn').addEventListener('click', closePopup);
  popupOverlay.classList.add('open');
}

function purchaseMarketItem(id) {
  nativePurchase('market_' + id, (success) => {
    if (!success) return;
    state.market[id].owned = true;
    state.market[id].on = true;
    saveGame();
    openMarketPopup();
    queueDialogue(L.marketPurchaseMsg[id]);
    advanceDialogue();
  });
}
function toggleMarketItem(id) {
  if (!marketOwned(id)) return;
  state.market[id].on = !state.market[id].on;
  saveGame();
  openMarketPopup();
  updateIconButtons();
}

function refreshAdWindow() {
  if (!state.adWindowStart || Date.now() - state.adWindowStart >= AD_WINDOW_MS) {
    state.adWindowStart = Date.now();
    state.adChargesUsed = 0;
  }
}
function adChargesRemaining() {
  refreshAdWindow();
  return Math.max(0, AD_CHARGES_MAX - state.adChargesUsed);
}
function adBuffActive() { return state.adBuffUntil && Date.now() < state.adBuffUntil; }

function activateAdBuff() {
  state.adBuffUntil = Date.now() + AD_BUFF_MS;
  state._adExpiryNotified = false;
  saveGame(); renderAll(); updateIconButtons(); updateAdBuffWidget();
  popupCard.innerHTML = `
    <h3>${L.adBonusActiveTitle}</h3>
    <div class="sub">${L.adBonusActiveMsg}</div>
    <div class="popup-close" id="popupCloseBtn">${L.closeBtn}</div>
  `;
  popupCard.querySelector('#popupCloseBtn').addEventListener('click', closePopup);
}

const adBuffWidget = document.getElementById('adBuffWidget');
const ringFg = document.getElementById('ringFg');
const ringTimer = document.getElementById('ringTimer');
const RING_CIRCUMFERENCE = 2 * Math.PI * 42;
ringFg.style.strokeDasharray = `${RING_CIRCUMFERENCE}`;

function updateAdBuffWidget() {
  const active = adBuffActive();
  if (!active) { adBuffWidget.style.display = 'none'; return; }
  adBuffWidget.style.display = 'block';
  const remaining = state.adBuffUntil - Date.now();
  const frac = Math.max(0, Math.min(1, remaining / AD_BUFF_MS));
  ringFg.style.strokeDashoffset = `${RING_CIRCUMFERENCE * (1 - frac)}`;
  const mm = Math.max(0, Math.floor(remaining / 60000));
  const ss = Math.max(0, Math.floor((remaining % 60000) / 1000));
  ringTimer.textContent = `${mm}:${ss.toString().padStart(2, '0')}`;
}

/* ============================================================
   REBIRTH
   ============================================================ */
function canRebirth() { return state.floors.length >= REBIRTH_REQUIRED_FLOOR; }
function openRebirthPopup() {
  const eligible = canRebirth();
  const currentPct = Math.round((rebirthBonusMultiplier(state.prestigeCount) - 1) * 100);
  const nextPct = Math.round((rebirthBonusMultiplier((state.prestigeCount || 0) + 1) - 1) * 100);
  popupCard.innerHTML = `
    <h3>${L.rebirthTitle}</h3>
    <div class="sub">${eligible ? L.rebirthEligibleSub : L.rebirthNotEligibleSub(REBIRTH_REQUIRED_FLOOR, state.floors.length)}</div>
    <div class="popup-row"><span>${L.rebirthCurBonus}</span><span>%${currentPct}</span></div>
    ${eligible ? `<div class="popup-row"><span>${L.rebirthNextBonus}</span><span>%${nextPct}</span></div>` : ''}
    <button class="buy-btn" id="rebirthBtnAction" style="width:100%;margin-top:6px;" ${eligible ? '' : 'disabled'}>${L.rebirthBtn}</button>
    <div class="popup-close" id="popupCloseBtn">${L.closeBtn}</div>
  `;
  const btn = popupCard.querySelector('#rebirthBtnAction');
  if (btn && eligible) btn.addEventListener('click', openRebirthConfirm);
  popupCard.querySelector('#popupCloseBtn').addEventListener('click', closePopup);
  popupOverlay.classList.add('open');
}
function openRebirthConfirm() {
  popupCard.innerHTML = `
    <h3>${L.rebirthConfirmTitle}</h3>
    <div class="sub">${L.rebirthConfirmSub}</div>
    <button class="buy-btn" id="rebirthFinalBtn" style="width:100%;margin-top:6px;background:linear-gradient(180deg,#ff7a6f,#e85c50);box-shadow:0 4px 0 #b8483e;">${L.rebirthConfirmBtn}</button>
    <div class="popup-close" id="popupCloseBtn">${L.cancelBtn}</div>
  `;
  popupCard.querySelector('#rebirthFinalBtn').addEventListener('click', () => { closePopup(); doRebirth(); });
  popupCard.querySelector('#popupCloseBtn').addEventListener('click', closePopup);
}
function doRebirth() {
  if (!canRebirth()) return;
  const keepMarket = state.market;
  const companyName = state.companyName;
  const newPrestige = (state.prestigeCount || 0) + 1;
  state = freshState();
  state.companyName = companyName;
  state.market = keepMarket;
  state.prestigeCount = newPrestige;
  saveGame(); renderAll(); updateIconButtons(); updateAdBuffWidget();
  const pct = Math.round((rebirthBonusMultiplier(newPrestige) - 1) * 100);
  queueDialogue(L.rebirthDoneMsg(pct));
  advanceDialogue();
}

/* ============================================================
   TOPBAR İKON BUTONLARI
   ============================================================ */
document.getElementById('wheelBtn').addEventListener('click', openWheelPopup);
document.getElementById('marketBtn').addEventListener('click', openMarketPopup);
document.getElementById('moneyBox').addEventListener('click', openMarketPopup);
document.getElementById('rebirthBtn').addEventListener('click', openRebirthPopup);

function updateIconButtons() {
  const wheelBtn = document.getElementById('wheelBtn');
  const marketBtn = document.getElementById('marketBtn');
  const rebirthBtn = document.getElementById('rebirthBtn');
  const ready = canSpinWheel();
  wheelBtn.innerHTML = '🎡' + (ready ? '<span class="dot"></span>' : '');
  const adReady = !adBuffActive() && adChargesRemaining() > 0;
  marketBtn.innerHTML = '🛒' + (adReady ? '<span class="dot"></span>' : '');
  const rebirthReady = canRebirth();
  rebirthBtn.innerHTML = '👑' + (rebirthReady ? '<span class="dot"></span>' : '');
  rebirthBtn.style.opacity = rebirthReady ? '1' : '.55';
}

/* ============================================================
   OTOMASYONLAR
   ============================================================ */
function autoCollectSlot(floorIdx, slotIdx) {
  const slot = state.floors[floorIdx - 1].slots[slotIdx];
  if (!slot.ready) return;
  const [min, max] = currentIncomeRange(slot.star, slot.part);
  const earned = Math.round(min + Math.random() * (max - min));
  state.money += earned;
  slot.ready = false;
  slot.startedAt = Date.now();
  refreshSlotDOM(floorIdx, slotIdx);
  refreshMoneyLabel();
  if (floorIsRendered(floorIdx)) {
    const el = buildingEl.querySelector(`.slot[data-floor="${floorIdx}"][data-slot="${slotIdx}"]`);
    if (el) {
      const rect = el.getBoundingClientRect();
      const fx = document.createElement('div');
      fx.className = 'float-money';
      fx.textContent = '+' + earned + ' ₺';
      fx.style.left = (rect.left + rect.width / 2 - 20) + 'px';
      fx.style.top = rect.top + 'px';
      document.body.appendChild(fx);
      setTimeout(() => fx.remove(), 1000);
    }
  }
  maybeMoneyMilestone();
}

function runAutoUpgradeStep() {
  for (let fi = 0; fi < state.floors.length; fi++) {
    const floor = state.floors[fi];
    const tier = floorTier(fi + 1);
    for (let si = 0; si < floor.slots.length; si++) {
      const slot = floor.slots[si];
      if (!slot.hired) continue;
      const cost = nextUpgradeCostFor(slot, fi + 1, tier);
      if (cost !== null && state.money >= cost) {
        state.money -= cost;
        if (slot.part < MAX_PART) slot.part += 1;
        else { slot.star += 1; slot.part = 0; }
        refreshSlotDOM(fi + 1, si);
        refreshMoneyLabel();
        return;
      }
    }
  }
}

/* ============================================================
   ÜRETİM DÖNGÜSÜ
   ============================================================ */
setInterval(() => {
  state.floors.forEach((floor, fi) => {
    floor.slots.forEach((slot, si) => {
      if (!slot.hired) return;

      if (!slot.ready) {
        const elapsed = (Date.now() - slot.startedAt) / 1000;
        if (elapsed >= neededProductionTime(slot.star)) {
          slot.ready = true;
          if (!marketOn('autoCollect')) refreshSlotDOM(fi + 1, si);
          saveGame();
        }
      }

      if (slot.ready && marketOn('autoCollect')) {
        autoCollectSlot(fi + 1, si);
        saveGame();
      }
    });
  });

  if (marketOn('autoUpgrade')) runAutoUpgradeStep();
  if (marketOn('autoRebirth') && canRebirth()) doRebirth();

  if (state.adBuffUntil && Date.now() >= state.adBuffUntil && !state._adExpiryNotified) {
    state._adExpiryNotified = true;
    queueDialogue(L.adExpiredMsg);
    advanceDialogue();
    saveGame();
  }

  updateIconButtons();
  updateAdBuffWidget();
  updateLockedFloorButton();
  updateProgressBarsOnly();
}, 300);

function updateProgressBarsOnly() {
  state.floors.forEach((floor, fi) => {
    floor.slots.forEach((slot, si) => {
      if (!slot.hired || slot.ready) return;
      const el = buildingEl.querySelector(`.slot[data-floor="${fi + 1}"][data-slot="${si}"]`);
      if (!el) return;
      const bar = el.querySelector('.prog-bar');
      if (bar) bar.style.width = (slotProgress(slot) * 100) + '%';
    });
  });
}

function collectSlot(floorIdx, slotIdx, evt) {
  const slot = state.floors[floorIdx - 1].slots[slotIdx];
  if (!slot.ready) return;
  const [min, max] = currentIncomeRange(slot.star, slot.part);
  const earned = Math.round(min + Math.random() * (max - min));
  state.money += earned;
  slot.ready = false;
  slot.startedAt = Date.now();
  spawnFloatMoney(evt, earned);
  renderAll();
  maybeMoneyMilestone();
  saveGame();
}
function spawnFloatMoney(evt, amount) {
  const rect = evt.currentTarget.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'float-money';
  el.textContent = '+' + amount + ' ₺';
  el.style.left = (rect.left + rect.width / 2 - 20) + 'px';
  el.style.top = (rect.top) + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}
function maybeMoneyMilestone() {
  const marks = [500, 1000, 5000, 10000, 50000, 100000, 500000, 1000000];
  marks.forEach(m => {
    if (state.money >= m && !state.milestonesSeen.includes(m)) {
      state.milestonesSeen.push(m);
      queueDialogue(L.dlgMilestone(m.toLocaleString('tr-TR')));
      advanceDialogue();
    }
  });
}

/* ============================================================
   SEKRETER
   ============================================================ */
const secretaryWrap = document.getElementById('secretaryWrap');
const bubbleTextEl = document.getElementById('bubbleText');
document.getElementById('bubbleSkip').addEventListener('click', () => {
  dialogueShown = false;
  advanceOrHide();
});
function queueDialogue(text) { dialogueQueue.push(text); }
function advanceDialogue() {
  if (dialogueShown) return;
  const next = dialogueQueue.shift();
  if (!next) return;
  bubbleTextEl.textContent = next;
  dialogueShown = true;
  secretaryWrap.classList.add('show');
}
function advanceOrHide() {
  const next = dialogueQueue.shift();
  if (!next) { secretaryWrap.classList.remove('show'); return; }
  bubbleTextEl.textContent = next;
  dialogueShown = true;
}

/* ============================================================
   KAYDI YÜKLE / OTOMATİK KAYDET
   ============================================================ */
function boot() {
  const loaded = loadGame();
  if (loaded && loaded.companyName) {
    state = loaded;
    if (!Array.isArray(state.milestonesSeen)) state.milestonesSeen = [];
    if (!Array.isArray(state.realPrizeCodes)) state.realPrizeCodes = [];
    if (typeof state.prestigeCount !== 'number') state.prestigeCount = 0;
    if (typeof state.adChargesUsed !== 'number') state.adChargesUsed = 0;
    if (typeof state.adWindowStart === 'undefined') state.adWindowStart = null;
    if (!state.market) {
      state.market = freshMarketState();
      if (state.doubleIncome === true) { state.market.doubleIncome.owned = true; state.market.doubleIncome.on = true; }
    }
    MARKET_ITEM_IDS.forEach(id => { if (!state.market[id]) state.market[id] = { owned: false, on: false }; });
    enterGame();
    queueDialogue(L.dlgBackAgain(state.companyName));
    advanceDialogue();
  }
}

document.addEventListener('visibilitychange', () => { if (document.hidden) saveGame(); });
window.addEventListener('pagehide', saveGame);
setInterval(saveGame, 20000);

/* Dil belirlendikten SONRA oyunu başlat (kayıtlı kayıt kontrolü dahil) */
initLanguage(boot);

/* ============================================================
   ARKAPLAN YILDIZLARI
   ============================================================ */
(function () {
  const field = document.getElementById('starsField');
  for (let i = 0; i < 40; i++) {
    const s = document.createElement('span');
    s.style.left = Math.random() * 100 + '%';
    s.style.top = Math.random() * 60 + '%';
    s.style.animationDelay = (Math.random() * 3) + 's';
    field.appendChild(s);
  }
})();