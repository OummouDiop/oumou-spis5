CONFIG_SIMULATION = {
    'vitesse_simulation': 5,
    'humidite_initiale': 65,
    'saison': 'ete',
    'irrigation_automatique': True,
    'type_culture': 'tomates'  # Type de culture
}

# Garder l'ancienne pour compatibilité
SIMULATION_CONFIG = CONFIG_SIMULATION

CONFIG_CAPTEURS = {
    'seuil_humidite_bas': 30,
    'seuil_humidite_haut': 70,
    'debit_max': 10,
    'temp_min_irrigation': 25,      # Température minimum pour irriguer
    'lux_min_jour': 20000,          # Lumière minimum (éviter irrigation nocturne)
    'vitesse_vent_max': 15          # Vent maximum (éviter évaporation excessive)
}

# Configuration par type de culture
CONFIG_CULTURES = {
    # LÉGUMES-FRUITS (Forte consommation d'eau)
    'tomates': {
        'seuil_declenchement': 50,     # Déclenche si < 50%
        'seuil_arret': 80,             # Arrête si >= 80%
        'categorie': 'Légume-fruit',
        'consommation': 'Élevée 💧💧💧',
        'description': 'Besoin constant en eau, sensibles à la sécheresse'
    },
    'concombres': {
        'seuil_declenchement': 55,
        'seuil_arret': 85,
        'categorie': 'Légume-fruit',
        'consommation': 'Très élevée 💧💧💧',
        'description': '90% d\'eau, besoin énorme et constant'
    },
    'courgettes': {
        'seuil_declenchement': 50,
        'seuil_arret': 80,
        'categorie': 'Légume-fruit',
        'consommation': 'Élevée 💧💧💧',
        'description': 'Croissance rapide, besoin important'
    },
    'poivrons': {
        'seuil_declenchement': 50,
        'seuil_arret': 75,
        'categorie': 'Légume-fruit',
        'consommation': 'Élevée 💧💧💧',
        'description': 'Besoin régulier, pas de stress hydrique'
    },
    
    # LÉGUMES-FEUILLES (Consommation moyenne)
    'salades': {
        'seuil_declenchement': 40,
        'seuil_arret': 70,
        'categorie': 'Légume-feuille',
        'consommation': 'Moyenne 💧💧',
        'description': 'Besoin régulier mais modéré'
    },
    'epinards': {
        'seuil_declenchement': 40,
        'seuil_arret': 70,
        'categorie': 'Légume-feuille',
        'consommation': 'Moyenne 💧💧',
        'description': 'Préfère sol frais sans excès'
    },
    'choux': {
        'seuil_declenchement': 45,
        'seuil_arret': 75,
        'categorie': 'Légume-feuille',
        'consommation': 'Moyenne 💧💧',
        'description': 'Besoin constant mais résiste mieux'
    },
    'haricots': {
        'seuil_declenchement': 35,
        'seuil_arret': 65,
        'categorie': 'Légumineuse',
        'consommation': 'Moyenne 💧💧',
        'description': 'Fixe l\'azote, besoin modéré'
    },
    
    # LÉGUMES-RACINES (Faible consommation)
    'carottes': {
        'seuil_declenchement': 30,
        'seuil_arret': 60,
        'categorie': 'Légume-racine',
        'consommation': 'Faible 💧',
        'description': 'Racines profondes, résiste à la sécheresse'
    },
    'oignons': {
        'seuil_declenchement': 25,
        'seuil_arret': 55,
        'categorie': 'Légume-bulbe',
        'consommation': 'Faible 💧',
        'description': 'Éviter l\'excès d\'eau (pourriture)'
    },
    'ail': {
        'seuil_declenchement': 20,
        'seuil_arret': 50,
        'categorie': 'Légume-bulbe',
        'consommation': 'Très faible 💧',
        'description': 'Craint l\'excès d\'eau, préfère sec'
    },
    'pommes_de_terre': {
        'seuil_declenchement': 30,
        'seuil_arret': 60,
        'categorie': 'Légume-tubercule',
        'consommation': 'Faible 💧',
        'description': 'Besoin modéré, éviter engorgement'
    }
}

# Configuration intelligente par saison
CONFIG_SAISONNIER = {
    'printemps': {
        'seuil_declenchement': 30,    # Déclenche irrigation si < 30%
        'seuil_arret': 60,            # Arrête irrigation si >= 60%
        'description': 'Croissance active - Arrosage modéré'
    },
    'ete': {
        'seuil_declenchement': 40,    # Plus élevé : plantes ont plus soif
        'seuil_arret': 70,            # Objectif plus élevé
        'description': 'Forte évaporation - Arrosage intensif'
    },
    'automne': {
        'seuil_declenchement': 25,    # Moins d'arrosage
        'seuil_arret': 55,            # Objectif plus bas
        'description': 'Ralentissement - Arrosage réduit'
    },
    'hiver': {
        'seuil_declenchement': 20,    # Encore moins : plantes en repos
        'seuil_arret': 50,            # Objectif minimal
        'description': 'Repos végétatif - Arrosage minimal'
    }
}
# Fonction pour obtenir les seuils selon la saison
def obtenir_seuils_saison(saison):
    """Retourne les seuils d'irrigation adaptés à la saison"""
    return CONFIG_SAISONNIER.get(saison, CONFIG_SAISONNIER['printemps'])

# Fonction pour obtenir les seuils selon le type de culture
def obtenir_seuils_culture(type_culture):
    """Retourne les seuils d'irrigation adaptés au type de culture"""
    return CONFIG_CULTURES.get(type_culture, CONFIG_CULTURES['tomates'])

# Fonction intelligente : combine saison ET culture
def obtenir_seuils_intelligents(saison, type_culture):
    """
    Retourne les seuils optimaux en combinant saison et type de culture
    Prend en compte les besoins de la plante ET les conditions climatiques
    """
    seuils_culture = obtenir_seuils_culture(type_culture)
    seuils_saison = obtenir_seuils_saison(saison)
    
    # Coefficient saisonnier
    coefficient_saison = {
        'printemps': 1.0,   # Normal
        'ete': 1.2,         # +20% en été (évaporation forte)
        'automne': 0.9,     # -10% en automne
        'hiver': 0.7        # -30% en hiver
    }
    
    coef = coefficient_saison.get(saison, 1.0)
    
    # Ajuster les seuils de la culture selon la saison
    # En été : déclenche plus tôt, objectif plus élevé
    # En hiver : déclenche plus tard, objectif plus bas
    seuil_declenchement = min(seuils_culture['seuil_declenchement'] * coef, 90)
    seuil_arret = min(seuils_culture['seuil_arret'] * coef, 95)
    
    return {
        'seuil_declenchement': int(seuil_declenchement),
        'seuil_arret': int(seuil_arret),
        'culture': type_culture,
        'saison': saison,
        'description': f"{seuils_culture['categorie']} - {seuils_culture['description']}"
    }
    return CONFIG_SAISONNIER.get(saison, CONFIG_SAISONNIER['printemps'])

# Garder l'ancienne pour compatibilité
SENSOR_CONFIG = {
    'humidity_threshold_low': CONFIG_CAPTEURS['seuil_humidite_bas'],
    'humidity_threshold_high': CONFIG_CAPTEURS['seuil_humidite_haut'],
    'max_flow_rate': CONFIG_CAPTEURS['debit_max'],
    'min_irrigation_temp': CONFIG_CAPTEURS['temp_min_irrigation'],
    'min_daylight_lux': CONFIG_CAPTEURS['lux_min_jour'],
    'max_wind_speed': CONFIG_CAPTEURS['vitesse_vent_max']
}