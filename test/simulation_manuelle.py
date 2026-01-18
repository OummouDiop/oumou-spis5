import requests
import sys

# Forcer l'encodage UTF-8
try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

# Configuration
BACKEND_URL = "http://127.0.0.1:8000/send-data"

print("=" * 60)
print("🌱 SmartIrrig - Simulation Manuelle")
print("=" * 60)
print("Entrez les données des capteurs pour tester l'irrigation\n")

def obtenir_valeur(prompt, min_val, max_val, default=None):
    """Demande une valeur à l'utilisateur avec validation"""
    while True:
        if default is not None:
            valeur = input(f"{prompt} (défaut: {default}): ").strip()
            if valeur == "":
                return default
        else:
            valeur = input(f"{prompt}: ").strip()
        
        try:
            valeur_float = float(valeur)
            if min_val <= valeur_float <= max_val:
                return valeur_float
            else:
                print(f"⚠️  Valeur invalide. Doit être entre {min_val} et {max_val}")
        except ValueError:
            print("⚠️  Veuillez entrer un nombre valide")

def obtenir_oui_non(prompt, default="non"):
    """Demande oui/non à l'utilisateur"""
    while True:
        reponse = input(f"{prompt} (oui/non, défaut: {default}): ").strip().lower()
        if reponse == "":
            reponse = default
        if reponse in ['oui', 'o', 'yes', 'y']:
            return True
        elif reponse in ['non', 'n', 'no']:
            return False
        else:
            print("⚠️  Répondez par 'oui' ou 'non'")

def obtenir_intensite_pluie():
    """Demande l'intensité de la pluie"""
    print("\nIntensité de la pluie:")
    print("  1. Légère (light)")
    print("  2. Modérée (moderate)")
    print("  3. Forte (heavy)")
    
    while True:
        choix = input("Choisissez (1-3, défaut: 2): ").strip()
        if choix == "" or choix == "2":
            return "moderate"
        elif choix == "1":
            return "light"
        elif choix == "3":
            return "heavy"
        else:
            print("⚠️  Choix invalide")

def calculer_humidite_sol(temperature, lumiere, vitesse_vent, pleut, intensite_pluie, pompe_etait_active, humidite_precedente=None):
    """Calcule l'humidité du sol en fonction des conditions météo"""
    
    # Valeurs initiales si pas d'historique
    if humidite_precedente is None:
        humidite_10cm = 45.0
        humidite_30cm = 55.0
        humidite_60cm = 65.0
    else:
        humidite_10cm, humidite_30cm, humidite_60cm = humidite_precedente
    
    # Évaporation basée sur température, lumière et vent
    evaporation_10cm = (temperature - 15) * 0.3 + lumiere * 0.0003 + vitesse_vent * 0.15
    evaporation_30cm = evaporation_10cm * 0.5  # Moins d'évaporation en profondeur
    evaporation_60cm = evaporation_10cm * 0.3
    
    # Effet de la pluie
    if pleut:
        if intensite_pluie == "light":
            humidite_10cm += 5
            humidite_30cm += 2
            humidite_60cm += 1
        elif intensite_pluie == "moderate":
            humidite_10cm += 10
            humidite_30cm += 5
            humidite_60cm += 2
        elif intensite_pluie == "heavy":
            humidite_10cm += 18
            humidite_30cm += 10
            humidite_60cm += 5
    
    # Effet de l'irrigation
    if pompe_etait_active:
        humidite_10cm += 12
        humidite_30cm += 8
        humidite_60cm += 5
    
    # Appliquer l'évaporation
    humidite_10cm -= evaporation_10cm
    humidite_30cm -= evaporation_30cm
    humidite_60cm -= evaporation_60cm
    
    # Limites réalistes
    humidite_10cm = max(15, min(100, humidite_10cm))
    humidite_30cm = max(25, min(100, humidite_30cm))
    humidite_60cm = max(35, min(100, humidite_60cm))
    
    return round(humidite_10cm, 1), round(humidite_30cm, 1), round(humidite_60cm, 1)

# Historique de l'humidité du sol et état de la pompe
humidite_historique = None
pompe_active = False  # État initial de la pompe

try:
    while True:
        print("\n" + "=" * 60)
        print("📝 Entrez les conditions météo:")
        print("=" * 60)
        
        # Collecte des données météo uniquement
        temperature = obtenir_valeur("🌡️  Température (°C)", -10, 50, 25)
        lumiere = obtenir_valeur("☀️  Lumière (lux)", 0, 100000, 50000)
        vitesse_vent = obtenir_valeur("🌬️  Vitesse du vent (km/h)", 0, 100, 10)
        
        pleut = obtenir_oui_non("\n🌧️  Est-ce qu'il pleut ?", "non")
        
        if pleut:
            intensite_pluie = obtenir_intensite_pluie()
        else:
            intensite_pluie = "none"
        
        # Calculer automatiquement l'humidité du sol (en utilisant l'état précédent de la pompe)
        humidite_10cm, humidite_30cm, humidite_60cm = calculer_humidite_sol(
            temperature, lumiere, vitesse_vent, pleut, intensite_pluie, 
            pompe_active, humidite_historique
        )
        
        # Mettre à jour l'historique
        humidite_historique = (humidite_10cm, humidite_30cm, humidite_60cm)
        
        # Humidité de l'air (calculée automatiquement)
        humidite_air = 60.0
        if pleut:
            humidite_air = min(100, 75 + (10 if intensite_pluie == "heavy" else 5))
        else:
            humidite_air = max(30, 60 - (temperature - 25) * 1.5)
        
        # Préparer le payload
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
            "rainfall_intensity": intensite_pluie,
            "pump_was_active": pompe_active
        }
        
        # Affichage récapitulatif
        print("\n" + "=" * 60)
        print("📊 État calculé du système:")
        print("=" * 60)
        print(f"🌡️  Température: {temperature}°C")
        print(f"☀️  Lumière: {lumiere} lux")
        print(f"🌬️  Vent: {vitesse_vent} km/h")
        print(f"🌧️  Pluie: {'Oui (' + intensite_pluie + ')' if pleut else 'Non'}")
        print(f"\n💧 Humidité air (calculée): {humidite_air:.1f}%")
        print(f"🌱 Humidité sol calculée:")
        print(f"   - 10cm: {humidite_10cm}%")
        print(f"   - 30cm: {humidite_30cm}%")
        print(f"   - 60cm: {humidite_60cm}%")
        
        # Envoi au backend
        print("\n📤 Envoi des données au backend...")
        
        try:
            response = requests.post(BACKEND_URL, json=payload, timeout=5)
            
            if response.status_code == 200:
                decision = response.json()
                print("\n" + "=" * 60)
                print("✅ DÉCISION DU SYSTÈME:")
                print("=" * 60)
                print(f"💦 Pompe: {'🟢 ACTIVE' if decision['pump'] else '🔴 INACTIVE'}")
                print(f"📋 Message: {decision['message']}")
                print("=" * 60)
            else:
                
                # Mettre à jour l'état de la pompe pour la prochaine itération
                pompe_active = decision['pump']
                print(f"\n⚠️  Erreur HTTP {response.status_code}: {response.text}")
                
        except requests.exceptions.ConnectionError:
            print("\n❌ Erreur: Backend non accessible!")
            print("💡 Assurez-vous que le backend est démarré:")
            print("   cd backend && uvicorn main:app --reload")
            break
        except requests.exceptions.Timeout:
            print("\n⏱️  Timeout: Le backend met trop de temps à répondre")
        except Exception as e:
            print(f"\n❌ Erreur inattendue: {e}")
        
        # Demander si l'utilisateur veut continuer
        print("\n" + "-" * 60)
        continuer = obtenir_oui_non("Voulez-vous tester un autre scénario ?", "oui")
        if not continuer:
            break
        
except KeyboardInterrupt:
    print("\n\n🛑 Simulation arrêtée par l'utilisateur")
    print("👋 Au revoir!")
