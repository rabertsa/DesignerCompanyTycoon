/* ============================================================
   BULUT SENKRONİZASYONU (Supabase)

   ÖNEMLİ TASARIM NOTU:
   Her 300ms'lik oyun tick'inde tüm katları/çizerleri Supabase'e
   yazmaya çalışmak (100+ kat varsa) veritabanını gereksiz yere
   boğar ve gecikme yaratır. Bu yüzden burada şu stratejiyi
   izliyoruz:
     - "para" satırı (bakiye, prestij, bonus zamanlayıcıları):
       periyodik olarak (20 saniyede bir + sekme kapanırken) TEK
       satır upsert edilir — ucuz.
     - "katlar": sadece YENİ bir kat satın alındığında bir satır
       eklenir (nadir olay).
     - "cizerler": sadece bir çizer işe alındığında / yükseltildiğinde
       O TEK satır upsert edilir (kullanıcı etkileşimiyle sınırlı,
       tick başına değil).
   Bu fonksiyonlar birer yapı taşı — app.js'teki ilgili yerlere
   (aşağıdaki entegrasyon notlarında belirtilen) birer çağrı
   eklemen gerekiyor. Kendi Supabase projene karşı test etmeden
   üretime almanı önermem.
   ============================================================ */

async function fetchOrCreatePara(userId, defaults) {
  const client = window.supabaseClient;
  let { data, error } = await client.from('para').select('*').eq('user_id', userId).maybeSingle();
  if (error) { console.error('para okunamadı:', error); return null; }
  if (!data) {
    const insertRow = {
      user_id: userId,
      sirket_adi: defaults.companyName || '',
      bakiye: defaults.money,
      prestij_sayisi: defaults.prestigeCount || 0
    };
    const { data: created, error: insErr } = await client.from('para').insert(insertRow).select().single();
    if (insErr) { console.error('para oluşturulamadı:', insErr); return null; }
    data = created;
  }
  return data;
}

async function upsertPara(userId, state) {
  const client = window.supabaseClient;
  const row = {
    user_id: userId,
    sirket_adi: state.companyName,
    bakiye: state.money,
    prestij_sayisi: state.prestigeCount || 0,
    reklam_bonus_bitis: state.adBuffUntil ? new Date(state.adBuffUntil).toISOString() : null,
    reklam_pencere_baslangic: state.adWindowStart ? new Date(state.adWindowStart).toISOString() : null,
    reklam_hak_kullanilan: state.adChargesUsed || 0,
    cark_hiz_bonus_bitis: state.wheelSpeedBuffUntil ? new Date(state.wheelSpeedBuffUntil).toISOString() : null,
    son_cark_zamani: state.lastSpinAt ? new Date(state.lastSpinAt).toISOString() : null,
    guncellendi: new Date().toISOString()
  };
  const { error } = await client.from('para').upsert(row, { onConflict: 'user_id' });
  if (error) console.error('para kaydedilemedi:', error);
}

async function insertKat(userId, katNo) {
  const client = window.supabaseClient;
  const { data, error } = await client.from('katlar')
    .insert({ user_id: userId, kat_no: katNo })
    .select('kat_id').single();
  if (error) { console.error('kat eklenemedi:', error); return null; }
  // yeni katın 3 boş masasını da oluştur
  const rows = [0, 1, 2].map(m => ({ kat_id: data.kat_id, masa_no: m }));
  const { error: cErr } = await client.from('cizerler').insert(rows);
  if (cErr) console.error('masalar oluşturulamadı:', cErr);
  return data.kat_id;
}

async function upsertCizer(katId, masaNo, slot) {
  const client = window.supabaseClient;
  const row = {
    kat_id: katId,
    masa_no: masaNo,
    dolu: slot.hired,
    yildiz: slot.star,
    parca: slot.part,
    baslangic_zamani: slot.startedAt ? new Date(slot.startedAt).toISOString() : null,
    hazir: slot.ready
  };
  const { error } = await client.from('cizerler').upsert(row, { onConflict: 'kat_id,masa_no' });
  if (error) console.error('çizer kaydedilemedi:', error);
}

async function upsertVipOzellik(userId, ozellikKodu, { sahip, acik }) {
  const client = window.supabaseClient;
  const row = { user_id: userId, ozellik_kodu: ozellikKodu, sahip, acik };
  const { error } = await client.from('vipozellikler').upsert(row, { onConflict: 'user_id,ozellik_kodu' });
  if (error) console.error('vip özellik kaydedilemedi:', error);
}

/* Tam durumu (para + tüm katlar + tüm çizerler + tüm vip özellikler)
   veritabanından çekip app.js'in `state` şekline dönüştürür. */
async function loadCloudState(userId, defaults) {
  const client = window.supabaseClient;

  const para = await fetchOrCreatePara(userId, defaults);
  if (!para) return null;

  const { data: katRows, error: katErr } = await client
    .from('katlar').select('kat_id, kat_no').eq('user_id', userId).order('kat_no', { ascending: true });
  if (katErr) { console.error('katlar okunamadı:', katErr); return null; }

  let floors;
  if (!katRows || katRows.length === 0) {
    const firstKatId = await insertKat(userId, 1);
    floors = [{ slots: [0, 1, 2].map(() => ({ hired: false, star: 0, part: 0, startedAt: 0, ready: false })) }];
    floors[0]._katId = firstKatId;
  } else {
    const katIds = katRows.map(k => k.kat_id);
    const { data: cizerRows, error: cizerErr } = await client
      .from('cizerler').select('*').in('kat_id', katIds);
    if (cizerErr) { console.error('çizerler okunamadı:', cizerErr); return null; }

    floors = katRows.map(k => {
      const mySlots = cizerRows.filter(c => c.kat_id === k.kat_id).sort((a, b) => a.masa_no - b.masa_no);
      const slots = [0, 1, 2].map(m => {
        const row = mySlots.find(c => c.masa_no === m);
        return row ? {
          hired: row.dolu, star: row.yildiz, part: row.parca,
          startedAt: row.baslangic_zamani ? new Date(row.baslangic_zamani).getTime() : 0,
          ready: row.hazir
        } : { hired: false, star: 0, part: 0, startedAt: 0, ready: false };
      });
      return { slots, _katId: k.kat_id };
    });
  }

  const { data: vipRows, error: vipErr } = await client
    .from('vipozellikler').select('*').eq('user_id', userId);
  if (vipErr) console.error('vip özellikler okunamadı:', vipErr);

  const market = {};
  MARKET_ITEM_IDS.forEach(id => { market[id] = { owned: false, on: false }; });
  market.adBonus.owned = true; market.adBonus.on = true;
  (vipRows || []).forEach(v => { market[v.ozellik_kodu] = { owned: v.sahip, on: v.acik }; });

  return {
    companyName: para.sirket_adi,
    money: Number(para.bakiye),
    floors,
    milestonesSeen: [],
    market,
    adBuffUntil: para.reklam_bonus_bitis ? new Date(para.reklam_bonus_bitis).getTime() : null,
    adWindowStart: para.reklam_pencere_baslangic ? new Date(para.reklam_pencere_baslangic).getTime() : null,
    adChargesUsed: para.reklam_hak_kullanilan || 0,
    wheelSpeedBuffUntil: para.cark_hiz_bonus_bitis ? new Date(para.cark_hiz_bonus_bitis).getTime() : null,
    lastSpinAt: para.son_cark_zamani ? new Date(para.son_cark_zamani).getTime() : null,
    realPrizeCodes: [],
    prestigeCount: para.prestij_sayisi || 0
  };
}
