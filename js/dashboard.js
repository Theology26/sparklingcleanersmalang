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
            
            // Render specific tab data when clicked
            if (targetId === 'tab-articles') safeRender(renderArticles, "Articles");
            if (targetId === 'tab-revenue') safeRender(renderFinance, "Finance");
            if (targetId === 'tab-stock') safeRender(renderInventory, "Inventory");
            if (targetId === 'tab-catalog') safeRender(renderCatalog, "Catalog");
            if (targetId === 'tab-testimonials') safeRender(renderTestimonials, "Testimonials");
            if (targetId === 'tab-settings') safeRender(renderSettings, "Settings");
            if (targetId === 'tab-orders') safeRender(renderOrders, "Orders");
            if (targetId === 'tab-admin-restock') safeRender(renderRestock, "Restock");
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
            const userRole = localStorage.getItem('userRole') || 'admin';
            const actionBtn = userRole === 'owner' 
                ? `<button class="btn btn-primary" style="padding:6px 15px; font-size:0.75rem;" onclick="window.approveRestock('${r.id}')">Selesaikan</button>`
                : `<span class="badge" style="background:#e2e8f0; color:#64748b; font-size:0.7rem;">Menunggu Owner</span>`;

            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong>REQ: ${r.itemId} (${r.qty})</strong>
                        <p style="font-size:0.8rem; color:var(--text-muted); margin-top:5px;">${r.notes}</p>
                    </div>
                    ${actionBtn}
                </div>
            `;
            listDiv.appendChild(card);
        });
    }
}

window.approveRestock = async function(id) {
    const userRole = localStorage.getItem('userRole') || 'admin';
    if (userRole !== 'owner') {
        alert("Hanya Owner yang dapat menyelesaikan request restok.");
        return;
    }
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
    if (tests.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#94a3b8; padding:2rem;">Belum ada testimoni masuk.</td></tr>`;
        return;
    }
    tests.forEach(t => {
        const tr = document.createElement('tr');
        const isApproved = t.status === 'Approved';
        const statusBadge = isApproved
            ? `<span style="color:#2ecc71; font-weight:700; background:rgba(46,204,113,0.1); padding:4px 12px; border-radius:20px;">✓ LIVE</span>`
            : `<span style="color:#f39c12; font-weight:700; background:rgba(243,156,18,0.1); padding:4px 12px; border-radius:20px;">⏳ Pending</span>`;
        const actions = isApproved
            ? `<button class="btn" style="padding:4px 10px; background:#e74c3c; color:white; font-size:0.8rem;" onclick="window.deleteTestimonial(${t.id})"><i class="fa-solid fa-trash"></i> Hapus</button>`
            : `<button class="btn" style="padding:4px 10px; background:#2ecc71; color:white; font-size:0.8rem;" onclick="window.moderateTestimonial(${t.id}, 'Approved')"><i class="fa-solid fa-check"></i> Acc</button>
               <button class="btn" style="padding:4px 10px; background:#e74c3c; color:white; font-size:0.8rem; margin-left:5px;" onclick="window.deleteTestimonial(${t.id})"><i class="fa-solid fa-trash"></i> Tolak</button>`;
        let imageCell = `<span style="color:#94a3b8; font-size:0.8rem;">Tidak ada foto</span>`;
        if (t.image) {
            const urls = t.image.split(',');
            imageCell = `<div style="display:flex; gap:5px; flex-wrap:wrap;">
                ${urls.map(url => `
                    <a href="${url}" target="_blank" title="Lihat foto penuh">
                        <img src="${url}" alt="Bukti foto" style="width:40px; height:40px; object-fit:cover; border-radius:8px; border:1px solid #e2e8f0; cursor:pointer;">
                    </a>
                `).join('')}
            </div>`;
        }
        tr.innerHTML = `<td><strong>${t.name}</strong></td><td>${'⭐'.repeat(t.rating)}</td><td style="max-width:250px; font-style:italic;">&ldquo;${t.content}&rdquo;</td><td>${imageCell}</td><td>${statusBadge}</td><td style="white-space:nowrap;">${actions}</td>`;
        tbody.appendChild(tr);
    });
}

window.moderateTestimonial = async function(id, status) {
    const res = await DB.updateTestimonialStatus(id, status);
    if (res && res.success) renderTestimonials();
};

window.deleteTestimonial = async function(id) {
    if (!confirm('Hapus testimoni ini secara permanen?')) return;
    const res = await fetch(`http://localhost:3000/api/testimonials/${id}`, { method: 'DELETE', cache: 'no-store' });
    const data = await res.json();
    if (data && data.success) renderTestimonials();
    else alert('Gagal menghapus testimoni.');
};

// [ARTICLES]
async function renderArticles() {
    const raw = await DB.getArticles();
    // Pastikan selalu array, baik null/object error/array kosong
    const articles = Array.isArray(raw) ? raw : [];
    const tbody = document.querySelector('#tab-articles tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (articles.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:2rem;">Belum ada artikel. Klik "+ Artikel Baru" untuk menambahkan.</td></tr>`;
        return;
    }
    articles.forEach(a => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${a.title}</td><td>${a.category}</td><td><span class="status-badge">${a.status}</span></td><td><button class="btn btn-primary" style="padding:4px 8px;" onclick="window.editArticle('${a.id}')"><i class="fa-solid fa-pen-to-square"></i></button> <button class="btn" style="padding:4px 8px; background:#e74c3c; color:white;" onclick="window.deleteArticle('${a.id}')"><i class="fa-solid fa-trash"></i></button></td>`;
        tbody.appendChild(tr);
    });
}

window.editArticle = async function(id) {
    const articles = await DB.getArticles();
    const a = articles.find(x => x.id == id);
    if (!a) return;
    document.getElementById('articleModalTitle').innerText = 'Edit Artikel';
    document.getElementById('artTitle').value = a.title || '';
    document.getElementById('artCategory').value = a.category || 'Perawatan Sepatu';
    document.getElementById('artExcerpt').value = a.description || a.desc || a.excerpt || '';
    document.getElementById('artContent').value = a.content || '';
    document.getElementById('artStatus').value = a.status || 'Publik';
    document.getElementById('articleId').value = a.id;
    // Load existing image into preview
    _resetImageUploadUI();
    if (a.image) {
        _setImagePreview(a.image);
        const status = document.getElementById('artImageStatus');
        if (status) { status.style.display = 'block'; status.innerText = '🖼️ Gambar saat ini. Upload baru untuk mengganti.'; }
    }
    document.getElementById('articleModal').style.display = 'block';
};

window.deleteArticle = async function(id) {
    if(confirm("Hapus artikel ini?")) {
        const res = await DB.deleteArticle(id);
        if(res && res.success) renderArticles();
        else alert('Gagal menghapus artikel.');
    }
};

window.openArticleModal = function() {
    document.getElementById('articleModalTitle').innerText = 'Tambah Artikel Baru';
    document.getElementById('artTitle').value = '';
    document.getElementById('artCategory').value = 'Perawatan Sepatu';
    document.getElementById('artImage').value = '';
    document.getElementById('artExcerpt').value = '';
    document.getElementById('artContent').value = '';
    document.getElementById('artStatus').value = 'Publik';
    document.getElementById('articleId').value = '';
    // Reset image upload UI
    _resetImageUploadUI();
    document.getElementById('articleModal').style.display = 'block';
};

window.closeArticleModal = function() {
    document.getElementById('articleModal').style.display = 'none';
};

window.saveArticle = async function() {
    const title = document.getElementById('artTitle').value.trim();
    const category = document.getElementById('artCategory').value;
    const image = document.getElementById('artImage').value.trim(); // diisi oleh upload atau URL manual
    const excerpt = document.getElementById('artExcerpt').value.trim();
    const content = document.getElementById('artContent').value.trim();
    const status = document.getElementById('artStatus').value;
    const existingId = document.getElementById('articleId').value;

    if (!title || !excerpt) {
        alert('Judul dan Deskripsi Singkat wajib diisi!');
        return;
    }
    if (!image) {
        alert('Harap upload gambar atau masukkan URL gambar terlebih dahulu!');
        return;
    }

    const saveBtn = document.querySelector('#articleModal .btn-primary');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...'; }

    try {
        const articleData = {
            id: existingId || DB.generateOrderCode().replace('SPK', 'ART'),
            title, category, image, desc: excerpt, content, status
        };

        let res;
        if (existingId) {
            res = await DB.updateArticle(existingId, articleData);
        } else {
            res = await DB.addArticle(articleData);
        }

        if (res && res.success) {
            alert('Artikel berhasil disimpan!');
            window.closeArticleModal();
            renderArticles();
        } else {
            const errMsg = (res && res.error) ? `\nError: ${res.error}` : '\nPastikan server & database (MySQL) sudah menyala.';
            alert('Gagal menyimpan artikel.' + errMsg);
        }
    } finally {
        if (saveBtn) { saveBtn.disabled = false; saveBtn.innerHTML = '<i class="fa-solid fa-save"></i> Simpan & Publikasikan'; }
    }
};

// ---- IMAGE UPLOAD HELPERS ----
function _resetImageUploadUI() {
    const preview = document.getElementById('artImagePreview');
    const placeholder = document.getElementById('artImagePlaceholder');
    const status = document.getElementById('artImageStatus');
    const fileInput = document.getElementById('artImageFile');
    if (preview) { preview.style.display = 'none'; preview.src = ''; }
    if (placeholder) placeholder.style.display = 'block';
    if (status) { status.style.display = 'none'; status.innerText = ''; }
    if (fileInput) fileInput.value = '';
}

function _setImagePreview(url) {
    const preview = document.getElementById('artImagePreview');
    const placeholder = document.getElementById('artImagePlaceholder');
    if (preview) {
        preview.src = url;
        preview.style.display = 'block';
    }
    if (placeholder) placeholder.style.display = 'none';
    document.getElementById('artImage').value = url;
}

async function _uploadImageFile(file) {
    const status = document.getElementById('artImageStatus');
    if (status) { status.style.display = 'block'; status.innerText = '⏳ Mengupload gambar...'; }

    const formData = new FormData();
    formData.append('image', file);
    try {
        const resp = await fetch('http://localhost:3000/api/upload', { method: 'POST', body: formData });
        const result = await resp.json();
        if (result.success) {
            _setImagePreview(result.url);
            if (status) { status.innerText = '✅ Gambar berhasil diupload!'; }
        } else {
            if (status) { status.innerText = '❌ Gagal upload: ' + (result.error || 'Error tidak diketahui'); }
        }
    } catch (err) {
        if (status) { status.innerText = '❌ Error: ' + err.message; }
    }
}

window.handleImageFileSelect = async function(input) {
    if (input.files && input.files[0]) {
        await _uploadImageFile(input.files[0]);
    }
};

window.handleImageDrop = async function(event) {
    event.preventDefault();
    const zone = document.getElementById('artImageDropZone');
    if (zone) { zone.style.borderColor = '#94a3b8'; zone.style.background = 'rgba(148,163,184,0.05)'; }
    const file = event.dataTransfer.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
        alert('File harus berupa gambar (JPG, PNG, WEBP).');
        return;
    }
    await _uploadImageFile(file);
};

window.previewFromUrl = function(url) {
    if (!url || !url.startsWith('http')) return;
    _setImagePreview(url);
    const status = document.getElementById('artImageStatus');
    if (status) { status.style.display = 'block'; status.innerText = '🔗 Menggunakan URL gambar eksternal.'; }
};

// [SETTINGS & CONFIG]
async function renderSettings() {
    const config = await DB.getConfig();
    if (!config) return;

    // Hero Section
    const hero = config.hero || {};
    const heroTitle = document.getElementById('configHeroTitle');
    const heroSubtitle = document.getElementById('configHeroSubtitle');
    if (heroTitle) heroTitle.value = hero.title || '';
    if (heroSubtitle) heroSubtitle.value = hero.subtitle || '';
    
    // Pricing Section
    const p = config.pricing || {};
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val || 0;
    };

    if (p.regShoes) {
        setVal('price-reg-shoes-Small', p.regShoes.Small);
        setVal('price-reg-shoes-Medium', p.regShoes.Medium);
        setVal('price-reg-shoes-Large', p.regShoes.Large);
    }
    if (p.regHelmet) {
        setVal('price-reg-helmet-HalfFace', p.regHelmet.HalfFace);
        setVal('price-reg-helmet-FullFace', p.regHelmet.FullFace);
    }
    if (p.express) {
        setVal('price-exp-8', p.express["8h"]);
        setVal('price-exp-18', p.express["18h"]);
        setVal('price-exp-24', p.express["24h"]);
    }
}

window.saveAllSettings = async function() {
    const config = {};

    // Collect Hero Settings
    const heroTitle = document.getElementById('configHeroTitle');
    const heroSubtitle = document.getElementById('configHeroSubtitle');
    if (heroTitle && heroSubtitle) {
        config.hero = {
            title: heroTitle.value,
            subtitle: heroSubtitle.value
        };
    }

    // Collect Pricing Settings (Only if they exist in UI)
    const getInt = (id) => {
        const el = document.getElementById(id);
        return el ? parseInt(el.value) || 0 : null;
    };

    if (document.getElementById('price-reg-shoes-Small')) {
        config.pricing = {
            regShoes: { Small: getInt('price-reg-shoes-Small'), Medium: getInt('price-reg-shoes-Medium'), Large: getInt('price-reg-shoes-Large') },
            regHelmet: { HalfFace: getInt('price-reg-helmet-HalfFace'), FullFace: getInt('price-reg-helmet-FullFace') },
            express: { "8h": getInt('price-exp-8'), "18h": getInt('price-exp-18'), "24h": getInt('price-exp-24') }
        };
    }

    const res = await DB.saveConfig(config);
    if (res && res.success) { 
        alert("Pengaturan Website Berhasil Disimpan!"); 
        window.location.reload(); 
    } else { 
        alert("Gagal menyimpan."); 
    }
};

// [FINANCE]
async function renderFinance() {
    const orders = (await DB.getOrders()) || [];
    const total = orders.reduce((s, o) => s + parseFloat(o.total || 0), 0);
    if (document.getElementById('rev-total')) document.getElementById('rev-total').innerText = DB.formatCurrency(total);
    if (document.getElementById('rev-orders')) document.getElementById('rev-orders').innerText = orders.length;

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
        const dayTotal = orders.filter(o => o.date && o.date.includes(dateStr))
                               .reduce((s, o) => s + parseFloat(o.total || 0), 0);
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
