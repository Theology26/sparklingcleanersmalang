// beranda.js - Sparkling Cleaners Corporate Profile Logic
// NO transactional logic (cart, checkout, tracking) belongs here.

document.addEventListener('DOMContentLoaded', async () => {
    // Star rating logic
    const stars = document.querySelectorAll('#modalStarRating i');
    const ratingInput = document.getElementById('ratingValue');
    const ratingText = document.getElementById('ratingText');
    const textDesc = ["Sangat Kurang", "Kurang", "Cukup", "Puas", "Sangat Puas"];
    stars.forEach(star => {
        star.addEventListener('click', function() {
            const rating = parseInt(this.getAttribute('data-rating'));
            if (ratingInput) ratingInput.value = rating;
            if (ratingText) { ratingText.innerText = textDesc[rating - 1]; ratingText.style.color = "var(--primary-navy)"; }
            stars.forEach(s => {
                s.classList.toggle('active', parseInt(s.getAttribute('data-rating')) <= rating);
            });
        });
    });

    // Init all sections
    await initHeroSlideshow();
    await renderBranding();
    await renderAboutUs();
    await renderGallery();
    await renderTestimonialsSlider();
    await renderFooterMeta();
});

// =============================================
// 1. HERO SLIDESHOW (100vh)
// =============================================
async function initHeroSlideshow() {
    const container = document.getElementById('heroSlideshow');
    if (!container) return;

    const config = await DB.getSystemConfig();
    let slides = [];
    try {
        if (config.hero_slideshow_images) {
            slides = JSON.parse(config.hero_slideshow_images);
        }
    } catch (e) {
        console.error("Error parsing hero slideshow images:", e);
    }

    if (!slides || !Array.isArray(slides) || slides.length === 0) {
        slides = [
            'https://images.unsplash.com/photo-1595950653106-6c9ebd614c3a?w=1200',
            'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200',
            'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1200'
        ];
    }

    container.innerHTML = slides.map((img, idx) => `
        <div class="hero-slide ${idx === 0 ? 'active' : ''}" style="background-image: url('${img}');"></div>
    `).join('');

    let currentIndex = 0;
    setInterval(() => {
        const els = container.querySelectorAll('.hero-slide');
        if (els.length <= 1) return;
        els[currentIndex].classList.remove('active');
        currentIndex = (currentIndex + 1) % els.length;
        els[currentIndex].classList.add('active');
    }, 2000);
}

// =============================================
// 2. TRUE LINEAR SCROLL FADE
// =============================================
window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const vh = window.innerHeight;
    const opacity = Math.max(0, 1 - scrollY / vh);

    const slideshow = document.getElementById('heroSlideshow');
    const overlay = document.getElementById('heroOverlay');
    const content = document.querySelector('.hero-content-center');

    if (slideshow) slideshow.style.opacity = opacity;
    if (overlay) overlay.style.opacity = opacity;
    if (content) content.style.opacity = opacity;
});

// =============================================
// 3. BRANDING (Hero Text from Config & About Us)
// =============================================
async function renderBranding() {
    const sysCfg = await DB.getSystemConfig();
    if (sysCfg) {
        const t = document.getElementById('heroTitle');
        const s = document.getElementById('heroSubtitle');
        if (t && sysCfg.hero_welcome_title) t.innerText = sysCfg.hero_welcome_title;
        if (s && sysCfg.hero_welcome_subtitle) s.innerText = sysCfg.hero_welcome_subtitle;
        if (sysCfg.hero_font_color) {
            const color = sysCfg.hero_font_color;
            if (t) t.style.color = color;
        }
    }
}

// =============================================
// 4. ABOUT US (from tabel_about)
// =============================================
async function renderAboutUs() {
    const container = document.getElementById('aboutContainer');
    if (!container) return;

    const rows = await DB.getAbout();
    if (!rows || rows.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding:2rem;">Konten Tentang Kami belum diatur.</p>';
        return;
    }

    const sysCfg = await DB.getSystemConfig();
    const aboutImgUrl = sysCfg.about_image || 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600';

    const aboutData = {};
    rows.forEach(r => aboutData[r.key_posisi] = r.konten);

    const missionItems = (aboutData.mission || '').split(/[0-9]+\./).filter(m => m.trim() !== '');

    container.innerHTML = `
        <div style="max-width: 900px; margin: 0 auto; text-align: center; width:100%;">
            <h3 style="color:var(--primary-navy); font-size:2rem; margin-bottom:0.5rem; font-weight:800;">${aboutData.title || ''}</h3>
            <p style="color:var(--text-muted); font-size:1.1rem; margin-bottom:2rem; max-width:600px; margin-inline:auto;">${aboutData.subtitle || ''}</p>
            
            <div class="glass-panel" style="padding: 1.5rem; background:rgba(241, 196, 15, 0.1); border-radius:12px; margin-bottom:3rem; border-left:4px solid var(--accent-yellow);">
                <strong style="color:var(--primary-navy);">Motto:</strong> <span style="font-style:italic; color:var(--text-main); font-size:1.1rem;">"${aboutData.motto || ''}"</span>
            </div>
            
            <div style="display:flex; flex-wrap:wrap; gap:3rem; align-items:center; justify-content:center; text-align:left; margin-bottom:3rem;">
                <div style="flex:1; min-width:300px; max-width:400px; position:relative;">
                    <div style="position:absolute; inset: -10px; background: linear-gradient(45deg, var(--primary-sky), transparent); border-radius:20px; z-index:-1; opacity:0.5;"></div>
                    <img src="${aboutImgUrl}" alt="Workshop" class="about-img" onclick="this.classList.toggle('active')">
                </div>
                <div style="flex:1; min-width:300px;">
                    <h4 style="color:var(--primary-navy); margin-bottom:1rem; font-size:1.3rem; display:flex; align-items:center; gap:12px;">
                        <span style="display:inline-flex; align-items:center; justify-content:center; width:36px; height:36px; border-radius:10px; background:rgba(52, 152, 219, 0.15); color:var(--primary-sky); border:1px solid rgba(52, 152, 219, 0.3); box-shadow:0 4px 10px rgba(52, 152, 219, 0.15);">
                            <i class="fa-solid fa-gem" style="font-size: 1.1rem;"></i>
                        </span>
                        Makna Sparkling Cleaners
                    </h4>
                    <p style="line-height:1.7; color:var(--text-main); margin-bottom:2rem;">${aboutData.semantics || ''}</p>
                    <h4 style="color:var(--primary-navy); margin-bottom:1rem; font-size:1.3rem; display:flex; align-items:center; gap:12px;">
                        <span style="display:inline-flex; align-items:center; justify-content:center; width:36px; height:36px; border-radius:10px; background:rgba(52, 152, 219, 0.15); color:var(--primary-sky); border:1px solid rgba(52, 152, 219, 0.3); box-shadow:0 4px 10px rgba(52, 152, 219, 0.15);">
                            <i class="fa-solid fa-eye" style="font-size: 1.1rem;"></i>
                        </span>
                        Visi Kami
                    </h4>
                    <p style="line-height:1.7; color:var(--text-main);">${aboutData.vision || ''}</p>
                </div>
            </div>
            
            <div class="glass-panel" style="text-align:left; padding:2.5rem; border-radius:16px; box-shadow:0 8px 30px rgba(0,0,0,0.05);">
                <h4 style="color:var(--primary-navy); margin-bottom:1.5rem; text-align:center; font-size:1.4rem; display:flex; align-items:center; justify-content:center; gap:12px;">
                    <span style="display:inline-flex; align-items:center; justify-content:center; width:40px; height:40px; border-radius:12px; background:rgba(241, 196, 15, 0.15); color:var(--accent-yellow); border:1px solid rgba(241, 196, 15, 0.3); box-shadow:0 4px 10px rgba(241, 196, 15, 0.2);">
                        <i class="fa-solid fa-rocket" style="font-size: 1.25rem;"></i>
                    </span>
                    Misi Utama
                </h4>
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:1.5rem; color:var(--text-main);">
                    ${missionItems.map(m => `
                        <div style="display:flex; gap:12px; align-items:flex-start;">
                            <div style="width:24px; height:24px; border-radius:50%; background:var(--accent-yellow); color:white; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:2px;">
                                <i class="fa-solid fa-check" style="font-size:0.8rem;"></i>
                            </div>
                            <span style="line-height:1.6;">${m.trim()}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

// =============================================
// 5. INSTAGRAM GALLERY (from tabel_galeri)
// =============================================
async function renderGallery() {
    const container = document.getElementById('galleryContainer');
    if (!container) return;

    const items = await DB.getGaleri();
    if (!items || items.length === 0) {
        container.innerHTML = '<p style="grid-column:1/-1; text-align:center; color:var(--text-muted); padding:2rem;">Galeri belum diatur.</p>';
        return;
    }

    container.innerHTML = items.map(g => {
        const hasLink = g.link_instagram && g.link_instagram.trim() !== '';
        const onclick = hasLink
            ? `window.open('${g.link_instagram}', '_blank')`
            : `document.getElementById('galleryPreviewImg').src='${g.path_gambar}'; document.getElementById('galleryPreviewModal').style.display='flex';`;

        return `
            <div class="gallery-item" onclick="${onclick}">
                <img src="${g.path_gambar}" alt="Gallery" loading="lazy">
                <div class="gallery-overlay">
                    <i class="fa-brands fa-instagram" style="font-size:1.5rem;"></i>
                    ${hasLink ? '<span>Buka di Instagram</span>' : '<span>Lihat Foto</span>'}
                </div>
            </div>
        `;
    }).join('');
}

// =============================================
// 6. TESTIMONIALS SLIDER (Single Card Fade)
// =============================================
let testimonialIndex = 0;
let testimonialData = [];

async function renderTestimonialsSlider() {
    const slider = document.getElementById('testimonialSlider');
    if (!slider) return;

    const raw = await DB.getTestimonials();
    testimonialData = (raw || []).filter(t => t.status === 'Approved');

    if (testimonialData.length === 0) {
        slider.innerHTML = '<div class="testimonial-card glass-card" style="padding:2rem; text-align:center; color:var(--text-muted);">Belum ada ulasan yang ditampilkan.</div>';
        return;
    }

    testimonialIndex = 0;
    renderSingleTestimonial(slider);

    if (testimonialData.length > 1) {
        setInterval(() => {
            testimonialIndex = (testimonialIndex + 1) % testimonialData.length;
            const card = slider.querySelector('.testimonial-card');
            if (card) {
                card.classList.add('fade-out');
                setTimeout(() => renderSingleTestimonial(slider), 400);
            }
        }, 5000);
    }
}

function renderSingleTestimonial(slider) {
    const t = testimonialData[testimonialIndex];
    const starsHtml = Array(t.rating).fill('<i class="fa-solid fa-star"></i>').join('') + Array(5 - t.rating).fill('<i class="fa-regular fa-star"></i>').join('');

    let imagesHtml = '';
    if (t.image) {
        const urls = t.image.split(',');
        imagesHtml = `<div style="display:flex; gap:8px; margin-top:12px; flex-wrap:wrap;">${urls.map(u => `<img src="${u.trim()}" style="width:70px; height:70px; object-fit:cover; border-radius:10px; cursor:pointer;" onclick="window.open('${u.trim()}', '_blank')">`).join('')}</div>`;
    }

    slider.innerHTML = `
        <div class="testimonial-card glass-card fade-in">
            <div style="display:flex; align-items:center; gap:14px; margin-bottom:1rem;">
                <div style="width:50px; height:50px; border-radius:50%; background:rgba(52,152,219,0.15); display:flex; align-items:center; justify-content:center; color:var(--primary-sky); font-size:1.2rem;">
                    <i class="fa-solid fa-user"></i>
                </div>
                <div>
                    <h4 style="margin:0; font-size:1.05rem; color:var(--primary-navy);">${t.name}</h4>
                    <div style="color:var(--accent-yellow); font-size:0.9rem;">${starsHtml}</div>
                </div>
            </div>
            <p style="font-size:1rem; font-style:italic; color:var(--text-main); line-height:1.7; margin:0;">&ldquo;${t.content}&rdquo;</p>
            ${imagesHtml}
        </div>
    `;
}

// Premium Color Series removed from home page. See layanan.js.

// =============================================
// 8. FOOTER METADATA (Dynamic)
// =============================================
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
// 9. TESTIMONIAL MODAL HANDLERS
// =============================================
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
            const formData = new FormData();
            files.forEach(file => formData.append('image', file));
            const uploadResp = await fetch('http://localhost:3000/api/upload', { method: 'POST', body: formData });
            const uploadResult = await uploadResp.json();
            if (uploadResult.success) {
                imageUrl = uploadResult.urls.join(',');
            }
        }

        const res = await DB.addTestimonial({ name, rating, content, image: imageUrl });
        if (res && res.success) {
            alert('Terima kasih! ✅ Ulasan Anda berhasil dikirim dan akan ditinjau oleh tim kami.');
            document.getElementById('testimoniForm').reset();
            document.querySelectorAll('#modalStarRating i').forEach(s => s.classList.remove('active'));
            document.getElementById('ratingValue').value = '';
            const rt = document.getElementById('ratingText');
            if (rt) rt.innerText = 'Klik untuk menilai';
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
