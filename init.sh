#!/bin/bash

# 🚀 Script d'initialisation du projet "SoftFlow"
# Usage: chmod +x init.sh && ./init.sh

set -e  # Arrête le script si une commande échoue

echo "🔧 Initialisation du projet Production Manager..."

# 1. Vérifier que Docker et Docker Compose sont installés ET fonctionnels
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Veuillez l'installer : https://docs.docker.com/get-docker/"
    exit 1
fi

# Vérifier que le daemon Docker est actif
if ! docker info > /dev/null 2>&1; then
    echo "❌ Le daemon Docker ne semble pas être en cours d'exécution."
    echo "   Veuillez démarrer Docker Desktop ou le service Docker (sudo systemctl start docker)."
    exit 1
fi

# Vérifier Docker Compose (v1 ou v2)
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé. Veuillez l'installer : https://docs.docker.com/compose/install/"
    exit 1
fi

# 2. Installer les dépendances backend
echo "📦 Installation des dépendances backend..."
cd backend
if [ ! -f "node_modules" ]; then
    npm install
fi
cd ..

# 3. Installer les dépendances frontend
echo "📦 Installation des dépendances frontend..."
cd frontend
if [ ! -f "node_modules" ]; then
    npm install
fi
cd ..

# 4. Créer les fichiers .env s'ils n'existent pas
echo "🔐 Configuration des variables d'environnement..."

if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    echo "✅ backend/.env créé à partir de .env.example"
fi

# 5. Lancer les services avec Docker Compose
echo "🐳 Démarrage des services avec Docker Compose..."
docker-compose up --build -d

# 6. Afficher les URLs d’accès
echo ""
echo "🎉 Projet démarré avec succès !"
echo ""
echo "🔗 Accès frontend : http://localhost:3000"
echo "🔗 API backend   : http://localhost:8000/api/health"
echo "🔗 MongoDB       : mongodb://localhost:27017 (accessible depuis les conteneurs)"
echo ""
echo "📝 Pour arrêter : docker-compose down"
echo "🔄 Pour relancer : docker-compose up -d"
