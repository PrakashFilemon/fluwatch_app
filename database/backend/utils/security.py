"""
Utilitas keamanan FluWatch:
- Hash IP anonim (tidak menyimpan IP asli)
- Ambil IP nyata di balik proxy
"""
import hashlib
from flask import request


def ambil_ip() -> str:
    """
    Ambil IP pengguna dengan memperhatikan reverse proxy.
    Urutan prioritas: X-Forwarded-For → X-Real-IP → remote_addr
    """
    xff = request.environ.get("HTTP_X_FORWARDED_FOR")
    if xff:
        return xff.split(",")[0].strip()
    xri = request.environ.get("HTTP_X_REAL_IP")
    if xri:
        return xri.strip()
    return request.remote_addr or "0.0.0.0"


def hash_ip() -> str:
    """
    Kembalikan hash SHA-256 (16 karakter pertama) dari IP pengguna.
    Digunakan untuk deteksi duplikasi tanpa menyimpan IP asli.
    """
    ip = ambil_ip()
    return hashlib.sha256(ip.encode("utf-8")).hexdigest()[:16]
