"""
POST /api/analisis  — AI Agent analisis penyebaran berbasis data lokal
"""
from datetime import datetime, timedelta, timezone
from flask import Blueprint, jsonify, request, session
from flask_jwt_extended import jwt_required
from extensions import limiter
from config import config
from models import LaporanInfluenza
from utils.haversine import kotak_batas, filter_radius
from utils.openrouter import tanya_ai_agent

ai_bp = Blueprint("ai", __name__, url_prefix="/api/analisis")


@ai_bp.post("")
@jwt_required()
@limiter.limit("5/minute;20/hour")    # AI mahal — batasi lebih ketat
def analisis():
    """
    Endpoint AI Agent utama.

    Body JSON:
    {
        "lat":       -6.2615,
        "lng":       106.8106,
        "pertanyaan": "Apakah ada wabah influenza di dekat saya?",
        "radius_km":  10,     // opsional, default dari config
        "jam":        48      // opsional, default 48
    }

    Respons:
    {
        "jawaban":          "Berdasarkan data kami, terdapat X kasus...",
        "jumlah_kasus":     7,
        "radius_km":        10,
        "jam":              48,
        "laporan_terdekat": [...]
    }
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"pesan": "Body harus JSON yang valid"}), 400

    pertanyaan = (data.get("pertanyaan") or "").strip()
    if not pertanyaan:
        return jsonify({"pesan": "Field 'pertanyaan' wajib diisi"}), 400

    try:
        lat = float(data["lat"])
        lng = float(data["lng"])
    except (KeyError, ValueError, TypeError):
        return jsonify({"pesan": "lat dan lng wajib diisi"}), 400

    if not (-90 <= lat <= 90) or not (-180 <= lng <= 180):
        return jsonify({"pesan": "Nilai lat/lng tidak valid"}), 400

    try:
        radius_km = float(data.get("radius_km", config.RADIUS_KM_DEFAULT))
        radius_km = max(1.0, min(radius_km, 50.0))
    except (ValueError, TypeError):
        radius_km = config.RADIUS_KM_DEFAULT

    try:
        jam = int(data.get("jam", config.JAM_DEFAULT))
        jam = max(1, min(jam, 168))
    except (ValueError, TypeError):
        jam = config.JAM_DEFAULT

    # ── Langkah 1: Pre-filter bounding box (SQL cepat) ────
    bbox   = kotak_batas(lat, lng, radius_km)
    cutoff = datetime.now(timezone.utc) - timedelta(hours=jam)

    kandidat = (
        LaporanInfluenza.query
        .filter(
            LaporanInfluenza.lat       >= bbox["min_lat"],
            LaporanInfluenza.lat       <= bbox["max_lat"],
            LaporanInfluenza.lng       >= bbox["min_lng"],
            LaporanInfluenza.lng       <= bbox["max_lng"],
            LaporanInfluenza.timestamp >= cutoff,
        )
        .order_by(LaporanInfluenza.timestamp.desc())
        .all()
    )

    # ── Langkah 2: Filter Haversine akurat (Python) ───────
    laporan_terdekat = filter_radius(kandidat, lat, lng, radius_km)

    # ── Langkah 3: Panggil OpenRouter dengan konteks DB ───
    if not config.OPENROUTER_API_KEY:
        return jsonify({"pesan": "OPENROUTER_API_KEY belum dikonfigurasi di server"}), 503

    try:
        jawaban = tanya_ai_agent(
            pertanyaan=pertanyaan,
            laporan_terdekat=laporan_terdekat,
            lat=lat,
            lng=lng,
            radius_km=radius_km,
            jam=jam,
        )
    except Exception as e:
        return jsonify({"pesan": f"Kesalahan layanan AI: {str(e)}"}), 502

    return jsonify({
        "jawaban":          jawaban,
        "jumlah_kasus":     len(laporan_terdekat),
        "radius_km":        radius_km,
        "jam":              jam,
        "laporan_terdekat": laporan_terdekat,
    })
