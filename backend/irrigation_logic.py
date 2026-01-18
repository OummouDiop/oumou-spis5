def irrigation_decision(soil_moisture: float, pump_was_active: bool = False, rainfall: bool = False) -> dict:
    """
    Soil moisture scale: 0 (dry) → 100 (wet)
    Logique d'irrigation intelligente :
    - Démarre si humidité < 40%
    - Continue jusqu'à atteindre 70% (hysteresis)
    - ⛔ PRIORITÉ : S'arrête IMMÉDIATEMENT dès qu'il pleut
    """
    
    # Seuils d'irrigation basés sur l'humidité du sol
    SEUIL_BAS = 40    # Déclenche irrigation si < 40%
    SEUIL_HAUT = 70   # Arrête irrigation si >= 70%
    
    # ⛔ RÈGLE PRIORITAIRE : ARRÊT IMMÉDIAT si pluie détectée
    if rainfall:
        if pump_was_active:
            return {
                "pump": False,
                "message": f"🌧️ Pluie détectée → Irrigation ARRÊTÉE (humidité: {soil_moisture:.1f}%)"
            }
        else:
            return {
                "pump": False,
                "message": f"🌧️ Pluie détectée → Pas d'irrigation (humidité: {soil_moisture:.1f}%)"
            }
    
    # Si la pompe était déjà active, continuer jusqu'à atteindre le seuil haut
    if pump_was_active:
        if soil_moisture >= SEUIL_HAUT:
            return {
                "pump": False,
                "message": f"✅ Objectif atteint ({soil_moisture:.1f}% >= {SEUIL_HAUT}%) → Irrigation OFF"
            }
        else:
            return {
                "pump": True,
                "message": f"💦 Irrigation en cours ({soil_moisture:.1f}% → objectif {SEUIL_HAUT}%)"
            }
    
    # Si la pompe était inactive, vérifier s'il faut démarrer (pas de pluie)
    if soil_moisture < SEUIL_BAS:
        return {
            "pump": True,
            "message": f"💦 Sol sec ({soil_moisture:.1f}%) → Irrigation ON"
        }
    else:
        return {
            "pump": False,
            "message": f"✓ Humidité OK ({soil_moisture:.1f}%) → Pump OFF"
        }
