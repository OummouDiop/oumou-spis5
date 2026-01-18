from pymongo import MongoClient
import pandas as pd

client = MongoClient("mongodb://localhost:27017/")
db = client["irrigation"]
collection = db["sensor_data"]

data = list(collection.find())

rows = []
for d in data:
    rows.append({
        "_id": str(d["_id"]),
        "zone_id": d.get("zone_id"),
        "humidity": d.get("humidity"),
        "temperature": d.get("temperature"),
        "soil_moisture": d.get("soil_moisture"),
        "soil_moisture_10cm": d.get("soil_moisture_10cm"),
        "soil_moisture_30cm": d.get("soil_moisture_30cm"),
        "soil_moisture_60cm": d.get("soil_moisture_60cm"),
        "light": d.get("light"),
        "wind_speed": d.get("wind_speed"),
        "rainfall": d.get("rainfall"),
        "rainfall_intensity": d.get("rainfall_intensity"),
        "created_at": d.get("created_at").isoformat() if d.get("created_at") else None
    })

df = pd.DataFrame(rows)
df.to_csv("sensor_data.csv", index=False, encoding="utf-8")

print("✅ CSV créé : sensor_data.csv")
