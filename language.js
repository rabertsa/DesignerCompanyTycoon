/* ============================================================
   DİL SİSTEMİ / LANGUAGE SYSTEM
   ============================================================ */
const LANG_KEY = 'kuleOfisLang_v1';

const TRANSLATIONS = {
  tr: {
    selectLanguage: 'Dilini Seç:',
    turkish: 'Türkçe',
    english: 'English',

    startTitle: 'Stüdyonu Kur',
    startDesc: 'Kat kat bir çizim ajansı inşa edeceksin. Çizerlerini işe al, yıldızlarını yükselt, yeni katlar satın al!',
    namePlaceholder: 'Şirket adı yaz...',
    startBtn: 'Kuruluşu Başlat',
    studioSuffix: 'Çizim Stüdyosu',

    floor: n => `${n}. Kat`,
    maxStars: n => `Maks ${n}⭐`,
    needFillFloor: 'Önce mevcut kattaki 3 masayı doldur',
    newSlots: n => `${n} yeni masa`,

    hireTitle: '🎨 Yeni Çizer İşe Al',
    hireSub: (f, s) => `${f}. kat · masa ${s}`,
    hireCostLabel: 'İşe alma ücreti',
    hireIncomeLabel: 'Beklenen gelir / döngü',
    hireBtn: 'İşe Al',
    cancelBtn: 'Vazgeç',
    closeBtn: 'Kapat',

    artistInfoTitle: 'Çizer Bilgisi',
    artistInfoSub: (f, s, star, part, maxPart) => `${f}. kat · masa ${s} · şu an ${star}⭐ (parça ${part}/${maxPart})`,
    curIncomeLabel: 'Şu anki gelir',
    prodTimeLabel: 'Üretim süresi',
    maxLevel: 'Maksimum seviye 👑',
    nextPartIncome: 'Sonraki parça geliri',
    upgradePartBtn: (p, max, cost) => `Parça Yükselt (${p}/${max}) · ${cost} ₺`,
    nextStarIncome: star => `${star}⭐ geliri`,
    upgradeStarBtn: (star, cost) => `${star}⭐'a Yükselt · ${cost} ₺`,
    floorLocked: star => `Bu katta kilitli 🔒 (${star}⭐ için üst kat gerekli)`,

    wheelTitle: '🎡 Günlük Çark',
    wheelReadySub: 'Bugünkü hakkın hazır, çevir bakalım!',
    wheelWaitSub: t => `Sonraki çevirme: ${t}`,
    wheelSpinBtn: 'Çevir',
    wheelRetryMsg: '🔄 Tekrar Dene çıktı, şansın devam ediyor...',
    wheelResultTitle: '🎉 Çark Sonucu',
    wheelIcons: { artist: '🎨<br>Çizer', speed5x2: '⚡<br>5dk 2x', tryAgain: '🔄<br>Tekrar', lose: '😢<br>Boş', money: '💰<br>Para' },
    wheelMoneyMsg: amt => `Çark sana ${amt} ₺ verdi! 🎉`,
    wheelArtistFreeMsg: floorN => `Mevcut katındaki (${floorN}. kat) boş masaya ücretsiz bir çizer geldi! 🎨`,
    wheelArtistBoostMsg: floorN => `${floorN}. kat zaten doluydu, bir çizerin 2 parça birden ustalaştı! ✨`,
    wheelSpeedMsg: '5 dakika boyunca 2 kat daha hızlı üretim kazandın! ⚡',
    wheelLoseMsg: 'Bu sefer çark boş geldi, bir dahaki sefere daha şanslısın 😢',

    marketTitle: '🛒 Market',
    marketSub: 'Bir özelliği satın al, sonra istediğin an şalterle aç/kapat.',
    buyBtn: 'Satın Al',
    watchBtn: 'İzle',
    activeLabel: 'Aktif',
    noneLabel: 'Yok',
    watchingLabel: 'İzleniyor...',

    marketItems: {
      doubleIncome: { title: 'Süresiz 2x Kazanç', desc: 'Tüm gelirin kalıcı olarak 2 katına çıkar.' },
      autoCollect: { title: 'Auto Toplama', desc: 'Üretim bitince "Hazır!" tuşuna basmana gerek kalmadan para otomatik toplanır.' },
      adBonus: { title: 'Reklam Bonusu', desc: 'Reklam izleyip 15 dk boyunca 2x hız kazan (24 saatte 2 hak).' },
      autoRebirth: { title: 'Auto Rebirth', desc: 'Gereksinim (30. kat) karşılanınca rebirth otomatik yapılır.' },
      permSpeedX2: { title: 'Süresiz 2x Hız', desc: 'Kalıcı olarak 2 kat hız kazanırsın. Reklam bonusu ile üst üste biner (fesih olmaz).' },
      autoUpgrade: { title: 'Auto Upgrade', desc: 'Parası yeten ilk çizerin bir sonraki yükseltmesi otomatik yapılır.' }
    },
    marketPurchaseMsg: {
      doubleIncome: 'Süresiz 2x kazanç aktif! Artık tüm çizerlerin iki katı üretiyor 💎',
      autoCollect: 'Auto Toplama aktif! Artık hazır üretimler kendiliğinden toplanacak 🤖',
      autoRebirth: 'Auto Rebirth aktif! 30. kata ulaşınca rebirth otomatik yapılacak 🔁',
      permSpeedX2: 'Süresiz 2x hız aktif! Üretimlerin kalıcı olarak çok daha hızlı 🚀',
      autoUpgrade: 'Auto Upgrade aktif! Parası yeten çizerler kendiliğinden yükselecek ⬆️'
    },

    adWatchActive: 'Bonus şu an aktif — bitmeden yeni reklam izlenemez.',
    adWatchDepleted: (h, m) => `Bugünkü reklam hakların bitti. Yenilenmeye ${h}s ${m}dk kaldı.`,
    adWatchAvail: (r, max) => `Reklam izle, 15 dakika boyunca 2 kat üretim hızı kazan. Kalan hakkın: ${r}/${max} (24 saatte bir yenilenir)`,
    adBonusActiveTitle: '🚀 Bonus Aktif!',
    adBonusActiveMsg: '15 dakika boyunca 2 kat üretim hızı kazandın. Sağ altta geri sayımı görebilirsin.',
    adExpiredMsg: '2x hız bonusun sona erdi. 24 saatlik hakların yeterliyse Market\'ten tekrar izleyebilirsin 📺',

    rebirthTitle: '👑 Rebirth',
    rebirthEligibleSub: 'Her şeyi sıfırlamana karşılık kalıcı bir kazanç bonusu kazanırsın.',
    rebirthNotEligibleSub: (need, cur) => `Rebirth için ${need}. kata ulaşman gerekiyor (şu an ${cur}. kattasın).`,
    rebirthCurBonus: 'Şu anki kalıcı bonus',
    rebirthNextBonus: 'Rebirth sonrası bonus',
    rebirthBtn: 'Rebirth Yap',
    rebirthConfirmTitle: 'Emin misin?',
    rebirthConfirmSub: 'Tüm katların, çizerlerin ve paran sıfırlanacak. Kalıcı kazanç bonusun kalıcı olarak kalacak. Bu işlem geri alınamaz.',
    rebirthConfirmBtn: 'Evet, Rebirth Yap',
    rebirthDoneMsg: pct => `Rebirth tamamlandı! Artık kalıcı olarak %${pct} daha fazla kazanıyorsun 👑`,

    dlgWelcome1: name => `Hoş geldin patron! "${name}" resmen kuruldu 🎉 Haydi ilk çizerini işe alalım.`,
    dlgWelcome2: 'Boş kutucuklardan birine dokun, ilk çizerini işe al. Resim bitince "Hazır!" yazan kutuya dokunup parayı topla!',
    dlgBackAgain: name => `Tekrar hoş geldin! "${name}" seni bekliyordu 👋`,
    dlgHired: 'Yeni çizerin işbaşı yaptı! Resmi bitince "Hazır!" yazısı çıkacak, dokunup parayı toplayabilirsin 💰',
    dlgPartUp: (p, max) => `Çizerin biraz daha ustalaştı! (${p}/${max} parça) ✨`,
    dlgStarUp: star => `Harika! Çizerin artık ${star}⭐ oldu, çok daha değerli işler çıkaracak 🌟`,
    dlgNewFloor: n => `Yeni kat için tebrikler! Artık ${n}. kattayız 🏗️`,
    dlgFloor11: '11. kata ulaştın! Artık 5 yıldızlı çizerleri açabilirsin 🌟',
    dlgFloor21: '21. kat! Artık 6 yıldızlı efsane çizerler işe alınabilir 👑',
    dlgFloorRebirth: n => `${n}. kata ulaştın! Artık Rebirth yapıp kalıcı bonus kazanabilirsin 👑`,
    dlgMilestone: amt => `${amt} ₺'ye ulaştın! Stüdyon büyüyor 📈`,

    skip: 'Atla ▶'
  },

  en: {
    selectLanguage: 'Select Your Language:',
    turkish: 'Türkçe',
    english: 'English',

    startTitle: 'Set Up Your Studio',
    startDesc: "You'll build a floor-by-floor drawing agency. Hire artists, level up their stars, and buy new floors!",
    namePlaceholder: 'Type your company name...',
    startBtn: 'Launch Company',
    studioSuffix: 'Drawing Studio',

    floor: n => `Floor ${n}`,
    maxStars: n => `Max ${n}⭐`,
    needFillFloor: 'Fill all 3 desks on this floor first',
    newSlots: n => `${n} new desks`,

    hireTitle: '🎨 Hire New Artist',
    hireSub: (f, s) => `Floor ${f} · desk ${s}`,
    hireCostLabel: 'Hiring cost',
    hireIncomeLabel: 'Expected income / cycle',
    hireBtn: 'Hire',
    cancelBtn: 'Cancel',
    closeBtn: 'Close',

    artistInfoTitle: 'Artist Info',
    artistInfoSub: (f, s, star, part, maxPart) => `Floor ${f} · desk ${s} · currently ${star}⭐ (part ${part}/${maxPart})`,
    curIncomeLabel: 'Current income',
    prodTimeLabel: 'Production time',
    maxLevel: 'Max level 👑',
    nextPartIncome: 'Next part income',
    upgradePartBtn: (p, max, cost) => `Upgrade Part (${p}/${max}) · ${cost} ₺`,
    nextStarIncome: star => `${star}⭐ income`,
    upgradeStarBtn: (star, cost) => `Upgrade to ${star}⭐ · ${cost} ₺`,
    floorLocked: star => `Locked on this floor 🔒 (need a higher floor for ${star}⭐)`,

    wheelTitle: '🎡 Daily Wheel',
    wheelReadySub: "Today's spin is ready, let's go!",
    wheelWaitSub: t => `Next spin: ${t}`,
    wheelSpinBtn: 'Spin',
    wheelRetryMsg: '🔄 Try Again landed, your luck continues...',
    wheelResultTitle: '🎉 Wheel Result',
    wheelIcons: { artist: '🎨<br>Artist', speed5x2: '⚡<br>5min 2x', tryAgain: '🔄<br>Retry', lose: '😢<br>Empty', money: '💰<br>Money' },
    wheelMoneyMsg: amt => `The wheel gave you ${amt} ₺! 🎉`,
    wheelArtistFreeMsg: floorN => `A free artist joined the empty desk on your current floor (Floor ${floorN})! 🎨`,
    wheelArtistBoostMsg: floorN => `Floor ${floorN} was already full, so one artist mastered 2 parts at once! ✨`,
    wheelSpeedMsg: 'You got 2x production speed for 5 minutes! ⚡',
    wheelLoseMsg: 'The wheel came up empty this time, better luck next time 😢',

    marketTitle: '🛒 Market',
    marketSub: 'Buy a feature, then switch it on/off anytime.',
    buyBtn: 'Buy',
    watchBtn: 'Watch',
    activeLabel: 'Active',
    noneLabel: 'None',
    watchingLabel: 'Playing ad...',

    marketItems: {
      doubleIncome: { title: 'Permanent 2x Income', desc: 'All your income is permanently doubled.' },
      autoCollect: { title: 'Auto Collect', desc: 'Money is collected automatically when production finishes — no need to tap "Ready!".' },
      adBonus: { title: 'Ad Bonus', desc: 'Watch an ad for 15 min of 2x speed (2 charges per 24h).' },
      autoRebirth: { title: 'Auto Rebirth', desc: 'Rebirth happens automatically once the requirement (Floor 30) is met.' },
      permSpeedX2: { title: 'Permanent 2x Speed', desc: 'Permanently 2x faster. Stacks with the Ad Bonus (does not cancel it).' },
      autoUpgrade: { title: 'Auto Upgrade', desc: 'The first artist you can afford to upgrade is upgraded automatically.' }
    },
    marketPurchaseMsg: {
      doubleIncome: 'Permanent 2x income is active! All your artists now produce double 💎',
      autoCollect: 'Auto Collect is active! Finished productions will be collected automatically 🤖',
      autoRebirth: 'Auto Rebirth is active! Rebirth will trigger automatically at Floor 30 🔁',
      permSpeedX2: 'Permanent 2x speed is active! Your production is now much faster 🚀',
      autoUpgrade: 'Auto Upgrade is active! Affordable upgrades will happen automatically ⬆️'
    },

    adWatchActive: "Bonus is currently active — you can't watch another ad until it ends.",
    adWatchDepleted: (h, m) => `You're out of ad charges for today. Refills in ${h}h ${m}m.`,
    adWatchAvail: (r, max) => `Watch an ad for 15 minutes of 2x production speed. Charges left: ${r}/${max} (refills every 24h)`,
    adBonusActiveTitle: '🚀 Bonus Active!',
    adBonusActiveMsg: 'You got 2x production speed for 15 minutes. You can see the countdown in the bottom right.',
    adExpiredMsg: 'Your 2x speed bonus has ended. Watch again from the Market if you still have charges left 📺',

    rebirthTitle: '👑 Rebirth',
    rebirthEligibleSub: "You'll reset everything in exchange for a permanent income bonus.",
    rebirthNotEligibleSub: (need, cur) => `You need to reach floor ${need} to rebirth (you're currently on floor ${cur}).`,
    rebirthCurBonus: 'Current permanent bonus',
    rebirthNextBonus: 'Bonus after rebirth',
    rebirthBtn: 'Rebirth',
    rebirthConfirmTitle: 'Are you sure?',
    rebirthConfirmSub: 'All your floors, artists, and money will be reset. Your permanent income bonus stays. This cannot be undone.',
    rebirthConfirmBtn: 'Yes, Rebirth',
    rebirthDoneMsg: pct => `Rebirth complete! You now permanently earn %${pct} more 👑`,

    dlgWelcome1: name => `Welcome, boss! "${name}" is officially founded 🎉 Let's hire your first artist.`,
    dlgWelcome2: 'Tap an empty desk to hire your first artist. Once the drawing is done, tap the "Ready!" box to collect the cash!',
    dlgBackAgain: name => `Welcome back! "${name}" was waiting for you 👋`,
    dlgHired: 'Your new artist got to work! Once the drawing is ready, tap the "Ready!" box to collect the money 💰',
    dlgPartUp: (p, max) => `Your artist got a bit more skilled! (${p}/${max} parts) ✨`,
    dlgStarUp: star => `Great! Your artist is now ${star}⭐, they'll produce much more valuable work 🌟`,
    dlgNewFloor: n => `Congrats on the new floor! You're now on floor ${n} 🏗️`,
    dlgFloor11: 'You reached floor 11! You can now unlock 5-star artists 🌟',
    dlgFloor21: 'Floor 21! Legendary 6-star artists can now be hired 👑',
    dlgFloorRebirth: n => `You reached floor ${n}! You can now Rebirth for a permanent bonus 👑`,
    dlgMilestone: amt => `You reached ${amt} ₺! Your studio is growing 📈`,

    skip: 'Skip ▶'
  }
};

function detectDeviceLanguage() {
  const langs = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language || ''];
  for (const l of langs) {
    const code = (l || '').toLowerCase();
    if (code.startsWith('tr')) return 'tr';
    if (code.startsWith('en')) return 'en';
  }
  return null; // ne TR ne EN net olarak algılanamadı
}

let currentLang = 'tr';
let L = TRANSLATIONS.tr;

function applyStaticTexts() {
  const titleEl = document.getElementById('startTitleText');
  const descEl = document.getElementById('startDescText');
  const nameEl = document.getElementById('nameInput');
  const startBtnEl = document.getElementById('startBtn');
  const skipEl = document.getElementById('bubbleSkip');
  if (titleEl) titleEl.textContent = L.startTitle;
  if (descEl) descEl.textContent = L.startDesc;
  if (nameEl) nameEl.placeholder = L.namePlaceholder;
  if (startBtnEl) startBtnEl.textContent = L.startBtn;
  if (skipEl) skipEl.textContent = L.skip;
  document.documentElement.lang = currentLang;
}

function setLanguage(lang) {
  currentLang = (lang === 'en') ? 'en' : 'tr';
  L = TRANSLATIONS[currentLang];
  try { localStorage.setItem(LANG_KEY, currentLang); } catch (e) {}
  applyStaticTexts();
}

function showLanguageScreen(onChosen) {
  const screen = document.getElementById('languageScreen');
  const labelEl = document.getElementById('langSelectLabel');
  if (labelEl) labelEl.textContent = 'Select Your Language: / Dilini Seç:';
  screen.style.display = 'flex';
  const finish = (lang) => {
    setLanguage(lang);
    screen.style.display = 'none';
    onChosen();
  };
  document.getElementById('langTrBtn').addEventListener('click', () => finish('tr'));
  document.getElementById('langEnBtn').addEventListener('click', () => finish('en'));
}

function initLanguage(onReady) {
  let saved = null;
  try { saved = localStorage.getItem(LANG_KEY); } catch (e) {}
  if (saved === 'tr' || saved === 'en') {
    setLanguage(saved);
    onReady();
    return;
  }
  const detected = detectDeviceLanguage();
  if (detected) {
    setLanguage(detected);
    onReady();
  } else {
    setLanguage('tr'); // seçim ekranı görünene kadar geçici varsayılan
    showLanguageScreen(onReady);
  }
}