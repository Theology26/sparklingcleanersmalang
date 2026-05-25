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
            eksekusiAman(renderGaleriTab, "GaleriTab"),
            eksekusiAman(renderKategoriTab, "KategoriTab"),
            eksekusiAman(renderAdditionalTab, "AdditionalTab")
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
            const tabKhususOwner = ['tab-revenue', 'tab-catalog', 'tab-testimonials', 'tab-galeri', 'tab-settings', 'tab-kategori-layanan', 'tab-additional-service'];

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
            if (idTarget === 'tab-kategori-layanan') eksekusiAman(renderKategoriTab, "KategoriTab");
            if (idTarget === 'tab-additional-service') eksekusiAman(renderAdditionalTab, "AdditionalTab");
            if (idTarget === 'tab-new-order') eksekusiAman(initManualOrderForm, "ManualOrder");
            if (idTarget === 'tab-membership') {} // tidak perlu load awal
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
    const data = await DB.getRingkasan();

    // KPI Cards
    const kpiRate = document.getElementById('kpi-completion-rate');
    if (kpiRate) kpiRate.innerText = `${data.rasio_penyelesaian}%`;
    document.getElementById('kpi-ring-completion')?.setAttribute('stroke-dasharray', `${data.rasio_penyelesaian}, 100`);
    const kpiVisit = document.getElementById('kpi-visitors');
    if (kpiVisit) kpiVisit.innerText = data.total_pesanan.toLocaleString('id-ID');
    const kpiRev = document.getElementById('kpi-revenue');
    if (kpiRev) kpiRev.innerText = `Rp ${data.pendapatan_bersih.toLocaleString('id-ID')}`;
    const kpiStock = document.getElementById('kpi-stock');
    if (kpiStock) kpiStock.innerText = `${data.stok_rata_persen}%`;
    document.getElementById('kpi-ring-stock')?.setAttribute('stroke-dasharray', `${data.stok_rata_persen}, 100`);

    // Charts
    membuatGrafikKinerja(data);
  } catch (err) { console.error('Ringkasan error:', err); }
}

function membuatGrafikKinerja(data) {
  if (typeof Chart === 'undefined') return;
  Object.keys(grafikAktif).forEach(g => { if (grafikAktif[g]) grafikAktif[g].destroy(); });

  const ctxLaris = document.getElementById('chartLayananLaris')?.getContext('2d');
  if (ctxLaris) {
    const kat = data.breakdown_kategori;
    grafikAktif.laris = new Chart(ctxLaris, {
      type: 'pie',
      data: {
        labels: Object.keys(kat),
        datasets: [{ data: Object.values(kat), backgroundColor: ['#3498DB', '#9B59B6', '#F1C40F'] }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  const ctxMetode = document.getElementById('chartMetodePesan')?.getContext('2d');
  if (ctxMetode) {
    const del = data.breakdown_delivery;
    grafikAktif.metode = new Chart(ctxMetode, {
      type: 'doughnut',
      data: {
        labels: ['Antar Jemput', 'Antar Sendiri'],
        datasets: [{ data: [del.antar_jemput, del.drop_off], backgroundColor: ['#E67E22', '#2ECC71'] }]
      },
      options: { responsive: true, maintainAspectRatio: false, cutout: '70%' }
    });
  }
}

// ==========================================
// PESANAN & NOTA
// ==========================================

window.resetModalScroll = function (modalId) {
    const container = document.querySelector(`#${modalId} > div`);
    if (container) container.scrollTop = 0;
};

window.bukaModalStatus = function (id, currentStatus) {
    window.idPesananDipilih = id;
    document.getElementById('statusSelect').value = currentStatus;
    document.getElementById('progressModal').style.display = 'flex';
    window.resetModalScroll('progressModal');
};

async function renderDaftarPesanan() {
    const tbody = document.querySelector('#tab-orders tbody');
    if (!tbody) return;
    try {
        const respon = await fetch('/api/pesanan');
        const dataPesanan = await respon.json();
        window.pesananSaatIni = dataPesanan;
        tbody.innerHTML = '';
        const teksStatus = [
            'Unknown', 
            '1. Penjemputan', 
            '2. Antrian Workshop', 
            '3. Proses Treatment', 
            '4. Pengeringan', 
            '5. Detailing & Finishing', 
            '6. Packaging', 
            '7. Menunggu Pembayaran', 
            '8. Pengantaran', 
            '9. Selesai'
        ];

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

window.saveStatusUpdate = async function() {
  const id = window.idPesananDipilih;
  const targetStatus = parseInt(document.getElementById('statusSelect').value);
  const dataObjek = window.pesananSaatIni.find(x => x.id === id);

  // Lock: status 8/9 butuh pembayaran lunas
  if (targetStatus >= 8 && (!dataObjek || parseInt(dataObjek.lunas) !== 1)) {
    if (confirm('Pesanan belum lunas. Tandai lunas terlebih dahulu?')) {
      await fetch(`/api/pesanan/${id}/status_pembayaran`, {
        method: 'PUT',
        headers: {'Content-Type':'application/json', 'X-User-Role': localStorage.getItem('role') || 'guest'},
        body: JSON.stringify({ lunas: 1 })
      });
      if (dataObjek) dataObjek.lunas = 1;
    } else return;
  }

  const res = await fetch(`/api/pesanan/${id}/status_proses`, {
    method: 'PUT',
    headers: {'Content-Type':'application/json', 'X-User-Role': localStorage.getItem('role') || 'guest'},
    body: JSON.stringify({ status: targetStatus })
  });
  const data = await res.json();

  // Status 7 → generate link WA nota otomatis
  if (targetStatus === 7 && data.success) {
    const order = window.pesananSaatIni.find(x => x.id === id);
    if (order) {
      window.kirimNotaViaWA(order);
    }
  }

  document.getElementById('progressModal').style.display = 'none';
  await renderDaftarPesanan();
  await rendorRingkasanKinerja();
};

// Cetak nota: window.open + document.write (BUKAN canvas)
window.cetakNotaManual = async function(orderData) {
  const win = window.open('', '_blank', 'width=500,height=900,scrollbars=yes');
  if (!win) { alert('Popup diblokir browser. Izinkan popup untuk mencetak nota.'); return; }
  win.document.write('<html><head><title>Memuat Nota...</title></head><body style="font-family:\'Segoe UI\',sans-serif; text-align:center; padding-top:100px; color:#666;"><p>Memuat nota...</p></body></html>');
  win.document.close();

  const sysCfg = (await DB.getSystemConfig()) || {};
  const igHandle = (sysCfg.instagram_url||'').split('/').filter(Boolean).pop()||'sparklingcleaners_mlg';
  const waNum = sysCfg.whatsapp_admin_number || '6285965957290';
  const waDisplay = waNum.startsWith('62') ? '0' + waNum.slice(2) : waNum;
  const alamat = sysCfg.business_address || 'Dusun Jamuran, Desa Sukodadi, Kecamatan Wagir, Kabupaten Malang, Jawa Timur';
  const rekBca = sysCfg.rekening_bca || 'BCA - 4480896021 - a.n EVAN NOVANDI KRISMANUEL';
  const rekBlu = sysCfg.rekening_blu || 'Blu Account - 007280954378 - a.n Evan Novandi Krismanuel';

  let cart = [];
  try { cart = JSON.parse(orderData.items || '[]'); } catch(e) {}
  if (!cart.length && orderData.service) {
    cart = [{ nama: orderData.service, qty: orderData.qty || 1, harga: parseFloat(orderData.price || 0) }];
  }

  const ongkir = parseFloat(orderData.ongkir || 0);
  const total = parseFloat(orderData.total || 0);

  const tglMasuk = orderData.date
    ? new Date(orderData.date).toLocaleDateString('id-ID', {day:'numeric',month:'long',year:'numeric'})
    : new Date().toLocaleDateString('id-ID', {day:'numeric',month:'long',year:'numeric'});

  const tglSelesai = orderData.estimasi_selesai
    ? orderData.estimasi_selesai
    : '–';

  const logoUrl = window.location.origin + '/assets/logo.png';

  win.document.open();
  win.document.write(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Nota ${orderData.id}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 13px;
      color: #1a1a1a;
      background: #f1f5f9;
      padding: 20px 10px 40px;
    }
    #invoice-card {
      background: #fff;
      width: 400px;
      margin: 0 auto;
      padding: 24px 20px 32px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      border-radius: 8px;
    }
    .center { text-align: center; }
    .logo-wrap { text-align:center; margin-bottom:14px; }
    .logo { width:72px; height:72px; border-radius:50%; object-fit:contain; }
    hr { border:none; border-top:1px solid #bbb; margin:12px 0; }
    hr.bold { border-top:2px solid #333; }
    .row { display:flex; margin-bottom:5px; line-height:1.5; }
    .lbl { color:#444; width:125px; flex-shrink:0; }
    .colon { width:15px; flex-shrink:0; color:#444; }
    .val { flex:1; text-align:left; word-break:break-word; }
    .layanan-row {
      display:flex; align-items:flex-start;
      justify-content:space-between; margin-bottom:6px;
    }
    .l-nama { flex:1; padding-right:8px; }
    .l-qty { width:24px; text-align:center; color:#555; }
    .l-harga { min-width:60px; text-align:right; font-weight:600; }
    .total-row {
      display:flex; justify-content:space-between;
      font-size:15px; font-weight:800; padding:10px 0 4px;
    }
    .section-title { font-weight:700; margin-bottom:8px; }
    .ketentuan { font-size:11.5px; line-height:1.7; color:#333; }
    .ketentuan li { margin-left:14px; margin-bottom:3px; }
    .perhatian {
      font-weight:800; font-size:12px; text-align:center;
      border:1.5px solid #333; padding:8px; border-radius:6px;
      margin:10px 0; letter-spacing:0.3px;
    }
    .rekening { font-size:12px; margin-bottom:4px; }
    .footer {
      text-align:center; font-weight:700; font-size:13px;
      margin-top:16px; line-height:1.7;
    }
    .actions-wrapper {
      max-width: 400px;
      margin: 20px auto 0;
      display: flex;
      gap: 12px;
      justify-content: center;
    }
    .action-btn {
      flex: 1;
      border: none;
      padding: 10px 16px;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
      font-size: 13px;
      letter-spacing: 0.3px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: opacity 0.2s;
    }
    .action-btn:hover { opacity: 0.9; }
    .print-btn {
      background: #F1C40F;
      color: #1a1a1a;
    }
    .image-btn {
      background: #3498db;
      color: white;
    }
    @media print {
      body { background: #fff; padding: 0; }
      #invoice-card { box-shadow: none; border-radius: 0; padding: 0; width: 100%; }
      .actions-wrapper { display:none !important; }
    }
  </style>
</head>
<body>
  <div id="invoice-card">
    <div class="logo-wrap">
      <img src="${logoUrl}" alt="Logo Sparkling Cleaners" class="logo"
           onerror="this.style.display='none'">
    </div>

    <hr class="bold">

    <div class="row"><span class="lbl">Instagram</span><span class="colon">:</span><span class="val">${igHandle}</span></div>
    <div class="row"><span class="lbl">WhatsApp</span><span class="colon">:</span><span class="val">${waDisplay}</span></div>
    <div class="row" style="align-items:flex-start;">
      <span class="lbl">Alamat</span>
      <span class="colon">:</span>
      <span class="val" style="line-height:1.5;">${alamat}</span>
    </div>

    <hr>

    <div class="row"><span class="lbl">No. Order</span><span class="colon">:</span><span class="val">${orderData.id}</span></div>
    <div class="row"><span class="lbl">Nama</span><span class="colon">:</span><span class="val">${orderData.name}</span></div>
    <div class="row"><span class="lbl">Tanggal Masuk</span><span class="colon">:</span><span class="val">${tglMasuk}</span></div>
    <div class="row"><span class="lbl">Tanggal Selesai</span><span class="colon">:</span><span class="val">${tglSelesai}</span></div>

    <hr>

    <div class="section-title">Rincian Layanan :</div>
    ${cart.map(item => `
      <div class="layanan-row">
        <span class="l-nama">${item.nama || item.name || ''}</span>
        <span class="l-qty">${item.qty || 1}</span>
        <span class="l-harga">${Math.round((item.harga || item.price || 0) / 1000)}K</span>
      </div>
    `).join('')}
    ${ongkir > 0 ? `
      <div class="layanan-row" style="color:#555;">
        <span class="l-nama">Ongkir</span>
        <span class="l-qty">–</span>
        <span class="l-harga">${Math.round(ongkir / 1000)}K</span>
      </div>
    ` : ''}

    <hr>

    <div class="total-row">
      <span>Total</span>
      <span>${Math.round(total / 1000)}K</span>
    </div>

    <hr class="bold">

    <div class="section-title">KETENTUAN PEMBAYARAN:</div>
    <ul class="ketentuan">
      <li>Seluruh biaya layanan wajib dilunasi sebelum barang diserahkan atau dikirim.</li>
      <li>Pengambilan dan pengantaran hanya dapat dilakukan setelah pembayaran terverifikasi.</li>
      <li>Konfirmasi pembayaran melalui WhatsApp Admin ${waDisplay} dengan bukti transfer.</li>
    </ul>

    <div class="perhatian">
      BARANG TIDAK DAPAT DIAMBIL MAUPUN DIKIRIM<br>
      SEBELUM PEMBAYARAN DINYATAKAN LUNAS.
    </div>

    <hr>

    <div class="section-title">No. Rekening :</div>
    <div class="rekening">${rekBca}</div>
    <div class="rekening">${rekBlu}</div>

    <hr>

    <div class="footer">
      Terima Kasih telah mempercayakan<br>
      barang anda ke Sparkling Cleaners ✨
    </div>
  </div>

  <div class="actions-wrapper">
    <button class="action-btn print-btn" onclick="window.print()">🖨️ Cetak / PDF</button>
    <button class="action-btn image-btn" onclick="downloadAsImage()">🖼️ Simpan Gambar</button>
  </div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
  <script>
    function downloadAsImage() {
      const actions = document.querySelector('.actions-wrapper');
      if (actions) actions.style.display = 'none';
      
      const element = document.getElementById('invoice-card');
      
      // Ensure local image URLs render fine
      html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#ffffff'
      }).then(canvas => {
        if (actions) actions.style.display = 'flex';
        
        const link = document.createElement('a');
        link.download = 'Nota_${orderData.id}.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      }).catch(err => {
        console.error(err);
        if (actions) actions.style.display = 'flex';
        alert('Gagal membuat gambar: ' + err.message);
      });
    }
  </script>
</body>
</html>`);
  win.document.close();
};

// Kirim nota via WA (generate link)
window.kirimNotaViaWA = async function(order) {
  const waWin = window.open('', '_blank');
  if (!waWin) { alert('Popup diblokir browser. Izinkan popup untuk mengirim nota via WhatsApp.'); }

  const sysCfg = await DB.getSystemConfig();
  const waAdmin = sysCfg.whatsapp_admin_number || '6285965957290';

  let cart = [];
  try { cart = JSON.parse(order.items || '[]'); } catch(e) {}
  if (!cart.length && order.service) {
    cart = [{ nama: order.service, qty: order.qty || 1, harga: parseFloat(order.price || 0) }];
  }

  const ongkir = parseFloat(order.ongkir || 0);
  const total = parseFloat(order.total || 0);

  const tglMasuk = order.date
    ? new Date(order.date).toLocaleDateString('id-ID', {day:'numeric',month:'long',year:'numeric'})
    : '–';

  const waCustomer = order.phone.startsWith('0') ? '62' + order.phone.slice(1) : order.phone;

  let pesanNota = `Halo ${order.name} 😊%0A%0A`;
  pesanNota += `Pesanan Anda di *Sparkling Cleaners* sudah selesai dikerjakan dan siap dikirim setelah pembayaran.%0A%0A`;
  pesanNota += `*NOTA LAYANAN*%0A`;
  pesanNota += `━━━━━━━━━━━━━━━━━━━━%0A`;
  pesanNota += `No. Order     : *${order.id}*%0A`;
  pesanNota += `Nama          : ${order.name}%0A`;
  pesanNota += `Tanggal Masuk : ${tglMasuk}%0A`;
  pesanNota += `%0A`;
  pesanNota += `*Rincian Layanan:*%0A`;
  cart.forEach(item => {
    const h = Math.round((item.harga || item.price || 0) / 1000);
    pesanNota += `• ${item.nama || item.name} (${item.qty || 1}x) : ${h}K%0A`;
  });
  if (ongkir > 0) pesanNota += `• Ongkir : ${Math.round(ongkir/1000)}K%0A`;
  pesanNota += `━━━━━━━━━━━━━━━━━━━━%0A`;
  pesanNota += `*Total : ${Math.round(total/1000)}K*%0A%0A`;
  pesanNota += `*Pembayaran ke:*%0A`;
  pesanNota += `BCA : 4480896021 a.n EVAN NOVANDI KRISMANUEL%0A`;
  pesanNota += `Blu : 007280954378 a.n Evan Novandi Krismanuel%0A%0A`;
  pesanNota += `Mohon konfirmasi pembayaran ke WA Admin setelah transfer. Terima kasih! 🙏`;

  const waUrl = `https://wa.me/${waCustomer}?text=${pesanNota}`;

  if (waWin) {
    waWin.location.href = waUrl;
  } else {
    window.open(waUrl, '_blank');
  }

  // Juga cetak nota
  window.cetakNotaManual(order);
};

// Tombol Nota di tab pesanan (ganti eksporNotaGambar)
window.eksporNotaGambar = function(id) {
  const data = window.pesananSaatIni.find(x => x.id === id);
  if (!data) { alert('Data pesanan tidak ditemukan.'); return; }
  window.cetakNotaManual(data);
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
    window.resetModalScroll('stockModal');
};

window.saveStockItem = async function (e) {
    e.preventDefault();
    const payload = {
        name: document.getElementById('stockName').value.trim(),
        category: document.getElementById('stockCategory').value.trim(),
        unit: document.getElementById('stockUnit').value.trim(),
        price: parseFloat(document.getElementById('stockPrice').value),
        stock: parseFloat(document.getElementById('stockQty').value),
        min_stock: parseFloat(document.getElementById('stockMin').value)
    };

    if (!payload.name) { alert('Nama bahan wajib diisi.'); return; }
    if (!payload.category) { alert('Kategori wajib diisi.'); return; }
    if (!payload.unit) { alert('Satuan wajib diisi.'); return; }
    if (isNaN(payload.price) || payload.price < 0) { alert('Harga per unit harus berupa angka positif.'); return; }
    if (isNaN(payload.stock) || payload.stock < 0) { alert('Jumlah stok awal harus berupa angka positif.'); return; }

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
        const daftarLayanan = await DB.getServices();
        document.getElementById('stat-active-services').innerText = `${daftarLayanan.length} Layanan DB Aktif`;
        listBody.innerHTML = '';
        daftarLayanan.forEach(layanan => {
            const baris = document.createElement('tr');
            baris.innerHTML = `
                <td><img src="${layanan.image || 'https://images.unsplash.com/photo-1595950653106-6c9ebd614c3a?w=60'}" alt="Foto ${layanan.name}" loading="lazy" style="width:45px; height:30px; object-fit:cover; border-radius:4px;"></td>
                <td><strong>${layanan.name}</strong></td>
                <td><span class="status-badge" style="background:rgba(6,182,212,0.1); color:var(--primary-sky);">${layanan.category}</span></td>
                <td>${layanan.treatment}</td>
                <td>Rp ${parseFloat(layanan.price).toLocaleString('id-ID')}</td>
                <td>${layanan.estimation}</td>
                <td>
                    <button class="btn btn-primary owner-only" style="padding:4px 8px; font-size:0.8rem;" onclick="window.openServiceModal('${layanan.id}')" aria-label="Edit Layanan ${layanan.name}"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn owner-only" style="padding:4px 8px; font-size:0.8rem; background:#e74c3c; color:white; margin-left:5px;" onclick="window.deleteServiceItem('${layanan.id}')" aria-label="Hapus Layanan ${layanan.name}"><i class="fa-solid fa-trash"></i></button>
                </td>`;
            listBody.appendChild(baris);
        });
        terapkanBatasanAkses(); // Hide buttons again if admin
    } catch (err) { console.error(err); }
}

window.openServiceModal = async function (id = null) {
    document.getElementById('serviceModal').style.display = 'flex';
    window.resetModalScroll('serviceModal');
    
    // Previews elements
    const mainPreview = document.getElementById('serviceFormImagePreview');
    const addPreviewContainer = document.getElementById('serviceFormAdditionalPreview');
    
    let selectedKategoriId = null;
    if (id) {
        document.getElementById('serviceModalTitle').innerText = 'Edit Layanan';
        const resp = await fetch('/api/services');
        const daftar = await resp.json();
        const s = daftar.find(x => x.id == id);
        if (s) {
            document.getElementById('serviceFormId').value = s.id;
            document.getElementById('serviceFormName').value = s.name;
            document.getElementById('serviceFormPrice').value = Math.round(s.price);
            document.getElementById('serviceFormEstimation').value = s.estimation;
            document.getElementById('serviceFormDescription').value = s.description || '';
            document.getElementById('serviceFormImage').value = s.image || '';
            document.getElementById('serviceFormAdditionalImages').value = s.additional_images || '';
            selectedKategoriId = s.id_kategori;
            
            // Populate main photo preview
            if (s.image) {
                mainPreview.src = s.image;
                mainPreview.style.display = 'block';
            } else {
                mainPreview.style.display = 'none';
                mainPreview.src = '';
            }
            
            // Populate additional photos preview
            addPreviewContainer.innerHTML = '';
            if (s.additional_images) {
                s.additional_images.split(',').map(u => u.trim()).filter(Boolean).forEach(url => {
                    const img = document.createElement('img');
                    img.src = url;
                    img.alt = 'Preview foto tambahan layanan';
                    img.style.cssText = 'width:70px;height:auto;border-radius:6px;object-fit:contain;';
                    addPreviewContainer.appendChild(img);
                });
            }
        }
    } else {
        document.getElementById('serviceModalTitle').innerText = 'Tambah Layanan Baru';
        // Manual input reset because serviceForm is a div
        document.getElementById('serviceFormId').value = '';
        document.getElementById('serviceFormName').value = '';
        document.getElementById('serviceFormPrice').value = '';
        document.getElementById('serviceFormEstimation').value = '';
        document.getElementById('serviceFormDescription').value = '';
        document.getElementById('serviceFormImage').value = '';
        document.getElementById('serviceFormAdditionalImages').value = '';
        const imgFile = document.getElementById('serviceFormImageFile');
        if (imgFile) imgFile.value = '';
        const addFiles = document.getElementById('serviceFormAdditionalFiles');
        if (addFiles) addFiles.value = '';
        
        mainPreview.style.display = 'none';
        mainPreview.src = '';
        addPreviewContainer.innerHTML = '';
    }

    await loadKategoriDropdown(selectedKategoriId);
    await loadAdditionalChecklist(id);
};

async function loadKategoriDropdown(selectedId = null) {
  const select = document.getElementById('serviceFormKategori');
  if (!select) return;
  const kategori = await DB.getAllKategoriLayanan();
  select.innerHTML = '<option value="">-- Pilih Kategori --</option>' +
    kategori.map(k =>
      `<option value="${k.id}" ${parseInt(selectedId) === k.id ? 'selected' : ''}>
        ${k.nama_kategori}
      </option>`
    ).join('');
}

async function loadAdditionalChecklist(idLayanan = null) {
  const container = document.getElementById('serviceFormAdditionalList');
  if (!container) return;

  const allAdditional = await DB.getAdditionalService();
  let selectedIds = [];
  if (idLayanan) {
    const assigned = await DB.getAdditionalByLayanan(idLayanan);
    selectedIds = assigned.map(a => a.id);
  }

  if (allAdditional.length === 0) {
    container.innerHTML = `
      <p style="color:var(--text-muted); font-size:0.85rem;">
        Belum ada additional service. Buat dulu di tab "Additional Service".
      </p>`;
    return;
  }

  container.innerHTML = allAdditional.map(a => `
    <label style="display:flex; align-items:center; gap:10px; cursor:pointer;
                  padding:8px 12px; border-radius:10px;
                  border:1px solid var(--glass-border); transition:background 0.15s;"
           onmouseover="this.style.background='rgba(52,152,219,0.06)'"
           onmouseout="this.style.background=''">
      <input type="checkbox"
             name="additional_service"
             value="${a.id}"
             ${selectedIds.includes(a.id) ? 'checked' : ''}
             style="width:18px; height:18px; cursor:pointer;">
      <span style="font-weight:600; color:var(--primary-navy);">${a.nama}</span>
      <span style="color:var(--primary-sky); font-size:0.85rem;">+${DB.formatCurrency(a.harga)}</span>
    </label>
  `).join('');
}

window.previewServiceMainPhoto = async function(input) {
  if (!input.files || !input.files[0]) return;
  const formData = new FormData();
  formData.append('image', input.files[0]);
  try {
    const resp = await fetch('/api/upload', { method: 'POST', body: formData });
    const res = await resp.json();
    if (res.success) {
      document.getElementById('serviceFormImage').value = res.url;
      const prev = document.getElementById('serviceFormImagePreview');
      prev.src = res.url;
      prev.style.display = 'block';
    }
  } catch(e) { alert('Gagal upload foto utama.'); }
};

window.uploadServiceAdditionalPhotos = async function(input) {
  if (!input.files || !input.files.length) return;
  const formData = new FormData();
  Array.from(input.files).forEach(f => formData.append('image', f));
  try {
    const resp = await fetch('/api/upload', { method: 'POST', body: formData });
    const res = await resp.json();
    if (res.success) {
      const existing = document.getElementById('serviceFormAdditionalImages').value.trim();
      const newUrls = res.urls.join(', ');
      document.getElementById('serviceFormAdditionalImages').value =
        existing ? `${existing}, ${newUrls}` : newUrls;
      // Preview thumbnails
      const prevContainer = document.getElementById('serviceFormAdditionalPreview');
      res.urls.forEach(url => {
        const img = document.createElement('img');
        img.src = url;
        img.alt = 'Preview foto tambahan layanan';
        img.style.cssText = 'width:70px;height:auto;border-radius:6px;object-fit:contain;';
        prevContainer.appendChild(img);
      });
    }
  } catch(e) { alert('Gagal upload foto tambahan.'); }
};

window.saveServiceItem = async function (e) {
    e.preventDefault();
    const id = document.getElementById('serviceFormId').value;
    const serviceId = id || ('SVC-' + Date.now());
    const payload = {
        name: document.getElementById('serviceFormName').value.trim(),
        category: '', // resolves automatically on backend using id_kategori
        treatment: '', // resolves automatically on backend
        price: parseFloat(document.getElementById('serviceFormPrice').value),
        estimation: document.getElementById('serviceFormEstimation').value.trim(),
        description: document.getElementById('serviceFormDescription').value.trim(),
        image: document.getElementById('serviceFormImage').value.trim(),
        additional_images: document.getElementById('serviceFormAdditionalImages').value.trim(),
        id_kategori: document.getElementById('serviceFormKategori').value ? parseInt(document.getElementById('serviceFormKategori').value) : null
    };

    if (!payload.name) { alert('Nama layanan wajib diisi.'); return; }
    if (!payload.id_kategori) { alert('Silakan pilih kategori layanan.'); return; }
    if (isNaN(payload.price) || payload.price < 0) { alert('Harga harus berupa angka positif.'); return; }
    if (!payload.estimation) { alert('Estimasi waktu wajib diisi.'); return; }

    const rute = id ? `/api/services/${id}` : '/api/services';
    const metode = id ? 'PUT' : 'POST';

    const resp = await fetch(rute, {
        method: metode,
        headers: { 'Content-Type': 'application/json', 'X-User-Role': 'owner' },
        body: JSON.stringify(id ? payload : { id: serviceId, ...payload })
    });

    if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        alert('Gagal menyimpan layanan: ' + (errData.error || 'Terjadi kesalahan pada server.'));
        return;
    }

    // Save Layanan Additional Service Relationships
    const checkedBoxes = document.querySelectorAll('input[name="additional_service"]:checked');
    const additionalIds = Array.from(checkedBoxes).map(cb => parseInt(cb.value));
    await DB.setLayananAdditional(serviceId, additionalIds);

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
        const subtitleColorEl = document.getElementById('configHeroSubtitleColor');
        if (subtitleColorEl) subtitleColorEl.value = konfigurasi.hero_font_subtitle_color || '#ffffff';
        
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

        const reqBca = document.getElementById('configRekeningBca');
        if (reqBca) reqBca.value = konfigurasi.rekening_bca || '';
        const reqBlu = document.getElementById('configRekeningBlu');
        if (reqBlu) reqBlu.value = konfigurasi.rekening_blu || '';
        const defaultKasir = document.getElementById('configNamaKasir');
        if (defaultKasir) defaultKasir.value = konfigurasi.nama_kasir_default || '';

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
        hero_welcome_title: document.getElementById('configHeroTitle').value.trim(),
        hero_welcome_subtitle: document.getElementById('configHeroSubtitle').value.trim(),
        hero_font_color: document.getElementById('configHeroColor').value,
        hero_font_subtitle_color: document.getElementById('configHeroSubtitleColor')?.value || '#ffffff',
        whatsapp_admin_number: document.getElementById('configWhatsApp').value.trim(),
        instagram_url: document.getElementById('configInstagramUrl').value.trim(),
        business_address: document.getElementById('configBusinessAddress').value.trim(),
        gmaps_iframe_url: document.getElementById('configGmapsUrl').value.trim(),
        workshop_dropoff_allowed: String(document.getElementById('configWorkshopDropoff').checked),
        about_motto: document.getElementById('configAboutMotto').value.trim(),
        about_semantics: document.getElementById('configAboutSemantics').value.trim(),
        about_vision: document.getElementById('configAboutVision').value.trim(),
        about_mission: document.getElementById('configAboutMission').value.trim(),
        about_image: document.getElementById('configAboutImage').value.trim(),
        rekening_bca: document.getElementById('configRekeningBca')?.value.trim() || '',
        rekening_blu: document.getElementById('configRekeningBlu')?.value.trim() || '',
        nama_kasir_default: document.getElementById('configNamaKasir')?.value.trim() || '',
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
        
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            alert('Gagal menyimpan konfigurasi: ' + (errData.error || 'Terjadi kesalahan pada server.'));
            return;
        }

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

async function renderTestimonials() {
    const tbody = document.querySelector('#tab-testimonials tbody'); if (!tbody) return;
    const res = await fetch('/api/testimonials'); const ulasan = await res.json(); tbody.innerHTML = '';
    ulasan.forEach(t => {
        const isAcc = t.status === 'Approved';
        const badgeStatus = isAcc ? `<span class="status-badge" style="background:rgba(46,204,113,0.1); color:#2ecc71;">✓ LIVE</span>` : `<span class="status-badge" style="background:rgba(241,196,15,0.1); color:var(--accent-yellow);">⏳ Tertunda</span>`;
        const tombolAksi = isAcc ? `<button class="btn" style="background:#e74c3c; color:white; padding:4px 8px; font-size:0.8rem;" onclick="window.hapusTestimoni(${t.id})">Hapus</button>` : `<button class="btn btn-primary" style="padding:4px 8px; font-size:0.8rem;" onclick="window.setujuiTestimoni(${t.id})">Setujui</button> <button class="btn" style="background:#e74c3c; color:white; padding:4px 8px; font-size:0.8rem;" onclick="window.hapusTestimoni(${t.id})">Tolak</button>`;

        const fotoHtml = t.image
          ? t.image.split(',').map(u => u.trim()).filter(Boolean).map(u =>
              `<img src="${u}"
                    alt="Foto bukti testimoni dari ${t.name}"
                    loading="lazy"
                    style="width:56px;height:56px;object-fit:cover;border-radius:8px;
                           cursor:pointer;margin-right:4px;border:2px solid var(--glass-border);"
                    onclick="window.open('${u}','_blank')">`
            ).join('')
          : `<span style="color:var(--text-muted);font-size:0.8rem;">—</span>`;

        tbody.innerHTML += `<tr>
          <td><strong>${t.name}</strong></td>
          <td>${'⭐'.repeat(t.rating)}</td>
          <td><em style="font-size:0.9rem;">"${t.content}"</em></td>
          <td>${fotoHtml}</td>
          <td>${badgeStatus}</td>
          <td>${tombolAksi}</td>
        </tr>`;
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
        tbody.innerHTML += `<tr>
            <td><img src="${f.path_gambar}" style="width:60px; height:40px; object-fit:cover; border-radius:6px;"></td>
            <td><a href="${f.link_instagram || '#'}" target="_blank" style="color:var(--primary-sky);">Link Feed</a></td>
            <td>
                <button class="btn btn-primary" style="padding:4px 8px; font-size:0.8rem; margin-right:5px;" onclick="window.openEditGaleriModal(${f.id}, '${safePath}', '${safeLink}')">Edit</button>
                <button class="btn" style="background:#e74c3c; color:white; padding:4px 8px; font-size:0.8rem;" onclick="window.hapusFotoGaleri(${f.id})">Hapus</button>
            </td>
        </tr>`;
    });
}

window.openGaleriModal = () => {
    document.getElementById('galeriId').value = '';
    document.getElementById('galeriImageUrl').value = '';
    document.getElementById('galeriIgLink').value = '';
    const prev = document.getElementById('galeriImagePreview');
    if (prev) {
        prev.src = '';
        prev.style.display = 'none';
    }
    document.getElementById('galeriModalTitle').innerText = 'Tambah Foto Galeri';
    document.getElementById('galeriModal').style.display = 'flex';
    window.resetModalScroll('galeriModal');
};

window.openEditGaleriModal = (id, path, link) => {
    document.getElementById('galeriId').value = id;
    document.getElementById('galeriImageUrl').value = path;
    document.getElementById('galeriIgLink').value = link;
    const prev = document.getElementById('galeriImagePreview');
    if (prev && path) {
        prev.src = path;
        prev.style.display = 'block';
    } else if (prev) {
        prev.src = '';
        prev.style.display = 'none';
    }
    document.getElementById('galeriModalTitle').innerText = 'Edit Foto Galeri';
    document.getElementById('galeriModal').style.display = 'flex';
    window.resetModalScroll('galeriModal');
};

window.saveGaleri = async function () {
    const id = document.getElementById('galeriId').value;
    const path_gambar = document.getElementById('galeriImageUrl').value.trim();
    const link_instagram = document.getElementById('galeriIgLink').value.trim();
    const payload = { path_gambar, link_instagram };

    if (!payload.path_gambar) { alert('Foto galeri wajib diunggah atau memiliki URL.'); return; }

    let rute = '/api/galeri';
    let metode = 'POST';
    if (id) {
        rute = `/api/galeri/${id}`;
        metode = 'PUT';
    }

    const resp = await fetch(rute, {
        method: metode,
        headers: { 'Content-Type': 'application/json', 'X-User-Role': 'owner' },
        body: JSON.stringify(payload)
    });

    if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        alert('Gagal menyimpan foto galeri: ' + (errData.error || 'Terjadi kesalahan pada server.'));
        return;
    }

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
    const peran = localStorage.getItem('role') || localStorage.getItem('userRole') || 'owner';
    if (peran === 'admin') {
        const tabKhususOwner = ['tab-revenue', 'tab-catalog', 'tab-testimonials', 'tab-galeri', 'tab-settings', 'tab-kategori-layanan', 'tab-additional-service'];
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

window.previewGaleriUpload = async function (input) {
    if (input.files && input.files[0]) {
        const formData = new FormData(); formData.append('image', input.files[0]);
        const resp = await fetch('/api/upload', { method: 'POST', body: formData });
        const res = await resp.json();
        if (res.success) {
            document.getElementById('galeriImageUrl').value = res.url;
            const prev = document.getElementById('galeriImagePreview');
            if (prev) {
                prev.src = res.url;
                prev.style.display = 'block';
            }
        }
    }
};

// =============================================
// KATEGORI LAYANAN OPS (V3 OVERHAUL)
// =============================================

async function renderKategoriTab() {
  const tbody = document.getElementById('kategoriTableBody');
  if (!tbody) return;
  const items = await DB.getAllKategoriLayanan();
  tbody.innerHTML = '';
  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:2rem;">
      Belum ada kategori layanan. Klik "+ Tambah Kategori" untuk mulai.
    </td></tr>`;
    return;
  }
  items.forEach(k => {
    tbody.innerHTML += `<tr>
      <td>
        <img src="${k.foto_kategori || ''}"
             alt="Foto kategori ${k.nama_kategori}"
             loading="lazy"
             style="width:70px; height:50px; object-fit:cover;
                    border-radius:8px; background:#f0f4ff;"
             onerror="this.style.display='none'">
      </td>
      <td><strong>${k.nama_kategori}</strong></td>
      <td>${k.urutan}</td>
      <td>
        <span class="status-badge"
              style="background:${k.aktif ? 'rgba(46,204,113,0.1)' : 'rgba(231,76,60,0.1)'};
                     color:${k.aktif ? '#2ecc71' : '#e74c3c'};">
          ${k.aktif ? 'Aktif' : 'Nonaktif'}
        </span>
      </td>
      <td>
        <button class="btn btn-primary" style="padding:4px 8px; font-size:0.8rem;"
                onclick="window.openKategoriModal(${k.id})">Edit</button>
        <button class="btn" style="padding:4px 8px; font-size:0.8rem;
                background:#e74c3c; color:white; margin-left:5px;"
                onclick="window.hapusKategori(${k.id})">Hapus</button>
      </td>
    </tr>`;
  });
}

window.openKategoriModal = async function(id = null) {
  document.getElementById('kategoriId').value = id || '';
  document.getElementById('kategoriModalTitle').innerText =
    id ? 'Edit Kategori' : 'Tambah Kategori Baru';
  document.getElementById('kategoriImagePreview').style.display = 'none';

  if (id) {
    const all = await DB.getAllKategoriLayanan();
    const k = all.find(x => x.id === id);
    if (k) {
      document.getElementById('kategoriNama').value = k.nama_kategori;
      document.getElementById('kategoriUrutan').value = k.urutan;
      document.getElementById('kategoriImageUrl').value = k.foto_kategori || '';
      if (k.foto_kategori) {
        const prev = document.getElementById('kategoriImagePreview');
        prev.src = k.foto_kategori;
        prev.style.display = 'block';
      }
    }
  } else {
    document.getElementById('kategoriNama').value = '';
    document.getElementById('kategoriUrutan').value = '0';
    document.getElementById('kategoriImageUrl').value = '';
  }
  document.getElementById('kategoriModal').style.display = 'flex';
  window.resetModalScroll('kategoriModal');
};

window.uploadKategoriFoto = async function(input) {
  if (!input.files || !input.files[0]) return;
  const formData = new FormData();
  formData.append('image', input.files[0]);
  const resp = await fetch('/api/upload', { method: 'POST', body: formData });
  const res = await resp.json();
  if (res.success) {
    document.getElementById('kategoriImageUrl').value = res.url;
    const prev = document.getElementById('kategoriImagePreview');
    prev.src = res.url;
    prev.style.display = 'block';
  }
};

window.saveKategori = async function() {
  const id = document.getElementById('kategoriId').value;
  const urutanVal = document.getElementById('kategoriUrutan').value;
  const payload = {
    nama_kategori: document.getElementById('kategoriNama').value.trim(),
    foto_kategori: document.getElementById('kategoriImageUrl').value.trim(),
    urutan: parseInt(urutanVal) || 0,
    aktif: 1
  };
  if (!payload.nama_kategori) { alert('Nama kategori wajib diisi.'); return; }
  if (isNaN(payload.urutan) || payload.urutan < 0) { alert('Urutan tampil harus berupa angka positif.'); return; }

  let res;
  if (id) {
    res = await DB.updateKategori(id, payload);
  } else {
    res = await DB.addKategori(payload);
  }
  
  if (!res || res.success === false) {
    alert('Gagal menyimpan kategori: ' + (res?.error || 'Terjadi kesalahan pada server.'));
    return;
  }
  
  document.getElementById('kategoriModal').style.display = 'none';
  alert('Kategori berhasil disimpan!');
  await renderKategoriTab();
};

window.hapusKategori = async function(id) {
  if (!confirm('Hapus kategori ini? Layanan dalam kategori ini tidak akan terhapus.')) return;
  await DB.deleteKategori(id);
  await renderKategoriTab();
};

// =============================================
// ADDITIONAL SERVICE OPS
// =============================================

async function renderAdditionalTab() {
  const tbody = document.getElementById('additionalTableBody');
  if (!tbody) return;
  const items = await DB.getAdditionalService();
  tbody.innerHTML = '';
  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:2rem;">
      Belum ada additional service. Klik "+ Tambah Additional" untuk mulai.
    </td></tr>`;
    return;
  }
  items.forEach(a => {
    tbody.innerHTML += `<tr>
      <td><strong>${a.nama}</strong></td>
      <td>${DB.formatCurrency(a.harga)}</td>
      <td style="color:var(--text-muted); font-size:0.88rem;">${a.deskripsi || '—'}</td>
      <td>
        <button class="btn btn-primary" style="padding:4px 8px; font-size:0.8rem;"
                onclick="window.openAdditionalModal(${a.id})">Edit</button>
        <button class="btn" style="padding:4px 8px; font-size:0.8rem;
                background:#e74c3c; color:white; margin-left:5px;"
                onclick="window.hapusAdditional(${a.id})">Hapus</button>
      </td>
    </tr>`;
  });
}

window.openAdditionalModal = async function(id = null) {
  document.getElementById('additionalId').value = id || '';
  document.getElementById('additionalModalTitle').innerText =
    id ? 'Edit Additional Service' : 'Tambah Additional Service Baru';

  if (id) {
    const all = await DB.getAdditionalService();
    const a = all.find(x => x.id === id);
    if (a) {
      document.getElementById('additionalNama').value = a.nama;
      document.getElementById('additionalHarga').value = a.harga;
      document.getElementById('additionalDeskripsi').value = a.deskripsi || '';
    }
  } else {
    document.getElementById('additionalNama').value = '';
    document.getElementById('additionalHarga').value = '';
    document.getElementById('additionalDeskripsi').value = '';
  }
  document.getElementById('additionalModal').style.display = 'flex';
  window.resetModalScroll('additionalModal');
};

window.saveAdditional = async function() {
  const id = document.getElementById('additionalId').value;
  const hargaVal = document.getElementById('additionalHarga').value;
  const payload = {
    nama: document.getElementById('additionalNama').value.trim(),
    harga: parseFloat(hargaVal) || 0,
    deskripsi: document.getElementById('additionalDeskripsi').value.trim()
  };
  if (!payload.nama) { alert('Nama additional service wajib diisi.'); return; }
  if (isNaN(payload.harga) || payload.harga < 0) { alert('Harga tambahan harus berupa angka positif.'); return; }

  let res;
  if (id) {
    res = await DB.updateAdditionalService(id, payload);
  } else {
    res = await DB.addAdditionalService(payload);
  }
  
  if (!res || res.success === false) {
    alert('Gagal menyimpan additional service: ' + (res?.error || 'Terjadi kesalahan pada server.'));
    return;
  }
  
  document.getElementById('additionalModal').style.display = 'none';
  alert('Additional service berhasil disimpan!');
  await renderAdditionalTab();
};

window.hapusAdditional = async function(id) {
  if (!confirm('Hapus additional service ini?')) return;
  await DB.deleteAdditionalService(id);
  await renderAdditionalTab();
};

// =============================================
// INPUT PESANAN MANUAL & DISKON (KASIR ENGINE)
// =============================================
window._manCart = [];
window._manOngkir = 0;

async function initManualOrderForm() {
  const select = document.getElementById('manLayananSelect');
  if (!select) return;

  const layanan = await DB.getServices();
  select.innerHTML = '<option value="">-- Pilih Layanan --</option>' +
    layanan.map(l =>
      `<option value="${l.id}"
               data-nama="${l.name}"
               data-harga="${l.price}"
               data-est="${l.estimation}">
        ${l.name} — ${DB.formatCurrency(l.price)}
      </option>`
    ).join('');

  const today = new Date().toISOString().split('T')[0];
  const tglMasuk = document.getElementById('manTglMasuk');
  if (tglMasuk && !tglMasuk.value) tglMasuk.value = today;

  const kasirDefault = (await DB.getSystemConfig()).nama_kasir_default || '';
  const kasirEl = document.getElementById('manKasir');
  if (kasirEl && !kasirEl.value) kasirEl.value = kasirDefault;

  window._manCart = [];
  window._manOngkir = 0;
  window.manRenderCart();
}

window.manToggleDelivery = function() {
  const val = document.getElementById('manPengiriman')?.value;
  const fields = document.getElementById('manDeliveryFields');
  if (fields) fields.style.display = val === 'Ya' ? 'block' : 'none';
  window.manHitung();
};

window.manApplyBenefit = function() {
  const benefit = document.getElementById('manMemberBenefit')?.value;
  const birthdayInput = document.getElementById('manBirthdayInput');
  if (birthdayInput) birthdayInput.style.display = benefit === 'birthday' ? 'block' : 'none';
  window.manHitung();
};

window.manTambahLayanan = function() {
  const select = document.getElementById('manLayananSelect');
  const opt = select?.options[select.selectedIndex];
  if (!opt || !opt.value) return;

  const existing = window._manCart.find(x => x.id === opt.value);
  if (existing) { existing.qty++; }
  else {
    window._manCart.push({
      id: opt.value,
      nama: opt.dataset.nama,
      harga: parseFloat(opt.dataset.harga),
      estimasi: opt.dataset.est || '3 Hari',
      qty: 1
    });
  }
  window.manRenderCart();
  select.value = '';
};

window.manRenderCart = function() {
  const container = document.getElementById('manLayananList');
  if (!container) return;
  if (!window._manCart.length) {
    container.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;text-align:center;margin:auto;">Belum ada layanan dipilih</p>';
    window.manHitung();
    return;
  }
  container.innerHTML = window._manCart.map((item, idx) => `
    <div style="display:flex; justify-content:space-between; align-items:center;
                padding:8px 12px; background:white; border-radius:10px;
                border:1px solid rgba(0,0,0,0.07); gap:8px;">
      <div style="flex:1;">
        <div style="font-weight:600; font-size:0.9rem;">${item.nama}</div>
        <div style="font-size:0.8rem; color:var(--text-muted);">
          ${DB.formatCurrency(item.harga)} × ${item.qty}
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
        <button onclick="window.manKurangQty(${idx})" aria-label="Kurangi jumlah"
                style="width:26px;height:26px;border-radius:50%;border:1px solid #ddd;
                       background:white;cursor:pointer;font-size:1rem;">−</button>
        <span style="font-weight:700; min-width:16px; text-align:center;">${item.qty}</span>
        <button onclick="window.manTambahQty(${idx})" aria-label="Tambah jumlah"
                style="width:26px;height:26px;border-radius:50%;border:1px solid #ddd;
                       background:white;cursor:pointer;font-size:1rem;">+</button>
        <span style="font-weight:700; min-width:60px; text-align:right;">
          ${DB.formatCurrency(item.harga * item.qty)}
        </span>
        <button onclick="window.manHapusItem(${idx})" aria-label="Hapus layanan"
                style="background:#e74c3c;border:none;color:white;width:26px;
                       height:26px;border-radius:50%;cursor:pointer;">×</button>
      </div>
    </div>
  `).join('');
  window.manHitung();
};

window.manTambahQty = function(idx) {
  window._manCart[idx].qty++;
  window.manRenderCart();
};
window.manKurangQty = function(idx) {
  if (window._manCart[idx].qty > 1) window._manCart[idx].qty--;
  else window._manCart.splice(idx, 1);
  window.manRenderCart();
};
window.manHapusItem = function(idx) {
  window._manCart.splice(idx, 1);
  window.manRenderCart();
};

window.manHitungOngkir = function() {
  const jarak = parseFloat(document.getElementById('manJarak')?.value) || 0;
  const ongkir = jarak > 10 ? (jarak - 10) * 2000 : 0;
  window._manOngkir = ongkir;

  const alamat = document.getElementById('manAlamat')?.value.trim();
  const gmapsLink = document.getElementById('manGmapsLink');
  if (gmapsLink && alamat) {
    gmapsLink.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(alamat)}`;
    gmapsLink.style.display = 'block';
  }

  window.manHitung();
};

window.manGpsJarak = function() {
  const statusEl = document.getElementById('manGpsStatus');
  if (!navigator.geolocation) {
    if (statusEl) statusEl.innerText = 'GPS tidak didukung browser.';
    return;
  }
  if (statusEl) statusEl.innerText = 'Mengambil lokasi...';
  navigator.geolocation.getCurrentPosition(pos => {
    const shopLat = -8.0261, shopLon = 112.5855;
    const R = 6371;
    const dLat = (pos.coords.latitude - shopLat) * Math.PI / 180;
    const dLon = (pos.coords.longitude - shopLon) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 +
      Math.cos(shopLat*Math.PI/180) * Math.cos(pos.coords.latitude*Math.PI/180) *
      Math.sin(dLon/2)**2;
    const dist = Math.ceil(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 1.3);
    const jarakEl = document.getElementById('manJarak');
    if (jarakEl) jarakEl.value = dist;
    if (statusEl) statusEl.innerText = `Jarak perkiraan: ${dist} KM`;
    window.manHitungOngkir();
  }, () => {
    if (statusEl) statusEl.innerText = 'Gagal ambil lokasi GPS.';
  }, { enableHighAccuracy: true, timeout: 10000 });
};

window.manHitung = function() {
  const subtotal = window._manCart.reduce((s, x) => s + x.harga * x.qty, 0);
  const ongkir = window._manOngkir;
  const benefit = document.getElementById('manMemberBenefit')?.value || 'none';

  let diskon = 0;
  if (benefit === 'diskon15') {
    // Diskon 15% khusus 4 item sepatu regular medium
    diskon = Math.round(subtotal * 0.15);
  } else if (benefit === 'birthday') {
    const persen = parseFloat(document.getElementById('manBirthdayPersen')?.value) || 0;
    diskon = Math.round(subtotal * persen / 100);
  }

  const total = Math.max(0, subtotal + ongkir - diskon);

  // Estimasi terlama
  let maxHari = 0;
  let maxEst = '3 Hari';
  window._manCart.forEach(item => {
    const m = (item.estimasi || '').match(/(\d+)/);
    const h = m ? parseInt(m[1]) : 3;
    if (h > maxHari) { maxHari = h; maxEst = item.estimasi; }
  });

  const elSub = document.getElementById('manSubtotal');
  const elOng = document.getElementById('manOngkirDisplay');
  const elEst = document.getElementById('manEstimasiDisplay');
  const elDis = document.getElementById('manDiskonDisplay');
  const elTot = document.getElementById('manTotal');
  if (elSub) elSub.innerText = DB.formatCurrency(subtotal);
  if (elOng) elOng.innerText = DB.formatCurrency(ongkir);
  if (elEst) elEst.innerText = maxEst || '—';
  if (elDis) elDis.innerText = `- ${DB.formatCurrency(diskon)}`;
  if (elTot) elTot.innerText = DB.formatCurrency(total);

  // Auto-set tanggal selesai
  if (maxHari > 0) {
    const tglMasuk = document.getElementById('manTglMasuk')?.value;
    if (tglMasuk) {
      const selesai = new Date(tglMasuk);
      selesai.setDate(selesai.getDate() + maxHari);
      const tglSelesaiEl = document.getElementById('manTglSelesai');
      if (tglSelesaiEl && !tglSelesaiEl._manualOverride) {
        tglSelesaiEl.value = selesai.toISOString().split('T')[0];
      }
    }
  }
};

window.simpanPesananManual = async function() {
  const nama = document.getElementById('manNama')?.value.trim();
  const phone = document.getElementById('manPhone')?.value.trim();
  const kasir = document.getElementById('manKasir')?.value.trim() || 'Kasir';
  const catatan = document.getElementById('manCatatan')?.value.trim() || '';
  const pengiriman = document.getElementById('manPengiriman')?.value || 'Ya';
  const alamat = document.getElementById('manAlamat')?.value.trim() || '';
  const jadwal = document.getElementById('manJadwal')?.value || '';
  const tglMasuk = document.getElementById('manTglMasuk')?.value || new Date().toISOString().split('T')[0];
  const tglSelesai = document.getElementById('manTglSelesai')?.value || '';
  const benefit = document.getElementById('manMemberBenefit')?.value || 'none';
  const jarak = parseFloat(document.getElementById('manJarak')?.value) || 0;

  if (!nama || !phone) { alert('Nama dan No. WhatsApp wajib diisi!'); return; }
  if (!window._manCart.length) { alert('Pilih minimal 1 layanan!'); return; }

  const subtotal = window._manCart.reduce((s, x) => s + x.harga * x.qty, 0);
  const ongkir = window._manOngkir;
  let diskon = 0;
  if (benefit === 'diskon15') diskon = Math.round(subtotal * 0.15);
  else if (benefit === 'birthday') {
    const p = parseFloat(document.getElementById('manBirthdayPersen')?.value) || 0;
    diskon = Math.round(subtotal * p / 100);
  }
  const total = Math.max(0, subtotal + ongkir - diskon);

  let maxHari = 0;
  let maxEst = '3 Hari';
  window._manCart.forEach(item => {
    const m = (item.estimasi || '').match(/(\d+)/);
    const h = m ? parseInt(m[1]) : 3;
    if (h > maxHari) { maxHari = h; maxEst = item.estimasi; }
  });

  const orderId = DB.generateOrderCode();
  const serviceDesc = window._manCart.map(x => `${x.nama} (${x.qty}x)`).join(', ');
  const totalQty = window._manCart.reduce((s, x) => s + x.qty, 0);
  const benefitNote = benefit === 'none' ? '' :
    benefit === 'diskon15' ? '[Benefit: Diskon 15% Member]' : `[Benefit: Birthday Treat - Diskon ${document.getElementById('manBirthdayPersen')?.value || 0}%]`;

  const payload = {
    id: orderId,
    name: nama,
    phone: phone,
    item_type: 'Manual-Admin',
    qty: totalQty,
    treatment: 'Manual',
    service: serviceDesc,
    express: 'none',
    delivery: pengiriman,
    address: alamat,
    distance: jarak,
    schedule: jadwal,
    notes: `[Kasir: ${kasir}] [Diskon: ${DB.formatCurrency(diskon)}] ${benefitNote} ${catatan}`.trim(),
    price: subtotal,
    express_price: 0,
    ongkir: ongkir,
    total: total,
    status: 2,
    lunas: 0,
    items: JSON.stringify(window._manCart),
    estimasi_selesai: tglSelesai || maxEst
  };

  const res = await DB.addOrder(payload);
  if (!res || res.error) { alert('Gagal menyimpan pesanan! Cek koneksi server.'); return; }

  window.cetakNotaManual({
    ...payload,
    kasir,
    tglMasuk,
    tglSelesai,
    diskon,
    cart: window._manCart
  });

  alert(`✅ Pesanan berhasil disimpan!\nKode Order: ${orderId}`);

  // Reset form
  window._manCart = [];
  window._manOngkir = 0;
  window.manRenderCart();
  ['manNama','manPhone','manCatatan','manAlamat'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('manJarak').value = 0;
  document.getElementById('manMemberBenefit').value = 'none';
  document.getElementById('manBirthdayInput').style.display = 'none';

  await renderDaftarPesanan();
};

// =============================================
// RIWAYAT TRANSAKSI CUSTOMER & GIVEAWAY COUNTER
// =============================================
window.cariRiwayat = async function() {
  const q = document.getElementById('memberCariInput')?.value.trim();
  const container = document.getElementById('memberResult');
  if (!q || !container) return;

  container.innerHTML = '<p style="color:var(--text-muted);">Mencari...</p>';

  const data = await DB.getRiwayatCustomer(q);

  if (!data.customer && data.total_transaksi === 0) {
    container.innerHTML = `
      <div class="glass-card" style="padding:1.5rem; text-align:center;">
        <i class="fa-solid fa-user-slash" style="font-size:2rem; color:var(--text-muted);"></i>
        <p style="margin-top:1rem; color:var(--text-muted);">
          Tidak ada transaksi ditemukan untuk "<strong>${q}</strong>" dalam 1 tahun terakhir.
        </p>
      </div>`;
    return;
  }

  // Hitung milestone giveaway (tiap 5 transaksi = reward)
  const total = data.total_transaksi;
  const milestone = 5; // setiap 5 transaksi
  const sudahMilestone = Math.floor(total / milestone);
  const sisaKeMilestone = milestone - (total % milestone);
  const progressPersen = Math.round((total % milestone) / milestone * 100);

  container.innerHTML = `
    <!-- Info customer -->
    <div class="glass-card" style="padding:1.5rem; margin-bottom:1rem;">
      <div style="display:flex; align-items:center; gap:1rem; flex-wrap:wrap;">
        <div style="width:56px; height:56px; border-radius:50%; background:rgba(52,152,219,0.15);
                    display:flex; align-items:center; justify-content:center; color:var(--primary-sky);
                    font-size:1.4rem; flex-shrink:0;">
          <i class="fa-solid fa-user"></i>
        </div>
        <div style="flex:1;">
          <h3 style="margin:0; color:var(--primary-navy);">${data.customer?.name || q}</h3>
          <p style="margin:0; color:var(--text-muted); font-size:0.88rem;">
            ${data.customer?.phone || '–'}
          </p>
        </div>
        <div style="text-align:right;">
          <div style="font-size:0.82rem; color:var(--text-muted);">Periode</div>
          <div style="font-size:0.85rem; font-weight:600;">${data.periode || '–'}</div>
        </div>
      </div>
    </div>

    <!-- Statistik -->
    <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:1rem; margin-bottom:1rem;">
      <div class="glass-card" style="padding:1.25rem; text-align:center;">
        <div style="font-size:2rem; font-weight:800; color:var(--primary-sky);">${total}</div>
        <div style="font-size:0.85rem; color:var(--text-muted);">Total Transaksi</div>
      </div>
      <div class="glass-card" style="padding:1.25rem; text-align:center;">
        <div style="font-size:1.4rem; font-weight:800; color:var(--primary-navy);">
          ${DB.formatCurrency(data.total_omset)}
        </div>
        <div style="font-size:0.85rem; color:var(--text-muted);">Total Nilai</div>
      </div>
      <div class="glass-card" style="padding:1.25rem; text-align:center;">
        <div style="font-size:2rem; font-weight:800; color:var(--accent-yellow);">
          🎁 ${sudahMilestone}×
        </div>
        <div style="font-size:0.85rem; color:var(--text-muted);">Giveaway Diperoleh</div>
      </div>
    </div>

    <!-- Progress ke milestone berikutnya -->
    <div class="glass-card" style="padding:1.25rem; margin-bottom:1rem;">
      <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
        <span style="font-weight:700; color:var(--primary-navy);">
          Progress ke Giveaway Berikutnya
        </span>
        <span style="font-size:0.88rem; color:var(--text-muted);">
          ${total % milestone}/${milestone} transaksi
        </span>
      </div>
      <div style="background:rgba(0,0,0,0.08); border-radius:20px; overflow:hidden; height:14px;">
        <div style="width:${progressPersen}%; height:100%; border-radius:20px;
                    background:linear-gradient(90deg, var(--primary-sky), var(--accent-yellow));
                    transition:width 0.5s ease;"></div>
      </div>
      <p style="margin-top:8px; font-size:0.85rem; color:var(--text-muted);">
        ${total % milestone === 0 && total > 0
          ? '🎉 Customer ini berhak mendapat Giveaway sekarang!'
          : `Butuh ${sisaKeMilestone} transaksi lagi untuk giveaway berikutnya.`
        }
      </p>
    </div>

    <!-- Tabel riwayat -->
    <div class="glass-card" style="padding:1.25rem;">
      <h4 style="margin-bottom:1rem; color:var(--primary-navy);">Riwayat Pesanan</h4>
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>NO. ORDER</th>
              <th>TANGGAL</th>
              <th>LAYANAN</th>
              <th>TOTAL</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            ${data.pesanan.map(p => {
              const statusMap = [
                '',
                'Penjemputan',
                'Antrian',
                'Proses',
                'Pengeringan',
                'Detailing',
                'Packaging',
                'Menunggu Bayar',
                'Pengantaran',
                'Selesai'
              ];
              return `<tr>
                <td><strong>${p.id}</strong></td>
                <td>${DB.formatDate(p.date)}</td>
                <td style="max-width:200px; overflow:hidden; text-overflow:ellipsis;
                           white-space:nowrap;">${p.service || '–'}</td>
                <td>${DB.formatCurrency(p.total)}</td>
                <td>
                  <span class="status-badge"
                        style="background:rgba(6,182,212,0.1); color:var(--primary-sky);">
                    ${statusMap[parseInt(p.status)] || 'Unknown'}
                  </span>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
};