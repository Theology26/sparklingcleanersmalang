// db.js
// Simulasi Database dan State Management menggunakan localStorage

const INITIAL_CONFIG = {
    heroTitle: "Spesialis Perawatan Barang Kesayangan Anda",
    heroSubtitle: "Aesthetic, Modern, dan Clean. Kami memberikan sentuhan magis untuk sepatu, tas, dan helm Anda hingga tampak seperti baru.",
    pricing: {
        regular: {
            shoes: { Small: 20000, Medium: 50000, Large: 65000, est: 3 },
            helmet: { "Half Face": 22000, "Full Face": 30000, est: 1 },
            bag_leather: { Small: 25000, Medium: 30000, Large: 35000, est: 1 },
            bag_fabric: { Small: 20000, Medium: 25000, Large: 30000, est: 2 }
        },
        special: {
            boots: { Small: 60000, Medium: 65000, Large: 80000, est: 3 },
            suede: { Small: 50000, Medium: 60000, Large: 70000, est: 5 },
            dress_shoes: { Small: 55000, Medium: 60000, Large: 65000, est: 3 },
            repaint_p: { Upper: 80000, Midsole: 50000, Outsole: 40000, Insole: 30000, est: 10 },
            repaint_s: { Upper: 100000, Midsole: 63000, Outsole: 50000, Insole: 38000, est: 10 },
            repaint_suede: { Upper: 120000, Midsole: 75000, Outsole: 60000, Insole: 45000, est: 10 },
            liquid_remover: { Shoes: 15000, "Small Bag Fabric": 5000, est: 10 },
            unyellowing: { Shoes: 20000, est: 10 },
            canvas_whitener: { Shoes: 20000, est: 10 },
            leather_filler: { Shoes: 25000, est: 10 }
        },
        express: {
            "8 Jam": 20000,
            "18 Jam": 15000,
            "24 Jam": 10000
        }
    }
};

const INITIAL_INVENTORY = [
    { id: 'INV-1', name: 'Sabun Upper', category: 'Cair', unit: 'Liter', price: 50000, stock: 5, minStock: 2 },
    { id: 'INV-2', name: 'Parfum Sepatu', category: 'Cair', unit: 'Liter', price: 80000, stock: 1, minStock: 2 },
    { id: 'INV-3', name: 'Sikat Kuda', category: 'Alat', unit: 'Pcs', price: 15000, stock: 10, minStock: 5 },
    { id: 'INV-4', name: 'Plastik Packing', category: 'Habis Pakai', unit: 'Pcs', price: 500, stock: 100, minStock: 50 }
];

const INITIAL_ARTICLES = [
    { id: 'ART-1', title: 'Cara Jitu Menghilangkan Noda Kuning di Sepatu Minimalis Putih', category: 'Perawatan Sepatu', status: 'Publik', views: 1200, image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614c3a?w=500', desc: 'Noda menguning sering terjadi pada sol akibat oksidasi suhu. Inilah rahasianya...' },
    { id: 'ART-2', title: 'Perhatikan 3 Hal Ini Sebelum Mencuci Tas Kulit Asli Anda!', category: 'Perawatan Tas', status: 'Publik', views: 850, image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500', desc: 'Mencuci tas kulit butuh perlakuan khusus agar permukaannya tidak retak (crack).' },
    { id: 'ART-3', title: 'Bahaya Bakteri Keringat Berlebih Pada Busa Helm Kesayangan', category: 'Perawatan Helm', status: 'Publik', views: 920, image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=500', desc: 'Busa helm basah adalah sarang bagi ribuan bakteri yang sering memicu gatal rambut.' }
];

// Inisialisasi Database
function initDB() {
    if (!localStorage.getItem('sparklingOrders')) localStorage.setItem('sparklingOrders', JSON.stringify([]));
    if (!localStorage.getItem('sparklingFinance')) localStorage.setItem('sparklingFinance', JSON.stringify([]));
    if (!localStorage.getItem('sparklingInventory')) localStorage.setItem('sparklingInventory', JSON.stringify(INITIAL_INVENTORY));
    if (!localStorage.getItem('sparklingPurchaseHistory')) localStorage.setItem('sparklingPurchaseHistory', JSON.stringify([]));
    if (!localStorage.getItem('sparklingTestimonials')) localStorage.setItem('sparklingTestimonials', JSON.stringify([]));
    if (!localStorage.getItem('sparklingArticles')) localStorage.setItem('sparklingArticles', JSON.stringify(INITIAL_ARTICLES));
    if (!localStorage.getItem('sparklingConfig')) localStorage.setItem('sparklingConfig', JSON.stringify(INITIAL_CONFIG));
    if (!localStorage.getItem('sparklingRestockRequests')) localStorage.setItem('sparklingRestockRequests', JSON.stringify([]));
}

// Helpers
const DB = {
    get: (key) => JSON.parse(localStorage.getItem(key) || '[]'),
    set: (key, data) => localStorage.setItem(key, JSON.stringify(data)),
    
    // Config System
    getConfig: () => {
        let config = localStorage.getItem('sparklingConfig');
        return config ? JSON.parse(config) : INITIAL_CONFIG;
    },
    getPricing: () => {
        return DB.getConfig().pricing;
    },
    updateConfig: (newConfig) => {
        DB.set('sparklingConfig', newConfig);
    },

    // Order System
    generateOrderCode: () => {
        const date = new Date();
        const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
        const orders = DB.get('sparklingOrders');
        const todayOrders = orders.filter(o => o.id.includes(dateStr));
        const seq = String(todayOrders.length + 1).padStart(3, '0');
        return `SPK-${dateStr}-${seq}`;
    },
    
    addOrder: (orderData) => {
        const orders = DB.get('sparklingOrders');
        const newOrder = {
            ...orderData,
            id: DB.generateOrderCode(),
            date: new Date().toISOString(),
            status: 1 // 1: Diterima, 2: Treatment, 3: Kering, 4: Finishing, 5: Siap
        };
        orders.unshift(newOrder);
        DB.set('sparklingOrders', orders);
        
        // Catat ke keuangan jika status pembayaran selesai atau DP (sementara asumsikan tercatat sebagai order masuk)
        DB.addFinance(newOrder);
        return newOrder;
    },
    
    updateOrderStatus: (id, status) => {
        const orders = DB.get('sparklingOrders');
        const idx = orders.findIndex(o => o.id === id);
        if (idx > -1) {
            orders[idx].status = parseInt(status);
            DB.set('sparklingOrders', orders);
            return true;
        }
        return false;
    },

    // Finance System
    addFinance: (order) => {
        const finance = DB.get('sparklingFinance');
        finance.unshift({
            id: 'TRX-' + order.id,
            orderId: order.id,
            date: order.date,
            customerName: order.name,
            phone: order.phone,
            itemType: order.itemType,
            qty: order.qty,
            service: order.service,
            treatment: order.treatment,
            price: order.price,
            ongkir: order.ongkir,
            total: order.total,
            status: 'Belum Lunas'
        });
        DB.set('sparklingFinance', finance);
    },

    // Inventory System
    updateInventoryStock: (id, change, isManual = false, reason = '') => {
        const inv = DB.get('sparklingInventory');
        const idx = inv.findIndex(i => i.id === id);
        if (idx > -1) {
            inv[idx].stock += parseFloat(change);
            DB.set('sparklingInventory', inv);
            return true;
        }
        return false;
    },

    addPurchaseHistory: (purchase) => {
        const history = DB.get('sparklingPurchaseHistory');
        history.unshift({
            ...purchase,
            id: 'PUR-' + Date.now(),
            date: new Date().toISOString()
        });
        DB.set('sparklingPurchaseHistory', history);
        
        // Update stock
        DB.updateInventoryStock(purchase.itemId, purchase.qty);
    },

    addRestockRequest: (itemId, qty, notes, requestedBy) => {
        const requests = DB.get('sparklingRestockRequests');
        const inv = DB.get('sparklingInventory').find(i => i.id === itemId);
        const newReq = {
            id: 'REQ-' + Date.now(),
            date: new Date().toISOString(),
            itemId: itemId,
            itemName: inv ? inv.name : 'Unknown',
            qty: parseFloat(qty),
            notes: notes,
            requestedBy: requestedBy,
            status: 'Pending' // Pending, Approved, Rejected
        };
        requests.unshift(newReq);
        DB.set('sparklingRestockRequests', requests);
        return newReq;
    },

    approveRestockRequest: (reqId, totalCost) => {
        const requests = DB.get('sparklingRestockRequests');
        const reqIdx = requests.findIndex(r => r.id === reqId);
        if (reqIdx > -1 && requests[reqIdx].status === 'Pending') {
            requests[reqIdx].status = 'Approved';
            requests[reqIdx].totalCost = totalCost;
            DB.set('sparklingRestockRequests', requests);
            
            // Add to purchase history which also updates stock
            DB.addPurchaseHistory({
                itemId: requests[reqIdx].itemId,
                itemName: requests[reqIdx].itemName,
                qty: requests[reqIdx].qty,
                totalCost: parseFloat(totalCost)
            });
            
            // Deduct finance
            const finance = DB.get('sparklingFinance');
            finance.unshift({
                id: 'EXP-' + Date.now(),
                orderId: requests[reqIdx].id,
                date: new Date().toISOString(),
                customerName: 'PENGELUARAN RESTOK',
                service: `Restok: ${requests[reqIdx].itemName} (${requests[reqIdx].qty})`,
                total: -parseFloat(totalCost),
                status: 'Lunas'
            });
            DB.set('sparklingFinance', finance);
            return true;
        }
        return false;
    },

    rejectRestockRequest: (reqId, reason) => {
        const requests = DB.get('sparklingRestockRequests');
        const reqIdx = requests.findIndex(r => r.id === reqId);
        if (reqIdx > -1 && requests[reqIdx].status === 'Pending') {
            requests[reqIdx].status = 'Rejected';
            requests[reqIdx].rejectReason = reason;
            DB.set('sparklingRestockRequests', requests);
            return true;
        }
        return false;
    },

    // Utils
    formatCurrency: (num) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
    },
    
    formatDate: (isoString) => {
        const d = new Date(isoString);
        return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    }
};

// Jalankan inisialisasi saat script dimuat
initDB();
