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
            print("Mengisi 50 data contoh...")
            total = 0

            # 40 laporan tersebar acak dalam 7 hari
            for _ in range(40):
                lat, lng, nama = random.choice(KLUSTER)
                gejala, keparahan, usia, vaksin = random.choice(TEMPLATE)
                laporan = buat_laporan(
                    lat, lng, nama,
                    gejala, keparahan, usia, vaksin,
                    jam_lalu=random.uniform(0.5, 167)
                )
                db.session.add(laporan)
                total += 1

            # 10 laporan sangat baru (< 6 jam) untuk uji heatmap aktif
            KLUSTER_AKTIF = [
                (-6.2615, 106.8106, "Kebayoran Baru"),
                (-6.1862, 106.8340, "Menteng"),
                (-6.4025, 106.7942, "Depok Timur"),
                (-6.2349, 106.9921, "Bekasi Utara"),
                (-6.9175, 107.6191, "Bandung Tengah"),
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

            db.session.commit()
            print(f"✅ {total} laporan berhasil ditambahkan.")

        print("Selesai!")


if __name__ == "__main__":
    setup()