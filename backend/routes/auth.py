"""
POST /api/auth/daftar          — Registrasi pengguna baru
POST /api/auth/masuk           — Login
GET  /api/auth/saya            — Profil pengguna saat ini (JWT required)
POST /api/auth/google          — Login / daftar via Google OAuth
POST /api/auth/lupa-password   — Kirim link reset password ke email
POST /api/auth/reset-password  — Reset password dengan token
"""
import re
import secrets
import smtplib
from datetime import datetime, timedelta, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from config import config
from extensions import limiter
from models import Pengguna, db

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

_RE_USERNAME = re.compile(r"^[a-zA-Z0-9_]{3,50}$")
_RE_EMAIL    = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _kirim_email_reset(email: str, username: str, reset_url: str) -> None:
    """Kirim email reset password via SMTP."""
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Reset Password FluWatch.AI"
        msg["From"]    = config.MAIL_FROM
        msg["To"]      = email

        html = f"""
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#f0faf9;color:#1a2e2c;padding:32px;border-radius:12px;border:1px solid rgba(58,142,133,0.2);">
          <h2 style="color:#3A8E85;margin-bottom:8px;">FluWatch.AI</h2>
          <p style="color:#64748b;margin-bottom:24px;">Halo <strong style="color:#1a2e2c;">{username}</strong>,</p>
          <p style="margin-bottom:24px;">Kami menerima permintaan reset password untuk akun kamu. Klik tombol di bawah untuk membuat password baru:</p>
          <a href="{reset_url}"
             style="display:inline-block;background:linear-gradient(135deg,#3A8E85,#006B5F);color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;margin-bottom:24px;">
            Reset Password
          </a>
          <p style="color:#64748b;font-size:13px;">Link ini berlaku selama <strong>1 jam</strong>.</p>
          <p style="color:#64748b;font-size:13px;">Jika kamu tidak meminta reset password, abaikan email ini.</p>
          <hr style="border-color:rgba(58,142,133,0.2);margin:24px 0;">
          <p style="color:#94a3b8;font-size:12px;">FluWatch.AI — Sistem Surveilans Influenza</p>
        </div>
        """

        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP(config.MAIL_SERVER, config.MAIL_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(config.MAIL_USERNAME, config.MAIL_PASSWORD)
            server.sendmail(config.MAIL_FROM, email, msg.as_string())
    except Exception as e:
        print(f"[EMAIL] Gagal kirim ke {email}: {e}")


@auth_bp.post("/daftar")
@limiter.limit("5/hour")
def daftar():
    """Registrasi pengguna baru."""
    data = request.get_json(silent=True) or {}

    username = str(data.get("username", "")).strip()
    email    = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))

    if not _RE_USERNAME.match(username):
        return jsonify({"pesan": "Username harus 3–50 karakter (huruf, angka, underscore)"}), 400
    if not _RE_EMAIL.match(email):
        return jsonify({"pesan": "Format email tidak valid"}), 400
    if len(password) < 8:
        return jsonify({"pesan": "Password minimal 8 karakter"}), 400

    if Pengguna.query.filter_by(email=email).first():
        return jsonify({"pesan": "Email atau username sudah terdaftar"}), 409
    if Pengguna.query.filter_by(username=username).first():
        return jsonify({"pesan": "Email atau username sudah terdaftar"}), 409

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


@auth_bp.post("/google")
@limiter.limit("20/minute")
def google_login():
    """Login atau daftar otomatis via Google OAuth (ID token)."""
    if not config.GOOGLE_CLIENT_ID:
        return jsonify({"pesan": "Google OAuth belum dikonfigurasi"}), 503

    data       = request.get_json(silent=True) or {}
    credential = data.get("credential", "")

    if not credential:
        return jsonify({"pesan": "Token Google tidak ditemukan"}), 400

    try:
        info = id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            config.GOOGLE_CLIENT_ID,
        )
    except ValueError:
        return jsonify({"pesan": "Token Google tidak valid atau sudah kadaluarsa"}), 401

    google_id = info["sub"]
    email     = info.get("email", "").lower()
    nama      = info.get("name", "")

    # Cari berdasarkan google_id, lalu fallback ke email
    pengguna = Pengguna.query.filter_by(google_id=google_id).first()
    if not pengguna:
        pengguna = Pengguna.query.filter_by(email=email).first()

    if pengguna:
        # Akun sudah ada — sambungkan google_id jika belum
        if not pengguna.google_id:
            pengguna.google_id = google_id
            db.session.commit()
        if not pengguna.is_active:
            return jsonify({"pesan": "Akun Anda telah dinonaktifkan"}), 403
    else:
        # Buat akun baru dari data Google
        username_base = re.sub(r"[^a-zA-Z0-9_]", "_", nama)[:40] or "pengguna"
        username      = username_base
        counter       = 1
        while Pengguna.query.filter_by(username=username).first():
            username = f"{username_base}_{counter}"
            counter += 1

        pengguna           = Pengguna(username=username, email=email, google_id=google_id)
        db.session.add(pengguna)
        db.session.commit()

    token = create_access_token(identity=str(pengguna.id))
    return jsonify({"token": token, "pengguna": pengguna.to_dict()}), 200


@auth_bp.post("/lupa-password")
@limiter.limit("3/hour")
def lupa_password():
    """Kirim link reset password ke email pengguna."""
    data  = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip().lower()

    if not _RE_EMAIL.match(email):
        return jsonify({"pesan": "Format email tidak valid"}), 400

    pengguna = Pengguna.query.filter_by(email=email).first()

    # Selalu return 200 — tidak bocorkan apakah email terdaftar
    if pengguna and pengguna.is_active:
        # User Google tidak punya password — tidak perlu reset
        if pengguna.google_id and not pengguna.password_hash:
            return jsonify({"pesan": "Jika email terdaftar, link reset password telah dikirim ke inbox kamu"}), 200

        token = secrets.token_urlsafe(48)
        pengguna.reset_token         = token
        pengguna.reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=1)
        db.session.commit()

        reset_url = f"{config.FRONTEND_URL}/reset-password?token={token}"
        _kirim_email_reset(pengguna.email, pengguna.username, reset_url)

    return jsonify({"pesan": "Jika email terdaftar, link reset password telah dikirim ke inbox kamu"}), 200


@auth_bp.post("/reset-password")
@limiter.limit("5/hour")
def reset_password():
    """Reset password menggunakan token dari email."""
    data          = request.get_json(silent=True) or {}
    token         = str(data.get("token", "")).strip()
    password_baru = str(data.get("password_baru", ""))

    if not token:
        return jsonify({"pesan": "Token tidak valid"}), 400
    if len(password_baru) < 8:
        return jsonify({"pesan": "Password minimal 8 karakter"}), 400

    pengguna = Pengguna.query.filter_by(reset_token=token).first()

    if not pengguna:
        return jsonify({"pesan": "Token tidak valid atau sudah kadaluarsa"}), 400

    if pengguna.reset_token_expires < datetime.now(timezone.utc):
        return jsonify({"pesan": "Token sudah kadaluarsa. Silakan minta reset password baru"}), 400

    pengguna.set_password(password_baru)
    pengguna.reset_token         = None
    pengguna.reset_token_expires = None
    db.session.commit()

    return jsonify({"pesan": "Password berhasil diubah. Silakan masuk dengan password baru"}), 200
