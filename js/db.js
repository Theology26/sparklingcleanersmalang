// db.js - Backend API Wrapper with Robust Fallbacks and Global Sync

const API_BASE = 'http://localhost:3000/api';

const FALLBACKS = {
    config: {
        hero_welcome_title: "Laundry Sepatu & Helm Premium di Malang",
        hero_welcome_subtitle: "Kembalikan kilau sepatu kesayanganmu dengan teknologi deep clean terbaru kami.",
        hero_font_color: "#ffffff",
        whatsapp_admin_number: "6285965957290",
        instagram_url: "https://instagram.com/sparklingcleaners_mlg",
        business_address: "Jl. Jamuran Rt.06 Rw. 02 Dusun Jamoran, Desa Sukodadi, Kecamatan Wagir, Kabupaten Malang, Jawa Timur, Indonesia.",
        gmaps_iframe_url: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15802.215570059379!2d112.5855026601438!3d-8.044810756779491!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7882afb4455555%3A0xe6bf4dc34ac8c406!2sWagir%2C%20Malang%20Regency%2C%20East%20Java!5e0!3m2!1sen!2sid!4v1700000000000!5m2!1sen!2sid",
        workshop_dropoff_allowed: "false"
    },
    inventory: [
        { id: 'INV-001', name: 'Sabun Upper Cleaner', category: 'Soap', unit: 'Liter', price: 50000, stock: 5, min_stock: 2 }
    ]
};

const DB = {
    async call(endpoint, method = 'GET', data = null) {
        const options = {
            method,
            headers: { 
                'Content-Type': 'application/json',
                'X-User-Role': localStorage.getItem('role') || 'guest'
            },
            mode: 'cors',
            cache: 'no-store'
        };
        if (data) options.body = JSON.stringify(data);
        
        try {
            const resp = await fetch(`${API_BASE}${endpoint}`, options);
            const result = await resp.json();
            if (!resp.ok) {
                if (method === 'GET') return null;
                return { success: false, error: result.error || 'Terjadi kesalahan pada server.', code: result.code };
            }
            return result;
        } catch (err) {
            console.warn(`Koneksi Gagal (${endpoint}):`, err);
            return null;
        }
    },

    // [SERVICES CRUD] - Mapped to /api/layanan
    async getServices() {
        return (await this.call('/layanan')) || [];
    },
    async addService(service) {
        return await this.call('/layanan', 'POST', {
            id: service.id,
            name: service.name,
            category: service.category,
            treatment: service.treatment,
            price: service.price,
            estimation: service.estimation,
            description: service.description
        });
    },
    async updateService(id, service) {
        return await this.call(`/layanan/${id}`, 'PUT', {
            name: service.name,
            category: service.category,
            treatment: service.treatment,
            price: service.price,
            estimation: service.estimation,
            description: service.description
        });
    },
    async deleteService(id) {
        return await this.call(`/layanan/${id}`, 'DELETE');
    },

    // [GALERI CRUD] - Mapped to /api/galeri
    async getGaleri() {
        return (await this.call('/galeri')) || [];
    },
    async addGaleri(item) {
        return await this.call('/galeri', 'POST', item);
    },
    async updateGaleri(id, item) {
        return await this.call(`/galeri/${id}`, 'PUT', item);
    },
    async deleteGaleri(id) {
        return await this.call(`/galeri/${id}`, 'DELETE');
    },

    // [ABOUT CRUD] - Mapped to /api/about
    async getAbout() {
        return (await this.call('/about')) || [];
    },
    async updateAbout(id, item) {
        return await this.call(`/about/${id}`, 'PUT', item);
    },

    // [SYSTEM CONFIG - Mapped to /api/konfigurasi-sistem]
    async getSystemConfig() {
        return (await this.call('/konfigurasi-sistem')) || FALLBACKS.config;
    },
    async updateSystemConfig(key_name, value_text) {
        return await this.call('/konfigurasi-sistem', 'PUT', { key_name, value_text });
    },
    async updateSystemConfigs(payload) {
        return await this.call('/konfigurasi-sistem', 'PUT', payload);
    },

    // Backward compat layer for legacy config calls
    async getConfig() {
        return (await this.call('/config')) || FALLBACKS.config;
    },
    async getPricing() {
        const cfg = await this.getConfig();
        return cfg.pricing || { express: { "8 Jam": 20000, "18 Jam": 15000, "24 Jam": 10000 } };
    },
    async getWhatsAppNumber() {
        const cfg = await this.getSystemConfig();
        return cfg.whatsapp_admin_number || FALLBACKS.config.whatsapp_admin_number;
    },

    // [ORDERS] - Mapped to /api/pesanan
    async getOrders() {
        return (await this.call('/pesanan')) || [];
    },
    async addOrder(order) {
        return await this.call('/pesanan', 'POST', order);
    },
    async updateOrderStatus(id, status) {
        return await this.call(`/pesanan/${id}/status_proses`, 'PUT', { status });
    },
    async updateOrderPaymentStatus(id, lunas) {
        return await this.call(`/pesanan/${id}/status_pembayaran`, 'PUT', { lunas });
    },

    // [INVENTORY] - Mapped to /api/inventory (stored in konfigurasi_sistem as JSON)
    async getInventory() {
        return (await this.call('/inventory')) || FALLBACKS.inventory;
    },
    async addInventory(item) {
        return await this.call('/inventory', 'POST', item);
    },
    async updateInventoryDetails(id, item) {
        return await this.call(`/inventory/${id}/details`, 'PUT', item);
    },
    async updateInventory(id, amount, action) {
        return await this.call(`/inventory/${id}`, 'PUT', { amount, action });
    },
    async deleteInventory(id) {
        return await this.call(`/inventory/${id}`, 'DELETE');
    },

    // [FINANCE] - Mapped to /api/finance
    async getFinance() {
        return (await this.call('/finance')) || [];
    },

    // [RESTOCK] - Mapped to /api/restock (stored in konfigurasi_sistem as JSON)
    async getRestockRequests() {
        return (await this.call('/restock')) || [];
    },
    async addRestockRequest(itemId, qty, notes, role) {
        return await this.call('/restock', 'POST', { itemId, qty, notes, role });
    },
    async updateRestockStatus(id, status) {
        return await this.call(`/restock/${id}`, 'PUT', { status });
    },

    // [TESTIMONIALS] - Mapped to /api/testimoni
    async getTestimonials() {
        return (await this.call('/testimoni')) || [];
    },
    async addTestimonial(testimonial) {
        return await this.call('/testimoni', 'POST', testimonial);
    },
    async updateTestimonialStatus(id, status) {
        return await this.call(`/testimoni/${id}`, 'PUT', { status });
    },
    async deleteTestimonial(id) {
        return await this.call(`/testimoni/${id}`, 'DELETE');
    },

    // [REPAINT COLORS] - Mapped to /api/warna-repaint
    async getColors() {
        return (await this.call('/warna-repaint')) || [];
    },

    // [USERS] - Mapped to /api/users
    async getUsers() {
        return (await this.call('/users')) || [];
    },
    async updateUser(id, userData) {
        return await this.call(`/users/${id}`, 'PUT', userData);
    },

    // [GALERI] - Stored in konfigurasi_sistem
    async getGaleri() {
        const config = await this.getSystemConfig();
        if (config && config.instagram_gallery_images) {
            try { return JSON.parse(config.instagram_gallery_images); } catch(e){}
        }
        return [];
    },
    async addGaleri(item) {
        let items = await this.getGaleri();
        items.push(item);
        return await this.call('/system-config', 'PUT', { instagram_gallery_images: items });
    },
    async deleteGaleri(id) {
        let items = await this.getGaleri();
        items = items.filter(x => x.id != id);
        return await this.call('/system-config', 'PUT', { instagram_gallery_images: items });
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
    },

    // Global Metadata Synchronizer
    async renderFooterMeta() {
        const cfg = await this.getSystemConfig();
        if (!cfg) return;

        const whatsappNumber = cfg.whatsapp_admin_number || '6285965957290';
        const instagramUrl = cfg.instagram_url || 'https://instagram.com/sparklingcleaners_mlg';
        const businessAddress = cfg.business_address || 'Jl. Jamuran Rt.06 Rw. 02 Dusun Jamoran, Desa Sukodadi, Kecamatan Wagir, Kabupaten Malang, Jawa Timur, Indonesia.';
        const gmapsIframeUrl = cfg.gmaps_iframe_url || 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15802.215570059379!2d112.5855026601438!3d-8.044810756779491!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7882afb4455555%3A0xe6bf4dc34ac8c406!2sWagir%2C%20Malang%20Regency%2C%20East%20Java!5e0!3m2!1sen!2sid!4v1700000000000!5m2!1sen!2sid';

        // 1. WhatsApp link
        const waLink = document.getElementById('footerWaLink');
        if (waLink) {
            waLink.href = `https://wa.me/${whatsappNumber}`;
        }

        // 2. Instagram link
        const igLink = document.getElementById('footerIgLink');
        if (igLink) {
            igLink.href = instagramUrl;
            const handle = instagramUrl.split('/').filter(Boolean).pop() || 'sparklingcleaners_mlg';
            igLink.innerHTML = `<i class="fa-brands fa-instagram" style="margin-right:6px;"></i> @${handle}`;
        }

        // 3. Business Address
        const addressEl = document.getElementById('footerAddress');
        if (addressEl) {
            addressEl.innerHTML = `<strong style="color: var(--accent-yellow);">Workshop Wagir:</strong><br>${businessAddress}`;
        }

        // 4. Google Maps Iframe
        const iframeEl = document.getElementById('footerMapsIframe');
        if (iframeEl) {
            iframeEl.src = gmapsIframeUrl;
        }

        // 5. Generate Instagram QR Code using QRCode library
        const qrContainer = document.getElementById('ig-qr-code');
        if (qrContainer && typeof QRCode !== 'undefined') {
            qrContainer.innerHTML = '';
            new QRCode(qrContainer, {
                text: instagramUrl,
                width: 128,
                height: 128,
                colorDark : "#000000",
                colorLight : "#ffffff",
                correctLevel : QRCode.CorrectLevel.H
            });
        }
    }
};

window.DB = DB;

document.addEventListener('DOMContentLoaded', () => {
    DB.renderFooterMeta();
});
