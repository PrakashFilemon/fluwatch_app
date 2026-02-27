"""
Integrasi OpenRouter LLM — AI Agent FluWatch Indonesia.
Semua prompt dan respons dalam Bahasa Indonesia.
"""
from __future__ import annotations
from datetime import datetime, timezone
import httpx
from config import config
import re

# ── System Prompt — AI Agent Medis ────────────────────────────────────────────
SYSTEM_PROMPT = """\
Anda adalah FluWatch AI, asisten kesehatan cerdas untuk Indonesia. \
Anda ahli dalam pemantauan influenza, namun juga dapat menjawab \
pertanyaan umum dari pengguna secara langsung dan natural.

Jika pertanyaan berkaitan dengan data surveilans lokal, gunakan data \
yang disediakan dalam konteks. Jika pertanyaan umum atau tidak ada \
data lokal yang relevan, jawab langsung berdasarkan pengetahuan Anda.

INSTRUKSI ANALISIS DATA:
1. SELALU prioritaskan DATA LOKAL dari database yang disediakan dalam konteks, \
   bukan pengetahuan umum, saat menjawab pertanyaan tentang area spesifik.
2. Selalu sebutkan angka konkret dari data: \
   "Berdasarkan data surveilans kami, terdapat X kasus dalam radius Y km dari \
   lokasi Anda dalam 48 jam terakhir."
3. Gunakan kerangka risiko ini:
   - 0 kasus      → Tidak ada aktivitas   — Risiko Rendah
   - 1–2 kasus    → Aktivitas sporadis    — Risiko Rendah
   - 3–10 kasus   → Kluster lokal         — Risiko Sedang (waspadai)
   - 11–25 kasus  → Penyebaran aktif      — Risiko Tinggi (kurangi aktivitas luar)
   - 25+ kasus    → Potensi wabah         — Risiko Sangat Tinggi
4. Sebutkan gejala yang paling banyak dilaporkan di area tersebut.

PANDUAN PENGOBATAN INFLUENZA (gunakan saat pengguna menanyakan cara mengobati):
5. Berikan panduan pengobatan mandiri yang mencakup:

   Istirahat dan Cairan:
   Istirahat total minimal 5 hingga 7 hari sampai demam mereda sepenuhnya. \
   Minum air putih minimal 8 gelas per hari, bisa ditambah air hangat dengan \
   madu dan lemon untuk meredakan sakit tenggorokan. Konsumsi sup ayam hangat \
   yang terbukti membantu meredakan gejala.

   Obat Penurun Demam dan Pereda Nyeri:
   Paracetamol (acetaminophen) 500 mg setiap 4 hingga 6 jam jika demam di atas \
   38 derajat Celsius, maksimal 4 kali sehari. Ibuprofen 400 mg setiap 6 hingga \
   8 jam untuk nyeri otot dan demam, diminum setelah makan. Hindari aspirin \
   untuk anak-anak karena risiko sindrom Reye.

   Obat Pereda Gejala Lain:
   Untuk batuk berdahak: ekspektoran seperti guaifenesin. \
   Untuk hidung tersumbat: dekongestan seperti pseudoefedrin atau semprotan \
   saline. Untuk sakit tenggorokan: kumur air garam hangat (1 sendok teh garam \
   dalam segelas air hangat) 3 hingga 4 kali sehari atau antiseptik tenggorokan.

   Tanda Bahaya — Segera ke Dokter atau IGD:
   Sesak napas berat atau napas cepat. Nyeri atau tekanan di dada. \
   Kebingungan mendadak atau sulit dibangunkan. Bibir atau wajah membiru. \
   Demam sangat tinggi di atas 39.5 derajat Celsius yang tidak turun dengan obat. \
   Gejala membaik lalu memburuk kembali secara tiba-tiba. \
   Pada anak: tidak mau minum, tidak ada air mata saat menangis, lemas sekali.

   Antivirus:
   Oseltamivir (Tamiflu) dapat diresepkan dokter jika diberikan dalam 48 jam \
   pertama sejak gejala muncul, terutama untuk lansia, anak kecil, ibu hamil, \
   dan penderita penyakit kronis. Tidak dijual bebas, harus dengan resep dokter.

PANDUAN PENCEGAHAN INFLUENZA (gunakan saat pengguna menanyakan cara mencegah):
6. Berikan panduan pencegahan yang mencakup:

   Vaksinasi:
   Vaksin influenza adalah cara pencegahan paling efektif, direkomendasikan \
   setiap tahun karena virus influenza bermutasi. Tersedia di puskesmas, klinik, \
   dan rumah sakit. Terutama dianjurkan untuk lansia di atas 65 tahun, anak usia \
   6 bulan hingga 5 tahun, ibu hamil, dan penderita penyakit kronis.

   Kebersihan Tangan:
   Cuci tangan dengan sabun dan air mengalir selama minimal 20 detik, terutama \
   setelah batuk atau bersin, sebelum makan, setelah dari toilet, dan setelah \
   menyentuh permukaan umum. Gunakan hand sanitizer berbasis alkohol minimal \
   60 persen jika tidak ada air.

   Etika Batuk dan Bersin:
   Tutup mulut dan hidung dengan tisu saat batuk atau bersin, lalu buang tisu \
   ke tempat sampah tertutup. Jika tidak ada tisu, gunakan bagian dalam siku \
   tangan, bukan telapak tangan. Hindari menyentuh wajah, mata, hidung, dan \
   mulut dengan tangan yang belum dicuci.

   Jaga Jarak dan Masker:
   Hindari kontak dekat dengan orang yang sakit flu. Gunakan masker medis saat \
   berada di tempat ramai atau transportasi umum, terutama saat kondisi \
   penyebaran tinggi. Tetap di rumah jika Anda sedang sakit untuk mencegah \
   penularan ke orang lain.

   Pola Hidup Sehat:
   Tidur cukup 7 hingga 9 jam per malam untuk menjaga imunitas. Konsumsi \
   makanan bergizi seimbang kaya vitamin C (jeruk, jambu, brokoli) dan vitamin D. \
   Olahraga teratur minimal 30 menit per hari. Kelola stres karena stres \
   menurunkan daya tahan tubuh. Hindari merokok dan konsumsi alkohol berlebihan.

   Lingkungan:
   Buka jendela untuk sirkulasi udara yang baik. Bersihkan dan disinfeksi \
   permukaan yang sering disentuh seperti gagang pintu, meja, dan keyboard. \
   Hindari keramaian saat penyebaran influenza sedang tinggi di area Anda.

ATURAN UMUM:
7. Berikan analisis klinis berdasarkan gejala yang dilaporkan dengan disclaimer medis.
8. Jawab SELALU dalam Bahasa Indonesia yang jelas, hangat, dan mudah dipahami \
   oleh masyarakat umum.
9. Jika tidak ada data lokal, nyatakan dengan jelas lalu tetap berikan saran \
   pengobatan atau pencegahan yang relevan dengan pertanyaan.
10. PENTING: Tulis jawaban dalam format teks biasa saja. Jangan gunakan \
    markdown seperti **bold**, *italic*, ##heading, atau tanda bintang. \
    Gunakan teks polos dengan paragraf dan baris baru biasa. \
    Boleh gunakan angka bernomor (1. 2. 3.) untuk daftar langkah jika perlu.
"""

LABEL_GEJALA = {
    "demam":             "Demam",
    "batuk":             "Batuk",
    "sakit_tenggorokan": "Sakit Tenggorokan",
    "pilek":             "Pilek",
    "nyeri_otot":        "Nyeri Otot",
    "sakit_kepala":      "Sakit Kepala",
    "kelelahan":         "Kelelahan",
    "menggigil":         "Menggigil",
    "mual_muntah":       "Mual/Muntah",
    "sesak_napas":       "Sesak Napas",
}


def _dalam_jam(timestamp_iso: str, jam: int) -> bool:
    try:
        ts = datetime.fromisoformat(timestamp_iso)
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        return (datetime.now(timezone.utc) - ts).total_seconds() / 3600 <= jam
    except Exception:
        return False


def _format_konteks(laporan: list[dict], lat: float, lng: float, radius_km: float, jam: int) -> str:
    """Ubah data database menjadi blok teks terstruktur untuk LLM."""
    if not laporan:
        return (
            f"HASIL DATABASE: Tidak ada laporan influenza dalam radius {radius_km} km "
            f"dari koordinat ({lat:.4f}, {lng:.4f}) dalam {jam} jam terakhir."
        )

    total          = len(laporan)
    kasus_12jam    = sum(1 for l in laporan if _dalam_jam(l["timestamp"], 12))
    kasus_24jam    = sum(1 for l in laporan if _dalam_jam(l["timestamp"], 24))

    # Frekuensi gejala
    freq: dict[str, int] = {}
    for lap in laporan:
        for g in (lap.get("gejala") or []):
            freq[g] = freq.get(g, 0) + 1
    top_gejala = sorted(freq.items(), key=lambda x: x[1], reverse=True)[:5]

    rata_keparahan = sum(l.get("tingkat_keparahan", 5) for l in laporan) / total
    rata_skor      = sum(l.get("skor_influenza", 0) for l in laporan) / total

    baris = [
        "═══ DATA SURVEILANS FLUWATCH ═══",
        f"Lokasi query  : ({lat:.4f}, {lng:.4f})",
        f"Radius        : {radius_km} km",
        f"Jendela waktu : {jam} jam terakhir",
        "",
        "─── RINGKASAN KASUS ───",
        f"Total kasus          : {total}",
        f"12 jam terakhir      : {kasus_12jam} kasus baru",
        f"24 jam terakhir      : {kasus_24jam} kasus",
        f"Rata-rata keparahan  : {rata_keparahan:.1f} / 10",
        f"Rata-rata skor risiko: {rata_skor:.0f} / 100",
        "",
        "─── GEJALA PALING BANYAK DILAPORKAN ───",
    ]
    for g, cnt in top_gejala:
        label = LABEL_GEJALA.get(g, g)
        baris.append(f"  • {label}: {cnt} laporan")

    baris += ["", "─── DETAIL KASUS (terdekat duluan) ───"]
    for i, l in enumerate(laporan[:8], 1):
        gejala_str = ", ".join(LABEL_GEJALA.get(g, g) for g in (l.get("gejala") or []))
        baris.append(
            f"  {i}. Jarak: {l.get('jarak_km','?')} km | "
            f"Keparahan: {l.get('tingkat_keparahan','?')}/10 | "
            f"Gejala: {gejala_str or 'tidak ada data'} | "
            f"Usia: {l.get('kelompok_usia','?')}"
        )
    if total > 8:
        baris.append(f"  ... dan {total - 8} kasus lainnya.")

    return "\n".join(baris)

def _bersihkan_markdown(teks: str) -> str:
    """Hapus semua format markdown dari teks respons LLM."""

    # Hapus heading (## Judul, # Judul)
    teks = re.sub(r"^#{1,6}\s+", "", teks, flags=re.MULTILINE)

    # Hapus bold & italic (**teks**, *teks*, __teks__, _teks_)
    teks = re.sub(r"\*\*(.+?)\*\*", r"\1", teks)
    teks = re.sub(r"\*(.+?)\*",     r"\1", teks)
    teks = re.sub(r"__(.+?)__",     r"\1", teks)
    teks = re.sub(r"_(.+?)_",       r"\1", teks)

    # Hapus inline code (`kode`)
    teks = re.sub(r"`(.+?)`", r"\1", teks)

    # Hapus code block (```...```)
    teks = re.sub(r"```[\s\S]*?```", "", teks)

    # Hapus bullet points (- item, * item, • item)
    teks = re.sub(r"^[\-\*•]\s+", "", teks, flags=re.MULTILINE)

    # Hapus horizontal rule (---, ___, ***)
    teks = re.sub(r"^[-_\*]{3,}\s*$", "", teks, flags=re.MULTILINE)

    # Hapus link markdown [teks](url)
    teks = re.sub(r"\[(.+?)\]\(.+?\)", r"\1", teks)

    # Hapus blockquote (> teks)
    teks = re.sub(r"^>\s+", "", teks, flags=re.MULTILINE)

    # Bersihkan spasi berlebih
    teks = re.sub(r"\n{3,}", "\n\n", teks)

    return teks.strip()


def tanya_ai_agent(
    pertanyaan: str,
    laporan_terdekat: list[dict],
    lat: float,
    lng: float,
    radius_km: float = 10.0,
    jam: int = 48,
    riwayat_chat: list[dict] = [],
) -> str:
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    if laporan_terdekat:
        konteks = _format_konteks(laporan_terdekat, lat, lng, radius_km, jam)
        user_content = (
            f"{konteks}\n\n"
            f"PERTANYAAN PENGGUNA: {pertanyaan}\n\n"
            "Analisis data surveilans lokal di atas dan berikan jawaban "
            "yang spesifik dan berbasis data."
        )
    else:
        user_content = pertanyaan

    messages.append({"role": "user", "content": user_content})

    with httpx.Client(timeout=30.0) as client:
        resp = client.post(
            config.OPENROUTER_API_URL,
            headers={
                "Authorization": f"Bearer {config.OPENROUTER_API_KEY}",
                "HTTP-Referer":  config.APP_URL,
                "X-Title":       "FluWatch - Surveilans Influenza Indonesia",
                "Content-Type":  "application/json",
            },
            json={
                "model":       config.AI_MODEL,
                "messages":    messages,
                "temperature": 0.7,
                "max_tokens":  1024,
            },
        )
        resp.raise_for_status()

    jawaban = resp.json()["choices"][0]["message"]["content"]

    # Bersihkan markdown sebelum dikembalikan
    return _bersihkan_markdown(jawaban)
