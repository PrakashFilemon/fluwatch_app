from datetime import timedelta

from flask import Flask, jsonify
from flask_cors import CORS
from flask_talisman import Talisman

from config import config
from extensions import limiter, jwt
from models import db
from routes.laporan import laporan_bp
from routes.peta    import peta_bp
from routes.ai      import ai_bp
from routes.auth    import auth_bp
from routes.admin   import admin_bp

# ── Content Security Policy ─────────────────────────────────────────────────
CSP = {
    "default-src": "'self'",
    "script-src":  ["'self'", "'unsafe-inline'"],
    "style-src":   ["'self'", "'unsafe-inline'",
                    "fonts.googleapis.com",
                    "unpkg.com"],
    "img-src":     ["'self'", "data:",
                    "*.tile.openstreetmap.org",
                    "*.basemaps.cartocdn.com",
                    "unpkg.com"],
    "font-src":    ["'self'", "fonts.gstatic.com"],
    "connect-src": ["'self'",
                    "nominatim.openstreetmap.org",
                    "openrouter.ai"],
    "frame-ancestors": "'none'",
}


def buat_app() -> Flask:
    app = Flask(__name__)

    # ── Konfigurasi ─────────────────────────────────────────────────────────
    app.config["SECRET_KEY"]                     = config.SECRET_KEY
    app.config["SQLALCHEMY_DATABASE_URI"]        = config.SQLALCHEMY_DATABASE_URI
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SQLALCHEMY_ENGINE_OPTIONS"]      = config.SQLALCHEMY_ENGINE_OPTIONS

    # ── JWT ─────────────────────────────────────────────────────────────────
    app.config["JWT_SECRET_KEY"]        = config.JWT_SECRET_KEY
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=config.JWT_ACCESS_TOKEN_EXPIRES_HOURS)
    app.config["JWT_TOKEN_LOCATION"]    = ["headers"]

    # ── Database ────────────────────────────────────────────────────────────
    db.init_app(app)

    # ── CORS — hanya izinkan origin yang terdaftar ───────────────────────────
    CORS(
        app,
        origins=[config.FRONTEND_URL, "http://localhost:3000", "http://localhost:5173"],
        supports_credentials=True,
        methods=["GET", "POST", "OPTIONS", "DELETE", "PATCH"],
        allow_headers=["Content-Type", "Authorization"],
    )

    # ── Rate Limiter ────────────────────────────────────────────────────────
    limiter.init_app(app)

    # ── JWT Manager ─────────────────────────────────────────────────────────
    jwt.init_app(app)

    # ── Security Headers (Talisman) ─────────────────────────────────────────
    # force_https=False untuk development; set True di production
    Talisman(
        app,
        force_https=False,
        strict_transport_security=False,
        content_security_policy=CSP,
        content_security_policy_nonce_in=["script-src"],
        x_content_type_options=True,       # nosniff
        x_xss_protection=True,
        frame_options="DENY",              # X-Frame-Options: DENY
        referrer_policy="strict-origin-when-cross-origin",
    )

    # ── Blueprints ──────────────────────────────────────────────────────────
    app.register_blueprint(laporan_bp)
    app.register_blueprint(peta_bp)
    app.register_blueprint(ai_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp)

    # ── Security Headers tambahan via after_request ─────────────────────────
    @app.after_request
    def tambah_header_keamanan(response):
        response.headers["X-Content-Type-Options"]  = "nosniff"
        response.headers["X-Frame-Options"]         = "DENY"
        response.headers["Referrer-Policy"]         = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"]      = "geolocation=(), microphone=(), camera=()"
        response.headers["Cache-Control"]           = "no-store, no-cache, must-revalidate"
        # Hapus header yang bocorkan info server
        response.headers.pop("Server", None)
        response.headers.pop("X-Powered-By", None)
        return response

    # ── Health check ────────────────────────────────────────────────────────
    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok", "layanan": "FluWatch API"})

    # ── Error handlers ──────────────────────────────────────────────────────
    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({"pesan": "Permintaan tidak valid", "kode": 400}), 400

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"pesan": "Endpoint tidak ditemukan", "kode": 404}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({"pesan": "Metode HTTP tidak diizinkan", "kode": 405}), 405

    @app.errorhandler(429)
    def rate_limit_exceeded(e):
        return jsonify({
            "pesan": "Terlalu banyak permintaan. Silakan coba lagi beberapa saat.",
            "kode":  429,
        }), 429

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"pesan": "Kesalahan internal server", "kode": 500}), 500

    # ── JWT error handlers ───────────────────────────────────────────────────
    @jwt.expired_token_loader
    def token_kadaluarsa(jwt_header, jwt_payload):
        return jsonify({"pesan": "Sesi telah berakhir. Silakan masuk kembali.", "kode": 401}), 401

    @jwt.invalid_token_loader
    def token_tidak_valid(reason):
        return jsonify({"pesan": "Token tidak valid.", "kode": 401}), 401

    @jwt.unauthorized_loader
    def tidak_terautentikasi(reason):
        return jsonify({"pesan": "Autentikasi diperlukan.", "kode": 401}), 401

    # ── Buat tabel ──────────────────────────────────────────────────────────
    with app.app_context():
        db.create_all()

    return app


app = buat_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=config.DEBUG)
