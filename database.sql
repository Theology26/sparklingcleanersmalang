-- DATABASE SPARKLING CLEANERS (Production Ready Schema)

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS orders, inventory, finance, articles, config, restock_requests, testimonials;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Tabel Pesanan (Orders)
CREATE TABLE orders (
    id VARCHAR(50) PRIMARY KEY,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    name VARCHAR(100),
    phone VARCHAR(20),
    item_type VARCHAR(50),
    qty INT DEFAULT 1,
    treatment VARCHAR(50),
    service VARCHAR(50),
    express VARCHAR(20),
    delivery VARCHAR(20),
    address TEXT,
    distance VARCHAR(20),
    schedule VARCHAR(50),
    notes TEXT,
    price DECIMAL(15,2),
    express_price DECIMAL(15,2),
    ongkir DECIMAL(15,2),
    total DECIMAL(15,2),
    status INT DEFAULT 1 -- 1:Diterima, 2:Treatment, 3:Kering, 4:Finishing, 5:Siap Ambil, 6:Selesai
);

-- 2. Tabel Inventaris (Stok Bahan)
CREATE TABLE inventory (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100),
    category VARCHAR(50),
    unit VARCHAR(20),
    price DECIMAL(15,2),
    stock DECIMAL(10,2) DEFAULT 0,
    min_stock DECIMAL(10,2) DEFAULT 2 -- Threshold Warning
);

-- 3. Tabel Keuangan (Finance)
CREATE TABLE finance (
    id VARCHAR(50) PRIMARY KEY,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    order_id VARCHAR(50),
    customer_name VARCHAR(100),
    phone VARCHAR(20),
    item_type VARCHAR(50),
    qty INT,
    service VARCHAR(50),
    treatment VARCHAR(50),
    price DECIMAL(15,2),
    ongkir DECIMAL(15,2),
    total DECIMAL(15,2),
    status VARCHAR(20) DEFAULT 'Lunas'
);

-- 4. Tabel Artikel
CREATE TABLE articles (
    id VARCHAR(50) PRIMARY KEY,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    title VARCHAR(255),
    category VARCHAR(50),
    status VARCHAR(20) DEFAULT 'Published',
    image TEXT,
    content TEXT
);

-- 5. Tabel Konfigurasi (Landing Page & Harga)
CREATE TABLE config (
    cfg_key VARCHAR(50) PRIMARY KEY,
    cfg_value TEXT
);

-- 6. Tabel Request Restok
CREATE TABLE restock_requests (
    id VARCHAR(50) PRIMARY KEY,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    itemId VARCHAR(50),
    qty DECIMAL(10,2),
    notes TEXT,
    role VARCHAR(20),
    status VARCHAR(20) DEFAULT 'Pending' -- Pending, Approved, Completed
);

-- 7. Tabel Testimoni
CREATE TABLE testimonials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    rating INT,
    content TEXT,
    status VARCHAR(20) DEFAULT 'Pending' -- Pending, Approved
);

-- --- POPULASI DATA DUMMY (BIAR LANGSUNG JALAN) ---

-- Dummy Inventory
INSERT INTO inventory (id, name, category, unit, price, stock, min_stock) VALUES
('INV-001', 'Sabun Upper Cleaner', 'Soap', 'Liter', 50000, 5.00, 2.00),
('INV-002', 'Parfum Sepatu Lemon', 'Scent', 'Liter', 75000, 1.50, 2.00), -- Ini bakal warna Merah (Low)
('INV-003', 'Solvent Leather', 'Chemical', 'Liter', 120000, 3.00, 1.00); -- Ini bakal warna Kuning (Warning)

-- Dummy Config (Hero & Harga)
INSERT INTO config (cfg_key, cfg_value) VALUES
('hero', '{"title":"Laundry Sepatu & Helm Premium di Malang","subtitle":"Kembalikan kilau sepatu kesayanganmu dengan teknologi deep clean terbaru kami."}'),
('pricing', '{"regular":{"shoes":{"Small":20000,"Medium":30000,"Large":35000},"helmet":{"Half Face":22000,"Full Face":30000},"bag_fabric":{"Small":20000,"Medium":25000,"Large":30000}},"special":{"suede":{"Small":50000,"Medium":60000,"Large":70000}},"express":{"8 Jam":20000,"18 Jam":15000,"24 Jam":10000}}');

-- Dummy Testimonials
INSERT INTO testimonials (name, rating, content, status) VALUES
('Budi Santoso', 5, 'Hasil cuci sepatu putihnya luar biasa, kayak baru lagi!', 'Approved'),
('Siska Amelia', 4, 'Cuci helm wangi banget, prosesnya cepat.', 'Approved'),
('Andi Wijaya', 5, 'Pelayanan ramah dan bisa pickup delivery. Recommended!', 'Pending');

-- Dummy Articles
INSERT INTO articles (id, title, category, status, image, content) VALUES
('ART-001', 'Cara Merawat Sepatu Suede', 'Tips', 'Published', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff', 'Konten tips merawat sepatu suede agar tidak jamuran...'),
('ART-002', 'Bahaya Helm Kotor bagi Kulit', 'Health', 'Published', 'https://images.unsplash.com/photo-1558981403-c5f91cbba527', 'Penjelasan mengenai kuman yang bersarang di busa helm...');

-- Dummy Orders (Riwayat)
INSERT INTO orders (id, name, phone, item_type, qty, treatment, service, status, total) VALUES
('ORD-12345', 'John Doe', '0812345678', 'Sepatu', 1, 'Deep Clean', 'Regular', 6, 35000),
('ORD-67890', 'Jane Smith', '0898765432', 'Helm', 1, 'Cuci Helm', 'Express', 2, 45000);
