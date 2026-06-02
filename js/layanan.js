// layanan.js - Sparkling Cleaners Transactional Commerce Hub
// Cart, Checkout, Tracking, Catalog Grid, Lightbox, GPS

let lightboxSlides = [];
let currentLightboxIndex = 0;

document.addEventListener('DOMContentLoaded', async () => {
    window.PRICING = await DB.getPricing();
    window.WA_NUMBER = await DB.getWhatsAppNumber();

    await initFulfillmentToggle();
    await renderKategoriGrid();
    window.updateCartUI();
    await renderColors();
    await renderFooterMeta();
});

// =============================================
// 1. FULFILLMENT MODE TOGGLE
// =============================================
async function initFulfillmentToggle() {
    const deliverySelect = document.getElementById('orderDelivery');
    const details = document.getElementById('deliveryDetails');
    const addr = document.getElementById('orderAddress');

    if (deliverySelect) {
        deliverySelect.innerHTML = `<option value="Ya" selected>Jemput / Antar ke Alamat (Antar-Jemput)</option>`;
        deliverySelect.value = 'Ya';
        deliverySelect.disabled = true;
        if (details) { details.style.display = 'block'; }
        if (addr) addr.required = true;
    }
}

// =============================================
// 2. DYNAMIC CATALOG GRID & GROUPING
// =============================================
// =============================================
// LEVEL 1: RENDER GRID KATEGORI
// =============================================
async function renderKategoriGrid() {
  const grid = document.getElementById('kategori-grid');
  if (!grid) return;

  const categories = await DB.getKategoriLayanan();

  if (!categories || categories.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1; text-align:center; padding:3rem; color:var(--text-muted);">
        <i class="fa-solid fa-box-open" style="font-size:3rem; margin-bottom:1rem; display:block;"></i>
        <p>Kategori layanan belum tersedia.</p>
      </div>`;
    return;
  }

  grid.innerHTML = categories.map(cat => `
    <div class="kategori-card glass-card"
         onclick="window.openKategori(${cat.id}, '${cat.nama_kategori.replace(/'/g, "\\'")}')"
         role="button"
         tabindex="0"
         aria-label="Lihat layanan kategori ${cat.nama_kategori}"
         onkeydown="if(event.key==='Enter'||event.key===' ')window.openKategori(${cat.id},'${cat.nama_kategori.replace(/'/g, "\\'")}')">
      <div style="overflow:hidden;">
        <img src="${cat.foto_kategori || 'https://images.unsplash.com/photo-1595950653106-6c9ebd614c3a?w=600'}"
             alt="Kategori layanan ${cat.nama_kategori} - Sparkling Cleaners"
             loading="lazy">
      </div>
      <div class="kategori-card-label">
        <span>${cat.nama_kategori}</span>
        <i class="fa-solid fa-arrow-right"></i>
      </div>
    </div>
  `).join('');
}

// =============================================
// LEVEL 2: BUKA KATEGORI → TAMPILKAN LAYANAN
// =============================================
window.openKategori = async function(idKategori, namaKategori) {
  // Sembunyikan level 1, tampilkan level 2
  document.getElementById('section-kategori').style.display = 'none';
  document.getElementById('section-layanan-detail').style.display = 'block';
  document.getElementById('detail-kategori-nama').innerText = namaKategori;

  // Scroll ke atas
  window.scrollTo({ top: 0, behavior: 'smooth' });

  const container = document.getElementById('layanan-in-kategori-grid');
  container.innerHTML = `
    <div style="text-align:center; padding:3rem; color:var(--text-muted);">
      <i class="fa-solid fa-spinner fa-spin" style="font-size:2rem;"></i>
      <p style="margin-top:1rem;">Memuat layanan...</p>
    </div>`;

  const layananList = await DB.getLayananByKategori(idKategori);

  if (!layananList || layananList.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:3rem; color:var(--text-muted);">
        <p>Belum ada layanan dalam kategori ini.</p>
      </div>`;
    return;
  }

  // Render tiap layanan sebagai card detail
  const renderedCards = await Promise.all(layananList.map(s => renderLayananDetailCard(s)));
  container.innerHTML = renderedCards.join('');
};

window.backToKategori = function() {
  document.getElementById('section-layanan-detail').style.display = 'none';
  document.getElementById('section-kategori').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// =============================================
// RENDER CARD LAYANAN DETAIL (Level 2)
// =============================================
async function renderLayananDetailCard(s) {
  const additionals = await DB.getAdditionalByLayanan(s.id);

  const photos = [
    s.image,
    ...(s.additional_images || '').split(',').map(u => u.trim()).filter(Boolean)
  ].filter(Boolean);
  if (photos.length === 0) {
    photos.push('https://images.unsplash.com/photo-1595950653106-6c9ebd614c3a?w=600');
  }

  const sliderId = `slider_${s.id.replace(/[^a-zA-Z0-9]/g, '_')}`;

  // Foto slideshow HTML
  const fotoHtml = `
    <div class="foto-area">
      <div id="${sliderId}_wrapper" style="position:relative; overflow:hidden; width:100%;">
        <div id="${sliderId}" style="display:flex; width:${photos.length * 100}%; transition:transform 0.35s ease;">
          ${photos.map(url => `
            <div style="width:${100 / photos.length}%; flex-shrink:0;">
              <img src="${url}"
                   alt="Foto layanan ${s.name} - Sparkling Cleaners"
                   loading="lazy"
                   style="width:100%; height:auto; max-height:420px;
                          object-fit:contain; background:#f8fafc; display:block;">
            </div>
          `).join('')}
        </div>
        ${photos.length > 1 ? `
          <button onclick="window.slideLayanan('${sliderId}', ${photos.length}, -1)"
                  aria-label="Foto sebelumnya"
                  style="position:absolute; left:10px; top:50%; transform:translateY(-50%);
                         background:rgba(0,0,0,0.45); border:none; color:white;
                         width:36px; height:36px; border-radius:50%; cursor:pointer;
                         font-size:1rem; display:flex; align-items:center; justify-content:center;
                         z-index:2;">&#8249;</button>
          <button onclick="window.slideLayanan('${sliderId}', ${photos.length}, 1)"
                  aria-label="Foto berikutnya"
                  style="position:absolute; right:10px; top:50%; transform:translateY(-50%);
                         background:rgba(0,0,0,0.45); border:none; color:white;
                         width:36px; height:36px; border-radius:50%; cursor:pointer;
                         font-size:1rem; display:flex; align-items:center; justify-content:center;
                         z-index:2;">&#8250;</button>
          <div style="position:absolute; bottom:10px; left:50%; transform:translateX(-50%);
                      display:flex; gap:5px; z-index:2;">
            ${photos.map((_, i) => `
              <div id="dot_${sliderId}_${i}"
                   style="width:${i===0?'18px':'7px'}; height:7px; border-radius:4px;
                          background:${i===0?'var(--primary-sky)':'rgba(255,255,255,0.7)'};
                          transition:all 0.25s;"></div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    </div>
  `;

  // Additional service pills HTML
  const additionalHtml = additionals.length > 0 ? `
    <div style="border-top:1px solid rgba(0,0,0,0.06); padding-top:1rem;">
      <p style="font-size:0.85rem; font-weight:700; color:var(--primary-navy);
                margin-bottom:0.75rem; display:flex; align-items:center; gap:6px;">
        <i class="fa-solid fa-plus-circle" style="color:var(--primary-sky);"></i>
        Layanan Tambahan (Opsional):
      </p>
      <div style="display:flex; flex-wrap:wrap; gap:8px;" id="add_pills_${s.id}">
        ${additionals.map(a => `
          <button class="additional-pill"
                  data-id="${a.id}"
                  data-harga="${a.harga}"
                  data-nama="${a.nama}"
                  onclick="window.toggleAdditional(this, '${s.id}')"
                  aria-label="Tambahkan ${a.nama} seharga ${DB.formatCurrency(a.harga)}">
            <span>${a.nama}</span>
            <span style="font-size:0.78rem; opacity:0.75;">+${DB.formatCurrency(a.harga)}</span>
          </button>
        `).join('')}
      </div>
    </div>
  ` : '';

  return `
    <div class="layanan-detail-card glass-card"
         id="card_${s.id}"
         data-base-price="${parseFloat(s.price)}">
      ${fotoHtml}
      <div class="info-area">
        <div>
          <span style="font-size:0.75rem; font-weight:700; color:var(--primary-sky);
                       text-transform:uppercase; letter-spacing:1px;">
            ${s.category || ''}
          </span>
          <h3 style="margin:0.4rem 0 0.5rem; font-size:1.3rem; color:var(--primary-navy);">
            ${s.name}
          </h3>
          <p style="color:var(--text-muted); line-height:1.65; font-size:0.92rem; margin:0;">
            ${s.description || ''}
          </p>
        </div>

        <!-- Harga & Estimasi -->
        <div style="display:flex; align-items:center; gap:2rem; flex-wrap:wrap;
                    background:rgba(52,152,219,0.07); padding:1rem 1.25rem;
                    border-radius:14px;">
          <div>
            <div style="font-size:0.78rem; color:var(--text-muted); margin-bottom:2px;">Harga</div>
            <div id="harga_display_${s.id}"
                 style="font-size:1.5rem; font-weight:800; color:var(--primary-navy);">
              ${DB.formatCurrency(parseFloat(s.price))}
            </div>
          </div>
          <div>
            <div style="font-size:0.78rem; color:var(--text-muted); margin-bottom:2px;">Estimasi</div>
            <div style="font-weight:700; color:var(--primary-sky); font-size:1.05rem;">
              ${s.estimation}
            </div>
          </div>
        </div>

        ${additionalHtml}

        <!-- Tombol Tambah Keranjang -->
        <button onclick="window.addLayananToCart('${s.id}')"
                class="btn btn-primary"
                style="padding:1rem; font-size:1rem; width:100%; margin-top:0.25rem;"
                aria-label="Tambahkan ${s.name} ke keranjang">
          Tambah ke Keranjang
          <i class="fa-solid fa-cart-plus" style="margin-left:8px;"></i>
        </button>
      </div>
    </div>
  `;
}

// =============================================
// SLIDER FOTO (LAYANAN DETAIL CARD)
// =============================================
window._sliderIndex = {};
window.slideLayanan = function(sliderId, total, direction) {
  if (!window._sliderIndex[sliderId]) window._sliderIndex[sliderId] = 0;
  window._sliderIndex[sliderId] = (window._sliderIndex[sliderId] + direction + total) % total;
  const el = document.getElementById(sliderId);
  if (el) el.style.transform = `translateX(-${(window._sliderIndex[sliderId] * 100) / total}%)`;
  // Update dots
  for (let i = 0; i < total; i++) {
    const dot = document.getElementById(`dot_${sliderId}_${i}`);
    if (dot) {
      dot.style.width = i === window._sliderIndex[sliderId] ? '18px' : '7px';
      dot.style.background = i === window._sliderIndex[sliderId]
        ? 'var(--primary-sky)' : 'rgba(255,255,255,0.7)';
    }
  }
};

// =============================================
// ADDITIONAL SERVICE TOGGLE
// =============================================
window.toggleAdditional = function(btn, serviceId) {
  btn.classList.toggle('selected');
  updateLayananTotalDisplay(serviceId);
};

function updateLayananTotalDisplay(serviceId) {
  const card = document.getElementById(`card_${serviceId}`);
  if (!card) return;
  const pills = card.querySelectorAll('.additional-pill.selected');
  const additionalTotal = Array.from(pills).reduce((sum, p) => sum + parseFloat(p.dataset.harga || 0), 0);

  // Ambil harga base dari dataset card (simpan saat render)
  const basePrice = parseFloat(card.dataset.basePrice || 0);
  const total = basePrice + additionalTotal;
  const displayEl = document.getElementById(`harga_display_${serviceId}`);
  if (displayEl) {
    displayEl.innerText = DB.formatCurrency(total);
    displayEl.style.color = additionalTotal > 0 ? 'var(--primary-sky)' : 'var(--primary-navy)';
  }
}

// =============================================
// TAMBAH KE KERANJANG DARI DETAIL LAYANAN
// =============================================
function hitungEstimasiTerlama(cart) {
    let maxHari = 0;
    let maxEst = '3 Hari';
    cart.forEach(item => {
        const m = (item.estimation || '').match(/(\d+)/);
        const h = m ? parseInt(m[1]) : 3;
        if (h > maxHari) { maxHari = h; maxEst = item.estimation; }
    });
    return maxEst;
}

window.addLayananToCart = async function(serviceId) {
  const services = await DB.getServices();
  const s = services.find(x => x.id === serviceId);
  if (!s) return;

  const card = document.getElementById(`card_${serviceId}`);
  const selectedAdditionals = card
    ? Array.from(card.querySelectorAll('.additional-pill.selected')).map(p => ({
        id: p.dataset.id,
        nama: p.dataset.nama,
        harga: parseFloat(p.dataset.harga)
      }))
    : [];

  const additionalTotal = selectedAdditionals.reduce((sum, a) => sum + a.harga, 0);
  const totalPrice = parseFloat(s.price) + additionalTotal;

  const cartItemName = selectedAdditionals.length > 0
    ? `${s.name} + ${selectedAdditionals.map(a => a.nama).join(', ')}`
    : s.name;

  const additionalKey = selectedAdditionals.map(a => a.id).sort().join('_');
  const cartItemId = additionalKey ? `${serviceId}-${additionalKey}` : serviceId;

  const existing = window.cart.find(item => item.id === cartItemId);

  if (existing) {
    existing.qty++;
  } else {
    window.cart.push({
      id: cartItemId,
      serviceId: serviceId,
      name: cartItemName,
      price: totalPrice,
      qty: 1,
      image: s.image || '',
      additional_images: s.additional_images || '',
      additionals: selectedAdditionals,
      estimation: s.estimation || '3 Hari'
    });
  }

  window.saveCart();
  window.updateCartUI();
  window.toggleCartDrawer(true);

  // Visual feedback
  const btn = card?.querySelector('button[onclick*="addLayananToCart"]');
  if (btn) {
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Ditambahkan!';
    btn.style.background = '#2ecc71';
    setTimeout(() => {
      btn.innerHTML = orig;
      btn.style.background = '';
    }, 1500);
  }
};

// =============================================
// 3. SHOPPING CART ENGINE
// =============================================
window.cart = JSON.parse(localStorage.getItem('cart')) || [];

window.addToCart = async function(serviceId) {
    const services = await DB.getServices();
    const service = services.find(s => s.id === serviceId);
    if (!service) return;

    const existing = window.cart.find(item => item.id === serviceId);
    if (existing) {
        existing.qty += 1;
    } else {
        window.cart.push({
            id: service.id,
            name: service.name,
            price: service.price,
            qty: 1,
            image: service.image || 'https://images.unsplash.com/photo-1595950653106-6c9ebd614c3a?w=500',
            additional_images: service.additional_images || '',
            estimation: service.estimation || '3 Hari'
        });
    }

    window.saveCart();
    window.updateCartUI();
    window.toggleCartDrawer(true);
};

window.updateCartQty = function(serviceId, delta) {
    const existing = window.cart.find(item => item.id === serviceId);
    if (!existing) return;
    existing.qty += delta;
    if (existing.qty <= 0) {
        window.cart = window.cart.filter(item => item.id !== serviceId);
    }
    window.saveCart();
    window.updateCartUI();
};

window.saveCart = function() {
    localStorage.setItem('cart', JSON.stringify(window.cart));
};

window.toggleCartDrawer = function(open) {
    const drawer = document.getElementById('cartDrawer');
    if (open) { drawer.classList.add('open'); } else { drawer.classList.remove('open'); }
};

window.updateCartUI = function() {
    const badge = document.getElementById('floatingCartBadge');
    const floatBtn = document.getElementById('floatingCartBtn');
    const totalQty = window.cart.reduce((sum, item) => sum + item.qty, 0);
    const subtotal = window.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    if (totalQty > 0) {
        if (badge) badge.innerText = totalQty;
        if (floatBtn) floatBtn.style.display = 'flex';
    } else {
        if (floatBtn) floatBtn.style.display = 'none';
        window.toggleCartDrawer(false);
    }

    const drawerList = document.getElementById('cartDrawerList');
    if (drawerList) {
        if (window.cart.length === 0) {
            drawerList.innerHTML = '<p style="color:var(--text-muted); font-size:0.9rem; text-align:center; margin-top:2rem;">Keranjang belanja kosong.</p>';
        } else {
            drawerList.innerHTML = window.cart.map(item => `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                    <div class="cart-item-details">
                        <div class="cart-item-title">${item.name}</div>
                        <div class="cart-item-price">${DB.formatCurrency(item.price)}</div>
                    </div>
                    <div class="cart-item-actions">
                        <button type="button" class="qty-btn" onclick="window.updateCartQty('${item.id}', -1)">&minus;</button>
                        <span class="cart-item-qty">${item.qty}</span>
                        <button type="button" class="qty-btn" onclick="window.updateCartQty('${item.id}', 1)">&plus;</button>
                    </div>
                </div>
            `).join('');
        }
    }

    const drawerSubtotal = document.getElementById('cartDrawerSubtotal');
    if (drawerSubtotal) drawerSubtotal.innerText = DB.formatCurrency(subtotal);

    const checkoutList = document.getElementById('checkoutCartList');
    if (checkoutList) {
        if (window.cart.length === 0) {
            checkoutList.innerHTML = '<p style="color:var(--text-muted); font-size:0.9rem; text-align:center; margin:0;">Keranjang kosong. Pilih layanan di atas.</p>';
        } else {
            checkoutList.innerHTML = window.cart.map(item => `
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(0,0,0,0.05); padding-bottom:8px; margin-bottom:8px;">
                    <div style="text-align:left;">
                        <div style="font-weight:600; font-size:0.95rem; color:var(--primary-navy);">${item.name}</div>
                        <div style="font-size:0.8rem; color:var(--text-muted);">${item.qty} x ${DB.formatCurrency(item.price)}</div>
                    </div>
                    <div style="font-weight:700; color:var(--primary-sky); font-size:0.95rem;">${DB.formatCurrency(item.price * item.qty)}</div>
                </div>
            `).join('');
        }
    }

    // renderServicesGrid(); // Removed in V3 Category Restructure
    window.calculateTotal();
};

// =============================================
// 4. DELIVERY OPTIONS
// =============================================
window.toggleDeliveryOptions = function(val) {
    const details = document.getElementById('deliveryDetails');
    const addr = document.getElementById('orderAddress');
    if (val === 'Ya') {
        if (details) details.style.display = 'block';
        if (addr) addr.required = true;
    } else {
        if (details) details.style.display = 'none';
        if (addr) { addr.required = false; addr.value = ''; }
        const dist = document.getElementById('orderDistance');
        if (dist) dist.value = 0;
    }
    window.calculateTotal();
};

window.previewPhoto = function(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('photoPreview');
            if (preview) { preview.src = e.target.result; preview.style.display = 'block'; }
        };
        reader.readAsDataURL(input.files[0]);
    }
};

// =============================================
// 5. TOTAL CALCULATION
// =============================================
window.calculateTotal = function() {
    const totalQty = window.cart.reduce((sum, item) => sum + item.qty, 0);
    const subtotal = window.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    const expressVal = 'none';
    const delivery = document.getElementById('orderDelivery')?.value || 'Ya';
    const distance = parseFloat(document.getElementById('orderDistance')?.value) || 0;

    let expressCost = 0;

    let ongkir = 0;
    if (delivery === 'Ya' && distance > 10) {
        ongkir = (distance - 10) * 2000;
    }

    const sumExpress = 0;
    const total = subtotal + sumExpress + ongkir;

    const el = (id) => document.getElementById(id);
    if (el('sumService')) el('sumService').innerText = DB.formatCurrency(subtotal);
    if (el('sumOngkir')) el('sumOngkir').innerText = delivery === 'Ya' ? (ongkir === 0 ? 'Rp 0 (Gratis)' : DB.formatCurrency(ongkir)) : 'Rp 0';
    if (el('sumTotal')) el('sumTotal').innerText = DB.formatCurrency(total);

    let est = hitungEstimasiTerlama(window.cart);
    if (expressVal !== 'none') est = expressVal;
    if (el('sumEst')) el('sumEst').innerText = est;
};

// =============================================
// 6. ORDER SUBMISSION
// =============================================
window.processOrder = async function(event) {
    event.preventDefault();

    if (window.cart.length === 0) {
        alert("Keranjang Anda kosong! Silakan pilih layanan terlebih dahulu.");
        return;
    }

    const termsChecked = document.getElementById('orderTerms')?.checked;
    if (!termsChecked) {
        alert("Anda harus menyetujui syarat & ketentuan sebelum mengirim pesanan.");
        return;
    }

    const name = document.getElementById('orderName').value;
    const phone = document.getElementById('orderPhone').value;
    const expressVal = 'none';
    const delivery = document.getElementById('orderDelivery').value;
    const address = document.getElementById('orderAddress').value;
    const distance = document.getElementById('orderDistance').value;
    const schedule = document.getElementById('orderSchedule')?.value || '';
    const notes = document.getElementById('orderNotes').value;
    const photoInput = document.getElementById('orderPhoto');

    const totalQty = window.cart.reduce((sum, item) => sum + item.qty, 0);
    const subtotal = window.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    let expressPrice = 0;
    let ongkir = (delivery === 'Ya' && distance > 10) ? (distance - 10) * 2000 : 0;
    const total = subtotal + (expressPrice * totalQty) + ongkir;

    let est = hitungEstimasiTerlama(window.cart);
    if (expressVal !== 'none') est = expressVal;

    const orderId = DB.generateOrderCode();

    let photoUrl = null;
    if (photoInput && photoInput.files && photoInput.files[0]) {
        const formData = new FormData();
        formData.append('image', photoInput.files[0]);
        try {
            const uploadResp = await fetch('/api/upload', { method: 'POST', body: formData });
            const uploadResult = await uploadResp.json();
            if (uploadResult.success) { photoUrl = uploadResult.urls[0]; }
        } catch (uploadErr) { console.error('Failed to upload condition photo:', uploadErr); }
    }

    const orderData = {
        id: orderId, name, phone,
        item_type: 'Multi-Item', qty: totalQty, treatment: 'Multi-Item',
        service: window.cart.map(i => `${i.name} (${i.qty}x)`).join(', '),
        express: expressVal, delivery, address, distance, schedule, notes,
        price: subtotal, express_price: expressPrice * totalQty, ongkir, total,
        status: 1, items: JSON.stringify(window.cart), photo: photoUrl,
        estimasi_selesai: est,
        maps_link: window._gmapsLinkCustomer || null
    };

    const res = await DB.addOrder(orderData);
    if (!res || res.error) {
        alert('Gagal mengirim pesanan. Silakan coba lagi.');
        return;
    }

    // Build WhatsApp message — emoji minimal, hanya yang universal-safe
    const shopPhone = window.WA_NUMBER || "6285965957290";
    let msg = `Halo kak, saya mau pesan layanan cuci di *Sparkling Cleaners*%0A%0A`;
    msg += `*Detail Pesanan:*%0A`;
    msg += `- No. Order : *${orderId}*%0A`;
    msg += `- Nama     : ${name}%0A`;
    msg += `- WhatsApp : ${phone}%0A%0A`;
    msg += `*Layanan yang Dipilih:*%0A`;
    window.cart.forEach(item => {
        msg += `- ${item.name} (${item.qty}x) - ${DB.formatCurrency(item.price * item.qty)}%0A`;
    });
    msg += `%0A- Express       : ${expressVal !== 'none' ? expressVal : 'Normal'}%0A`;
    msg += `- Est. Selesai   : *${est}*%0A`;
    msg += `- Catatan        : ${notes || '-'}%0A%0A`;

    if (delivery === 'Ya') {
        msg += `*Pengiriman:*%0A`;
        msg += `- Jadwal Pickup : ${schedule}%0A`;
        msg += `- Alamat        : ${address}%0A`;
        if (window._gmapsLinkCustomer) {
            msg += `- Link Maps     : ${window._gmapsLinkCustomer}%0A`;
        }
        msg += `%0A`;
    }

    msg += `*Estimasi Biaya:*%0A`;
    msg += `- Subtotal : ${DB.formatCurrency(subtotal)}%0A`;
    if (expressPrice > 0) msg += `- Express  : ${DB.formatCurrency(expressPrice * totalQty)}%0A`;
    if (delivery === 'Ya') msg += `- Ongkir   : ${ongkir === 0 ? 'Gratis' : DB.formatCurrency(ongkir)}%0A`;
    msg += `- *Total   : ${DB.formatCurrency(total)}*%0A%0A`;
    msg += `Mohon segera dikonfirmasi ya kak, terima kasih!`;

    const waURL = `https://wa.me/${shopPhone}?text=${msg}`;

    alert(`Pesanan berhasil dibuat!\nKode Order: ${orderData.id}\nAnda akan diarahkan ke WhatsApp.`);

    window.cart = [];
    window.saveCart();
    window.updateCartUI();
    document.getElementById('orderForm').reset();
    const preview = document.getElementById('photoPreview');
    if (preview) { preview.src = ''; preview.style.display = 'none'; }
    window.closeCheckout();

    window.location.href = waURL;
};

// =============================================
// 7. REVEAL CHECKOUT & FOOTER SYNC
// =============================================
window.revealCheckout = function() {
    const bookingSec = document.getElementById('booking');
    if (bookingSec) {
        bookingSec.classList.add('modal-active');
        document.body.style.overflow = 'hidden';
        window.calculateTotal();
    }
};

window.closeCheckout = function() {
    const bookingSec = document.getElementById('booking');
    if (bookingSec) {
        bookingSec.classList.remove('modal-active');
        document.body.style.overflow = '';
    }
};

async function renderFooterMeta() {
    const sysCfg = await DB.getSystemConfig();
    if (!sysCfg) return;

    // WA Link
    const waNum = sysCfg.whatsapp_admin_number;
    const waLink = document.getElementById('footerWaLink');
    if (waLink && waNum) {
        waLink.href = `https://wa.me/${waNum}`;
    }

    // Instagram Link & Text
    const igUrl = sysCfg.instagram_url;
    const igLink = document.getElementById('footerIgLink');
    if (igLink && igUrl) {
        igLink.href = igUrl;
        let igUser = "@sparklingcleaners_mlg";
        try {
            const parts = igUrl.replace(/\/$/, "").split("/");
            if(parts.length > 0) igUser = "@" + parts[parts.length - 1];
        } catch(e){}
        igLink.innerHTML = `<i class="fa-brands fa-instagram" style="margin-right:6px;"></i> ${igUser}`;
        
        // Recreate QR code dynamically based on Instagram URL
        const qrContainer = document.getElementById('ig-qr-code');
        if (qrContainer && typeof QRCode !== 'undefined') {
            qrContainer.innerHTML = ''; // Clear previous QR
            new QRCode(qrContainer, {
                text: igUrl,
                width: 140, height: 140,
                colorDark: "#1E2A38", colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        }
    }

    // Business Address
    const addressText = sysCfg.business_address;
    const addressEl = document.getElementById('footerAddress');
    if (addressEl && addressText) {
        addressEl.innerHTML = `<strong style="color: var(--accent-yellow);">Workshop Wagir:</strong><br>${addressText}`;
    }

    // Google Maps Iframe
    const mapsUrl = sysCfg.gmaps_iframe_url;
    const mapsIframe = document.getElementById('footerMapsIframe');
    if (mapsIframe && mapsUrl) {
        mapsIframe.src = mapsUrl;
    }
    
    // Google Maps Link (Buka via Google Maps button)
    const mapsLink = document.getElementById('footerMapsLink');
    if (mapsLink) {
        if (addressText) {
            mapsLink.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressText)}`;
        } else if (mapsUrl) {
            mapsLink.href = mapsUrl;
        }
    }
}

// =============================================
// 8. KOORDINAT WORKSHOP (WAGIR, MALANG)
// =============================================
const SHOP_LAT = -8.0261;
const SHOP_LON = 112.5855;
const SHOP_ADDRESS_ENCODED = encodeURIComponent(
  'Dusun Jamuran, Sukodadi, Wagir, Malang, Jawa Timur'
);

// =============================================
// HELPER: HAVERSINE FORMULA
// =============================================
function hitungHaversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
    Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
    Math.sin(dLon/2)**2;
  return Math.ceil(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 1.3);
}

// =============================================
// HELPER: SET JARAK + UPDATE UI
// =============================================
function terapkanJarak(km, metode, customerLat = null, customerLon = null, alamatText = '') {
  const distEl = document.getElementById('orderDistance');
  const statusEl = document.getElementById('jarakStatusMsg');
  const mapsLink = document.getElementById('mapsLinkCustomer');

  if (distEl) distEl.value = km;
  window.calculateTotal();

  // Buat Google Maps link — format universal agar bisa dibuka di semua device
  let gmapsUrl = '';
  if (customerLat && customerLon) {
    // GPS: pakai koordinat presisi — format yang kompatibel universal di WA
    gmapsUrl = `http://maps.google.com/?q=${customerLat},${customerLon}`;
  } else if (alamatText) {
    // Alamat manual: encode teks
    gmapsUrl = `http://maps.google.com/?q=${encodeURIComponent(alamatText + ', Malang')}`;
  }

  // Simpan ke window agar bisa diakses processOrder()
  window._gmapsLinkCustomer = gmapsUrl;

  // Tampilkan link peta di form
  if (mapsLink && gmapsUrl) {
    mapsLink.href = gmapsUrl;
    mapsLink.style.display = 'flex';
  }

  if (statusEl) {
    const ongkirInfo = km > 10
      ? ` (Ongkir: +Rp ${((km - 10) * 2000).toLocaleString('id-ID')})`
      : ' (Gratis ongkir)';
    statusEl.innerText = `${metode}: ${km} KM dari Workshop Wagir${ongkirInfo}`;
    statusEl.style.color = 'var(--primary-sky)';
  }
}

// =============================================
// OPSI 1: GPS OTOMATIS
// =============================================
window.hitungJarakGPS = function() {
  const btn = document.getElementById('btnGpsAuto');
  const statusEl = document.getElementById('jarakStatusMsg');

  if (!navigator.geolocation) {
    if (statusEl) {
      statusEl.innerText = 'GPS tidak didukung browser ini.';
      statusEl.style.color = '#e74c3c';
    }
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengambil lokasi...';
  }
  if (statusEl) {
    statusEl.innerText = 'Meminta izin akses GPS...';
    statusEl.style.color = 'var(--text-muted)';
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const km = hitungHaversine(
        pos.coords.latitude, pos.coords.longitude,
        SHOP_LAT, SHOP_LON
      );

      terapkanJarak(
        km,
        '📍 GPS Otomatis',
        pos.coords.latitude,
        pos.coords.longitude
      );

      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> Posisi GPS Saya';
      }
    },
    (err) => {
      if (statusEl) {
        statusEl.innerText = 'Gagal ambil GPS. Pastikan izin lokasi diaktifkan.';
        statusEl.style.color = '#e74c3c';
      }
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> Posisi GPS Saya';
      }
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
};

// =============================================
// OPSI 2: HITUNG DARI ALAMAT YANG DIKETIK
// Menggunakan Nominatim (OpenStreetMap) — gratis, no API key
// =============================================
window.hitungJarakDariAlamat = async function() {
  const alamat = (document.getElementById('orderAddress')?.value || '').trim();
  const btn = document.getElementById('btnAlamatMaps');
  const statusEl = document.getElementById('jarakStatusMsg');

  if (!alamat) {
    if (statusEl) { statusEl.innerText = 'Isi alamat lengkap terlebih dahulu.'; statusEl.style.color = '#e74c3c'; }
    return;
  }
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mencari...'; }
  if (statusEl) { statusEl.innerText = 'Mencari koordinat...'; statusEl.style.color = 'var(--text-muted)'; }

  try {
    const resp = await fetch(`/api/geocode?q=${encodeURIComponent(alamat)}`);
    const data = await resp.json();
    if (!data.success) throw new Error(data.error || 'Alamat tidak ditemukan.');
    const km = hitungHaversine(data.lat, data.lon, SHOP_LAT, SHOP_LON);
    terapkanJarak(km, '🗺 Dari Alamat', data.lat, data.lon, alamat);
  } catch (err) {
    if (statusEl) { statusEl.innerText = err.message; statusEl.style.color = '#e74c3c'; }
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-map-location-dot"></i> Dari Alamat Ketik'; }
  }
};

// =============================================
// TRIGGER OTOMATIS: saat alamat selesai diketik
// (debounce 1.5 detik agar tidak spam API)
// =============================================
let _alamatDebounceTimer = null;
window.onAddressChange = function() {
  clearTimeout(_alamatDebounceTimer);
  const alamat = document.getElementById('orderAddress')?.value?.trim();

  // Update maps link berdasarkan teks alamat saat ini — format universal
  const mapsLink = document.getElementById('mapsLinkCustomer');
  if (mapsLink && alamat) {
    const gmapsUrl = `http://maps.google.com/?q=${encodeURIComponent(alamat + ', Malang')}`;
    mapsLink.href = gmapsUrl;
    mapsLink.style.display = 'flex';
    window._gmapsLinkCustomer = gmapsUrl;
  }
};

// =============================================
// 9. LIGHTBOX (1:1 ASPECT RATIO)
// =============================================
window.openLightbox = async function(serviceId) {
    const services = await DB.getServices();
    const service = services.find(s => s.id === serviceId);
    if (!service) return;

    lightboxSlides = [];
    if (service.image) lightboxSlides.push(service.image);
    if (service.additional_images) {
        service.additional_images.split(',').forEach(img => {
            const trimmed = img.trim();
            if (trimmed && !lightboxSlides.includes(trimmed)) lightboxSlides.push(trimmed);
        });
    }
    if (lightboxSlides.length === 0) {
        lightboxSlides.push('https://images.unsplash.com/photo-1595950653106-6c9ebd614c3a?w=500');
    }

    currentLightboxIndex = 0;
    const slider = document.getElementById('lightboxSlider');
    slider.style.width = `${lightboxSlides.length * 100}%`;
    slider.innerHTML = lightboxSlides.map(img => `
        <div class="lightbox-slide" style="width:${100 / lightboxSlides.length}%; min-width:${100 / lightboxSlides.length}%;"><img src="${img}" alt="Detail"></div>
    `).join('');

    const prevBtn = document.querySelector('.lightbox-prev');
    const nextBtn = document.querySelector('.lightbox-next');
    if (lightboxSlides.length <= 1) {
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
    } else {
        if (prevBtn) prevBtn.style.display = 'flex';
        if (nextBtn) nextBtn.style.display = 'flex';
    }

    window.updateLightboxSlider();
    document.getElementById('lightboxModal').style.display = 'flex';
};

window.closeLightbox = function() {
    document.getElementById('lightboxModal').style.display = 'none';
};

window.prevLightboxSlide = function() {
    if (lightboxSlides.length <= 1) return;
    currentLightboxIndex = (currentLightboxIndex - 1 + lightboxSlides.length) % lightboxSlides.length;
    window.updateLightboxSlider();
};

window.nextLightboxSlide = function() {
    if (lightboxSlides.length <= 1) return;
    currentLightboxIndex = (currentLightboxIndex + 1) % lightboxSlides.length;
    window.updateLightboxSlider();
};

window.updateLightboxSlider = function() {
    const slider = document.getElementById('lightboxSlider');
    slider.style.transform = `translateX(-${(currentLightboxIndex * 100) / lightboxSlides.length}%)`;
};

// =============================================
// 10. PREMIUM COLOR SERIES FOR REPAINT
// =============================================
let allColors = [];
async function renderColors() {
    const container = document.getElementById('colorContainer');
    if (!container) return;
    allColors = await DB.getColors();
    window.filterColors('Kode P'); // Default
}

window.filterColors = function(type) {
    ['tabKodeP', 'tabKodeS', 'tabSuede'].forEach(id => {
        const el = document.getElementById(id);
        if(el) { el.classList.remove('btn-primary'); el.classList.add('btn-secondary'); }
    });
    const activeId = 'tab' + type.replace(' ', '');
    const activeTab = document.getElementById(activeId);
    if(activeTab) { activeTab.classList.remove('btn-secondary'); activeTab.classList.add('btn-primary'); }

    const container = document.getElementById('colorContainer');
    if (!container) return;
    
    const filtered = allColors.filter(c => c.tipe_treatment === type);
    if(filtered.length === 0) {
        container.innerHTML = '<p style="grid-column:1/-1; color:var(--text-muted); padding:2rem;">Belum ada warna untuk kategori ini.</p>';
        return;
    }
    
    container.innerHTML = filtered.map(c => `
        <div class="glass-card" style="padding:1rem; border-radius:12px; transition: transform 0.3s; cursor:pointer;" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
            <div style="width:100%; aspect-ratio:1/1; background-color:${c.hex_color_fallback}; border-radius:8px; margin-bottom:10px; box-shadow:inset 0 4px 10px rgba(0,0,0,0.15); border:1px solid rgba(255,255,255,0.4);"></div>
            <p style="margin:0; font-weight:700; font-size:0.95rem; color:var(--primary-navy);">${c.nama_warna}</p>
            <p style="margin:0; font-size:0.75rem; color:var(--text-muted); margin-top:4px; background:rgba(0,0,0,0.05); padding:2px 6px; border-radius:4px; display:inline-block;">${c.kode_warna}</p>
        </div>
    `).join('');
}
