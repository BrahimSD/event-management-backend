# Backend - Event Management API

API RESTful construite avec NestJS pour la gestion d'événements avec carsharing intégré, utilisant MongoDB comme base de données.

## Technologies

- **Framework**: NestJS
- **Langage**: TypeScript
- **Base de données**: MongoDB (Atlas)
- **ODM**: Mongoose
- **Authentification**: JWT
- **Upload**: Cloudinary
- **Maps**: Google Maps API

## Démarrage Rapide

1. **Installer les dépendances**
   ```bash
   npm install
   ```

2. **Vérifier la configuration**
   - La base de données MongoDB 
   - Les clés API Cloudinary et Google Maps sont prêtes

3. **Démarrer le serveur**
   ```bash
   npm run start:dev
   ```

L'API sera accessible sur http://localhost:3000

## Configuration Environnement

Le fichier `.env` est déjà configuré avec MongoDB Atlas :

```env
# MongoDB Configuration
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database-name?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here

# Server Configuration
PORT=3000

# Google Maps API
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Frontend URL for CORS
FRONTEND_URL=http://localhost:4200
```

## Scripts Disponibles

```bash
# Développement
npm run start:dev          # Mode développement avec hot-reload

# Production
npm run build              # Build de l'application
npm run start:prod         # Lancement en mode production
```

## Structure du Projet

```
src/
├── auth/                  # Module d'authentification JWT
├── carsharing/           # Module de carsharing
├── chat/                 # Module de chat temps réel
├── config/               # Configuration MongoDB/Cloudinary
├── events/               # Module de gestion d'événements
├── notifications/        # Module de notifications
├── services/            # cloudinary
├── users/               # Module de gestion des utilisateurs
├── app.module.ts        # Module principal
└── main.ts              # Point d'entrée
```

## API Endpoints Principaux

```
# Authentification
POST /auth/login           # Connexion
POST /auth/register        # Inscription
POST /auth/refresh         # Refresh token

# Événements
GET    /events             # Liste des événements
POST   /events             # Créer un événement
GET    /events/:id         # Détails d'un événement
PUT    /events/:id         # Modifier un événement
DELETE /events/:id         # Supprimer un événement

# Carsharing
GET    /carsharing         # Offres de carsharing
POST   /carsharing         # Créer une offre
POST   /carsharing/:id/book # Réserver une place

# Utilisateurs
GET    /users              # Liste des utilisateurs
GET    /users/profile      # Profil utilisateur
PUT    /users/profile      # Modifier le profil

# Upload
POST   /upload/image       # Upload d'image via Cloudinary
```

## Base de Données MongoDB

### Collections principales

- **users** - Utilisateurs de l'application
- **events** - Événements créés
- **carsharing** - Offres de covoiturage
- **notifications** - Notifications utilisateur
- **messages** - Messages de chat

## Services Externes

### Cloudinary (Upload d'images)
- Upload automatique des images d'événements et de profils
- Redimensionnement et optimisation automatique

### Google Maps API
- Géolocalisation pour les événements
- Calcul d'itinéraires pour le carsharing
