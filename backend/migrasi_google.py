"""
Migrasi: tambah kolom google_id dan buat password_hash nullable
Jalankan sekali: python migrasi_google.py
"""
from app import buat_app
from models import db

def jalankan():
    app = buat_app()
    with app.app_context():
        with db.engine.connect() as conn:
            from sqlalchemy import text

            # Tambah kolom google_id jika belum ada
            conn.execute(text("""
                ALTER TABLE pengguna
                ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;
            """))

            # Buat password_hash nullable
            conn.execute(text("""
                ALTER TABLE pengguna
                ALTER COLUMN password_hash DROP NOT NULL;
            """))

            # Tambah index pada google_id
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_pengguna_google ON pengguna (google_id);
            """))

            conn.commit()

        print("✅ Migrasi Google OAuth selesai.")

if __name__ == "__main__":
    jalankan()
