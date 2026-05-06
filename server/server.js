const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }));
app.use(express.json());

// Root path for static files
const rootDir = path.resolve(__dirname, '..');
app.use(express.static(rootDir));

// Friendly Routes for SPA
app.get('/', (req, res) => res.sendFile(path.join(rootDir, 'index.html')));
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

// --- API ENDPOINTS ---

// [ORDERS]
app.get('/api/orders', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM orders ORDER BY date DESC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/orders', async (req, res) => {
    try {
        const o = req.body;
        const sql = `INSERT INTO orders (id, name, phone, item_type, qty, treatment, service, express, delivery, address, distance, schedule, notes, price, express_price, ongkir, total, status) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        await pool.query(sql, [o.id, o.name, o.phone, o.item_type, o.qty, o.treatment, o.service, o.express, o.delivery, o.address, o.distance, o.schedule, o.notes, o.price, o.express_price, o.ongkir, o.total, o.status || 1]);
        res.status(201).json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/orders/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
        
        if (status == 6) { // Selesai
            const [order] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
            if (order.length > 0) {
                const o = order[0];
                await pool.query(
                    'INSERT IGNORE INTO finance (id, order_id, customer_name, phone, item_type, qty, service, treatment, price, ongkir, total, status) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [o.id, o.name, o.phone, o.item_type, o.qty, o.service, o.treatment, o.price, o.ongkir, o.total, 'Lunas']
                );
            }
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// [INVENTORY]
app.get('/api/inventory', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM inventory');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/inventory/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, action } = req.body;
        const val = parseFloat(amount);
        if (action === 'add') {
            await pool.query('UPDATE inventory SET stock = stock + ? WHERE id = ?', [val, id]);
        } else {
            await pool.query('UPDATE inventory SET stock = stock - ? WHERE id = ?', [val, id]);
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// [RESTOCK]
app.get('/api/restock', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM restock_requests ORDER BY date DESC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/restock', async (req, res) => {
    try {
        const { itemId, qty, notes, role } = req.body;
        const id = `REQ-${Date.now()}`;
        await pool.query(
            'INSERT INTO restock_requests (id, itemId, qty, notes, role, status) VALUES (?, ?, ?, ?, ?, ?)',
            [id, itemId, parseFloat(qty), notes, role, 'Pending']
        );
        res.status(201).json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/restock/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (status === 'Completed') {
            const [reqs] = await pool.query('SELECT itemId, qty FROM restock_requests WHERE id = ?', [id]);
            if (reqs.length > 0) {
                const { itemId, qty } = reqs[0];
                await pool.query('UPDATE inventory SET stock = stock + ? WHERE id = ?', [parseFloat(qty), itemId]);
            }
        }
        await pool.query('UPDATE restock_requests SET status = ? WHERE id = ?', [status, id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// [FINANCE, ARTICLES, TESTIMONIALS]
app.get('/api/finance', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM finance ORDER BY date DESC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/articles', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM articles ORDER BY date DESC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/articles', async (req, res) => {
    try {
        const a = req.body;
        await pool.query('INSERT INTO articles (id, title, category, status, image, content) VALUES (?, ?, ?, ?, ?, ?)', [a.id, a.title, a.category, a.status, a.image, a.content]);
        res.status(201).json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/testimonials', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM testimonials ORDER BY id DESC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/testimonials/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await pool.query('UPDATE testimonials SET status = ? WHERE id = ?', [status, id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// [CONFIG]
app.get('/api/config', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM config');
        const config = {};
        rows.forEach(r => { config[r.cfg_key] = JSON.parse(r.cfg_value); });
        res.json(config);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/config', async (req, res) => {
    try {
        const data = req.body;
        for (const [key, val] of Object.entries(data)) {
            await pool.query('INSERT INTO config (cfg_key, cfg_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE cfg_value = ?', [key, JSON.stringify(val), JSON.stringify(val)]);
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server ready on port ${PORT}`));
