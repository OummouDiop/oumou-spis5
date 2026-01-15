# -*- coding: utf-8 -*-
"""
Script de test du modèle V2 avec données fictives
Crée des scénarios réalistes pour tester les prédictions
"""

import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import pandas as pd
import numpy as np
import joblib
from datetime import datetime, timedelta

MODEL_FILE = 'soil_moisture_model_v2.pkl'
WINDOW_SIZE = 5

def create_synthetic_data():
    """Crée des données fictives réalistes"""
    print("🎲 Génération de données fictives réalistes...\n")
    
    np.random.seed(42)
    
    # Créer 30 jours de données (144 points à intervalle de 5 heures)
    date_range = pd.date_range(start='2026-01-01', periods=144, freq='5h')
    
    data = {
        'date': date_range,
        'humidity': 50 + 15 * np.sin(np.arange(144) * 2 * np.pi / 48) + np.random.normal(0, 5, 144),
        'temperature': 20 + 10 * np.sin(np.arange(144) * 2 * np.pi / 48) + np.random.normal(0, 2, 144),
        'soil_moisture': 60 + 10 * np.sin(np.arange(144) * 2 * np.pi / 48) + np.random.normal(0, 3, 144),
        'soil_moisture_10cm': 60 + 10 * np.sin(np.arange(144) * 2 * np.pi / 48) + np.random.normal(0, 3, 144),
        'soil_moisture_30cm': 70 + 5 * np.sin(np.arange(144) * 2 * np.pi / 48) + np.random.normal(0, 2, 144),
        'soil_moisture_60cm': 80 + 3 * np.sin(np.arange(144) * 2 * np.pi / 48) + np.random.normal(0, 1, 144),
        'light': 500 + 400 * np.sin(np.arange(144) * 2 * np.pi / 48) + np.random.normal(0, 50, 144),
        'wind_speed': 8 + 3 * np.sin(np.arange(144) * 2 * np.pi / 48) + np.random.normal(0, 1, 144),
        'rainfall': np.random.choice([0, 1], 144, p=[0.7, 0.3]),
        'rainfall_intensity': np.random.choice([0, 1, 2, 3], 144, p=[0.7, 0.15, 0.1, 0.05])
    }
    
    df = pd.DataFrame(data)
    
    # S'assurer que les valeurs sont dans les bonnes plages
    df['humidity'] = df['humidity'].clip(10, 95)
    df['temperature'] = df['temperature'].clip(5, 40)
    df['soil_moisture'] = df['soil_moisture'].clip(10, 100)
    df['soil_moisture_10cm'] = df['soil_moisture_10cm'].clip(10, 100)
    df['soil_moisture_30cm'] = df['soil_moisture_30cm'].clip(10, 100)
    df['soil_moisture_60cm'] = df['soil_moisture_60cm'].clip(10, 100)
    df['light'] = df['light'].clip(0, 1000)
    df['wind_speed'] = df['wind_speed'].clip(0, 20)
    
    print(f"✓ {len(df)} points de données générés (30 jours)\n")
    
    return df

def load_model():
    """Charge le modèle V2"""
    try:
        pipeline = joblib.load(MODEL_FILE)
        print(f"✓ Modèle chargé: {MODEL_FILE}\n")
        return pipeline
    except FileNotFoundError:
        print(f"❌ Erreur: {MODEL_FILE} non trouvé!")
        print("   Exécutez d'abord: python ../prediction/model_creating.py\n")
        return None

def predict_with_sequence(pipeline, sequence):
    """Fait une prédiction avec une séquence de 5 points"""
    # Aplatir la séquence
    flattened = sequence.flatten().reshape(1, -1)
    
    # Si c'est un pipeline (dict), utiliser scaler + model
    if isinstance(pipeline, dict):
        scaler = pipeline['scaler']
        model = pipeline['model']
        flattened_scaled = scaler.transform(flattened)
        prediction = model.predict(flattened_scaled)[0]
    else:
        # Ancien format
        prediction = pipeline.predict(flattened)[0]
    
    return prediction

def test_scenario_1_dry_to_wet(pipeline, df):
    """Scénario 1: Sol sec → devient humide (après pluie)"""
    print("=" * 80)
    print("🧪 SCÉNARIO 1: Sol sec → devient humide (après pluie)")
    print("=" * 80)
    
    # Sélectionner 5 points consécutifs avec tendance vers l'humidité
    sequence_data = df[['humidity', 'temperature', 'soil_moisture', 'soil_moisture_10cm',
                        'soil_moisture_30cm', 'soil_moisture_60cm', 'light', 'wind_speed',
                        'rainfall', 'rainfall_intensity']].iloc[10:15].values
    
    print("\n📊 Historique (5 derniers points, 30 heures):\n")
    
    for i, row in enumerate(df.iloc[10:15].iterrows()):
        idx, data = row
        print(f"  Point {i+1} (t-{5-i}h):")
        print(f"    📅 {data['date'].strftime('%Y-%m-%d %H:%M')}")
        print(f"    💧 Humidité air: {data['humidity']:.1f}%")
        print(f"    🌡️  Température: {data['temperature']:.1f}°C")
        print(f"    🌱 Humidité sol: {data['soil_moisture']:.1f}%")
        print(f"    ☔ Pluie: {'Oui' if data['rainfall'] else 'Non'} (intensité: {int(data['rainfall_intensity'])})")
        print()
    
    prediction = predict_with_sequence(pipeline, sequence_data)
    
    print(f"🎯 PRÉDICTION (dans 6 heures):")
    print(f"   Humidité du sol prédite: {prediction:.2f}%\n")
    
    return prediction

def test_scenario_2_constant_conditions(pipeline, df):
    """Scénario 2: Conditions stables"""
    print("=" * 80)
    print("🧪 SCÉNARIO 2: Conditions stables (sans variation)")
    print("=" * 80)
    
    # Sélectionner 5 points avec conditions similaires
    sequence_data = df[['humidity', 'temperature', 'soil_moisture', 'soil_moisture_10cm',
                        'soil_moisture_30cm', 'soil_moisture_60cm', 'light', 'wind_speed',
                        'rainfall', 'rainfall_intensity']].iloc[30:35].values
    
    print("\n📊 Historique (5 derniers points, 30 heures):\n")
    
    for i, row in enumerate(df.iloc[30:35].iterrows()):
        idx, data = row
        print(f"  Point {i+1} (t-{5-i}h):")
        print(f"    📅 {data['date'].strftime('%Y-%m-%d %H:%M')}")
        print(f"    💧 Humidité air: {data['humidity']:.1f}%")
        print(f"    🌡️  Température: {data['temperature']:.1f}°C")
        print(f"    🌱 Humidité sol: {data['soil_moisture']:.1f}%")
        print()
    
    prediction = predict_with_sequence(pipeline, sequence_data)
    
    print(f"🎯 PRÉDICTION (dans 6 heures):")
    print(f"   Humidité du sol prédite: {prediction:.2f}%\n")
    
    return prediction

def test_scenario_3_hot_sunny(pipeline, df):
    """Scénario 3: Journée très chaude et ensoleillée"""
    print("=" * 80)
    print("🧪 SCÉNARIO 3: Journée très chaude et ensoleillée (assèchement)")
    print("=" * 80)
    
    # Créer une séquence avec conditions chaudes/ensoleillées
    sequence_data_list = []
    for i in range(50, 55):
        row = df.iloc[i][['humidity', 'temperature', 'soil_moisture', 'soil_moisture_10cm',
                          'soil_moisture_30cm', 'soil_moisture_60cm', 'light', 'wind_speed',
                          'rainfall', 'rainfall_intensity']].values
        # Modifier pour conditions très chaudes
        row[0] = max(15, row[0] - 20)  # Humidité basse
        row[1] = min(40, row[1] + 10)  # Température haute
        row[6] = min(1000, row[6] + 300)  # Beaucoup de lumière
        sequence_data_list.append(row)
    
    sequence_data = np.array(sequence_data_list)
    
    print("\n📊 Historique (5 derniers points, 30 heures):\n")
    
    for i in range(5):
        print(f"  Point {i+1} (t-{5-i}h):")
        print(f"    💧 Humidité air: {sequence_data[i, 0]:.1f}%")
        print(f"    🌡️  Température: {sequence_data[i, 1]:.1f}°C")
        print(f"    🌱 Humidité sol: {sequence_data[i, 2]:.1f}%")
        print(f"    💡 Lumière: {sequence_data[i, 6]:.1f}")
        print()
    
    prediction = predict_with_sequence(pipeline, sequence_data)
    
    print(f"🎯 PRÉDICTION (dans 6 heures):")
    print(f"   Humidité du sol prédite: {prediction:.2f}%")
    print(f"   (Attendu: basse, sol assèché)\n")
    
    return prediction

def test_scenario_4_rainy_period(pipeline, df):
    """Scénario 4: Période de pluies"""
    print("=" * 80)
    print("🧪 SCÉNARIO 4: Période de pluies (sol très humide)")
    print("=" * 80)
    
    # Créer une séquence avec beaucoup de pluies
    sequence_data_list = []
    for i in range(70, 75):
        row = df.iloc[i][['humidity', 'temperature', 'soil_moisture', 'soil_moisture_10cm',
                          'soil_moisture_30cm', 'soil_moisture_60cm', 'light', 'wind_speed',
                          'rainfall', 'rainfall_intensity']].values.copy()
        # Modifier pour conditions pluvieuses
        row[0] = min(95, row[0] + 25)  # Humidité haute
        row[1] = max(5, row[1] - 8)    # Température basse
        row[2] = min(100, row[2] + 20) # Sol très humide
        row[3] = min(100, row[3] + 20)
        row[4] = min(100, row[4] + 15)
        row[5] = min(100, row[5] + 10)
        row[6] = max(50, row[6] - 300) # Peu de lumière
        row[8] = 1  # Pluie
        row[9] = 3  # Intense
        sequence_data_list.append(row)
    
    sequence_data = np.array(sequence_data_list)
    
    print("\n📊 Historique (5 derniers points, 30 heures):\n")
    
    for i in range(5):
        print(f"  Point {i+1} (t-{5-i}h):")
        print(f"    💧 Humidité air: {sequence_data[i, 0]:.1f}%")
        print(f"    🌡️  Température: {sequence_data[i, 1]:.1f}°C")
        print(f"    🌱 Humidité sol: {sequence_data[i, 2]:.1f}%")
        print(f"    ☔ Pluie: {'Oui ⚡' if sequence_data[i, 8] else 'Non'}")
        print()
    
    prediction = predict_with_sequence(pipeline, sequence_data)
    
    print(f"🎯 PRÉDICTION (dans 6 heures):")
    print(f"   Humidité du sol prédite: {prediction:.2f}%")
    print(f"   (Attendu: très élevée)\n")
    
    return prediction

def test_scenario_5_recovery(pipeline, df):
    """Scénario 5: Récupération après sécheresse"""
    print("=" * 80)
    print("🧪 SCÉNARIO 5: Récupération après sécheresse")
    print("=" * 80)
    
    # Scénario: sol sec puis arrosage/pluie
    sequence_data_list = []
    
    # 3 premiers points: sec
    for i in range(90, 93):
        row = df.iloc[i][['humidity', 'temperature', 'soil_moisture', 'soil_moisture_10cm',
                          'soil_moisture_30cm', 'soil_moisture_60cm', 'light', 'wind_speed',
                          'rainfall', 'rainfall_intensity']].values.copy()
        row[2] = 20  # Très sec
        row[3] = 20
        row[4] = 30
        row[5] = 40
        row[8] = 0   # Pas de pluie
        sequence_data_list.append(row)
    
    # 2 derniers points: après arrosage
    for i in range(93, 95):
        row = df.iloc[i][['humidity', 'temperature', 'soil_moisture', 'soil_moisture_10cm',
                          'soil_moisture_30cm', 'soil_moisture_60cm', 'light', 'wind_speed',
                          'rainfall', 'rainfall_intensity']].values.copy()
        row[2] = 70  # Humide après arrosage
        row[3] = 70
        row[4] = 75
        row[5] = 80
        row[8] = 1   # Arrosage/pluie
        row[9] = 2   # Modérée
        sequence_data_list.append(row)
    
    sequence_data = np.array(sequence_data_list)
    
    print("\n📊 Historique (5 derniers points, 30 heures):\n")
    
    phases = ['SOL SEC', 'SOL SEC', 'SOL SEC', 'ARROSAGE', 'ARROSAGE']
    for i in range(5):
        print(f"  Point {i+1} (t-{5-i}h) - {phases[i]}:")
        print(f"    🌱 Humidité sol: {sequence_data[i, 2]:.1f}%")
        print(f"    ☔ Événement: {'Arrosage/Pluie' if sequence_data[i, 8] else 'Aucun'}")
        print()
    
    prediction = predict_with_sequence(pipeline, sequence_data)
    
    print(f"🎯 PRÉDICTION (dans 6 heures):")
    print(f"   Humidité du sol prédite: {prediction:.2f}%\n")
    
    return prediction

def batch_test(pipeline, df):
    """Test en batch avec 10 prédictions aléatoires"""
    print("=" * 80)
    print("🧪 TEST EN BATCH: 10 prédictions aléatoires")
    print("=" * 80 + "\n")
    
    predictions = []
    
    for batch_num in range(10):
        idx = np.random.randint(0, len(df) - 5)
        sequence_data = df[['humidity', 'temperature', 'soil_moisture', 'soil_moisture_10cm',
                            'soil_moisture_30cm', 'soil_moisture_60cm', 'light', 'wind_speed',
                            'rainfall', 'rainfall_intensity']].iloc[idx:idx+5].values
        
        current_moisture = df['soil_moisture'].iloc[idx+4]
        prediction = predict_with_sequence(pipeline, sequence_data)
        predictions.append(prediction)
        
        print(f"  Prédiction {batch_num+1:2d}: {prediction:.2f}% (valeur actuelle: {current_moisture:.2f}%)")
    
    print(f"\n  Moyenne des prédictions: {np.mean(predictions):.2f}%")
    print(f"  Min: {np.min(predictions):.2f}%, Max: {np.max(predictions):.2f}%\n")

def main():
    """Fonction principale"""
    print("\n" + "=" * 80)
    print("🧪 TEST DU MODÈLE V2 AVEC DONNÉES FICTIVES")
    print("=" * 80 + "\n")
    
    # 1. Charger le modèle
    pipeline = load_model()
    if pipeline is None:
        return
    
    # 2. Créer des données fictives
    df = create_synthetic_data()
    
    # 3. Sauvegarder les données pour référence
    df.to_csv('synthetic_data.csv', index=False)
    print("✓ Données fictives sauvegardées: synthetic_data.csv\n")
    
    # 4. Tester les scénarios
    predictions = []
    
    predictions.append(test_scenario_1_dry_to_wet(pipeline, df))
    predictions.append(test_scenario_2_constant_conditions(pipeline, df))
    predictions.append(test_scenario_3_hot_sunny(pipeline, df))
    predictions.append(test_scenario_4_rainy_period(pipeline, df))
    predictions.append(test_scenario_5_recovery(pipeline, df))
    
    # 5. Test en batch
    batch_test(pipeline, df)
    
    # 6. Résumé
    print("=" * 80)
    print("📋 RÉSUMÉ DES TESTS")
    print("=" * 80 + "\n")
    
    print("✅ Prédictions de tous les scénarios:")
    scenarios = [
        "Scénario 1 (Sec → Humide)",
        "Scénario 2 (Conditions stables)",
        "Scénario 3 (Chaud/Ensoleillé)",
        "Scénario 4 (Pluies intenses)",
        "Scénario 5 (Récupération)"
    ]
    
    for i, pred in enumerate(predictions):
        print(f"  {scenarios[i]:30s}: {pred:6.2f}%")
    
    print(f"\n  Moyenne générale: {np.mean(predictions):.2f}%")
    print(f"  Écart-type: {np.std(predictions):.2f}%\n")
    
    print("=" * 80)
    print("✅ TOUS LES TESTS SONT TERMINÉS!")
    print("=" * 80 + "\n")

if __name__ == "__main__":
    main()
