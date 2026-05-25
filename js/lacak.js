// lacak.js - Standalone Order Tracking System
// Driven by system_config metadata and order database queries.

document.addEventListener('DOMContentLoaded', async () => {
    await renderFooterMeta();
});

// =============================================
// 1. FOOTER METADATA (Dynamic & Unified)
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
// 2. ORDER TRACKING LOGIC
// =============================================
window.trackOrder = async function(event) {
    if (event) event.preventDefault();
    
    const inputEl = document.getElementById('trackInput');
    const query = inputEl ? inputEl.value.trim().toUpperCase() : '';
    const btn = document.getElementById('btnTrack');
    const resultSec = document.getElementById('trackingResultSection');

    if (!query) {
        alert("Silakan masukkan Kode Order atau Nomor WhatsApp Anda.");
        return;
    }

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    }

    try {
        const orders = await DB.getOrders();
        
        // Match by exact order ID or phone number (stripping country code prefixes if needed, but simple match first)
        const found = orders.find(o => {
            const orderId = (o.id || '').toUpperCase();
            const phone = (o.phone || '').replace(/[^0-9]/g, '');
            const cleanQuery = query.replace(/[^0-9A-Z]/g, '');
            return orderId === query || phone.endsWith(cleanQuery) || cleanQuery.endsWith(phone) || phone === cleanQuery;
        });

        if (!found) {
            alert("Pesanan tidak ditemukan. Periksa kembali Kode Order atau Nomor WhatsApp Anda.");
            if (resultSec) resultSec.style.display = 'none';
            return;
        }

        // Populate Order Metadata
        document.getElementById('resOrderId').innerText = found.id;
        document.getElementById('resCustName').innerText = found.name;
        
        // Service type badge
        const serviceTypeBadge = document.getElementById('resServiceType');
        if (serviceTypeBadge) {
            serviceTypeBadge.innerText = found.qty + ' Item (' + found.treatment + ')';
        }

        // Payment status badge
        const payStatus = document.getElementById('resPaymentStatus');
        if (payStatus) {
            const isLunas = found.lunas === 1 || found.lunas === true;
            payStatus.innerText = isLunas ? 'Lunas' : 'Belum Lunas';
            payStatus.className = 'status-badge ' + (isLunas ? 'status-siap' : 'status-kering');
        }

        // Extra details
        document.getElementById('resServicesList').innerText = found.service || '-';
        document.getElementById('resOrderDate').innerText = DB.formatDate(found.date);
        document.getElementById('resDelivery').innerText = found.delivery === 'Ya' ? 'Antar-Jemput' : 'Drop-off';
        document.getElementById('resTotal').innerText = DB.formatCurrency(found.total);

        // Update Stepper Highlight
        const statusVal = parseInt(found.status) || 1;
        
        for (let step = 1; step <= 9; step++) {
            const stepEl = document.getElementById(`step-${step}`);
            if (stepEl) {
                stepEl.classList.remove('active', 'current');
                if (step < statusVal) {
                    stepEl.classList.add('active');
                } else if (step === statusVal) {
                    stepEl.classList.add('active', 'current');
                }
            }
        }

        // Display results
        if (resultSec) {
            resultSec.style.display = 'block';
            resultSec.scrollIntoView({ behavior: 'smooth' });
        }

    } catch (err) {
        console.error("Error tracking order:", err);
        alert("Gagal melacak pesanan. Terjadi masalah koneksi.");
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i> Cari';
        }
    }
};
