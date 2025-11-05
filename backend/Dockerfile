# backend/Dockerfile
FROM node:18-alpine

# Installer les dépendances de compilation nécessaires pour bcrypt
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copier package.json et installer TOUTES les dépendances d'un coup
COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# Supprimer les outils de compilation (pour alléger l'image)
RUN apk del python3 make g++

# Copier le code source
COPY . .

EXPOSE 8000

CMD ["npm", "start"]
