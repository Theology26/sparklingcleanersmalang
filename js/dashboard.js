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
        tr.innerHTML = `
            <td>${i.id}</td>
            <td>${i.name}</td>
            <td><strong>${i.stock} ${i.unit}</strong></td>
            <td>${DB.formatCurrency(i.price)}</td>
            <td>
                <button class="btn btn-primary" style="padding:4px 8px; margin-right:4px;" onclick="window.useInventory('${i.id}')" title="Pakai Bahan"><i class="fa-solid fa-minus"></i> Pakai</button>
                <button class="btn" style="padding:4px 8px; margin-right:4px; background:var(--primary-navy); color:white;" onclick="window.editInventory('${i.id}')" title="Edit Item"><i class="fa-solid fa-pen"></i></button>
                <button class="btn" style="padding:4px 8px; background:#e74c3c; color:white;" onclick="window.deleteInventoryItem('${i.id}')" title="Hapus Item"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.useInventory = async function(id) {
    const amount = prompt("Berapa jumlah yang digunakan?");
    if (!amount || isNaN(amount)) return;
    const res = await DB.updateInventory(id, amount, 'subtract');
    if (res && res.success) { renderInventory(); } else { alert("Gagal update stok."); }
};

window.openStockModal = function() {
    document.getElementById('stockModal').style.display = 'flex';
    document.getElementById('stockModalTitle').innerText = 'Tambah Item Stok Baru';
    document.getElementById('stockId').value = '';
    document.getElementById('stockName').value = '';
    document.getElementById('stockCategory').value = '';
    document.getElementById('stockUnit').value = '';
    document.getElementById('stockPrice').value = '';
    document.getElementById('stockQty').value = '';
    document.getElementById('stockQty').disabled = false;
    document.getElementById('stockMin').value = '';
    document.getElementById('btnSubmitStock').innerText = 'Simpan Item';
};

window.closeStockModal = function() {
    document.getElementById('stockModal').style.display = 'none';
};

window.editInventory = async function(id) {
    const invList = await DB.getInventory();
    const item = invList.find(i => i.id === id);
    if (!item) return;

    document.getElementById('stockModal').style.display = 'flex';
    document.getElementById('stockModalTitle').innerText = 'Edit Item Stok';
    document.getElementById('stockId').value = item.id;
    document.getElementById('stockName').value = item.name;
    document.getElementById('stockCategory').value = item.category;
    document.getElementById('stockUnit').value = item.unit;
    document.getElementById('stockPrice').value = Math.round(item.price);
    document.getElementById('stockQty').value = item.stock;
    document.getElementById('stockQty').disabled = false;
    document.getElementById('stockMin').value = item.min_stock;
    document.getElementById('btnSubmitStock').innerText = 'Update Item';
};

window.deleteInventoryItem = async function(id) {
    if (confirm("Apakah Anda yakin ingin menghapus item inventaris ini secara permanen?")) {
        const res = await DB.deleteInventory(id);
        if (res && res.success) {
            alert("Item berhasil dihapus!");
            renderInventory();
            if (window.renderRestock) renderRestock();
        } else {
            alert("Gagal menghapus item.");
        }
    }
};

window.saveStockItem = async function(event) {
    event.preventDefault();
    const id = document.getElementById('stockId').value;
    const name = document.getElementById('stockName').value;
    const category = document.getElementById('stockCategory').value;
    const unit = document.getElementById('stockUnit').value;
    const price = parseFloat(document.getElementById('stockPrice').value);
    const stock = parseFloat(document.getElementById('stockQty').value);
    const min_stock = parseFloat(document.getElementById('stockMin').value);

    const itemData = { name, category, unit, price, stock, min_stock };

    let res;
    if (id) {
        res = await DB.updateInventoryDetails(id, itemData);
    } else {
        res = await DB.addInventory(itemData);
    }

    if (res && res.success) {
        alert(id ? "Item inventaris berhasil diperbarui!" : "Item inventaris baru berhasil ditambahkan!");
        window.closeStockModal();
        renderInventory();
        if (window.renderRestock) renderRestock();
    } else {
        alert("Gagal menyimpan data item.");
    }
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

// [CATALOG]
async function renderCatalog() {
    const config = await DB.getConfig();
    if (!config) return;
    const p = config.pricing || {};
    
    // Dynamically update active services count based on DOM inputs
    const activeInputs = document.querySelectorAll('#tab-catalog input[type="number"]').length;
    if (document.getElementById('stat-active-services')) {
        document.getElementById('stat-active-services').innerText = `${activeInputs} Layanan Aktif`;
    }
    
    // Regular Wash
    if (p.regular) {
        if (p.regular.shoes) {
            if (document.getElementById('price-reg-shoes-Small')) document.getElementById('price-reg-shoes-Small').value = p.regular.shoes.Small || 0;
            if (document.getElementById('price-reg-shoes-Medium')) document.getElementById('price-reg-shoes-Medium').value = p.regular.shoes.Medium || 0;
            if (document.getElementById('price-reg-shoes-Large')) document.getElementById('price-reg-shoes-Large').value = p.regular.shoes.Large || 0;
        }
        if (p.regular.helmet) {
            if (document.getElementById('price-reg-helmet-HalfFace')) document.getElementById('price-reg-helmet-HalfFace').value = p.regular.helmet["Half Face"] || 0;
            if (document.getElementById('price-reg-helmet-FullFace')) document.getElementById('price-reg-helmet-FullFace').value = p.regular.helmet["Full Face"] || 0;
        }
        if (p.regular.bag_leather) {
            if (document.getElementById('price-reg-bag_leather-Small')) document.getElementById('price-reg-bag_leather-Small').value = p.regular.bag_leather.Small || 0;
            if (document.getElementById('price-reg-bag_leather-Medium')) document.getElementById('price-reg-bag_leather-Medium').value = p.regular.bag_leather.Medium || 0;
            if (document.getElementById('price-reg-bag_leather-Large')) document.getElementById('price-reg-bag_leather-Large').value = p.regular.bag_leather.Large || 0;
        }
        if (p.regular.bag_fabric) {
            if (document.getElementById('price-reg-bag_fabric-Small')) document.getElementById('price-reg-bag_fabric-Small').value = p.regular.bag_fabric.Small || 0;
            if (document.getElementById('price-reg-bag_fabric-Medium')) document.getElementById('price-reg-bag_fabric-Medium').value = p.regular.bag_fabric.Medium || 0;
            if (document.getElementById('price-reg-bag_fabric-Large')) document.getElementById('price-reg-bag_fabric-Large').value = p.regular.bag_fabric.Large || 0;
        }
    }

    // Special Treatment
    if (p.special) {
        if (p.special.boots) {
            if (document.getElementById('price-spec-boots-Small')) document.getElementById('price-spec-boots-Small').value = p.special.boots.Small || 0;
            if (document.getElementById('price-spec-boots-Medium')) document.getElementById('price-spec-boots-Medium').value = p.special.boots.Medium || 0;
            if (document.getElementById('price-spec-boots-Large')) document.getElementById('price-spec-boots-Large').value = p.special.boots.Large || 0;
        }
        if (p.special.suede) {
            if (document.getElementById('price-spec-suede-Small')) document.getElementById('price-spec-suede-Small').value = p.special.suede.Small || 0;
            if (document.getElementById('price-spec-suede-Medium')) document.getElementById('price-spec-suede-Medium').value = p.special.suede.Medium || 0;
            if (document.getElementById('price-spec-suede-Large')) document.getElementById('price-spec-suede-Large').value = p.special.suede.Large || 0;
        }
        if (p.special.dress_shoes) {
            if (document.getElementById('price-spec-dress_shoes-Small')) document.getElementById('price-spec-dress_shoes-Small').value = p.special.dress_shoes.Small || 0;
            if (document.getElementById('price-spec-dress_shoes-Medium')) document.getElementById('price-spec-dress_shoes-Medium').value = p.special.dress_shoes.Medium || 0;
            if (document.getElementById('price-spec-dress_shoes-Large')) document.getElementById('price-spec-dress_shoes-Large').value = p.special.dress_shoes.Large || 0;
        }
        if (p.special.repaint_p) {
            if (document.getElementById('price-spec-repaint_p-Upper')) document.getElementById('price-spec-repaint_p-Upper').value = p.special.repaint_p.Upper || 0;
            if (document.getElementById('price-spec-repaint_p-Midsole')) document.getElementById('price-spec-repaint_p-Midsole').value = p.special.repaint_p.Midsole || 0;
            if (document.getElementById('price-spec-repaint_p-Outsole')) document.getElementById('price-spec-repaint_p-Outsole').value = p.special.repaint_p.Outsole || 0;
            if (document.getElementById('price-spec-repaint_p-Insole')) document.getElementById('price-spec-repaint_p-Insole').value = p.special.repaint_p.Insole || 0;
        }
        if (p.special.repaint_s) {
            if (document.getElementById('price-spec-repaint_s-Upper')) document.getElementById('price-spec-repaint_s-Upper').value = p.special.repaint_s.Upper || 0;
            if (document.getElementById('price-spec-repaint_s-Midsole')) document.getElementById('price-spec-repaint_s-Midsole').value = p.special.repaint_s.Midsole || 0;
            if (document.getElementById('price-spec-repaint_s-Outsole')) document.getElementById('price-spec-repaint_s-Outsole').value = p.special.repaint_s.Outsole || 0;
            if (document.getElementById('price-spec-repaint_s-Insole')) document.getElementById('price-spec-repaint_s-Insole').value = p.special.repaint_s.Insole || 0;
        }
        if (p.special.repaint_suede) {
            if (document.getElementById('price-spec-repaint_suede-Upper')) document.getElementById('price-spec-repaint_suede-Upper').value = p.special.repaint_suede.Upper || 0;
            if (document.getElementById('price-spec-repaint_suede-Midsole')) document.getElementById('price-spec-repaint_suede-Midsole').value = p.special.repaint_suede.Midsole || 0;
            if (document.getElementById('price-spec-repaint_suede-Outsole')) document.getElementById('price-spec-repaint_suede-Outsole').value = p.special.repaint_suede.Outsole || 0;
            if (document.getElementById('price-spec-repaint_suede-Insole')) document.getElementById('price-spec-repaint_suede-Insole').value = p.special.repaint_suede.Insole || 0;
        }
        if (p.special.extra) {
            if (document.getElementById('price-spec-extra-LiquidRemoverSepatu')) document.getElementById('price-spec-extra-LiquidRemoverSepatu').value = p.special.extra["Liquid Remover Sepatu"] || 0;
            if (document.getElementById('price-spec-extra-LiquidRemoverTas')) document.getElementById('price-spec-extra-LiquidRemoverTas').value = p.special.extra["Liquid Remover Tas"] || 0;
            if (document.getElementById('price-spec-extra-Unyellowing')) document.getElementById('price-spec-extra-Unyellowing').value = p.special.extra["Unyellowing"] || 0;
            if (document.getElementById('price-spec-extra-CanvasCleaner')) document.getElementById('price-spec-extra-CanvasCleaner').value = p.special.extra["Canvas Cleaner"] || 0;
            if (document.getElementById('price-spec-extra-LeatherFiller')) document.getElementById('price-spec-extra-LeatherFiller').value = p.special.extra["Leather Filler"] || 0;
        }
    }

    // Express
    if (p.express) {
        if (document.getElementById('price-exp-8')) document.getElementById('price-exp-8').value = p.express["8 Jam"] || 0;
        if (document.getElementById('price-exp-18')) document.getElementById('price-exp-18').value = p.express["18 Jam"] || 0;
        if (document.getElementById('price-exp-24')) document.getElementById('price-exp-24').value = p.express["24 Jam"] || 0;
    }
}

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
    if (document.getElementById('configHeroTitle')) document.getElementById('configHeroTitle').value = hero.title || '';
    if (document.getElementById('configHeroSubtitle')) document.getElementById('configHeroSubtitle').value = hero.subtitle || '';
}

window.saveAllSettings = async function() {
    const existing = await DB.getConfig() || {};
    
    const titleVal = document.getElementById('configHeroTitle') ? document.getElementById('configHeroTitle').value : (existing.hero?.title || '');
    const subtitleVal = document.getElementById('configHeroSubtitle') ? document.getElementById('configHeroSubtitle').value : (existing.hero?.subtitle || '');
    
    const getVal = (id, fallback) => {
        const el = document.getElementById(id);
        return el && el.value !== '' ? parseInt(el.value) : fallback;
    };
    
    const config = {
        hero: {
            title: titleVal,
            subtitle: subtitleVal
        },
        pricing: {
            regular: {
                shoes: {
                    Small: getVal('price-reg-shoes-Small', existing.pricing?.regular?.shoes?.Small || 20000),
                    Medium: getVal('price-reg-shoes-Medium', existing.pricing?.regular?.shoes?.Medium || 30000),
                    Large: getVal('price-reg-shoes-Large', existing.pricing?.regular?.shoes?.Large || 35000),
                    est: existing.pricing?.regular?.shoes?.est || "3 Hari"
                },
                helmet: {
                    "Half Face": getVal('price-reg-helmet-HalfFace', existing.pricing?.regular?.helmet?.["Half Face"] || 22000),
                    "Full Face": getVal('price-reg-helmet-FullFace', existing.pricing?.regular?.helmet?.["Full Face"] || 30000),
                    est: existing.pricing?.regular?.helmet?.est || "24 Jam"
                },
                bag_leather: {
                    Small: getVal('price-reg-bag_leather-Small', existing.pricing?.regular?.bag_leather?.Small || 25000),
                    Medium: getVal('price-reg-bag_leather-Medium', existing.pricing?.regular?.bag_leather?.Medium || 30000),
                    Large: getVal('price-reg-bag_leather-Large', existing.pricing?.regular?.bag_leather?.Large || 35000),
                    est: existing.pricing?.regular?.bag_leather?.est || "24 Jam"
                },
                bag_fabric: {
                    Small: getVal('price-reg-bag_fabric-Small', existing.pricing?.regular?.bag_fabric?.Small || 20000),
                    Medium: getVal('price-reg-bag_fabric-Medium', existing.pricing?.regular?.bag_fabric?.Medium || 25000),
                    Large: getVal('price-reg-bag_fabric-Large', existing.pricing?.regular?.bag_fabric?.Large || 30000),
                    est: existing.pricing?.regular?.bag_fabric?.est || "2 Hari"
                }
            },
            special: {
                boots: {
                    Small: getVal('price-spec-boots-Small', existing.pricing?.special?.boots?.Small || 60000),
                    Medium: getVal('price-spec-boots-Medium', existing.pricing?.special?.boots?.Medium || 65000),
                    Large: getVal('price-spec-boots-Large', existing.pricing?.special?.boots?.Large || 80000),
                    est: existing.pricing?.special?.boots?.est || "3 Hari"
                },
                suede: {
                    Small: getVal('price-spec-suede-Small', existing.pricing?.special?.suede?.Small || 50000),
                    Medium: getVal('price-spec-suede-Medium', existing.pricing?.special?.suede?.Medium || 60000),
                    Large: getVal('price-spec-suede-Large', existing.pricing?.special?.suede?.Large || 70000),
                    est: existing.pricing?.special?.suede?.est || "5 Hari"
                },
                dress_shoes: {
                    Small: getVal('price-spec-dress_shoes-Small', existing.pricing?.special?.dress_shoes?.Small || 55000),
                    Medium: getVal('price-spec-dress_shoes-Medium', existing.pricing?.special?.dress_shoes?.Medium || 60000),
                    Large: getVal('price-spec-dress_shoes-Large', existing.pricing?.special?.dress_shoes?.Large || 65000),
                    est: existing.pricing?.special?.dress_shoes?.est || "3 Hari"
                },
                repaint_p: {
                    Upper: getVal('price-spec-repaint_p-Upper', existing.pricing?.special?.repaint_p?.Upper || 80000),
                    Midsole: getVal('price-spec-repaint_p-Midsole', existing.pricing?.special?.repaint_p?.Midsole || 50000),
                    Outsole: getVal('price-spec-repaint_p-Outsole', existing.pricing?.special?.repaint_p?.Outsole || 40000),
                    Insole: getVal('price-spec-repaint_p-Insole', existing.pricing?.special?.repaint_p?.Insole || 30000),
                    est: existing.pricing?.special?.repaint_p?.est || "10 Hari"
                },
                repaint_s: {
                    Upper: getVal('price-spec-repaint_s-Upper', existing.pricing?.special?.repaint_s?.Upper || 100000),
                    Midsole: getVal('price-spec-repaint_s-Midsole', existing.pricing?.special?.repaint_s?.Midsole || 63000),
                    Outsole: getVal('price-spec-repaint_s-Outsole', existing.pricing?.special?.repaint_s?.Outsole || 50000),
                    Insole: getVal('price-spec-repaint_s-Insole', existing.pricing?.special?.repaint_s?.Insole || 38000),
                    est: existing.pricing?.special?.repaint_s?.est || "10 Hari"
                },
                repaint_suede: {
                    Upper: getVal('price-spec-repaint_suede-Upper', existing.pricing?.special?.repaint_suede?.Upper || 120000),
                    Midsole: getVal('price-spec-repaint_suede-Midsole', existing.pricing?.special?.repaint_suede?.Midsole || 75000),
                    Outsole: getVal('price-spec-repaint_suede-Outsole', existing.pricing?.special?.repaint_suede?.Outsole || 60000),
                    Insole: getVal('price-spec-repaint_suede-Insole', existing.pricing?.special?.repaint_suede?.Insole || 45000),
                    est: existing.pricing?.special?.repaint_suede?.est || "10 Hari"
                },
                extra: {
                    "Liquid Remover Sepatu": getVal('price-spec-extra-LiquidRemoverSepatu', existing.pricing?.special?.extra?.["Liquid Remover Sepatu"] || 15000),
                    "Liquid Remover Tas": getVal('price-spec-extra-LiquidRemoverTas', existing.pricing?.special?.extra?.["Liquid Remover Tas"] || 5000),
                    "Unyellowing": getVal('price-spec-extra-Unyellowing', existing.pricing?.special?.extra?.["Unyellowing"] || 20000),
                    "Canvas Cleaner": getVal('price-spec-extra-CanvasCleaner', existing.pricing?.special?.extra?.["Canvas Cleaner"] || 20000),
                    "Leather Filler": getVal('price-spec-extra-LeatherFiller', existing.pricing?.special?.extra?.["Leather Filler"] || 25000)
                }
            },
            express: {
                "8 Jam": getVal('price-exp-8', existing.pricing?.express?.["8 Jam"] || 20000),
                "18 Jam": getVal('price-exp-18', existing.pricing?.express?.["18 Jam"] || 15000),
                "24 Jam": getVal('price-exp-24', existing.pricing?.express?.["24 Jam"] || 10000)
            }
        }
    };
    
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
