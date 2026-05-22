// landing.js - Sparkling Cleaners Landing Customer Flow

let lightboxSlides = [];
let currentLightboxIndex = 0;

document.addEventListener('DOMContentLoaded', async () => {
    // Load pricing first to ensure it's available for all renders and options
    window.PRICING = await DB.getPricing();
    
    const qrContainer = document.getElementById('ig-qr-code');
    if (qrContainer && typeof QRCode !== 'undefined') {
        new QRCode(qrContainer, {
            text: "https://instagram.com/sparklingcleaners_mlg",
            width: 150,
            height: 150,
            colorDark: "#1E2A38",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    }

    // Interactive Star Rating Logic
    const stars = document.querySelectorAll('#modalStarRating i');
    const ratingInput = document.getElementById('ratingValue');
    const ratingText = document.getElementById('ratingText');
    const textDesc = ["Sangat Kurang", "Kurang", "Cukup", "Puas", "Sangat Puas"];

    stars.forEach(star => {
        star.addEventListener('click', function() {
            const rating = parseInt(this.getAttribute('data-rating'));
            ratingInput.value = rating;
            if(ratingText) {
                ratingText.innerText = textDesc[rating - 1];
                ratingText.style.color = "var(--primary-navy)";
            }
            
            stars.forEach(s => {
                if (parseInt(s.getAttribute('data-rating')) <= rating) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });
        });
    });

    // Initialize New Features
    await initHeroSlideshow();
    await initFulfillmentToggle();
    window.updateCartUI();

    // Dynamic Content Rendering
    await renderBranding();
    await renderPricing();
    await renderArticles();
    await renderTestimonials();
});

// 1. Hero Slideshow Logic
async function initHeroSlideshow() {
    const slideshowContainer = document.getElementById('heroSlideshow');
    if (!slideshowContainer) return;
    
    const config = await DB.getConfig();
    let slides = config.hero_slides;
    if (!slides || !Array.isArray(slides) || slides.length === 0) {
        slides = [
            'https://images.unsplash.com/photo-1595950653106-6c9ebd614c3a?w=1200',
            'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200',
            'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1200'
        ];
    }
    
    slideshowContainer.innerHTML = slides.map((img, idx) => `
        <div class="hero-slide ${idx === 0 ? 'active' : ''}" style="background-image: url('${img}');"></div>
    `).join('');
    
    let currentIndex = 0;
    setInterval(() => {
        const slidesElements = slideshowContainer.querySelectorAll('.hero-slide');
        if (slidesElements.length <= 1) return;
        
        slidesElements[currentIndex].classList.remove('active');
        currentIndex = (currentIndex + 1) % slidesElements.length;
        slidesElements[currentIndex].classList.add('active');
    }, 2000);
}

// Scroll Parallax Fade-Out
window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const heroSlideshow = document.getElementById('heroSlideshow');
    const heroTitle = document.getElementById('heroTitle');
    const heroSubtitle = document.getElementById('heroSubtitle');
    const heroBtn = document.querySelector('.hero .btn-primary');
    
    const opacity = Math.max(0, 1 - scrollY / 350);
    if (heroSlideshow) heroSlideshow.style.opacity = opacity;
    if (heroTitle) heroTitle.style.opacity = opacity;
    if (heroSubtitle) heroSubtitle.style.opacity = opacity;
    if (heroBtn) heroBtn.style.opacity = opacity;
});

// 2. Fulfillment Mode Toggle
async function initFulfillmentToggle() {
    const config = await DB.getConfig();
    const dropoffAllowed = config.workshop_dropoff_allowed === true;
    const deliverySelect = document.getElementById('orderDelivery');
    const details = document.getElementById('deliveryDetails');
    const addr = document.getElementById('orderAddress');
    
    if (deliverySelect) {
        if (!dropoffAllowed) {
            deliverySelect.innerHTML = `<option value="Ya">Jemput / Antar ke Alamat (Ya)</option>`;
            deliverySelect.value = 'Ya';
            deliverySelect.disabled = true;
            if (details) {
                details.style.display = 'block';
                if (addr) addr.required = true;
            }
        } else {
            deliverySelect.innerHTML = `
                <option value="Tidak">Antar Sendiri ke Workshop (Tidak)</option>
                <option value="Ya">Jemput / Antar ke Alamat (Ya)</option>
            `;
            deliverySelect.disabled = false;
            window.toggleDeliveryOptions(deliverySelect.value);
        }
    }
}

// 3. Dynamic Catalog Grid Rendering
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
            actionHtml = `
                <button type="button" class="btn btn-primary" onclick="window.addToCart('${s.id}')" style="width: 100%;">Tambah ke Keranjang <i class="fa-solid fa-cart-plus" style="margin-left:8px;"></i></button>
            `;
        }

        grid.innerHTML += `
            <div class="glass-card service-card" style="text-align: left; display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                    <div class="service-card-img-wrapper" onclick="window.openLightbox('${s.id}')">
                        <img src="${imageUrl}" alt="${s.name}" class="service-card-img">
                    </div>
                    <span style="font-size: 0.8rem; font-weight: 600; color: var(--primary-sky); text-transform: uppercase;">${s.category} - ${s.treatment}</span>
                    <h3 style="margin: 0.5rem 0; font-size: 1.2rem;">${s.name}</h3>
                    <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.4; margin-bottom: 1rem;">${s.description || 'Pembersihan mendalam untuk menjaga kualitas bahan.'}</p>
                </div>
                <div>
                    <div class="service-price" style="font-size:1.25rem; font-weight:700; color:var(--primary-navy); margin-bottom:0.25rem;">${DB.formatCurrency(s.price)}</div>
                    <span class="service-time" style="font-size:0.85rem; color:var(--text-muted); display:block; margin-bottom:1rem;"><i class="fa-regular fa-clock" style="margin-right:4px;"></i> Estimasi: ${s.estimation}</span>
                    <div class="service-card-action">
                        ${actionHtml}
                    </div>
                </div>
            </div>
        `;
    });
}

// 4. Shopping Cart State Engine
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
    if (open) {
        drawer.classList.add('open');
    } else {
        drawer.classList.remove('open');
    }
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
            drawerList.innerHTML = '<p style="color: var(--text-muted); font-size:0.9rem; text-align:center; margin-top:2rem;">Keranjang belanja kosong.</p>';
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
    if (drawerSubtotal) {
        drawerSubtotal.innerText = DB.formatCurrency(subtotal);
    }
    
    const checkoutList = document.getElementById('checkoutCartList');
    if (checkoutList) {
        if (window.cart.length === 0) {
            checkoutList.innerHTML = '<p style="color: var(--text-muted); font-size:0.9rem; text-align:center; margin:0;">Keranjang belanja kosong. Silakan pilih layanan di atas.</p>';
        } else {
            checkoutList.innerHTML = window.cart.map(item => `
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(0,0,0,0.05); padding-bottom:8px; margin-bottom:8px;">
                    <div style="text-align: left;">
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

// 5. 1:1 Lightbox Image Slider
window.openLightbox = async function(serviceId) {
    const services = await DB.getServices();
    const service = services.find(s => s.id === serviceId);
    if (!service) return;
    
    lightboxSlides = [];
    if (service.image) lightboxSlides.push(service.image);
    if (service.additional_images) {
        service.additional_images.split(',').forEach(img => {
            const trimmed = img.trim();
            if (trimmed && !lightboxSlides.includes(trimmed)) {
                lightboxSlides.push(trimmed);
            }
        });
    }
    
    if (lightboxSlides.length === 0) {
        lightboxSlides.push('https://images.unsplash.com/photo-1595950653106-6c9ebd614c3a?w=500');
    }
    
    currentLightboxIndex = 0;
    const slider = document.getElementById('lightboxSlider');
    slider.innerHTML = lightboxSlides.map(img => `
        <div class="lightbox-slide">
            <img src="${img}" alt="Detail Image">
        </div>
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

// 6. Old Pricing Table & Layout fallbacks
async function renderBranding() {
    const config = await DB.getConfig();
    if (config && config.hero) {
        const heroTitle = document.getElementById('heroTitle');
        const heroSubtitle = document.getElementById('heroSubtitle');
        if (heroTitle) heroTitle.innerText = config.hero.title || heroTitle.innerText;
        if (heroSubtitle) heroSubtitle.innerText = config.hero.subtitle || heroSubtitle.innerText;
    }
}

async function renderPricing() {
    const p = window.PRICING || await DB.getPricing();
    if (!p) return;
    const kFormat = (num) => (num >= 1000 ? Math.round(num / 1000) + 'K' : num);
    if (p.regular) {
        if (p.regular.shoes) {
            if (document.getElementById('tbl-reg-shoes-est')) document.getElementById('tbl-reg-shoes-est').innerText = p.regular.shoes.est || '';
            if (document.getElementById('tbl-reg-shoes-Small')) document.getElementById('tbl-reg-shoes-Small').innerText = kFormat(p.regular.shoes.Small);
            if (document.getElementById('tbl-reg-shoes-Medium')) document.getElementById('tbl-reg-shoes-Medium').innerText = kFormat(p.regular.shoes.Medium);
            if (document.getElementById('tbl-reg-shoes-Large')) document.getElementById('tbl-reg-shoes-Large').innerText = kFormat(p.regular.shoes.Large);
        }
        if (p.regular.helmet) {
            if (document.getElementById('tbl-reg-helmet-est')) document.getElementById('tbl-reg-helmet-est').innerText = p.regular.helmet.est || '';
            if (document.getElementById('tbl-reg-helmet-HalfFace')) document.getElementById('tbl-reg-helmet-HalfFace').innerText = kFormat(p.regular.helmet["Half Face"]) + ' (Half Face)';
            if (document.getElementById('tbl-reg-helmet-FullFace')) document.getElementById('tbl-reg-helmet-FullFace').innerText = kFormat(p.regular.helmet["Full Face"]) + ' (Full Face)';
        }
    }
}

const ARTICLE_FALLBACKS = [
    { id:'ART-F1', title:'Cara Jitu Menghilangkan Noda Kuning di Sepatu Minimalis Putih', category:'Perawatan Sepatu', image:'https://images.unsplash.com/photo-1595950653106-6c9ebd614c3a?w=500', desc:'Noda menguning sering terjadi pada sol akibat oksidasi suhu. Inilah rahasianya...', status:'Publik' }
];

async function renderArticles() {
    const rawArticles = await DB.getArticles();
    const articlesFromDB = Array.isArray(rawArticles) ? rawArticles : [];
    const allPublic = (articlesFromDB.length > 0 ? articlesFromDB : ARTICLE_FALLBACKS).filter(a => a.status === 'Publik');
    const container = document.getElementById('articles-container');
    if (!container) return;
    container.innerHTML = allPublic.map(a => `
        <div class="glass-card" style="overflow: hidden; text-align: left;">
            <div style="height: 200px; background: url('${a.image}') center/cover;"></div>
            <div style="padding: 1.5rem;">
                <span style="font-size: 0.8rem; font-weight: 600; color: var(--primary-sky);">${a.category}</span>
                <h3 style="margin: 0.5rem 0; font-size: 1.1rem; line-height:1.4;">${a.title}</h3>
                <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1rem;">${a.description || a.desc || ''}</p>
            </div>
        </div>
    `).join('');
}

// 7. Order Calculations
window.toggleDeliveryOptions = function(val) {
    const details = document.getElementById('deliveryDetails');
    const addr = document.getElementById('orderAddress');
    if (val === 'Ya') {
        if (details) details.style.display = 'block';
        if (addr) addr.required = true;
    } else {
        if (details) details.style.display = 'none';
        if (addr) {
            addr.required = false;
            addr.value = '';
        }
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
            if (preview) {
                preview.src = e.target.result;
                preview.style.display = 'block';
            }
        }
        reader.readAsDataURL(input.files[0]);
    }
};

window.calculateTotal = function() {
    const totalQty = window.cart.reduce((sum, item) => sum + item.qty, 0);
    const subtotal = window.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    
    const expressVal = document.getElementById('orderExpress')?.value || 'none';
    const delivery = document.getElementById('orderDelivery')?.value || 'Tidak';
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
    
    const sumService = subtotal;
    const sumExpress = expressCost * totalQty;
    const total = sumService + sumExpress + ongkir;
    
    const sumServiceEl = document.getElementById('sumService');
    const sumExpressEl = document.getElementById('sumExpress');
    const sumOngkirEl = document.getElementById('sumOngkir');
    const sumTotalEl = document.getElementById('sumTotal');
    const sumEstEl = document.getElementById('sumEst');
    
    if (sumServiceEl) sumServiceEl.innerText = DB.formatCurrency(sumService);
    if (sumExpressEl) sumExpressEl.innerText = DB.formatCurrency(sumExpress);
    if (sumOngkirEl) sumOngkirEl.innerText = delivery === 'Ya' ? (ongkir === 0 ? 'Rp 0 (Gratis)' : DB.formatCurrency(ongkir)) : 'Rp 0';
    if (sumTotalEl) sumTotalEl.innerText = DB.formatCurrency(total);
    
    let est = "3-4 Hari";
    if (expressVal !== 'none') est = expressVal;
    if (sumEstEl) sumEstEl.innerText = est;
};

// 8. Order Submission
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
    const schedule = document.getElementById('orderSchedule').value;
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
            const uploadResp = await fetch('http://localhost:3000/api/upload', {
                method: 'POST',
                body: formData
            });
            const uploadResult = await uploadResp.json();
            if (uploadResult.success) {
                photoUrl = uploadResult.urls[0];
            }
        } catch (uploadErr) {
            console.error('Failed to upload condition photo:', uploadErr);
        }
    }

    const orderData = {
        id: orderId,
        name,
        phone,
        itemType: 'Multi-Item',
        qty: totalQty,
        treatment: 'Multi-Item',
        service: window.cart.map(i => `${i.name} (${i.qty}x)`).join(', '),
        express: expressVal,
        delivery,
        address,
        distance,
        schedule,
        notes,
        price: subtotal,
        expressPrice: expressPrice * totalQty,
        ongkir,
        total,
        status: 1,
        items: JSON.stringify(window.cart),
        photo: photoUrl
    };

    const res = await DB.addOrder(orderData);
    if (!res || res.error) {
        alert('Gagal mengirim pesanan. Silakan coba lagi.');
        return;
    }
    
    const shopPhone = "6285965957290"; 
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
    
    alert(`Pesanan berhasil dibuat!\nKode Order: ${orderData.id}\nAnda akan diarahkan ke WhatsApp untuk mengirim pesanan.`);
    
    window.cart = [];
    window.saveCart();
    window.updateCartUI();
    
    document.getElementById('orderForm').reset();
    const preview = document.getElementById('photoPreview');
    if (preview) {
        preview.src = '';
        preview.style.display = 'none';
    }
    
    window.location.href = waURL;
};

// 9. Order Tracking Simulation
window.simulateTracking = function() {
    const inputEl = document.getElementById('trackInput');
    const input = inputEl ? inputEl.value.trim() : '';
    const msg = document.getElementById('trackingStatusMessage');
    const steps = document.querySelectorAll('.step');

    if (input === '') {
        alert("Silakan masukkan Nomor Order atau Nomor WA!");
        return;
    }

    steps.forEach(step => step.classList.remove('active'));
    if (msg) {
        msg.style.display = 'block';
        msg.innerText = "Mencari data pesanan...";
    }

    setTimeout(async () => {
        const code = input.toUpperCase();
        const orders = await DB.getOrders();
        const found = orders.find(o => o.id === code || o.phone === code);
        
        let currentStep = 1;
        if (found) {
            currentStep = found.status;
        } else {
            currentStep = Math.floor(Math.random() * 5) + 1;
        }

        for (let i = 0; i < currentStep; i++) {
            if (steps[i]) steps[i].classList.add('active');
        }

        const statusLabels = [
            "Barang telah diterima di Workshop kami.",
            "Barang sedang dalam proses Treatment / Deep Cleaning.",
            "Barang masuk tahap pengeringan sinar UV / angin. (H-2 Selesai)",
            "Tahap Finishing: Pemberian pewangi dan QC akhir. (H-1 Selesai)",
            "Barang SIAP DIAMBIL / dalam perjalanan diantar ke lokasi Anda!"
        ];

        if (msg) {
            msg.innerText = found 
                ? `Order ${found.id}: ${statusLabels[currentStep - 1]} ✨` 
                : `Data simulasi: ${statusLabels[currentStep - 1]} ✨`;
        }
    }, 800);
};

// 10. Testimonials rendering and modal
window.openTestimoniModal = function() {
    document.getElementById('testimoniModal').style.display = 'flex';
};

window.closeTestimoniModal = function() {
    document.getElementById('testimoniModal').style.display = 'none';
};

function _maskName(name) {
    const parts = name.trim().split(' ');
    return parts.map(p => p.length <= 1 ? p : p[0] + '***' + p[p.length - 1]).join(' ');
}

window.submitTestimoni = async function(event) {
    event.preventDefault();
    const nameRaw = document.getElementById('reviewerName').value.trim();
    const isAnonim = document.getElementById('isAnonim').checked;
    const name = isAnonim ? _maskName(nameRaw) : nameRaw;
    const rating = parseInt(document.getElementById('ratingValue').value);
    const content = document.getElementById('reviewerMessage').value.trim();
    const photoInput = document.getElementById('reviewerPhoto');

    if (!name || !rating || !content) {
        alert('Harap lengkapi nama, rating, dan pesan ulasan Anda!');
        return;
    }

    const btn = document.getElementById('submitTestimoniBtn');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengirim...'; }

    try {
        let imageUrl = null;
        if (photoInput && photoInput.files && photoInput.files.length > 0) {
            const files = Array.from(photoInput.files);
            const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];
            
            for (let file of files) {
                const fileName = file.name.toLowerCase();
                const isAllowed = allowedExtensions.some(ext => fileName.endsWith(ext));
                if (!isAllowed) {
                    if (btn) { btn.disabled = false; btn.innerHTML = 'Kirim Testimoni <i class="fa-solid fa-paper-plane" style="margin-left:5px;"></i>'; }
                    alert(`File "${file.name}" tidak valid. Foto harus dalam format (.jpg, .jpeg, .png, .webp, .avif).`);
                    return;
                }
            }

            const formData = new FormData();
            files.forEach(file => formData.append('image', file));
            
            const uploadResp = await fetch('http://localhost:3000/api/upload', { method: 'POST', body: formData });
            const uploadResult = await uploadResp.json();
            if (uploadResult.success) {
                imageUrl = uploadResult.urls.join(',');
            } else {
                throw new Error(uploadResult.error || 'Gagal mengupload foto.');
            }
        }

        const res = await DB.addTestimonial({ name, rating, content, image: imageUrl });
        if (res && res.success) {
            alert('Terima kasih! ✅ Ulasan Anda berhasil dikirim dan akan ditinjau oleh tim kami sebelum ditampilkan.');
            document.getElementById('testimoniForm').reset();
            document.querySelectorAll('#modalStarRating i').forEach(s => s.style.color = '');
            document.getElementById('ratingValue').value = '';
            const ratingText = document.getElementById('ratingText');
            if (ratingText) ratingText.innerText = 'Klik untuk menilai';
            window.closeTestimoniModal();
        } else {
            alert('Gagal mengirim ulasan. Pastikan koneksi server aktif.');
        }
    } catch (err) {
        alert('Terjadi kesalahan: ' + err.message);
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = 'Kirim Testimoni <i class="fa-solid fa-paper-plane" style="margin-left:5px;"></i>'; }
    }
};

// 11. GPS Distance Calculation
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
            const a = 
                Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(shopLat * Math.PI / 180) * Math.cos(userLat * Math.PI / 180) * 
                Math.sin(dLon/2) * Math.sin(dLon/2); 
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
            let distance = R * c;
            distance = distance * 1.3;
            distance = Math.ceil(distance);
            
            distanceInput.value = distance;
            window.calculateTotal();
            
            btn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> GPS';
            btn.disabled = false;
            status.innerText = `Berhasil! Jarak jalan raya perkiraan: ${distance} KM.`;
            status.style.color = "green";
        },
        (error) => {
            btn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> GPS';
            btn.disabled = false;
            status.innerText = "Gagal. Pastikan izin lokasi GPS diaktifkan di browser.";
            status.style.color = "red";
            console.error(error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
};

async function renderTestimonials() {
    const rawTests = await DB.getTestimonials();
    const approved = (rawTests || []).filter(t => t.status === 'Approved');
    const container = document.getElementById('testimonials-container');
    if (!container) return;
    container.innerHTML = '';
    if (approved.length === 0) {
        container.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding: 2rem; grid-column:1/-1;">Belum ada ulasan yang ditampilkan.</div>`;
        return;
    }
    approved.forEach(t => {
        let imagesHtml = '';
        if (t.image) {
            const urls = t.image.split(',');
            imagesHtml = `
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(80px, 1fr)); gap:8px; margin-top:8px;">
                    ${urls.map(url => `
                        <img src="${url}" style="width:100%; height:80px; object-fit:cover; border-radius:10px; cursor:pointer;" onclick="window.open('${url}', '_blank')">
                    `).join('')}
                </div>
            `;
        }

        container.innerHTML += `
            <div class="glass-card" style="padding: 1.5rem; display:flex; flex-direction:column; gap:0.75rem;">
                <div style="display:flex; align-items:center; gap:12px;">
                    <div style="width:45px; height:45px; border-radius:50%; background:rgba(52, 152, 219, 0.2); display:flex; align-items:center; justify-content:center; color: var(--primary-sky);">
                        <i class="fa-solid fa-user"></i>
                    </div>
                    <div>
                        <h4 style="margin:0; font-size:1rem; color:var(--primary-navy);">${t.name}</h4>
                        <div style="color:var(--accent-yellow); font-size:0.9rem;">
                            ${Array(t.rating).fill('<i class="fa-solid fa-star"></i>').join('')}${Array(5-t.rating).fill('<i class="fa-regular fa-star"></i>').join('')}
                        </div>
                    </div>
                </div>
                <p style="font-size:0.95rem; font-style:italic; color:var(--text-muted); margin:0; line-height:1.6;">&ldquo;${t.content}&rdquo;</p>
                ${imagesHtml}
            </div>
        `;
    });
}
