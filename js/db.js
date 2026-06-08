// db.js - Backend API Wrapper with Robust Fallbacks and Global Sync

const API_BASE = '/api';

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
        const token = localStorage.getItem('token');
        const options = {
            method,
            headers: { 
                'Content-Type': 'application/json'
            },
            mode: 'cors',
            cache: 'no-store'
        };
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }
        if (data) options.body = JSON.stringify(data);
        
        try {
            const resp = await fetch(`${API_BASE}${endpoint}`, options);
            
            // Check for 401 Unauthorized / Token Expired
            if (resp.status === 401) {
                // Do not intercept if it's the login endpoint to allow normal error reporting
                if (!endpoint.includes('/login')) {
                    console.warn('Session expired or unauthorized. Redirecting to login...');
                    localStorage.clear();
                    window.location.href = '/login.html';
                    return null;
                }
            }
            
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

    async getRingkasan() {
        return (await this.call('/ringkasan')) || {
            total_pesanan: 0,
            pesanan_selesai: 0,
            rasio_penyelesaian: 0,
            pendapatan_bersih: 0,
            breakdown_kategori: { Sepatu: 0, Helm: 0, Tas: 0 },
            breakdown_delivery: { antar_jemput: 0, drop_off: 0 },
            stok_rata_persen: 0
        };
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
            description: service.description,
            image: service.image,
            additional_images: service.additional_images,
            id_kategori: service.id_kategori
        });
    },
    async updateService(id, service) {
        return await this.call(`/layanan/${id}`, 'PUT', {
            name: service.name,
            category: service.category,
            treatment: service.treatment,
            price: service.price,
            estimation: service.estimation,
            description: service.description,
            image: service.image,
            additional_images: service.additional_images,
            id_kategori: service.id_kategori
        });
    },
    async deleteService(id) {
        return await this.call(`/layanan/${id}`, 'DELETE');
    },

    // Kategori Layanan
    async getKategoriLayanan() {
      return (await this.call('/kategori-layanan')) || [];
    },
    async getAllKategoriLayanan() {
      return (await this.call('/kategori-layanan/all')) || [];
    },
    async addKategori(data) {
      return await this.call('/kategori-layanan', 'POST', data);
    },
    async updateKategori(id, data) {
      return await this.call(`/kategori-layanan/${id}`, 'PUT', data);
    },
    async deleteKategori(id) {
      return await this.call(`/kategori-layanan/${id}`, 'DELETE');
    },
    async getLayananByKategori(idKategori) {
      return (await this.call(`/layanan/kategori/${idKategori}`)) || [];
    },

    // Additional Service
    async getAdditionalService() {
      return (await this.call('/additional-service')) || [];
    },
    async getAdditionalByLayanan(idLayanan) {
      return (await this.call(`/additional-service/layanan/${idLayanan}`)) || [];
    },
    async addAdditionalService(data) {
      return await this.call('/additional-service', 'POST', data);
    },
    async updateAdditionalService(id, data) {
      return await this.call(`/additional-service/${id}`, 'PUT', data);
    },
    async deleteAdditionalService(id) {
      return await this.call(`/additional-service/${id}`, 'DELETE');
    },
    async setLayananAdditional(idLayanan, additionalIds) {
      return await this.call(`/layanan/${idLayanan}/additional`, 'POST', { additional_ids: additionalIds });
    },

    async getRiwayatCustomer(q) {
      return (await this.call(`/riwayat-customer?q=${encodeURIComponent(q)}`)) || {
        customer: null, total_transaksi: 0, total_omset: 0, pesanan: []
      };
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

// --- GLOBAL FETCH INTERCEPTOR FOR DIRECT AJAX CALLS ---
// Overrides the standard window.fetch to automatically inject the Bearer token,
// strip any legacy 'X-User-Role' headers, and handle 401 Session Expiration globally.
(function() {
    const originalFetch = window.fetch;
    window.fetch = async function(resource, init) {
        let url = typeof resource === 'string' ? resource : (resource && resource.url);
        
        if (url && (url.startsWith('/api/') || url.includes('/api/'))) {
            init = init || {};
            init.headers = init.headers || {};
            
            // Clean up legacy X-User-Role header to prevent spoofing warnings
            if (init.headers instanceof Headers) {
                init.headers.delete('x-user-role');
            } else if (Array.isArray(init.headers)) {
                init.headers = init.headers.filter(([k]) => k.toLowerCase() !== 'x-user-role');
            } else {
                delete init.headers['X-User-Role'];
                delete init.headers['x-user-role'];
            }
            
            // Inject new crypto Token
            const token = localStorage.getItem('token');
            if (token) {
                if (init.headers instanceof Headers) {
                    if (!init.headers.has('Authorization')) {
                        init.headers.set('Authorization', `Bearer ${token}`);
                    }
                } else if (Array.isArray(init.headers)) {
                    if (!init.headers.some(([k]) => k.toLowerCase() === 'authorization')) {
                        init.headers.push(['Authorization', `Bearer ${token}`]);
                    }
                } else {
                    let hasAuth = false;
                    for (const key of Object.keys(init.headers)) {
                        if (key.toLowerCase() === 'authorization') {
                            hasAuth = true;
                            break;
                        }
                    }
                    if (!hasAuth) {
                        init.headers['Authorization'] = `Bearer ${token}`;
                    }
                }
            }
        }
        
        try {
            const response = await originalFetch(resource, init);
            if (response.status === 401 && url && (url.startsWith('/api/') || url.includes('/api/'))) {
                // Ignore login endpoint 401 to let the login page show standard auth failed error
                if (!url.endsWith('/api/login')) {
                    console.warn('[AUTH] Unauthorized access. Clearing local storage and redirecting to login...');
                    localStorage.clear();
                    window.location.href = '/login.html';
                }
            }
            return response;
        } catch (err) {
            throw err;
        }
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    DB.renderFooterMeta();
});
