// landing.js

let PRICING = {};
(async () => {
    PRICING = await DB.getPricing();
    window.PRICING = PRICING;
})();

// Generate QR Code
document.addEventListener('DOMContentLoaded', () => {
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

    // Dynamic Content Rendering
    await renderBranding();
    await renderArticles();
    await renderTestimonials();
});

async function renderBranding() {
    const config = await DB.getConfig();
    if (config && config.hero) {
        const heroTitle = document.querySelector('.hero h1');
        const heroSubtitle = document.querySelector('.hero p');
        if (heroTitle) heroTitle.innerText = config.hero.title;
        if (heroSubtitle) heroSubtitle.innerText = config.hero.subtitle;
    }
}

async function renderArticles() {
    const rawArticles = await DB.getArticles();
    const articles = (rawArticles || []).filter(a => a.status === 'Publik');
    const container = document.getElementById('articles-container');
    if (!container) return;

    container.innerHTML = '';
    
    articles.forEach(a => {
        container.innerHTML += `
            <div class="glass-card" style="overflow: hidden; text-align: left;">
                <div style="height: 200px; background: url('${a.image}') center/cover;"></div>
                <div style="padding: 1.5rem;">
                    <span style="font-size: 0.8rem; font-weight: 600; color: var(--primary-sky);">${DB.sanitize(a.category)}</span>
                    <h3 style="margin: 0.5rem 0; font-size: 1.1rem; line-height:1.4;">${DB.sanitize(a.title)}</h3>
                    <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1rem;">${DB.sanitize(a.desc)}</p>
                    <a href="javascript:alert('Fitur baca selengkapnya segera hadir!')" 
                       style="color: var(--primary-navy); font-weight: 600; text-decoration: none; font-size: 0.9rem;">
                       Baca Selengkapnya <i class="fa-solid fa-arrow-right" style="margin-left: 5px;"></i>
                    </a>
                </div>
            </div>
        `;
    });
}

// Visual Selection Handlers
window.selectItem = function(val, el) {
    document.querySelectorAll('#itemSelection .selection-card').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('orderItemType').value = val;
    window.updateServiceOptions();
};

window.selectTreatment = function(val, el) {
    document.querySelectorAll('#treatmentSelection .treatment-opt').forEach(o => o.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('orderTreatmentType').value = val;
    window.updateServiceOptions();
};

// Update Service Options based on Item Type and Treatment Type
window.updateServiceOptions = function() {
    const type = document.getElementById('orderItemType').value;
    const treatment = document.getElementById('orderTreatmentType').value;
    const serviceSelect = document.getElementById('orderService');
    
    serviceSelect.innerHTML = '<option value="">- Pilih Layanan -</option>';
    
    if (!type) return;

    let options = {};
    if (treatment === 'regular') {
        if (type === 'Sepatu') options = window.PRICING.regular.shoes;
        if (type === 'Tas') {
            options = { "Leather Small": 25000, "Leather Medium": 30000, "Leather Large": 35000, "Fabric Small": 20000, "Fabric Medium": 25000, "Fabric Large": 30000 };
        }
        if (type === 'Helm') options = window.PRICING.regular.helmet;
    } else {
        // Special Treatment
        if (type === 'Sepatu') {
            options = {
                "Boots Small": 60000, "Boots Medium": 65000, "Boots Large": 80000,
                "Suede Small": 50000, "Suede Medium": 60000, "Suede Large": 70000,
                "Dress Shoes Small": 55000, "Dress Shoes Medium": 60000, "Dress Shoes Large": 65000,
                "Repaint P Upper": 80000, "Repaint P Midsole": 50000, "Repaint P Outsole": 40000, "Repaint P Insole": 30000,
                "Repaint S Upper": 100000, "Repaint S Midsole": 63000, "Repaint S Outsole": 50000, "Repaint S Insole": 38000,
                "Repaint Suede Upper": 120000, "Repaint Suede Midsole": 75000, "Repaint Suede Outsole": 60000, "Repaint Suede Insole": 45000,
                "Liquid Remover": 15000, "Unyellowing": 20000, "Canvas Cleaner & Whitener": 20000, "Leather Filler": 25000
            };
        }
        if (type === 'Tas') options = { "Liquid Remover Small Fabric": 5000 };
        if (type === 'Helm') options = { "Belum ada layanan special": 0 };
    }

    for (const [key, val] of Object.entries(options)) {
        if (key !== 'est') {
            serviceSelect.innerHTML += `<option value="${key}|${val}">${key} (Rp ${val.toLocaleString('id-ID')})</option>`;
        }
    }
    window.calculateTotal();
};

window.toggleDeliveryOptions = function(val) {
    const details = document.getElementById('deliveryDetails');
    const addr = document.getElementById('orderAddress');
    if (val === 'Ya') {
        details.style.display = 'block';
        addr.required = true;
    } else {
        details.style.display = 'none';
        addr.required = false;
        addr.value = '';
        document.getElementById('orderDistance').value = 0;
    }
    window.calculateTotal();
};

window.previewPhoto = function(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('photoPreview');
            preview.src = e.target.result;
            preview.style.display = 'block';
        }
        reader.readAsDataURL(input.files[0]);
    }
};

window.calculateTotal = function() {
    const serviceVal = document.getElementById('orderService').value;
    const qty = parseInt(document.getElementById('orderQty').value) || 1;
    const expressVal = document.getElementById('orderExpress').value;
    const delivery = document.getElementById('orderDelivery').value;
    const distance = parseFloat(document.getElementById('orderDistance').value) || 0;
    
    let servicePrice = 0;
    if (serviceVal) {
        servicePrice = parseInt(serviceVal.split('|')[1]);
    }
    
    let expressCost = 0;
    if (expressVal && expressVal !== 'none') {
        expressCost = window.PRICING.express[expressVal] || 0;
    }
    
    let ongkir = 0;
    if (delivery === 'Ya' && distance > 10) {
        ongkir = (distance - 10) * 2000;
    }
    
    const sumService = servicePrice * qty;
    const sumExpress = expressCost * qty; // Asumsi express per item
    const total = sumService + sumExpress + ongkir;
    
    document.getElementById('sumService').innerText = DB.formatCurrency(sumService);
    document.getElementById('sumExpress').innerText = DB.formatCurrency(sumExpress);
    document.getElementById('sumOngkir').innerText = delivery === 'Ya' ? (ongkir === 0 ? 'Rp 0 (Gratis)' : DB.formatCurrency(ongkir)) : 'Rp 0';
    document.getElementById('sumTotal').innerText = DB.formatCurrency(total);
    
    // Estimasi
    let est = "3-4 Hari"; // default
    if (expressVal !== 'none') est = expressVal;
    document.getElementById('sumEst').innerText = est;
};

document.addEventListener('DOMContentLoaded', () => {
    // Load config
    const config = DB.getConfig();
    const heroTitle = document.getElementById('heroTitle');
    const heroSubtitle = document.getElementById('heroSubtitle');
    if (heroTitle) heroTitle.innerText = config.heroTitle;
    if (heroSubtitle) heroSubtitle.innerText = config.heroSubtitle;

    // Load Articles
    const articles = DB.get('sparklingArticles');
    const container = document.getElementById('articles-container');
    if(container && articles.length > 0) {
        container.innerHTML = '';
        articles.filter(a => a.status === 'Publik').forEach(a => {
            container.innerHTML += `
            <div class="glass-card" style="overflow: hidden; text-align: left; display: flex; flex-direction: column;">
                <div style="height: 200px; background: url('${a.image}') center/cover;"></div>
                <div style="padding: 1.5rem; flex: 1; display: flex; flex-direction: column;">
                    <span style="font-size: 0.8rem; font-weight: 600; color: var(--primary-sky);">${a.category}</span>
                    <h3 style="margin: 0.5rem 0; font-size: 1.1rem; line-height:1.4;">${a.title}</h3>
                    <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1rem; flex: 1;">${a.desc}</p>
                    <a href="javascript:alert('Fitur baca artikel selengkapnya akan hadir di versi berikutnya!')" style="color: var(--primary-navy); font-weight: 600; text-decoration: none; font-size: 0.9rem; align-self: flex-start;">Baca Selengkapnya <i class="fa-solid fa-arrow-right" style="margin-left: 5px;"></i></a>
                </div>
            </div>`;
        });
    }
});
window.processOrder = async function(event) {
    event.preventDefault();
    
    const name = document.getElementById('orderName').value;
    const phone = document.getElementById('orderPhone').value;
    const itemType = document.getElementById('orderItemType').value;
    const qty = document.getElementById('orderQty').value;
    const treatment = document.getElementById('orderTreatmentType').value;
    const serviceVal = document.getElementById('orderService').value;
    const expressVal = document.getElementById('orderExpress').value;
    const delivery = document.getElementById('orderDelivery').value;
    const address = document.getElementById('orderAddress').value;
    const distance = document.getElementById('orderDistance').value;
    const schedule = document.getElementById('orderSchedule').value;
    const notes = document.getElementById('orderNotes').value;
    
    if (!serviceVal) {
        alert("Silakan pilih layanan terlebih dahulu!");
        return;
    }
    
    const serviceName = serviceVal.split('|')[0];
    const servicePrice = parseInt(serviceVal.split('|')[1]);
    let expressPrice = expressVal !== 'none' ? PRICING.express[expressVal] : 0;
    let ongkir = (delivery === 'Ya' && distance > 10) ? (distance - 10) * 2000 : 0;
    const total = (servicePrice * qty) + (expressPrice * qty) + ongkir;

    const orderId = DB.generateOrderCode();
    const orderData = {
        id: orderId,
        name, phone, itemType, qty, treatment, 
        service: serviceName, express: expressVal,
        delivery, address, distance, schedule, notes,
        price: servicePrice, expressPrice, ongkir, total,
        status: 1
    };

    await DB.addOrder(orderData);
    
    // Generate Nota WA (Customer to Admin)
    const shopPhone = "6285965957290"; 
    let msg = `Halo kak, saya mau pesan layanan cuci di *Sparkling Cleaners* ✨%0A%0A`;
    msg += `*Detail Pesanan:*%0A`;
    msg += `- No. Order: *${orderId}*%0A`;
    msg += `- Nama: ${name}%0A`;
    msg += `- Item: ${itemType} (${qty} item)%0A`;
    msg += `- Layanan: ${serviceName} (${treatment})%0A`;
    if (expressVal && expressVal !== 'none') msg += `- Express: ${expressVal}%0A`;
    msg += `- Catatan: ${notes || '-'}%0A%0A`;
    
    if (delivery === 'Ya') {
        msg += `*Pengiriman:*%0A`;
        msg += `- Jadwal Pickup: ${schedule}%0A`;
        msg += `- Alamat: ${address}%0A%0A`;
    }
    
    msg += `*Estimasi Biaya:*%0A`;
    msg += `- Total: *${DB.formatCurrency(total)}*%0A%0A`;
    msg += `Mohon segera dikonfirmasi ya kak, terima kasih! 🙏`;

    const waURL = `https://wa.me/${shopPhone}?text=${msg}`;
    
    alert(`Pesanan berhasil dibuat!\nKode Order: ${newOrder.id}\nAnda akan diarahkan ke WhatsApp untuk mengirim pesanan.`);
    
    // Reset Form and UI
    event.target.reset();
    document.querySelectorAll('.selection-card, .treatment-opt').forEach(el => el.classList.remove('active'));
    document.querySelector('.treatment-opt[onclick*="regular"]').classList.add('active'); // Default treatment
    if (window.calculateTotal) window.calculateTotal();
    
    window.location.href = waURL;
};

// Order Tracking Simulation
window.simulateTracking = function() {
    const input = document.getElementById('trackInput').value.trim();
    const msg = document.getElementById('trackingStatusMessage');
    const steps = document.querySelectorAll('.step');

    if (input === '') {
        alert("Silakan masukkan Nomor Order atau Nomor WA!");
        return;
    }

    // Reset Steps
    steps.forEach(step => step.classList.remove('active'));
    msg.style.display = 'block';
    msg.innerText = "Mencari data pesanan...";

    const trackOrder = async () => {
        const code = input.value.trim().toUpperCase();
        if(!code) return;
        
        const orders = await DB.getOrders();
        const found = orders.find(o => o.id === code || o.phone === code);
        
        let currentStep = 1;
        if (found) {
            currentStep = found.status;
        } else {
            // Simulasi jika tidak ketemu
            currentStep = Math.floor(Math.random() * 5) + 1;
        }

        // Aktifkan step
        for (let i = 0; i < currentStep; i++) {
            steps[i].classList.add('active');
        }

        const statusLabels = [
            "Barang telah diterima di Workshop kami.",
            "Barang sedang dalam proses Treatment / Deep Cleaning.",
            "Barang masuk tahap pengeringan sinar UV / angin. (H-2 Selesai)",
            "Tahap Finishing: Pemberian pewangi dan QC akhir. (H-1 Selesai)",
            "Barang SIAP DIAMBIL / dalam perjalanan diantar ke lokasi Anda!"
        ];

        msg.innerText = found 
            ? `Order ${found.id}: ${statusLabels[currentStep - 1]} ✨` 
            : `Data simulasi: ${statusLabels[currentStep - 1]} ✨`;

    }, 800);
};

// Smooth Scrolling for Navbar Links
document.querySelectorAll('.nav-links a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Modal Testimoni Logic
window.openTestimoniModal = function() {
    document.getElementById('testimoniModal').style.display = 'flex';
};

window.closeTestimoniModal = function() {
    document.getElementById('testimoniModal').style.display = 'none';
};

// GPS Distance Calculation
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
            
            // Koordinat Toko: Sukodadi Wagir (Perkiraan: -8.0261, 112.5855)
            const shopLat = -8.0261;
            const shopLon = 112.5855;

            // Haversine formula
            const R = 6371; // Radius bumi dalam km
            const dLat = (userLat - shopLat) * Math.PI / 180;
            const dLon = (userLon - shopLon) * Math.PI / 180; 
            const a = 
                Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(shopLat * Math.PI / 180) * Math.cos(userLat * Math.PI / 180) * 
                Math.sin(dLon/2) * Math.sin(dLon/2); 
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
            let distance = R * c; // Jarak garis lurus dalam km
            
            // Margin error jalan raya (~1.3x jarak lurus)
            distance = distance * 1.3;
            
            // Pembulatan ke atas
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
    approved.forEach(t => {
        container.innerHTML += `
            <div class="glass-panel" style="padding: 2rem; min-width: 300px; scroll-snap-align: start;">
                <div style="color: var(--accent-yellow); margin-bottom: 1rem;">${'★'.repeat(t.rating)}${'☆'.repeat(5-t.rating)}</div>
                <p style="font-style: italic; color: var(--text-muted); margin-bottom: 1.5rem;">"${t.content}"</p>
                <h4 style="color: var(--primary-navy); margin: 0;">${t.name}</h4>
            </div>
        `;
    });
}
