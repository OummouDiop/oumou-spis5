import random
import math

class CapteurHumidite:
    """Capteur d'humidité du sol à différentes profondeurs"""
    def __init__(self, humidite_initiale, profondeur):
        self.humidite = humidite_initiale
        self.profondeur = profondeur
        self.temps_derniere_irrigation = 0
        
    def simuler(self, temps_ecoule, temperature, lumiere, vitesse_vent, est_en_irrigation, pleut):
        # Évaporation basée sur la température, lumière et vent
        taux_evaporation = (temperature - 15) * 0.1 + lumiere * 0.0001 + vitesse_vent * 0.05
        
        # Réduire l'évaporation en profondeur (le sol profond garde mieux l'eau)
        if self.profondeur == "30cm":
            taux_evaporation *= 0.5  # 50% moins d'évaporation à 30cm
        elif self.profondeur == "60cm":
            taux_evaporation *= 0.3  # 70% moins d'évaporation à 60cm
        
        # Effet de la pluie
        if pleut:
            # La pluie pénètre moins en profondeur
            if self.profondeur == "10cm":
                self.humidite += random.uniform(3, 7)
            elif self.profondeur == "30cm":
                self.humidite += random.uniform(1.5, 3.5)
            elif self.profondeur == "60cm":
                self.humidite += random.uniform(0.5, 1.5)
            
        # Effet de l'irrigation
        if est_en_irrigation:
            # Base forte pour l'irrigation
            effet_irrigation = random.uniform(8, 12)
            # L'effet diminue avec la profondeur
            if self.profondeur == "30cm":
                effet_irrigation *= 0.7
            elif self.profondeur == "60cm":
                effet_irrigation *= 0.5
            self.humidite += effet_irrigation
            
        # Évaporation naturelle (réduite)
        self.humidite -= taux_evaporation * random.uniform(0.6, 0.9)
        
        # Définir un minimum réaliste selon la profondeur (le sol ne sèche jamais complètement en profondeur)
        humidite_min = {
            "10cm": 15,   # Sol de surface peut devenir très sec
            "30cm": 25,   # Sol moyen garde un minimum d'humidité
            "60cm": 35    # Sol profond reste toujours assez humide
        }.get(self.profondeur, 0)
        
        # Limiter entre minimum et 100%
        self.humidite = max(humidite_min, min(100, self.humidite))
        
        return round(self.humidite, 1)

class CapteurTemperature:
    """Capteur de température avec variation jour/nuit et saisonnière"""
    def __init__(self):
        self.temp_base = 25
        
    def simuler(self, heure, saison):
        # Température de base selon la saison
        temp_saisonniere = {
            'printemps': 20,
            'ete': 28,
            'automne': 18,
            'hiver': 12
        }
        
        base = temp_saisonniere.get(saison, 25)
        
        # Variation jour/nuit (cosinus pour cycle naturel)
        variation_journaliere = 8 * math.cos((heure - 14) * math.pi / 12)
        
        # Petit bruit aléatoire
        bruit = random.uniform(-2, 2)
        
        temperature = base + variation_journaliere + bruit
        return round(temperature, 1)

class CapteurLumiere:
    """Capteur de luminosité (lux)"""
    def __init__(self):
        self.lumiere_max = 80000
        
    def simuler(self, heure):
        # Cycle jour/nuit avec lever/coucher du soleil
        if 6 <= heure <= 18:
            # Jour: courbe en cloche
            facteur_lumiere = math.sin((heure - 6) * math.pi / 12)
            lumiere = self.lumiere_max * facteur_lumiere * random.uniform(0.8, 1.2)
        else:
            # Nuit
            lumiere = random.uniform(0, 50)
            
        return int(max(0, lumiere))

class CapteurPluie:
    """Capteur de pluie avec intensité variable"""
    def __init__(self):
        self.pleut = False
        self.duree_pluie = 0
        
    def simuler(self):
        # Probabilité de changement de météo
        if not self.pleut:
            # 5% de chance qu'il commence à pleuvoir
            if random.random() < 0.05:
                self.pleut = True
                self.duree_pluie = random.randint(3, 10)  # 3-10 cycles
        else:
            self.duree_pluie -= 1
            if self.duree_pluie <= 0:
                self.pleut = False
                
        # Intensité de la pluie
        if self.pleut:
            intensite = random.choice(['légère', 'modérée', 'forte'])
        else:
            intensite = None
            
        return self.pleut, intensite

class CapteurVent:
    """Capteur de vitesse du vent"""
    def __init__(self):
        self.vent_base = 5
        
    def simuler(self):
        # Variation aléatoire autour d'une vitesse de base
        vitesse_vent = self.vent_base + random.uniform(-3, 8)
        return round(max(0, vitesse_vent), 1)

class CapteurDebitEau:
    """Capteur de débit d'eau pour l'irrigation"""
    def __init__(self):
        self.eau_totale_utilisee = 0
        self.debit_max = 8.5
        
    def simuler(self, est_en_irrigation):
        if est_en_irrigation:
            # Débit variable avec petites fluctuations
            debit = self.debit_max * random.uniform(0.8, 1.0)
            # Ajouter au total (approximation: 1 cycle = 1 minute)
            self.eau_totale_utilisee += debit
        else:
            debit = 0
            
        return round(debit, 1), round(self.eau_totale_utilisee, 1)


