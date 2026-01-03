"""
Script de démonstration de l'adaptation intelligente par saison
"""

from config import CONFIG_SAISONNIER, obtenir_seuils_saison

print("=" * 70)
print("🌍 SYSTÈME D'IRRIGATION INTELLIGENT - ADAPTATION SAISONNIÈRE")
print("=" * 70)
print()

saisons = ['printemps', 'ete', 'automne', 'hiver']

for saison in saisons:
    seuils = obtenir_seuils_saison(saison)
    
    # Icône selon saison
    icone = {'printemps': '🌸', 'ete': '🌞', 'automne': '🍂', 'hiver': '❄️'}[saison]
    
    print(f"{icone} {saison.upper()}")
    print(f"   Description: {seuils['description']}")
    print(f"   ├─ Déclenche irrigation si humidité < {seuils['seuil_declenchement']}%")
    print(f"   └─ Arrête irrigation si humidité >= {seuils['seuil_arret']}%")
    print()

print("=" * 70)
print("📊 EXEMPLE PRATIQUE")
print("=" * 70)
print()

humidite_test = 35

for saison in saisons:
    seuils = obtenir_seuils_saison(saison)
    icone = {'printemps': '🌸', 'ete': '🌞', 'automne': '🍂', 'hiver': '❄️'}[saison]
    
    # Tester si irrigation se déclenche
    doit_irriguer = humidite_test < seuils['seuil_declenchement']
    
    print(f"{icone} {saison.upper()} - Humidité actuelle: {humidite_test}%")
    
    if doit_irriguer:
        print(f"   🚨 IRRIGATION ACTIVE (< {seuils['seuil_declenchement']}%)")
        print(f"   → Objectif: atteindre {seuils['seuil_arret']}%")
    else:
        print(f"   ✅ PAS D'IRRIGATION (>= {seuils['seuil_declenchement']}%)")
    print()

print("=" * 70)
print("💡 POURQUOI CETTE INTELLIGENCE ?")
print("=" * 70)
print()
print("🌞 ÉTÉ:")
print("   ├─ Évaporation forte → Besoin élevé")
print("   ├─ Déclenche à 40% (au lieu de 30%)")
print("   └─ Objectif 70% (au lieu de 60%)")
print()
print("❄️ HIVER:")
print("   ├─ Évaporation faible → Besoin réduit")
print("   ├─ Déclenche à 20% (au lieu de 30%)")
print("   └─ Objectif 50% (au lieu de 60%)")
print()
print("💧 ÉCONOMIE D'EAU: 30-40% par adaptation saisonnière")
print()
