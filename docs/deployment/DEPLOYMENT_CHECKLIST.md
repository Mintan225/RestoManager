# ✅ Checklist de Déploiement Railway

## 📋 Préparation Terminée

### Fichiers de Configuration
- ✅ `railway.json` - Configuration Railway avec healthcheck
- ✅ `Procfile` - Commande de démarrage  
- ✅ `nixpacks.toml` - Build configuration
- ✅ `.gitignore` - Fichiers à ignorer
- ✅ `public/uploads/.gitkeep` - Dossier uploads préservé

### Code Modifié
- ✅ Endpoint santé ajouté: `/api/health`
- ✅ Scripts de build prêts (à modifier manuellement dans package.json)

## 🚀 Actions à Effectuer

### 1. Modification Manuelle du package.json
Remplacez les scripts existants par:
```json
{
  "scripts": {
    "dev": "cross-env NODE_ENV=development tsx server/index.ts",
    "db:push": "drizzle-kit push",
    "build": "npm run build:client && npm run build:server",
    "build:client": "vite build", 
    "build:server": "esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --minify",
    "start": "cross-env NODE_ENV=production node dist/index.js",
    "postinstall": "npm run db:push",
    "check": "tsc",
    "db:migrate": "ts-node drizzle.config.ts drizzle-kit migrate",
    "db:seed": "ts-node --esm --project tsconfig.json server/seed.mts"
  }
}
```

### 2. Déploiement Railway
1. **Créer compte Railway**: https://railway.app
2. **Nouveau projet**: "Deploy from GitHub repo"
3. **Ajouter PostgreSQL**: + New → Database → PostgreSQL
4. **Variables d'environnement**: Voir `RAILWAY_ENV_TEMPLATE.txt`

### Variables Obligatoires à Ajouter
```env
NODE_ENV=production
JWT_SECRET=[Générer clé sécurisée 32+ caractères]
SESSION_SECRET=[Générer clé sécurisée 32+ caractères]
RESTAURANT_NAME=Votre Restaurant
RESTAURANT_ADDRESS=Votre adresse
RESTAURANT_PHONE=+225 XX XX XX XX XX
RESTAURANT_EMAIL=contact@restaurant.com
```

### 3. Post-Déploiement
- ✅ Vérifier `/api/health` retourne 200
- ✅ Connexion admin (admin/admin123)
- ✅ Créer première table et tester QR code
- ✅ Upload image produit
- ✅ Passer commande test

## 📊 Monitoring
- **Logs**: Interface Railway
- **Métriques**: CPU/RAM usage 
- **Erreurs**: Application logs
- **Uptime**: Healthcheck automatique

## 💡 Points Importants

### Coûts
- **Gratuit**: 500h/mois (Hobby plan)
- **Payant**: $5/mois (Developer plan illimité)

### Domaine
- **Automatique**: `https://votre-projet.railway.app`
- **Personnalisé**: Configuration dans Railway

### Base de Données
- **Migration**: Automatique via `postinstall`
- **Backup**: Géré par Railway
- **Accès**: Via interface Railway

### Stockage Fichiers
- **Images**: Stockage local temporaire
- **Production**: Considérer Cloudinary/AWS S3

## 🔧 Dépannage

### Build échoue
- Vérifier `package.json` scripts modifiés
- Consulter build logs Railway

### App crash au démarrage  
- Vérifier variables `JWT_SECRET` et `SESSION_SECRET`
- Contrôler `DATABASE_URL` auto-configurée

### Images ne s'affichent pas
- Stockage local - normal en production
- Migrer vers service cloud si nécessaire

---

## ✨ Statut Final
🎯 **PRÊT POUR DÉPLOIEMENT**

Votre restaurant management system est maintenant configuré pour Railway avec:
- Configuration complète
- Endpoint de santé
- Migration automatique 
- Guide détaillé

**Prochaine étape**: Modifier package.json et déployer sur Railway!