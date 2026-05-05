# ✨ Sparkling Cleaners Malang

> Sistem Manajemen Bisnis & Landing Page untuk layanan cuci premium sepatu, tas, dan helm berbasis di Wagir, Malang.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

---

## 📋 Deskripsi

**Sparkling Cleaners** adalah aplikasi web all-in-one yang menggabungkan:

- **Landing Page** publik untuk pelanggan (booking, pricelist, artikel edukasi)
- **Dashboard Internal** dengan sistem Role-Based Access Control (RBAC) untuk Admin dan Owner
- **Backend simulasi** menggunakan `localStorage` sebagai database lokal

Dibangun sepenuhnya dengan **Vanilla HTML, CSS, dan JavaScript** tanpa framework — ringan, cepat, dan mudah di-deploy.

---

## 🎨 Design Language

- **Glassmorphism** — Panel transparan dengan efek blur dan border halus
- **Responsive** — Menyesuaikan ukuran layar dari mobile hingga desktop
- **Modern Typography** — Google Fonts (Inter)
- **Micro-animations** — Transisi halus pada hover, tab switching, dan status badge

---

## 🗂️ Struktur Proyek

```
sparklingcleanersmalang/
├── index.html          # Landing page publik (utama)
├── login.html          # Halaman login dashboard
├── dashboard.html      # Dashboard internal Admin/Owner
├── README.md
│
├── assets/
│   └── logo.png        # Logo Sparkling Cleaners
│
├── js/
│   ├── db.js           # Database layer (localStorage CRUD + business logic)
│   ├── landing.js      # Logic landing page (booking, GPS, pricing, artikel)
│   └── dashboard.js    # Logic dashboard (orders, inventory, restock, settings)
│
└── styles/
    ├── main.css         # Design system utama (variabel, komponen, tabel harga)
    └── dashboard.css    # Styling khusus layout dashboard
```

---

## 🚀 Cara Menjalankan

### Prasyarat
- Browser modern (Chrome, Firefox, Edge)
- [Node.js](https://nodejs.org/) terinstal (untuk HTTP server)

### Langkah

```bash
# 1. Clone repository
git clone https://github.com/Theology26/sparklingcleanersmalang.git
cd sparklingcleanersmalang

# 2. Jalankan local server
npx -y http-server . -p 8080 -o
```

> **Catatan:** Jika PowerShell menolak menjalankan `npx`, jalankan perintah berikut terlebih dahulu:
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
> ```

Buka browser dan akses: **http://127.0.0.1:8080**

---

## 🔑 Akun Login Dashboard

| Role    | Email                  | Password    |
|---------|------------------------|-------------|
| Admin   | `admin@sparkling.com`  | `admin123`  |
| Owner   | `owner@sparkling.com`  | `owner123`  |

---

## ✅ Fitur Utama

### 🏠 Landing Page (Pelanggan)

| Fitur | Deskripsi |
|-------|-----------|
| **Hero Section** | Teks dinamis (dapat diubah Owner dari dashboard) |
| **Layanan Kami** | Grid kartu layanan: Sepatu, Tas, Helm |
| **Daftar Harga** | Tabel harga lengkap Regular Wash & Special Treatment |
| **Testimoni** | Kartu testimoni pelanggan + modal tulis ulasan |
| **Artikel Edukasi** | Kartu artikel dinamis dari database |
| **Form Booking** | Formulir order lengkap dengan kalkulasi harga otomatis |
| **GPS Distance** | Deteksi lokasi otomatis via Geolocation API + Haversine formula |
| **WhatsApp E-Nota** | Kirim nota otomatis ke WhatsApp setelah booking |
| **Lacak Pesanan** | Cek status pesanan dengan kode order |
| **Google Maps** | Link exact location workshop di footer |

### 📊 Dashboard Admin

| Fitur | Deskripsi |
|-------|-----------|
| **Manajemen Pesanan** | Lihat, update status (SOP 5 tahap), upload foto before/after |
| **Input Order Baru** | Form input pesanan manual dari dashboard |
| **Permintaan Restok** | Ajukan request bahan/alat ke Owner |

### 👑 Dashboard Owner

| Fitur | Deskripsi |
|-------|-----------|
| **Semua fitur Admin** | + akses penuh ke modul berikut |
| **Laporan Keuangan** | Ringkasan pendapatan, jumlah order, rata-rata transaksi |
| **Manajemen Stok** | Inventaris bahan + approval/reject permintaan restok Admin |
| **Manajemen Katalog** | CRUD layanan dan harga |
| **Kurasi Testimoni** | Moderasi ulasan pelanggan |
| **Editor Artikel** | Tulis & publish artikel edukasi dengan upload foto |
| **Pengaturan Web & Harga** | Edit teks landing page + harga dasar layanan secara live |

---

## 💾 Arsitektur Data

Semua data disimpan di `localStorage` browser dengan key berikut:

| Key | Deskripsi |
|-----|-----------|
| `sparklingOrders` | Daftar pesanan pelanggan |
| `sparklingFinance` | Catatan transaksi keuangan (pemasukan & pengeluaran) |
| `sparklingInventory` | Stok bahan dan alat |
| `sparklingPurchaseHistory` | Riwayat pembelian bahan |
| `sparklingRestockRequests` | Permintaan restok dari Admin |
| `sparklingTestimonials` | Ulasan pelanggan |
| `sparklingArticles` | Artikel edukasi |
| `sparklingConfig` | Konfigurasi website (teks hero, harga dasar) |

---

## 🔄 Alur Bisnis (SOP)

### Alur Pesanan
```
Pelanggan Booking → Status: Diterima → Treatment → Kering → Finishing → Siap Ambil
```

### Alur Restok Bahan
```
Admin Request → Owner Review → Approve (+ input harga beli) → Stok bertambah + Keuangan tercatat
                             → Reject (+ alasan)
```

### Alur Keuangan
```
Order Masuk → Otomatis tercatat di Finance (pemasukan)
Restok Disetujui → Otomatis tercatat di Finance (pengeluaran, nilai minus)
```

---

## 📍 Lokasi Workshop

**Sparkling Cleaners — Workshop Wagir**

```
Jl. Jamuran Rt.06 Rw.02 Dusun Jamuran,
Desa Sukodadi, Kecamatan Wagir,
Kabupaten Malang, Jawa Timur, Indonesia
```

📌 Koordinat: **-8.0261, 112.5855**
🗺️ [Buka di Google Maps](https://maps.google.com/?q=-8.0261,112.5855)

---

## 🛣️ Roadmap

- [ ] Migrasi database ke Supabase/Firebase untuk akses multi-device
- [ ] Integrasi Google Maps Distance Matrix API untuk presisi jarak
- [ ] Export laporan ke PDF/Excel (jsPDF)
- [ ] Upload gambar artikel ke base64 / cloud storage
- [ ] Progressive Web App (PWA) untuk akses offline
- [ ] Notifikasi WhatsApp otomatis saat status pesanan berubah

---

## 📄 Lisensi

© 2026 Sparkling Cleaners Malang. All rights reserved.

---

<p align="center">
  <strong>Built with 💛 in Malang, Indonesia</strong>
</p>
