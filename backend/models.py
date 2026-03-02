import uuid
from datetime import datetime, timezone

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import (
    Boolean, Column, DateTime, ForeignKey, Integer,
    Numeric, SmallInteger, String, Text, CheckConstraint, Index,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()


def _hitung_skor(data: dict) -> int:
    """
    Hitung skor risiko influenza (0–100) berdasarkan gejala.
    Bobot didasarkan pada kriteria klinis influenza WHO.
    """
    bobot = {
        "demam":             25,  # Gejala utama influenza
        "menggigil":         15,
        "nyeri_otot":        15,
        "kelelahan":         10,
        "batuk":             10,
        "sakit_kepala":       8,
        "sakit_tenggorokan":  7,
        "pilek":              5,
        "mual_muntah":        3,
        "sesak_napas":        2,
    }
    total = sum(bobot[g] for g in bobot if data.get(g))
    return min(total, 100)


class Pengguna(db.Model):
    __tablename__ = "pengguna"

    id                   = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username             = Column(String(50), unique=True, nullable=False)
    email                = Column(String(255), unique=True, nullable=False)
    password_hash        = Column(String(256), nullable=True)   # nullable untuk user Google OAuth
    google_id            = Column(String(255), unique=True, nullable=True)
    role                 = Column(String(20), nullable=False, default="pengguna")
    is_active            = Column(Boolean, nullable=False, default=True)
    created_at           = Column(DateTime(timezone=True), nullable=False,
                                  default=lambda: datetime.now(timezone.utc))
    reset_token          = Column(String(128), nullable=True, unique=True)
    reset_token_expires  = Column(DateTime(timezone=True), nullable=True)

    laporan = relationship("LaporanInfluenza", back_populates="pengguna")

    __table_args__ = (
        CheckConstraint("role IN ('pengguna','admin')", name="ck_pengguna_role"),
        Index("idx_pengguna_email",    "email"),
        Index("idx_pengguna_username", "username"),
        Index("idx_pengguna_google",   "google_id"),
    )

    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def cek_password(self, password: str) -> bool:
        if not self.password_hash:
            return False
        return check_password_hash(self.password_hash, password)

    def to_dict(self) -> dict:
        return {
            "id":         str(self.id),
            "username":   self.username,
            "email":      self.email,
            "role":       self.role,
            "is_active":  self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class LaporanInfluenza(db.Model):
    __tablename__ = "laporan_influenza"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Lokasi
    lat           = Column(Numeric(10, 8), nullable=False)
    lng           = Column(Numeric(11, 8), nullable=False)
    nama_wilayah  = Column(String(255), nullable=True)

    # Gejala (Boolean per gejala untuk query statistik yang mudah)
    demam               = Column(Boolean, nullable=False, default=False)
    batuk               = Column(Boolean, nullable=False, default=False)
    sakit_tenggorokan   = Column(Boolean, nullable=False, default=False)
    pilek               = Column(Boolean, nullable=False, default=False)
    nyeri_otot          = Column(Boolean, nullable=False, default=False)
    sakit_kepala        = Column(Boolean, nullable=False, default=False)
    kelelahan           = Column(Boolean, nullable=False, default=False)
    menggigil           = Column(Boolean, nullable=False, default=False)
    mual_muntah         = Column(Boolean, nullable=False, default=False)
    sesak_napas         = Column(Boolean, nullable=False, default=False)

    # Detail
    durasi_hari         = Column(SmallInteger, nullable=True)
    tingkat_keparahan   = Column(SmallInteger, nullable=False, default=5)
    sudah_vaksin        = Column(Boolean, nullable=True)
    kelompok_usia       = Column(String(20), nullable=False, default="dewasa")
    skor_influenza      = Column(SmallInteger, nullable=False, default=0)

    # Keamanan — hash SHA-256 dari IP pengguna (bukan IP asli)
    ip_hash             = Column(String(16), nullable=True, index=True)

    # Relasi ke pengguna (nullable, backward compat dengan laporan anonim lama)
    user_id             = Column(UUID(as_uuid=True),
                                 ForeignKey("pengguna.id", ondelete="SET NULL"),
                                 nullable=True, index=True)
    pengguna            = relationship("Pengguna", back_populates="laporan")

    timestamp  = Column(DateTime(timezone=True), nullable=False,
                        default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime(timezone=True), nullable=False,
                        default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        CheckConstraint("tingkat_keparahan BETWEEN 1 AND 10", name="ck_keparahan"),
        CheckConstraint("kelompok_usia IN ('anak','remaja','dewasa','lansia')", name="ck_usia"),
        Index("idx_laporan_timestamp", "timestamp"),
        Index("idx_laporan_lokasi", "lat", "lng"),
        Index("idx_laporan_user_id", "user_id"),
    )

    # ── Daftar gejala untuk iterasi ─────────────────────────
    GEJALA_FIELDS = [
        "demam", "batuk", "sakit_tenggorokan", "pilek",
        "nyeri_otot", "sakit_kepala", "kelelahan",
        "menggigil", "mual_muntah", "sesak_napas",
    ]

    def gejala_aktif(self) -> list[str]:
        """Kembalikan list nama gejala yang bernilai True."""
        return [g for g in self.GEJALA_FIELDS if getattr(self, g)]

    def to_dict(self, jarak_km: float | None = None) -> dict:
        data = {
            "id":                 str(self.id),
            "lat":                float(self.lat),
            "lng":                float(self.lng),
            "nama_wilayah":       self.nama_wilayah,
            "gejala":             self.gejala_aktif(),
            "tingkat_keparahan":  self.tingkat_keparahan,
            "durasi_hari":        self.durasi_hari,
            "sudah_vaksin":       self.sudah_vaksin,
            "kelompok_usia":      self.kelompok_usia,
            "skor_influenza":     self.skor_influenza,
            "timestamp":          self.timestamp.isoformat() if self.timestamp else None,
            "user_id":            str(self.user_id) if self.user_id else None,
        }
        if jarak_km is not None:
            data["jarak_km"] = round(jarak_km, 2)
        return data

    def to_titik_peta(self) -> dict:
        """Payload minimal untuk layer heatmap di frontend."""
        return {
            "lat":    float(self.lat),
            "lng":    float(self.lng),
            "bobot":  round(self.skor_influenza / 100, 2),   # 0.0 – 1.0
        }
