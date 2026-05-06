# Master Prompt: Sparkling Cleaners Malang

Dokumen ini berisi seluruh ringkasan fungsionalitas, struktur antarmuka, dan gaya desain proyek website **Sparkling Cleaners Malang**. Gunakan dokumen pelengkap ini sebagai *Master Prompt* (konteks awal) jika Anda ingin melanjutkan pengembangan di platform AI atau ke developer (khusus untuk transisi pembuatan *Backend* kelak).

---

## 1. Arsitektur & Tech Stack
- **Frontend-Only (MVP):** HTML5, Vanilla Cascading Style Sheets (CSS3), dan Vanilla JavaScript (ES6). Tidak ada *framework* berat (tanpa React/Vue/Tailwind), murni *native* untuk performa maksimal.
- **Design System:** Menggunakan gaya **Glassmorphism** murni. Fitur utama temanya meliputi `backdrop-filter: blur()`, `rgba` transparan, bayangan super lembut (*soft shadow*), dan *border radius* bulat.
- **Warna Identitas (Palet):**
  - Primary Navy: `#1E2A38` (Gelap, profesional)
  - Primary Sky: `#3498DB` (Aksen dinamis, elemen interaktif)
  - Accent Yellow: `#F1C40F` (Rating bintang, Call-to-action)
- **Ikonografi:** FontAwesome 6 (CDN).

---

## 2. Fitur Landing Page Publik (`index.html`)
Halaman interaktif untuk pelanggan publik.
*   **Hero Section:** Slogan estetik dengan gambar *watermark* tersembunyi berlatar gradien radial terang.
*   **Katalog Layanan (Glass-Cards):** 6 layanan yang ditawarkan (Cuci Sepatu, Repaint, Unyellowing, Cuci Tas, Cuci Helm, Cuci Karpet). Ikon pada kartu memiliki animasi (*micro-interactions*) bila didekati kursor (*hover*).
*   **Pelacak Pesanan (Tracking Stepper):** Sistem *Input* untuk memeriksa resi dengan visualisator 5 Langkah (Diterima -> Cuci -> Kering -> Finishing -> Siap Ambil). Respons saat ini masih simulasi JS.
*   **Seksi Testimoni Pelanggan:**
    *   Grid berisi kartu pengalaman pelanggan dengan skor '*Star Rating*'.
    *   **Formulir Ulasan (Modal Pop-Up):** Dilengkapi sistem rating visual interaktif menyerupai PlayStore (Bintang di-klik berubah warna), kotak centang opsi **Tampil Anonim** (Cth: B***i), dan kewajiban mengunggah lampiran *file* `(type="file" required)` sebagai Bukti Kondisi Barang.
*   **Seksi Artikel Edukasi:** 3 Kartu yang menampilkan gaya blog tips & perawatan harian.
*   **Sistem Booking WhatsApp:** Formulir untuk pesanan (*Order*) terintegrasi dengan metode pengiriman *(Delivery)*.
    *   Pengguna dapat memilih "Antar Sendiri" atau **"Di Jemput ke Alamat"**.
    *   Khusus *Pickup*, kotak *Input* Alamat otomatis terungkap (*toggle show/hide*).
    *   Laporan dikirim otomatis dengan parameter URL WhatsApp ke nomor target `+62 859-6595-7290`.

---

## 3. Fitur Internal Dashboard (`dashboard.html`)
Pusat kendali *Admin* & *Owner* Operasional dengan formasi Menu Navigasi di sebelah kiri (Sidebar).

1.  **Daftar Pesanan Masuk (Order Management)**
    *   Menampilkan data ID pesanan, nama, pesanan, dan Status *Badge* warna-warni (SOP).
    *   **Tombol Kamera Before-Action:** Fitur UI brilian berupa *Tombol Berkamuflase* (elemen `<label>` yang membungkus `<input type="file">` tersembunyi). Saat dipencet, layar mengunggah foto akan terbuka seketika untuk dokumen *Before* sebelum barang dieksekusi petugas cuci.
2.  **Laporan Keuangan Dinamis (Khusus Owner)**
    *   Berisi visualisasi *Metrik* (Total Pendapatan, Jumlah Pesanan Selesai, dan Rata-rata Uang Masuk).
    *   Memiliki opsi filter _Dropdown_ untuk rentang visual 7 Hari, 28 Hari, 90 Hari, dan 1 Tahun.
    *   **CSS Bar-Chart:** Menampilkan grafik tren omset yang menggunakan animasi pergerakan progres bar `height` tinggi/rendah yang dijalankan hanya lewat perhitungan `Math.random` JavaScript dan DOM elemen semata.
3.  **Standarisasi Antarmuka CRUD**
    *   Setiap menu penyokong lainnya (Katalog Harga, Stok Sabun/Bahan, Artikel Edukasi, dan Kurasi Entri Manual Testimoni) direpresentasikan dalam format Tabel yang konsisten dengan opsi *Action Button* "Edit" maupun "Hapus (*Trash*)".
    *   **Generic Modal (Tambah Data):** Bukti struktur modular UI di mana satu pop-up dapat dipakai untuk berulang kali saat menambah entitas baru ke sistem.
4.  **Editor Artikel & Drag & Drop Zone**
    *   Halaman editor blog eksklusif untuk staf, yang telah memuat wilayah *Dropzone* input _cover_.

---

## 4. Arahan untuk Tahap Selanjutnya (Roadmap Intervensi Back-End)
Jika file ini diunggah pada sesi *AI Assistant* atau *Software Engineer* selanjutnya, maka tugas mutlak yang harus diperintahkan adalah:
1. Menyusun *Server/Backend Routing* (contoh: Node.js/Express, Laravel, atau Supabase).
2. Mengekstraksi daftar tabel statis HTML menjadi sistem injeksi dari Database SQL Tabel: `tb_orders`, `tb_services`, `tb_reviews`, `tb_articles`, dan `tb_inventories`.
3. Menukarkan *LocalStorage/alert() JS* pada login serta tombol operasi unggah gambar `(input type=file)` *Before-After* untuk di-hosting di layanan _Storage Cloud_.
