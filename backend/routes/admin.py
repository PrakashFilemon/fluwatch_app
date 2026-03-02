"""
GET    /api/admin/pengguna        — Daftar pengguna paginated
PATCH  /api/admin/pengguna/<id>   — Ubah role / is_active
DELETE /api/admin/pengguna/<id>   — Hapus pengguna
GET    /api/admin/laporan         — Daftar laporan paginated
DELETE /api/admin/laporan/<id>    — Hapus laporan
"""
from functools import wraps
from datetime import datetime, timedelta, timezone

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from models import LaporanInfluenza, Pengguna, db

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


def admin_required(fn):
    """Decorator: JWT valid + role == 'admin'."""
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user_id  = get_jwt_identity()
        pengguna = db.session.get(Pengguna, user_id)
        if not pengguna or pengguna.role != "admin":
            return jsonify({"pesan": "Akses ditolak. Hanya admin yang diizinkan."}), 403
        return fn(*args, **kwargs)
    return wrapper


# ── Pengguna ─────────────────────────────────────────────────────────────────

@admin_bp.get("/pengguna")
@admin_required
def daftar_pengguna():
    """Daftar pengguna paginated + filter cari."""
    halaman = int(request.args.get("halaman", 1))
    per_hal = min(int(request.args.get("per_halaman", 20)), 100)
    cari    = request.args.get("cari", "").strip()

    q = Pengguna.query
    if cari:
        pola = f"%{cari}%"
        q = q.filter(
            db.or_(Pengguna.username.ilike(pola), Pengguna.email.ilike(pola))
        )
    q      = q.order_by(Pengguna.created_at.desc())
    total  = q.count()
    baris  = q.offset((halaman - 1) * per_hal).limit(per_hal).all()

    return jsonify({
        "total":     total,
        "halaman":   halaman,
        "per_halaman": per_hal,
        "pengguna":  [p.to_dict() for p in baris],
    })


@admin_bp.patch("/pengguna/<uuid:id>")
@admin_required
def ubah_pengguna(id):
    """Ubah role atau is_active. Proteksi: admin tidak bisa degradasi diri sendiri."""
    admin_id = get_jwt_identity()
    if str(id) == admin_id:
        return jsonify({"pesan": "Admin tidak dapat mengubah status diri sendiri"}), 400

    pengguna = db.session.get(Pengguna, id)
    if not pengguna:
        return jsonify({"pesan": "Pengguna tidak ditemukan"}), 404

    data = request.get_json(silent=True) or {}
    if "role" in data:
        if data["role"] not in ("pengguna", "admin"):
            return jsonify({"pesan": "Role harus 'pengguna' atau 'admin'"}), 400
        pengguna.role = data["role"]
    if "is_active" in data:
        pengguna.is_active = bool(data["is_active"])

    db.session.commit()
    return jsonify({"pesan": "Pengguna diperbarui", "pengguna": pengguna.to_dict()}), 200


@admin_bp.delete("/pengguna/<uuid:id>")
@admin_required
def hapus_pengguna(id):
    """Hapus pengguna. Admin tidak bisa hapus diri sendiri."""
    admin_id = get_jwt_identity()
    if str(id) == admin_id:
        return jsonify({"pesan": "Admin tidak dapat menghapus akun diri sendiri"}), 400

    pengguna = db.session.get(Pengguna, id)
    if not pengguna:
        return jsonify({"pesan": "Pengguna tidak ditemukan"}), 404

    db.session.delete(pengguna)
    db.session.commit()
    return jsonify({"pesan": "Pengguna berhasil dihapus"}), 200


# ── Laporan ──────────────────────────────────────────────────────────────────

KELOMPOK_USIA_VALID = {"anak", "remaja", "dewasa", "lansia"}

@admin_bp.get("/laporan")
@admin_required
def daftar_laporan():
    """Daftar laporan paginated dengan filter jam, user_id, wilayah, kelompok_usia."""
    halaman      = int(request.args.get("halaman", 1))
    per_hal      = min(int(request.args.get("per_halaman", 20)), 100)
    jam          = request.args.get("jam")
    user_id      = request.args.get("user_id")
    wilayah      = request.args.get("wilayah", "").strip()
    kelompok_usia = request.args.get("kelompok_usia", "").strip()

    q = LaporanInfluenza.query
    if jam:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=int(jam))
        q = q.filter(LaporanInfluenza.timestamp >= cutoff)
    if user_id:
        q = q.filter(LaporanInfluenza.user_id == user_id)
    if wilayah:
        q = q.filter(LaporanInfluenza.nama_wilayah.ilike(f"%{wilayah}%"))
    if kelompok_usia and kelompok_usia in KELOMPOK_USIA_VALID:
        q = q.filter(LaporanInfluenza.kelompok_usia == kelompok_usia)

    q     = q.order_by(LaporanInfluenza.timestamp.desc())
    total = q.count()
    baris = q.offset((halaman - 1) * per_hal).limit(per_hal).all()

    return jsonify({
        "total":     total,
        "halaman":   halaman,
        "per_halaman": per_hal,
        "laporan":   [r.to_dict() for r in baris],
    })


@admin_bp.delete("/laporan/<uuid:id>")
@admin_required
def hapus_laporan(id):
    """Hapus satu laporan."""
    laporan = db.session.get(LaporanInfluenza, id)
    if not laporan:
        return jsonify({"pesan": "Laporan tidak ditemukan"}), 404

    db.session.delete(laporan)
    db.session.commit()
    return jsonify({"pesan": "Laporan berhasil dihapus"}), 200


# ── Dashboard Stats ───────────────────────────────────────────────────────────

@admin_bp.get("/stats")
@admin_required
def stats_overview():
    now = datetime.now(timezone.utc)
    bulan_ini_awal   = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    bulan_lalu_awal  = (bulan_ini_awal - timedelta(days=1)).replace(day=1)
    minggu_ini_awal  = now - timedelta(days=7)
    minggu_lalu_awal = now - timedelta(days=14)

    total_users    = Pengguna.query.count()
    total_laporan  = LaporanInfluenza.query.count()
    users_bln_ini  = Pengguna.query.filter(Pengguna.created_at >= bulan_ini_awal).count()
    users_bln_lalu = Pengguna.query.filter(
        Pengguna.created_at >= bulan_lalu_awal,
        Pengguna.created_at < bulan_ini_awal
    ).count()
    lap_mgg_ini    = LaporanInfluenza.query.filter(LaporanInfluenza.timestamp >= minggu_ini_awal).count()
    lap_mgg_lalu   = LaporanInfluenza.query.filter(
        LaporanInfluenza.timestamp >= minggu_lalu_awal,
        LaporanInfluenza.timestamp < minggu_ini_awal
    ).count()

    def pct(a, b): return round((a - b) / b * 100, 1) if b else (100.0 if a else 0.0)

    return jsonify({
        "total_users":   total_users,
        "total_laporan": total_laporan,
        "pct_users":     pct(users_bln_ini, users_bln_lalu),
        "pct_laporan":   pct(lap_mgg_ini, lap_mgg_lalu),
    })


@admin_bp.get("/laporan/trend")
@admin_required
def laporan_trend():
    from sqlalchemy import func, cast, Date
    mode = request.args.get("mode", "mingguan")
    now  = datetime.now(timezone.utc)

    if mode == "mingguan":
        cutoff = now - timedelta(days=6)
        rows = (db.session.query(
                    cast(LaporanInfluenza.timestamp, Date).label("hari"),
                    func.count().label("jumlah"))
                .filter(LaporanInfluenza.timestamp >= cutoff)
                .group_by("hari").order_by("hari").all())
        hasil = {str(r.hari): r.jumlah for r in rows}
        data = []
        for i in range(7):
            d = (now - timedelta(days=6 - i)).date()
            data.append({"label": d.strftime("%a"), "jumlah": hasil.get(str(d), 0)})
    else:  # bulanan — last 6 months
        data = []
        for i in range(5, -1, -1):
            m = (now.month - i - 1) % 12 + 1
            y = now.year + ((now.month - i - 1) // 12)
            month_start = datetime(y, m, 1, tzinfo=timezone.utc)
            if m == 12:
                month_end = datetime(y + 1, 1, 1, tzinfo=timezone.utc)
            else:
                month_end = datetime(y, m + 1, 1, tzinfo=timezone.utc)
            count = LaporanInfluenza.query.filter(
                LaporanInfluenza.timestamp >= month_start,
                LaporanInfluenza.timestamp < month_end
            ).count()
            data.append({"label": month_start.strftime("%b"), "jumlah": count})

    return jsonify({"mode": mode, "data": data})


@admin_bp.get("/aktivitas")
@admin_required
def aktivitas_terkini():
    lap = LaporanInfluenza.query.order_by(LaporanInfluenza.timestamp.desc()).limit(5).all()
    usr = Pengguna.query.order_by(Pengguna.created_at.desc()).limit(5).all()

    items = []
    for l in lap:
        items.append({
            "tipe":   "laporan",
            "judul":  f"Laporan baru dari {l.nama_wilayah or 'lokasi tidak diketahui'}",
            "detail": f"Skor influenza {l.skor_influenza}",
            "waktu":  l.timestamp.isoformat(),
        })
    for p in usr:
        items.append({
            "tipe":   "pengguna",
            "judul":  "User baru terdaftar",
            "detail": p.username,
            "waktu":  p.created_at.isoformat(),
        })
    items.sort(key=lambda x: x["waktu"], reverse=True)
    return jsonify({"aktivitas": items[:10]})
