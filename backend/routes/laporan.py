"""
POST /api/laporan  — Kirim laporan gejala baru (JWT required)
GET  /api/laporan  — Ambil laporan terbaru
GET  /api/laporan/statistik — Statistik agregat untuk dashboard
"""
from datetime import datetime, timedelta, timezone
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import func
from extensions import limiter
from models import LaporanInfluenza, Pengguna, _hitung_skor, db
from utils.security import hash_ip

laporan_bp = Blueprint("laporan", __name__, url_prefix="/api/laporan")

USIA_VALID = {"anak", "remaja", "dewasa", "lansia"}


@laporan_bp.post("")
@jwt_required()
@limiter.limit("10/minute;50/hour")   # maks 10 laporan/menit, 50/jam per IP
def kirim_laporan():
    """
    Terima laporan gejala dari form kuesioner frontend.

    Body JSON:
    {
        "lat": -6.2615,
        "lng": 106.8106,
        "nama_wilayah": "Kebayoran Baru",   // opsional
        "demam": true,
        "batuk": true,
        "sakit_tenggorokan": false,
        "pilek": false,
        "nyeri_otot": true,
        "sakit_kepala": true,
        "kelelahan": true,
        "menggigil": false,
        "mual_muntah": false,
        "sesak_napas": false,
        "durasi_hari": 3,
        "tingkat_keparahan": 7,
        "sudah_vaksin": false,
        "kelompok_usia": "dewasa"
    }
    """
    # ── Ambil identitas pengguna ──────────────────────────
    user_id  = get_jwt_identity()
    pengguna = db.session.get(Pengguna, user_id)
    if not pengguna or not pengguna.is_active:
        return jsonify({"pesan": "Akun tidak valid atau telah dinonaktifkan"}), 403

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"pesan": "Body harus JSON yang valid"}), 400

    # ── Validasi koordinat ────────────────────────────────
    try:
        lat = float(data["lat"])
        lng = float(data["lng"])
    except (KeyError, ValueError, TypeError):
        return jsonify({"pesan": "lat dan lng wajib diisi dan harus berupa angka"}), 400

    if not (-90 <= lat <= 90) or not (-180 <= lng <= 180):
        return jsonify({"pesan": "Nilai lat/lng di luar jangkauan yang valid"}), 400

    # ── Validasi gejala — minimal 1 harus True ────────────
    gejala_fields = LaporanInfluenza.GEJALA_FIELDS
    gejala_data   = {g: bool(data.get(g, False)) for g in gejala_fields}
    if not any(gejala_data.values()):
        return jsonify({"pesan": "Pilih minimal satu gejala"}), 400

    # ── Validasi keparahan ────────────────────────────────
    try:
        keparahan = int(data.get("tingkat_keparahan", 5))
        if not (1 <= keparahan <= 10):
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({"pesan": "Tingkat keparahan harus angka 1–10"}), 400

    # ── Validasi durasi ───────────────────────────────────
    durasi = data.get("durasi_hari")
    if durasi is not None:
        try:
            durasi = int(durasi)
            if not (1 <= durasi <= 30):
                durasi = None
        except (ValueError, TypeError):
            durasi = None

    # ── Kelompok usia ─────────────────────────────────────
    usia = data.get("kelompok_usia", "dewasa")
    if usia not in USIA_VALID:
        usia = "dewasa"

    # ── Cek batas 1 laporan per 4 hari ───────────────────
    batas_waktu = datetime.now(timezone.utc) - timedelta(days=4)
    laporan_terakhir = LaporanInfluenza.query.filter(
        LaporanInfluenza.user_id == user_id,
        LaporanInfluenza.timestamp >= batas_waktu,
    ).first()

    if laporan_terakhir:
        waktu_berikutnya = laporan_terakhir.timestamp + timedelta(days=4)
        sisa_jam = (waktu_berikutnya - datetime.now(timezone.utc)).total_seconds() / 3600
        return jsonify({
            "pesan":           f"Anda sudah melaporkan dalam 4 hari terakhir. Laporan berikutnya bisa dikirim dalam {int(sisa_jam)+1} jam.",
            "waktu_berikutnya": waktu_berikutnya.isoformat(),
            "sisa_jam":        round(sisa_jam, 1),
        }), 429

    # ── Hitung skor risiko influenza ──────────────────────
    skor = _hitung_skor(gejala_data)

    # ── Simpan ke database ────────────────────────────────
    laporan = LaporanInfluenza(
        lat=lat,
        lng=lng,
        nama_wilayah=data.get("nama_wilayah"),
        tingkat_keparahan=keparahan,
        durasi_hari=durasi,
        sudah_vaksin=data.get("sudah_vaksin"),
        kelompok_usia=usia,
        skor_influenza=skor,
        ip_hash=hash_ip(),              # simpan hash IP (bukan IP asli)
        user_id=user_id,
        timestamp=datetime.now(timezone.utc),
        **gejala_data,
    )
    db.session.add(laporan)
    db.session.commit()

    return jsonify({
        "pesan":   "Laporan berhasil dikirim. Terima kasih telah membantu pemantauan influenza.",
        "laporan": laporan.to_dict(),
        "skor_influenza": skor,
    }), 201


@laporan_bp.get("")
@limiter.limit("60/minute")
def ambil_laporan():
    """Ambil laporan terbaru. Query param: jam (default 48), limit (default 200)."""
    try:
        jam   = min(int(request.args.get("jam",   48)), 720)
        limit = min(int(request.args.get("limit", 200)), 1000)
    except ValueError:
        return jsonify({"pesan": "Parameter tidak valid"}), 400

    cutoff = datetime.now(timezone.utc) - timedelta(hours=jam)
    rows = (
        LaporanInfluenza.query
        .filter(LaporanInfluenza.timestamp >= cutoff)
        .order_by(LaporanInfluenza.timestamp.desc())
        .limit(limit)
        .all()
    )
    return jsonify({"jumlah": len(rows), "laporan": [r.to_dict() for r in rows]})


@laporan_bp.get("/statistik")
@limiter.limit("60/minute")
def statistik():
    """Statistik agregat untuk kartu dashboard."""
    now = datetime.now(timezone.utc)

    def hitung(jam):
        return LaporanInfluenza.query.filter(
            LaporanInfluenza.timestamp >= now - timedelta(hours=jam)
        ).count()

    total_24j   = hitung(24)
    total_48j   = hitung(48)
    total_7h    = hitung(168)
    total_semua = LaporanInfluenza.query.count()

    # Kasus periode sebelumnya (24–48 jam lalu) untuk trend
    kasus_24j_lalu = LaporanInfluenza.query.filter(
        LaporanInfluenza.timestamp >= now - timedelta(hours=48),
        LaporanInfluenza.timestamp <  now - timedelta(hours=24),
    ).count()

    # Trend persentase perubahan
    if kasus_24j_lalu > 0:
        trend_persen = round(((total_24j - kasus_24j_lalu) / kasus_24j_lalu) * 100, 1)
    else:
        trend_persen = 0

    # Kasus aktif (severity >= 5, 48 jam) vs kasus ringan (severity < 5)
    cutoff_48 = now - timedelta(hours=48)
    kasus_aktif = LaporanInfluenza.query.filter(
        LaporanInfluenza.timestamp >= cutoff_48,
        LaporanInfluenza.tingkat_keparahan >= 5,
    ).count()
    kasus_ringan = LaporanInfluenza.query.filter(
        LaporanInfluenza.timestamp >= cutoff_48,
        LaporanInfluenza.tingkat_keparahan < 5,
    ).count()

    # Laju gejala per jam
    laju_per_jam = round(total_24j / 24, 1)

    # Rata-rata skor
    rata_skor = db.session.query(func.avg(LaporanInfluenza.skor_influenza)).filter(
        LaporanInfluenza.timestamp >= cutoff_48
    ).scalar()
    rata_skor_val = round(float(rata_skor), 1) if rata_skor else 0

    # Indeks risiko 0–10
    indeks_risiko = round(min(rata_skor_val / 10, 10), 1)

    # Gejala dominan (48 jam)
    baris = LaporanInfluenza.query.filter(LaporanInfluenza.timestamp >= cutoff_48).all()
    freq_gejala = {}
    for r in baris:
        for g in r.gejala_aktif():
            freq_gejala[g] = freq_gejala.get(g, 0) + 1
    top5 = sorted(freq_gejala.items(), key=lambda x: x[1], reverse=True)[:5]

    # Persentase tiap gejala dari total kasus
    gejala_persen = []
    for g, c in top5:
        persen = round((c / total_48j * 100) if total_48j > 0 else 0, 1)
        gejala_persen.append({"gejala": g, "jumlah": c, "persen": persen})

    # Laporan terbaru untuk peringatan
    terbaru = (
        LaporanInfluenza.query
        .order_by(LaporanInfluenza.timestamp.desc())
        .limit(3)
        .all()
    )
    peringatan = []
    for r in terbaru:
        peringatan.append({
            "wilayah":   r.nama_wilayah or "Area Tidak Diketahui",
            "gejala":    r.gejala_aktif()[:2],
            "keparahan": r.tingkat_keparahan,
            "timestamp": r.timestamp.isoformat(),
        })

    return jsonify({
        "kasus_24jam":     total_24j,
        "kasus_48jam":     total_48j,
        "kasus_7hari":     total_7h,
        "kasus_total":     total_semua,
        "kasus_aktif":     kasus_aktif,
        "kasus_ringan":    kasus_ringan,
        "trend_persen":    trend_persen,
        "laju_per_jam":    laju_per_jam,
        "rata_skor_48jam": rata_skor_val,
        "indeks_risiko":   indeks_risiko,
        "gejala_dominan":  gejala_persen,
        "peringatan":      peringatan,
    })
