# 🔗 Guide de connexion Simulation → Backend

## 📝 Vue d'ensemble

Ce guide explique comment connecter votre simulation de capteurs IoT avec votre backend FastAPI.

## 🏗️ Architecture

```
┌─────────────────┐         HTTP POST          ┌──────────────────┐
│   Simulation    │  ────────────────────────>  │  Backend FastAPI │
│  (test/...)     │    /send-data              │   (backend/)     │
│                 │  <────────────────────────  │                  │
│  - Capteurs     │    Décision irrigation     │  - SQLite DB     │
│  - Météo        │                             │  - Logique       │
└─────────────────┘                             └──────────────────


## 🚀 Étapes de démarrage

### **1️⃣ Démarrer le backend**

Ouvrez un **premier terminal** et lancez le backend :

```powershell
# Aller dans le dossier backend
cd backend

# Installer les dépendances (première fois seulement)
pip install -r requirements.txt

# Démarrer le serveur FastAPI
uvicorn main:app --reload
```

✅ Le backend est accessible sur : `http://127.0.0.1:8000`

Vous pouvez tester avec : `http://127.0.0.1:8000` (devrait afficher "IoT Irrigation Backend Running ✔")

---

### **2️⃣ Lancer la simulation connectée**

Ouvrez un **deuxième terminal** et lancez la simulation :

```powershell
# Aller dans le dossier test
cd test

# Installer requests si nécessaire
pip install requests

# Lancer la simulation connectée au backend
python simulation_backend.py
```

---

### **3️⃣ Observer les résultats**

La simulation va :
- ✅ Générer des données de capteurs réalistes
- ✅ Les envoyer au backend toutes les 5 secondes
- ✅ Afficher la décision d'irrigation du backend
- ✅ Stocker l'historique dans la base de données SQLite

**Exemple de sortie :**
```
⏰ Heure: 14:00
🌡️  Température: 28.3°C
💧 Humidité air: 42.5%
🌱 Humidité sol (10cm): 28.4%
☀️  Lumière: 67500 lux
🌬️  Vent: 6.2 km/h
🌧️  Pluie: Non

📤 Envoi #1 vers le backend...
✅ Réponse reçue!
💦 Pompe: 🟢 ACTIVE
📋 Message: Soil dry → Pump activated
```

---

## 📊 Consulter l'historique

### **Via API**
Ouvrez votre navigateur : `http://127.0.0.1:8000/history`

Vous verrez toutes les données stockées en JSON.

### **Via Base de données**
Le fichier `backend/irrigation.db` contient toutes les données.

Vous pouvez l'ouvrir avec un outil SQLite ou en Python :

```python
import sqlite3

conn = sqlite3.connect('backend/irrigation.db')
cursor = conn.cursor()
cursor.execute("SELECT * FROM sensor_data ORDER BY created_at DESC LIMIT 10")
for row in cursor.fetchall():
    print(row)
```

---

## 🛠️ Fichiers de simulation

| Fichier | Description |
|---------|-------------|
| `simulation_backend.py` | 🔗 Simulation connectée au backend (RECOMMANDÉ) |
| `main.py` | 🖥️ Simulation locale autonome (sans backend) |

---

## 🔧 Dépannage

### ❌ Erreur "Backend non accessible"
- Vérifiez que le backend est bien démarré (`uvicorn main:app --reload`)
- Vérifiez l'URL : `http://127.0.0.1:8000`

### ❌ Erreur "Module 'requests' not found"
```powershell
pip install requests
```

### ❌ Erreur "Module 'sensors' not found"
Assurez-vous d'être dans le dossier `test/` :
```powershell
cd test
python simulation_backend.py
```

---

## 📈 Prochaines étapes

1. ✅ **Frontend** : Créer une interface web pour visualiser en temps réel
2. ✅ **Dashboard** : Graphiques d'historique avec Chart.js
3. ✅ **Alertes** : Notifications par email/SMS
4. ✅ **Multi-zones** : Gérer plusieurs zones d'irrigation

---

## 📞 Support

Pour toute question, consultez :
- `backend/README.md` - Documentation du backend
- `test/config.py` - Configuration de la simulation

---

**Bon développement ! 🌱💧**
