
# Nouvelle configuration MongoDB
from pymongo import MongoClient

# URL de connexion MongoDB (par défaut, local)
MONGO_URL = "mongodb://localhost:27017/"
DB_NAME = "irrigation"

client = MongoClient(MONGO_URL)
db = client[DB_NAME]
