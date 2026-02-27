"""
Script migrasi manual — tambah kolom baru ke tabel yang sudah ada.
Jalankan SEKALI saja: python migrasi.py

Aman dijalankan berulang (menggunakan IF NOT EXISTS).
"""
from app import buat_app
from models import db

MIGRASI = [
    # Tambah kolom ip_hash (hash SHA-256 16 karakter dari IP pengguna)
    """
    ALTER TABLE laporan_influenza
    ADD COLUMN IF NOT EXISTS ip_hash VARCHAR(16) DEFAULT NULL;
    """,

    # Tambah index pada ip_hash untuk query cepat
    """
    CREATE INDEX IF NOT EXISTS idx_laporan_ip_hash
    ON laporan_influenza (ip_hash);
    """,

    # Buat tabel pengguna
    """
    CREATE TABLE IF NOT EXISTS pengguna (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username      VARCHAR(50)  NOT NULL UNIQUE,
        email         VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(256) NOT NULL,
        role          VARCHAR(20)  NOT NULL DEFAULT 'pengguna'
                      CHECK (role IN ('pengguna','admin')),
        is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
        created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
    );
    """,

    # Index email & username
    """
    CREATE INDEX IF NOT EXISTS idx_pengguna_email
    ON pengguna (email);
    """,

    """
    CREATE INDEX IF NOT EXISTS idx_pengguna_username
    ON pengguna (username);
    """,

    # Tambah FK ke laporan_influenza (nullable, backward compat)
    """
    ALTER TABLE laporan_influenza
    ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT NULL
    REFERENCES pengguna(id) ON DELETE SET NULL;
    """,

    """
    CREATE INDEX IF NOT EXISTS idx_laporan_user_id
    ON laporan_influenza (user_id);
    """,

    # Tambah kolom reset password ke tabel pengguna
    """
    ALTER TABLE pengguna
    ADD COLUMN IF NOT EXISTS reset_token VARCHAR(128) DEFAULT NULL UNIQUE;
    """,

    """
    ALTER TABLE pengguna
    ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMPTZ DEFAULT NULL;
    """,
]


def jalankan():
    app = buat_app()
    with app.app_context():
        with db.engine.connect() as conn:
            for i, sql in enumerate(MIGRASI, start=1):
                sql_bersih = " ".join(sql.split())
                print(f"[{i}/{len(MIGRASI)}] {sql_bersih[:60]}...")
                conn.execute(db.text(sql))
                conn.commit()
                print(f"      ✅ Berhasil")

        print("\n✅ Semua migrasi selesai.")


if __name__ == "__main__":
    jalankan()
