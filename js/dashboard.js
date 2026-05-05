// dashboard.js

document.addEventListener('DOMContentLoaded', () => {
    // Check Authentication
    const userRole = localStorage.getItem('userRole');
    if (!userRole) {
        window.location.href = 'login.html';
        return;
    }

    // Init UI
    window.switchRole(userRole);
    setupTabs();
    initDropzones();
    
    // Initial Render
    renderOrders();
    renderAdminRestock(); // For all roles (mostly admin)
    
    if(userRole === 'owner') {
        renderFinance();
        renderInventory();
        renderArticles();
        renderOwnerRestockRequests();
        renderSettings();
    }
});

function setupTabs() {
    const menuItems = document.querySelectorAll('.menu-item[data-target]');
    const tabContents = document.querySelectorAll('.tab-content');

    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            menuItems.forEach(m => m.classList.remove('active'));
            tabContents.forEach(t => t.classList.remove('active'));

            this.classList.add('active');
            const targetId = this.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });
}

function initDropzones() {
    const initZone = (dropzoneId, inputId, nameId) => {
        const dropzone = document.getElementById(dropzoneId);
        const fileInput = document.getElementById(inputId);
        const fotoName = document.getElementById(nameId);

        if(dropzone && fileInput) {
            dropzone.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', function() {
                if (this.files && this.files.length > 0) {
                    if (fotoName) fotoName.innerText = "File Dipilih: " + this.files[0].name;
                    dropzone.style.borderColor = "#2ecc71";
                    dropzone.style.background = 'rgba(46, 204, 113, 0.1)';
                }
            });
        }
    };
    initZone('foto-dropzone', 'foto-input', 'foto-name');
    initZone('article-dropzone', 'article-foto-input', null);
}

window.switchRole = function(role) {
    const ownerSection = document.getElementById('ownerMenuSection');
    const activeRoleText = document.getElementById('activeRoleText');

    if (role === 'owner') {
        ownerSection.style.display = 'block';
        activeRoleText.innerText = "Mode: Owner (Superadmin)";
    } else {
        ownerSection.style.display = 'none';
        activeRoleText.innerText = "Mode: Admin Operasional";
        
        const activeTabTarget = document.querySelector('.menu-item.active').getAttribute('data-target');
        if (['tab-revenue', 'tab-stock', 'tab-catalog', 'tab-testimonials', 'tab-articles'].includes(activeTabTarget)) {
            document.querySelector('[data-target="tab-orders"]').click();
        }
    }
};

// ================= ORDERS LOGIC =================
function renderOrders() {
    const orders = DB.get('sparklingOrders');
    const tbody = document.querySelector('#tab-orders tbody');
    if(!tbody) return;
    
    tbody.innerHTML = '';
    
    const statusText = ['Unknown', 'Diterima', 'Treatment', 'Kering', 'Finishing', 'Siap Ambil'];
    const statusClasses = ['unknown', 'diterima', 'treatment', 'kering', 'finishing', 'siap'];

    orders.forEach(o => {
        const badge = `<span class="status-badge status-${statusClasses[o.status]}">${o.status} - ${statusText[o.status]}</span>`;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${o.id}</td>
            <td>${DB.formatDate(o.date)}</td>
            <td>${o.name}</td>
            <td>${o.itemType} (${o.service})</td>
            <td>${badge}</td>
            <td>
                <div style="display: flex; gap: 8px;">
                    <label class="btn btn-secondary" style="padding:0.4rem 0.6rem; font-size: 0.85rem; cursor: pointer;">
                        <i class="fa-solid fa-camera"></i> Before
                        <input type="file" style="display: none;" accept="image/*" onchange="alert('Foto tersimpan untuk ${o.id}')">
                    </label>
                    <button class="btn" style="background:var(--primary-sky); color:white; padding:0.4rem 0.8rem; font-size:0.85rem;" onclick="window.updateProgressModal('${o.id}', ${o.status})">Update Status</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.updateProgressModal = function(id, currentStatus) {
    const modal = document.getElementById('progressModal');
    document.getElementById('modalTitle').innerText = `Update Progress ${id}`;
    document.getElementById('statusSelect').value = currentStatus;
    
    // Simpan ID ke button
    const btn = modal.querySelector('.btn-primary');
    btn.onclick = () => {
        const newStatus = document.getElementById('statusSelect').value;
        DB.updateOrderStatus(id, newStatus);
        renderOrders();
        window.closeProgressModal();
    };
    
    modal.style.display = 'flex';
};

window.closeProgressModal = function() {
    document.getElementById('progressModal').style.display = 'none';
};

// ================= REVENUE LOGIC =================
function renderFinance() {
    const finance = DB.get('sparklingFinance');
    
    let totalRev = 0;
    let totalOrders = finance.length;
    
    finance.forEach(f => {
        totalRev += parseFloat(f.total);
    });
    
    const avg = totalOrders > 0 ? totalRev / totalOrders : 0;
    
    document.getElementById('rev-total').innerText = DB.formatCurrency(totalRev);
    document.getElementById('rev-orders').innerText = totalOrders;
    document.getElementById('rev-avg').innerText = DB.formatCurrency(avg);
    
    // Animate bars
    const bars = document.querySelectorAll('.chart-bar');
    bars.forEach(bar => {
        bar.style.height = `${Math.floor(Math.random() * 60) + 30}%`;
    });
}

window.updateRevenueFilter = function(days) {
    // Simulasi filter untuk MVP
    renderFinance();
};

// ================= INVENTORY LOGIC =================
function renderInventory() {
    const inv = DB.get('sparklingInventory');
    const tbody = document.querySelector('#tab-stock tbody');
    if(!tbody) return;
    
    tbody.innerHTML = '';
    
    inv.forEach(i => {
        const isLow = i.stock < i.minStock;
        const rowStyle = isLow ? 'background: rgba(255,0,0,0.05);' : '';
        const stockStyle = isLow ? 'color:red; font-weight:bold;' : '';
        const unitSuffix = isLow ? ` ${i.unit} (Segera Habis!)` : ` ${i.unit}`;

        const tr = document.createElement('tr');
        tr.style = rowStyle;
        tr.innerHTML = `
            <td>${i.name}</td>
            <td>${i.category}</td>
            <td style="${stockStyle}">${i.stock}</td>
            <td>${unitSuffix}</td>
            <td>
                <button class="btn btn-secondary" style="padding:0.3rem 0.6rem; font-size:0.8rem; margin-right: 5px;" onclick="window.openStockModal('${i.id}')"><i class="fa-solid fa-pen"></i> Update</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.openStockModal = function(id) {
    window.openCrudModal(`Update Stok (Koreksi)`);
    // Logic untuk form modal bisa dikembangkan nanti. Sementara hanya UI standard.
};

// ================= ARTICLES LOGIC =================
function renderArticles() {
    const articles = DB.get('sparklingArticles');
    const tbody = document.querySelector('#tab-articles tbody');
    if(!tbody) return;
    
    tbody.innerHTML = '';
    
    articles.forEach(a => {
        const statusColor = a.status === 'Publik' ? '#2ecc71' : 'var(--text-muted)';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${a.title}</td>
            <td>${a.category}</td>
            <td><span style="color:${statusColor}; font-weight:bold;">${a.status}</span></td>
            <td>${a.views}</td>
            <td>
                <button class="btn btn-secondary" style="padding:0.3rem 0.6rem; font-size:0.8rem; margin-right: 5px;"><i class="fa-solid fa-pen"></i></button>
                <button class="btn" style="padding:0.3rem 0.6rem; font-size:0.8rem; background:rgba(231, 76, 60, 0.1); color:#e74c3c; border: 1px solid #e74c3c;"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Generic CRUD Modal Logic
window.openCrudModal = function(title) {
    const modal = document.getElementById('crudModal');
    const modalTitle = document.getElementById('crudModalTitle');
    
    if (modal && modalTitle) {
        modalTitle.innerText = title;
        modal.style.display = 'flex';
    }
};

window.closeCrudModal = function() {
    const modal = document.getElementById('crudModal');
    if (modal) {
        modal.style.display = 'none';
    }
};

// ================= ADMIN RESTOCK LOGIC =================
function renderAdminRestock() {
    const inv = DB.get('sparklingInventory');
    const select = document.getElementById('restockItem');
    if(select) {
        select.innerHTML = '<option value="">- Pilih Barang -</option>';
        inv.forEach(i => {
            select.innerHTML += `<option value="${i.id}">${i.name} (Stok: ${i.stock} ${i.unit})</option>`;
        });
    }

    const requests = DB.get('sparklingRestockRequests');
    const tbody = document.getElementById('adminRestockList');
    if(tbody) {
        tbody.innerHTML = '';
        requests.forEach(r => {
            let statusColor = 'var(--text-muted)';
            if(r.status === 'Approved') statusColor = 'green';
            if(r.status === 'Rejected') statusColor = 'red';
            
            tbody.innerHTML += `
                <tr>
                    <td>${DB.formatDate(r.date)}</td>
                    <td>${r.itemName}</td>
                    <td>${r.qty}</td>
                    <td style="color:${statusColor}; font-weight:bold;">${r.status}</td>
                </tr>
            `;
        });
    }
}

window.submitRestockRequest = function() {
    const itemId = document.getElementById('restockItem').value;
    const qty = document.getElementById('restockQty').value;
    const notes = document.getElementById('restockNotes').value;
    const userRole = localStorage.getItem('userRole');

    if(!itemId || !qty) {
        alert("Pilih barang dan masukkan jumlah!");
        return;
    }

    DB.addRestockRequest(itemId, qty, notes, userRole);
    alert("Permintaan berhasil dikirim ke Owner!");
    document.getElementById('restockQty').value = '';
    document.getElementById('restockNotes').value = '';
    renderAdminRestock();
};

// ================= OWNER RESTOCK LOGIC =================
function renderOwnerRestockRequests() {
    const requests = DB.get('sparklingRestockRequests').filter(r => r.status === 'Pending');
    const tbody = document.getElementById('ownerRestockList');
    const box = document.getElementById('ownerRestockRequestsBox');
    
    if(!tbody || !box) return;

    if (requests.length === 0) {
        box.style.display = 'none';
        return;
    }
    
    box.style.display = 'block';
    tbody.innerHTML = '';
    
    requests.forEach(r => {
        tbody.innerHTML += `
            <tr style="background: rgba(241, 196, 15, 0.1);">
                <td>${DB.formatDate(r.date)}</td>
                <td><strong>${r.itemName}</strong></td>
                <td><span style="color:red; font-weight:bold;">+${r.qty}</span></td>
                <td>${r.notes}</td>
                <td>
                    <button class="btn btn-primary" style="padding:0.3rem 0.6rem; font-size:0.8rem; margin-right: 5px;" onclick="window.ownerApprove('${r.id}')"><i class="fa-solid fa-check"></i> Setujui</button>
                    <button class="btn" style="padding:0.3rem 0.6rem; font-size:0.8rem; background:rgba(231, 76, 60, 0.1); color:#e74c3c; border: 1px solid #e74c3c;" onclick="window.ownerReject('${r.id}')"><i class="fa-solid fa-xmark"></i> Tolak</button>
                </td>
            </tr>
        `;
    });
}

window.ownerApprove = function(reqId) {
    const cost = prompt("Masukkan total harga pembelian untuk laporan keuangan (contoh: 50000):");
    if (cost && !isNaN(cost)) {
        if (DB.approveRestockRequest(reqId, cost)) {
            alert("Permintaan disetujui! Stok bertambah dan laporan keuangan terupdate.");
            renderOwnerRestockRequests();
            renderInventory();
            renderFinance();
        }
    } else if (cost !== null) {
        alert("Input tidak valid!");
    }
};

window.ownerReject = function(reqId) {
    const reason = prompt("Alasan penolakan:");
    if (reason !== null) {
        DB.rejectRestockRequest(reqId, reason);
        alert("Permintaan ditolak.");
        renderOwnerRestockRequests();
    }
};

// ================= SETTINGS LOGIC =================
function renderSettings() {
    const config = DB.getConfig();
    
    const hTitle = document.getElementById('configHeroTitle');
    const hSub = document.getElementById('configHeroSubtitle');
    if(hTitle) hTitle.value = config.heroTitle;
    if(hSub) hSub.value = config.heroSubtitle;

    const rShoes = document.getElementById('cfgRegShoes');
    const rBagF = document.getElementById('cfgRegBagF');
    const rHelm = document.getElementById('cfgRegHelm');
    const sSuede = document.getElementById('cfgSpecSuede');

    if(rShoes) rShoes.value = config.pricing.regular.shoes.Small;
    if(rBagF) rBagF.value = config.pricing.regular.bag_fabric.Small;
    if(rHelm) rHelm.value = config.pricing.regular.helmet["Half Face"];
    if(sSuede) sSuede.value = config.pricing.special.suede.Small;
}

window.saveConfig = function() {
    const config = DB.getConfig();
    
    config.heroTitle = document.getElementById('configHeroTitle').value;
    config.heroSubtitle = document.getElementById('configHeroSubtitle').value;

    config.pricing.regular.shoes.Small = parseInt(document.getElementById('cfgRegShoes').value);
    config.pricing.regular.bag_fabric.Small = parseInt(document.getElementById('cfgRegBagF').value);
    config.pricing.regular.helmet["Half Face"] = parseInt(document.getElementById('cfgRegHelm').value);
    config.pricing.special.suede.Small = parseInt(document.getElementById('cfgSpecSuede').value);

    DB.updateConfig(config);
    alert("Pengaturan dan Harga berhasil disimpan! Perubahan akan langsung terlihat di Halaman Depan.");
};
