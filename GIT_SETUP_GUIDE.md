# 🗂️ Guide de Configuration Git

## 📁 Structure Réorganisée

Votre projet a été **complètement réorganisé** avec une architecture frontend/backend séparée :

```
restaurant-management/
├── frontend/              # 🎨 Application React
│   ├── src/              # Code source frontend
│   ├── public/           # Assets statiques
│   ├── package.json      # Dépendances frontend
│   ├── vite.config.ts    # Configuration Vite
│   ├── tailwind.config.ts
│   └── .env.example
├── backend/               # ⚙️ API Express
│   ├── routes.ts         # Routes API
│   ├── storage.ts        # Accès base de données
│   ├── package.json      # Dépendances backend
│   ├── drizzle.config.ts # Configuration DB
│   ├── tsconfig.json
│   └── .env.example
├── shared-types/          # 🔗 Types partagés
│   ├── schema.ts         # Schémas Drizzle + Zod
│   ├── config.ts         # Configuration commune
│   └── permissions.ts    # Système permissions
├── docs/                  # 📚 Documentation
│   └── deployment/       # Guides de déploiement
├── README.md             # Documentation principale
├── .gitignore            # Fichiers ignorés par Git
└── package.json          # Configuration racine (optionnelle)
```

## 🚀 Initialisation Git

### 1. Préparer le Repository

```bash
# Supprimer l'ancien .git si existant
rm -rf .git

# Initialiser nouveau repository
git init

# Ajouter tous les fichiers
git add .

# Premier commit
git commit -m "🎉 Initial commit: Frontend/Backend separation

✨ Features:
- Separated frontend (React + Vite) and backend (Express + Node.js)
- Shared types system with TypeScript
- Complete Railway deployment configuration
- Modern development workflow

🏗️ Architecture:
- Frontend: React + TailwindCSS + shadcn/ui
- Backend: Express + PostgreSQL + Drizzle ORM
- Shared: TypeScript types and validation schemas

🚀 Ready for production deployment on Railway or similar platforms"
```

### 2. Configuration Remote Repository

```bash
# Ajouter votre repository GitHub/GitLab
git remote add origin https://github.com/votre-username/restaurant-management.git

# Push initial
git branch -M main
git push -u origin main
```

## 📦 Développement Local

### Installation Complète

```bash
# 1. Backend
cd backend
npm install
cp .env.example .env
# Configurer DATABASE_URL et autres variables
npm run dev

# 2. Frontend (nouveau terminal)
cd ../frontend
npm install
npm run dev

# 3. Accès
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
```

### Workflow Git Recommandé

```bash
# Créer une branche feature
git checkout -b feature/nouvelle-fonctionnalite

# Développer et tester
# Modifier les fichiers...

# Commit fréquents
git add .
git commit -m "✨ Add: Nouvelle fonctionnalité XYZ"

# Push et Pull Request
git push origin feature/nouvelle-fonctionnalite
```

## 🌐 Déploiement

### Option 1: Déploiement Séparé (Recommandé)

```bash
# Frontend → Vercel
cd frontend
vercel

# Backend → Railway
cd ../backend
# Connecter GitHub repo dans Railway Dashboard
# Railway déploiera automatiquement le backend
```

### Option 2: Monorepo Railway

```bash
# Root deployment avec railway.json
railway deploy
```

## 🔧 Scripts Utiles

### Backend
```bash
cd backend
npm run dev          # Développement
npm run build        # Build production
npm run start        # Production
npm run db:push      # Sync DB schema
npm run db:seed      # Données initiales
```

### Frontend
```bash
cd frontend
npm run dev          # Développement
npm run build        # Build production
npm run preview      # Preview build
npm run type-check   # Vérification TS
```

## 📝 Bonnes Pratiques Git

### Structure des Commits
```bash
# Format: <type>: <description>
git commit -m "✨ feat: Add user authentication"
git commit -m "🐛 fix: Resolve order status bug"
git commit -m "📚 docs: Update deployment guide"
git commit -m "♻️ refactor: Improve API error handling"
git commit -m "🎨 style: Update UI components"
```

### Branches
```bash
# Features
git checkout -b feature/user-management
git checkout -b feature/payment-integration

# Fixes  
git checkout -b fix/order-validation
git checkout -b hotfix/security-patch

# Documentation
git checkout -b docs/api-reference
```

### .gitignore Configuré
Le `.gitignore` est déjà configuré pour ignorer :
- `node_modules/` des deux projets
- Fichiers `.env` de sécurité
- Builds `dist/` et `build/`
- Uploads temporaires
- Fichiers IDE et OS

## 🎯 Prochaines Étapes

1. **Initialiser Git** avec les commandes ci-dessus
2. **Tester en local** les deux serveurs
3. **Configurer CI/CD** pour déploiements automatiques
4. **Documenter** votre workflow équipe

Votre projet est maintenant **prêt pour Git** avec une architecture professionnelle et scalable ! 🚀