const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sparkling_cleaners',
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0
  });

  console.log("Menghubungkan ke database...");

  const orders = [];
  const names = ['Andi Wijaya', 'Budi Santoso', 'Cici Lestari', 'Dedi Kurniawan', 'Evi Rahmawati', 'Fani Saputra', 'Gani Hermawan', 'Hadi Wibowo', 'Ira Kartika', 'Joni Pratama'];
  const services = ['Cuci Sepatu Deep Clean', 'Cuci Helm Full Face', 'Special Treatment Leather Bag', 'Fast Clean Sneaker'];
  const itemTypes = ['Sepatu', 'Helm', 'Tas', 'Sepatu'];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    const numOrders = Math.floor(Math.random() * 3) + 1;
    for (let j = 0; j < numOrders; j++) {
      const id = `SPK-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 900) + 100}`;
      const name = names[Math.floor(Math.random() * names.length)];
      const phone = '08123456789' + Math.floor(Math.random() * 10);
      const service = services[Math.floor(Math.random() * services.length)];
      const itemType = itemTypes[services.indexOf(service)];
      const price = (Math.floor(Math.random() * 5) + 3) * 10000; // 30k to 70k
      const ongkir = Math.random() > 0.5 ? 10000 : 0;
      const total = price + ongkir;

      // format datetime for MySQL insert: YYYY-MM-DD HH:MM:SS
      const formattedDate = date.toISOString().slice(0, 19).replace('T', ' ');

      orders.push({
        id,
        name,
        phone,
        total,
        status: 9, // Selesai
        lunas: 1,  // Lunas
        service,
        itemType,
        price,
        ongkir,
        date: formattedDate
      });
    }
  }

  console.log(`Menyisipkan ${orders.length} pesanan simulasi...`);

  for (const o of orders) {
    const sql = `
      INSERT INTO pesanan (
        id, nama_pelanggan, nomor_whatsapp, total_harga, status_proses, status_pembayaran,
        layanan_pilihan, tipe_item, harga_dasar, ongkir, tanggal_dibuat, estimasi_selesai
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    try {
      await pool.query(sql, [
        o.id, o.name, o.phone, o.total, o.status, o.lunas,
        o.service, o.itemType, o.price, o.ongkir, o.date, 'Selesai'
      ]);
      console.log(`Disisipkan: ${o.id} - ${o.name} (${o.date}) - Rp ${o.total}`);
    } catch (e) {
      console.error(`Gagal menyisipkan ${o.id}:`, e);
    }
  }

  await pool.end();
  console.log("Simulasi selesai!");
}

main().catch(console.error);
