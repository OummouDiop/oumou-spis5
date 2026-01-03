import time
import random
from sensors import CapteurHumidite, CapteurTemperature, CapteurLumiere, CapteurPluie, CapteurVent, CapteurDebitEau
from config import CONFIG_SIMULATION, CONFIG_CAPTEURS, SIMULATION_CONFIG, SENSOR_CONFIG, CONFIG_SAISONNIER, CONFIG_CULTURES, obtenir_seuils_saison, obtenir_seuils_culture, obtenir_seuils_intelligents
from utils import obtenir_statut_systeme

print("🌱 SmartIrrig - Système d'Irrigation Ultra-Intelligent")
print("✅ Initialisation des capteurs...\n")

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

# État du système
est_en_irrigation = False
temps_simulation = 0
saison = CONFIG_SIMULATION['saison']
type_culture = CONFIG_SIMULATION['type_culture']

# Obtenir les seuils intelligents (saison + culture)
seuils = obtenir_seuils_intelligents(saison, type_culture)
info_culture = obtenir_seuils_culture(type_culture)

print(f"🚀 Simulation démarrée!")
print(f"🌍 Saison: {saison.upper()}")
print(f"🌿 Culture: {type_culture.upper()}")
print(f"📊 Catégorie: {info_culture['categorie']}")
print(f"💧 Consommation: {info_culture['consommation']}")
print(f"📋 {info_culture['description']}")
print(f"⚙️  Configuration intelligente:")
print(f"   ├─ Déclenche irrigation si < {seuils['seuil_declenchement']}%")
print(f"   └─ Arrête irrigation si >= {seuils['seuil_arret']}%")
print("=" * 70)

while True:
    heure_actuelle = temps_simulation % 24
    
    # Simulation météo
    pleut, intensite_pluie = capteurs['pluie'].simuler()
    vitesse_vent = capteurs['vent'].simuler()
    
    # Simulation capteurs
    temperature = capteurs['temperature'].simuler(heure_actuelle, saison)
    lumiere = capteurs['lumiere'].simuler(heure_actuelle)
    
    # Vérifier AVANT si on doit irriguer
    # Critères pour DÉCLENCHER l'irrigation (adapté à la culture ET saison)
    if not est_en_irrigation:  # Seulement si pas déjà active
        doit_irriguer = (
            capteurs['humidite_10cm'].humidite < seuils['seuil_declenchement'] and  # Seuil intelligent
            not pleut  # Pas de pluie
        )
        if doit_irriguer:
            print(f"🚨 Irrigation déclenchée! [{type_culture.upper()} - {saison}]")
            print(f"   📊 Humidité: {capteurs['humidite_10cm'].humidite:.1f}% < {seuils['seuil_declenchement']}%")
            print(f"   🌡️  Température: {temperature:.1f}°C | ☀️ Lumière: {lumiere} lux")
            est_en_irrigation = True
    
    # Critères pour ARRÊTER l'irrigation (adapté à la culture ET saison)
    if est_en_irrigation:
        doit_arreter = (
            capteurs['humidite_10cm'].humidite >= seuils['seuil_arret'] or  # Objectif atteint
            pleut  # Pluie détectée
        )
        if doit_arreter:
            raison = f"Objectif atteint (>= {seuils['seuil_arret']}%)" if capteurs['humidite_10cm'].humidite >= seuils['seuil_arret'] else "Pluie détectée"
            print(f"✅ Irrigation arrêtée - {raison}")
            est_en_irrigation = False
    
    # MAINTENANT on simule AVEC le bon état d'irrigation
    humidite_10cm = capteurs['humidite_10cm'].simuler(300, temperature, lumiere, vitesse_vent, est_en_irrigation, pleut)
    humidite_30cm = capteurs['humidite_30cm'].simuler(300, temperature, lumiere, vitesse_vent, est_en_irrigation, pleut)
    humidite_60cm = capteurs['humidite_60cm'].simuler(300, temperature, lumiere, vitesse_vent, est_en_irrigation, pleut)
    
    # Simulation eau
    debit, eau_totale = capteurs['debit_eau'].simuler(est_en_irrigation)
    
    # Affichage
    print(f"⏰ {int(heure_actuelle):02d}:00 | 💧 Humidité 10cm: {humidite_10cm}% | 🌡️ Temp: {temperature:.1f}°C")
    print(f"☀️  Lux: {lumiere} | 🌬️ Vent: {vitesse_vent} km/h | 🌧️ Pluie: {'Oui' if pleut else 'Non'}")
    print(f"💦 Irrigation: {'ACTIVE' if est_en_irrigation else 'INACTIVE'} | Débit: {debit:.1f} L/min")
    print(f"📊 Statut: {obtenir_statut_systeme(humidite_10cm)}")
    print("-" * 50)
    
    temps_simulation += 1
    time.sleep(2)
