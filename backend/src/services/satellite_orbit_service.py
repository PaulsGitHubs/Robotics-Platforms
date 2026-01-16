import math

def compute_orbit(angle, altitude=400000):
    lon = math.degrees(angle)
    lat = math.sin(angle) * 20
    return lon, lat, altitude
