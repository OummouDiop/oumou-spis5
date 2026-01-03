import json

def formater_donnees_capteurs(donnees):
    return json.dumps(donnees, indent=2)

def calculer_economies_eau(usage_traditionnel, usage_intelligent):
    economies = ((usage_traditionnel - usage_intelligent) / usage_traditionnel) * 100
    return round(economies, 1)

# Garder les anciennes fonctions pour compatibilité  
def format_sensor_data(data):
    return formater_donnees_capteurs(data)

def calculate_water_savings(traditional_usage, smart_usage):
    return calculer_economies_eau(traditional_usage, smart_usage)

def obtenir_statut_systeme(humidite):
    if humidite < 30:
        return "CRITIQUE 🔴"
    elif humidite < 50:
        return "ATTENTION 🟡"
    else:
        return "OPTIMAL 🟢"

# Garder l'ancienne fonction pour compatibilité
def get_system_status(humidity):
    return obtenir_statut_systeme(humidity)
