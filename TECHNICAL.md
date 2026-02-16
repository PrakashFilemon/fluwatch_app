# FluWatch.AI — Technical Documentation

> Versi 1.0.0 | Flask + React + PostgreSQL + OpenRouter

---

## Daftar Isi

1. [Arsitektur Sistem](#1-arsitektur-sistem)
2. [Backend Flask](#2-backend-flask)
3. [Database & Model](#3-database--model)
4. [REST API Reference](#4-rest-api-reference)
5. [AI Agent & Grounding](#5-ai-agent--grounding)
6. [Filter Geospasial Haversine](#6-filter-geospasial-haversine)
7. [Autentikasi JWT](#7-autentikasi-jwt)
8. [Keamanan](#8-keamanan)
9. [Frontend React](#9-frontend-react)
10. [Admin Panel](#10-admin-panel)
11. [Konfigurasi & Deployment](#11-konfigurasi--deployment)
12. [Migrasi Database](#12-migrasi-database)

---

## 1. Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────┐
│                     BROWSER (React SPA)                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ │
│  │  Peta    │ │ AI Chat  │ │Dashboard │ │  Form      │ │
│  │Heatmap   │ │AnalisisAI│ │  Stats   │ │Kuesioner   │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬──────┘ │
│       └────────────┴────────────┴─────────────┘        │
│                    Vite Proxy /api                       │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP/JSON
┌────────────────────────▼────────────────────────────────┐
│                  FLASK BACKEND (:5000)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ │
│  │ /laporan │ │  /peta   │ │/analisis │ │  /auth     │ │
│  │          │ │          │ │          │ │  /admin    │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬──────┘ │
│  Rate Limiting │ JWT Auth │ Haversine │ Talisman CSP     │
└───────┬─────────────┬────────────┬────────────┬──────────┘
        │             │            │            │
┌───────▼─────┐       │    ┌───────▼──────┐    │
│ PostgreSQL  │       │    │  OpenRouter  │    │
│   :5432     │       │    │  (LLM API)   │    │
└─────────────┘       │    └──────────────┘    │
               ┌──────▼──────────────────────┐
               │  Nominatim (Reverse Geocode) │
               └─────────────────────────────┘
```

### Pola Komunikasi

- Frontend tidak pernah mengakses PostgreSQL atau OpenRouter langsung
- Semua API key (`OPENROUTER_API_KEY`, `JWT_SECRET_KEY`) hanya ada di backend `.env`
- Vite dev proxy meneruskan `/api/*` ke `http://localhost:5000` — menghilangkan CORS issue di development
- Di production: Nginx/Gunicorn serve frontend static dan proxy `/api` ke Flask

---

## 2. Backend Flask

### App Factory Pattern

```python
# backend/app.py
def buat_app() -> Flask:
    app = Flask(__name__)
    db.init_app(app)
    jwt.init_app(app)
    limiter.init_app(app)
    Talisman(app, ...)
    CORS(app, origins=[...])
    app.register_blueprint(laporan_bp)
    app.register_blueprint(peta_bp)
    app.register_blueprint(ai_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp)
    return app
```

Factory pattern memungkinkan testing dengan `app = buat_app()` tanpa side effect global.

### Circular Import Prevention

Masalah klasik Flask: `app.py` import route, route import `limiter`/`jwt` dari `app.py` → circular.

**Solusi:** `extensions.py` sebagai modul singleton:

```python
# backend/extensions.py
from flask_limiter import Limiter
from flask_jwt_extended import JWTManager

limiter = Limiter(key_func=get_remote_address, ...)
jwt = JWTManager()
```

`app.py` dan semua routes hanya import dari `extensions`, bukan satu sama lain.

### Blueprint Structure

| Blueprint | Prefix | File |
|-----------|--------|------|
| `laporan_bp` | `/api/laporan` | `routes/laporan.py` |
| `peta_bp` | `/api/peta` | `routes/peta.py` |
| `ai_bp` | `/api/analisis` | `routes/ai.py` |
| `auth_bp` | `/api/auth` | `routes/auth.py` |
| `admin_bp` | `/api/admin` | `routes/admin.py` |

---

## 3. Database & Model

### Koneksi PostgreSQL

```python
# Pool settings di config.py
SQLALCHEMY_ENGINE_OPTIONS = {
    "pool_pre_ping": True,   # test koneksi sebelum dipakai
    "pool_recycle":  300,    # recycle koneksi setiap 5 menit
}
```

### Model: `Pengguna`

```python
class Pengguna(db.Model):
    __tablename__ = "pengguna"

    id            = Column(UUID, primary_key=True, default=uuid.uuid4)
    username      = Column(String(50), unique=True, nullable=False)
    email         = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(256), nullable=False)  # werkzeug PBKDF2-SHA256
    role          = Column(String(20), default="pengguna")  # 'pengguna' | 'admin'
    is_active     = Column(Boolean, default=True)
    created_at    = Column(DateTime(timezone=True), ...)

    # Relasi — laporan tetap ada jika user dihapus (SET NULL)
    laporan = relationship("LaporanInfluenza", back_populates="pengguna")
```

**Constraints:**
- `ck_pengguna_role` — `CHECK (role IN ('pengguna','admin'))`
- `idx_pengguna_email` — index untuk login query
- `idx_pengguna_username` — index untuk cek duplikasi registrasi

### Model: `LaporanInfluenza`

```python
class LaporanInfluenza(db.Model):
    __tablename__ = "laporan_influenza"

    id  = Column(UUID, primary_key=True)
    lat = Column(Numeric(10, 8), nullable=False)  # presisi 8 desimal
    lng = Column(Numeric(11, 8), nullable=False)

    # 10 gejala sebagai kolom Boolean terpisah (bukan array)
    # → memungkinkan query COUNT dan GROUP BY per gejala efisien
    demam = batuk = sakit_tenggorokan = pilek = nyeri_otot = ...
    sakit_kepala = kelelahan = menggigil = mual_muntah = sesak_napas = Boolean

    tingkat_keparahan = Column(SmallInteger)  # CHECK 1–10
    kelompok_usia     = Column(String(20))    # CHECK anak|remaja|dewasa|lansia
    skor_influenza    = Column(SmallInteger)  # 0–100, dihitung backend
    ip_hash           = Column(String(16))    # SHA-256[:16] dari IP
    user_id           = Column(UUID, ForeignKey("pengguna.id", ondelete="SET NULL"))
    timestamp         = Column(DateTime(timezone=True))
```

**Constraints & Index:**
- `ck_keparahan` — `CHECK (tingkat_keparahan BETWEEN 1 AND 10)`
- `ck_usia` — `CHECK (kelompok_usia IN (...))`
- `idx_laporan_lokasi` — **komposit (lat, lng)** untuk bounding-box query
- `idx_laporan_timestamp` — untuk filter rentang waktu
- `idx_laporan_user_id` — untuk cek 4-hari per user
- `idx_laporan_ip_hash` — untuk analisis pola IP

### Sistem Skoring WHO-Weighted

```python
def _hitung_skor(data: dict) -> int:
    bobot = {
        "demam":             25,   # gejala kardinal influenza
        "menggigil":         15,
        "nyeri_otot":        15,
        "kelelahan":         10,
        "batuk":             10,
        "sakit_kepala":       8,
        "sakit_tenggorokan":  7,
        "pilek":              5,
        "mual_muntah":        3,
        "sesak_napas":        2,
    }
    return min(sum(bobot[g] for g in bobot if data.get(g)), 100)
```

Skor digunakan sebagai `bobot` heatmap: `bobot = skor / 100` (range 0.0–1.0).

---

## 4. REST API Reference

### Konvensi

- **Format:** `Content-Type: application/json` untuk semua request/response
- **Auth:** `Authorization: Bearer <jwt_token>` di header
- **Error format:** `{ "pesan": "...", "kode": 4xx }`
- **Timestamp:** ISO 8601 UTC (`2025-02-16T10:30:00+00:00`)

### Autentikasi

#### `POST /api/auth/daftar`
Rate limit: `5/hour`

**Request:**
```json
{
  "username": "budi123",
  "email": "budi@email.com",
  "password": "P@ssw0rd!"
}
```

**Validasi:**
- `username`: 3–50 karakter, hanya `[a-zA-Z0-9_]`
- `email`: format valid, maks 255 karakter
- `password`: minimal 8 karakter

**Response 201:**
```json
{
  "pesan": "Akun berhasil dibuat.",
  "token": "eyJhbGci...",
  "pengguna": { "id", "username", "email", "role", "is_active", "created_at" }
}
```

**Errors:** `400` (validasi gagal) · `409` (email/username duplikat)

---

#### `POST /api/auth/masuk`
Rate limit: `10/minute;30/hour`

**Request:** `{ "email": "...", "password": "..." }`

**Response 200:** `{ "pesan", "token", "pengguna" }`

**Security:** Pesan error generik — tidak membocorkan apakah email terdaftar.

**Errors:** `401` (email/password salah) · `403` (akun nonaktif)

---

#### `GET /api/auth/saya`
Auth: JWT required

**Response 200:** `{ "pengguna": { ... } }`

Digunakan frontend untuk restore sesi dari `localStorage` saat halaman reload.

---

### Laporan Gejala

#### `POST /api/laporan`
Auth: JWT required | Rate limit: `10/minute;50/hour` | Bisnis: 1 laporan / 4 hari per user

**Request:**
```json
{
  "lat": -6.2615, "lng": 106.8106,
  "nama_wilayah": "Kebayoran Baru",
  "demam": true, "batuk": true, "nyeri_otot": true,
  "sakit_tenggorokan": false, "pilek": false,
  "kelelahan": true, "sakit_kepala": true,
  "menggigil": false, "mual_muntah": false, "sesak_napas": false,
  "durasi_hari": 3,
  "tingkat_keparahan": 7,
  "sudah_vaksin": false,
  "kelompok_usia": "dewasa"
}
```

**Response 201:**
```json
{
  "pesan": "Laporan berhasil dikirim.",
  "laporan": { ... },
  "skor_influenza": 70
}
```

**Response 429 (batas 4 hari):**
```json
{
  "pesan": "Anda sudah melaporkan dalam 4 hari terakhir. Laporan berikutnya bisa dikirim dalam 71 jam.",
  "waktu_berikutnya": "2025-02-20T10:30:00+00:00",
  "sisa_jam": 71.2
}
```

---

#### `GET /api/laporan`
Public | Rate limit: `60/minute`

**Query params:**
- `jam` (int, default 48, max 720) — filter laporan dalam N jam terakhir
- `limit` (int, default 200, max 1000)

**Response 200:**
```json
{
  "jumlah": 150,
  "laporan": [{ "id", "lat", "lng", "gejala", "skor_influenza", "timestamp", ... }]
}
```

---

#### `GET /api/laporan/statistik`
Public | Rate limit: `60/minute`

**Response 200:**
```json
{
  "kasus_24jam": 45,
  "kasus_48jam": 89,
  "kasus_7hari": 312,
  "kasus_total": 912,
  "kasus_aktif": 67,
  "kasus_ringan": 22,
  "trend_persen": 12.5,
  "laju_per_jam": 1.9,
  "rata_skor_48jam": 65.3,
  "indeks_risiko": 6.5,
  "gejala_dominan": [
    { "gejala": "demam", "jumlah": 78, "persen": 87.6 }
  ],
  "peringatan": [
    { "wilayah": "Menteng", "gejala": ["demam","menggigil"], "keparahan": 9, "timestamp": "..." }
  ]
}
```

**Kalkulasi `trend_persen`:**
```
trend = ((kasus_24jam - kasus_24_48jam_lalu) / kasus_24_48jam_lalu) × 100
```

---

### Peta

#### `GET /api/peta`
Public | Rate limit: `60/minute`

**Query params:** `jam` (default 48)

**Response 200:**
```json
{
  "titik": [
    { "lat": -6.2615, "lng": 106.8106, "bobot": 0.70 }
  ],
  "markers": [
    {
      "lat": -6.2615, "lng": 106.8106,
      "keparahan": 7, "skor": 70,
      "gejala": ["demam", "batuk"],
      "wilayah": "Kebayoran Baru",
      "usia": "dewasa",
      "timestamp": "2025-02-16T08:30:00+00:00",
      "baru": true
    }
  ]
}
```

`baru = true` jika `timestamp < 2 jam` — digunakan frontend untuk animasi pulse.

---

### AI Agent

#### `POST /api/analisis`
Public | Rate limit: `5/minute;20/hour`

**Request:**
```json
{
  "lat": -6.2615,
  "lng": 106.8106,
  "pertanyaan": "Apakah ada wabah influenza di dekat saya?",
  "radius_km": 10,
  "jam": 48
}
```

**Clamping:** `radius_km` → [1.0, 50.0] · `jam` → [1, 168]

**Response 200:**
```json
{
  "jawaban": "Berdasarkan data surveilans kami, terdapat 23 kasus...",
  "jumlah_kasus": 23,
  "radius_km": 10,
  "jam": 48,
  "laporan_terdekat": [...]
}
```

**Errors:** `502` (OpenRouter gagal) · `503` (API key tidak dikonfigurasi)

---

### Admin

Semua endpoint membutuhkan JWT + `role == 'admin'`. Dijaga oleh decorator `@admin_required`.

| Method | Endpoint | Fungsi |
|--------|----------|--------|
| `GET` | `/api/admin/pengguna` | List pengguna (paginated, searchable) |
| `PATCH` | `/api/admin/pengguna/:id` | Ubah role / is_active |
| `DELETE` | `/api/admin/pengguna/:id` | Hapus akun (proteksi self-delete) |
| `GET` | `/api/admin/laporan` | List laporan (filter waktu + user_id) |
| `DELETE` | `/api/admin/laporan/:id` | Hapus satu laporan |

**Query params `GET /api/admin/pengguna`:**
- `halaman` (default 1)
- `per_halaman` (default 20, max 100)
- `cari` — filter `username ILIKE '%cari%' OR email ILIKE '%cari%'`

**Query params `GET /api/admin/laporan`:**
- `halaman`, `per_halaman` (max 200)
- `jam` (0 = semua waktu)
- `user_id` — filter per pengguna spesifik

---

## 5. AI Agent & Grounding

### Masalah yang Diselesaikan

LLM generik menjawab pertanyaan seperti "apakah ada flu di Menteng?" dengan informasi umum, bukan data nyata. FluWatch menyelesaikan ini dengan **context injection**: data dari DB diformat dan disertakan dalam setiap prompt.

### Pipeline AI

```
Pertanyaan user
       │
       ▼
Query PostgreSQL (bounding box + Haversine)
       │
       ▼
Format blok konteks terstruktur
       │
       ▼
System Prompt + Konteks DB + Pertanyaan
       │
       ▼
OpenRouter API (LLM)
       │
       ▼
Jawaban berbasis data konkret (plain text, Bahasa Indonesia)
```

### Format Konteks Database

```
═══ DATA SURVEILANS FLUWATCH ═══
Lokasi query  : (-6.2615, 106.8106)
Radius        : 10 km
Jendela waktu : 48 jam terakhir

─── RINGKASAN KASUS ───
Total kasus          : 23
12 jam terakhir      : 8 kasus baru
24 jam terakhir      : 15 kasus
Rata-rata keparahan  : 6.8 / 10
Rata-rata skor risiko: 72 / 100

─── GEJALA PALING BANYAK DILAPORKAN ───
  • Demam: 19 laporan
  • Batuk: 15 laporan
  • Nyeri Otot: 12 laporan

─── DETAIL KASUS (terdekat duluan) ───
  1. Jarak: 0.8 km | Keparahan: 9/10 | Gejala: Demam, Batuk, Menggigil | Usia: dewasa
  ...
```

### System Prompt

System prompt mendefinisikan:
1. Identitas AI: "FluWatch AI, Agen Analis Data Medis"
2. Framework risiko (0 / 1-2 / 3-10 / 11-25 / 25+ kasus)
3. Panduan pengobatan: dosis obat, istirahat, tanda bahaya IGD
4. Panduan pencegahan: vaksinasi, cuci tangan, masker, pola hidup
5. Aturan: tidak diagnosis, selalu bahasa Indonesia, plain text only, temperature 0.3

### Parameter LLM

```python
{
    "model":       "upstage/solar-pro-3:free",
    "temperature": 0.3,    # rendah = faktual, deterministik
    "max_tokens":  1024,
}
```

---

## 6. Filter Geospasial Haversine

Query SQL murni dengan `lat BETWEEN` lambat jika tidak ada index dan tidak akurat karena bumi bulat. FluWatch menggunakan **2-tahap** yang optimal:

### Tahap 1 — Bounding Box (SQL, cepat)

```python
def kotak_batas(lat, lng, radius_km):
    delta = radius_km / 111.0   # 1 derajat ≈ 111 km
    return {
        "min_lat": lat - delta, "max_lat": lat + delta,
        "min_lng": lng - delta, "max_lng": lng + delta,
    }
```

Query memanfaatkan index komposit `idx_laporan_lokasi (lat, lng)` → sangat cepat.

### Tahap 2 — Haversine Exact (Python)

```python
from math import radians, sin, cos, sqrt, atan2

def hitung_jarak(lat1, lon1, lat2, lon2) -> float:
    R = 6371  # radius bumi km
    phi1, phi2 = radians(lat1), radians(lat2)
    dphi = radians(lat2 - lat1)
    dlam = radians(lon2 - lon1)
    a = sin(dphi/2)**2 + cos(phi1) * cos(phi2) * sin(dlam/2)**2
    return R * 2 * atan2(sqrt(a), sqrt(1-a))
```

Kandidat dari bounding box difilter ulang dengan jarak lingkaran bumi yang sesungguhnya.

### Mengapa 2 Tahap?

Bounding box menghasilkan persegi, Haversine menghasilkan lingkaran. Laporan di sudut persegi (lebih jauh dari radius) dibuang di tahap 2. Kombinasi ini menghindari full table scan sekaligus memberikan akurasi geometri yang benar.

---

## 7. Autentikasi JWT

### Flow

```
[Daftar/Login]
     │
     ▼
Backend generate JWT (flask-jwt-extended)
     │
     ▼
Frontend simpan token di localStorage["fluwatch_token"]
     │
     ▼
Setiap request → Axios interceptor tambahkan:
    Authorization: Bearer <token>
     │
     ▼
Backend: @jwt_required() verifikasi tanda tangan JWT
     │
     ▼
get_jwt_identity() → user_id (UUID string)
```

### Konfigurasi JWT

```python
app.config["JWT_SECRET_KEY"]           = config.JWT_SECRET_KEY
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24)
app.config["JWT_TOKEN_LOCATION"]       = ["headers"]
app.config["JWT_HEADER_NAME"]          = "Authorization"
app.config["JWT_HEADER_TYPE"]          = "Bearer"
```

### Validasi Token di Frontend

```javascript
// AuthContext.jsx — restore sesi saat halaman reload
useEffect(() => {
    const token = localStorage.getItem("fluwatch_token");
    if (!token) { setLoading(false); return; }

    sayaAPI()                              // GET /api/auth/saya
      .then(data => setPengguna(data.pengguna))
      .catch(() => localStorage.removeItem("fluwatch_token"))
      .finally(() => setLoading(false));
}, []);
```

### Admin Guard

```python
# routes/admin.py
def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user_id  = get_jwt_identity()
        pengguna = db.session.get(Pengguna, user_id)
        if not pengguna or pengguna.role != "admin":
            return jsonify({"pesan": "Akses ditolak."}), 403
        return fn(*args, **kwargs)
    return wrapper
```

---

## 8. Keamanan

### Rate Limiting

```python
# extensions.py
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["300/hour", "60/minute"],
    storage_uri="memory://",      # in-memory, reset saat server restart
    headers_enabled=True,         # X-RateLimit-* headers di response
)
```

Per-endpoint override:

```python
@laporan_bp.post("")
@jwt_required()
@limiter.limit("10/minute;50/hour")   # lebih ketat dari default
def kirim_laporan(): ...

@ai_bp.post("")
@limiter.limit("5/minute;20/hour")    # AI mahal, paling ketat
def analisis(): ...
```

### Content Security Policy

```python
CSP = {
    "default-src": "'self'",
    "script-src":  ["'self'", "'unsafe-inline'"],
    "img-src":     ["'self'", "data:", "*.tile.openstreetmap.org", "*.basemaps.cartocdn.com"],
    "connect-src": ["'self'", "nominatim.openstreetmap.org", "openrouter.ai"],
    "frame-ancestors": "'none'",
}
```

### IP Hashing

```python
# utils/security.py
import hashlib

def hash_ip() -> str:
    ip = request.headers.get("X-Forwarded-For", request.remote_addr)
    ip = ip.split(",")[0].strip()
    return hashlib.sha256(ip.encode()).hexdigest()[:16]
```

16 karakter pertama SHA-256 disimpan — tidak bisa di-reverse ke IP asli.

### Password Hashing

```python
# models.py — Pengguna
from werkzeug.security import generate_password_hash, check_password_hash

def set_password(self, password: str):
    self.password_hash = generate_password_hash(password)
    # Output: "pbkdf2:sha256:600000$salt$hash"

def cek_password(self, password: str) -> bool:
    return check_password_hash(self.password_hash, password)
```

Werkzeug menggunakan PBKDF2-SHA256 dengan 600.000 iterasi secara default — aman untuk Python 3.14 tanpa Rust dependency.

### Batas 4 Hari Per User (DB-Level)

```python
batas_waktu = datetime.now(timezone.utc) - timedelta(days=4)
laporan_terakhir = LaporanInfluenza.query.filter(
    LaporanInfluenza.user_id == user_id,
    LaporanInfluenza.timestamp >= batas_waktu,
).first()

if laporan_terakhir:
    waktu_berikutnya = laporan_terakhir.timestamp + timedelta(days=4)
    sisa_jam = (waktu_berikutnya - datetime.now(timezone.utc)).total_seconds() / 3600
    return jsonify({...}), 429
```

Batas ini **tidak** menggunakan `flask-limiter` karena:
- Limiter berbasis IP, reset saat server restart
- Implementasi DB-level bertahan meski server di-restart
- Bisa tracking per `user_id`, bukan per IP

---

## 9. Frontend React

### State Management

Tidak menggunakan Redux atau Zustand — cukup React Context + useState karena state relatif sederhana.

```
AuthContext                    ← global: user info, token
App.jsx useState               ← lokal: tab aktif, modal, lokasi, waktu filter
PetaHeatmap.jsx useState       ← lokal: data peta, layer toggle, loading
DashboardStats.jsx useState    ← lokal: data statistik
AnalisisAI.jsx useState        ← lokal: riwayat chat, loading, radius
```

### AuthContext

```jsx
// src/contexts/AuthContext.jsx
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [pengguna, setPengguna] = useState(null);
    const [loading, setLoading]   = useState(true);

    // Restore sesi dari localStorage saat mount
    useEffect(() => {
        const token = localStorage.getItem("fluwatch_token");
        if (!token) { setLoading(false); return; }
        sayaAPI()
            .then(d => setPengguna(d.pengguna))
            .catch(() => localStorage.removeItem("fluwatch_token"))
            .finally(() => setLoading(false));
    }, []);

    const login = async (email, password) => {
        const data = await masukAPI({ email, password });
        localStorage.setItem("fluwatch_token", data.token);
        setPengguna(data.pengguna);
        return data;
    };
    // ...
}

export const useAuth = () => useContext(AuthContext);
```

### API Service (Axios)

```javascript
// src/services/api.js
const http = axios.create({ baseURL: "/api", timeout: 30_000 });

// Request interceptor: lampirkan JWT otomatis
http.interceptors.request.use((config) => {
    const token = localStorage.getItem("fluwatch_token");
    if (token) config.headers["Authorization"] = `Bearer ${token}`;
    return config;
});

// Response interceptor: normalisasi error
http.interceptors.response.use(
    (r) => r,
    (err) => Promise.reject(
        new Error(err?.response?.data?.pesan || err?.message)
    )
);
```

### Peta Heatmap (Leaflet)

```jsx
// PetaHeatmap.jsx — Layer Heatmap
<LayerHeatmap
    points={data.titik.map(t => [t.lat, t.lng, t.bobot])}
    options={{
        radius: 35,
        blur: 25,
        minOpacity: 0.45,
        gradient: {
            0.0: "#0000ff",  // biru — sangat rendah
            0.3: "#00ff00",  // hijau — rendah
            0.5: "#ffff00",  // kuning — sedang
            0.7: "#ff8800",  // oranye — tinggi
            1.0: "#ff0000",  // merah — sangat tinggi
        }
    }}
/>
```

### Vite Config (Proxy + Multi Entry)

```javascript
// vite.config.js
export default defineConfig({
    plugins: [react()],
    build: {
        rollupOptions: {
            input: {
                main:  resolve(__dirname, "index.html"),   // app utama
                admin: resolve(__dirname, "admin.html"),   // panel admin
            },
        },
    },
    server: {
        proxy: {
            "/api": {
                target: "http://localhost:5000",
                changeOrigin: true,
            },
        },
    },
});
```

Multi-entry Vite menghindari `react-router-dom` — admin panel dikompilasi sebagai bundle terpisah.

---

## 10. Admin Panel

Diakses di `/admin.html`, dikompilasi sebagai Vite entry terpisah.

### Proteksi Akses

```jsx
// AdminApp.jsx
const { pengguna, isAdmin, loading } = useAuth();

if (loading) return <Loading />;
if (!isAdmin) return <LoginWall />;   // form login khusus admin
return <DashboardAdmin />;
```

Setelah login berhasil sebagai non-admin, `isAdmin = false` → tetap tampilkan login wall dengan pesan "Akses Ditolak".

### Fitur Admin Panel

**Tab Manajemen Pengguna:**
- Tabel paginated (20/halaman) dengan search username/email
- Dropdown ubah role (`pengguna` ↔ `admin`) — `PATCH /api/admin/pengguna/:id`
- Toggle aktif/nonaktif — `PATCH` dengan `{ is_active: bool }`
- Hapus akun dengan konfirmasi browser — `DELETE /api/admin/pengguna/:id`
- Proteksi: admin tidak bisa edit/hapus dirinya sendiri

**Tab Data Laporan:**
- Filter waktu: Semua / 24 Jam / 7 Hari / 30 Hari
- Filter per `user_id`
- Skor berwarna: merah (≥70), oranye (40–69), hijau (<40)
- Hapus laporan individual — `DELETE /api/admin/laporan/:id`

---

## 11. Konfigurasi & Deployment

### Environment Variables Lengkap

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/fluwatch_db

# Flask
SECRET_KEY=<random 32 chars>
FLASK_DEBUG=false

# JWT
JWT_SECRET_KEY=<random 64 chars, berbeda dari SECRET_KEY>
JWT_ACCESS_TOKEN_EXPIRES_HOURS=24

# OpenRouter
OPENROUTER_API_KEY=sk-or-xxxxxxxxxxxxx
AI_MODEL=upstage/solar-pro-3:free

# App URLs
APP_URL=https://fluwatch.domain.com
FRONTEND_URL=https://fluwatch.domain.com

# Defaults
RADIUS_KM_DEFAULT=10
JAM_DEFAULT=48
```

### Development

```bash
# Backend
cd backend && python run.py

# Frontend
cd frontend && npm run dev
```

### Production dengan Gunicorn + Nginx

```bash
# Backend
gunicorn -w 4 -b 0.0.0.0:5000 app:app

# Build frontend
cd frontend && npm run build
# Output: frontend/dist/index.html dan frontend/dist/admin.html
```

Nginx config (ringkas):

```nginx
server {
    listen 80;
    server_name fluwatch.domain.com;

    # Serve static frontend
    root /path/to/frontend/dist;
    index index.html;

    # Proxy API ke Flask
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Admin panel
    location /admin.html {
        try_files /admin.html =404;
    }

    # SPA fallback
    location / {
        try_files $uri /index.html;
    }
}
```

---

## 12. Migrasi Database

### Setup Awal (Pertama Kali)

```bash
cd backend
python setup_db.py          # hanya buat tabel
python setup_db.py --seed   # buat tabel + isi 912 data contoh
```

`setup_db.py --seed` mengisi:
- **104 kluster** wilayah (Jabodetabek + 7 kota besar)
- **8 laporan per kluster** tersebar dalam 7 hari terakhir
- **80 laporan sangat baru** (< 6 jam) di 8 kota besar untuk demo heatmap aktif
- Total: **~912 laporan** dengan variasi gejala, usia, dan keparahan

### Migrasi Kolom Baru

```bash
cd backend
python migrasi.py
```

`migrasi.py` menjalankan SQL dengan `IF NOT EXISTS` — aman dijalankan berulang:

```sql
-- Tambah kolom ip_hash
ALTER TABLE laporan_influenza ADD COLUMN IF NOT EXISTS ip_hash VARCHAR(16);
CREATE INDEX IF NOT EXISTS idx_laporan_ip_hash ON laporan_influenza (ip_hash);

-- Buat tabel pengguna (auth)
CREATE TABLE IF NOT EXISTS pengguna ( ... );
CREATE INDEX IF NOT EXISTS idx_pengguna_email ON pengguna (email);
CREATE INDEX IF NOT EXISTS idx_pengguna_username ON pengguna (username);

-- Tambah FK user_id ke laporan (nullable, backward compat)
ALTER TABLE laporan_influenza ADD COLUMN IF NOT EXISTS
    user_id UUID DEFAULT NULL REFERENCES pengguna(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_laporan_user_id ON laporan_influenza (user_id);
```

### Membuat Akun Admin Pertama

Setelah server berjalan dan user mendaftar:

```sql
UPDATE pengguna
SET role = 'admin'
WHERE email = 'admin@domain.com';
```

Atau via Python shell:

```python
from app import buat_app
from models import db, Pengguna

app = buat_app()
with app.app_context():
    u = Pengguna.query.filter_by(email="admin@domain.com").first()
    u.role = "admin"
    db.session.commit()
    print("Done:", u.to_dict())
```

---

## Catatan Kompatibilitas Python 3.14

Paket yang **tidak** boleh digunakan (Rust-compiled wheel, tidak tersedia untuk cp314):

| Paket | Alasan Dihindari | Alternatif |
|-------|-----------------|------------|
| `pydantic` | `pydantic-core` butuh Rust | Validasi manual dengan Python native |
| `bcrypt` | C extension | `werkzeug.security` (PBKDF2) |
| `cryptography` | C extension | stdlib `hashlib` untuk SHA-256 |

Semua dependency di `requirements.txt` telah diverifikasi kompatibel dengan Python 3.14.

---

*FluWatch.AI Technical Documentation v1.0.0*
