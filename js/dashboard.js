/* global Chart */
// js/dashboard.js - VERSI MASTER FULL PRODUCTION ENGINE
console.log("Sistem Manajemen Utama Sparkling Ops Berhasil Diaktifkan");

let grafikAktif = {};
window.pesananSaatIni = [];
window.inventarisBahan = [];
window.aboutEditorRows = [];

window.onload = async () => {
    const peran = localStorage.getItem('role') || localStorage.getItem('userRole') || 'owner';

    const temaTersimpan = localStorage.getItem('dashboardTheme');
    if (temaTersimpan === 'dark') {
        document.body.classList.add('dark-theme');
        const ikonTema = document.getElementById('themeIcon');
        if (ikonTema) ikonTema.className = 'fa-solid fa-sun';
    }

    inisialisasiTab();
    alihkanPeran(peran);
    await muatDataDashboard(peran);

    if (window.location.hash) {
        const idTarget = window.location.hash.substring(1);
        const elemenMenu = document.querySelector(`.menu-item[data-target="${idTarget}"]`);
        if (elemenMenu) elemenMenu.click();
    }
};

async function muatDataDashboard(peran) {
    const pekerjaan = [
        eksekusiAman(rendorRingkasanKinerja, "RingkasanKinerja"),
        eksekusiAman(renderDaftarPesanan, "DaftarPesanan"),
        eksekusiAman(renderStokBahan, "StokBahan"),
        eksekusiAman(renderRestock, "Restock")
    ];
    if (peran === 'owner') {
        pekerjaan.push(
            eksekusiAman(renderPengaturanWeb, "PengaturanWeb"),
            eksekusiAman(renderKatalogDanHargaLive, "KatalogDanHargaLive"),
            eksekusiAman(renderTestimonials, "Testimonials"),
            eksekusiAman(renderGaleriTab, "GaleriTab")
        );
    }
    await Promise.allSettled(pekerjaan);
}

async function eksekusiAman(fungsi, nama) {
    try { await fungsi(); } catch (err) { console.error(`Gagal memproses fungsi ${nama}:`, err); }
}

function inisialisasiTab() {
    const itemMenu = document.querySelectorAll('.menu-item[data-target]');
    const kontenTab = document.querySelectorAll('.tab-content');

    itemMenu.forEach(item => {
        item.onclick = function () {
            const idTarget = this.getAttribute('data-target');
            const peran = localStorage.getItem('role') || 'owner';
            const tabKhususOwner = ['tab-revenue', 'tab-catalog', 'tab-testimonials', 'tab-galeri', 'tab-settings'];

            if (peran !== 'owner' && tabKhususOwner.includes(idTarget)) {
                document.querySelector('.menu-item[data-target="tab-orders"]').click();
                return;
            }

            itemMenu.forEach(m => m.classList.remove('active'));
            kontenTab.forEach(t => t.classList.remove('active'));

            this.classList.add('active');
            const target = document.getElementById(idTarget);
            if (target) target.classList.add('active');
            history.pushState(null, null, '#' + idTarget);

            if (idTarget === 'tab-summary') eksekusiAman(rendorRingkasanKinerja, "RingkasanKinerja");
            if (idTarget === 'tab-settings') eksekusiAman(renderPengaturanWeb, "PengaturanWeb");
            if (idTarget === 'tab-orders') eksekusiAman(renderDaftarPesanan, "DaftarPesanan");
            if (idTarget === 'tab-stock') eksekusiAman(renderStokBahan, "StokBahan");
            if (idTarget === 'tab-admin-restock') eksekusiAman(renderRestock, "Restock");
            if (idTarget === 'tab-catalog') eksekusiAman(renderKatalogDanHargaLive, "KatalogDanHargaLive");
            if (idTarget === 'tab-testimonials') eksekusiAman(renderTestimonials, "Testimonials");
            if (idTarget === 'tab-galeri') eksekusiAman(renderGaleriTab, "GaleriTab");
        };
    });
}

function alihkanPeran(peran) {
    const seksiOwner = document.getElementById('ownerMenuSection');
    const teksPeranAktif = document.getElementById('activeRoleText');
    const namaProfilSidebar = document.getElementById('sidebarProfileName');
    const namaPenggunaNav = document.getElementById('navUsername');

    if (seksiOwner) seksiOwner.style.display = (peran === 'owner' ? 'block' : 'none');
    if (teksPeranAktif) teksPeranAktif.innerText = (peran === 'owner' ? "Owner" : "Admin");

    const namaTampilan = peran === 'owner' ? "Owner Sparkling" : "Admin Sparkling";
    if (namaProfilSidebar) namaProfilSidebar.innerText = namaTampilan;
    if (namaPenggunaNav) namaPenggunaNav.innerText = namaTampilan;

    const wadahAvatarNav = document.querySelector('.user-avatar-wrapper');
    if (wadahAvatarNav) wadahAvatarNav.innerHTML = `<div style="width:100%; height:100%; background:var(--primary-sky); color:white; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:1.2rem;">${peran[0].toUpperCase()}</div>`;

    localStorage.setItem('role', peran);
    terapkanBatasanAkses();
}

window.toggleTheme = () => {
    document.body.classList.toggle('dark-theme');
    localStorage.setItem('dashboardTheme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
    const ikonTema = document.getElementById('themeIcon');
    if (ikonTema) ikonTema.className = document.body.classList.contains('dark-theme') ? 'fa-solid fa-sun' : 'fa-regular fa-moon';
    rendorRingkasanKinerja();
};

window.handleGlobalSearch = function (kataKunci) {
    const kunci = kataKunci.toLowerCase();
    const tabAktif = document.querySelector('.tab-content.active');
    if (!tabAktif) return;
    tabAktif.querySelectorAll('.data-table tbody tr').forEach(baris => {
        baris.style.display = baris.innerText.toLowerCase().includes(kunci) ? '' : 'none';
    });
};

window.logout = () => { if (confirm("Keluar dari Sistem?")) { localStorage.clear(); window.location.href = 'index.html'; } };

// ==========================================
// KINERJA & GRAFIK (NO MANIPULATION)
// ==========================================

async function rendorRingkasanKinerja() {
    try {
        const respon = await fetch('/api/pesanan');
        const dataPesanan = await respon.json();
        window.pesananSaatIni = dataPesanan;

        const totalPesanan = dataPesanan.length;
        const pesananSelesai = dataPesanan.filter(p => parseInt(p.status) === 7).length;
        const rasioPenyelesaian = totalPesanan > 0 ? Math.round((pesananSelesai / totalPesanan) * 100) : 0;

        document.getElementById('kpi-completion-rate').innerText = `${rasioPenyelesaian}%`;
        document.getElementById('kpi-ring-completion').setAttribute('stroke-dasharray', `${rasioPenyelesaian}, 100`);
        document.getElementById('kpi-visitors').innerText = totalPesanan.toLocaleString('id-ID'); // Data Riil

        const omsetBersih = dataPesanan.filter(p => parseInt(p.lunas) === 1).reduce((total, p) => total + parseFloat(p.total || 0), 0);
        document.getElementById('kpi-revenue').innerText = `Rp ${omsetBersih.toLocaleString('id-ID')}`;

        const responGudang = await fetch('/api/inventory');
        const dataGudang = await responGudang.json();
        if (dataGudang.length > 0) {
            const totalStokPersen = Math.round(dataGudang.reduce((acc, item) => acc + Math.min((item.stock / (item.min_stock * 3)) * 100, 100), 0) / dataGudang.length);
            document.getElementById('kpi-stock').innerText = `${totalStokPersen}%`;
            document.getElementById('kpi-ring-stock').setAttribute('stroke-dasharray', `${totalStokPersen}, 100`);
        }

        membuatGrafikKinerja(dataPesanan);
    } catch (err) { console.error(err); }
}

function membuatGrafikKinerja(dataPesanan) {
    if (typeof Chart === 'undefined') return;
    Object.keys(grafikAktif).forEach(g => { if (grafikAktif[g]) grafikAktif[g].destroy(); });

    const ctxLaris = document.getElementById('chartLayananLaris')?.getContext('2d');
    if (ctxLaris) {
        const hitungKategori = { 'Sepatu': 0, 'Tas': 0, 'Helm': 0 };
        dataPesanan.forEach(p => { const kat = p.item_type || 'Sepatu'; if (hitungKategori[kat] !== undefined) hitungKategori[kat]++; });
        grafikAktif.laris = new Chart(ctxLaris, {
            type: 'pie',
            data: { labels: Object.keys(hitungKategori), datasets: [{ data: Object.values(hitungKategori), backgroundColor: ['#3498DB', '#9B59B6', '#F1C40F'] }] },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    const ctxMetode = document.getElementById('chartMetodePesan')?.getContext('2d');
    if (ctxMetode) {
        let aj = dataPesanan.filter(p => p.delivery === 'Ya' || p.delivery === 'Delivery').length;
        let as = dataPesanan.filter(p => p.delivery !== 'Ya' && p.delivery !== 'Delivery').length;
        grafikAktif.metode = new Chart(ctxMetode, {
            type: 'doughnut',
            data: { labels: ['Antar Jemput', 'Antar Sendiri'], datasets: [{ data: [aj, as], backgroundColor: ['#E67E22', '#2ECC71'] }] },
            options: { responsive: true, maintainAspectRatio: false, cutout: '70%' }
        });
    }
}

// ==========================================
// PESANAN & NOTA
// ==========================================

async function renderDaftarPesanan() {
    const tbody = document.querySelector('#tab-orders tbody');
    if (!tbody) return;
    try {
        const respon = await fetch('/api/pesanan');
        const dataPesanan = await respon.json();
        window.pesananSaatIni = dataPesanan;
        tbody.innerHTML = '';
        const teksStatus = ['Unknown', 'Penjemputan', 'Antrian Workshop', 'Proses Treatment', 'Pengeringan & Detailing', 'Menunggu Pembayaran', 'Pengantaran', 'Selesai'];

        dataPesanan.forEach(p => {
            const baris = document.createElement('tr');
            baris.innerHTML = `
                <td>#${p.id}</td>
                <td>${new Date(p.date).toLocaleDateString('id-ID')}</td>
                <td><strong>${p.name}</strong></td>
                <td>${p.service || 'Treatment'}</td>
                <td><span class="status-badge" style="background:rgba(6,182,212,0.1); color:var(--primary-sky);">${teksStatus[p.status || 1]}</span></td>
                <td>
                    <div style="display:flex; gap:5px;">
                        <button class="btn btn-primary" style="padding:6px 12px; font-size:0.8rem;" onclick="window.bukaModalStatus('${p.id}', ${p.status})">Status</button>
                        <button class="btn" style="padding:6px 12px; font-size:0.8rem; background:#10b981; color:white;" onclick="window.eksporNotaGambar('${p.id}')">Nota</button>
                    </div>
                </td>
            `;
            tbody.appendChild(baris);
        });
    } catch (err) { console.error(err); }
}

window.saveStatusUpdate = async function () {
    const id = window.idPesananDipilih;
    const targetStatus = parseInt(document.getElementById('statusSelect').value);
    const dataObjek = window.pesananSaatIni.find(x => x.id === id);

    if (targetStatus >= 6 && (!dataObjek || parseInt(dataObjek.lunas) !== 1)) {
        if (confirm('Lock Sistem: Pesanan belum lunas. Tandai lunas manual?')) {
            await fetch(`/api/pesanan/${id}/status_pembayaran`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lunas: 1 }) });
        } else return;
    }

    await fetch(`/api/pesanan/${id}/status_proses`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: targetStatus }) });
    document.getElementById('progressModal').style.display = 'none';
    await renderDaftarPesanan();
    await rendorRingkasanKinerja();
};

window.eksporNotaGambar = function (id) {
    const data = window.pesananSaatIni.find(x => x.id === id);
    if (!data) return alert('Data transaksi tidak ditemukan.');

    const kanvas = document.createElement('canvas');
    const ctx = kanvas.getContext('2d');
    kanvas.width = 1100; kanvas.height = 1500; ctx.scale(2, 2);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 550, 750);
    ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, 550, 25);
    ctx.font = 'bold 24px sans-serif'; ctx.fillText('SPARKLING CLEANERS MALANG', 35, 65);
    ctx.font = '14px sans-serif'; ctx.fillStyle = '#64748b';
    ctx.fillText(`Invoice Digital Pengiriman #${data.id}`, 35, 95);
    ctx.fillText(`Nama Pelanggan : ${data.name}`, 35, 135);
    ctx.fillText(`Kontak WhatsApp: ${data.phone}`, 35, 155);
    ctx.fillText(`Status Billing  : ${parseInt(data.lunas) === 1 ? 'LUNAS / SELESAI' : 'MENUNGGU PELUNASAN'}`, 35, 175);
    ctx.fillStyle = '#f8fafc'; ctx.fillRect(35, 210, 480, 360);
    ctx.fillStyle = '#1e293b'; ctx.fillText('Rincian Item Perawatan:', 55, 250);
    ctx.fillText(data.service || 'Cleaning & Care Treatment Package', 55, 280);
    ctx.fillText(`Total Tagihan: Rp ${parseFloat(data.total).toLocaleString('id-ID')}`, 55, 520);

    const stringBase64 = kanvas.toDataURL('image/png');
    const nomorTujuan = data.phone.startsWith('0') ? '62' + data.phone.substring(1) : data.phone;
    const teksPesan = `Halo ${data.name},\n\nTerima kasih telah menggunakan jasa *Sparkling Cleaners Malang*.\n\nLacak status: http://localhost:3000/lacak`;

    const tautanUnduh = document.createElement('a');
    tautanUnduh.download = `Nota_${data.id}.png`; tautanUnduh.href = stringBase64; tautanUnduh.click();
    window.open(`https://wa.me/${nomorTujuan}?text=${encodeURIComponent(teksPesan)}`, '_blank');
};

// ==========================================
// INVENTARIS & WORKFLOW RESTOK (Admin -> Owner)
// ==========================================

async function renderStokBahan() {
    const tbody = document.getElementById('inventoryList');
    if (!tbody) return;
    try {
        const res = await fetch('/api/inventory');
        const dataInventory = await res.json();
        tbody.innerHTML = '';
        dataInventory.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.id}</td>
                <td>${item.name}</td>
                <td><strong>${item.stock} ${item.unit}</strong></td>
                <td>Rp ${parseFloat(item.price).toLocaleString('id-ID')}</td>
                <td>
                    <button class="btn btn-primary" style="padding:4px 8px; font-size:0.8rem;" onclick="window.modifikasiStok('${item.id}', 'subtract')">Pakai</button>
                    ${localStorage.getItem('role') === 'owner' ? `<button class="btn" style="padding:4px 8px; font-size:0.8rem; background:#e74c3c; color:white; margin-left:5px;" onclick="window.hapusItemStok('${item.id}')">Hapus</button>` : ''}
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) { console.error(err); }
}

window.openStockModal = () => {
    document.getElementById('stockId').value = '';
    document.getElementById('stockName').value = '';
    document.getElementById('stockCategory').value = '';
    document.getElementById('stockUnit').value = '';
    document.getElementById('stockPrice').value = '';
    document.getElementById('stockQty').value = '';
    document.getElementById('stockModal').style.display = 'flex';
};

window.saveStockItem = async function (e) {
    e.preventDefault();
    const payload = {
        name: document.getElementById('stockName').value,
        category: document.getElementById('stockCategory').value,
        unit: document.getElementById('stockUnit').value,
        price: parseFloat(document.getElementById('stockPrice').value),
        stock: parseFloat(document.getElementById('stockQty').value),
        min_stock: parseFloat(document.getElementById('stockMin').value)
    };

    await fetch('/api/inventory', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-User-Role': 'owner' }, body: JSON.stringify(payload) });
    document.getElementById('stockModal').style.display = 'none';
    alert('Item inventaris baru berhasil ditambahkan.');
    await renderStokBahan();
};

window.modifikasiStok = async function (id, aksi) {
    const jumlah = prompt("Masukkan jumlah penggunaan:"); if (!jumlah || isNaN(jumlah)) return;
    await fetch(`/api/inventory/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: parseFloat(jumlah), action: aksi }) });
    await renderStokBahan();
};

window.hapusItemStok = async function (id) {
    if (!confirm('Hapus item inventaris ini?')) return;
    await fetch(`/api/inventory/${id}`, { method: 'DELETE', headers: { 'X-User-Role': 'owner' } });
    await renderStokBahan();
};

async function renderRestock() {
    const selectBahan = document.getElementById('restockItem');
    const kontainerStatus = document.getElementById('restockStatusContainer');
    if (!kontainerStatus) return;

    try {
        const responBahan = await fetch('/api/inventory');
        const daftarBahan = await responBahan.json();
        if (selectBahan) {
            selectBahan.innerHTML = '<option value="">- Pilih Bahan Baku -</option>';
            daftarBahan.forEach(b => { selectBahan.innerHTML += `<option value="${b.id}">${b.name}</option>`; });
        }

        const responRestock = await fetch('/api/restock');
        const daftarPengajuan = await responRestock.json();

        kontainerStatus.innerHTML = '<h3><i class="fa-solid fa-clock-rotate-left" style="color:var(--accent-yellow);"></i> Status Request Log</h3>';

        daftarPengajuan.forEach(p => {
            let badge = p.status === 'Pending' ? `<span class="status-badge" style="background:rgba(241,196,15,0.1); color:var(--accent-yellow); float:right;">Diajukan</span>` : `<span class="status-badge" style="background:rgba(46,204,113,0.1); color:#2ecc71; float:right;">Selesai ACC</span>`;

            if (p.status === 'Pending' && localStorage.getItem('role') === 'owner') {
                badge = `<button class="btn btn-primary" style="padding:4px 8px; font-size:0.7rem; float:right;" onclick="window.prosesPersetujuanRestok('${p.id}', 'Completed')">✓ SETUJUI (ACC)</button>`;
            }

            const itemCard = document.createElement('div');
            itemCard.className = 'glass-card';
            itemCard.style.cssText = 'padding:1rem; margin-top:10px; border-left:4px solid var(--accent-yellow);';
            itemCard.innerHTML = `${badge}<strong>Bahan: ${p.itemId}</strong><p style="font-size:0.8rem; color:var(--text-muted); margin-top:5px;">Jumlah Req: ${p.qty} Unit <br> Catatan: ${p.notes || '-'}</p>`;
            kontainerStatus.appendChild(itemCard);
        });
    } catch (e) { console.error(e); }
}

window.prosesPersetujuanRestok = async function (id, keputusan) {
    if (confirm('Apakah item restok sudah diterima workshop dan ingin di-ACC secara otomatis?')) {
        await fetch(`/api/restock/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: keputusan }) });
        alert('Pengajuan restok disetujui. Bahan baku bertambah otomatis.');
        window.location.reload();
    }
};

window.processAdminRestockRequest = async function (e) {
    e.preventDefault();
    const itemId = document.getElementById('restockItem').value;
    const qty = document.getElementById('restockQty').value;
    const notes = document.getElementById('restockNotes').value;

    await fetch('/api/restock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itemId, qty, notes, role: 'admin' }) });
    alert('Request restok dikirim ke Owner!');
    await renderRestock();
};

// ==========================================
// KATALOG LAYANAN LIVE & CRUD MODAL
// ==========================================

async function renderKatalogDanHargaLive() {
    const listBody = document.getElementById('servicesListBody');
    if (!listBody) return;
    try {
        const respon = await fetch('/api/services');
        const daftarLayanan = await respon.json();
        document.getElementById('stat-active-services').innerText = `${daftarLayanan.length} Layanan DB Aktif`;
        listBody.innerHTML = '';
        daftarLayanan.forEach(layanan => {
            const baris = document.createElement('tr');
            baris.innerHTML = `
                <td><img src="https://images.unsplash.com/photo-1595950653106-6c9ebd614c3a?w=60" style="width:45px; height:30px; object-fit:cover; border-radius:4px;"></td>
                <td><strong>${layanan.name}</strong></td>
                <td><span class="status-badge" style="background:rgba(6,182,212,0.1); color:var(--primary-sky);">${layanan.category}</span></td>
                <td>${layanan.treatment}</td>
                <td>Rp ${parseFloat(layanan.price).toLocaleString('id-ID')}</td>
                <td>${layanan.estimation}</td>
                <td>
                    <button class="btn btn-primary owner-only" style="padding:4px 8px; font-size:0.8rem;" onclick="window.openServiceModal('${layanan.id}')"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn owner-only" style="padding:4px 8px; font-size:0.8rem; background:#e74c3c; color:white; margin-left:5px;" onclick="window.deleteServiceItem('${layanan.id}')"><i class="fa-solid fa-trash"></i></button>
                </td>`;
            listBody.appendChild(baris);
        });
        terapkanBatasanAkses(); // Hide buttons again if admin
    } catch (err) { console.error(err); }
}

window.openServiceModal = async function (id = null) {
    document.getElementById('serviceModal').style.display = 'flex';
    if (id) {
        document.getElementById('serviceModalTitle').innerText = 'Edit Layanan';
        const resp = await fetch('/api/services');
        const daftar = await resp.json();
        const s = daftar.find(x => x.id == id);
        if (s) {
            document.getElementById('serviceFormId').value = s.id;
            document.getElementById('serviceFormName').value = s.name;
            document.getElementById('serviceFormCategory').value = s.category;
            document.getElementById('serviceFormTreatment').value = s.treatment;
            document.getElementById('serviceFormPrice').value = Math.round(s.price);
            document.getElementById('serviceFormEstimation').value = s.estimation;
            document.getElementById('serviceFormDescription').value = s.description || '';
        }
    } else {
        document.getElementById('serviceModalTitle').innerText = 'Tambah Layanan Baru';
        document.getElementById('serviceForm').reset();
        document.getElementById('serviceFormId').value = '';
    }
};

window.saveServiceItem = async function (e) {
    e.preventDefault();
    const id = document.getElementById('serviceFormId').value;
    const payload = {
        name: document.getElementById('serviceFormName').value.trim(),
        category: document.getElementById('serviceFormCategory').value,
        treatment: document.getElementById('serviceFormTreatment').value.trim(),
        price: parseFloat(document.getElementById('serviceFormPrice').value),
        estimation: document.getElementById('serviceFormEstimation').value.trim(),
        description: document.getElementById('serviceFormDescription').value.trim()
    };
    const rute = id ? `/api/services/${id}` : '/api/services';
    const metode = id ? 'PUT' : 'POST';

    await fetch(rute, {
        method: metode,
        headers: { 'Content-Type': 'application/json', 'X-User-Role': 'owner' },
        body: JSON.stringify(id ? payload : { id: 'SVC-' + Date.now(), ...payload })
    });
    document.getElementById('serviceModal').style.display = 'none';
    alert('Katalog paket berhasil disimpan ke Database.');
    await renderKatalogDanHargaLive();
};

window.deleteServiceItem = async function (id) {
    if (!confirm('Hapus paket layanan ini secara permanen?')) return;
    await fetch(`/api/services/${id}`, { method: 'DELETE', headers: { 'X-User-Role': 'owner' } });
    await renderKatalogDanHargaLive();
};

// ==========================================
// PENGATURAN WEB BUILDER (CMS) DINAMIS
// ==========================================

window.heroSlideshowImages = [];

async function renderPengaturanWeb() {
    try {
        const respon = await fetch('/api/konfigurasi-sistem');
        const konfigurasi = await respon.json();

        document.getElementById('configHeroTitle').value = konfigurasi.hero_welcome_title || '';
        document.getElementById('configHeroSubtitle').value = konfigurasi.hero_welcome_subtitle || '';
        document.getElementById('configHeroColor').value = konfigurasi.hero_font_color || '#ffffff';
        document.getElementById('configWhatsApp').value = konfigurasi.whatsapp_admin_number || '';
        document.getElementById('configInstagramUrl').value = konfigurasi.instagram_url || '';
        document.getElementById('configBusinessAddress').value = konfigurasi.business_address || '';
        document.getElementById('configGmapsUrl').value = konfigurasi.gmaps_iframe_url || '';

        const dropoffCheck = document.getElementById('configWorkshopDropoff');
        if (dropoffCheck) dropoffCheck.checked = konfigurasi.workshop_dropoff_allowed === 'true';

        // Data binding specifically for about fields
        document.getElementById('configAboutMotto').value = konfigurasi.about_motto || '';
        document.getElementById('configAboutSemantics').value = konfigurasi.about_semantics || '';
        document.getElementById('configAboutVision').value = konfigurasi.about_vision || '';
        document.getElementById('configAboutMission').value = konfigurasi.about_mission || '';
        document.getElementById('configAboutImage').value = konfigurasi.about_image || '';

        // Data binding for hero slideshow
        if (konfigurasi.hero_slideshow_images) {
            try {
                window.heroSlideshowImages = JSON.parse(konfigurasi.hero_slideshow_images);
            } catch (e) {
                window.heroSlideshowImages = [];
            }
        } else {
            window.heroSlideshowImages = [];
        }
        window.renderSlideshowTable();
    } catch (err) { console.error(err); }
}

window.renderSlideshowTable = () => {
    const tbody = document.getElementById('slideshowTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    window.heroSlideshowImages.forEach((url, idx) => {
        tbody.innerHTML += `<tr>
            <td><img src="${url}" style="width:60px; height:40px; object-fit:cover; border-radius:6px;"></td>
            <td><input type="text" class="form-input" value="${url}" readonly style="background:transparent; border:none; color:inherit; width: 100%;"></td>
            <td>
                <button class="btn" style="background:#e74c3c; color:white; padding:4px 8px; font-size:0.8rem;" onclick="window.deleteSlideshowImage(${idx})">Hapus</button>
            </td>
        </tr>`;
    });
};

window.addSlideshowImage = () => {
    const input = document.getElementById('newSlideshowUrl');
    const url = input.value.trim();
    if (!url) return alert('Silakan masukkan URL gambar atau upload file terlebih dahulu.');
    window.heroSlideshowImages.push(url);
    input.value = '';
    document.getElementById('slideshowUploadFile').value = '';
    window.renderSlideshowTable();
};

window.deleteSlideshowImage = (idx) => {
    if (confirm('Hapus gambar ini dari slideshow?')) {
        window.heroSlideshowImages.splice(idx, 1);
        window.renderSlideshowTable();
    }
};

window.previewSlideshowUpload = async function (input) {
    if (input.files && input.files[0]) {
        const formData = new FormData();
        formData.append('image', input.files[0]);
        try {
            const resp = await fetch('/api/upload', { method: 'POST', body: formData });
            const res = await resp.json();
            if (res.success) {
                document.getElementById('newSlideshowUrl').value = res.url;
            } else {
                alert('Gagal mengupload gambar.');
            }
        } catch (e) {
            console.error(e);
            alert('Terjadi kesalahan saat mengupload gambar.');
        }
    }
};

window.previewAboutImageUpload = async function (input) {
    if (input.files && input.files[0]) {
        const formData = new FormData();
        formData.append('image', input.files[0]);
        try {
            const resp = await fetch('/api/upload', { method: 'POST', body: formData });
            const res = await resp.json();
            if (res.success) {
                document.getElementById('configAboutImage').value = res.url;
            } else {
                alert('Gagal mengupload gambar.');
            }
        } catch (e) {
            console.error(e);
            alert('Terjadi kesalahan saat mengupload gambar.');
        }
    }
};

window.saveAllSettings = async function () {
    const payload = {
        hero_welcome_title: document.getElementById('configHeroTitle').value,
        hero_welcome_subtitle: document.getElementById('configHeroSubtitle').value,
        hero_font_color: document.getElementById('configHeroColor').value,
        whatsapp_admin_number: document.getElementById('configWhatsApp').value,
        instagram_url: document.getElementById('configInstagramUrl').value,
        business_address: document.getElementById('configBusinessAddress').value,
        gmaps_iframe_url: document.getElementById('configGmapsUrl').value,
        workshop_dropoff_allowed: String(document.getElementById('configWorkshopDropoff').checked),
        about_motto: document.getElementById('configAboutMotto').value,
        about_semantics: document.getElementById('configAboutSemantics').value,
        about_vision: document.getElementById('configAboutVision').value,
        about_mission: document.getElementById('configAboutMission').value,
        about_image: document.getElementById('configAboutImage').value,
        hero_slideshow_images: JSON.stringify(window.heroSlideshowImages)
    };
    try {
        const response = await fetch('/api/konfigurasi-sistem', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Role': 'owner'
            },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (data.success) {
            alert('Seluruh konfigurasi builder website berhasil disimpan!');
            window.location.reload();
        } else {
            alert('Gagal menyimpan konfigurasi: ' + (data.error || 'Terjadi kesalahan'));
        }
    } catch (err) {
        alert('Gagal menyimpan konfigurasi.');
    }
};

// ==========================================
// TESTIMONI & GALERI INSTAGRAM PORTFOLIO
// ==========================================

window.sliderImagesList = [];
window.currentSlideIndex = 0;

window.openImageSlider = function (imageUrlsStr, startIndex) {
    window.sliderImagesList = imageUrlsStr.split(',').map(u => u.trim());
    window.currentSlideIndex = startIndex;
    document.getElementById('imageSliderModal').style.display = 'flex';
    window.updateSliderView();
};

window.closeImageSlider = function () {
    document.getElementById('imageSliderModal').style.display = 'none';
};

window.slideImage = function (direction) {
    window.currentSlideIndex += direction;
    if (window.currentSlideIndex >= window.sliderImagesList.length) window.currentSlideIndex = 0;
    if (window.currentSlideIndex < 0) window.currentSlideIndex = window.sliderImagesList.length - 1;
    window.updateSliderView();
};

window.updateSliderView = function () {
    document.getElementById('sliderImage').src = window.sliderImagesList[window.currentSlideIndex];
    document.getElementById('sliderIndicator').innerText = (window.currentSlideIndex + 1) + " / " + window.sliderImagesList.length;
};

async function renderTestimonials() {
    const tbody = document.querySelector('#tab-testimonials tbody'); if (!tbody) return;
    const res = await fetch('/api/testimonials'); const ulasan = await res.json(); tbody.innerHTML = '';
    ulasan.forEach(t => {
        const isAcc = t.status === 'Approved';
        const badgeStatus = isAcc ? `<span class="status-badge" style="background:rgba(46,204,113,0.1); color:#2ecc71;">✓ LIVE</span>` : `<span class="status-badge" style="background:rgba(241,196,15,0.1); color:var(--accent-yellow);">⏳ Tertunda</span>`;
        const tombolAksi = isAcc ? `<button class="btn" style="background:#e74c3c; color:white; padding:4px 8px; font-size:0.8rem;" onclick="window.hapusTestimoni(${t.id})">Hapus</button>` : `<button class="btn btn-primary" style="padding:4px 8px; font-size:0.8rem;" onclick="window.setujuiTestimoni(${t.id})">Setujui</button> <button class="btn" style="background:#e74c3c; color:white; padding:4px 8px; font-size:0.8rem;" onclick="window.hapusTestimoni(${t.id})">Tolak</button>`;

        let fotoBuktiHtml = '-';
        if (t.image) {
            const urls = t.image.split(',');
            const safeImageStr = t.image.replace(/'/g, "\\'");
            fotoBuktiHtml = urls.map((url, i) => `<a href="javascript:void(0)" onclick="window.openImageSlider('${safeImageStr}', ${i})" style="color: var(--primary-sky); text-decoration: underline; display: block; margin-bottom: 2px;"><i class="fa-solid fa-image"></i> ${urls.length > 1 ? 'Foto ' + (i + 1) : 'Lihat Foto'}</a>`).join('');
        }
        tbody.innerHTML += `<tr><td><strong>${t.name}</strong></td><td>${'⭐'.repeat(t.rating)}</td><td><em>"${t.content}"</em></td><td>${fotoBuktiHtml}</td><td>${badgeStatus}</td><td>${tombolAksi}</td></tr>`;
    });
}

window.setujuiTestimoni = async function (id) {
    await fetch(`/api/testimonials/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-User-Role': 'owner' }, body: JSON.stringify({ status: 'Approved' }) });
    await renderTestimonials();
};

window.hapusTestimoni = async function (id) {
    if (confirm('Hapus testimoni ini?')) { await fetch(`/api/testimonials/${id}`, { method: 'DELETE', headers: { 'X-User-Role': 'owner' } }); await renderTestimonials(); }
};

async function renderGaleriTab() {
    const tbody = document.getElementById('galeriTableBody'); if (!tbody) return;
    const res = await fetch('/api/galeri'); const foto = await res.json(); tbody.innerHTML = '';
    foto.forEach(f => {
        const safePath = (f.path_gambar || '').replace(/'/g, "\\'");
        const safeLink = (f.link_instagram || '').replace(/'/g, "\\'");
        const safeDesc = (f.deskripsi_singkat || '').replace(/'/g, "\\'");

        const hasLink = f.link_instagram && f.link_instagram.trim() !== '' && f.link_instagram.trim() !== '#' && f.link_instagram !== 'null' && f.link_instagram !== 'undefined';
        const linkHref = hasLink ? f.link_instagram : 'javascript:void(0)';
        const linkTarget = hasLink ? 'target="_blank"' : '';
        const linkOnclick = hasLink ? '' : `onclick="alert('Link belum dimasukkan!'); return false;"`;

        tbody.innerHTML += `<tr>
            <td><img src="${f.path_gambar}" style="width:60px; height:40px; object-fit:cover; border-radius:6px;"></td>
            <td><a href="${linkHref}" ${linkTarget} ${linkOnclick} style="color:var(--primary-sky);">Link Feed</a></td>
            <td>
                <button class="btn btn-primary" style="padding:4px 8px; font-size:0.8rem; margin-right:5px;" onclick="window.openEditGaleriModal(${f.id}, '${safePath}', '${safeLink}', '${safeDesc}')">Edit</button>
                <button class="btn" style="background:#e74c3c; color:white; padding:4px 8px; font-size:0.8rem;" onclick="window.hapusFotoGaleri(${f.id})">Hapus</button>
            </td>
        </tr>`;
    });
}

window.openGaleriModal = () => {
    document.getElementById('galeriId').value = '';
    document.getElementById('galeriImageUrl').value = '';
    document.getElementById('galeriIgLink').value = '';
    document.getElementById('galeriDeskripsiSingkat').value = '';
    document.getElementById('galeriUploadGroup').style.display = 'block';
    document.getElementById('galeriDescGroup').style.display = 'block';
    document.getElementById('galeriModalTitle').innerText = 'Tambah Foto Galeri';
    document.getElementById('galeriModal').style.display = 'flex';
};

window.openEditGaleriModal = (id, path, link, desc) => {
    document.getElementById('galeriId').value = id;
    document.getElementById('galeriImageUrl').value = path;
    document.getElementById('galeriIgLink').value = link;
    document.getElementById('galeriDeskripsiSingkat').value = desc && desc !== 'undefined' ? desc : '';
    document.getElementById('galeriUploadGroup').style.display = 'block';
    document.getElementById('galeriDescGroup').style.display = 'block';
    document.getElementById('galeriModalTitle').innerText = 'Edit Foto Galeri';
    document.getElementById('galeriModal').style.display = 'flex';
};

window.saveGaleri = async function () {
    const id = document.getElementById('galeriId').value;
    const path_gambar = document.getElementById('galeriImageUrl').value;
    const link_instagram = document.getElementById('galeriIgLink').value;
    const deskripsi_singkat = document.getElementById('galeriDeskripsiSingkat').value;
    const payload = { path_gambar, link_instagram, deskripsi_singkat };

    let rute = '/api/galeri';
    let metode = 'POST';
    if (id) {
        rute = `/api/galeri/${id}`;
        metode = 'PUT';
    }

    await fetch(rute, {
        method: metode,
        headers: { 'Content-Type': 'application/json', 'X-User-Role': 'owner' },
        body: JSON.stringify(payload)
    });

    document.getElementById('galeriModal').style.display = 'none';
    alert(id ? 'Foto galeri berhasil diperbarui!' : 'Foto galeri berhasil disimpan!');
    await renderGaleriTab();
};

window.hapusFotoGaleri = async function (id) {
    if (confirm('Hapus foto ini?')) { await fetch(`/api/galeri/${id}`, { method: 'DELETE', headers: { 'X-User-Role': 'owner' } }); await renderGaleriTab(); }
};

// ==========================================
// ROLE ACCESS CONTROL RULES
// ==========================================

function terapkanBatasanAkses() {
    const peran = localStorage.getItem('role') || 'admin';
    if (peran === 'admin') {
        const tabKhususOwner = ['tab-revenue', 'tab-catalog', 'tab-testimonials', 'tab-galeri', 'tab-settings'];
        tabKhususOwner.forEach(tab => {
            const elemen = document.getElementById(tab);
            if (elemen) elemen.style.setProperty('display', 'none', 'important');
            const menuNode = document.querySelector(`[data-target="${tab}"]`);
            if (menuNode) menuNode.style.setProperty('display', 'none', 'important');
        });

        document.querySelectorAll('.owner-only').forEach(el => el.style.setProperty('display', 'none', 'important'));

        if (tabKhususOwner.includes(window.location.hash.substring(1))) {
            window.location.hash = '#tab-orders';
            document.querySelector('.menu-item[data-target="tab-orders"]').click();
        }
    }
}

window.processAdminOrder = async function (e) {
    e.preventDefault();
    const payload = {
        id: 'SPK-' + Date.now().toString().substring(8),
        name: document.getElementById('admName').value,
        phone: document.getElementById('admPhone').value,
        total: parseFloat(document.getElementById('admPrice').value),
        status: 2, lunas: 0, estimasi_selesai: '3 Hari',
        service: `${document.getElementById('admItem').value} (${document.getElementById('admService').value}) ${document.getElementById('admQty').value}x`,
        notes: document.getElementById('admNotes').value
    };
    await fetch('/api/pesanan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    alert('Pesanan manual kasir berhasil disimpan!');
    e.target.reset();
    await renderDaftarPesanan();
};

window.previewGaleriUpload = async function (input) {
    if (input.files && input.files[0]) {
        const formData = new FormData(); formData.append('image', input.files[0]);
        const resp = await fetch('/api/upload', { method: 'POST', body: formData });
        const res = await resp.json();
        if (res.success) { document.getElementById('galeriImageUrl').value = res.url; }
    }
};