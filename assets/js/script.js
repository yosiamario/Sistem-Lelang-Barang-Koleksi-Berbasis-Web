// Detect if current page is in root or pages/ subfolder
function isInPagesFolder() {
  var path = window.location.pathname;
  return path.indexOf('/pages/') !== -1;
}
function getPagePrefix() {
  return isInPagesFolder() ? '' : 'pages/';
}
function getRootPrefix() {
  return isInPagesFolder() ? '../' : '';
}
function getAssetPrefix() {
  return isInPagesFolder() ? '../assets/' : 'assets/';
}

// Global Variables
window.produkList = [];

// === PREMIUM TOAST SYSTEM ===
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = '🔔';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '❌';
  if (type === 'warning') icon = '⚠️';

  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-message">${message}</div>
  `;

  container.appendChild(toast);

  // Auto remove
  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Override alert for convenience
window.alert = function(msg) {
  showToast(msg, 'info');
};

function getUser() {
  const user = localStorage.getItem("koleku_user");
  return user ? JSON.parse(user) : null;
}

function formatRupiah(angka) {
  if (angka === null || angka === undefined) return 'Rp 0';
  return 'Rp ' + Number(angka).toLocaleString('id-ID');
}

function renderNavbar() {
  var user = getUser();
  var pp = getPagePrefix();
  var rp = getRootPrefix();
  var ap = getAssetPrefix();
  var menuKanan = "";

  if (user) {
    let extraMenu = '';
    if (user.role === 'admin') {
      extraMenu += `<a href="${pp}admin.html">Dashboard Admin</a>`;
      extraMenu += `<a href="${pp}jual.html" class="btn">Jual Barang</a>`;
    } else if (user.role === 'pelelang') {
      extraMenu += `<a href="${pp}jual.html" class="btn">Jual Barang</a>`;
    }

    menuKanan = `
      <span style="font-weight:bold;color:#3f2e1e">Halo, ${user.nama} (${user.role})</span>
      <a href="${pp}barang-saya.html">Barang Saya</a>
      ${extraMenu}
      <a href="#" onclick="logout()">Keluar</a>
    `;
  } else {
    menuKanan = `
      <a href="${pp}login.html">Masuk</a>
      <a href="${pp}daftar.html">Daftar</a>
    `;
  }

  var html = `
    <nav class="navbar">
      <a href="${rp}index.html" class="logo">
        <img src="${ap}images/logo.png" alt="KOLEKU">
      </a>
      <form class="search" onsubmit="cariProduk(event)">
        <input type="text" id="search-input" placeholder="Cari Barang berdasarkan kata kunci">
        <button type="submit">🔎</button>
      </form>
      <div class="menu">${menuKanan}</div>
    </nav>
    <div class="subnav">
      <a href="${rp}index.html">Beranda</a>
      <a href="${pp}kategori.html">Kategori</a>
      <a href="${pp}lelang-aktif.html">Lelang Aktif</a>
    </div>
  `;

  var nav = document.getElementById("navbar");
  if (nav) nav.innerHTML = html;
}

function renderFooter() {
  var html =
    '<footer class="footer">' +
    '<p>&copy; 2025 KOLEKU - Platform Lelang Online</p>' +
    '<div style="margin-top:8px">' +
    '<a href="#">Tentang</a><a href="#">Kontak</a><a href="#">Syarat & Ketentuan</a><a href="#">Bantuan</a>' +
    '</div></footer>';
  var f = document.getElementById("footer");
  if (f) f.innerHTML = html;
}

function logout() {
  localStorage.removeItem("koleku_user");
  window.location.href = getRootPrefix() + "index.html";
}

function cariProduk(e) {
  e.preventDefault();
  var input = document.getElementById("search-input");
  if (!input) return;
  
  var keyword = input.value.trim();
  
  // Cek apakah halaman saat ini punya grid produk sendiri (kategori/lelang-aktif)
  var currentPage = window.location.pathname;
  var isKategori = currentPage.includes('kategori.html');
  var isLelangAktif = currentPage.includes('lelang-aktif.html');
  
  if (isKategori || isLelangAktif) {
    // Cari di halaman yang sama (in-page search)
    filterBySearchInPage(keyword);
    return;
  }
  
  // Redirect ke halaman index (beranda) dengan membawa parameter query 'search'
  if (keyword) {
    window.location.href = getRootPrefix() + "index.html?search=" + encodeURIComponent(keyword);
  } else {
    window.location.href = getRootPrefix() + "index.html";
  }
}

// In-page search for kategori & lelang-aktif
async function filterBySearchInPage(keyword) {
  var grid = document.getElementById("grid-produk") || document.getElementById("produk-grid");
  if (!grid) return;
  
  // Jika produkList belum dimuat, ambil dari API dulu
  if (!window.produkList || window.produkList.length === 0) {
    try {
      const res = await fetch('/barang');
      window.produkList = await res.json();
    } catch(e) {
      grid.innerHTML = "<p style='text-align:center; padding:40px; color:#999;'>Gagal memuat data barang.</p>";
      return;
    }
  }
  
  var pp = getPagePrefix();
  var displayList = window.produkList;
  
  if (keyword) {
    var kw = keyword.toLowerCase();
    displayList = displayList.filter(function(p) {
      return (p.nama_barang && p.nama_barang.toLowerCase().includes(kw)) ||
             (p.deskripsi && p.deskripsi.toLowerCase().includes(kw)) ||
             (p.kategori && p.kategori.toLowerCase().includes(kw));
    });
  }
  
  if (displayList.length === 0) {
    grid.innerHTML = '<div style="text-align:center; padding:60px 20px;">' +
      '<div style="font-size:48px; margin-bottom:16px;">🔍</div>' +
      '<p style="font-size:16px; color:#666; margin-bottom:8px;">Tidak ada barang yang cocok dengan "' + keyword + '"</p>' +
      '<p style="font-size:13px; color:#999;">Coba gunakan kata kunci yang berbeda</p>' +
      '</div>';
    return;
  }
  
  var html = "";
  for (var i = 0; i < displayList.length; i++) {
    var p = displayList[i];
    html +=
      '<a href="' + pp + 'produk.html?id=' + p.id_barang + '" style="text-decoration:none; color:inherit;">' +
      '<div class="card" style="cursor:pointer;">' +
      '<img src="' + p.gambar + '" alt="' + p.nama_barang + '" style="width:100%; height:160px; object-fit:cover;">' +
      '<div class="body">' +
      '<div class="title">' + p.nama_barang + '</div>' +
      '<div class="price">' + formatRupiah(p.harga_tertinggi || p.harga_awal) + '</div>' +
      '</div></div></a>';
  }
  grid.innerHTML = html;
} 
async function renderGridProduk() {
  var grid = document.getElementById("grid-produk") || document.getElementById("produk-grid");
  if (!grid) return;

  try {
    // === Ambil keyword pencarian dari URL ===
    const urlParams = new URLSearchParams(window.location.search);
    const searchKeyword = urlParams.get('search');
    
    // Fetch barang - gunakan parameter search jika ada
    let fetchUrl = '/barang';
    if (searchKeyword) {
      fetchUrl += '?search=' + encodeURIComponent(searchKeyword);
    }
    
    const res = await fetch(fetchUrl);
    const data = await res.json();
    window.produkList = data; // Simpan secara global

    var pp = getPagePrefix();
    let displayList = window.produkList;
    const isLelangAktifPage = window.location.pathname.includes('lelang-aktif.html');
    const now = new Date();

    if (isLelangAktifPage) {
       displayList = displayList.filter(p => new Date(p.tanggal_mulai) <= now);
    }

    // Tampilkan header hasil pencarian
    if (searchKeyword) {
       const container = grid.parentElement;
       let titleEl = container.querySelector('.section-title');
       if (titleEl) {
           titleEl.innerHTML = 'Hasil Pencarian: "' + searchKeyword + '" <a href="' + getRootPrefix() + 'index.html" style="font-size:13px; margin-left:12px; color:#b8860b; text-decoration:underline;">Hapus Filter</a>';
       }
       
       // Sembunyikan banner saat pencarian
       var banner = container.querySelector('.banner');
       if (banner) banner.style.display = 'none';
    }

    if(displayList.length === 0) {
       grid.innerHTML = '<div style="text-align:center; padding:60px 20px;">' +
         '<div style="font-size:48px; margin-bottom:16px;">🔍</div>' +
         '<p style="font-size:16px; color:#666; margin-bottom:8px;">Tidak ada barang yang ditemukan' + (searchKeyword ? ' untuk "<strong>' + searchKeyword + '</strong>"' : '') + '</p>' +
         '<p style="font-size:13px; color:#999;">Coba gunakan kata kunci yang berbeda</p>' +
         (searchKeyword ? '<a href="' + getRootPrefix() + 'index.html" class="btn" style="display:inline-block; margin-top:16px;">Lihat Semua Barang</a>' : '') +
         '</div>';
       return;
    }

    var html = "";
    for (var i = 0; i < displayList.length; i++) {
      var p = displayList[i];
      var startDate = new Date(p.tanggal_mulai);
      var endDate = new Date(p.tanggal_selesai);
      
      var metaStatus = "";
      if (p.status_lelang === 'terjual') {
         metaStatus = '<span style="color:#27ae60;font-weight:bold;">Sudah Dibeli</span>';
      } else if (p.status_lelang === 'selesai' || endDate <= now) {
         metaStatus = '<span style="color:#c0392b;font-weight:bold;">Lelang Berakhir</span>';
      } else if (startDate > now) {
         metaStatus = "Akan Datang: " + startDate.toLocaleDateString('id-ID', {day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit'});
      } else {
         metaStatus = "Berjalan (Dimulai: " + startDate.toLocaleDateString('id-ID', {day: 'numeric', month: 'short'}) + ")";
      }

      html +=
        '<a href="' + pp + 'produk.html?id=' + p.id_barang + '">' +
        '<div class="card">' +
        '<img src="' + p.gambar + '" alt="' + p.nama_barang + '" style="width:100%; height:160px; object-fit:cover;">' +
        '<div class="body">' +
        '<div class="title">' + p.nama_barang + '</div>' +
        '<div class="price">' + formatRupiah(p.harga_tertinggi || p.harga_awal) + '</div>' +
        (p.harga_beli_langsung ? '<div style="font-size:11px; color:#b8860b; font-weight:bold;">Beli Langsung: ' + formatRupiah(p.harga_beli_langsung) + '</div>' : '') +
        '<div class="meta">Status: ' + metaStatus + '</div>' +
        '</div></div></a>';
    }
    grid.innerHTML = html;
  } catch(e) {
    console.error(e);
    grid.innerHTML = "<p>Gagal memuat barang. Error: " + e.message + "</p>";
  }
}
async function renderDetailProduk() {
  var detail = document.getElementById("detail-produk");
  if (!detail) return;

  var params = new URLSearchParams(window.location.search);
  var id = params.get("id");
  if(!id) return;

  try {
    const res = await fetch('/barang/' + id);
    if(!res.ok) {
       detail.innerHTML = "<p>Produk tidak ditemukan.</p>";
       return;
    }
    const produk = await res.json();
    var minBid = Number(produk.harga_tertinggi || produk.harga_awal) + 10000;
    
    var now = new Date();
    var startDate = new Date(produk.tanggal_mulai);
    var isUpcoming = startDate > now;
    var sisaWaktuStr = "Waktu Habis";
    
    if (produk.status_lelang === 'terjual') {
        sisaWaktuStr = "Barang Sudah Dibeli";
    } else if (produk.status_lelang === 'selesai' || new Date(produk.tanggal_selesai) <= now) {
        sisaWaktuStr = "Lelang Berakhir";
    } else if (isUpcoming) {
        sisaWaktuStr = "Dimulai pada: " + startDate.toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute:'2-digit'});
    } else {
        sisaWaktuStr = new Date(produk.tanggal_selesai).toLocaleString();
    }

    var html =
      '<div class="img-box"><img src="' + produk.gambar + '" alt="' + produk.nama_barang + '" style="width:100%; border-radius:8px;"></div>' +
      '<div>' +
      '<h1>' + produk.nama_barang + '</h1>' +
      '<p class="info"><span>Deskripsi:</span> ' + produk.deskripsi + '</p>' +
      '<div class="harga-box">' +
      '<div class="label">Harga Awal</div>' +
      '<div class="value" style="font-size:16px">' + formatRupiah(produk.harga_awal) + '</div>' +
      '</div>' +
      '<div class="harga-box">' +
      '<div class="label">Harga Tertinggi Saat Ini</div>' +
      '<div class="value" id="harga-tertinggi-display">' + formatRupiah(produk.harga_tertinggi || produk.harga_awal) + '</div>' +
      '</div>';

    if (produk.harga_beli_langsung) {
      html += '<div class="harga-box" style="border: 2px solid #b8860b; background: #fffaf0;">' +
              '<div class="label" style="color:#b8860b; font-weight:bold;">Harga Beli Langsung</div>' +
              '<div class="value" style="color:#b8860b;">' + formatRupiah(produk.harga_beli_langsung) + '</div>' +
              '</div>';
    }

    html += '<div class="timer" style="background:#c0392b; color:white; padding:12px 20px; border-radius:6px; text-align:center; font-weight:bold; font-size:18px; margin:20px 0;">' + (isUpcoming ? 'Lelang Dimulai Dalam:' : 'Sisa Waktu:') + ' <span id="countdown-detail" style="font-size:22px;">Menghitung...</span></div>';

    var isSold = produk.status_lelang === 'terjual';
    var isEnded = produk.status_lelang === 'selesai' || new Date(produk.tanggal_selesai) <= now;

    var user = getUser();
    if (isSold) {
        html += '<div style="margin-top: 15px; padding: 10px; background-color: #e8f5e9; border: 1px solid #c8e6c9; border-radius: 8px; text-align: center; color: #2e7d32;">' +
                '<strong>Barang ini sudah dibeli.</strong>' +
                '</div>';
    } else if (isEnded) {
        html += '<div style="margin-top: 15px; padding: 10px; background-color: #ffebee; border: 1px solid #ffcdd2; border-radius: 8px; text-align: center; color: #c62828;">' +
                '<strong>Lelang telah berakhir.</strong>' +
                '</div>';
    } else if (isUpcoming) {
        html += '<div style="margin-top: 15px; padding: 10px; background-color: #f8f1e3; border: 1px solid #e5d9c8; border-radius: 8px; text-align: center; color: #b8860b;">' +
                '<strong>Lelang Belum Dimulai</strong><br>Barang ini dijadwalkan untuk lelang pada tanggal ' + startDate.toLocaleDateString('id-ID') + '.' +
                '</div>';
    } else if (!user || user.role !== 'pelelang') {
        html += '<label style="font-weight:bold;font-size:14px;color:#555;margin-bottom:8px;display:block;">Masukkan Tawaran (min Rp ' + minBid.toLocaleString('id-ID') + ')</label>' +
                '<form class="bid-form" style="display:block; margin-bottom:15px;" onsubmit="kirimBid(event,' + produk.id_barang + ')">' +
                '<div style="display:flex;align-items:center;gap:0;border:2px solid #b8860b;border-radius:6px;overflow:hidden;background:white;margin-bottom:8px;">' +
                '<button type="button" onclick="kurangiTawaran(' + minBid + ', ' + produk.harga_awal + ')" style="width:50px;height:48px;border:none;background:linear-gradient(135deg,#f8f1e3,#efe6d5);font-size:22px;font-weight:bold;color:#b8860b;cursor:pointer;" onmouseover="this.style.background=\'#e8d9c0\'" onmouseout="this.style.background=\'linear-gradient(135deg,#f8f1e3,#efe6d5)\'">−</button>' +
                '<input type="number" id="bid-input" value="' + minBid + '" min="' + minBid + '" required style="flex:1;border:none;border-left:1px solid #e5d9c8;border-right:1px solid #e5d9c8;text-align:center;font-size:18px;font-weight:bold;padding:12px;outline:none;" oninput="updateTawarPreview(' + minBid + ')">' +
                '<button type="button" onclick="tambahTawaran(' + produk.harga_awal + ')" style="width:50px;height:48px;border:none;background:linear-gradient(135deg,#b8860b,#d4a017);font-size:22px;font-weight:bold;color:white;cursor:pointer;" onmouseover="this.style.background=\'#a07509\'" onmouseout="this.style.background=\'linear-gradient(135deg,#b8860b,#d4a017)\'">+</button>' +
                '</div>' +
                '<div id="tawar-preview" style="margin-top:8px;font-size:14px;color:#b8860b;font-weight:600;">Rp ' + minBid.toLocaleString('id-ID') + '</div>' +
                '<div style="margin-top:4px;margin-bottom:12px;font-size:11px;color:#999;">Tombol +/- menambah/kurangi 10% dari harga awal</div>' +
                '<button class="btn" type="submit" style="width:100%; padding:14px; font-size:16px;">Kirim Tawaran</button>' +
                '</form>' +
                '<div id="bid-message" style="margin-bottom:15px; font-weight:bold; text-align:center;"></div>';
        
        if (produk.harga_beli_langsung) {
            html += '<a href="checkout.html?id=' + produk.id_barang + '&type=buynow" class="btn" style="display:block; text-align:center; width:100%; padding:14px; font-size:16px; box-sizing:border-box; background:#b8860b; color:white; margin-bottom:10px;">Beli Sekarang (' + formatRupiah(produk.harga_beli_langsung) + ')</a>';
        }
        
        html += '<a href="checkout.html?id=' + produk.id_barang + '" class="btn" style="display:block; text-align:center; width:100%; padding:14px; font-size:16px; box-sizing:border-box; background:white; color:#b8860b; border:2px solid #b8860b;">Lanjutkan ke Checkout</a>';
    } else {
        html += '<div style="margin-top: 15px; padding: 10px; background-color: #f8f1e3; border: 1px solid #e5d9c8; border-radius: 8px; text-align: center; color: #b8860b;">' +
                '<strong>Anda masuk sebagai Pelelang.</strong><br>Pelelang tidak dapat menawar atau membeli barang.' +
                '</div>';
    }

    html += '</div>';

    detail.innerHTML = html;
    
    if (!isSold && !isEnded) {
        startDynamicCountdown(produk.tanggal_mulai, produk.tanggal_selesai, isUpcoming);
        
        // Polling harga tertinggi
        if (window.bidPollInterval) clearInterval(window.bidPollInterval);
        if (!isUpcoming && new Date(produk.tanggal_selesai) > now) {
          window.bidPollInterval = setInterval(async () => {
            try {
              const pollRes = await fetch('/barang/' + id);
              if (pollRes.ok) {
                const pollData = await pollRes.json();
                const displayEl = document.getElementById('harga-tertinggi-display');
                if (displayEl) {
                  displayEl.textContent = formatRupiah(pollData.harga_tertinggi || pollData.harga_awal);
                }
              }
            } catch(e) {}
          }, 5000);
        }
    }
    
    // Render Riwayat Bid
    renderRiwayatBid(id);
    
  } catch(e) {
    detail.innerHTML = "<p>Gagal memuat detail.</p>";
  }
}

function startDynamicCountdown(startTimeStr, endTimeStr, isUpcoming) {
  const startTime = new Date(startTimeStr).getTime();
  const endTime = new Date(endTimeStr).getTime();
  
  function updateCountdown() {
    const countdownEl = document.getElementById("countdown-detail");
    if (!countdownEl) return; // Stop if element is not on page

    const targetTime = isUpcoming ? startTime : endTime;
    const timeLeft = targetTime - Date.now();

    if (timeLeft <= 0) {
      if (isUpcoming) {
        // Lelang baru saja dimulai, muat ulang komponen detail
        renderDetailProduk();
        return;
      } else {
        countdownEl.textContent = "Lelang telah berakhir";
        return;
      }
    }

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    countdownEl.textContent = `${days} hari ${hours} jam ${minutes} menit ${seconds} detik`;
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);
}

function tambahTawaran(hargaAwal) {
  var input = document.getElementById('bid-input');
  var current = parseInt(input.value) || 0;
  var step = Math.round(hargaAwal * 0.10);
  if (step < 10000) step = 10000;
  input.value = current + step;
  updateTawarPreview(input.getAttribute('min'));
}

function kurangiTawaran(minBid, hargaAwal) {
  var input = document.getElementById('bid-input');
  var current = parseInt(input.value) || 0;
  var step = Math.round(hargaAwal * 0.10);
  if (step < 10000) step = 10000;
  var newVal = current - step;
  if (newVal < minBid) newVal = minBid;
  input.value = newVal;
  updateTawarPreview(minBid);
}

function updateTawarPreview(minBid) {
  var input = document.getElementById('bid-input');
  var val = parseInt(input.value) || 0;
  minBid = parseInt(minBid) || 0;
  if (val < minBid) {
    input.value = minBid;
    val = minBid;
  }
  var preview = document.getElementById('tawar-preview');
  if (preview) {
    preview.textContent = 'Rp ' + val.toLocaleString('id-ID');
  }
}

async function kirimBid(e, id_barang) {
  e.preventDefault();
  var user = getUser();
  if (!user) {
    showToast("Silakan login dulu untuk menawar.", "warning");
    window.location.href = "login.html";
    return;
  }
  if (user.role === 'pelelang') {
    showToast("Pelelang tidak dapat menawar barang.", "error");
    return;
  }
  var nilai = parseInt(document.getElementById("bid-input").value);
  if (!nilai || nilai <= 0) {
    alert("Masukkan tawaran yang benar.");
    return;
  }
  
  try {

      const res = await fetch('/lelang/bid', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ id_barang: id_barang, id_user: user.id_user, harga_penawaran: nilai })
      });
      const data = await res.json();
      const msgEl = document.getElementById("bid-message");
      if(!res.ok) throw new Error(data.message || data.error);
      
      if (msgEl) {
         msgEl.style.color = "green";
         msgEl.textContent = "Tawaran berhasil dikirim!";
         setTimeout(() => msgEl.textContent = "", 3000);
      }
      showToast("Tawaran berhasil dikirim!", "success");
      
      // Update displayed max bid
      const displayEl = document.getElementById('harga-tertinggi-display');
      if (displayEl) {
          displayEl.textContent = formatRupiah(nilai);
      }
      
      // Update input and minimum step for next bid
      var minBid = nilai + 10000;
      document.getElementById("bid-input").min = minBid;
      document.getElementById("bid-input").value = minBid;
      updateTawarPreview(minBid);
      
      // Refresh bid history
      renderRiwayatBid(id_barang);
   } catch(err) {
      const msgEl = document.getElementById("bid-message");
      if (msgEl) {
         msgEl.style.color = "red";
         msgEl.textContent = err.message;
      } else {
         alert(err.message);
      }
   }
}

async function renderRiwayatBid(id_barang) {
  var detail = document.getElementById("detail-produk");
  if (!detail) return;
  var user = getUser();
  
  try {
     const res = await fetch('/lelang/history/' + id_barang);
     if (!res.ok) return;
     const bids = await res.json();
     
     let historyEl = document.getElementById("bid-history");
     if (!historyEl) {
         historyEl = document.createElement("div");
         historyEl.id = "bid-history";
         historyEl.style.marginTop = "30px";
         detail.appendChild(historyEl);
     }
     
     if (bids.length === 0) {
         historyEl.innerHTML = '<h3>Riwayat Bid</h3><p>Belum ada tawaran.</p>';
         return;
     }
     
     let html = '<h3>Riwayat Bid</h3><ul style="list-style:none; padding:0; border: 1px solid #e5d9c8; border-radius: 8px; overflow:hidden;">';
     for (let i = 0; i < bids.length; i++) {
         const bid = bids[i];
         const isYou = user && bid.id_user === user.id_user;
         const bidderName = isYou ? '<strong>Anda</strong>' : 'Penawar #' + bid.id_user;
         const bg = isYou ? '#f0f8ff' : (i === 0 ? '#f8f1e3' : 'white');
         
         html += '<li style="padding:10px 15px; border-bottom:1px solid #e5d9c8; background:'+bg+'; display:flex; justify-content:space-between;">' +
                 '<span>' + bidderName + '</span>' +
                 '<span style="font-weight:bold; color:#b8860b;">' + formatRupiah(bid.harga_penawaran) + '</span>' +
                 '</li>';
     }
     html += '</ul>';
     historyEl.innerHTML = html;
  } catch(e) {}
}

// === CHECKOUT STATE ===
var checkoutStep = 1;
var selectedPaymentMethod = '';
var selectedBank = '';
var selectedEwallet = '';

async function renderCheckout() {
  var box = document.getElementById("checkout-step1-content");
  if (!box) return;

  var params = new URLSearchParams(window.location.search);
  var id = params.get("id");
  if(!id) return;
  
  try {
    const res = await fetch('/barang/' + id);
    if(!res.ok) return;
    const produk = await res.json();

    box.innerHTML =
      '<div class="checkout-box">' +
      '<h3>📦 Barang yang Dibeli</h3>' +
      '<div style="display:flex;gap:14px;align-items:center">' +
      '<img src="' + produk.gambar + '" alt="' + produk.nama_barang + '" style="width:90px;height:90px;object-fit:cover;border-radius:8px;border:2px solid #e5d9c8;">' +
      '<div><div style="font-weight:bold;font-size:16px">' + produk.nama_barang + '</div>' +
      '<div style="color:#b8860b;font-weight:bold;font-size:18px;margin-top:4px">' + formatRupiah(produk.harga_tertinggi || produk.harga_awal) + '</div></div></div></div>' +
      '<div class="checkout-box">' +
      '<h3>📍 Alamat Pengiriman</h3>' +
      '<div class="form-group"><label>Nama Penerima</label><input type="text" id="ship-nama" placeholder="Nama lengkap"></div>' +
      '<div class="form-group"><label>Nomor HP</label><input type="text" id="ship-hp" placeholder="08xxxxxxxxx"></div>' +
      '<div class="form-group"><label>Alamat</label><textarea rows="3" id="ship-alamat" placeholder="Jl. ..."></textarea></div>' +
      '<div class="form-row"><div class="form-group"><label>Kota</label><input type="text" id="ship-kota"></div>' +
      '<div class="form-group"><label>Kode Pos</label><input type="text" id="ship-kodepos"></div></div></div>' +
      '<div class="step-nav"><div></div><button class="btn-next" onclick="goToStep(2)">Pilih Pembayaran →</button></div>';

    var step2 = document.getElementById("checkout-step2-content");
    if (step2) {
      step2.innerHTML =
        '<div class="checkout-box"><h3>💳 Pilih Metode Pembayaran</h3>' +
        '<div class="payment-methods">' +
        '<div class="payment-method-card" id="pm-bank" onclick="selectPaymentMethod(\'bank\')">' +
        '<div class="payment-method-icon">🏦</div><div class="payment-method-info"><div class="pm-title">Transfer Bank</div><div class="pm-desc">BCA, BNI, Mandiri, BRI</div></div></div>' +
        '<div class="payment-method-card" id="pm-ewallet" onclick="selectPaymentMethod(\'ewallet\')">' +
        '<div class="payment-method-icon">📱</div><div class="payment-method-info"><div class="pm-title">E-Wallet</div><div class="pm-desc">GoPay, OVO, DANA</div></div></div>' +
        '<div class="payment-method-card" id="pm-cod" onclick="selectPaymentMethod(\'cod\')">' +
        '<div class="payment-method-icon">🚚</div><div class="payment-method-info"><div class="pm-title">COD</div><div class="pm-desc">Bayar di Tempat</div></div></div>' +
        '</div><div id="payment-detail-area"></div></div>' +
        '<div class="step-nav"><button class="btn-prev" onclick="goToStep(1)">← Kembali</button>' +
        '<button class="btn-next" onclick="goToStep(3)">Konfirmasi →</button></div>';
    }
  } catch(e) { }
}

function selectPaymentMethod(method) {
  selectedPaymentMethod = method;
  selectedBank = ''; selectedEwallet = '';
  document.querySelectorAll('.payment-method-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('pm-' + method).classList.add('selected');

  var area = document.getElementById('payment-detail-area');
  if (method === 'bank') {
    area.innerHTML = '<div style="margin-top:16px"><h4 style="margin-bottom:8px;">Pilih Bank:</h4><div class="bank-grid"><div class="bank-option" onclick="selectBank(\'BCA\',this)">BCA</div><div class="bank-option" onclick="selectBank(\'BNI\',this)">BNI</div><div class="bank-option" onclick="selectBank(\'Mandiri\',this)">Mandiri</div><div class="bank-option" onclick="selectBank(\'BRI\',this)">BRI</div></div></div>';
  } else if (method === 'ewallet') {
    area.innerHTML = '<div style="margin-top:16px"><h4 style="margin-bottom:8px;">Pilih E-Wallet:</h4><div class="ewallet-grid"><div class="ewallet-option" onclick="selectEwallet(\'GoPay\',this)">GoPay</div><div class="ewallet-option" onclick="selectEwallet(\'OVO\',this)">OVO</div><div class="ewallet-option" onclick="selectEwallet(\'DANA\',this)">DANA</div></div></div>';
  } else if (method === 'cod') {
    area.innerHTML = '<div style="margin-top:16px;padding:16px;background:#f8f1e3;">COD: Bayar di tempat saat barang sampai.</div>';
  } else {
    area.innerHTML = '';
  }
}

function selectBank(bank, el) {
  selectedBank = bank;
  document.querySelectorAll('.bank-option').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
}
function selectEwallet(ew, el) {
  selectedEwallet = ew;
  document.querySelectorAll('.ewallet-option').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
}

function goToStep(step) {
  if (step === 2) {
    var nama = document.getElementById('ship-nama');
    if (nama && !nama.value.trim()) { alert('Mohon lengkapi data pengiriman.'); return; }
  }
  if (step === 3) {
    if (!selectedPaymentMethod) { alert('Pilih metode pembayaran terlebih dahulu.'); return; }
    if (selectedPaymentMethod === 'bank' && !selectedBank) { alert('Pilih bank.'); return; }
    if (selectedPaymentMethod === 'ewallet' && !selectedEwallet) { alert('Pilih e-wallet.'); return; }
    renderStep3Review();
  }
  checkoutStep = step;
  for (var s = 1; s <= 3; s++) {
    var content = document.getElementById('step-' + s);
    if (content) content.classList.toggle('active', s === step);
  }
}

async function renderStep3Review() {
  var box = document.getElementById('checkout-step3-content');
  if (!box) return;

  var params = new URLSearchParams(window.location.search);
  var id = params.get("id");

  var isBuyNow = params.get("type") === "buynow";
  
  const res = await fetch('/barang/' + id);

  const produk = await res.json();
  var ongkir = 25000;
  
  var basePrice = Number(produk.harga_tertinggi || produk.harga_awal);
  if (isBuyNow && produk.harga_beli_langsung) {
      basePrice = Number(produk.harga_beli_langsung);
  }
  
  var total = basePrice + ongkir;

  var metodeLabel = selectedPaymentMethod;
  if(selectedPaymentMethod === 'bank') metodeLabel += ' - ' + selectedBank;
  if(selectedPaymentMethod === 'ewallet') metodeLabel += ' - ' + selectedEwallet;

  box.innerHTML =
    '<div class="review-section"><h4>📦 Produk</h4><div>' + produk.nama_barang + ' - ' + formatRupiah(basePrice) + '</div></div>' +
    '<div class="review-section"><h4>💳 Pembayaran</h4><div>' + metodeLabel + '</div></div>' +
    '<div class="review-section"><h4>💰 Total</h4><div style="font-size:20px;font-weight:bold;color:#b8860b">' + formatRupiah(total) + '</div></div>' +
    '<div class="step-nav"><button class="btn-prev" onclick="goToStep(2)">← Kembali</button>' +
    '<button class="btn-next" onclick="bayar()">✓ Bayar Sekarang</button></div>';
}

async function bayar() {
  var user = getUser();
  if (!user) return;
  if (user.role === 'pelelang') {
    alert("Pelelang tidak dapat membeli barang.");
    return;
  }
  var params = new URLSearchParams(window.location.search);
  var id = params.get("id");
  var isBuyNow = params.get("type") === "buynow";

  const resBarang = await fetch('/barang/' + id);
  const produk = await resBarang.json();
  
  var basePrice = Number(produk.harga_tertinggi || produk.harga_awal);
  if (isBuyNow && produk.harga_beli_langsung) {
      basePrice = Number(produk.harga_beli_langsung);
  }
  
  var total = basePrice + 25000;

  var metodeLabel = selectedPaymentMethod;
  if (selectedPaymentMethod === 'bank') metodeLabel += ' - ' + selectedBank;
  if (selectedPaymentMethod === 'ewallet') metodeLabel += ' - ' + selectedEwallet;

  var vaNumber = '';
  if (selectedPaymentMethod === 'bank') vaNumber = '8800' + Math.floor(10000000 + Math.random() * 90000000);

  try {
     const res = await fetch('/pembayaran/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id_user: user.id_user,
            id_barang: id,
            total: total,
            metode: metodeLabel,
            status: selectedPaymentMethod === 'cod' ? 'COD' : 'Menunggu Pembayaran',
            virtual_account: vaNumber,
            batas_waktu: new Date(Date.now() + 86400000).toISOString()
        })
     });
     const result = await res.json();
     
     if (selectedPaymentMethod === 'bank' || selectedPaymentMethod === 'ewallet') {
       window.location.href = "proses-pembayaran.html?trx=" + result.id_pembayaran;
     } else {
       window.location.href = "pembayaran.html?trx=" + result.id_pembayaran;
     }
  } catch(e) {
     alert('Gagal membuat pembayaran');
  }
}

// === PROSES PEMBAYARAN PAGE ===
async function renderProsesPembayaran() {
  var box = document.getElementById("proses-pembayaran-content");
  if (!box) return;

  var params = new URLSearchParams(window.location.search);
  var trx = params.get("trx");
  if(!trx) return;

  try {
     const res = await fetch('/pembayaran/' + trx);
     if(!res.ok) { box.innerHTML = "<p>Transaksi tidak ditemukan</p>"; return; }
     const data = await res.json();

     var html = '<h2>Selesaikan Pembayaran</h2><p class="subtitle">No. Transaksi: #' + data.id_pembayaran + '</p>';
     if (data.metode.includes('bank')) {
       html += '<div class="va-display"><div class="va-number">' + data.virtual_account + '</div></div>' +
               '<div class="review-section"><h4>💰 Total Pembayaran</h4><h2>' + formatRupiah(data.total) + '</h2></div>' +
               '<button class="btn-confirm-payment" onclick="konfirmasiPembayaran(' + data.id_pembayaran + ')">✓ Saya Sudah Membayar</button>';
     } else if (data.metode.includes('ewallet')) {
       html += '<div class="qr-container"><div class="qr-code">📱</div></div>' +
               '<div class="review-section"><h4>💰 Total Pembayaran</h4><h2>' + formatRupiah(data.total) + '</h2></div>' +
               '<button class="btn-confirm-payment" onclick="konfirmasiPembayaran(' + data.id_pembayaran + ')">✓ Saya Sudah Membayar</button>';
     }
     box.innerHTML = html;
  } catch(e) {}
}

async function konfirmasiPembayaran(trx) {
  try {
     await fetch('/pembayaran/confirm/' + trx, { method: 'PUT' });
     window.location.href = "pembayaran.html?trx=" + trx;
  } catch(e) {}
}

async function renderPembayaran() {
  var box = document.getElementById("pembayaran-receipt");
  if (!box) return;

  var params = new URLSearchParams(window.location.search);
  var trx = params.get("trx");
  if(!trx) return;

  try {
     const res = await fetch('/pembayaran/' + trx);
     const data = await res.json();
     box.innerHTML =
       '<div class="receipt-card">' +
       '<div class="receipt-header"><h3>KOLEKU</h3><div class="receipt-no">#' + data.id_pembayaran + '</div></div>' +
       '<div class="receipt-row"><span class="receipt-label">Metode</span><span class="receipt-value">' + data.metode + '</span></div>' +
       '<div class="receipt-total"><span>Total</span><span>' + formatRupiah(data.total) + '</span></div>' +
       '<div class="receipt-row"><span class="receipt-label">Status</span><span class="receipt-value">' + data.status + '</span></div></div>';
  } catch(e) {}
}

async function renderBarangSaya() {
  var box = document.getElementById("barang-saya");
  if (!box) return;

  var user = getUser();
  if (!user) {
    box.innerHTML = '<p>Silakan login dulu.</p>';
    return;
  }

  try {

     const res = await fetch('/pembayaran/user/' + user.id_user);

     const pembelian = await res.json();
     
     if (pembelian.length === 0) {
       box.innerHTML = '<p>Belum ada barang yang dibeli.</p>';
       return;
     }

     var html = '<div class="order-list">';
     for (var i = 0; i < pembelian.length; i++) {
       var p = pembelian[i];
       html +=
         '<div class="order-card">' +
         '<div class="order-header"><span>#' + p.id_pembayaran + '</span><span>' + p.status + '</span></div>' +
         '<div class="order-body"><div class="order-details"><div>' + (p.nama_barang || 'Barang') + '</div></div>' +
         '<div class="order-price" style="display:flex; flex-direction:column; align-items:flex-end; gap:8px;">' +
         '<div>' + formatRupiah(p.total) + '</div>';
         if (user.role && user.role.toLowerCase() === 'penawar' && p.status && p.status.trim().toLowerCase() === 'lunas') {
             html += '<a href="' + getRootPrefix() + 'pages/jual.html?resell_id=' + p.id_barang + '" class="btn" style="padding: 6px 12px; font-size: 12px;">Jual Kembali</a>';
         }
         html += '</div></div></div>';
     }
     html += '</div>';
     box.innerHTML = html;
  } catch(e) {}
}

// Login & Daftar (Backend)
async function handleLogin(e) {
  e.preventDefault();
  var email = document.getElementById("email").value.trim();
  var password = document.getElementById("password").value;
  var errorEl = document.getElementById("error");

  try {
     const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
     });
     const data = await res.json();
     if(!res.ok) throw new Error(data.message || data.error);
     
     localStorage.setItem("koleku_user", JSON.stringify(data.user));
     window.location.href = getRootPrefix() + "index.html";
  } catch(err) {
     errorEl.textContent = err.message;
  }
}

async function handleDaftar(e) {
  e.preventDefault();
  var email = document.getElementById("email").value.trim();
  var namaDepan = document.getElementById("namaDepan").value.trim();
  var namaBelakang = document.getElementById("namaBelakang").value.trim();
  var password = document.getElementById("password").value;
  var role = document.getElementById("role") ? document.getElementById("role").value : 'penawar';
  var errorEl = document.getElementById("error");

  try {
     const res = await fetch('/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama: namaDepan + ' ' + namaBelakang, email, password, role: role })
     });
     const data = await res.json();
     if(!res.ok) throw new Error(data.error || data.message);
     
     window.location.href = "akun-berhasil.html";
  } catch(err) {
     errorEl.textContent = err.message;
  }
}

document.addEventListener("DOMContentLoaded", function () {
  renderNavbar();
  renderFooter();
  if (!window.location.pathname.includes('kategori.html')) {
    renderGridProduk();
  }
  renderDetailProduk();
  renderCheckout();
  renderPembayaran();
  renderBarangSaya();
  renderProsesPembayaran();

  // Isi search input dengan keyword dari URL jika ada
  var urlParams = new URLSearchParams(window.location.search);
  var searchKeyword = urlParams.get('search');
  if (searchKeyword) {
    var searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = searchKeyword;
  }
});
