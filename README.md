Outil interne pour gérer la production logicielle : tâches, sprints, releases, tests et documentation.

## Stack technique
- **Backend** : Node.js + Express + MongoDB (Mongoose)
- **Frontend** : Next.js (React)
- **Tests** : Jest + React Testing Library
- **Déploiement** : Docker + Docker Compose

## Développement local

### Prérequis
- [Docker](https://www.docker.com/) et [Docker Compose](https://docs.docker.com/compose/)
- Git

### Démarrage rapide
```bash
# Cloner le dépôt
git clone https://github.com/votre-organisation/monprojet-dev.git
cd monprojet-dev
```

### Initialiser l’environnement (installe les dépendances, démarre les conteneurs)
```bash
chmod +x init.sh
./init.sh
```

### Accéder à l’application
- Frontend: http://localhost:3000
- API Health Check: http://localhost:8000/api/health

## Structure du projet
    SoftFlow-dev/
    ├── backend/       # API Express, modèles MongoDB, routes
    ├── frontend/      # Application Next.js
    ├── docker-compose.yml
    ├── init.sh        # Script d’initialisation en une commande
    └── README.md      # ← Vous êtes ici

## Tests et couverture

### Lancer les tests
```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
```

### Générer les rapports de couverture
```bash
# Backend
cd backend && npm run test:coverage

# Frontend
cd frontend && npm run test:coverage
```

Les rapports de couverture sont générés dans le dossier `coverage/` de chaque partie (backend et frontend).

## Linting

### Vérifier le code
```bash
# Backend
cd backend && npm run lint

# Frontend
cd frontend && npm run lint
```

### Corriger automatiquement les erreurs de linting
```bash
# Backend
cd backend && npm run lint:fix

# Frontend
cd frontend && npm run lint:fix
```

## Documentation des routes API

Pour documenter un nouvel endpoint dans le backend, ajoutez un commentaire JSDoc au-dessus de la définition de la route dans le fichier de routes approprié. Utilisez les balises `@swagger` pour décrire l'endpoint selon la spécification OpenAPI.

**Exemple :**

```javascript
/**
 * @swagger
 * /projects:
 *   get:
 *     summary: Get all projects
 *     description: Retrieve a list of all projects
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of projects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Project'
 */
router.get('/projects', protect, getProjects);
```

Assurez-vous que les schémas référencés (comme `Project`) sont définis dans la spécification OpenAPI. La documentation est générée dynamiquement à partir de ces commentaires lors du démarrage de l'application.
