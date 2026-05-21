const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET Notifikasi per User
router.get('/user/:id_user', async (req, res) => {
    try {
        const result = await db.query(
            "SELECT * FROM tbl_notifikasi WHERE id_user = $1 ORDER BY created_at DESC",
            [req.params.id_user]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET Unread Notifikasi Count
router.get('/user/:id_user/unread', async (req, res) => {
    try {
        const result = await db.query(
            "SELECT COUNT(*) FROM tbl_notifikasi WHERE id_user = $1 AND is_read = false",
            [req.params.id_user]
        );
        res.json({ unread: parseInt(result.rows[0].count) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// MARK Notifikasi as Read
router.put('/:id_notifikasi/read', async (req, res) => {
    try {
        await db.query(
            "UPDATE tbl_notifikasi SET is_read = true WHERE id_notifikasi = $1",
            [req.params.id_notifikasi]
        );
        res.json({ message: "Notifikasi telah dibaca" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
