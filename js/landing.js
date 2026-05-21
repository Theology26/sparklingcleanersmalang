// landing.js

// Generate QR Code
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

    // Dynamic Content Rendering
    await renderBranding();
    await renderPricing();
    await renderArticles();
    await renderTestimonials();
});

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

    // 1. Regular Wash
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
        if (p.regular.bag_leather) {
            if (document.getElementById('tbl-reg-bag_leather-est')) document.getElementById('tbl-reg-bag_leather-est').innerText = p.regular.bag_leather.est || '';
            if (document.getElementById('tbl-reg-bag_leather-Small')) document.getElementById('tbl-reg-bag_leather-Small').innerText = kFormat(p.regular.bag_leather.Small);
            if (document.getElementById('tbl-reg-bag_leather-Medium')) document.getElementById('tbl-reg-bag_leather-Medium').innerText = kFormat(p.regular.bag_leather.Medium);
            if (document.getElementById('tbl-reg-bag_leather-Large')) document.getElementById('tbl-reg-bag_leather-Large').innerText = kFormat(p.regular.bag_leather.Large);
        }
        if (p.regular.bag_fabric) {
            if (document.getElementById('tbl-reg-bag_fabric-est')) document.getElementById('tbl-reg-bag_fabric-est').innerText = p.regular.bag_fabric.est || '';
            if (document.getElementById('tbl-reg-bag_fabric-Small')) document.getElementById('tbl-reg-bag_fabric-Small').innerText = kFormat(p.regular.bag_fabric.Small);
            if (document.getElementById('tbl-reg-bag_fabric-Medium')) document.getElementById('tbl-reg-bag_fabric-Medium').innerText = kFormat(p.regular.bag_fabric.Medium);
            if (document.getElementById('tbl-reg-bag_fabric-Large')) document.getElementById('tbl-reg-bag_fabric-Large').innerText = kFormat(p.regular.bag_fabric.Large);
        }
    }

    // 2. Special Treatment
    if (p.special) {
        if (p.special.boots) {
            if (document.getElementById('tbl-spec-boots-est')) document.getElementById('tbl-spec-boots-est').innerText = p.special.boots.est || '';
            if (document.getElementById('tbl-spec-boots-price')) {
                document.getElementById('tbl-spec-boots-price').innerText = `S: ${kFormat(p.special.boots.Small)} | M: ${kFormat(p.special.boots.Medium)} | L: ${kFormat(p.special.boots.Large)}`;
            }
        }
        if (p.special.suede) {
            if (document.getElementById('tbl-spec-suede-est')) document.getElementById('tbl-spec-suede-est').innerText = p.special.suede.est || '';
            if (document.getElementById('tbl-spec-suede-price')) {
                document.getElementById('tbl-spec-suede-price').innerText = `S: ${kFormat(p.special.suede.Small)} | M: ${kFormat(p.special.suede.Medium)} | L: ${kFormat(p.special.suede.Large)}`;
            }
        }
        if (p.special.dress_shoes) {
            if (document.getElementById('tbl-spec-dress_shoes-est')) document.getElementById('tbl-spec-dress_shoes-est').innerText = p.special.dress_shoes.est || '';
            if (document.getElementById('tbl-spec-dress_shoes-price')) {
                document.getElementById('tbl-spec-dress_shoes-price').innerText = `S: ${kFormat(p.special.dress_shoes.Small)} | M: ${kFormat(p.special.dress_shoes.Medium)} | L: ${kFormat(p.special.dress_shoes.Large)}`;
            }
        }
        if (p.special.repaint_p) {
            if (document.getElementById('tbl-spec-repaint_p-est')) document.getElementById('tbl-spec-repaint_p-est').innerText = p.special.repaint_p.est || '';
            if (document.getElementById('tbl-spec-repaint_p-price')) {
                document.getElementById('tbl-spec-repaint_p-price').innerText = `Upper ${kFormat(p.special.repaint_p.Upper)} | Midsole ${kFormat(p.special.repaint_p.Midsole)} | Outsole ${kFormat(p.special.repaint_p.Outsole)} | Insole ${kFormat(p.special.repaint_p.Insole)}`;
            }
        }
        if (p.special.repaint_s) {
            if (document.getElementById('tbl-spec-repaint_s-est')) document.getElementById('tbl-spec-repaint_s-est').innerText = p.special.repaint_s.est || '';
            if (document.getElementById('tbl-spec-repaint_s-price')) {
                document.getElementById('tbl-spec-repaint_s-price').innerText = `Upper ${kFormat(p.special.repaint_s.Upper)} | Midsole ${kFormat(p.special.repaint_s.Midsole)} | Outsole ${kFormat(p.special.repaint_s.Outsole)} | Insole ${kFormat(p.special.repaint_s.Insole)}`;
            }
        }
        if (p.special.repaint_suede) {
            if (document.getElementById('tbl-spec-repaint_suede-est')) document.getElementById('tbl-spec-repaint_suede-est').innerText = p.special.repaint_suede.est || '';
            if (document.getElementById('tbl-spec-repaint_suede-price')) {
                document.getElementById('tbl-spec-repaint_suede-price').innerText = `Upper ${kFormat(p.special.repaint_suede.Upper)} | Midsole ${kFormat(p.special.repaint_suede.Midsole)} | Outsole ${kFormat(p.special.repaint_suede.Outsole)} | Insole ${kFormat(p.special.repaint_suede.Insole)}`;
            }
        }
        if (p.special.extra) {
            if (document.getElementById('tbl-spec-extra-est')) document.getElementById('tbl-spec-extra-est').innerText = p.special.extra.est || '10 Hari';
            if (document.getElementById('tbl-spec-extra-price')) {
                document.getElementById('tbl-spec-extra-price').innerText = 'Mulai 5K - 25K';
            }
            if (document.getElementById('tbl-spec-extra-desc')) {
                document.getElementById('tbl-spec-extra-desc').innerText = `Liquid Remover (+${kFormat(p.special.extra["Liquid Remover Sepatu"] || 15000).toString().toLowerCase()} Sepatu / +${kFormat(p.special.extra["Liquid Remover Tas"] || 5000).toString().toLowerCase()} Tas) | Unyellowing (+${kFormat(p.special.extra["Unyellowing"] || 20000).toString().toLowerCase()}) | Canvas Cleaner & Whitener (+${kFormat(p.special.extra["Canvas Cleaner"] || 20000).toString().toLowerCase()}) | Leather Filler (+${kFormat(p.special.extra["Leather Filler"] || 25000).toString().toLowerCase()})`;
            }
        }
    }

    // 3. Express Service Add-on
    if (p.express && document.getElementById('tbl-exp-service-desc')) {
        document.getElementById('tbl-exp-service-desc').innerText = `8 Jam (+${kFormat(p.express["8 Jam"] || 20000)}) | 18 Jam (+${kFormat(p.express["18 Jam"] || 15000)}) | 24 Jam (+${kFormat(p.express["24 Jam"] || 10000)})`;
    }

    // 4. Dynamic Service Cards (Mulai Dari & Estimasi)
    // - Cuci Sepatu
    if (p.regular?.shoes) {
        const shoesPrices = [
            p.regular.shoes.Small,
            p.regular.shoes.Medium,
            p.regular.shoes.Large
        ].filter(v => v !== undefined && v !== null && typeof v === 'number');
        if (shoesPrices.length > 0 && document.getElementById('card-price-shoes')) {
            document.getElementById('card-price-shoes').innerText = `Mulai ${DB.formatCurrency(Math.min(...shoesPrices))}`;
        }
        if (document.getElementById('card-time-shoes')) {
            document.getElementById('card-time-shoes').innerText = `Estimasi: ${p.regular.shoes.est || '2-3 Hari'}`;
        }
    }

    // - Repaint Sepatu
    if (p.special) {
        const repaintPrices = [
            p.special.repaint_p?.Upper,
            p.special.repaint_s?.Upper,
            p.special.repaint_suede?.Upper
        ].filter(v => v !== undefined && v !== null && typeof v === 'number');
        if (repaintPrices.length > 0 && document.getElementById('card-price-repaint')) {
            document.getElementById('card-price-repaint').innerText = `Mulai ${DB.formatCurrency(Math.min(...repaintPrices))}`;
        }
        if (document.getElementById('card-time-repaint')) {
            const repaintEst = p.special.repaint_p?.est || p.special.repaint_s?.est || p.special.repaint_suede?.est;
            document.getElementById('card-time-repaint').innerText = `Estimasi: ${repaintEst || '5-7 Hari'}`;
        }
    }

    // - Unyellowing
    if (p.special?.extra) {
        const unyellowingVal = p.special.extra["Unyellowing"];
        if (unyellowingVal !== undefined && unyellowingVal !== null && document.getElementById('card-price-unyellowing')) {
            document.getElementById('card-price-unyellowing').innerText = `Mulai ${DB.formatCurrency(unyellowingVal)}`;
        }
        if (document.getElementById('card-time-unyellowing')) {
            document.getElementById('card-time-unyellowing').innerText = `Estimasi: ${p.special.extra.est || '3-4 Hari'}`;
        }
    }

    // - Cuci Tas
    if (p.regular) {
        const bagPrices = [
            p.regular.bag_leather?.Small,
            p.regular.bag_leather?.Medium,
            p.regular.bag_leather?.Large,
            p.regular.bag_fabric?.Small,
            p.regular.bag_fabric?.Medium,
            p.regular.bag_fabric?.Large
        ].filter(v => v !== undefined && v !== null && typeof v === 'number');
        if (bagPrices.length > 0 && document.getElementById('card-price-bag')) {
            document.getElementById('card-price-bag').innerText = `Mulai ${DB.formatCurrency(Math.min(...bagPrices))}`;
        }
        if (document.getElementById('card-time-bag')) {
            const bagEst = p.regular.bag_fabric?.est || p.regular.bag_leather?.est || '3-5 Hari';
            document.getElementById('card-time-bag').innerText = `Estimasi: ${bagEst}`;
        }
    }

    // - Cuci Helm
    if (p.regular?.helmet) {
        const helmetPrices = [
            p.regular.helmet["Half Face"],
            p.regular.helmet["Full Face"]
        ].filter(v => v !== undefined && v !== null && typeof v === 'number');
        if (helmetPrices.length > 0 && document.getElementById('card-price-helmet')) {
            document.getElementById('card-price-helmet').innerText = `Mulai ${DB.formatCurrency(Math.min(...helmetPrices))}`;
        }
        if (document.getElementById('card-time-helmet')) {
            document.getElementById('card-time-helmet').innerText = `Estimasi: ${p.regular.helmet.est || '1-2 Hari'}`;
        }
    }
}

const ARTICLE_FALLBACKS = [
    { id:'ART-F1', title:'Cara Jitu Menghilangkan Noda Kuning di Sepatu Minimalis Putih', category:'Perawatan Sepatu', image:'https://images.unsplash.com/photo-1595950653106-6c9ebd614c3a?w=500', desc:'Noda menguning sering terjadi pada sol akibat oksidasi suhu. Inilah rahasianya...', status:'Publik' },
    { id:'ART-F2', title:'Perhatikan 3 Hal Ini Sebelum Mencuci Tas Kulit Asli Anda!', category:'Perawatan Tas', image:'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500', desc:'Mencuci tas kulit butuh perlakuan khusus agar permukaannya tidak retak (crack).', status:'Publik' },
    { id:'ART-F3', title:'Bahaya Bakteri Keringat Berlebih Pada Busa Helm Kesayangan', category:'Perawatan Helm', image:'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=500', desc:'Busa helm basah adalah sarang bagi ribuan bakteri yang sering memicu gatal rambut.', status:'Publik' }
];

let allPublicArticles = [];
let articlesShown = 0;
const ARTICLES_PER_PAGE = 3;

function buildArticleCard(a) {
    const desc = a.description || a.desc || '';
    return `
        <div class="glass-card" style="overflow: hidden; text-align: left;">
            <div style="height: 200px; background: url('${a.image}') center/cover;"></div>
            <div style="padding: 1.5rem;">
                <span style="font-size: 0.8rem; font-weight: 600; color: var(--primary-sky);">${DB.sanitize ? DB.sanitize(a.category) : a.category}</span>
                <h3 style="margin: 0.5rem 0; font-size: 1.1rem; line-height:1.4;">${DB.sanitize ? DB.sanitize(a.title) : a.title}</h3>
                <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1rem;">${DB.sanitize ? DB.sanitize(desc) : desc}</p>
                <a href="${a.content && a.content.startsWith('http') ? a.content : '#'}" ${a.content && a.content.startsWith('http') ? 'target="_blank"' : ''}
                   style="color: var(--primary-navy); font-weight: 600; text-decoration: none; font-size: 0.9rem;">
                   Baca Selengkapnya <i class="fa-solid fa-arrow-right" style="margin-left: 5px;"></i>
                </a>
            </div>
        </div>
    `;
}

async function renderArticles() {
    const rawArticles = await DB.getArticles();
    // Pastikan selalu array — DB bisa kembalikan null, object error, atau array
    const articlesFromDB = Array.isArray(rawArticles) ? rawArticles : [];
    allPublicArticles = (articlesFromDB.length > 0 ? articlesFromDB : ARTICLE_FALLBACKS).filter(a => a.status === 'Publik');
    const container = document.getElementById('articles-container');
    if (!container) return;
    articlesShown = 0;
    container.innerHTML = '';
    if (allPublicArticles.length === 0) {
        container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:2rem; color:var(--text-muted);">Belum ada artikel yang dipublikasikan.</div>`;
        return;
    }
    _showNextArticles(container);
}

function _showNextArticles(container) {
    const next = allPublicArticles.slice(articlesShown, articlesShown + ARTICLES_PER_PAGE);
    next.forEach(a => { container.innerHTML += buildArticleCard(a); });
    articlesShown += next.length;
    const btn = document.getElementById('loadMoreBtn');
    if (btn) btn.style.display = articlesShown < allPublicArticles.length ? 'inline-block' : 'none';
}

window.loadMoreArticles = function() {
    const container = document.getElementById('articles-container');
    if (container) _showNextArticles(container);
};

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
    
    if (!type || !window.PRICING) return;
    const p = window.PRICING;

    let options = {};
    if (treatment === 'regular') {
        if (type === 'Sepatu' && p.regular.shoes) {
            options = {
                "Small": p.regular.shoes.Small,
                "Medium": p.regular.shoes.Medium,
                "Large": p.regular.shoes.Large
            };
        }
        if (type === 'Tas' && p.regular.bag_leather && p.regular.bag_fabric) {
            options = {
                "Leather Small": p.regular.bag_leather.Small,
                "Leather Medium": p.regular.bag_leather.Medium,
                "Leather Large": p.regular.bag_leather.Large,
                "Fabric Small": p.regular.bag_fabric.Small,
                "Fabric Medium": p.regular.bag_fabric.Medium,
                "Fabric Large": p.regular.bag_fabric.Large
            };
        }
        if (type === 'Helm' && p.regular.helmet) {
            options = {
                "Half Face": p.regular.helmet["Half Face"],
                "Full Face": p.regular.helmet["Full Face"]
            };
        }
    } else {
        // Special Treatment
        if (type === 'Sepatu' && p.special) {
            options = {};
            if (p.special.boots) {
                options["Boots Small"] = p.special.boots.Small;
                options["Boots Medium"] = p.special.boots.Medium;
                options["Boots Large"] = p.special.boots.Large;
            }
            if (p.special.suede) {
                options["Suede Small"] = p.special.suede.Small;
                options["Suede Medium"] = p.special.suede.Medium;
                options["Suede Large"] = p.special.suede.Large;
            }
            if (p.special.dress_shoes) {
                options["Dress Shoes Small"] = p.special.dress_shoes.Small;
                options["Dress Shoes Medium"] = p.special.dress_shoes.Medium;
                options["Dress Shoes Large"] = p.special.dress_shoes.Large;
            }
            if (p.special.repaint_p) {
                options["Repaint P Upper"] = p.special.repaint_p.Upper;
                options["Repaint P Midsole"] = p.special.repaint_p.Midsole;
                options["Repaint P Outsole"] = p.special.repaint_p.Outsole;
                options["Repaint P Insole"] = p.special.repaint_p.Insole;
            }
            if (p.special.repaint_s) {
                options["Repaint S Upper"] = p.special.repaint_s.Upper;
                options["Repaint S Midsole"] = p.special.repaint_s.Midsole;
                options["Repaint S Outsole"] = p.special.repaint_s.Outsole;
                options["Repaint S Insole"] = p.special.repaint_s.Insole;
            }
            if (p.special.repaint_suede) {
                options["Repaint Suede Upper"] = p.special.repaint_suede.Upper;
                options["Repaint Suede Midsole"] = p.special.repaint_suede.Midsole;
                options["Repaint Suede Outsole"] = p.special.repaint_suede.Outsole;
                options["Repaint Suede Insole"] = p.special.repaint_suede.Insole;
            }
            if (p.special.extra) {
                options["Liquid Remover"] = p.special.extra["Liquid Remover Sepatu"] || 15000;
                options["Unyellowing"] = p.special.extra["Unyellowing"] || 20000;
                options["Canvas Cleaner & Whitener"] = p.special.extra["Canvas Cleaner"] || 20000;
                options["Leather Filler"] = p.special.extra["Leather Filler"] || 25000;
            }
        }
        if (type === 'Tas' && p.special && p.special.extra) {
            options = { "Liquid Remover Small Fabric": p.special.extra["Liquid Remover Tas"] || 5000 };
        }
        if (type === 'Helm') {
            options = { "Belum ada layanan special": 0 };
        }
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
    
    alert(`Pesanan berhasil dibuat!\nKode Order: ${orderData.id}\nAnda akan diarahkan ke WhatsApp untuk mengirim pesanan.`);
    
    // Reset Form and UI
    event.target.reset();
    document.querySelectorAll('.selection-card, .treatment-opt').forEach(el => el.classList.remove('active'));
    document.querySelector('.treatment-opt[onclick*="regular"]').classList.add('active'); // Default treatment
    if (window.calculateTotal) window.calculateTotal();
    
    window.location.href = waURL;
};

// Order Tracking Simulation
window.simulateTracking = function() {
    const inputEl = document.getElementById('trackInput');
    const input = inputEl ? inputEl.value.trim() : '';
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

    setTimeout(async () => {
        const code = input.toUpperCase();
<<<<<<< HEAD
=======
        if(!code) return;
>>>>>>> origin/update-fitur-kategori
        
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
            if (steps[i]) steps[i].classList.add('active');
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

// Fungsi masking nama anonim: "Budi Santoso" → "B***o"
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
        // Upload foto terlebih dahulu jika ada
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

            if (btn) btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengupload foto...';
            const formData = new FormData();
            files.forEach(file => formData.append('image', file));
            
            const uploadResp = await fetch('http://localhost:3000/api/upload', { method: 'POST', body: formData });
            const uploadResult = await uploadResp.json();
            if (uploadResult.success) {
                imageUrl = uploadResult.urls.join(',');
            } else {
                throw new Error(uploadResult.error || 'Gagal mengupload foto.');
            }
            if (btn) btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan ulasan...';
        }

        const res = await DB.addTestimonial({ name, rating, content, image: imageUrl });
        if (res && res.success) {
            alert('Terima kasih! ✅ Ulasan Anda berhasil dikirim dan akan ditinjau oleh tim kami sebelum ditampilkan.');
            document.getElementById('testimoniForm').reset();
            // Reset stars UI
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
