const express = require('express');
const router = express.Router();
const db = require('../config/db');

// TAMBAH BARANG
router.post('/', async (req, res) => {

    try {
        const { nama_barang, harga_awal, deskripsi, id_user, gambar, durasi_jam, tanggal_mulai, kategori, harga_beli_langsung } = req.body;
        const durasi = parseInt(durasi_jam) || 24;

        let queryInsert, queryParams;

        if (tanggal_mulai) {
            queryInsert = "INSERT INTO tbl_barang (nama_barang, harga_awal, deskripsi, id_user, status, gambar, kategori, harga_beli_langsung, tanggal_mulai, tanggal_selesai, status_lelang) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9::timestamp + INTERVAL '1 hour' * $10, 'berjalan') RETURNING *";
            queryParams = [nama_barang, harga_awal, deskripsi, id_user, 'approved', gambar || '', kategori || 'Lainnya', harga_beli_langsung || null, tanggal_mulai, durasi];
        } else {
            queryInsert = "INSERT INTO tbl_barang (nama_barang, harga_awal, deskripsi, id_user, status, gambar, kategori, harga_beli_langsung, tanggal_mulai, tanggal_selesai, status_lelang) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW() + INTERVAL '1 hour' * $9, 'berjalan') RETURNING *";
            queryParams = [nama_barang, harga_awal, deskripsi, id_user, 'approved', gambar || '', kategori || 'Lainnya', harga_beli_langsung || null, durasi];
        }

        const result = await db.query(queryInsert, queryParams);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// LIHAT SEMUA BARANG (Tampilan Publik) - mendukung ?search=keyword
router.get('/', async (req, res) => {
    try {
        const search = req.query.search;
        let queryStr;
        let queryParams = [];

        if (search) {
            queryStr = `
                SELECT b.*, 
                       COALESCE((SELECT MAX(harga_penawaran) FROM tbl_lelang l WHERE l.id_barang = b.id_barang), b.harga_awal) as harga_tertinggi
                FROM tbl_barang b 
                WHERE b.status = 'approved'
                  AND (b.nama_barang ILIKE $1 OR b.deskripsi ILIKE $1 OR b.kategori ILIKE $1)
            `;
            queryParams = ['%' + search + '%'];
        } else {
            queryStr = `
                SELECT b.*, 
                       COALESCE((SELECT MAX(harga_penawaran) FROM tbl_lelang l WHERE l.id_barang = b.id_barang), b.harga_awal) as harga_tertinggi
                FROM tbl_barang b 
                WHERE b.status = 'approved'
            `;
        }

        const result = await db.query(queryStr, queryParams);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET BARANG DETAIL
router.get('/:id', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT b.*, 
                   COALESCE((SELECT MAX(harga_penawaran) FROM tbl_lelang l WHERE l.id_barang = b.id_barang), b.harga_awal) as harga_tertinggi
            FROM tbl_barang b 
            WHERE b.id_barang = $1
        `, [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET BARANG BY USER
router.get('/user/:id_user', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT b.*, 
                   COALESCE((SELECT MAX(harga_penawaran) FROM tbl_lelang l WHERE l.id_barang = b.id_barang), b.harga_awal) as harga_tertinggi
            FROM tbl_barang b 
            WHERE b.id_user = $1
            ORDER BY b.id_barang DESC
        `, [req.params.id_user]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE BARANG
router.put('/:id', async (req, res) => {
    try {
        const { nama_barang, harga_awal, deskripsi, id_user, gambar, kategori, harga_beli_langsung } = req.body;
        
        // Cek kepemilikan barang
        const check = await db.query("SELECT * FROM tbl_barang WHERE id_barang = $1", [req.params.id]);
        if (check.rows.length === 0) return res.status(404).json({ error: "Barang tidak ditemukan" });
        if (check.rows[0].id_user != id_user) return res.status(403).json({ error: "Tidak memiliki akses untuk mengubah barang ini" });

        // Update barang (hanya kolom yang diizinkan untuk diedit)
        let queryUpdate = `
            UPDATE tbl_barang 
            SET nama_barang = $1, harga_awal = $2, deskripsi = $3, kategori = $4, harga_beli_langsung = $5
        `;
        let queryParams = [nama_barang, harga_awal, deskripsi, kategori || 'Lainnya', harga_beli_langsung || null];
        
        if (gambar) {
            queryUpdate += `, gambar = $6 WHERE id_barang = $7 RETURNING *`;
            queryParams.push(gambar, req.params.id);
        } else {
            queryUpdate += ` WHERE id_barang = $6 RETURNING *`;
            queryParams.push(req.params.id);
        }

        const result = await db.query(queryUpdate, queryParams);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE BARANG
router.delete('/:id', async (req, res) => {
    try {
        const { id_user } = req.body;
        
        const check = await db.query("SELECT * FROM tbl_barang WHERE id_barang = $1", [req.params.id]);
        if (check.rows.length === 0) return res.status(404).json({ error: "Barang tidak ditemukan" });
        if (check.rows[0].id_user != id_user) return res.status(403).json({ error: "Tidak memiliki akses" });

        await db.query("DELETE FROM tbl_lelang WHERE id_barang = $1", [req.params.id]);
        await db.query("DELETE FROM tbl_barang WHERE id_barang = $1", [req.params.id]);
        res.json({ message: "Barang berhasil dihapus" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;