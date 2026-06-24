# ✨ Sparkling Cleaners Malang (Production Edition)

> **Sistem Manajemen Bisnis & Landing Page Premium** untuk layanan cuci sepatu, tas, dan helm berbasis di Wagir, Malang. Kini hadir dengan arsitektur **Production-Ready** menggunakan MySQL Backend & Aesthetic Frost UI.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)

---

## 📋 Deskripsi Evolusi

Project ini telah berevolusi dari MVP berbasis `localStorage` menjadi sistem manajemen bisnis tingkat produksi yang stabil. **Sparkling Cleaners v2.0** menawarkan sinkronisasi data real-time, keamanan backend, dan desain antarmuka yang sangat premium.

- **Frontend**: Vanilla JavaScript dengan optimasi DOM tinggi.
- **Backend**: Node.js & Express.js dengan sistem **Connection Pooling** untuk efisiensi memori.
- **Database**: MySQL Relasional dengan skema operasional lengkap (Inventory, Finance, Orders).

---

## 🎨 Premium Design Language: "Aesthetic Frost"

Sistem ini menggunakan bahasa desain eksklusif yang disebut **Aesthetic Frost**, yang menggabungkan:
- **Crumpled Blue Texture**: Tekstur kertas lecek biru tua yang memberikan kesan artistik dan identitas brand yang kuat pada sidebar.
- **High-End Glassmorphism**: Panel transparan dengan efek blur tinggi (`backdrop-filter: 25px`) dan border kaca halus.
- **Micro-interactions**: Sidebar auto-collapse, transisi tab yang mulus, dan logo yang mengecil secara dinamis.
- **Responsive Mastery**: Antarmuka yang tetap elegan baik di layar desktop lebar maupun ponsel.

---

## 🚀 Instalasi & Cara Menjalankan

### 1. Prasyarat
- [Node.js](https://nodejs.org/) (v16+)
- [MySQL/MariaDB](https://www.mysql.com/) (XAMPP/Laragon direkomendasikan)

### 2. Setup Database
1. Buka **phpMyAdmin**.
2. Buat database baru bernama `sparkling_cleaners`.
3. Import file `database.sql` ke dalam database tersebut.

### 3. Konfigurasi Environment
Buat file `.env` di dalam folder `server/` dan sesuaikan:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=sparkling_cleaners
PORT=3000
```

### 4. Jalankan Server
```bash
# Masuk ke folder server (opsional jika sudah di root)
cd server
npm install
node server.js
```
Akses Dashboard di: **http://localhost:3000/dashboard**

---

## 🗂️ Struktur Proyek Terbaru

```
sparklingcleanersmalang/
├── index.html          # Landing Page Publik & Misi Utama
├── layanan.html        # Katalog Sub-layanan & Keranjang Belanja
├── lacak.html          # Lacak Status Pesanan (Customer)
├── dashboard.html      # Dashboard Operasional (Admin & Owner)
├── login.html          # Portal Login Admin/Owner
├── database.sql        # Skema Produksi MySQL & Dummy Data
│
├── server/
│   ├── server.js       # Core API (Node/Express + Pooling)
│   └── .env            # Konfigurasi Database
│
├── js/
│   ├── db.js           # API Wrapper (Frontend-to-Backend)
│   ├── dashboard.js    # Logic Bisnis Dashboard & Cetak Nota
│   ├── beranda.js      # Animasi Staggered & Integrasi landing
│   ├── layanan.js      # Cart Engine, Checkout, & GPS Ongkir
│   └── lacak.js        # Logic Lacak Pesanan Real-time
│
├── assets/
│   ├── logo.png        # Logo Utama
│   ├── owner_bg.png    # Gambar Latar Kustom
│   └── sidebar-texture.png # Tekstur Kertas Biru Eksklusif
│
└── styles/
    ├── main.css        # Global Styles & Animasi Customer
    └── dashboard.css   # Aesthetic Frost UI Styles (Dashboard)
```

---

## 🔑 Akun Akses

| Role | Username | Password |
| :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` |
| **Owner** | `owner` | `owner123` |

---

## 🛠️ Fitur Produksi Terkini (v7.0)

- **Database Migration & Dedicated Tables**: Migrasi penuh dari basis penyimpanan JSON (`konfigurasi_sistem`) ke tabel relasional MySQL terdedikasi (`stok_bahan`, `riwayat_restok`, `pengguna`) untuk keandalan data dan performa optimal.
- **User Profile & Account Settings**: Fitur edit data akun terintegrasi (username, email, display name, password, dan foto profil/avatar) langsung dari modal profil di dashboard dengan dukungan unggah avatar yang dioptimalkan secara otomatis ke format WebP di sisi klien.
- **Anti-XSS Security**: Penerapan filter sanitasi XSS (`escapeHTML`) pada rendering DOM dashboard untuk melindungi data pelanggan dan transaksi dari serangan injeksi skrip.
- **Inventory Tracking (SQL-Backed)**: Pengurangan stok otomatis saat bahan/alat digunakan dan penambahan otomatis saat restok disetujui (ACC) oleh Owner, dilengkapi proteksi validasi stok minimum di server.
- **Financial Analytics**: Grafik pendapatan 7 hari terakhir yang dinamis menggunakan Chart.js.
- **Restok Moderation**: Admin mengajukan request pembelian barang, Owner menyetujui, stok bertambah otomatis secara real-time.
- **Live Config Editor**: Owner bisa mengubah Judul Hero, Nomor WhatsApp, Akun Instagram, dan Alamat Workshop langsung dari dashboard tanpa edit kode.
- **Multilayanan Catalog & Checkout Drawer**: Navigasi bertingkat kategori (Level 1) ke detail sub-layanan (Level 2). Slider gambar bebas potong dengan rasio 1:1, add-ons opsional, detail keranjang belanja, dan penyesuaian biaya express dinamis.
- **GPS Distance Cost (Haversine)**: Integrasi HTML5 Geolocation dengan kalkulasi rumus Haversine untuk estimasi jarak dari workshop ke lokasi pelanggan dan penghitungan biaya ongkir otomatis.
- **Save Invoice (Nota) as Image**: Menyimpan/mengunduh nota transaksi dalam format berkas gambar PNG beresolusi tinggi secara instan dari dashboard menggunakan pustaka client-side `html2canvas`.
- **Creative Micro-interactions**: Efek pantulan cahaya (*glossy shine sweeps*), staggered entrance fade-up sekuritas pada menu Tentang Kami, dan hover dinamis pada ikon/list menu.
- **Order Lifecycle**: SOP 6 tahap pelacakan transaksi dari "Diterima" hingga "Selesai/Lunas".

---

## 📄 Kontributor & Kredit Tim

Proyek **Sparkling Cleaners Malang** ini dikembangkan secara kolaboratif oleh tim pengembang berbakat:

1. **YOSIA GRACETHEO BOIMAU (Theology26)** - *Project Leader & Backend Integrator*
   - Merancang integrasi backend Node.js & Express.js.
   - Mengatur arsitektur database, sinkronisasi MySQL, dan API routing utama.
   - Menggabungkan kode dari berbagai cabang kontributor secara aman.
   - Mengembangkan halaman landing page customer secara penuh.

2. **VALENTINO IRVING CHRISTOPHER DARMOJUWONO (Xazorken)** - *Dashboard Analyst & UI Designer*
   - Mengimplementasikan visualisasi data finansial interaktif menggunakan Chart.js.
   - Merancang antarmuka Dashboard Owner dengan dukungan Dark Mode yang premium.

3. **STEVEN CHRISTOPHER MARTIN (stevenchristm)** - *Feature Engineer*
   - Mengembangkan fitur manajemen kategori layanan dinamis.
   - Mengoptimalkan data binding dan perbaikan alur database untuk operasional toko.

4. **CHRISTIAN ANTHONY SUCIPTO (ChristianAnthonySucipto)** - *Catalog & Pricing Specialist*
   - Merancang katalog harga layanan interaktif.
   - Melakukan penyesuaian visual layout halaman utama agar lebih estetis.

---

© 2026 **Sparkling Cleaners Malang**. All rights reserved.

---

<p align="center">
  <strong>Built with 💙 and Paper Texture in Malang, Indonesia</strong>
</p>
