"""
GET /api/peta  — Data titik heatmap + marker individual untuk Leaflet
"""
from datetime import datetime, timedelta, timezone
from flask import Blueprint, jsonify, request
from extensions import limiter
from models import LaporanInfluenza

peta_bp = Blueprint("peta", __name__, url_prefix="/api/peta")


@peta_bp.get("")
@limiter.limit("60/minute")
def data_peta():
    """
    Kembalikan:
      - titik  : array ringan untuk leaflet.heat  {lat, lng, bobot}
      - marker : array detail untuk CircleMarker  {lat, lng, keparahan, skor,
                                                   gejala, wilayah, timestamp,
                                                   baru}   ← baru=True jika < 2 jam
    """
    try:
        jam = int(request.args.get("jam", 48))
        jam = max(1, min(jam, 720))
    except ValueError:
        return jsonify({"pesan": "jam harus berupa angka bulat"}), 400

    now    = datetime.now(timezone.utc)
    cutoff = now - timedelta(hours=jam)
    batas_baru = now - timedelta(hours=2)

    rows = (
        LaporanInfluenza.query
        .filter(LaporanInfluenza.timestamp >= cutoff)
        .order_by(LaporanInfluenza.timestamp.desc())
        .limit(500)
        .all()
    )

    titik   = []
    markers = []

    for r in rows:
        lat = float(r.lat)
        lng = float(r.lng)
        bobot = round(r.skor_influenza / 100, 2)

        titik.append({"lat": lat, "lng": lng, "bobot": bobot})

        markers.append({
            "lat":       lat,
            "lng":       lng,
            "keparahan": r.tingkat_keparahan,
            "skor":      r.skor_influenza,
            "gejala":    r.gejala_aktif(),
            "wilayah":   r.nama_wilayah or "Area Tidak Diketahui",
            "usia":      r.kelompok_usia,
            "timestamp": r.timestamp.isoformat(),
            "baru":      r.timestamp >= batas_baru,
        })

    return jsonify({
        "jumlah":  len(titik),
        "jam":     jam,
        "titik":   titik,
        "markers": markers,
    })
