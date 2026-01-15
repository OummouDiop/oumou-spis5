# -*- coding: utf-8 -*-
"""
Script d'entraînement du modèle de prédiction d'humidité du sol
Utilise les données historiques pour créer un modèle RandomForest
"""

import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
from sklearn.preprocessing import StandardScaler
import joblib
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

# Configuration
DATA_FILE = 'sensor_data.csv'
MODEL_FILE = '../backend/soil_moisture_model_v2.pkl'
WINDOW_SIZE = 5  # Nombre de points historiques pour prédire

def load_and_prepare_data():
    """Charge et prépare les données"""
    print("=" * 80)
    print("📂 CHARGEMENT DES DONNÉES")
    print("=" * 80 + "\n")
    
    # Charger les données
    df = pd.read_csv(DATA_FILE)
    print(f"✓ {len(df)} enregistrements chargés depuis {DATA_FILE}")
    
    # Convertir created_at en datetime (format mixte)
    df['created_at'] = pd.to_datetime(df['created_at'], format='mixed')
    
    # Trier par date
    df = df.sort_values('created_at').reset_index(drop=True)
    
    # Sélectionner les colonnes des capteurs dans le bon ordre
    sensor_columns = [
        'humidity', 'temperature', 'soil_moisture', 
        'soil_moisture_10cm', 'soil_moisture_30cm', 'soil_moisture_60cm',
        'light', 'wind_speed', 'rainfall', 'rainfall_intensity'
    ]
    
    # Convertir rainfall en numérique (True/False → 1/0)
    df['rainfall'] = df['rainfall'].map({'True': 1, 'False': 0, True: 1, False: 0})
    
    # Convertir rainfall_intensity en numérique
    intensity_map = {'none': 0, 'light': 1, 'moderate': 2, 'heavy': 3}
    df['rainfall_intensity'] = df['rainfall_intensity'].map(intensity_map).fillna(0).astype(int)
    
    print(f"✓ Données triées par date")
    print(f"✓ Période: {df['created_at'].min()} → {df['created_at'].max()}")
    print(f"\n📊 Statistiques des données:\n")
    print(df[sensor_columns].describe())
    
    return df, sensor_columns

def create_sequences(df, sensor_columns):
    """Crée des séquences de WINDOW_SIZE points pour l'entraînement"""
    print("\n" + "=" * 80)
    print("🔄 CRÉATION DES SÉQUENCES D'ENTRAÎNEMENT")
    print("=" * 80 + "\n")
    
    X = []  # Features (5 points × 10 capteurs = 50 features)
    y = []  # Target (soil_moisture du point suivant)
    
    # Parcourir les données et créer des fenêtres glissantes
    for i in range(len(df) - WINDOW_SIZE):
        # Prendre WINDOW_SIZE points consécutifs
        sequence = df[sensor_columns].iloc[i:i+WINDOW_SIZE].values
        
        # Aplatir la séquence (5 points × 10 capteurs = 50 features)
        flattened = sequence.flatten()
        
        # La cible est le soil_moisture du point suivant
        target = df['soil_moisture'].iloc[i + WINDOW_SIZE]
        
        X.append(flattened)
        y.append(target)
    
    X = np.array(X)
    y = np.array(y)
    
    print(f"✓ {len(X)} séquences créées")
    print(f"✓ Shape de X: {X.shape} (samples, features)")
    print(f"✓ Shape de y: {y.shape}")
    print(f"✓ Chaque séquence = {WINDOW_SIZE} points × {len(sensor_columns)} capteurs = {X.shape[1]} features")
    
    return X, y

def train_model(X, y):
    """Entraîne le modèle RandomForest"""
    print("\n" + "=" * 80)
    print("🤖 ENTRAÎNEMENT DU MODÈLE")
    print("=" * 80 + "\n")
    
    # Diviser en train/test (80/20)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, shuffle=True
    )
    
    print(f"✓ Données d'entraînement: {len(X_train)} séquences")
    print(f"✓ Données de test: {len(X_test)} séquences")
    
    # Normalisation des features
    print("\n🔧 Normalisation des données...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Créer et entraîner le modèle
    print("🔧 Entraînement du RandomForest...")
    model = RandomForestRegressor(
        n_estimators=200,      # Plus d'arbres pour meilleure précision
        max_depth=15,          # Profondeur adaptée
        min_samples_split=5,   # Éviter l'overfitting
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,             # Utiliser tous les CPU
        verbose=0
    )
    
    model.fit(X_train_scaled, y_train)
    
    print("✓ Modèle entraîné!\n")
    
    # Évaluation sur l'ensemble de test
    print("📊 ÉVALUATION DU MODÈLE:\n")
    
    # Prédictions sur train
    y_train_pred = model.predict(X_train_scaled)
    train_r2 = r2_score(y_train, y_train_pred)
    train_rmse = np.sqrt(mean_squared_error(y_train, y_train_pred))
    train_mae = mean_absolute_error(y_train, y_train_pred)
    
    # Prédictions sur test
    y_test_pred = model.predict(X_test_scaled)
    test_r2 = r2_score(y_test, y_test_pred)
    test_rmse = np.sqrt(mean_squared_error(y_test, y_test_pred))
    test_mae = mean_absolute_error(y_test, y_test_pred)
    
    print(f"  📈 Ensemble d'entraînement:")
    print(f"     • R² Score: {train_r2:.4f}")
    print(f"     • RMSE: {train_rmse:.2f}%")
    print(f"     • MAE: {train_mae:.2f}%")
    
    print(f"\n  📉 Ensemble de test:")
    print(f"     • R² Score: {test_r2:.4f}")
    print(f"     • RMSE: {test_rmse:.2f}%")
    print(f"     • MAE: {test_mae:.2f}%")
    
    # Quelques exemples de prédictions
    print(f"\n  🎯 Exemples de prédictions (sur test):")
    for i in range(min(5, len(y_test))):
        print(f"     Point {i+1}: Réel={y_test[i]:.1f}%, Prédit={y_test_pred[i]:.1f}%, Erreur={abs(y_test[i]-y_test_pred[i]):.1f}%")
    
    # Feature importance
    print(f"\n  🔍 Top 10 Features les plus importantes:")
    feature_names = []
    for i in range(WINDOW_SIZE):
        for col in ['humidity', 'temperature', 'soil_moisture', 'soil_moisture_10cm',
                   'soil_moisture_30cm', 'soil_moisture_60cm', 'light', 'wind_speed',
                   'rainfall', 'rainfall_intensity']:
            feature_names.append(f"{col}_t{i+1}")
    
    importances = model.feature_importances_
    indices = np.argsort(importances)[::-1][:10]
    
    for i, idx in enumerate(indices):
        print(f"     {i+1}. {feature_names[idx]}: {importances[idx]:.4f}")
    
    return model, scaler, test_r2, test_rmse

def save_model(model, scaler):
    """Sauvegarde le modèle et le scaler dans un pipeline"""
    print("\n" + "=" * 80)
    print("💾 SAUVEGARDE DU MODÈLE")
    print("=" * 80 + "\n")
    
    # Créer un pipeline avec le scaler et le modèle
    pipeline = {
        'scaler': scaler,
        'model': model,
        'window_size': WINDOW_SIZE,
        'trained_at': datetime.now().isoformat(),
        'version': 'v2.0'
    }
    
    # Sauvegarder
    joblib.dump(pipeline, MODEL_FILE)
    
    import os
    file_size = os.path.getsize(MODEL_FILE) / (1024 * 1024)  # MB
    
    print(f"✓ Modèle sauvegardé: {MODEL_FILE}")
    print(f"✓ Taille du fichier: {file_size:.2f} MB")
    print(f"✓ Date: {pipeline['trained_at']}")
    
    # Test de rechargement
    print("\n🔄 Test de rechargement...")
    loaded_pipeline = joblib.load(MODEL_FILE)
    print(f"✓ Modèle rechargé avec succès!")
    print(f"✓ Version: {loaded_pipeline['version']}")
    print(f"✓ Window size: {loaded_pipeline['window_size']}")

def main():
    """Fonction principale"""
    print("\n" + "=" * 80)
    print("🌱 ENTRAÎNEMENT DU MODÈLE DE PRÉDICTION D'HUMIDITÉ DU SOL")
    print("=" * 80 + "\n")
    
    start_time = datetime.now()
    
    # 1. Charger les données
    df, sensor_columns = load_and_prepare_data()
    
    # 2. Créer les séquences
    X, y = create_sequences(df, sensor_columns)
    
    # 3. Entraîner le modèle
    model, scaler, r2_score, rmse = train_model(X, y)
    
    # 4. Sauvegarder le modèle
    save_model(model, scaler)
    
    # Résumé final
    elapsed = (datetime.now() - start_time).total_seconds()
    
    print("\n" + "=" * 80)
    print("✅ ENTRAÎNEMENT TERMINÉ AVEC SUCCÈS!")
    print("=" * 80 + "\n")
    
    print(f"📊 Résumé:")
    print(f"   • Temps d'entraînement: {elapsed:.1f} secondes")
    print(f"   • Score R² (test): {r2_score:.4f}")
    print(f"   • RMSE (test): {rmse:.2f}%")
    print(f"   • Modèle sauvegardé: {MODEL_FILE}")
    
    print(f"\n🚀 Le modèle est prêt à être utilisé!")
    print(f"   Pour tester: python ../backend/test_model.py")
    print(f"   Pour l'API: Redémarrer le backend FastAPI\n")

if __name__ == "__main__":
    main()
