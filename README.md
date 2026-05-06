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
├── index.html          # Landing Page Publik
├── dashboard.html      # Dashboard Operasional
├── database.sql        # Skema Produksi & Dummy Data
│
├── server/
│   ├── server.js       # Core API (Node/Express + Pooling)
│   └── .env            # Konfigurasi Database
│
├── js/
│   ├── db.js           # API Wrapper (Frontend-to-Backend)
│   ├── dashboard.js    # Logic Bisnis Dashboard
│   └── landing.js      # Logic Landing Page
│
├── assets/
│   ├── logo.png        # Logo Utama
│   └── sidebar-texture.png # Tekstur Kertas Biru Eksklusif
│
└── styles/
    ├── main.css        # Global Styles
    └── dashboard.css   # Aesthetic Frost UI Styles
```

---

## 🔑 Akun Akses

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@sparkling.com` | `admin123` |
| **Owner** | `owner@sparkling.com` | `owner123` |

---

## 🛠️ Fitur Produksi (v2.0)

- **Inventory Tracking**: Pengurangan stok otomatis saat barang digunakan dan penambahan otomatis saat restok diselesaikan.
- **Financial Analytics**: Grafik batang (infografis) pendapatan 7 hari terakhir yang dinamis.
- **Restok Moderation**: Admin mengajukan request, Owner menyetujui, stok bertambah otomatis.
- **Live Config Editor**: Owner bisa mengubah Judul Hero dan Harga Layanan langsung dari dashboard tanpa edit kode.
- **Order Lifecycle**: SOP 6 tahap dari "Diterima" hingga "Selesai/Lunas".

---

## 🧠 Master Prompt (Buku Manual AI)

*Salin teks di bawah ini jika ingin mengembangkan project ini lebih lanjut menggunakan AI:*

```markdown
Role: Senior Full-Stack Developer (Vanilla JS, Node.js, MySQL).
Project Context: Sparkling Cleaners Malang Management System.
Design System: "Aesthetic Frost" (Glassmorphism, Blue Crumpled Texture, Inter Font).
Backend Specs: Node.js Express server with mysql2/promise connection pooling.
Core Logic Rules:
1. Inventory ID format: 'INV-XXX' (String). 
2. Inventory logic: Always use parseFloat() for stock amounts.
3. Database: Ensure all write operations to 'inventory' and 'restock_requests' are synchronized.
4. UI: Maintain high backdrop-filter (20-25px) on all panels and sidebars.
5. Code Style: No frameworks (React/Vue/Tailwind) allowed. Use Vanilla CSS and ES6 JS only.
```

---

## 📄 Lisensi & Kredit

© 2026 **Sparkling Cleaners Malang**. 
Developed with precision by **Theology26** & AI Assistant.

---

<p align="center">
  <strong>Built with 💙 and Paper Texture in Malang, Indonesia</strong>
</p>
