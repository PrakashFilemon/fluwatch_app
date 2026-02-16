# FluWatch.AI 🦠

Sistem surveilans dan analisis penyebaran influenza berbasis data real-time di Indonesia.

> Pengguna melaporkan gejala flu via kuesioner → data tersimpan ke PostgreSQL → AI Agent menganalisis penyebaran lokal → ditampilkan di peta heatmap interaktif.

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Flask 3.0.3 + SQLAlchemy 2.0 |
| Database | PostgreSQL 16 |
| AI | OpenRouter API (upstage/solar-pro-3:free) |
| Peta | React-Leaflet + Leaflet.heat |
| Auth | JWT (flask-jwt-extended) |

---

## Prasyarat

- Python 3.10+ (diuji di 3.14, **hindari pydantic**)
- Node.js 18+
- PostgreSQL 16+
- OpenRouter API Key (gratis di [openrouter.ai](https://openrouter.ai))

---

## Instalasi Cepat

### 1. Clone & masuk folder

```bash
cd "project-formulasi-data"
```

### 2. Setup Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux/Mac

pip install -r requirements.txt
```

Buat file `.env` di folder `backend/`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/fluwatch_db
SECRET_KEY=ganti-dengan-secret-key-kuat
JWT_SECRET_KEY=ganti-dengan-jwt-secret-kuat
OPENROUTER_API_KEY=sk-or-xxxxxxxxxxxxxxxx
FRONTEND_URL=http://localhost:5173
```

Inisialisasi database & isi data contoh:

```bash
python setup_db.py --seed
```

Jalankan server:

```bash
python run.py
# Backend berjalan di http://localhost:5000
```

### 3. Setup Frontend

```bash
cd ../frontend
npm install
npm run dev
# Frontend berjalan di http://localhost:5173
```

### 4. Akses Aplikasi

| URL | Keterangan |
|-----|------------|
| `http://localhost:5173` | Aplikasi utama |
| `http://localhost:5173/admin.html` | Panel Admin |
| `http://localhost:5000/api/health` | Health check backend |

---

## Struktur Folder

```
project-formulasi-data/
├── backend/
│   ├── app.py              # Flask app factory
│   ├── config.py           # Konfigurasi dari .env
│   ├── extensions.py       # Limiter + JWT (singleton)
│   ├── models.py           # SQLAlchemy models (Pengguna, LaporanInfluenza)
│   ├── run.py              # Entry point development
│   ├── setup_db.py         # Init DB + seed data (912 laporan)
│   ├── migrasi.py          # Migrasi kolom baru
│   ├── requirements.txt
│   ├── routes/
│   │   ├── laporan.py      # POST/GET /api/laporan
│   │   ├── peta.py         # GET /api/peta
│   │   ├── ai.py           # POST /api/analisis
│   │   ├── auth.py         # POST /api/auth/daftar|masuk, GET /api/auth/saya
│   │   └── admin.py        # /api/admin/* (admin only)
│   └── utils/
│       ├── haversine.py    # Filter geospasial 2 tahap
│       ├── openrouter.py   # Integrasi LLM + format konteks DB
│       └── security.py     # IP hashing SHA-256
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx
│   │   ├── components/
│   │   │   ├── PetaHeatmap.jsx
│   │   │   ├── DashboardStats.jsx
│   │   │   ├── FormKuesioner.jsx
│   │   │   ├── AnalisisAI.jsx
│   │   │   ├── LoginModal.jsx
│   │   │   └── RegisterModal.jsx
│   │   ├── admin/
│   │   │   ├── AdminApp.jsx
│   │   │   └── main-admin.jsx
│   │   └── services/
│   │       └── api.js
│   ├── admin.html
│   └── vite.config.js
├── README.md
├── TECHNICAL.md
├── FSD-FluWatch.html
├── diagram-uml.html
└── presentasi.html
```

---

## Fitur Utama

- **Peta Heatmap** — visualisasi penyebaran influenza real-time, toggle layer heatmap/marker
- **Kuesioner 10 Gejala** — formulir 2 halaman dengan skor risiko WHO live
- **AI Agent** — analisis berbasis data lokal + panduan pengobatan & pencegahan
- **Dashboard Statistik** — tren kasus, gejala dominan, peringatan terbaru
- **Autentikasi JWT** — login wajib untuk lapor, akses publik untuk lihat data
- **Batas Laporan** — 1 laporan per pengguna per 4 hari (DB-level)
- **Panel Admin** — kelola pengguna & laporan di `/admin.html`

---

## Variabel Environment

| Key | Default | Keterangan |
|-----|---------|------------|
| `DATABASE_URL` | `postgresql://...` | URL koneksi PostgreSQL |
| `SECRET_KEY` | `dev-key` | Flask secret key |
| `JWT_SECRET_KEY` | `jwt-dev-secret` | JWT signing key |
| `JWT_ACCESS_TOKEN_EXPIRES_HOURS` | `24` | Masa berlaku token (jam) |
| `OPENROUTER_API_KEY` | — | **Wajib** untuk fitur AI |
| `AI_MODEL` | `upstage/solar-pro-3:free` | Model LLM OpenRouter |
| `FRONTEND_URL` | `http://localhost:5173` | Untuk CORS |
| `RADIUS_KM_DEFAULT` | `10` | Radius default AI query (km) |
| `JAM_DEFAULT` | `48` | Jendela waktu default (jam) |

---

## Membuat Akun Admin

Setelah daftar akun biasa, jalankan di PostgreSQL:

```sql
UPDATE pengguna SET role = 'admin' WHERE email = 'email@anda.com';
```

---

## Lisensi

MIT License — bebas digunakan untuk keperluan akademik dan penelitian.
