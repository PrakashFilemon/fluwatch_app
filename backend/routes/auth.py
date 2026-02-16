"""
POST /api/auth/daftar  — Registrasi pengguna baru
POST /api/auth/masuk   — Login
GET  /api/auth/saya    — Profil pengguna saat ini (JWT required)
"""
import re

from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required

from extensions import limiter
from models import Pengguna, db

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

_RE_USERNAME = re.compile(r"^[a-zA-Z0-9_]{3,50}$")
_RE_EMAIL    = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


@auth_bp.post("/daftar")
@limiter.limit("5/hour")
def daftar():
    """Registrasi pengguna baru."""
    data = request.get_json(silent=True) or {}

    username = str(data.get("username", "")).strip()
    email    = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))

    # ── Validasi ──────────────────────────────────────────
    if not _RE_USERNAME.match(username):
        return jsonify({"pesan": "Username harus 3–50 karakter (huruf, angka, underscore)"}), 400
    if not _RE_EMAIL.match(email):
        return jsonify({"pesan": "Format email tidak valid"}), 400
    if len(password) < 8:
        return jsonify({"pesan": "Password minimal 8 karakter"}), 400

    # ── Cek duplikat ──────────────────────────────────────
    if Pengguna.query.filter_by(email=email).first():
        return jsonify({"pesan": "Email atau username sudah terdaftar"}), 409
    if Pengguna.query.filter_by(username=username).first():
        return jsonify({"pesan": "Email atau username sudah terdaftar"}), 409

    # ── Buat pengguna ─────────────────────────────────────
    pengguna = Pengguna(username=username, email=email)
    pengguna.set_password(password)
    db.session.add(pengguna)
    db.session.commit()

    token = create_access_token(identity=str(pengguna.id))
    return jsonify({"token": token, "pengguna": pengguna.to_dict()}), 201


@auth_bp.post("/masuk")
@limiter.limit("10/minute;30/hour")
def masuk():
    """Login dengan email dan password."""
    data = request.get_json(silent=True) or {}

    email    = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))

    pengguna = Pengguna.query.filter_by(email=email).first()
    # Pesan generik — tidak bocorkan apakah email terdaftar
    if not pengguna or not pengguna.cek_password(password):
        return jsonify({"pesan": "Email atau password salah"}), 401
    if not pengguna.is_active:
        return jsonify({"pesan": "Akun Anda telah dinonaktifkan"}), 403

    token = create_access_token(identity=str(pengguna.id))
    return jsonify({"token": token, "pengguna": pengguna.to_dict()}), 200


@auth_bp.get("/saya")
@jwt_required()
def saya():
    """Kembalikan profil pengguna yang sedang login."""
    user_id  = get_jwt_identity()
    pengguna = db.session.get(Pengguna, user_id)
    if not pengguna:
        return jsonify({"pesan": "Pengguna tidak ditemukan"}), 404
    return jsonify({"pengguna": pengguna.to_dict()}), 200
