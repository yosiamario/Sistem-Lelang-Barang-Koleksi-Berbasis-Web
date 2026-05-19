require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Import Routes
const authRoutes = require('./routes/authRoutes');
const barangRoutes = require('./routes/barangRoutes');
const adminRoutes = require('./routes/adminRoutes');
const lelangRoutes = require('./routes/lelangRoutes');
const pembayaranRoutes = require('./routes/pembayaranRoutes');

// Serve static files (HTML, CSS, JS, images)
app.use(express.static(path.join(__dirname)));

const router = express.Router();
router.use('/auth', authRoutes);
router.use('/barang', barangRoutes);
router.use('/admin', adminRoutes);
router.use('/lelang', lelangRoutes);
router.use('/pembayaran', pembayaranRoutes);

app.use('/', router);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server jalan di http://localhost:${PORT}`);
});


module.exports = app;
