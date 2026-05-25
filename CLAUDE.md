# CLAUDE.md — Sparkling Cleaners System Knowledge Base

## Stack & Architecture
- Backend: Node.js + Express, MySQL via mysql2/promise pool
- Frontend: Vanilla JS, CSS Glassmorphism, no framework
- Server entry: server.js (port 3000)
- DB wrapper: js/db.js (semua fetch ke API lewat object DB → window.DB)
- Static root: satu level di atas server.js

## File Map
- index.html + js/beranda.js       → Beranda (about, galeri, testimoni slider)
- layanan.html + js/layanan.js     → Katalog, cart drawer, checkout, GPS ongkir
- lacak.html + js/lacak.js         → Order tracking 7-step stepper
- dashboard.html + js/dashboard.js → Internal ops (owner + admin role)
- login.html                       → Auth portal (fetch /api/login)
- js/db.js                         → API wrapper global (window.DB)
- server.js                        → Express REST API + MySQL pool + auto-migration

## Database Tables
- konfigurasi_sistem (nama_kunci PK, teks_nilai TEXT)
  → semua config site + JSON blob untuk: stok bahan, galeri instagram, riwayat restok
- layanan (id, nama_layanan, kategori, tipe_treatment, harga, estimasi_waktu, deskripsi, foto_utama, foto_tambahan, id_kategori)
- pesanan (id, nama_pelanggan, nomor_whatsapp, total_harga, status_proses 1-9, status_pembayaran 0/1, tipe_item, jumlah, layanan_pilihan, express, pengiriman, alamat, jarak, jadwal, catatan, harga_dasar, harga_express, ongkir, foto_barang)
- testimoni (id, nama_pelanggan, skor_rating, teks_ulasan, status_moderasi ['tertunda'|'disetujui'], foto_bukti TEXT, tanggal_dibuat)
- tabel_repaint_warna (id, kode_warna, nama_warna, hex_warna_fallback, tipe_treatment ['Kode P'|'Kode S'|'Suede'])
- kategori_layanan (id, nama_kategori, foto_kategori, urutan, aktif, dibuat_pada)
- additional_service (id, nama, harga, deskripsi, aktif)
- layanan_additional (id_layanan, id_additional)

## API Endpoints
- GET/PUT /api/konfigurasi-sistem (alias /api/system-config)
- GET /api/config → compat layer, expose workshop_dropoff_allowed as boolean
- GET/POST/PUT/DELETE /api/layanan (alias /api/services)
- GET /api/layanan/kategori/:idKategori
- GET/POST/PUT/DELETE /api/kategori-layanan
- GET/POST/PUT/DELETE /api/additional-service
- POST /api/layanan/:id/additional
- GET/POST/PUT/DELETE /api/pesanan (alias /api/orders)
- PUT /api/pesanan/:id/status_proses → update status 1-9, auto lunas jika status=9, WhatsApp trigger jika status=7
- PUT /api/pesanan/:id/status_pembayaran → update lunas 0/1
- GET/POST/PUT/DELETE /api/testimoni (alias /api/testimonials)
- GET/POST/PUT/DELETE /api/galeri → stored as JSON in konfigurasi_sistem key 'instagram_gallery_images'
- GET/POST/PUT/DELETE /api/inventory → stored as JSON in konfigurasi_sistem key 'data_stok_bahan'
- GET/POST/PUT /api/restock → stored as JSON in konfigurasi_sistem key 'riwayat_restok_gudang'
- GET /api/ringkasan → KPI agregasi dari tabel pesanan + stok (FITUR BARU)
- GET /api/warna-repaint (alias /api/colors)
- POST /api/upload → multer, max 10 files, simpan ke /uploads/ folder
- POST /api/login → cek owner/admin credentials dari konfigurasi_sistem
- GET /api/users, PUT /api/users/:id
- GET /api/finance → pesanan WHERE status_proses=9
- GET/POST/PUT/DELETE /api/about → compat layer dari konfigurasi_sistem
- GET /api/riwayat-customer → cari riwayat transaksi 1 tahun terakhir by query ?q=...
- POST /api/pesanan-manual → alias untuk post manual order oleh kasir

## Role System
- owner: akses semua tab dashboard (ringkasan, pesanan, order baru, membership, restok, stok, keuangan, katalog, testimoni, galeri, pengaturan)
- admin: akses tab pesanan, order baru, membership, restok, stok
- Role disimpan di localStorage key 'role'
- Backend validasi via header X-User-Role: owner (middleware validateOwner)
- Tab khusus owner: tab-revenue, tab-catalog, tab-testimonials, tab-galeri, tab-settings, tab-kategori-layanan, tab-additional-service

## Cart System (layanan.js)
- Disimpan di localStorage key 'cart'
- Structure: [{id, name, price, qty, image, additional_images, size, size_label}]
- size dan size_label ditambahkan saat user pilih ukuran di modal detail layanan
- window.cart, window.saveCart(), window.updateCartUI(), window.toggleCartDrawer()

## Service Grouping Logic (FITUR BARU di layanan.js)
- Layanan dengan suffix ' (Small)'/' (Medium)'/' (Large)'/' (Half Face)'/' (Full Face)' di-group jadi 1 card
- Group key: nama tanpa suffix → contoh "Shoes Deep Clean"
- Tiap group punya variants: [{size, serviceId, price, estimation}]
- isRepaint: true jika id mengandung prefix 'rp-'
- Additional service: tidak ada varian ukuran dan bukan repaint → single variant, size: null

## Photo Display (FITUR BARU)
- Foto layanan TIDAK dipaksa aspect ratio — mengikuti proporsi asli foto upload
- Container: object-fit: contain, height: auto, max-height: 400px, background: #f8fafc
- Grid align-items: start (bukan stretch) agar card tidak dipaksa tinggi sama
- Dashboard preview foto juga max-width: 100%; height: auto

## Mobile-First (FITUR BARU)
- Breakpoints: ≤1024px tablet, ≤768px mobile, ≤480px small mobile
- Customer pages: hamburger menu di navbar, nav-links hidden di mobile
- Dashboard: sidebar collapse ke bottom fixed navigation bar di ≤768px
- Min tap target: 44x44px semua tombol interaktif

## Lighthouse & Publication (FITUR BARU)
- Target score ≥90 semua kategori (Performance, Accessibility, Best Practices, SEO)
- Semua img: alt deskriptif + loading="lazy" (kecuali hero)
- Semua button icon-only: aria-label
- preconnect hint ke cdnjs.cloudflare.com di semua head
- manifest.json, robots.txt, sitemap.xml, LICENSE (MIT) ada di root
- Open Graph meta tags di semua halaman

## Konfigurasi Default Sistem
- whatsapp_admin_number: '6285965957290'
- instagram_url: 'https://instagram.com/sparklingcleaners_mlg'
- business_address: 'Jl. Jamuran Rt.06 Rw. 02 Dusun Jamoran, Desa Sukodadi, Kecamatan Wagir, Kabupaten Malang'
- hero_welcome_title, hero_welcome_subtitle, hero_font_color
- hero_slideshow_images: JSON array URL
- instagram_gallery_images: JSON array {id, path_gambar, link_instagram}
- about_motto, about_semantics, about_vision, about_mission, about_image
- owner_username/password, admin_username/password
- workshop_dropoff_allowed: 'true'/'false'
- data_stok_bahan: JSON array {id, name, category, unit, price, stock, min_stock}
- riwayat_restok_gudang: JSON array {id, itemId, qty, notes, role, status, date}
- rekening_bca, rekening_blu: info rekening pembayaran toko
- nama_kasir_default: nama kasir bawaan penginput manual order

## Ongkir Logic
- 0-10 KM: gratis
- >10 KM: +Rp 2.000 per KM kelebihan
- GPS pakai Haversine × 1.3 faktor jalan, titik acuan shopLat=-8.0261, shopLon=112.5855

## Status Pesanan (v5)
1. Penjemputan, 2. Antrian Workshop, 3. Proses Treatment,
4. Pengeringan, 5. Detailing & Finishing, 6. Packaging,
7. Menunggu Pembayaran (auto WA receipt), 8. Pengantaran,
9. Selesai (auto lunas)

## Member Card Benefits (v5)
- None: No benefit.
- Diskon 15%: 15% discount for 4 shoe items (regular size medium).
- Birthday Treat: Custom manual % discount input.

## Express Pricing
- "8 Jam": Rp 20.000/item, "18 Jam": Rp 15.000/item, "24 Jam": Rp 10.000/item

## Refactoring & Bug Fixes (v5.1)
- **Relative API Path:** Changed `API_BASE` in `db.js` to `/api` and upload URL fetches in `layanan.js`, `landing.js`, and `beranda.js` to `/api/upload` to resolve CORS, host mismatches, and Private Network Access blocks.
- **Div Reset Bug:** Replaced the crashing `.reset()` call on the `serviceForm` div element in `dashboard.js` with manual resets to prevent modal load failure.
- **CMS Web Builder Rework:** Reworked `saveAllSettings` and `renderPengaturanWeb` in `dashboard.js` to map configurations explicitly by key to HTML inputs, including subtitle color.
- **CRUD Validation:** Added response status check (`!resp.ok`) and error alerts on all save/edit operations (`saveServiceItem`, `saveGaleri`, `saveAllSettings`, `saveKategori`, `saveAdditional`).

## Refactoring & Bug Fixes (v5.2)
- **Repaint Colors Mapping Fix:** Added dual-fallback `hex_color_fallback: r.hex_color_fallback || r.hex_warna_fallback` in `server.js` mapper to fix empty repaint color preview cards on customer pages.
- **Layanan Catalog Grid DOM Fix:** Replaced legacy `#services-grid` under `#katalog` section in `layanan.html` with `#section-kategori` and `#section-layanan-detail` to align with new categories system.
- **Removed Duplicate DB.js Declarations:** Removed second block of `getGaleri`/`addGaleri`/`deleteGaleri` declarations in `js/db.js` that mapped to system config JSON instead of REST endpoints.
- **Dashboard Robustness:** Added null checks to all KPI widgets in `rendorRingkasanKinerja()` to prevent crash if elements (e.g. `kpi-stock`) are missing. Added config fallback object in `cetakNotaManual()` to prevent page freezing.
- **Subtitle Color Mismatch Fix:** Synchronized `hero_font_subtitle_color` key name usage inside `js/beranda.js` to fix hero text style binding.
