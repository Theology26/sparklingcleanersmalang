// dashboard.js - PRODUCTION GRADE LOGIC
console.log("Dashboard JS Loaded");

window.onload = async () => {
    const userRole = localStorage.getItem('userRole') || 'admin';
    setupTabs();
    switchRole(userRole);
    await loadDashboardData(userRole);
};

async function loadDashboardData(role) {
    const jobs = [
        safeRender(renderOrders, "Orders"),
        safeRender(renderRestock, "Restock")
    ];
    if (role === 'owner') {
        jobs.push(
            safeRender(renderFinance, "Finance"),
            safeRender(renderInventory, "Inventory"),
            safeRender(renderCatalog, "Catalog"),
            safeRender(renderArticles, "Articles"),
            safeRender(renderTestimonials, "Testimonials"),
            safeRender(renderSettings, "Settings")
        );
    }
    await Promise.allSettled(jobs);
}

async function safeRender(fn, name) {
    try { await fn(); } catch (err) { console.error(`Render ${name} failed:`, err); }
}

function setupTabs() {
    const menuItems = document.querySelectorAll('.menu-item[data-target]');
    const tabContents = document.querySelectorAll('.tab-content');
    menuItems.forEach(item => {
        item.onclick = function() {
            const targetId = this.getAttribute('data-target');
            menuItems.forEach(m => m.classList.remove('active'));
            tabContents.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            const target = document.getElementById(targetId);
            if (target) target.classList.add('active');
        };
    });
}

function switchRole(role) {
    const ownerSection = document.getElementById('ownerMenuSection');
    const activeRoleText = document.getElementById('activeRoleText');
    if (ownerSection) ownerSection.style.display = (role === 'owner' ? 'block' : 'none');
    if (activeRoleText) activeRoleText.innerText = (role === 'owner' ? "Mode: Owner (Superadmin)" : "Mode: Admin Operasional");
}

// [ORDERS]
async function renderOrders() {
    const orders = await DB.getOrders();
    const tbody = document.querySelector('#tab-orders tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    const statusText = ['Unknown', 'Diterima', 'Treatment', 'Kering', 'Finishing', 'Siap Ambil', 'Selesai'];
    const statusClasses = ['unknown', 'diterima', 'treatment', 'kering', 'finishing', 'siap', 'selesai'];
    orders.forEach(o => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>#${o.id}</td><td>${DB.formatDate(o.date)}</td><td><strong>${o.name}</strong></td><td>${o.item_type} (${o.service})</td><td><span class="status-badge status-${statusClasses[o.status || 1]}">${statusText[o.status || 1]}</span></td><td><button class="btn btn-primary" style="padding:4px 8px;" onclick="window.updateProgressModal('${o.id}', ${o.status || 1})"><i class="fa-solid fa-pen"></i></button></td>`;
        tbody.appendChild(tr);
    });
}

// [INVENTORY]
async function renderInventory() {
    const inv = await DB.getInventory();
    const tbody = document.getElementById('inventoryList');
    if (!tbody) return;
    tbody.innerHTML = '';
    inv.forEach(i => {
        let warningClass = '';
        if (parseFloat(i.stock) <= 0) warningClass = 'stock-critical';
        else if (parseFloat(i.stock) <= parseFloat(i.min_stock)) warningClass = 'stock-warning';
        
        const tr = document.createElement('tr');
        if(warningClass) tr.className = warningClass;
        tr.innerHTML = `<td>${i.id}</td><td>${i.name}</td><td><strong>${i.stock} ${i.unit}</strong></td><td>${DB.formatCurrency(i.price)}</td><td><button class="btn btn-primary" style="padding:5px 10px;" onclick="window.useInventory('${i.id}')">Pakai</button></td>`;
        tbody.appendChild(tr);
    });
}

window.useInventory = async function(id) {
    const amount = prompt("Berapa jumlah yang digunakan?");
    if (!amount || isNaN(amount)) return;
    const res = await DB.updateInventory(id, amount, 'subtract');
    if (res && res.success) { renderInventory(); } else { alert("Gagal update stok."); }
};

// [RESTOCK]
async function renderRestock() {
    const inv = await DB.getInventory();
    const select = document.getElementById('restockItem');
    if(select) {
        select.innerHTML = '<option value="">- Pilih Barang -</option>';
        inv.forEach(i => { select.innerHTML += `<option value="${i.id}">${i.name} (Sisa: ${i.stock})</option>`; });
    }
    
    const requests = (await DB.getRestockRequests()).filter(r => r.status === 'Pending');
    const statusContainer = document.querySelector('#tab-admin-restock .grid-2 > div:last-child');
    if (statusContainer) {
        const listDiv = statusContainer.querySelector('div:last-child');
        listDiv.innerHTML = '';
        requests.forEach(r => {
            const card = document.createElement('div');
            card.className = 'glass-card';
            card.style.padding = '1.2rem';
            card.style.marginBottom = '10px';
            card.style.borderLeft = '4px solid var(--accent-yellow)';
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong>REQ: ${r.itemId} (${r.qty})</strong>
                        <p style="font-size:0.8rem; color:var(--text-muted); margin-top:5px;">${r.notes}</p>
                    </div>
                    <button class="btn btn-primary" style="padding:6px 15px; font-size:0.75rem;" onclick="window.approveRestock('${r.id}')">Selesaikan</button>
                </div>
            `;
            listDiv.appendChild(card);
        });
    }
}

window.approveRestock = async function(id) {
    if(confirm("Apakah barang sudah datang dan stok sudah bertambah?")) {
        const res = await DB.updateRestockStatus(id, 'Completed');
        if(res && res.success) { 
            alert("Stok berhasil ditambahkan otomatis!");
            renderRestock(); 
            renderInventory(); 
        }
    }
};

// [TESTIMONIALS]
async function renderTestimonials() {
    const tests = await DB.getTestimonials();
    const tbody = document.querySelector('#tab-testimonials tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    tests.forEach(t => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td><strong>${t.name}</strong></td><td>${'⭐'.repeat(t.rating)}</td><td>"${t.content}"</td><td>${t.status === 'Pending' ? `<button class="btn" style="background:#2ecc71; color:white;" onclick="window.moderateTestimonial(${t.id}, 'Approved')">Acc</button>` : `<span style="color:#2ecc71; font-weight:700;">LIVE</span>`}</td>`;
        tbody.appendChild(tr);
    });
}

window.moderateTestimonial = async function(id, status) {
    const res = await DB.updateTestimonialStatus(id, status);
    if(res && res.success) renderTestimonials();
};

// [ARTICLES]
async function renderArticles() {
    const articles = await DB.getArticles();
    const tbody = document.querySelector('#tab-articles tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    articles.forEach(a => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${a.title}</td><td>${a.category}</td><td><span class="status-badge">${a.status}</span></td><td><button class="btn btn-primary" style="padding:4px 8px;" onclick="window.editArticle('${a.id}')"><i class="fa-solid fa-pen-to-square"></i></button> <button class="btn" style="padding:4px 8px; background:#e74c3c; color:white;" onclick="window.deleteArticle('${a.id}')"><i class="fa-solid fa-trash"></i></button></td>`;
        tbody.appendChild(tr);
    });
}

window.editArticle = async function(id) {
    const articles = await DB.getArticles();
    const a = articles.find(x => x.id === id);
    if (!a) return;
    document.getElementById('artTitle').value = a.title;
    document.getElementById('artCategory').value = a.category;
    document.getElementById('artImage').value = a.image;
    document.getElementById('artContent').value = a.content;
    document.getElementById('articleId').value = a.id;
    // Scroll to form or switch focus
    alert("Data artikel telah dimuat ke form di atas.");
};

window.deleteArticle = async function(id) {
    if(confirm("Hapus artikel ini?")) {
        const res = await DB.deleteArticle(id);
        if(res && res.success) renderArticles();
    }
};

// [SETTINGS & CONFIG]
async function renderSettings() {
    const config = await DB.getConfig();
    if (!config) return;
    const hero = config.hero || {};
    if (document.getElementById('configHeroTitle')) document.getElementById('configHeroTitle').value = hero.title || '';
    if (document.getElementById('configHeroSubtitle')) document.getElementById('configHeroSubtitle').value = hero.subtitle || '';
    
    const p = config.pricing || {};
    if (p.regShoes) {
        document.getElementById('price-reg-shoes-Small').value = p.regShoes.Small || 0;
        document.getElementById('price-reg-shoes-Medium').value = p.regShoes.Medium || 0;
        document.getElementById('price-reg-shoes-Large').value = p.regShoes.Large || 0;
    }
    if (p.regHelmet) {
        document.getElementById('price-reg-helmet-HalfFace').value = p.regHelmet.HalfFace || 0;
        document.getElementById('price-reg-helmet-FullFace').value = p.regHelmet.FullFace || 0;
    }
    if (p.express) {
        document.getElementById('price-exp-8').value = p.express["8h"] || 0;
        document.getElementById('price-exp-18').value = p.express["18h"] || 0;
        document.getElementById('price-exp-24').value = p.express["24h"] || 0;
    }
}

window.saveAllSettings = async function() {
    const config = {
        hero: {
            title: document.getElementById('configHeroTitle').value,
            subtitle: document.getElementById('configHeroSubtitle').value
        },
        pricing: {
            regShoes: { Small: parseInt(document.getElementById('price-reg-shoes-Small').value), Medium: parseInt(document.getElementById('price-reg-shoes-Medium').value), Large: parseInt(document.getElementById('price-reg-shoes-Large').value) },
            regHelmet: { HalfFace: parseInt(document.getElementById('price-reg-helmet-HalfFace').value), FullFace: parseInt(document.getElementById('price-reg-helmet-FullFace').value) },
            express: { "8h": parseInt(document.getElementById('price-exp-8').value), "18h": parseInt(document.getElementById('price-exp-18').value), "24h": parseInt(document.getElementById('price-exp-24').value) }
        }
    };
    const res = await DB.saveConfig(config);
    if (res && res.success) { alert("Pengaturan Website Berhasil Disimpan!"); window.location.reload(); } else { alert("Gagal menyimpan."); }
};

// [FINANCE]
async function renderFinance() {
    const finance = (await DB.getFinance()) || [];
    const lunas = finance.filter(f => f.status === 'Lunas');
    const total = lunas.reduce((s, f) => s + parseFloat(f.total || 0), 0);
    if (document.getElementById('rev-total')) document.getElementById('rev-total').innerText = DB.formatCurrency(total);
    if (document.getElementById('rev-orders')) document.getElementById('rev-orders').innerText = lunas.length;

    // Render Infographic Bars (Last 7 Days)
    const chartContainer = document.querySelector('.revenue-chart-bars');
    if (!chartContainer) return;
    chartContainer.innerHTML = '';
    
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const today = new Date();
    const dailyData = [];

    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayTotal = lunas.filter(f => f.date && f.date.includes(dateStr))
                              .reduce((s, f) => s + parseFloat(f.total || 0), 0);
        dailyData.push({ day: days[d.getDay()], total: dayTotal });
    }

    const maxVal = Math.max(...dailyData.map(d => d.total), 50000);
    
    dailyData.forEach(d => {
        const height = (d.total / maxVal) * 100;
        const bar = document.createElement('div');
        bar.style.flex = '1';
        bar.style.display = 'flex';
        bar.style.flexDirection = 'column';
        bar.style.alignItems = 'center';
        bar.style.justifyContent = 'flex-end';
        bar.style.height = '100%';
        bar.innerHTML = `
            <div style="font-size:0.7rem; color:var(--primary-sky); font-weight:700; margin-bottom:5px;">${d.total > 0 ? (d.total/1000)+'k' : ''}</div>
            <div style="width:100%; height:${height}%; background:linear-gradient(to top, var(--primary-sky), #a78bfa); border-radius:10px; min-height:5px; transition: height 1s ease;"></div>
            <div style="font-size:0.75rem; font-weight:800; color:var(--text-muted); margin-top:10px;">${d.day}</div>
        `;
        chartContainer.appendChild(bar);
    });
}

// [OTHERS]
window.processAdminOrder = async function(event) {
    event.preventDefault();
    const btn = event.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
        const orderData = { 
            id: DB.generateOrderCode(), 
            name: document.getElementById('admName').value, 
            phone: document.getElementById('admPhone').value, 
            item_type: document.getElementById('admItem').value, 
            qty: parseInt(document.getElementById('admQty').value), 
            treatment: 'Manual', 
            service: document.getElementById('admService').value, 
            express: 'none', delivery: 'Tidak', address: '-', distance: 0, schedule: '-', 
            notes: document.getElementById('admNotes').value, 
            price: parseFloat(document.getElementById('admPrice').value), 
            express_price: 0, ongkir: 0, 
            total: parseFloat(document.getElementById('admPrice').value) * parseInt(document.getElementById('admQty').value), 
            status: 1 
        };
        await DB.addOrder(orderData);
        alert("Pesanan berhasil disimpan!");
        event.target.reset();
        renderOrders();
    } catch (err) { alert("Gagal menyimpan."); } finally { btn.disabled = false; }
};

function initDropzones() {}
window.updateProgressModal = (id, status) => { document.getElementById('progressModal').style.display = 'flex'; window.currentUpdateId = id; document.getElementById('statusSelect').value = status; };
window.closeProgressModal = () => { document.getElementById('progressModal').style.display = 'none'; };
