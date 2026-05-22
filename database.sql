-- DATABASE SPARKLING CLEANERS (Production Ready Schema - Indonesian Refactor)

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS konfigurasi_sistem, layanan, tabel_repaint_warna, pesanan, testimoni;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Tabel Konfigurasi Sistem
CREATE TABLE konfigurasi_sistem (
    nama_kunci VARCHAR(50) PRIMARY KEY,
    teks_nilai TEXT NOT NULL
);

-- 2. Tabel Layanan
CREATE TABLE layanan (
    id VARCHAR(30) PRIMARY KEY,
    nama_layanan VARCHAR(100) NOT NULL,
    kategori VARCHAR(50) NOT NULL,
    tipe_treatment VARCHAR(50) NOT NULL, -- 'regular' or 'special'
    harga DECIMAL(10,2) NOT NULL,
    estimasi_waktu VARCHAR(30) NOT NULL,
    deskripsi TEXT
);

-- 3. Tabel Repaint Warna (Premium Color Series)
CREATE TABLE tabel_repaint_warna (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kode_warna VARCHAR(20) NOT NULL,
    nama_warna VARCHAR(50) NOT NULL,
    hex_warna_fallback VARCHAR(10) NOT NULL,
    tipe_treatment VARCHAR(20) NOT NULL
);

-- 4. Tabel Pesanan (Orders)
CREATE TABLE pesanan (
    id VARCHAR(50) PRIMARY KEY,
    nama_pelanggan VARCHAR(100) NOT NULL,
    nomor_whatsapp VARCHAR(20) NOT NULL,
    total_harga DECIMAL(10,2) NOT NULL,
    status_proses INT DEFAULT 1, -- 1: Diterima, 2: Antrian, 3: Treatment, 4: Pengeringan, 5: Menunggu Pembayaran, 6: Pengantaran, 7: Selesai
    status_pembayaran TINYINT DEFAULT 0, -- 0: Belum Lunas, 1: Lunas
    estimasi_selesai VARCHAR(50),
    rincian_item TEXT, -- JSON serialization of items selected
    tanggal_dibuat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Additional fields to support frontend logic
    tipe_item VARCHAR(50),
    jumlah INT DEFAULT 1,
    treatment VARCHAR(50),
    layanan_pilihan VARCHAR(100),
    express VARCHAR(20),
    pengiriman VARCHAR(20),
    alamat TEXT,
    jarak VARCHAR(20),
    jadwal VARCHAR(50),
    catatan TEXT,
    harga_dasar DECIMAL(15,2),
    harga_express DECIMAL(15,2),
    ongkir DECIMAL(15,2),
    foto_barang TEXT
);

-- 5. Tabel Testimoni
CREATE TABLE testimoni (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama_pelanggan VARCHAR(100) NOT NULL,
    skor_rating INT NOT NULL,
    teks_ulasan TEXT NOT NULL,
    status_moderasi VARCHAR(20) DEFAULT 'tertunda', -- 'tertunda', 'disetujui'
    tanggal_dibuat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    foto_bukti TEXT
);
