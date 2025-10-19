Outil interne pour gérer la production logicielle : tâches, sprints, releases, tests et documentation.

## 🛠️ Stack technique
- **Backend** : Node.js + Express + MongoDB (Mongoose)
- **Frontend** : Next.js (React)
- **Tests** : Jest + React Testing Library
- **Déploiement** : Docker + Docker Compose

## 🖥️ Développement local

### Prérequis
- [Docker](https://www.docker.com/) et [Docker Compose](https://docs.docker.com/compose/)
- Git

### Démarrage rapide
```bash
# Cloner le dépôt
git clone https://github.com/votre-organisation/monprojet-dev.git
cd monprojet-dev
```

# Initialiser l’environnement (installe les dépendances, démarre les conteneurs)
```bash
chmod +x init.sh
./init.sh
```

### Accéder à l’application
- 🔗 Frontend: http://localhost:3000
- 🔗 API Health Check: http://localhost:8000/api/health

## Project Structure
    SoftFlow-dev/
    ├── backend/       # API Express, modèles MongoDB, routes
    ├── frontend/      # Application Next.js
    ├── docker-compose.yml
    ├── init.sh        # Script d’initialisation en une commande
    └── README.md      # ← Vous êtes ici

## Running Tests
```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
