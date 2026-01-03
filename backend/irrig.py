import math
import random
def simulate(hour, season='autumn'):
    base_temp = {'spring': 18, 'summer': 28, 'autumn': 15, 'winter': 8}[season]
    daily_variation = 8 * math.sin((hour - 6) * math.pi / 12)
    noise = (random.random() - 0.5) * 2
    return round(base_temp + daily_variation + noise, 1)


simulated_data = [simulate(hour) for hour in range(24)]
print(simulated_data)