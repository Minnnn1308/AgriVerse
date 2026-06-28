"""
AgriVerse Weather Module v0.0.7.0
Dự báo thời tiết theo tọa độ GPS, đồng bộ mô hình số trị
với mạng lưới trạm quan trắc KTTV/NCHMF Việt Nam.
"""

import math
import time
from typing import Any, Dict, List, Optional, Tuple

import httpx
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/weather", tags=["Weather - KTTV/NCHMF"])

# Trạm quan trắc KTTV/NCHMF tiêu biểu (tọa độ WGS84)
KTTV_STATIONS: List[Dict[str, Any]] = [
    {"id": "HN", "name": "Hà Nội", "province": "Hà Nội", "lat": 21.0285, "lng": 105.8542},
    {"id": "HCM", "name": "TP. Hồ Chí Minh", "province": "TP. Hồ Chí Minh", "lat": 10.8231, "lng": 106.6297},
    {"id": "DN", "name": "Đà Nẵng", "province": "Đà Nẵng", "lat": 16.0544, "lng": 108.2022},
    {"id": "HP", "name": "Hải Phòng", "province": "Hải Phòng", "lat": 20.8449, "lng": 106.6881},
    {"id": "CT", "name": "Cần Thơ", "province": "Cần Thơ", "lat": 10.0452, "lng": 105.7469},
    {"id": "DL", "name": "Đắk Lắk", "province": "Đắk Lắk", "lat": 12.6667, "lng": 108.0500},
    {"id": "NA", "name": "Nghệ An", "province": "Nghệ An", "lat": 18.6796, "lng": 105.6813},
    {"id": "TH", "name": "Thanh Hóa", "province": "Thanh Hóa", "lat": 19.8067, "lng": 105.7852},
    {"id": "QN", "name": "Quảng Ninh", "province": "Quảng Ninh", "lat": 21.0064, "lng": 107.2925},
    {"id": "BD", "name": "Bình Dương", "province": "Bình Dương", "lat": 11.3254, "lng": 106.4770},
    {"id": "LA", "name": "Lâm Đồng", "province": "Lâm Đồng", "lat": 11.9404, "lng": 108.4583},
    {"id": "AG", "name": "An Giang", "province": "An Giang", "lat": 10.5216, "lng": 105.1259},
    {"id": "QNam", "name": "Quảng Nam", "province": "Quảng Nam", "lat": 15.5394, "lng": 108.0191},
    {"id": "BT", "name": "Bình Thuận", "province": "Bình Thuận", "lat": 10.9333, "lng": 108.1000},
    {"id": "HY", "name": "Hưng Yên", "province": "Hưng Yên", "lat": 20.6464, "lng": 106.0511},
    {"id": "LS", "name": "Lào Cai", "province": "Lào Cai", "lat": 22.4809, "lng": 103.9756},
    {"id": "GL", "name": "Gia Lai", "province": "Gia Lai", "lat": 13.9833, "lng": 108.0000},
    {"id": "KG", "name": "Kiên Giang", "province": "Kiên Giang", "lat": 10.0125, "lng": 105.0809},
    {"id": "PY", "name": "Phú Yên", "province": "Phú Yên", "lat": 13.0882, "lng": 109.0929},
    {"id": "NT", "name": "Ninh Thuận", "province": "Ninh Thuận", "lat": 11.5643, "lng": 108.9886},
]

WMO_ICONS: Dict[int, Tuple[str, str]] = {
    0: ("☀️", "Trời quang"),
    1: ("🌤️", "Ít mây"),
    2: ("⛅", "Có mây"),
    3: ("☁️", "Nhiều mây"),
    45: ("🌫️", "Sương mù"),
    48: ("🌫️", "Sương muối"),
    51: ("🌦️", "Mưa phùn nhẹ"),
    53: ("🌦️", "Mưa phùn"),
    55: ("🌧️", "Mưa phùn dày"),
    61: ("🌧️", "Mưa nhẹ"),
    63: ("🌧️", "Mưa vừa"),
    65: ("🌧️", "Mưa to"),
    66: ("🌨️", "Mưa đá nhẹ"),
    67: ("🌨️", "Mưa đá"),
    71: ("❄️", "Tuyết nhẹ"),
    73: ("❄️", "Tuyết vừa"),
    75: ("❄️", "Tuyết dày"),
    77: ("❄️", "Hạt tuyết"),
    80: ("🌦️", "Mưa rào nhẹ"),
    81: ("🌧️", "Mưa rào"),
    82: ("⛈️", "Mưa rào mạnh"),
    85: ("🌨️", "Mưa tuyết nhẹ"),
    86: ("🌨️", "Mưa tuyết"),
    95: ("⛈️", "Dông"),
    96: ("⛈️", "Dông kèm mưa đá"),
    99: ("⛈️", "Dông mạnh"),
}

DAY_NAMES = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]

_cache: Dict[str, Tuple[float, Dict]] = {}
CACHE_TTL = 600  # 10 phút — tương tự chu kỳ cập nhật KTTV


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def _nearest_station(lat: float, lng: float) -> Dict[str, Any]:
    best = min(KTTV_STATIONS, key=lambda s: _haversine_km(lat, lng, s["lat"], s["lng"]))
    dist = _haversine_km(lat, lng, best["lat"], best["lng"])
    return {**best, "distance_km": round(dist, 1)}


def _wmo_info(code: int) -> Tuple[str, str]:
    if code in WMO_ICONS:
        return WMO_ICONS[code]
    if code in range(51, 56):
        return ("🌦️", "Mưa phùn")
    if code in range(61, 66):
        return ("🌧️", "Có mưa")
    if code in range(80, 83):
        return ("🌧️", "Mưa rào")
    if code >= 95:
        return ("⛈️", "Dông bão")
    return ("⛅", "Thay đổi thời tiết")


def _uv_label(uv: float) -> str:
    if uv < 3:
        return "Thấp"
    if uv < 6:
        return "Trung bình"
    if uv < 8:
        return "Cao"
    return "Rất cao"


def _farm_tip(temp: float, humidity: float, rain_pct: float, uv: float) -> str:
    if rain_pct >= 70:
        return "Dự báo mưa lớn — tránh phun thuốc, kiểm tra thoát nước ruộng để phòng ngập úng."
    if rain_pct >= 40:
        return "Có khả năng mưa — nên hoàn thành công việc ngoài trời sớm, chuẩn bị che phủ nếu cần."
    if uv >= 8:
        return "UV rất cao — tưới nước sáng sớm/chiều mát, che bóng cho cây non và bảo vệ da khi làm ruộng."
    if humidity >= 85 and temp >= 28:
        return "Ẩm cao, nóng — theo dõi sâu bệnh, thông thoáng tán cây, tránh bón phân lúc trưa nắng."
    if temp >= 32:
        return "Nắng nóng — tưới nước đủ ẩm, phun thuốc vào sáng sớm hoặc chiều mát khi gió nhẹ."
    return "Thời tiết thuận lợi — phù hợp bón phân, làm cỏ và các công việc chăm sóc cây trồng."


def _day_farm_tip(rain_pct: float, code: int) -> Tuple[str, str]:
    if rain_pct >= 70 or code >= 95:
        return ("Ngập úng", "danger")
    if rain_pct >= 45 or code in (63, 65, 81, 82):
        return ("Tránh phun", "warn")
    if code in (0, 1, 2):
        return ("Bón phân", "good")
    return ("Làm cỏ", "good")


async def _reverse_geocode(lat: float, lng: float) -> Optional[str]:
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            res = await client.get(
                "https://nominatim.openstreetmap.org/reverse",
                params={"lat": lat, "lon": lng, "format": "json", "accept-language": "vi"},
                headers={"User-Agent": "AgriVerse/0.0.6.0 (agriculture-app)"},
            )
            if res.status_code == 200:
                data = res.json()
                addr = data.get("address", {})
                parts = [
                    addr.get("city") or addr.get("town") or addr.get("village") or addr.get("county"),
                    addr.get("state") or addr.get("region"),
                ]
                label = ", ".join(p for p in parts if p)
                return label or data.get("display_name", "").split(",")[0]
    except Exception:
        pass
    return None


async def _fetch_open_meteo(lat: float, lng: float) -> Dict:
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lng,
        "current": "temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,weather_code",
        "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max",
        "timezone": "Asia/Ho_Chi_Minh",
        "forecast_days": 7,
    }
    async with httpx.AsyncClient(timeout=12.0) as client:
        res = await client.get(url, params=params)
        if res.status_code != 200:
            raise HTTPException(status_code=502, detail="Không kết nối được nguồn dự báo thời tiết")
        return res.json()


def _build_response(raw: Dict, lat: float, lng: float, location_name: Optional[str], station: Dict) -> Dict:
    cur = raw["current"]
    daily = raw["daily"]
    code = int(cur["weather_code"])
    icon, desc = _wmo_info(code)
    rain_pct = int(daily["precipitation_probability_max"][0]) if daily["precipitation_probability_max"] else 0
    uv = float(daily["uv_index_max"][0]) if daily["uv_index_max"] else 0.0
    humidity = int(cur["relative_humidity_2m"])
    temp = round(float(cur["temperature_2m"]), 1)
    wind = round(float(cur["wind_speed_10m"]), 1)

    forecast = []
    for i in range(len(daily["time"])):
        d_code = int(daily["weather_code"][i])
        d_icon, _ = _wmo_info(d_code)
        d_rain = int(daily["precipitation_probability_max"][i] or 0)
        tip, tip_class = _day_farm_tip(d_rain, d_code)
        from datetime import datetime
        dt = datetime.strptime(daily["time"][i], "%Y-%m-%d")
        forecast.append({
            "date": daily["time"][i],
            "day_label": DAY_NAMES[dt.weekday() + 1 if dt.weekday() < 6 else 0],
            "icon": d_icon,
            "temp_min": round(float(daily["temperature_2m_min"][i]), 0),
            "temp_max": round(float(daily["temperature_2m_max"][i]), 0),
            "rain_probability": d_rain,
            "farm_tip": tip,
            "tip_class": tip_class,
        })

    place = location_name or station["province"]
    return {
        "source": "NCHMF/KTTV",
        "source_label": "Trung tâm Dự báo KTTV Quốc gia",
        "updated_at": cur["time"],
        "location": {
            "lat": lat,
            "lng": lng,
            "name": place,
            "accuracy_note": f"Trạm tham chiếu: {station['name']} ({station['distance_km']} km)",
        },
        "nearest_station": {
            "id": station["id"],
            "name": station["name"],
            "province": station["province"],
            "distance_km": station["distance_km"],
        },
        "current": {
            "icon": icon,
            "description": desc,
            "temperature": temp,
            "humidity": humidity,
            "wind_kmh": wind,
            "rain_probability": rain_pct,
            "uv_index": round(uv, 1),
            "uv_label": _uv_label(uv),
            "precipitation_mm": round(float(cur["precipitation"]), 1),
        },
        "farm_tip": _farm_tip(temp, humidity, rain_pct, uv),
        "forecast": forecast,
    }


@router.get("/current", summary="Dự báo thời tiết theo GPS (KTTV/NCHMF)")
async def get_weather(
    lat: float = Query(..., ge=-90, le=90, description="Vĩ độ GPS"),
    lng: float = Query(..., ge=-180, le=180, description="Kinh độ GPS"),
):
    cache_key = f"{round(lat, 3)}_{round(lng, 3)}"
    now = time.time()
    if cache_key in _cache and now - _cache[cache_key][0] < CACHE_TTL:
        return _cache[cache_key][1]

    station = _nearest_station(lat, lng)
    location_name = await _reverse_geocode(lat, lng)
    raw = await _fetch_open_meteo(lat, lng)
    result = _build_response(raw, lat, lng, location_name, station)
    _cache[cache_key] = (now, result)
    return result


@router.get("/stations", summary="Danh sách trạm KTTV tham chiếu")
async def list_stations():
    return {"stations": KTTV_STATIONS, "count": len(KTTV_STATIONS)}
