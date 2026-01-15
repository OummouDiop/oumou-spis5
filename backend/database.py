# Stockage en mémoire simple (sans MongoDB)
from datetime import datetime
from typing import Dict, List, Any

class InMemoryDB:
    def __init__(self):
        self.collections: Dict[str, List[Dict[str, Any]]] = {}
    
    def __getitem__(self, collection_name: str):
        if collection_name not in self.collections:
            self.collections[collection_name] = []
        return InMemoryCollection(self.collections[collection_name])

class InMemoryCollection:
    def __init__(self, data: List[Dict[str, Any]]):
        self.data = data
    
    def insert_one(self, document: Dict[str, Any]):
        self.data.append(document.copy())
        return type('InsertResult', (), {'inserted_id': len(self.data) - 1})()
    
    def find_one(self, query: Dict[str, Any]):
        for doc in reversed(self.data):
            match = all(doc.get(k) == v for k, v in query.items())
            if match:
                return doc
        return None
    
    def find(self, query: Dict[str, Any] = None):
        if query is None:
            return InMemoryCursor(self.data[:])
        
        results = []
        for doc in self.data:
            match = all(doc.get(k) == v for k, v in query.items())
            if match:
                results.append(doc)
        return InMemoryCursor(results)
    
    def update_one(self, query: Dict[str, Any], update: Dict[str, Any], upsert: bool = False):
        for doc in self.data:
            match = all(doc.get(k) == v for k, v in query.items())
            if match:
                if '$set' in update:
                    doc.update(update['$set'])
                return type('UpdateResult', (), {'matched_count': 1, 'modified_count': 1})()
        
        if upsert and '$set' in update:
            new_doc = query.copy()
            new_doc.update(update['$set'])
            self.data.append(new_doc)
            return type('UpdateResult', (), {'matched_count': 0, 'modified_count': 0, 'upserted_id': len(self.data) - 1})()
        
        return type('UpdateResult', (), {'matched_count': 0, 'modified_count': 0})()

class InMemoryCursor:
    def __init__(self, data: List[Dict[str, Any]]):
        self.data = data
    
    def sort(self, key: str, direction: int = 1):
        reverse = direction == -1
        # Tri spécial pour created_at (datetime) et _id (index)
        if key == "created_at":
            self.data = sorted(self.data, key=lambda x: x.get(key, datetime.min), reverse=reverse)
        elif key == "_id":
            self.data = sorted(self.data, key=lambda x: x.get(key, 0), reverse=reverse)
        else:
            self.data = sorted(self.data, key=lambda x: x.get(key, ''), reverse=reverse)
        return self
    
    def limit(self, count: int):
        self.data = self.data[:count]
        return self
    
    def __iter__(self):
        return iter(self.data)

# Créer l'instance de base de données en mémoire
db = InMemoryDB()