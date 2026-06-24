# 🌐 Panduan Deployment VPS & SSL HTTPS (Nginx + PM2 + Certbot)

Panduan ini menjelaskan langkah-langkah untuk menjalankan aplikasi **Sparkling Cleaners** pada VPS Linux (Ubuntu/Debian) dengan protokol aman **HTTPS (SSL)**. Protokol HTTPS sangat diperlukan agar browser mengizinkan akses ke fitur sensitif seperti **GPS/Geolocation (HTML5 Geolocation)** dan kamera.

---

## 🛠️ Arsitektur Server
* **Node.js (Express)**: Berjalan di latar belakang menggunakan **PM2** pada port `3000`.
* **Nginx**: Bertindak sebagai *Reverse Proxy* yang mendengarkan port `80` (HTTP) dan `443` (HTTPS) lalu mengarahkannya ke port `3000`.
* **Certbot (Let's Encrypt)**: Mengatur instalasi dan pembaruan sertifikat SSL gratis secara otomatis.

---

## 🚀 Langkah-langkah Setup

### Langkah 1: Hubungkan Domain ke VPS (DNS Setup)
Sebelum memulai di VPS, pastikan Anda sudah mengarahkan domain Anda ke IP VPS:
1. Masuk ke penyedia domain Anda (misal: Niagahoster, Domainesia, Cloudflare).
2. Tambahkan **DNS Record** baru:
   * **Type**: `A`
   * **Name**: `@` (atau subdomain Anda, misal: `laundry.domain.com`)
   * **Content / Value**: `IP_VPS_ANDA`
   * **TTL**: Auto / 3600
3. Tambahkan A record untuk `www` jika diperlukan.

---

### Langkah 2: Install Node.js, PM2, & Nginx di VPS
Masuk ke VPS Anda via SSH (`ssh root@ip_vps_anda`), lalu jalankan perintah berikut:

```bash
# Update package list
sudo apt update && sudo apt upgrade -y

# Install Node.js (v18 atau v20 LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Nginx dan Git
sudo apt install -y nginx git

# Install PM2 (Process Manager secara Global)
sudo npm install -y -g pm2
```

---

### Langkah 3: Clone Project & Install Dependensi
Letakkan file proyek Anda di VPS (misalnya di direktori `/var/www/`):

```bash
# Pindah ke direktori web root
cd /var/www

# Clone repository atau upload code Anda ke sini
git clone https://github.com/Theology26/sparklingcleanersmalang.git
cd sparklingcleanersmalang

# Install dependensi frontend & backend
npm install
cd server
npm install
```

> Jangan lupa membuat dan menyesuaikan file `.env` di dalam folder `server/` pada VPS Anda untuk koneksi ke MySQL VPS:
> `nano .env`

---

### Langkah 4: Jalankan Server Node.js dengan PM2
PM2 memastikan server Node.js Anda tetap berjalan secara terus-menerus di background, bahkan setelah Anda logout dari SSH atau jika server VPS melakukan restart.

```bash
# Jalankan server menggunakan PM2 (pastikan berada di dalam folder server/)
pm2 start server.js --name "sparkling-server"

# Mengatur PM2 agar otomatis berjalan saat VPS restart
pm2 startup
# (Salin dan jalankan baris perintah yang dihasilkan oleh output perintah di atas)

# Simpan konfigurasi PM2 saat ini
pm2 save
```

*Perintah PM2 berguna lainnya:*
* `pm2 status` - Melihat daftar aplikasi yang berjalan.
* `pm2 logs sparkling-server` - Melihat log error/output server.
* `pm2 restart sparkling-server` - Restart server Node.js setelah update code.

---

### Langkah 5: Konfigurasi Nginx sebagai Reverse Proxy
Nginx akan memetakan traffic port `80` dan `443` dari domain Anda ke aplikasi Node.js yang berjalan di port `3000`.

1. Buat file konfigurasi Nginx baru:
   ```bash
   sudo nano /etc/nginx/sites-available/sparkling
   ```

2. Tempelkan konfigurasi berikut (ganti `laundry.domain.com` dengan domain Anda):
   ```nginx
   server {
       listen 80;
       server_name laundry.domain.com www.laundry.domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

3. Aktifkan konfigurasi tersebut dengan membuat symlink:
   ```bash
   sudo ln -s /etc/nginx/sites-available/sparkling /etc/nginx/sites-enabled/
   ```

4. Hapus konfigurasi default Nginx (jika ada) untuk menghindari konflik:
   ```bash
   sudo rm /etc/nginx/sites-enabled/default
   ```

5. Uji konfigurasi Nginx dan restart layanan Nginx:
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```

---

### Langkah 6: Pasang Sertifikat SSL Gratis dengan Certbot Let's Encrypt
Certbot akan membaca konfigurasi Nginx Anda, mengunduh sertifikat SSL, dan secara otomatis mengubah konfigurasi Nginx agar mendukung HTTPS.

```bash
# Install Certbot dan plugin Nginx
sudo apt install snapd -y
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot

# Dapatkan sertifikat SSL dan pasang otomatis di Nginx
sudo certbot --nginx -d laundry.domain.com -d www.laundry.domain.com
```

* Saat diminta memasukkan email, isi dengan email aktif Anda (untuk notifikasi kedaluwarsa sertifikat).
* Setujui persyaratan layanan.
* Saat ditanya tentang redirect HTTP ke HTTPS, pilih **Redirect** (biasanya opsi 2 atau otomatis dilakukan oleh Certbot versi terbaru) agar semua traffic HTTP dialihkan ke HTTPS yang aman.

### Langkah 7: Verifikasi Auto-Renewal SSL
Sertifikat Let's Encrypt berlaku selama 90 hari. Certbot secara otomatis memasang cronjob untuk melakukan perpanjangan sertifikat sebelum kedaluwarsa. Anda dapat mengujinya dengan perintah:
```bash
sudo certbot renew --dry-run
```
Jika tidak ada error, perpanjangan otomatis telah berjalan dengan baik.

---

## 🎉 Selesai!
Sekarang Anda dapat membuka domain Anda di browser (`https://laundry.domain.com`). 
Aplikasi Anda akan ditandai dengan ikon gembok aman (Secure HTTPS) dan browser akan mengizinkan akses ke lokasi (GPS) untuk perhitungan ongkir otomatis.
