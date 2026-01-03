import time
import requests
import random

URL = "http://127.0.0.1:8000/send-data"

while True:
    humidity = random.uniform(20, 80)
    temperature = random.uniform(15, 40)
    soil = random.uniform(10, 60)

    payload = {
        "humidity": humidity,
        "temperature": temperature,
        "soil_moisture": soil
    }

    print("Sending:", payload)

    r = requests.post(URL, json=payload)
    print("Response:", r.json())
    print("-----------------------")

    time.sleep(5)
