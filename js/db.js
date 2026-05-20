// db.js - Backend API Wrapper with Robust Fallbacks

const API_BASE = 'http://localhost:3000/api';

const FALLBACKS = {
    config: {
        hero: {
            title: "Spesialis Perawatan Barang Kesayangan Anda",
            subtitle: "Aesthetic, Modern, dan Clean. Kami memberikan sentuhan magis untuk sepatu, tas, dan helm Anda hingga tampak seperti baru."
        },
        pricing: {
            regShoes: { Small: 30000, Medium: 35000, Large: 40000 },
            regHelmet: { HalfFace: 25000, FullFace: 30000 },
            express: { "8h": 15000, "18h": 10000, "24h": 5000 }
        }
    },
    inventory: [
        { id: 'INV-1', name: 'Sabun Upper', category: 'Cair', unit: 'Liter', price: 50000, stock: 5, minStock: 2 }
    ],
    articles: [
        { id: 'ART-1', title: 'Cara Jitu Menghilangkan Noda', category: 'Sepatu', status: 'Publik', desc: 'Noda menguning sering terjadi...', image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614c3a?w=500' }
    ]
};

const DB = {
    async call(endpoint, method = 'GET', data = null) {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' },
            mode: 'cors',
            cache: 'no-store'
        };
        if (data) options.body = JSON.stringify(data);
        
        try {
            const resp = await fetch(`${API_BASE}${endpoint}`, options);
            const result = await resp.json();
            if (!resp.ok) {
                // GET gagal → return null agar fallback aktif
                // POST/PUT/DELETE gagal → return objek error agar bisa ditampilkan
                if (method === 'GET') return null;
                return { success: false, error: result.error || 'Terjadi kesalahan pada server.', code: result.code };
            }
            return result;
        } catch (err) {
            console.warn(`Koneksi Gagal (${endpoint}):`, err);
            return null;
        }
    },

    async getConfig() {
        return (await this.call('/config')) || FALLBACKS.config;
    },
    async getPricing() {
        const cfg = await this.getConfig();
        return cfg.pricing || FALLBACKS.config.pricing;
    },
    async getOrders() {
        return (await this.call('/orders')) || [];
    },
    async addOrder(order) {
        return await this.call('/orders', 'POST', order);
    },
    async updateOrderStatus(id, status) {
        return await this.call(`/orders/${id}/status`, 'PUT', { status });
    },
    async getInventory() {
        return (await this.call('/inventory')) || FALLBACKS.inventory;
    },
    async getFinance() {
        return (await this.call('/finance')) || [];
    },
    async getArticles() {
        return (await this.call('/articles')) || FALLBACKS.articles;
    },
    async addArticle(article) {
        return await this.call('/articles', 'POST', article);
    },
    async deleteArticle(id) {
        return await this.call(`/articles/${id}`, 'DELETE');
    },
    async updateArticle(id, article) {
        return await this.call(`/articles/${id}`, 'PUT', article);
    },
    async getRestockRequests() {
        return (await this.call('/restock')) || [];
    },
    async addRestockRequest(itemId, qty, notes, role) {
        return await this.call('/restock', 'POST', { itemId, qty, notes, role });
    },
    async updateRestockStatus(id, status) {
        return await this.call(`/restock/${id}`, 'PUT', { status });
    },
    async updateInventory(id, amount, action) {
        return await this.call(`/inventory/${id}`, 'PUT', { amount, action });
    },
    async getTestimonials() {
        return (await this.call('/testimonials')) || [];
    },
    async addTestimonial(testimonial) {
        return await this.call('/testimonials', 'POST', testimonial);
    },
    async updateTestimonialStatus(id, status) {
        return await this.call(`/testimonials/${id}`, 'PUT', { status });
    },
    async saveConfig(config) {
        return await this.call('/config', 'POST', config);
    },

    // UI Helpers
    formatCurrency: (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num),
    formatDate: (isoString) => {
        if(!isoString) return '-';
        const d = new Date(isoString);
        return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    },
    sanitize: (str) => {
        if (typeof str !== 'string') return str;
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },
    generateOrderCode: () => {
        const date = new Date();
        const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
        return `SPK-${dateStr}-${Math.floor(Math.random() * 900) + 100}`;
    }
};

window.DB = DB;
