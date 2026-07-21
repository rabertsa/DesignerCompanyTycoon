/* ============================================================
   KİMLİK DOĞRULAMA: e-posta + tek kullanımlık kod (şifresiz)
   Bu dosya index.html'de config.js ve supabase-js CDN'inden
   SONRA, app.js'den ÖNCE yüklenmeli:

   Doğru kullanım (index.html <head> veya </body> öncesi):
   <script type="module">
     import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
     window.supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
     window.dispatchEvent(new Event('supabase-ready'));
   </script>
   <script src="config.js"></script>  <!-- modül importundan ÖNCE olmalı, en üstte -->
   <script src="auth.js"></script>
   <script src="app.js"></script>

   Not: config.js'nin SUPABASE_URL / SUPABASE_ANON_KEY tanımları
   modül scriptinden önce global scope'ta hazır olmalı.
   ============================================================ */

let supabaseUser = null;

function authScreenMarkup() {
  return `
    <div class="start-card" id="authCard">
      <div class="emoji">📧</div>
      <h1 id="authTitle">Giriş Yap</h1>
      <p id="authDesc">İlerlemenin kaybolmaması için e-posta adresini gir, sana bir kod gönderelim.</p>
      <input id="authEmailInput" type="email" placeholder="ornek@eposta.com" autocomplete="email">
      <button id="authSendBtn">Kod Gönder</button>
      <div id="authCodeWrap" style="display:none;margin-top:12px;">
        <input id="authCodeInput" maxlength="6" placeholder="6 haneli kod" inputmode="numeric" style="margin-top:12px;">
        <button id="authVerifyBtn">Onayla ve Gir</button>
        <div id="authResendBtn" style="margin-top:14px;color:var(--ink-soft);font-weight:700;font-size:13px;cursor:pointer;">Kodu tekrar gönder</div>
      </div>
      <div id="authError" style="color:#e85c50;font-size:12.5px;font-weight:700;margin-top:10px;display:none;"></div>
    </div>
  `;
}

function showAuthScreen(onAuthenticated) {
  const screen = document.getElementById('startScreen');
  screen.innerHTML = authScreenMarkup();
  screen.style.display = 'flex';

  const emailInput = document.getElementById('authEmailInput');
  const sendBtn = document.getElementById('authSendBtn');
  const codeWrap = document.getElementById('authCodeWrap');
  const codeInput = document.getElementById('authCodeInput');
  const verifyBtn = document.getElementById('authVerifyBtn');
  const resendBtn = document.getElementById('authResendBtn');
  const errorEl = document.getElementById('authError');

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.style.display = 'block';
  }

  async function sendCode() {
    const email = emailInput.value.trim();
    if (!email || !email.includes('@')) { showError('Geçerli bir e-posta gir.'); return; }
    errorEl.style.display = 'none';
    sendBtn.disabled = true;
    sendBtn.textContent = 'Gönderiliyor...';
    const { error } = await window.supabaseClient.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true }
    });
    sendBtn.disabled = false;
    sendBtn.textContent = 'Kod Gönder';
    if (error) { showError(error.message); return; }
    codeWrap.style.display = 'block';
  }

  async function verifyCode() {
    const email = emailInput.value.trim();
    const token = codeInput.value.trim();
    if (token.length < 6) { showError('6 haneli kodu tam gir.'); return; }
    errorEl.style.display = 'none';
    verifyBtn.disabled = true;
    verifyBtn.textContent = 'Kontrol ediliyor...';
    const { data, error } = await window.supabaseClient.auth.verifyOtp({ email, token, type: 'email' });
    verifyBtn.disabled = false;
    verifyBtn.textContent = 'Onayla ve Gir';
    if (error) { showError(error.message); return; }
    supabaseUser = data.user;
    onAuthenticated(supabaseUser);
  }

  sendBtn.addEventListener('click', sendCode);
  verifyBtn.addEventListener('click', verifyCode);
  resendBtn.addEventListener('click', sendCode);
  emailInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendCode(); });
  codeInput.addEventListener('keydown', e => { if (e.key === 'Enter') verifyCode(); });
}

/* Sayfa açılışında zaten oturum var mı kontrol et (token localStorage'da
   Supabase tarafından otomatik saklanır — bu kısım bizim XOR sistemimizden
   ayrı, Supabase kendi oturum yönetimini yapar). */
async function initAuth(onReady) {
  if (!window.supabaseClient) {
    console.error('Supabase client hazır değil — config.js ve modül scripti index.html\'de doğru sırada mı?');
    return;
  }
  const { data } = await window.supabaseClient.auth.getSession();
  if (data.session && data.session.user) {
    supabaseUser = data.session.user;
    onReady(supabaseUser);
  } else {
    showAuthScreen(onReady);
  }
}