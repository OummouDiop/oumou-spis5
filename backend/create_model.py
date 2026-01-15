#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Crée un modèle de régression simple pour prédire l'humidité du sol
basé sur les 5 derniers points de capteurs (50 features)
"""

import pickle
import numpy as np
from sklearn.ensemble import RandomForestRegressor
import os

print("🔨 Création d'un modèle de prédiction simple...")

# Générer des données d'entraînement synthétiques
# 50 features = 5 points × 10 capteurs
n_samples = 1000
X_train = np.random.rand(n_samples, 50) * 100  # Features entre 0-100

# Y = humidité du sol prédite (entre 15-90%)
# Règle simple : moyenne des soil_moisture des 5 points
# soil_moisture est aux positions 2, 12, 22, 32, 42 (index 2 de chaque point)
y_train = np.mean([
    X_train[:, 2],   # soil_moisture du point 1
    X_train[:, 12],  # soil_moisture du point 2
    X_train[:, 22],  # soil_moisture du point 3
    X_train[:, 32],  # soil_moisture du point 4
    X_train[:, 42],  # soil_moisture du point 5
], axis=0) + np.random.normal(0, 5, n_samples)

# Cliper entre 15 et 90
y_train = np.clip(y_train, 15, 90)

print(f"  📊 Données d'entraînement: {n_samples} samples, {X_train.shape[1]} features")
print(f"  📈 Cible (humidité): min={y_train.min():.1f}%, max={y_train.max():.1f}%, mean={y_train.mean():.1f}%")

# Créer et entraîner le modèle
model = RandomForestRegressor(
    n_estimators=100,
    max_depth=10,
    random_state=42,
    n_jobs=-1
)

print("🎓 Entraînement du modèle...")
model.fit(X_train, y_train)

# Évaluer le modèle
from sklearn.metrics import r2_score, mean_squared_error
y_pred = model.predict(X_train)
r2 = r2_score(y_train, y_pred)
rmse = np.sqrt(mean_squared_error(y_train, y_pred))
print(f"  ✅ R² Score: {r2:.4f}")
print(f"  ✅ RMSE: {rmse:.2f}%")

# Sauvegarder le modèle
model_path = os.path.join(os.path.dirname(__file__), "soil_moisture_model_v2.pkl")
print(f"\n💾 Sauvegarde du modèle en {model_path}...")

try:
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
    print(f"✅ Modèle sauvegardé avec succès!")
    print(f"✅ Taille du fichier: {os.path.getsize(model_path) / 1024 / 1024:.2f} MB")
except Exception as e:
    print(f"❌ Erreur lors de la sauvegarde: {e}")
    exit(1)

# Tester le modèle
print("\n🧪 Test du modèle...")
test_sample = np.random.rand(1, 50) * 100
prediction = model.predict(test_sample)[0]
print(f"  Test input: 50 features aléatoires")
print(f"  🔮 Prédiction: {prediction:.2f}%")

print("\n✅ Modèle créé et testé avec succès!")
print("🚀 Redémarrez le backend pour charger le nouveau modèle.")
