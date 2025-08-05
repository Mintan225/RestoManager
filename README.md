# 🍽️ Restaurant Management System

## 📋 Architecture

Ce projet utilise une architecture **frontend/backend séparée** :

```
restaurant-management/
├── frontend/          # React + TypeScript + Vite
├── backend/           # Express + Node.js + TypeScript  
├── shared-types/      # Types et schémas partagés
├── docs/             # Documentation et guides de déploiement
└── .git/             # Contrôle de version Git
```

## 🚀 Démarrage Rapide

### Prérequis
- **Node.js** 20+
- **PostgreSQL** (local ou cloud)
- **Git**

### Installation

1. **Cloner le repository**
```bash
git clone <your-repo-url>
cd restaurant-management
```

2. **Backend Setup**
```bash
cd backend
npm install
cp .env.example .env
# Configurer DATABASE_URL et autres variables
npm run dev
```

3. **Frontend Setup** (terminal séparé)
```bash
cd frontend
npm install
npm run dev
```

4. **Accès**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Admin**: admin / admin123

## 🛠️ Développement

### Structure Frontend (`frontend/`)
```
src/
├── components/       # Components React réutilisables
├── pages/           # Pages de l'application
├── hooks/           # Hooks personnalisés
├── lib/             # Utilitaires et configuration
└── App.tsx          # Point d'entrée principal
```

### Structure Backend (`backend/`)
```
├── routes.ts        # Routes API Express
├── storage.ts       # Couche d'accès aux données
├── db.ts           # Configuration base de données
├── index.ts        # Point d'entrée serveur
└── drizzle/        # Migrations base de données
```

### Types Partagés (`shared-types/`)
```
├── schema.ts       # Schémas Drizzle + Zod
├── config.ts       # Configuration partagée
└── permissions.ts  # Système de permissions
```

## 📦 Scripts Disponibles

### Backend
```bash
npm run dev          # Développement avec hot reload
npm run build        # Build production
npm run start        # Démarrer en production
npm run db:push      # Synchroniser schéma DB
npm run db:seed      # Données initiales
```

### Frontend
```bash
npm run dev          # Serveur de développement
npm run build        # Build production
npm run preview      # Preview du build
npm run type-check   # Vérification TypeScript
```

## 🗄️ Base de Données

Le système utilise **PostgreSQL** avec **Drizzle ORM** :

- **Développement**: Base locale ou Neon
- **Production**: PostgreSQL hébergé (Railway, Supabase, etc.)
- **Migrations**: Automatiques avec `drizzle-kit`

### Tables Principales
- `users` - Authentification et permissions
- `products` - Menu et produits
- `categories` - Catégories de produits
- `tables` - Tables restaurant avec QR codes
- `orders` - Commandes clients
- `sales` - Transactions de vente
- `expenses` - Dépenses business

## 🌐 Déploiement

### Railway (Recommandé)
1. **Frontend**: Déploiement statique ou Vercel
2. **Backend**: Railway avec PostgreSQL intégré
3. **Variables**: Voir `RAILWAY_ENV_TEMPLATE.txt`

### Autres Plateformes
- **Vercel**: Frontend uniquement
- **Heroku**: Backend + DB
- **DigitalOcean**: VPS complet
- **AWS**: ECS + RDS

Voir `/docs/` pour guides détaillés.

## 🔧 Configuration

### Variables d'Environnement Backend
```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
SESSION_SECRET=your-session-key
RESTAURANT_NAME=Mon Restaurant
```

### Proxy Frontend → Backend
Le frontend utilise Vite proxy pour `/api/*` → `http://localhost:5000`

## 🎯 Fonctionnalités

### ✅ Gestion Complète
- 👥 **Multi-utilisateurs** avec rôles et permissions
- 🍽️ **Menu** avec catégories et images
- 📱 **QR Codes** pour commandes clients
- 📊 **Analytics** temps réel
- 💰 **Paiements mobiles** (Orange Money, MTN, Wave)
- 🧾 **Facturation PDF** automatique

### ✅ Interface Moderne
- 📱 **Responsive** mobile/tablet/desktop
- 🌙 **Dark mode** support
- ⚡ **Performance** optimisée
- 🔄 **Temps réel** WebSocket notifications

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 License

Distribué sous licence MIT. Voir `LICENSE` pour plus d'informations.

## 🆘 Support

- 📧 **Email**: support@restaurant-management.com
- 📖 **Docs**: Voir dossier `/docs/`
- 🐛 **Issues**: GitHub Issues
- 💬 **Discord**: [Lien communauté]

---

**Développé avec ❤️ pour simplifier la gestion des restaurants**