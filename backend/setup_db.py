"""
Jalankan sekali untuk inisialisasi tabel dan opsional isi data contoh.
Penggunaan: python setup_db.py [--seed]
"""
import sys
from datetime import datetime, timezone, timedelta
import random
from app import buat_app
from models import db, LaporanInfluenza, _hitung_skor

KLUSTER = [
    (-6.2615, 106.8106, "Kebayoran Baru"),
    (-6.2700, 106.7950, "Pesanggrahan"),
    (-6.2480, 106.8300, "Pasar Minggu"),
    (-6.1862, 106.8340, "Menteng"),
    (-6.1750, 106.8200, "Tanah Abang"),
    (-6.2250, 106.9000, "Jatinegara"),
    (-6.2450, 106.8900, "Kramat Jati"),
    (-6.1680, 106.7600, "Kebon Jeruk"),
    (-6.1200, 106.8800, "Penjaringan"),
    (-6.4025, 106.7942, "Depok Timur"),
    (-6.2349, 106.9921, "Bekasi Utara"),
    (-6.2700, 107.0100, "Bekasi Selatan"),
    (-6.1783, 106.6319, "Ciledug"),
    (-6.2900, 106.7100, "Serpong"),
    (-6.3100, 106.6950, "Ciputat"),
    (-6.5950, 106.8160, "Bogor Tengah"),
    (-6.9175, 107.6191, "Bandung Tengah"),
    (-6.9350, 107.6050, "Bandung Selatan"),
    (-7.2575, 112.7521, "Surabaya Pusat"),
    (-7.7972, 110.3688, "Yogyakarta Kota"),
    # Tambahan kluster baru
    (-6.3000, 106.8500, "Cilandak"),
    (-6.1600, 106.9200, "Pulo Gadung"),
    (-6.2100, 106.8450, "Pancoran"),
    (-6.1400, 106.8600, "Koja"),
    (-6.1950, 106.7750, "Palmerah"),
    (-6.3500, 106.8200, "Lenteng Agung"),
    (-6.2800, 106.8600, "Tebet"),
    (-6.1550, 106.8950, "Cakung"),
    (-6.2200, 106.7600, "Kebayoran Lama"),
    (-6.3800, 106.8300, "Jagakarsa"),
    (-6.1300, 106.7400, "Cengkareng"),
    (-6.2050, 106.7300, "Kembangan"),
    (-7.3300, 112.7400, "Surabaya Selatan"),
    (-7.2800, 112.7900, "Surabaya Timur"),
    (-7.2400, 112.7200, "Surabaya Barat"),
    (-6.9600, 107.5800, "Bandung Barat"),
    (-7.8300, 110.3500, "Sleman"),
    (-7.8600, 110.4200, "Bantul"),
    (-6.9800, 110.4200, "Semarang Tengah"),
    (-6.9600, 110.3900, "Semarang Barat"),
]

TEMPLATE = [
    (["demam","batuk","nyeri_otot","kelelahan"],                   8, "dewasa",  False),
    (["demam","menggigil","sakit_kepala","nyeri_otot"],            9, "lansia",  False),
    (["batuk","sakit_tenggorokan","pilek"],                        4, "remaja",  True),
    (["demam","nyeri_otot","kelelahan","menggigil"],               9, "dewasa",  False),
    (["kelelahan","sakit_kepala","pilek"],                         3, "anak",    True),
    (["demam","batuk","sesak_napas"],                              8, "lansia",  False),
    (["pilek","batuk","mual_muntah"],                              4, "anak",    True),
    (["demam","sakit_tenggorokan","nyeri_otot"],                   6, "dewasa",  True),
    (["demam","menggigil","kelelahan","nyeri_otot"],               9, "lansia",  False),
    (["batuk","sakit_kepala","pilek"],                             5, "remaja",  True),
    # Tambahan template baru
    (["demam","sesak_napas","nyeri_otot","mual_muntah"],          10, "lansia",  False),
    (["batuk","pilek","kelelahan"],                                 3, "anak",    True),
    (["demam","sakit_kepala","menggigil","sesak_napas"],           9, "dewasa",  False),
    (["sakit_tenggorokan","pilek","batuk","kelelahan"],             5, "remaja",  True),
    (["demam","nyeri_otot","sakit_kepala"],                        7, "dewasa",  True),
    (["menggigil","kelelahan","mual_muntah"],                       6, "lansia",  False),
    (["demam","batuk","sakit_tenggorokan","pilek"],                 6, "anak",    True),
    (["sesak_napas","demam","menggigil","nyeri_otot"],             10, "lansia",  False),
    (["pilek","sakit_kepala","kelelahan"],                          4, "remaja",  True),
    (["demam","mual_muntah","kelelahan","batuk"],                   7, "dewasa",  False),
]


def buat_laporan(lat, lng, nama_wilayah, gejala, keparahan, usia, vaksin, jam_lalu):
    gejala_dict = {g: True for g in gejala}
    skor        = _hitung_skor(gejala_dict)
    jitter_lat  = random.uniform(-0.010, 0.010)
    jitter_lng  = random.uniform(-0.010, 0.010)
    jitter_jam  = random.uniform(0, 3)
    ts          = datetime.now(timezone.utc) - timedelta(hours=jam_lalu + jitter_jam)

    return LaporanInfluenza(
        lat               = lat + jitter_lat,
        lng               = lng + jitter_lng,
        nama_wilayah      = nama_wilayah,
        tingkat_keparahan = keparahan,
        kelompok_usia     = usia,
        sudah_vaksin      = vaksin,
        skor_influenza    = skor,
        timestamp         = ts,
        **{g: True for g in LaporanInfluenza.GEJALA_FIELDS if g in gejala},
    )


def setup():
    app = buat_app()
    with app.app_context():
        print("Membuat tabel...")
        db.create_all()
        print("✅ Tabel berhasil dibuat.")

        if "--seed" in sys.argv:
            total = 0

            # ── 100 laporan tersebar acak dalam 30 hari ──────────────────────
            print("Mengisi 100 laporan acak (30 hari terakhir)...")
            for _ in range(100):
                lat, lng, nama = random.choice(KLUSTER)
                gejala, keparahan, usia, vaksin = random.choice(TEMPLATE)
                laporan = buat_laporan(
                    lat, lng, nama,
                    gejala, keparahan, usia, vaksin,
                    jam_lalu=random.uniform(0.5, 720)   # 0.5 jam – 30 hari
                )
                db.session.add(laporan)
                total += 1

            # ── 40 laporan dalam 7 hari (aktivitas mingguan) ─────────────────
            print("Mengisi 40 laporan mingguan...")
            for _ in range(40):
                lat, lng, nama = random.choice(KLUSTER)
                gejala, keparahan, usia, vaksin = random.choice(TEMPLATE)
                laporan = buat_laporan(
                    lat, lng, nama,
                    gejala, keparahan, usia, vaksin,
                    jam_lalu=random.uniform(0.5, 167)   # dalam 7 hari
                )
                db.session.add(laporan)
                total += 1

            # ── 20 laporan sangat baru (< 6 jam) untuk uji heatmap aktif ─────
            print("Mengisi 20 laporan aktif (< 6 jam)...")
            KLUSTER_AKTIF = [
                (-6.2615, 106.8106, "Kebayoran Baru"),
                (-6.1862, 106.8340, "Menteng"),
                (-6.4025, 106.7942, "Depok Timur"),
                (-6.2349, 106.9921, "Bekasi Utara"),
                (-6.9175, 107.6191, "Bandung Tengah"),
                (-7.2575, 112.7521, "Surabaya Pusat"),
                (-6.9800, 110.4200, "Semarang Tengah"),
                (-7.7972, 110.3688, "Yogyakarta Kota"),
                (-6.2800, 106.8600, "Tebet"),
                (-6.1600, 106.9200, "Pulo Gadung"),
            ]
            for lat, lng, nama in KLUSTER_AKTIF:
                for _ in range(2):
                    gejala, keparahan, usia, vaksin = random.choice(TEMPLATE)
                    laporan = buat_laporan(
                        lat, lng, nama,
                        gejala, keparahan, usia, vaksin,
                        jam_lalu=random.uniform(0.1, 5.9)
                    )
                    db.session.add(laporan)
                    total += 1

            # ── 20 laporan severity tinggi (skor ≥ 8) ────────────────────────
            print("Mengisi 20 laporan severity tinggi...")
            TEMPLATE_BERAT = [t for t in TEMPLATE if t[1] >= 8]
            for _ in range(20):
                lat, lng, nama = random.choice(KLUSTER)
                gejala, keparahan, usia, vaksin = random.choice(TEMPLATE_BERAT)
                laporan = buat_laporan(
                    lat, lng, nama,
                    gejala, keparahan, usia, vaksin,
                    jam_lalu=random.uniform(1, 336)     # dalam 14 hari
                )
                db.session.add(laporan)
                total += 1

            db.session.commit()
            print(f"✅ {total} laporan berhasil ditambahkan.")

        print("Selesai!")


if __name__ == "__main__":
    setup()