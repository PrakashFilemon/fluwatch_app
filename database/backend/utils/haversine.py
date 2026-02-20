"""
Perhitungan jarak Haversine dan filter laporan berdasarkan radius.
"""
import math

RADIUS_BUMI_KM = 6371.0


def hitung_jarak(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Kembalikan jarak dalam kilometer antara dua koordinat GPS
    menggunakan rumus Haversine.
    """
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    d_lat = lat2 - lat1
    d_lon = lon2 - lon1
    a = math.sin(d_lat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(d_lon / 2) ** 2
    return RADIUS_BUMI_KM * 2 * math.asin(math.sqrt(a))


def filter_radius(laporan_list, lat_pusat: float, lng_pusat: float, radius_km: float = 10.0) -> list[dict]:
    """
    Filter list ORM LaporanInfluenza berdasarkan radius dari titik pusat.
    Kembalikan list dict diurutkan dari yang terdekat.
    """
    hasil = []
    for lap in laporan_list:
        jarak = hitung_jarak(lat_pusat, lng_pusat, float(lap.lat), float(lap.lng))
        if jarak <= radius_km:
            hasil.append(lap.to_dict(jarak_km=jarak))
    hasil.sort(key=lambda x: x["jarak_km"])
    return hasil


def kotak_batas(lat: float, lng: float, radius_km: float) -> dict:
    """
    Hitung bounding box untuk pre-filter SQL yang cepat
    sebelum perhitungan Haversine yang lebih akurat.
    ~1 derajat lintang ≈ 111 km
    ~1 derajat bujur   ≈ 111 km × cos(lintang)
    """
    d_lat = radius_km / 111.0
    d_lng = radius_km / (111.0 * math.cos(math.radians(lat)))
    return {
        "min_lat": lat - d_lat, "max_lat": lat + d_lat,
        "min_lng": lng - d_lng, "max_lng": lng + d_lng,
    }
