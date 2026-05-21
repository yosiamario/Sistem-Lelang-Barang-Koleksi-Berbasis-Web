const express = require('express');
const router = express.Router();
const db = require('../config/db');

// LIHAT SEMUA BARANG PENDING (Hanya Admin)
router.get('/pending', async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM tbl_barang WHERE status = $1", ['pending']);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// LIHAT SEMUA LELANG AKTIF (Hanya Admin)
router.get('/aktif', async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM tbl_barang WHERE status = 'approved' AND status_lelang = 'berjalan' ORDER BY id_barang DESC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// APPROVE BARANG
router.put('/approve/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const item = await db.query("UPDATE tbl_barang SET status = 'approved' WHERE id_barang = $1 RETURNING id_user, nama_barang", [id]);
        if (item.rows.length > 0) {
            const { id_user, nama_barang } = item.rows[0];
            await db.query(
                "INSERT INTO tbl_notifikasi (id_user, pesan) VALUES ($1, $2)",
                [id_user, `Barang Anda "${nama_barang}" telah disetujui oleh admin.`]
            );
        }
        res.json({ message: "Barang telah disetujui untuk dilelang" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//MENOLAK BARANG
router.put('/reject/:id', async (req, res) => {
    try {
        const item = await db.query("UPDATE tbl_barang SET status = 'rejected' WHERE id_barang = $1 RETURNING id_user, nama_barang", [req.params.id]);
        if (item.rows.length > 0) {
            const { id_user, nama_barang } = item.rows[0];
            await db.query(
                "INSERT INTO tbl_notifikasi (id_user, pesan) VALUES ($1, $2)",
                [id_user, `Barang Anda "${nama_barang}" telah ditolak oleh admin.`]
            );
        }
        res.json({ message: "Barang ditolak/dibatalkan" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//LIHAT SEMUA USER
router.get('/users', async (req, res) => {
    try {
        const result = await db.query(
            "SELECT id_user, nama, email, role FROM tbl_user ORDER BY id_user DESC"
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//LIHAT USER ROLE SPESIFIK
router.get('/users/role/:roleName', async (req, res) => {
    const { roleName } = req.params;
    try {
        const result = await db.query(
            "SELECT id_user, nama, email, role FROM tbl_user WHERE role = $1",
            [roleName]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// TUTUP LELANG DAN TENTUKAN PEMENANG
router.put('/tutup-lelang/:id_barang', async (req, res) => {
    const { id_barang } = req.params;
    try {
        // 1. Cari bid tertinggi untuk barang ini
        const topBid = await db.query(
            "SELECT id_user, harga_penawaran FROM tbl_lelang WHERE id_barang = $1 ORDER BY harga_penawaran DESC LIMIT 1",
            [id_barang]
        );

        if (topBid.rows.length === 0) {
            // Tutup tanpa pemenang
            await db.query(
                "UPDATE tbl_barang SET status_lelang = 'selesai' WHERE id_barang = $1",
                [id_barang]
            );
            return res.json({ message: "Lelang ditutup tanpa pemenang (tidak ada penawar)." });
        }

        const pemenangId = topBid.rows[0].id_user;
        const hargaFinal = topBid.rows[0].harga_penawaran;

        // 2. Update status barang dan masukkan ID pemenang
        await db.query(
            "UPDATE tbl_barang SET id_pemenang = $1, status_lelang = 'selesai' WHERE id_barang = $2",
            [pemenangId, id_barang]
        );

        res.json({
            message: "Lelang berhasil ditutup!",
            pemenang_id: pemenangId,
            harga_akhir: hargaFinal
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;