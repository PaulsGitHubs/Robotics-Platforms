def load_environment(osm_elements):
    speed_zones = []
    checkpoints = []

    for el in osm_elements:
        tags = el.get("tags", {})
        if tags.get("highway"):
            speed_zones.append({
                "type": "road",
                "max_speed": tags.get("maxspeed", 50)
            })

        if tags.get("amenity") == "police":
            checkpoints.append(el)

    return {
        "speed_zones": speed_zones,
        "checkpoints": checkpoints
    }
