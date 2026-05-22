// layanan.js - Sparkling Cleaners Transactional Commerce Hub
// Cart, Checkout, Tracking, Catalog Grid, Lightbox, GPS

let lightboxSlides = [];
let currentLightboxIndex = 0;

document.addEventListener('DOMContentLoaded', async () => {
    window.PRICING = await DB.getPricing();
    window.WA_NUMBER = await DB.getWhatsAppNumber();

    await initFulfillmentToggle();
    await renderServicesGrid();
    window.updateCartUI();
    await renderColors();
    await renderFooterMeta();
});

// =============================================
// 1. FULFILLMENT MODE TOGGLE
// =============================================
async function initFulfillmentToggle() {
    const config = await DB.getConfig();
    const dropoffAllowed = config.workshop_dropoff_allowed === true;
    const deliverySelect = document.getElementById('orderDelivery');
    const details = document.getElementById('deliveryDetails');
    const addr = document.getElementById('orderAddress');

    if (deliverySelect) {
        if (!dropoffAllowed) {
            deliverySelect.innerHTML = `<option value="Ya">Jemput / Antar ke Alamat (Antar-Jemput)</option>`;
            deliverySelect.value = 'Ya';
            deliverySelect.disabled = true;
            if (details) { details.style.display = 'block'; }
            if (addr) addr.required = true;
        } else {
            deliverySelect.innerHTML = `
                <option value="Tidak">Antar Sendiri ke Workshop (Drop-off)</option>
                <option value="Ya" selected>Jemput / Antar ke Alamat (Antar-Jemput)</option>
            `;
            deliverySelect.disabled = false;
            window.toggleDeliveryOptions(deliverySelect.value);
        }
    }
}

// =============================================
// 2. DYNAMIC CATALOG GRID
// =============================================
async function renderServicesGrid() {
    const grid = document.getElementById('services-grid');
    if (!grid) return;

    const services = await DB.getServices();
    if (!services || services.length === 0) {
        grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:2rem; color:var(--text-muted);">Belum ada layanan yang tersedia.</div>';
        return;
    }

    grid.innerHTML = '';
    services.forEach(s => {
        const inCart = window.cart.find(item => item.id === s.id);
        const imageUrl = s.image || 'https://images.unsplash.com/photo-1595950653106-6c9ebd614c3a?w=500';
        const treatmentBadge = s.treatment === 'special'
            ? '<span class="badge badge-special" style="font-size:0.7rem;">Special</span>'
            : '<span class="badge badge-regular" style="font-size:0.7rem;">Regular</span>';

        let actionHtml = '';
        if (inCart) {
            actionHtml = `
                <div class="service-qty-control">
                    <button type="button" class="qty-btn-large" onclick="window.updateCartQty('${s.id}', -1)">&minus;</button>
                    <span class="service-qty-val">${inCart.qty}</span>
                    <button type="button" class="qty-btn-large" onclick="window.updateCartQty('${s.id}', 1)">&plus;</button>
                </div>
            `;
        } else {
            actionHtml = `<button type="button" class="btn btn-primary" onclick="window.addToCart('${s.id}')" style="width: 100%;">Tambah <i class="fa-solid fa-cart-plus" style="margin-left:8px;"></i></button>`;
        }

        grid.innerHTML += `
            <div class="glass-card service-card" style="text-align:left; display:flex; flex-direction:column; justify-content:space-between;">
                <div>
                    <div class="service-card-img-wrapper" onclick="window.openLightbox('${s.id}')">
                        <img src="${imageUrl}" alt="${s.name}" class="service-card-img">
                    </div>
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                        ${treatmentBadge}
                        <span style="font-size:0.75rem; font-weight:600; color:var(--text-muted); text-transform:uppercase;">${s.category}</span>
                    </div>
                    <h3 style="margin:0.4rem 0; font-size:1.1rem; line-height:1.3;">${s.name}</h3>
                    <p style="font-size:0.85rem; color:var(--text-muted); line-height:1.4; margin-bottom:1rem;">${s.description || ''}</p>
                </div>
                <div>
                    <div style="font-size:1.25rem; font-weight:700; color:var(--primary-navy); margin-bottom:0.25rem;">${DB.formatCurrency(s.price)}</div>
                    <span style="font-size:0.85rem; color:var(--text-muted); display:block; margin-bottom:1rem;"><i class="fa-regular fa-clock" style="margin-right:4px;"></i> Estimasi: ${s.estimation}</span>
                    <div class="service-card-action">${actionHtml}</div>
                </div>
            </div>
        `;
    });
}

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
            additional_images: service.additional_images || ''
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

    renderServicesGrid();
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

    const expressVal = document.getElementById('orderExpress')?.value || 'none';
    const delivery = document.getElementById('orderDelivery')?.value || 'Ya';
    const distance = parseFloat(document.getElementById('orderDistance')?.value) || 0;

    let expressCost = 0;
    if (expressVal && expressVal !== 'none') {
        const prices = window.PRICING?.express || { "8 Jam": 20000, "18 Jam": 15000, "24 Jam": 10000 };
        expressCost = prices[expressVal] || 0;
    }

    let ongkir = 0;
    if (delivery === 'Ya' && distance > 10) {
        ongkir = (distance - 10) * 2000;
    }

    const sumExpress = expressCost * totalQty;
    const total = subtotal + sumExpress + ongkir;

    const el = (id) => document.getElementById(id);
    if (el('sumService')) el('sumService').innerText = DB.formatCurrency(subtotal);
    if (el('sumExpress')) el('sumExpress').innerText = DB.formatCurrency(sumExpress);
    if (el('sumOngkir')) el('sumOngkir').innerText = delivery === 'Ya' ? (ongkir === 0 ? 'Rp 0 (Gratis)' : DB.formatCurrency(ongkir)) : 'Rp 0';
    if (el('sumTotal')) el('sumTotal').innerText = DB.formatCurrency(total);

    let est = "3-4 Hari";
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

    const name = document.getElementById('orderName').value;
    const phone = document.getElementById('orderPhone').value;
    const expressVal = document.getElementById('orderExpress').value;
    const delivery = document.getElementById('orderDelivery').value;
    const address = document.getElementById('orderAddress').value;
    const distance = document.getElementById('orderDistance').value;
    const schedule = document.getElementById('orderSchedule')?.value || '';
    const notes = document.getElementById('orderNotes').value;
    const photoInput = document.getElementById('orderPhoto');

    const totalQty = window.cart.reduce((sum, item) => sum + item.qty, 0);
    const subtotal = window.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    let expressPrice = expressVal !== 'none' ? (window.PRICING?.express?.[expressVal] || 0) : 0;
    let ongkir = (delivery === 'Ya' && distance > 10) ? (distance - 10) * 2000 : 0;
    const total = subtotal + (expressPrice * totalQty) + ongkir;

    const orderId = DB.generateOrderCode();

    let photoUrl = null;
    if (photoInput && photoInput.files && photoInput.files[0]) {
        const formData = new FormData();
        formData.append('image', photoInput.files[0]);
        try {
            const uploadResp = await fetch('http://localhost:3000/api/upload', { method: 'POST', body: formData });
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
        status: 1, items: JSON.stringify(window.cart), photo: photoUrl
    };

    const res = await DB.addOrder(orderData);
    if (!res || res.error) {
        alert('Gagal mengirim pesanan. Silakan coba lagi.');
        return;
    }

    // Build WhatsApp message
    const shopPhone = window.WA_NUMBER || "6285965957290";
    let msg = `Halo kak, saya mau pesan layanan cuci di *Sparkling Cleaners* ✨%0A%0A`;
    msg += `*Detail Pesanan:*%0A`;
    msg += `- No. Order: *${orderId}*%0A`;
    msg += `- Nama: ${name}%0A`;
    msg += `- WhatsApp: ${phone}%0A%0A`;
    msg += `*Layanan yang Dipilih:*%0A`;
    window.cart.forEach(item => {
        msg += `- ${item.name} (${item.qty}x) - ${DB.formatCurrency(item.price * item.qty)}%0A`;
    });
    msg += `%0A- Express: ${expressVal !== 'none' ? expressVal : 'Normal'}%0A`;
    msg += `- Catatan: ${notes || '-'}%0A%0A`;

    if (delivery === 'Ya') {
        msg += `*Pengiriman:*%0A`;
        msg += `- Jadwal Pickup: ${schedule}%0A`;
        msg += `- Alamat: ${address}%0A%0A`;
    }

    msg += `*Estimasi Biaya:*%0A`;
    msg += `- Subtotal: ${DB.formatCurrency(subtotal)}%0A`;
    if (expressPrice > 0) msg += `- Biaya Express: ${DB.formatCurrency(expressPrice * totalQty)}%0A`;
    if (delivery === 'Ya') msg += `- Ongkos Kirim: ${ongkir === 0 ? 'Gratis' : DB.formatCurrency(ongkir)}%0A`;
    msg += `- Total: *${DB.formatCurrency(total)}*%0A%0A`;
    msg += `Mohon segera dikonfirmasi ya kak, terima kasih! 🙏`;

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
// 8. GPS DISTANCE (HAVERSINE)
// =============================================
window.calculateDistanceGPS = function() {
    const btn = document.getElementById('btnGps');
    const status = document.getElementById('gpsStatus');
    const distanceInput = document.getElementById('orderDistance');

    if (!navigator.geolocation) {
        status.innerText = "Geolocation tidak didukung oleh browser Anda.";
        status.style.color = "red";
        return;
    }

    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ...';
    btn.disabled = true;
    status.innerText = "Meminta izin akses lokasi GPS...";
    status.style.color = "var(--primary-navy)";

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const userLat = position.coords.latitude;
            const userLon = position.coords.longitude;
            const shopLat = -8.0261;
            const shopLon = 112.5855;

            const R = 6371;
            const dLat = (userLat - shopLat) * Math.PI / 180;
            const dLon = (userLon - shopLon) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(shopLat * Math.PI / 180) * Math.cos(userLat * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            let distance = Math.ceil(R * c * 1.3);

            distanceInput.value = distance;
            window.calculateTotal();

            btn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> GPS';
            btn.disabled = false;
            status.innerText = `Berhasil! Jarak perkiraan: ${distance} KM.`;
            status.style.color = "green";
        },
        () => {
            btn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> GPS';
            btn.disabled = false;
            status.innerText = "Gagal. Pastikan izin lokasi GPS diaktifkan.";
            status.style.color = "red";
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
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
    slider.innerHTML = lightboxSlides.map(img => `
        <div class="lightbox-slide"><img src="${img}" alt="Detail"></div>
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
    slider.style.transform = `translateX(-${currentLightboxIndex * 100}%)`;
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
