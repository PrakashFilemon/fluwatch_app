"""
Ekstensi Flask yang diinisialisasi di sini untuk menghindari circular import.
Diimport oleh app.py (init_app) dan routes (penggunaan decorator).
"""
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_jwt_extended import JWTManager

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["300/hour", "60/minute"],
    storage_uri="memory://",
    headers_enabled=True,
)

jwt = JWTManager()
