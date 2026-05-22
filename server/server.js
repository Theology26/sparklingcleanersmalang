const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Increase JSON payload limit to handle base64 invoice uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Middleware
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }));

// Root path for static files
const rootDir = path.resolve(__dirname, '..');
app.use(express.static(rootDir));

// Setup folder uploads
const uploadsDir = path.join(rootDir, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Multer storage config
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const uniqueName = `img-${Date.now()}-${Math.floor(Math.random()*1000)}${ext}`;
        cb(null, uniqueName);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.heic', '.heif'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) cb(null, true);
        else cb(new Error('Format file tidak didukung. Gunakan JPG, PNG, WEBP, atau AVIF.'));
    }
});

// [UPLOAD IMAGE]
app.post('/api/upload', upload.array('image', 10), (req, res) => {
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'Tidak ada file yang diupload.' });
    const imageUrls = req.files.map(file => `/uploads/${file.filename}`);
    res.json({ success: true, urls: imageUrls, url: imageUrls[0] });
});

// [SIMPAN NOTA - Base64 Canvas to File]
app.post('/api/simpan-nota', async (req, res) => {
    try {
        const { imageBase64, invoiceId } = req.body;
        if (!imageBase64) return res.status(400).json({ success: false, error: 'Data base64 tidak ditemukan' });

        const base64Data = imageBase64.replace(/^data:image\/png;base64,/, "");
        const fileName = `nota-${invoiceId || Date.now()}.png`;
        const filePath = path.join(uploadsDir, fileName);

        fs.writeFileSync(filePath, base64Data, 'base64');
        res.json({ success: true, url: `/uploads/${fileName}` });
    } catch (err) {
        console.error('Simpan nota error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError || err.message) {
        return res.status(400).json({ error: err.message });
    }
    next(err);
});

// Friendly Routes
app.get('/', (req, res) => res.sendFile(path.join(rootDir, 'index.html')));
app.get('/layanan', (req, res) => res.sendFile(path.join(rootDir, 'layanan.html')));
app.get('/lacak', (req, res) => res.sendFile(path.join(rootDir, 'lacak.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(rootDir, 'dashboard.html')));
app.get('/login', (req, res) => res.sendFile(path.join(rootDir, 'login.html')));

// --- DATABASE POOLING ---
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sparkling_cleaners',
    waitForConnections: true,
    connectionLimit: 15,
    queueLimit: 0
});

// =============================================
// AUTO-MIGRATION & DATA SEEDING
// =============================================
(async () => {
    try {
        console.log('Mulai migrasi database...');
        
        // 1. Tabel Konfigurasi Sistem
        await pool.query(`
            CREATE TABLE IF NOT EXISTS konfigurasi_sistem (
                nama_kunci VARCHAR(50) PRIMARY KEY,
                teks_nilai TEXT NOT NULL
            )
        `);

        // 2. Tabel Layanan
        await pool.query(`
            CREATE TABLE IF NOT EXISTS layanan (
                id VARCHAR(30) PRIMARY KEY,
                nama_layanan VARCHAR(100) NOT NULL,
                kategori VARCHAR(50) NOT NULL,
                tipe_treatment VARCHAR(50) NOT NULL,
                harga DECIMAL(10,2) NOT NULL,
                estimasi_waktu VARCHAR(30) NOT NULL,
                deskripsi TEXT
            )
        `);

        // 3. Tabel Repaint Warna
        await pool.query(`
            CREATE TABLE IF NOT EXISTS tabel_repaint_warna (
                id INT AUTO_INCREMENT PRIMARY KEY,
                kode_warna VARCHAR(20) NOT NULL,
                nama_warna VARCHAR(50) NOT NULL,
                hex_warna_fallback VARCHAR(10) NOT NULL,
                tipe_treatment VARCHAR(20) NOT NULL
            )
        `);

        // 4. Tabel Pesanan
        await pool.query(`
            CREATE TABLE IF NOT EXISTS pesanan (
                id VARCHAR(50) PRIMARY KEY,
                nama_pelanggan VARCHAR(100) NOT NULL,
                nomor_whatsapp VARCHAR(20) NOT NULL,
                total_harga DECIMAL(10,2) NOT NULL,
                status_proses INT DEFAULT 1,
                status_pembayaran TINYINT DEFAULT 0,
                estimasi_selesai VARCHAR(50),
                rincian_item TEXT,
                tanggal_dibuat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
            )
        `);

        // 5. Tabel Testimoni
        await pool.query(`
            CREATE TABLE IF NOT EXISTS testimoni (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nama_pelanggan VARCHAR(100) NOT NULL,
                skor_rating INT NOT NULL,
                teks_ulasan TEXT NOT NULL,
                status_moderasi VARCHAR(20) DEFAULT 'tertunda',
                tanggal_dibuat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                foto_bukti TEXT
            )
        `);

        // Seed konfigurasi_sistem defaults if empty
        const [sysCount] = await pool.query('SELECT COUNT(*) as count FROM konfigurasi_sistem');
        if (sysCount[0].count === 0) {
            console.log('Seeding: konfigurasi_sistem defaults...');
            const sysSeeds = [
                ['whatsapp_admin_number', '6285965957290'],
                ['instagram_url', 'https://instagram.com/sparklingcleaners_mlg'],
                ['business_address', 'Jl. Jamuran Rt.06 Rw. 02 Dusun Jamoran, Desa Sukodadi, Kecamatan Wagir, Kabupaten Malang, Jawa Timur, Indonesia.'],
                ['gmaps_iframe_url', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15802.215570059379!2d112.5855026601438!3d-8.044810756779491!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7882afb4455555%3A0xe6bf4dc34ac8c406!2sWagir%2C%20Malang%20Regency%2C%20East%20Java!5e0!3m2!1sen!2sid!4v1700000000000!5m2!1sen!2sid'],
                ['hero_welcome_title', 'Laundry Sepatu & Helm Premium di Malang'],
                ['hero_welcome_subtitle', 'Kembalikan kilau sepatu kesayanganmu dengan teknologi deep clean terbaru kami.'],
                ['hero_font_color', '#ffffff'],
                ['workshop_dropoff_allowed', 'false'],
                ['owner_username', 'owner'],
                ['owner_password', 'owner123'],
                ['owner_display_name', 'Owner Sparkling'],
                ['owner_avatar', ''],
                ['admin_username', 'admin'],
                ['admin_password', 'admin123'],
                ['admin_display_name', 'Admin Kasir'],
                ['admin_avatar', ''],
                ['instagram_gallery_images', JSON.stringify([
                    { id: 1, path_gambar: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614c3a?w=400', link_instagram: null },
                    { id: 2, path_gambar: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', link_instagram: 'https://instagram.com/sparklingcleaners_mlg' },
                    { id: 3, path_gambar: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400', link_instagram: null },
                    { id: 4, path_gambar: 'https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=400', link_instagram: 'https://instagram.com/sparklingcleaners_mlg' },
                    { id: 5, path_gambar: 'https://images.unsplash.com/photo-1582588678413-dbf45f4823e9?w=400', link_instagram: null },
                    { id: 6, path_gambar: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400', link_instagram: null }
                ])],
                ['data_stok_bahan', JSON.stringify([
                    { id: 'INV-001', name: 'Sabun Upper Cleaner', category: 'Soap', unit: 'Liter', price: 50000, stock: 5.00, min_stock: 2.00 },
                    { id: 'INV-002', name: 'Parfum Sepatu Lemon', category: 'Scent', unit: 'Liter', price: 75000, stock: 1.50, min_stock: 2.00 },
                    { id: 'INV-003', name: 'Solvent Leather', category: 'Chemical', unit: 'Liter', price: 120000, stock: 3.00, min_stock: 1.00 }
                ])],
                ['riwayat_restok_gudang', JSON.stringify([])],
                ['about_motto', 'From Dirty to Dazzling!!!'],
                ['about_semantics', 'Sparkling menggambarkan hasil akhir yang bersinar, bersih, dan tanpa noda. Cleaners menunjukkan fokus pembersihan dan perawatan maksimal.'],
                ['about_vision', 'Menjadi penyedia jasa perawatan sepatu, tas, dan helm yang terpercaya, inovatif, dan ramah lingkungan, serta membantu masyarakat menjaga kebersihan dan memperpanjang usia pakai barang kesayangan agar tetap terlihat seperti baru.'],
                ['about_mission', '1. Memberikan layanan perawatan dengan hasil berkualitas tinggi dan detail. 2. Menggunakan produk pembersih aman, ramah lingkungan, dan sesuai jenis material. 3. Menyediakan layanan praktis antar-jemput. 4. Menjadi mitra terpercaya meningkatkan rasa percaya diri pelanggan. 5. Mengembangkan inovasi layanan sesuai kenyamanan pelanggan.'],
                ['about_image', 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600'],
                ['hero_slideshow_images', JSON.stringify([
                    'https://images.unsplash.com/photo-1595950653106-6c9ebd614c3a?w=1200',
                    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200',
                    'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1200'
                ])]
            ];
            for (const [k, v] of sysSeeds) {
                await pool.query('INSERT IGNORE INTO konfigurasi_sistem (nama_kunci, teks_nilai) VALUES (?, ?)', [k, v]);
            }
        }

        // Pastikan key about_image dan hero_slideshow_images tetap terisi meskipun db sudah terlanjur seeded
        await pool.query(`INSERT IGNORE INTO konfigurasi_sistem (nama_kunci, teks_nilai) VALUES 
            ('about_image', 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600'),
            ('hero_slideshow_images', ?)`, [JSON.stringify([
                'https://images.unsplash.com/photo-1595950653106-6c9ebd614c3a?w=1200',
                'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200',
                'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1200'
            ])]);


        // smart seeding layanan: 23 product tiers if empty or 5 items
        const [svcCount] = await pool.query('SELECT COUNT(*) as count FROM layanan');
        const count = svcCount[0].count;
        if (count === 0 || count === 5) {
            console.log(`Seeding layanan: count=${count}, inserting 23 product tiers...`);
            if (count > 0) {
                await pool.query('TRUNCATE TABLE layanan');
            }
            const seedSQL = `INSERT INTO layanan (id, nama_layanan, kategori, tipe_treatment, harga, estimasi_waktu, deskripsi) VALUES
                ('sh-s', 'Shoes Deep Clean (Small)', 'Sepatu', 'regular', 20000, '3 Hari', 'Outsole, Midsole, Upper, Insole'),
                ('sh-m', 'Shoes Deep Clean (Medium)', 'Sepatu', 'regular', 50000, '3 Hari', 'Outsole, Midsole, Upper, Insole'),
                ('sh-l', 'Shoes Deep Clean (Large)', 'Sepatu', 'regular', 65000, '3 Hari', 'Outsole, Midsole, Upper, Insole'),
                ('hl-hf', 'Helmet (Half Face)', 'Helm', 'regular', 22000, '24 Jam', 'Interior and Exterior cleaning treatment'),
                ('hl-ff', 'Helmet (Full Face)', 'Helm', 'regular', 30000, '24 Jam', 'Interior and Exterior cleaning treatment'),
                ('bg-l-s', 'Bag Leather (Small)', 'Tas', 'regular', 25000, '24 Jam', 'Premium Leather treatment'),
                ('bg-l-m', 'Bag Leather (Medium)', 'Tas', 'regular', 30000, '24 Jam', 'Premium Leather treatment'),
                ('bg-l-l', 'Bag Leather (Large)', 'Tas', 'regular', 35000, '24 Jam', 'Premium Leather treatment'),
                ('bg-c-s', 'Bag Fabric/Canvas (Small)', 'Tas', 'regular', 20000, '2 Hari', 'Fabric/Canvas material care'),
                ('bg-c-m', 'Bag Fabric/Canvas (Medium)', 'Tas', 'regular', 25000, '2 Hari', 'Fabric/Canvas material care'),
                ('bg-c-l', 'Bag Fabric/Canvas (Large)', 'Tas', 'regular', 30000, '2 Hari', 'Fabric/Canvas material care'),
                ('sp-boots-s', 'Special Boots Treatment (Small)', 'Sepatu', 'special', 60000, '3 Hari', 'Specialized deep clean for boots'),
                ('sp-boots-m', 'Special Boots Treatment (Medium)', 'Sepatu', 'special', 65000, '3 Hari', 'Specialized deep clean for boots'),
                ('sp-boots-l', 'Special Boots Treatment (Large)', 'Sepatu', 'special', 80000, '3 Hari', 'Specialized deep clean for boots'),
                ('sp-suede-s', 'Suede Shoes Care (Small)', 'Sepatu', 'special', 50000, '5 Hari', 'Delicate material care for suede leather'),
                ('sp-suede-m', 'Suede Shoes Care (Medium)', 'Sepatu', 'special', 60000, '5 Hari', 'Delicate material care for suede leather'),
                ('sp-suede-l', 'Suede Shoes Care (Large)', 'Sepatu', 'special', 70000, '5 Hari', 'Delicate material care for suede leather'),
                ('sp-dress-s', 'Dress Shoes Care (Small)', 'Sepatu', 'special', 55000, '3 Hari', 'Special leather treatment for formal footwear'),
                ('sp-dress-m', 'Dress Shoes Care (Medium)', 'Sepatu', 'special', 60000, '3 Hari', 'Special leather treatment for formal footwear'),
                ('sp-dress-l', 'Dress Shoes Care (Large)', 'Sepatu', 'special', 65000, '3 Hari', 'Special leather treatment for formal footwear'),
                ('rp-canvas-p', 'Repaint Canvas & Leather (Kode P)', 'Sepatu', 'special', 80000, '10 Hari', 'Upper 80k, Midsole 50k, Outsole 40k, Insole 30k tier'),
                ('rp-canvas-s', 'Repaint Canvas & Leather (Kode S)', 'Sepatu', 'special', 100000, '10 Hari', 'Upper 100k, Midsole 63k, Outsole 50k, Insole 38k tier'),
                ('rp-suede', 'Repaint Suede Shoes', 'Sepatu', 'special', 120000, '10 Hari', 'Upper 120k, Midsole 75k, Outsole 60k, Insole 45k tier premium repaint')`;
            await pool.query(seedSQL);
        }

        // Seed tabel_repaint_warna
        const [colorCount] = await pool.query('SELECT COUNT(*) as count FROM tabel_repaint_warna');
        if (colorCount[0].count === 0) {
            console.log('Seeding: tabel_repaint_warna defaults...');
            const colorSeedSQL = `INSERT INTO tabel_repaint_warna (kode_warna, nama_warna, hex_warna_fallback, tipe_treatment) VALUES
                ('P.BLK', 'Black', '#000000', 'Kode P'), ('P.WHT', 'White', '#ffffff', 'Kode P'),
                ('P.109', 'Red', '#ff0000', 'Kode P'), ('P.105', 'Blue', '#0000ff', 'Kode P'),
                ('P.122', 'Green', '#00ff00', 'Kode P'), ('P.106', 'Yellow', '#ffff00', 'Kode P'),
                ('P.103', 'Brown', '#8b4513', 'Kode P'),
                ('S.122', 'Dark Red', '#8b0000', 'Kode S'), ('S.120', 'Navy', '#000080', 'Kode S'),
                ('S.121', 'Olive', '#808000', 'Kode S'), ('S.113', 'Purple', '#800080', 'Kode S'),
                ('S.111', 'Teal', '#008080', 'Kode S'), ('S.112', 'Maroon', '#800000', 'Kode S'),
                ('SUE.NAV', 'Navy', '#000080', 'Suede'), ('SUE.BLU', 'Blue', '#0000ff', 'Suede'),
                ('SUE.GRN', 'Green', '#00ff00', 'Suede'), ('SUE.ARM', 'Army Green', '#4b5320', 'Suede'),
                ('SUE.DKG', 'Dark Green', '#006400', 'Suede'), ('SUE.RED', 'Red', '#ff0000', 'Suede'),
                ('SUE.MAR', 'Maroon', '#800000', 'Suede'), ('SUE.WIN', 'Wine', '#722f37', 'Suede'),
                ('SUE.PUR', 'Purple', '#800080', 'Suede'), ('SUE.MAG', 'Magenta', '#ff00ff', 'Suede'),
                ('SUE.ORG', 'Orange', '#ffa500', 'Suede'), ('SUE.YEL', 'Yellow', '#ffff00', 'Suede'),
                ('SUE.TAN', 'Tan', '#d2b48c', 'Suede'), ('SUE.BRN', 'Brown', '#8b4513', 'Suede'),
                ('SUE.BLK', 'Black', '#000000', 'Suede'), ('SUE.BBL', 'Baby Blue', '#89cff0', 'Suede'),
                ('SUE.BWH', 'Broken White', '#fdf5e6', 'Suede'), ('SUE.BEI', 'Beige', '#f5f5dc', 'Suede'),
                ('SUE.GRY', 'Gray', '#808080', 'Suede'), ('SUE.PNK', 'Pink', '#ffc0cb', 'Suede'),
                ('SUE.DPN', 'Dusty Pink', '#dcae96', 'Suede'), ('SUE.PCH', 'Peach', '#ffe5b4', 'Suede'),
                ('SUE.CRM', 'Cream', '#fffdd0', 'Suede')
            `;
            await pool.query(colorSeedSQL);
        }

        console.log('✅ Migrasi & Seeding Berhasil.');
    } catch (err) {
        console.error('Auto-migration Error:', err.message);
    }
})();

// =============================================
// API ENDPOINTS
// =============================================

// Middleware Owner Validation
const validateOwner = (req, res, next) => {
    const role = req.headers['x-user-role'];
    if (role !== 'owner') {
        return res.status(403).json({ success: false, error: 'Access Denied: Owner role required.' });
    }
    next();
};

// [SYSTEM CONFIG - Dynamic Global Site Variables]
const handleGetSystemConfig = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM konfigurasi_sistem');
        const result = {};
        rows.forEach(r => { result[r.nama_kunci] = r.teks_nilai; });
        res.json(result);
    } catch (err) { res.status(500).json({ error: err.message }); }
};
app.get('/api/konfigurasi-sistem', handleGetSystemConfig);
app.get('/api/system-config', handleGetSystemConfig);

const handlePutSystemConfig = async (req, res) => {
    try {
        const { key_name, value_text } = req.body;
        if (key_name) {
            await pool.query(
                'INSERT INTO konfigurasi_sistem (nama_kunci, teks_nilai) VALUES (?, ?) ON DUPLICATE KEY UPDATE teks_nilai = ?',
                [key_name, value_text, value_text]
            );
        } else {
            // Update multiple keys at once
            for (const [k, v] of Object.entries(req.body)) {
                const valStr = typeof v === 'object' ? JSON.stringify(v) : String(v);
                await pool.query(
                    'INSERT INTO konfigurasi_sistem (nama_kunci, teks_nilai) VALUES (?, ?) ON DUPLICATE KEY UPDATE teks_nilai = ?',
                    [k, valStr, valStr]
                );
            }
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};
app.put('/api/konfigurasi-sistem', validateOwner, handlePutSystemConfig);
app.put('/api/system-config', validateOwner, handlePutSystemConfig);

// [CONFIG COMPATIBILITY]
app.get('/api/config', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM konfigurasi_sistem');
        const config = {};
        rows.forEach(r => {
            if (r.nama_kunci === 'whatsapp_admin_number') {
                config.whatsapp_admin_number = r.teks_nilai;
            } else if (r.nama_kunci === 'workshop_dropoff_allowed') {
                config.workshop_dropoff_allowed = (r.teks_nilai === 'true');
            } else {
                config[r.nama_kunci] = r.teks_nilai;
            }
        });
        
        config.hero = {
            title: config.hero_welcome_title || 'Laundry Sepatu & Helm Premium di Malang',
            subtitle: config.hero_welcome_subtitle || 'Kembalikan kilau sepatu kesayanganmu dengan teknologi deep clean terbaru kami.',
            hero_font_color: config.hero_font_color || '#ffffff'
        };
        
        res.json(config);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/config', validateOwner, async (req, res) => {
    try {
        const data = req.body;
        for (const [key, val] of Object.entries(data)) {
            let valStr = typeof val === 'object' ? JSON.stringify(val) : String(val);
            if (key === 'hero' && typeof val === 'object') {
                if (val.title) {
                    await pool.query(
                        'INSERT INTO konfigurasi_sistem (nama_kunci, teks_nilai) VALUES (?, ?) ON DUPLICATE KEY UPDATE teks_nilai = ?',
                        ['hero_welcome_title', val.title, val.title]
                    );
                }
                if (val.subtitle) {
                    await pool.query(
                        'INSERT INTO konfigurasi_sistem (nama_kunci, teks_nilai) VALUES (?, ?) ON DUPLICATE KEY UPDATE teks_nilai = ?',
                        ['hero_welcome_subtitle', val.subtitle, val.subtitle]
                    );
                }
            } else {
                await pool.query(
                    'INSERT INTO konfigurasi_sistem (nama_kunci, teks_nilai) VALUES (?, ?) ON DUPLICATE KEY UPDATE teks_nilai = ?',
                    [key, valStr, valStr]
                );
            }
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// [LAYANAN]
const handleGetLayanan = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM layanan');
        // Map fields to original names for backward compatibility if needed
        const mapped = rows.map(r => ({
            id: r.id,
            name: r.nama_layanan,
            category: r.kategori,
            treatment: r.tipe_treatment,
            price: r.harga,
            estimation: r.estimasi_waktu,
            description: r.deskripsi
        }));
        res.json(mapped);
    } catch (err) { res.status(500).json({ error: err.message }); }
};
app.get('/api/layanan', handleGetLayanan);
app.get('/api/services', handleGetLayanan);

const handlePostLayanan = async (req, res) => {
    try {
        const { id, name, category, treatment, price, estimation, description } = req.body;
        await pool.query(
            'INSERT INTO layanan (id, nama_layanan, kategori, tipe_treatment, harga, estimasi_waktu, deskripsi) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, name, category, treatment, parseFloat(price), estimation, description || '']
        );
        res.status(201).json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};
app.post('/api/layanan', validateOwner, handlePostLayanan);
app.post('/api/services', validateOwner, handlePostLayanan);

const handlePutLayanan = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category, treatment, price, estimation, description } = req.body;
        await pool.query(
            'UPDATE layanan SET nama_layanan = ?, kategori = ?, tipe_treatment = ?, harga = ?, estimasi_waktu = ?, deskripsi = ? WHERE id = ?',
            [name, category, treatment, parseFloat(price), estimation, description || '', id]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};
app.put('/api/layanan/:id', validateOwner, handlePutLayanan);
app.put('/api/services/:id', validateOwner, handlePutLayanan);

const handleDeleteLayanan = async (req, res) => {
    try {
        await pool.query('DELETE FROM layanan WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};
app.delete('/api/layanan/:id', validateOwner, handleDeleteLayanan);
app.delete('/api/services/:id', validateOwner, handleDeleteLayanan);

// [REPAINT COLORS]
const handleGetColors = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM tabel_repaint_warna ORDER BY tipe_treatment, id ASC');
        const mapped = rows.map(r => ({
            id: r.id,
            kode_warna: r.kode_warna,
            nama_warna: r.nama_warna,
            hex_color_fallback: r.hex_warna_fallback,
            tipe_treatment: r.tipe_treatment
        }));
        res.json(mapped);
    } catch (err) { res.status(500).json({ error: err.message }); }
};
app.get('/api/warna-repaint', handleGetColors);
app.get('/api/colors', handleGetColors);

// [PESANAN]
const handleGetPesanan = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM pesanan ORDER BY tanggal_dibuat DESC');
        // Map to original field names for dashboard compatibility
        const mapped = rows.map(r => ({
            id: r.id,
            date: r.tanggal_dibuat,
            name: r.nama_pelanggan,
            phone: r.nomor_whatsapp,
            item_type: r.tipe_item,
            qty: r.jumlah,
            treatment: r.treatment,
            service: r.layanan_pilihan,
            express: r.express,
            delivery: r.pengiriman,
            address: r.alamat,
            distance: r.jarak,
            schedule: r.jadwal,
            notes: r.catatan,
            price: r.harga_dasar,
            express_price: r.harga_express,
            ongkir: r.ongkir,
            total: r.total_harga,
            status: r.status_proses,
            lunas: r.status_pembayaran,
            items: r.rincian_item,
            photo: r.foto_barang
        }));
        res.json(mapped);
    } catch (err) { res.status(500).json({ error: err.message }); }
};
app.get('/api/pesanan', handleGetPesanan);
app.get('/api/orders', handleGetPesanan);

const handlePostPesanan = async (req, res) => {
    try {
        const o = req.body;
        const sql = `INSERT INTO pesanan (id, nama_pelanggan, nomor_whatsapp, total_harga, status_proses, status_pembayaran, estimasi_selesai, rincian_item, tipe_item, jumlah, treatment, layanan_pilihan, express, pengiriman, alamat, jarak, jadwal, catatan, harga_dasar, harga_express, ongkir, foto_barang) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const itemsVal = o.items ? (typeof o.items === 'string' ? o.items : JSON.stringify(o.items)) : null;
        await pool.query(sql, [
            o.id, 
            o.name, 
            o.phone, 
            parseFloat(o.total || 0), 
            o.status || 1, 
            o.lunas || 0, 
            o.estimasi_selesai || '3 Hari', 
            itemsVal,
            o.item_type || null,
            parseInt(o.qty || 1),
            o.treatment || null,
            o.service || null,
            o.express || null,
            o.delivery || null,
            o.address || null,
            o.distance || null,
            o.schedule || null,
            o.notes || null,
            o.price ? parseFloat(o.price) : null,
            o.express_price ? parseFloat(o.express_price) : null,
            o.ongkir ? parseFloat(o.ongkir) : null,
            o.photo || null
        ]);
        res.status(201).json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};
app.post('/api/pesanan', handlePostPesanan);
app.post('/api/orders', handlePostPesanan);

// [STATUS PROSES PESANAN]
app.put('/api/pesanan/:id/status_proses', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // integer 1-7
        const statusVal = parseInt(status);
        
        if (statusVal === 7) {
            await pool.query('UPDATE pesanan SET status_proses = ?, status_pembayaran = 1 WHERE id = ?', [statusVal, id]);
        } else {
            await pool.query('UPDATE pesanan SET status_proses = ? WHERE id = ?', [statusVal, id]);
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/orders/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const statusVal = parseInt(status);
        if (statusVal === 7) {
            await pool.query('UPDATE pesanan SET status_proses = ?, status_pembayaran = 1 WHERE id = ?', [statusVal, id]);
        } else {
            await pool.query('UPDATE pesanan SET status_proses = ? WHERE id = ?', [statusVal, id]);
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// [STATUS PEMBAYARAN PESANAN]
app.put('/api/pesanan/:id/status_pembayaran', async (req, res) => {
    try {
        const { id } = req.params;
        const { lunas } = req.body; // 0 or 1
        const val = parseInt(lunas);
        await pool.query('UPDATE pesanan SET status_pembayaran = ? WHERE id = ?', [val, id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/orders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { lunas } = req.body;
        const val = parseInt(lunas);
        await pool.query('UPDATE pesanan SET status_pembayaran = ? WHERE id = ?', [val, id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// [TESTIMONI]
const handleGetTestimoni = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM testimoni ORDER BY tanggal_dibuat DESC');
        // Map to original for compat
        const mapped = rows.map(r => ({
            id: r.id,
            name: r.nama_pelanggan,
            rating: r.skor_rating,
            content: r.teks_ulasan,
            status: r.status_moderasi === 'disetujui' ? 'Approved' : 'Pending',
            image: r.foto_bukti,
            date: r.tanggal_dibuat
        }));
        res.json(mapped);
    } catch (err) { res.status(500).json({ error: err.message }); }
};
app.get('/api/testimoni', handleGetTestimoni);
app.get('/api/testimonials', handleGetTestimoni);

const handlePostTestimoni = async (req, res) => {
    try {
        const { name, rating, content, image } = req.body;
        await pool.query(
            'INSERT INTO testimoni (nama_pelanggan, skor_rating, teks_ulasan, foto_bukti, status_moderasi) VALUES (?, ?, ?, ?, ?)',
            [name, parseInt(rating || 5), content, image || null, 'tertunda']
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};
app.post('/api/testimoni', handlePostTestimoni);
app.post('/api/testimonials', handlePostTestimoni);

const handlePutTestimoni = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'Approved' or 'Pending' or 'tertunda'/'disetujui'
        const statusVal = (status === 'Approved' || status === 'disetujui') ? 'disetujui' : 'tertunda';
        await pool.query('UPDATE testimoni SET status_moderasi = ? WHERE id = ?', [statusVal, id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};
app.put('/api/testimoni/:id', validateOwner, handlePutTestimoni);
app.put('/api/testimonials/:id', validateOwner, handlePutTestimoni);

const handleDeleteTestimoni = async (req, res) => {
    try {
        await pool.query('DELETE FROM testimoni WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};
app.delete('/api/testimoni/:id', validateOwner, handleDeleteTestimoni);
app.delete('/api/testimonials/:id', validateOwner, handleDeleteTestimoni);

// [SIMPAN NOTA - Base64 Image Upload to uploads/ folder]
app.post('/api/simpan-nota', async (req, res) => {
    try {
        const { image } = req.body;
        if (!image) return res.status(400).json({ error: 'Tidak ada data gambar base64.' });
        
        const matches = image.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        if (!matches) return res.status(400).json({ error: 'Format base64 tidak valid.' });
        
        const ext = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        const fileName = `nota-${Date.now()}.${ext === 'jpeg' ? 'jpg' : ext}`;
        const filePath = path.join(uploadsDir, fileName);
        
        await fs.promises.writeFile(filePath, buffer);
        
        const publicUrl = `${req.protocol}://${req.get('host')}/uploads/${fileName}`;
        res.json({ success: true, url: publicUrl });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// [INVENTORY / STOK BAHAN BACKWARD COMPATIBILITY VIA JSON STORAGE IN CONFIG]
app.get('/api/inventory', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT teks_nilai FROM konfigurasi_sistem WHERE nama_kunci = "data_stok_bahan"');
        if (rows.length === 0) return res.json([]);
        const list = JSON.parse(rows[0].teks_nilai || '[]');
        // Map to original for dashboard
        const mapped = list.map(r => ({
            id: r.id,
            name: r.name,
            category: r.category,
            unit: r.unit,
            price: r.price,
            stock: r.stock,
            min_stock: r.min_stock,
            minStock: r.min_stock // support casing variation
        }));
        res.json(mapped);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/inventory', validateOwner, async (req, res) => {
    try {
        const { name, category, unit, price, stock, min_stock } = req.body;
        const [rows] = await pool.query('SELECT teks_nilai FROM konfigurasi_sistem WHERE nama_kunci = "data_stok_bahan"');
        const list = rows.length > 0 ? JSON.parse(rows[0].teks_nilai || '[]') : [];
        
        const id = `INV-${Date.now()}`;
        list.push({
            id,
            name,
            category,
            unit,
            price: parseFloat(price),
            stock: parseFloat(stock || 0),
            min_stock: parseFloat(min_stock || 2)
        });
        
        await pool.query(
            'INSERT INTO konfigurasi_sistem (nama_kunci, teks_nilai) VALUES (?, ?) ON DUPLICATE KEY UPDATE teks_nilai = ?',
            ['data_stok_bahan', JSON.stringify(list), JSON.stringify(list)]
        );
        res.status(201).json({ success: true, id });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/inventory/:id/details', validateOwner, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category, unit, price, min_stock, stock } = req.body;
        const [rows] = await pool.query('SELECT teks_nilai FROM konfigurasi_sistem WHERE nama_kunci = "data_stok_bahan"');
        if (rows.length === 0) return res.status(404).json({ error: 'Stok tidak ditemukan' });
        
        let list = JSON.parse(rows[0].teks_nilai || '[]');
        list = list.map(item => {
            if (item.id === id) {
                return {
                    ...item,
                    name,
                    category,
                    unit,
                    price: parseFloat(price),
                    min_stock: parseFloat(min_stock),
                    stock: parseFloat(stock)
                };
            }
            return item;
        });
        
        await pool.query(
            'INSERT INTO konfigurasi_sistem (nama_kunci, teks_nilai) VALUES (?, ?) ON DUPLICATE KEY UPDATE teks_nilai = ?',
            ['data_stok_bahan', JSON.stringify(list), JSON.stringify(list)]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/inventory/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, action } = req.body;
        const val = parseFloat(amount);
        const [rows] = await pool.query('SELECT teks_nilai FROM konfigurasi_sistem WHERE nama_kunci = "data_stok_bahan"');
        if (rows.length === 0) return res.status(404).json({ error: 'Stok tidak ditemukan' });
        
        let list = JSON.parse(rows[0].teks_nilai || '[]');
        list = list.map(item => {
            if (item.id === id) {
                const ns = action === 'add' ? (item.stock + val) : (item.stock - val);
                return { ...item, stock: ns };
            }
            return item;
        });
        
        await pool.query(
            'INSERT INTO konfigurasi_sistem (nama_kunci, teks_nilai) VALUES (?, ?) ON DUPLICATE KEY UPDATE teks_nilai = ?',
            ['data_stok_bahan', JSON.stringify(list), JSON.stringify(list)]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/inventory/:id', validateOwner, async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT teks_nilai FROM konfigurasi_sistem WHERE nama_kunci = "data_stok_bahan"');
        if (rows.length === 0) return res.status(404).json({ error: 'Stok tidak ditemukan' });
        
        let list = JSON.parse(rows[0].teks_nilai || '[]');
        list = list.filter(item => item.id !== id);
        
        await pool.query(
            'INSERT INTO konfigurasi_sistem (nama_kunci, teks_nilai) VALUES (?, ?) ON DUPLICATE KEY UPDATE teks_nilai = ?',
            ['data_stok_bahan', JSON.stringify(list), JSON.stringify(list)]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// [RESTOCK / REQUEST RESTOK COMPATIBILITY]
app.get('/api/restock', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT teks_nilai FROM konfigurasi_sistem WHERE nama_kunci = "riwayat_restok_gudang"');
        if (rows.length === 0) return res.json([]);
        res.json(JSON.parse(rows[0].teks_nilai || '[]'));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/restock', async (req, res) => {
    try {
        const { itemId, qty, notes, role } = req.body;
        const [rows] = await pool.query('SELECT teks_nilai FROM konfigurasi_sistem WHERE nama_kunci = "riwayat_restok_gudang"');
        const list = rows.length > 0 ? JSON.parse(rows[0].teks_nilai || '[]') : [];
        
        const id = `REQ-${Date.now()}`;
        list.push({
            id,
            itemId,
            qty: parseFloat(qty),
            notes,
            role,
            status: 'Pending',
            date: new Date().toISOString()
        });
        
        await pool.query(
            'INSERT INTO konfigurasi_sistem (nama_kunci, teks_nilai) VALUES (?, ?) ON DUPLICATE KEY UPDATE teks_nilai = ?',
            ['riwayat_restok_gudang', JSON.stringify(list), JSON.stringify(list)]
        );
        res.status(201).json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/restock/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const [rows] = await pool.query('SELECT teks_nilai FROM konfigurasi_sistem WHERE nama_kunci = "riwayat_restok_gudang"');
        if (rows.length === 0) return res.status(404).json({ error: 'Permintaan tidak ditemukan' });
        
        let list = JSON.parse(rows[0].teks_nilai || '[]');
        let itemIdToUpdate = null;
        let qtyToUpdate = 0;
        
        list = list.map(reqs => {
            if (reqs.id === id) {
                itemIdToUpdate = reqs.itemId;
                qtyToUpdate = parseFloat(reqs.qty);
                return { ...reqs, status };
            }
            return reqs;
        });
        
        await pool.query(
            'INSERT INTO konfigurasi_sistem (nama_kunci, teks_nilai) VALUES (?, ?) ON DUPLICATE KEY UPDATE teks_nilai = ?',
            ['riwayat_restok_gudang', JSON.stringify(list), JSON.stringify(list)]
        );
        
        // If Completed, update stock of that item in data_stok_bahan
        if (status === 'Completed' && itemIdToUpdate) {
            const [stockRows] = await pool.query('SELECT teks_nilai FROM konfigurasi_sistem WHERE nama_kunci = "data_stok_bahan"');
            if (stockRows.length > 0) {
                let stockList = JSON.parse(stockRows[0].teks_nilai || '[]');
                stockList = stockList.map(item => {
                    if (item.id === itemIdToUpdate) {
                        return { ...item, stock: item.stock + qtyToUpdate };
                    }
                    return item;
                });
                await pool.query(
                    'INSERT INTO konfigurasi_sistem (nama_kunci, teks_nilai) VALUES (?, ?) ON DUPLICATE KEY UPDATE teks_nilai = ?',
                    ['data_stok_bahan', JSON.stringify(stockList), JSON.stringify(stockList)]
                );
            }
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// [FINANCE COMPATIBILITY COMPILINGpesanan WHERE status_proses = 7]
app.get('/api/finance', validateOwner, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM pesanan WHERE status_proses = 7 ORDER BY tanggal_dibuat DESC');
        const mapped = rows.map(r => ({
            id: r.id,
            date: r.tanggal_dibuat,
            order_id: r.id,
            customer_name: r.nama_pelanggan,
            phone: r.nomor_whatsapp,
            item_type: r.tipe_item,
            qty: r.jumlah,
            service: r.layanan_pilihan,
            treatment: r.treatment,
            price: r.harga_dasar,
            ongkir: r.ongkir,
            total: r.total_harga,
            status: 'Lunas'
        }));
        res.json(mapped);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// [ABOUT US / DYNAMIC LAYOUT TEXTS COMPATIBILITY]
app.get('/api/about', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM konfigurasi_sistem WHERE nama_kunci LIKE "about_%" OR nama_kunci IN ("hero_welcome_title", "hero_welcome_subtitle", "hero_font_color")');
        const map = {};
        rows.forEach(r => { map[r.nama_kunci] = r.teks_nilai; });
        
        const result = [
            { id: 1, key_posisi: 'title', tipe: 'teks', konten: map.hero_welcome_title || 'Laundry Sepatu & Helm Premium di Malang', hero_font_color: map.hero_font_color || '#ffffff' },
            { id: 2, key_posisi: 'subtitle', tipe: 'teks', konten: map.hero_welcome_subtitle || 'Kembalikan kilau sepatu kesayanganmu dengan teknologi deep clean terbaru kami.' },
            { id: 3, key_posisi: 'motto', tipe: 'teks', konten: map.about_motto || 'From Dirty to Dazzling!!!' },
            { id: 4, key_posisi: 'semantics', tipe: 'teks', konten: map.about_semantics || 'Sparkling menggambarkan hasil akhir...' },
            { id: 5, key_posisi: 'vision', tipe: 'teks', konten: map.about_vision || 'Menjadi penyedia...' },
            { id: 6, key_posisi: 'mission', tipe: 'teks', konten: map.about_mission || '1. Memberikan...' }
        ];
        res.json(result);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/about', validateOwner, async (req, res) => {
    res.status(200).json({ success: true });
});

app.put('/api/about/:id', validateOwner, async (req, res) => {
    try {
        const { id } = req.params;
        const { key_posisi, tipe, konten, hero_font_color } = req.body;
        
        if (id == 1) {
            await pool.query(
                'INSERT INTO konfigurasi_sistem (nama_kunci, teks_nilai) VALUES (?, ?) ON DUPLICATE KEY UPDATE teks_nilai = ?',
                ['hero_welcome_title', konten, konten]
            );
            if (hero_font_color) {
                await pool.query(
                    'INSERT INTO konfigurasi_sistem (nama_kunci, teks_nilai) VALUES (?, ?) ON DUPLICATE KEY UPDATE teks_nilai = ?',
                    ['hero_font_color', hero_font_color, hero_font_color]
                );
            }
        } else if (id == 2) {
            await pool.query(
                'INSERT INTO konfigurasi_sistem (nama_kunci, teks_nilai) VALUES (?, ?) ON DUPLICATE KEY UPDATE teks_nilai = ?',
                ['hero_welcome_subtitle', konten, konten]
            );
        } else {
            const keyMap = { 3: 'motto', 4: 'semantics', 5: 'vision', 6: 'mission' };
            const key = keyMap[id];
            if (key) {
                await pool.query(
                    'INSERT INTO konfigurasi_sistem (nama_kunci, teks_nilai) VALUES (?, ?) ON DUPLICATE KEY UPDATE teks_nilai = ?',
                    [`about_${key}`, konten, konten]
                );
            }
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/about/:id', validateOwner, async (req, res) => {
    res.status(200).json({ success: true });
});

// [GALERI FOR INSTAGRAM FEED COMPATIBILITY]
app.get('/api/galeri', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT teks_nilai FROM konfigurasi_sistem WHERE nama_kunci = "instagram_gallery_images"');
        if (rows.length === 0) return res.json([]);
        res.json(JSON.parse(rows[0].teks_nilai || '[]'));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/galeri', validateOwner, async (req, res) => {
    try {
        const { path_gambar, link_instagram } = req.body;
        const [rows] = await pool.query('SELECT teks_nilai FROM konfigurasi_sistem WHERE nama_kunci = "instagram_gallery_images"');
        const images = rows.length > 0 ? JSON.parse(rows[0].teks_nilai || '[]') : [];
        
        const nextId = images.reduce((max, img) => img.id > max ? img.id : max, 0) + 1;
        images.push({ id: nextId, path_gambar, link_instagram: link_instagram || null });
        
        await pool.query(
            'INSERT INTO konfigurasi_sistem (nama_kunci, teks_nilai) VALUES (?, ?) ON DUPLICATE KEY UPDATE teks_nilai = ?',
            ['instagram_gallery_images', JSON.stringify(images), JSON.stringify(images)]
        );
        res.status(201).json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/galeri/:id', validateOwner, async (req, res) => {
    try {
        const { id } = req.params;
        const { path_gambar, link_instagram } = req.body;
        const [rows] = await pool.query('SELECT teks_nilai FROM konfigurasi_sistem WHERE nama_kunci = "instagram_gallery_images"');
        if (rows.length === 0) return res.status(404).json({ error: 'Gallery not found' });
        
        let images = JSON.parse(rows[0].teks_nilai || '[]');
        images = images.map(img => {
            if (img.id == id) {
                return { ...img, path_gambar, link_instagram: link_instagram || null };
            }
            return img;
        });
        
        await pool.query(
            'INSERT INTO konfigurasi_sistem (nama_kunci, teks_nilai) VALUES (?, ?) ON DUPLICATE KEY UPDATE teks_nilai = ?',
            ['instagram_gallery_images', JSON.stringify(images), JSON.stringify(images)]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/galeri/:id', validateOwner, async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT teks_nilai FROM konfigurasi_sistem WHERE nama_kunci = "instagram_gallery_images"');
        if (rows.length === 0) return res.status(404).json({ error: 'Gallery not found' });
        
        let images = JSON.parse(rows[0].teks_nilai || '[]');
        images = images.filter(img => img.id != id);
        
        await pool.query(
            'INSERT INTO konfigurasi_sistem (nama_kunci, teks_nilai) VALUES (?, ?) ON DUPLICATE KEY UPDATE teks_nilai = ?',
            ['instagram_gallery_images', JSON.stringify(images), JSON.stringify(images)]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// [API LOGIN - Matches configurations]
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ success: false, error: 'Username dan password wajib diisi.' });
        }
        const [rows] = await pool.query(
            'SELECT * FROM konfigurasi_sistem WHERE nama_kunci IN ("owner_username", "owner_password", "admin_username", "admin_password")'
        );
        const configMap = {};
        rows.forEach(r => { configMap[r.nama_kunci] = r.teks_nilai; });

        const ownerUsername = configMap.owner_username || 'owner';
        const ownerPassword = configMap.owner_password || 'owner123';
        const adminUsername = configMap.admin_username || 'admin';
        const adminPassword = configMap.admin_password || 'admin123';

        if (username === ownerUsername && password === ownerPassword) {
            return res.json({ success: true, role: 'owner' });
        } else if (username === adminUsername && password === adminPassword) {
            return res.json({ success: true, role: 'admin' });
        } else {
            return res.status(401).json({ success: false, error: 'Username atau password salah.' });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// [USERS AND LOGIN COMPATIBILITY]
app.get('/api/users', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM konfigurasi_sistem WHERE nama_kunci IN ("owner_username", "owner_display_name", "owner_avatar", "admin_username", "admin_display_name", "admin_avatar")');
        const usersMap = {};
        rows.forEach(r => { usersMap[r.nama_kunci] = r.teks_nilai; });
        const users = [
            {
                id: 1,
                username: usersMap.owner_username || 'owner',
                display_name: usersMap.owner_display_name || 'Owner Sparkling',
                avatar: usersMap.owner_avatar || '',
                role: 'owner'
            },
            {
                id: 2,
                username: usersMap.admin_username || 'admin',
                display_name: usersMap.admin_display_name || 'Admin Kasir',
                avatar: usersMap.admin_avatar || '',
                role: 'admin'
            }
        ];
        res.json(users);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { display_name, password, avatar } = req.body;
        const prefix = (id == 1) ? 'owner' : 'admin';
        
        await pool.query(
            'INSERT INTO konfigurasi_sistem (nama_kunci, teks_nilai) VALUES (?, ?) ON DUPLICATE KEY UPDATE teks_nilai = ?',
            [`${prefix}_display_name`, display_name, display_name]
        );
        if (avatar !== undefined && avatar !== null) {
            await pool.query(
                'INSERT INTO konfigurasi_sistem (nama_kunci, teks_nilai) VALUES (?, ?) ON DUPLICATE KEY UPDATE teks_nilai = ?',
                [`${prefix}_avatar`, avatar, avatar]
            );
        }
        if (password) {
            await pool.query(
                'INSERT INTO konfigurasi_sistem (nama_kunci, teks_nilai) VALUES (?, ?) ON DUPLICATE KEY UPDATE teks_nilai = ?',
                [`${prefix}_password`, password, password]
            );
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server ready on port ${PORT}`));
