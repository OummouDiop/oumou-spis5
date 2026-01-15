import time
import requests
import random
import math
from sensors import CapteurHumidite, CapteurTemperature, CapteurLumiere, CapteurPluie, CapteurVent, CapteurDebitEau
from config import CONFIG_SIMULATION, CONFIG_CAPTEURS

# Forcer l'encodage UTF-8 pour stdout/stderr (utile sous Windows)
import sys
try:
    # Python 3.7+ provides reconfigure for text streams
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    # Fall back silently if reconfigure is not available
    pass

# Configuration de l'API backend
BACKEND_URL = "http://127.0.0.1:8000/send-data"

print("🌱 SmartIrrig - Simulation avec Backend FastAPI")
print("=" * 60)
print("📡 Connexion au backend:", BACKEND_URL)
print("=" * 60)

# Initialisation des capteurs
capteurs = {
    'humidite_10cm': CapteurHumidite(65, "10cm"),
    'humidite_30cm': CapteurHumidite(70, "30cm"),
    'humidite_60cm': CapteurHumidite(75, "60cm"),
    'temperature': CapteurTemperature(),
    'lumiere': CapteurLumiere(),
    'pluie': CapteurPluie(),
    'vent': CapteurVent(),
    'debit_eau': CapteurDebitEau()
}

# Variables de simulation
temps_simulation = 0
saison = CONFIG_SIMULATION['saison']
compteur_envois = 0
irrigation_active = False  # État de la pompe

print("✅ Capteurs initialisés!")
print("🚀 Démarrage de la simulation...\n")

try:
    while True:
        heure_actuelle = temps_simulation % 24
        
        # Vérifier s'il y a une météo forcée depuis le backend
        try:
            weather_response = requests.get("http://127.0.0.1:8000/get-weather", timeout=2)
            forced_weather = weather_response.json()
        except:
            forced_weather = {"condition": None, "rain_intensity": None}
        
        # Simulation météo (utiliser la météo forcée si disponible)
        if forced_weather["condition"] == "sunny":
            pleut = False
            intensite_pluie = None
        elif forced_weather["condition"] == "cloudy":
            pleut = False
            intensite_pluie = None
        elif forced_weather["condition"] == "rainy":
            pleut = True
            intensite_pluie = forced_weather.get("rain_intensity", "modérée")
        else:
            # Mode automatique : génération aléatoire
            pleut, intensite_pluie = capteurs['pluie'].simuler()
        
        vitesse_vent = capteurs['vent'].simuler()
        
        # Simulation capteurs
        temperature = capteurs['temperature'].simuler(heure_actuelle, saison)
        lumiere = capteurs['lumiere'].simuler(heure_actuelle)
        
        # Simulation humidité du sol (3 profondeurs)
        # IMPORTANT : Utiliser l'état de la pompe reçu du backend
        humidite_10cm = capteurs['humidite_10cm'].simuler(
            300, temperature, lumiere, vitesse_vent, irrigation_active, pleut
        )
        humidite_30cm = capteurs['humidite_30cm'].simuler(
            300, temperature, lumiere, vitesse_vent, irrigation_active, pleut
        )
        humidite_60cm = capteurs['humidite_60cm'].simuler(
            300, temperature, lumiere, vitesse_vent, irrigation_active, pleut
        )
        
        # Calculer l'humidité de l'air (simulation basique)
        # En été : plus sec, En hiver : plus humide
        humidite_air_base = {
            'printemps': 60,
            'ete': 45,
            'automne': 70,
            'hiver': 80
        }.get(saison, 60)
        
        # Ajustement selon la pluie
        if pleut:
            humidite_air = min(100, humidite_air_base + random.uniform(15, 30))
        else:
            humidite_air = humidite_air_base + random.uniform(-10, 10)
        
        humidite_air = round(max(20, min(100, humidite_air)), 1)
        
        # Déterminer l'intensité de la pluie
        intensite_pluie_str = 'none'
        if pleut:
            if intensite_pluie == 'légère':
                intensite_pluie_str = 'light'
            elif intensite_pluie == 'modérée':
                intensite_pluie_str = 'moderate'
            elif intensite_pluie == 'forte':
                intensite_pluie_str = 'heavy'
        
        # Préparer les données COMPLÈTES pour le backend
        payload = {
            "zone_id": "zone-1",
            "humidity": humidite_air,
            "temperature": temperature,
            "soil_moisture": humidite_10cm,
            "soil_moisture_10cm": humidite_10cm,
            "soil_moisture_30cm": humidite_30cm,
            "soil_moisture_60cm": humidite_60cm,
            "light": lumiere,
            "wind_speed": vitesse_vent,
            "rainfall": pleut,
            "rainfall_intensity": intensite_pluie_str,
            "pump_was_active": irrigation_active
        }
        
        # Affichage local
        print(f"⏰ Heure: {int(heure_actuelle):02d}:00")
        print(f"🌡️  Température: {temperature:.1f}°C")
        print(f"💧 Humidité air: {humidite_air}%")
        print(f"🌱 Humidité sol (10cm): {humidite_10cm}%")
        print(f"🌱 Humidité sol (30cm): {humidite_30cm}%")
        print(f"🌱 Humidité sol (60cm): {humidite_60cm}%")
        print(f"☀️  Lumière: {lumiere} lux")
        print(f"🌬️  Vent: {vitesse_vent} km/h")
        print(f"🌧️  Pluie: {'Oui (' + str(intensite_pluie) + ')' if pleut else 'Non'}")
        
        # Envoi au backend
        try:
            print(f"\n📤 Envoi #{compteur_envois + 1} vers le backend...")
            response = requests.post(BACKEND_URL, json=payload, timeout=5)
            
            if response.status_code == 200:
                decision = response.json()
                print(f"✅ Réponse reçue!")
                print(f"💦 Pompe: {'🟢 ACTIVE' if decision['pump'] else '🔴 INACTIVE'}")
                print(f"📋 Message: {decision['message']}")
                
                # IMPORTANT : Mettre à jour l'état de l'irrigation pour la prochaine itération
                irrigation_active = decision['pump']
                
                compteur_envois += 1
            else:
                print(f"⚠️  Erreur HTTP {response.status_code}: {response.text}")
                
        except requests.exceptions.ConnectionError:
            print("❌ Erreur: Backend non accessible!")
            print("💡 Assurez-vous que le backend est démarré: cd backend && uvicorn main:app --reload")
        except requests.exceptions.Timeout:
            print("⏱️  Timeout: Le backend met trop de temps à répondre")
        except Exception as e:
            print(f"❌ Erreur inattendue: {e}")
        
        print("=" * 60)
        
        # Incrémenter le temps
        temps_simulation += 1
        
        # Pause entre les envois (ajustable)
        time.sleep(5)  # Envoie toutes les 5 secondes
        
except KeyboardInterrupt:
    print("\n\n🛑 Simulation arrêtée par l'utilisateur")
    print(f"📊 Total d'envois réussis: {compteur_envois}")
    print("👋 Au revoir!")