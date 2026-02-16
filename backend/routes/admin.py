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

@admin_bp.get("/laporan")
@admin_required
def daftar_laporan():
    """Daftar laporan paginated dengan filter jam & user_id."""
    halaman  = int(request.args.get("halaman", 1))
    per_hal  = min(int(request.args.get("per_halaman", 20)), 100)
    jam      = request.args.get("jam")
    user_id  = request.args.get("user_id")

    q = LaporanInfluenza.query
    if jam:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=int(jam))
        q = q.filter(LaporanInfluenza.timestamp >= cutoff)
    if user_id:
        q = q.filter(LaporanInfluenza.user_id == user_id)

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
