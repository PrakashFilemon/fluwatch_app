"""
Jalankan sekali untuk inisialisasi tabel dan opsional isi data contoh.
Penggunaan: python setup_db.py [--seed]
"""
import sys
from datetime import datetime, timezone, timedelta
import random
from app import buat_app
from models import db, LaporanInfluenza, _hitung_skor

# ── Kluster wilayah (lat_pusat, lng_pusat, nama_wilayah) ──────────────────────
KLUSTER = [
    # ── Jakarta Selatan ──────────────────────────────────────────────────────
    (-6.2615, 106.8106, "Kebayoran Baru"),
    (-6.2700, 106.7950, "Pesanggrahan"),
    (-6.2480, 106.8300, "Pasar Minggu"),
    (-6.2800, 106.8050, "Kebayoran Lama"),
    (-6.2350, 106.8250, "Mampang Prapatan"),
    (-6.2900, 106.8200, "Cilandak"),
    (-6.3050, 106.8150, "Jagakarsa"),
    (-6.2550, 106.7850, "Pesanggrahan Selatan"),
    # ── Jakarta Pusat ────────────────────────────────────────────────────────
    (-6.1862, 106.8340, "Menteng"),
    (-6.1750, 106.8200, "Tanah Abang"),
    (-6.1950, 106.8500, "Senen"),
    (-6.1700, 106.8450, "Kemayoran"),
    (-6.1800, 106.8600, "Cempaka Putih"),
    (-6.2000, 106.8350, "Setiabudi"),
    # ── Jakarta Timur ────────────────────────────────────────────────────────
    (-6.2250, 106.9000, "Jatinegara"),
    (-6.2450, 106.8900, "Kramat Jati"),
    (-6.2600, 106.9200, "Duren Sawit"),
    (-6.2100, 106.9300, "Pulo Gadung"),
    (-6.2750, 106.9400, "Cakung"),
    (-6.2950, 106.9000, "Makasar"),
    (-6.3100, 106.8800, "Cipayung"),
    # ── Jakarta Barat ────────────────────────────────────────────────────────
    (-6.1680, 106.7600, "Kebon Jeruk"),
    (-6.1850, 106.7400, "Tambora"),
    (-6.1550, 106.7800, "Grogol"),
    (-6.1950, 106.7150, "Kembangan"),
    (-6.1400, 106.7500, "Cengkareng"),
    (-6.2050, 106.7350, "Palmerah"),
    # ── Jakarta Utara ────────────────────────────────────────────────────────
    (-6.1200, 106.8800, "Penjaringan"),
    (-6.1350, 106.9100, "Koja"),
    (-6.1050, 106.8600, "Tanjung Priok"),
    (-6.1150, 106.8300, "Pademangan"),
    (-6.1450, 106.9300, "Cilincing"),
    # ── Depok ────────────────────────────────────────────────────────────────
    (-6.4025, 106.7942, "Depok Timur"),
    (-6.3850, 106.8200, "Beji"),
    (-6.4200, 106.8100, "Sawangan"),
    (-6.3700, 106.8350, "Pancoran Mas"),
    (-6.4400, 106.7800, "Bojongsari"),
    (-6.3550, 106.8100, "Sukmajaya"),
    (-6.4100, 106.8450, "Cilodong"),
    # ── Bekasi ───────────────────────────────────────────────────────────────
    (-6.2349, 106.9921, "Bekasi Utara"),
    (-6.2700, 107.0100, "Bekasi Selatan"),
    (-6.2100, 107.0300, "Tambun"),
    (-6.2500, 107.0500, "Cikarang Barat"),
    (-6.3000, 107.0700, "Cikarang Selatan"),
    (-6.2200, 106.9750, "Bekasi Barat"),
    (-6.2850, 106.9950, "Bekasi Kota"),
    # ── Tangerang ────────────────────────────────────────────────────────────
    (-6.1783, 106.6319, "Ciledug"),
    (-6.2050, 106.6100, "Larangan"),
    (-6.1600, 106.5900, "Karawaci"),
    (-6.1400, 106.6700, "Periuk"),
    (-6.2300, 106.6450, "Pamulang"),
    (-6.1900, 106.5600, "Cibodas"),
    (-6.2550, 106.6200, "Pondok Aren"),
    # ── Tangerang Selatan ────────────────────────────────────────────────────
    (-6.2900, 106.7100, "Serpong"),
    (-6.3100, 106.6950, "Ciputat"),
    (-6.2700, 106.6800, "Pondok Jagung"),
    # ── Bogor ────────────────────────────────────────────────────────────────
    (-6.5950, 106.8160, "Bogor Tengah"),
    (-6.6100, 106.7900, "Bogor Barat"),
    (-6.5700, 106.8400, "Bogor Timur"),
    (-6.5500, 106.8200, "Bogor Utara"),
    (-6.6300, 106.8300, "Bogor Selatan"),
    (-6.5850, 106.7700, "Dramaga"),
    # ── Bandung ──────────────────────────────────────────────────────────────
    (-6.9175, 107.6191, "Bandung Tengah"),
    (-6.9350, 107.6050, "Bandung Selatan"),
    (-6.9000, 107.6350, "Bandung Utara"),
    (-6.9250, 107.6550, "Antapani"),
    (-6.9500, 107.6400, "Margacinta"),
    (-6.9100, 107.5900, "Cidadap"),
    (-6.8950, 107.6150, "Coblong"),
    (-6.9400, 107.6750, "Arcamanik"),
    # ── Surabaya ─────────────────────────────────────────────────────────────
    (-7.2575, 112.7521, "Surabaya Pusat"),
    (-7.2750, 112.7400, "Tegalsari"),
    (-7.2400, 112.7650, "Gubeng"),
    (-7.2900, 112.7250, "Wonokromo"),
    (-7.2200, 112.7800, "Kenjeran"),
    (-7.3100, 112.7600, "Wonocolo"),
    (-7.2600, 112.7900, "Rungkut"),
    # ── Medan ────────────────────────────────────────────────────────────────
    (3.5952,  98.6722,  "Medan Kota"),
    (3.5750,  98.6900,  "Medan Denai"),
    (3.6150,  98.6550,  "Medan Baru"),
    (3.5600,  98.7050,  "Medan Amplas"),
    (3.6300,  98.6400,  "Medan Selayang"),
    # ── Makassar ─────────────────────────────────────────────────────────────
    (-5.1477, 119.4327, "Makassar Tengah"),
    (-5.1650, 119.4200, "Rappocini"),
    (-5.1300, 119.4450, "Panakkukang"),
    (-5.1800, 119.4100, "Tamalate"),
    # ── Semarang ─────────────────────────────────────────────────────────────
    (-6.9932, 110.4203, "Semarang Tengah"),
    (-7.0100, 110.4050, "Semarang Selatan"),
    (-6.9750, 110.4350, "Semarang Utara"),
    (-7.0250, 110.4400, "Banyumanik"),
    # ── Yogyakarta ───────────────────────────────────────────────────────────
    (-7.7972, 110.3688, "Yogyakarta Kota"),
    (-7.8100, 110.3550, "Mantrijeron"),
    (-7.7800, 110.3800, "Gondokusuman"),
    (-7.8250, 110.3900, "Kotagede"),
    # ── Palembang ────────────────────────────────────────────────────────────
    (-2.9761, 104.7754, "Palembang Tengah"),
    (-2.9950, 104.7600, "Seberang Ulu"),
    (-2.9600, 104.7900, "Ilir Timur"),
]

# ── Template data (gejala, keparahan, usia, vaksin) ───────────────────────────
TEMPLATE = [
    (["demam","batuk","nyeri_otot","kelelahan"],                    8, "dewasa",  False),
    (["demam","menggigil","sakit_kepala","nyeri_otot"],             9, "lansia",  False),
    (["batuk","sakit_tenggorokan","pilek"],                         4, "remaja",  True),
    (["demam","nyeri_otot","kelelahan","menggigil"],                9, "dewasa",  False),
    (["kelelahan","sakit_kepala","pilek"],                          3, "anak",    True),
    (["demam","batuk","sesak_napas"],                               8, "lansia",  False),
    (["pilek","batuk","mual_muntah"],                               4, "anak",    True),
    (["demam","sakit_tenggorokan","nyeri_otot"],                    6, "dewasa",  True),
    (["demam","menggigil","kelelahan","nyeri_otot"],                9, "lansia",  False),
    (["batuk","sakit_kepala","pilek"],                              5, "remaja",  True),
    (["demam","batuk","kelelahan"],                                 7, "dewasa",  False),
    (["demam","menggigil","sakit_kepala"],                          8, "lansia",  False),
    (["sakit_tenggorokan","pilek","kelelahan"],                     3, "anak",    True),
    (["demam","nyeri_otot","sesak_napas"],                          9, "lansia",  False),
    (["batuk","mual_muntah","kelelahan"],                           5, "remaja",  False),
    (["demam","sakit_kepala","menggigil","kelelahan"],              8, "dewasa",  False),
    (["pilek","sakit_tenggorokan"],                                 2, "anak",    True),
    (["demam","batuk","nyeri_otot","menggigil","kelelahan"],       10, "lansia",  False),
    (["kelelahan","sakit_kepala"],                                  3, "dewasa",  True),
    (["demam","batuk","pilek","sakit_tenggorokan"],                 6, "remaja",  True),
    (["nyeri_otot","kelelahan","menggigil"],                        7, "dewasa",  False),
    (["demam","sesak_napas","batuk"],                               9, "lansia",  False),
    (["sakit_kepala","pilek","batuk"],                              4, "anak",    True),
    (["demam","nyeri_otot","sakit_kepala","kelelahan"],             8, "dewasa",  False),
    (["mual_muntah","kelelahan","sakit_kepala"],                    5, "remaja",  False),
    (["demam","batuk","menggigil","sesak_napas"],                  10, "lansia",  False),
    (["pilek","kelelahan","mual_muntah"],                           4, "anak",    True),
    (["demam","nyeri_otot","batuk","sakit_tenggorokan"],            7, "dewasa",  True),
    (["menggigil","sakit_kepala","kelelahan"],                      6, "remaja",  False),
    (["demam","batuk","nyeri_otot","sakit_kepala","menggigil"],    10, "dewasa",  False),
    (["pilek","batuk"],                                             2, "anak",    True),
    (["demam","kelelahan","mual_muntah"],                           6, "dewasa",  True),
    (["batuk","sakit_tenggorokan","kelelahan","nyeri_otot"],        7, "remaja",  False),
    (["demam","menggigil","nyeri_otot","sesak_napas"],             10, "lansia",  False),
    (["sakit_kepala","pilek","mual_muntah"],                        4, "anak",    True),
]


def buat_laporan(lat, lng, nama_wilayah, gejala, keparahan, usia, vaksin, jam_lalu):
    """Buat satu objek LaporanInfluenza dengan sedikit variasi acak posisi dan waktu."""
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
            jumlah_per_kluster = 8   # 104 kluster × 8 = 832 laporan utama
            print(f"Mengisi data contoh ({len(KLUSTER)} wilayah × {jumlah_per_kluster} laporan)...")
            total = 0

            for base_lat, base_lng, nama in KLUSTER:
                for _ in range(jumlah_per_kluster):
                    gejala, keparahan, usia, vaksin = random.choice(TEMPLATE)
                    jam_lalu = random.uniform(0.5, 167)  # tersebar dalam 7 hari
                    laporan  = buat_laporan(
                        base_lat, base_lng, nama,
                        gejala, keparahan, usia, vaksin, jam_lalu
                    )
                    db.session.add(laporan)
                    total += 1

            # Tambah 80 laporan sangat baru (< 6 jam) untuk uji heatmap "aktif"
            KLUSTER_AKTIF = [
                (-6.2615, 106.8106, "Kebayoran Baru"),
                (-6.1862, 106.8340, "Menteng"),
                (-6.2250, 106.9000, "Jatinegara"),
                (-6.4025, 106.7942, "Depok Timur"),
                (-6.2349, 106.9921, "Bekasi Utara"),
                (-6.2900, 106.7100, "Serpong"),
                (-6.9175, 107.6191, "Bandung Tengah"),
                (-7.2575, 112.7521, "Surabaya Pusat"),
            ]
            for base_lat, base_lng, nama in KLUSTER_AKTIF:
                for _ in range(10):
                    gejala, keparahan, usia, vaksin = random.choice(TEMPLATE)
                    laporan = buat_laporan(
                        base_lat, base_lng, nama,
                        gejala, keparahan, usia, vaksin,
                        jam_lalu=random.uniform(0.1, 5.9)
                    )
                    db.session.add(laporan)
                    total += 1

            db.session.commit()
            print(f"✅ {total} laporan berhasil ditambahkan dari {len(KLUSTER)} wilayah.")

        print("Selesai!")


if __name__ == "__main__":
    setup()
