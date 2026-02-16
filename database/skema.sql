-- ============================================================
-- FluWatch Indonesia — Skema Database PostgreSQL
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABEL UTAMA: laporan_influenza
-- Menyimpan setiap laporan gejala yang dikirim pengguna
-- ============================================================
CREATE TABLE IF NOT EXISTS laporan_influenza (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Lokasi pengguna
    lat                 DECIMAL(10, 8)  NOT NULL,
    lng                 DECIMAL(11, 8)  NOT NULL,
    nama_wilayah        VARCHAR(255),               -- Nama kelurahan/kota (opsional)

    -- Kuesioner Gejala Influenza (Ya/Tidak)
    demam               BOOLEAN NOT NULL DEFAULT FALSE,   -- Suhu > 38°C
    batuk               BOOLEAN NOT NULL DEFAULT FALSE,
    sakit_tenggorokan   BOOLEAN NOT NULL DEFAULT FALSE,
    pilek               BOOLEAN NOT NULL DEFAULT FALSE,
    nyeri_otot          BOOLEAN NOT NULL DEFAULT FALSE,
    sakit_kepala        BOOLEAN NOT NULL DEFAULT FALSE,
    kelelahan           BOOLEAN NOT NULL DEFAULT FALSE,
    menggigil           BOOLEAN NOT NULL DEFAULT FALSE,
    mual_muntah         BOOLEAN NOT NULL DEFAULT FALSE,
    sesak_napas         BOOLEAN NOT NULL DEFAULT FALSE,

    -- Detail tambahan
    durasi_hari         SMALLINT CHECK (durasi_hari BETWEEN 1 AND 30),
    tingkat_keparahan   SMALLINT NOT NULL DEFAULT 5
                            CHECK (tingkat_keparahan BETWEEN 1 AND 10),
    sudah_vaksin        BOOLEAN,
    kelompok_usia       VARCHAR(20) DEFAULT 'dewasa'
                            CHECK (kelompok_usia IN ('anak','remaja','dewasa','lansia')),

    -- Skor risiko influenza (dihitung otomatis oleh backend, 0-100)
    skor_influenza      SMALLINT DEFAULT 0,

    -- Metadata
    timestamp           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indeks untuk performa ──────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_laporan_timestamp  ON laporan_influenza (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_laporan_lokasi     ON laporan_influenza (lat, lng);
CREATE INDEX IF NOT EXISTS idx_laporan_keparahan  ON laporan_influenza (tingkat_keparahan);

-- ============================================================
-- VIEW: laporan_48jam
-- Data laporan dalam 48 jam terakhir (dipakai AI Agent)
-- ============================================================
CREATE OR REPLACE VIEW laporan_48jam AS
SELECT
    id, lat, lng, nama_wilayah,
    demam, batuk, sakit_tenggorokan, pilek,
    nyeri_otot, sakit_kepala, kelelahan, menggigil,
    mual_muntah, sesak_napas,
    durasi_hari, tingkat_keparahan,
    sudah_vaksin, kelompok_usia,
    skor_influenza, timestamp,
    EXTRACT(EPOCH FROM (NOW() - timestamp)) / 3600 AS jam_lalu
FROM laporan_influenza
WHERE timestamp >= NOW() - INTERVAL '48 hours'
ORDER BY timestamp DESC;

-- ============================================================
-- VIEW: statistik_harian
-- Ringkasan harian untuk dashboard
-- ============================================================
CREATE OR REPLACE VIEW statistik_harian AS
SELECT
    DATE_TRUNC('day', timestamp)                    AS tanggal,
    COUNT(*)                                        AS total_kasus,
    ROUND(AVG(tingkat_keparahan), 1)                AS rata_keparahan,
    COUNT(*) FILTER (WHERE demam = TRUE)            AS kasus_demam,
    COUNT(*) FILTER (WHERE batuk = TRUE)            AS kasus_batuk,
    COUNT(*) FILTER (WHERE nyeri_otot = TRUE)       AS kasus_nyeri_otot,
    COUNT(*) FILTER (WHERE tingkat_keparahan >= 7)  AS kasus_berat
FROM laporan_influenza
GROUP BY DATE_TRUNC('day', timestamp)
ORDER BY tanggal DESC;

-- ============================================================
-- FUNGSI SQL: ambil_laporan_dalam_radius
-- Haversine murni SQL untuk filter spasial
-- ============================================================
CREATE OR REPLACE FUNCTION ambil_laporan_dalam_radius(
    p_lat       DOUBLE PRECISION,
    p_lng       DOUBLE PRECISION,
    radius_km   DOUBLE PRECISION DEFAULT 10,
    jam         INTEGER          DEFAULT 48
)
RETURNS TABLE (
    id                UUID,
    lat               DECIMAL,
    lng               DECIMAL,
    nama_wilayah      VARCHAR,
    demam             BOOLEAN,
    batuk             BOOLEAN,
    nyeri_otot        BOOLEAN,
    tingkat_keparahan SMALLINT,
    skor_influenza    SMALLINT,
    kelompok_usia     VARCHAR,
    timestamp         TIMESTAMPTZ,
    jarak_km          DOUBLE PRECISION
)
LANGUAGE sql STABLE AS $$
    SELECT
        id, lat, lng, nama_wilayah,
        demam, batuk, nyeri_otot,
        tingkat_keparahan, skor_influenza, kelompok_usia,
        timestamp,
        6371 * 2 * ASIN(SQRT(
            POWER(SIN(RADIANS(lat  - p_lat) / 2), 2)
            + COS(RADIANS(p_lat)) * COS(RADIANS(lat))
            * POWER(SIN(RADIANS(lng - p_lng) / 2), 2)
        )) AS jarak_km
    FROM laporan_influenza
    WHERE
        timestamp >= NOW() - MAKE_INTERVAL(hours => jam)
        AND 6371 * 2 * ASIN(SQRT(
            POWER(SIN(RADIANS(lat  - p_lat) / 2), 2)
            + COS(RADIANS(p_lat)) * COS(RADIANS(lat))
            * POWER(SIN(RADIANS(lng - p_lng) / 2), 2)
        )) <= radius_km
    ORDER BY jarak_km ASC;
$$;

-- ============================================================
-- DATA CONTOH (untuk pengembangan)
-- Sekitar Jakarta Selatan
-- ============================================================
INSERT INTO laporan_influenza
    (lat, lng, nama_wilayah, demam, batuk, sakit_tenggorokan, nyeri_otot,
     sakit_kepala, kelelahan, menggigil, tingkat_keparahan, durasi_hari,
     sudah_vaksin, kelompok_usia, skor_influenza)
VALUES
    (-6.2615, 106.8106, 'Kebayoran Baru',  TRUE,  TRUE,  FALSE, TRUE,  TRUE,  TRUE,  TRUE,  8, 3, FALSE, 'dewasa', 80),
    (-6.2550, 106.8200, 'Cilandak',         TRUE,  FALSE, TRUE,  FALSE, TRUE,  TRUE,  FALSE, 5, 2, TRUE,  'dewasa', 55),
    (-6.2700, 106.7950, 'Pesanggrahan',     TRUE,  TRUE,  TRUE,  TRUE,  FALSE, TRUE,  TRUE,  7, 4, FALSE, 'lansia', 75),
    (-6.2480, 106.8300, 'Pasar Minggu',     FALSE, TRUE,  TRUE,  FALSE, TRUE,  FALSE, FALSE, 4, 1, TRUE,  'remaja', 40),
    (-6.2800, 106.8050, 'Kebayoran Lama',   TRUE,  TRUE,  FALSE, TRUE,  TRUE,  TRUE,  TRUE,  9, 5, FALSE, 'dewasa', 90),
    (-6.2420, 106.8150, 'Mampang Prapatan', FALSE, FALSE, TRUE,  FALSE, FALSE, TRUE,  FALSE, 3, 2, TRUE,  'anak',   30),
    (-6.2650, 106.8250, 'Jagakarsa',        TRUE,  TRUE,  TRUE,  TRUE,  TRUE,  TRUE,  FALSE, 7, 3, FALSE, 'dewasa', 78),
    (-6.2350, 106.7900, 'Pesanggrahan',     TRUE,  FALSE, FALSE, TRUE,  FALSE, TRUE,  TRUE,  6, 2, FALSE, 'lansia', 62);
