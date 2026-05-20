// db.js - Backend API Wrapper with Robust Fallbacks

const API_BASE = 'http://localhost:3000/api';

const FALLBACKS = {
    config: {
        heroTitle: "Spesialis Perawatan Barang Kesayangan Anda",
        heroSubtitle: "Aesthetic, Modern, dan Clean.",
        pricing: {
            regular: {
                shoes: { Small: 20000, Medium: 30000, Large: 35000, est: "3 Hari" },
                helmet: { "Half Face": 22000, "Full Face": 30000, est: "24 Jam" },
                bag_leather: { Small: 25000, Medium: 30000, Large: 35000, est: "24 Jam" },
                bag_fabric: { Small: 20000, Medium: 25000, Large: 30000, est: "2 Hari" }
            },
            special: {
                boots: { Small: 59000, Medium: 65000, Large: 80000, est: "3 Hari" },
                suede: { Small: 50000, Medium: 60000, Large: 70000, est: "5 Hari" },
                dress_shoes: { Small: 55000, Medium: 60000, Large: 65000, est: "3 Hari" },
                repaint_p: { Upper: 80000, Midsole: 50000, Outsole: 40000, Insole: 30000, est: "10 Hari" },
                repaint_s: { Upper: 100000, Midsole: 63000, Outsole: 50000, Insole: 38000, est: "10 Hari" },
                repaint_suede: { Upper: 120000, Midsole: 75000, Outsole: 60000, Insole: 45000, est: "10 Hari" },
                extra: {
                    "Liquid Remover Sepatu": 15000,
                    "Liquid Remover Tas": 5000,
                    "Unyellowing": 20000,
                    "Canvas Cleaner": 20000,
                    "Leather Filler": 25000
                }
            },
            express: { "8 Jam": 20000, "18 Jam": 15000, "24 Jam": 10000 }
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
            mode: 'cors'
        };
        if (data) options.body = JSON.stringify(data);
        
        try {
            const resp = await fetch(`${API_BASE}${endpoint}`, options);
            if (!resp.ok) throw new Error('API Error');
            return await resp.json();
        } catch (err) {
            console.warn(`API Offline (${endpoint}), using local fallback.`);
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
    async addInventory(item) {
        return await this.call('/inventory', 'POST', item);
    },
    async updateInventoryDetails(id, item) {
        return await this.call(`/inventory/${id}/details`, 'PUT', item);
    },
    async deleteInventory(id) {
        return await this.call(`/inventory/${id}`, 'DELETE');
    },
    async getTestimonials() {
        return (await this.call('/testimonials')) || [];
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
