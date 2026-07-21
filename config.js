/* ============================================================
   SUPABASE YAPILANDIRMASI
   Bu değerleri kendi Supabase projenden alıp buraya yapıştır:
   Supabase Dashboard > Project Settings > API
   - Project URL          -> SUPABASE_URL
   - anon / public key    -> SUPABASE_ANON_KEY

   NOT: anon key GİZLİ DEĞİLDİR — istemci tarafında (tarayıcıda,
   APK içinde) görünmesi normaldir ve tasarım gereğidir. Gerçek
   güvenlik, veritabanındaki RLS (Row Level Security) politikaları
   ile sağlanır (bkz. schema.sql). .env dosyası burada işe yaramaz
   çünkü bir build/bundler aracı kullanmıyoruz (saf HTML/JS).
   ============================================================ */
const SUPABASE_URL = 'https://jzvhiajxdrlhzzbyabxi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6dmhpYWp4ZHJsaHp6YnlhYnhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NjQwNzEsImV4cCI6MjEwMDE0MDA3MX0.y6H_7yuWDBRGOPt85fjGzGHd6XxSifq39TdBMnrsQ3I';