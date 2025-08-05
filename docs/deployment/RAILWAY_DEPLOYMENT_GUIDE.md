# 🚀 Guide de Déploiement Railway - Restaurant Management System

## 📋 Prérequis

1. **Compte GitHub** avec votre code source
2. **Compte Railway** (railway.app)
3. **Variables d'environnement** prêtes

## 🔧 Étape 1: Préparation du Code

### Modifications du package.json (à faire manuellement)
```json
{
  "scripts": {
    "build": "npm run build:client && npm run build:server",
    "build:client": "vite build",
    "build:server": "esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --minify",
    "start": "cross-env NODE_ENV=production node dist/index.js",
    "postinstall": "npm run db:push"
  }
}
```

### Fichiers de configuration créés
- ✅ `railway.json` - Configuration Railway
- ✅ `Procfile` - Commandes de démarrage

## 🚀 Étape 2: Déploiement sur Railway

### 2.1 Créer un nouveau projet
1. Allez sur **railway.app**
2. Cliquez sur **"New Project"**
3. Sélectionnez **"Deploy from GitHub repo"**
4. Choisissez votre repository

### 2.2 Ajouter PostgreSQL
1. Dans votre projet Railway, cliquez **"+ New"**
2. Sélectionnez **"Database"** → **"PostgreSQL"**
3. Railway créera automatiquement la variable `DATABASE_URL`

### 2.3 Variables d'environnement à configurer

#### Variables obligatoires:
```env
NODE_ENV=production
JWT_SECRET=votre-clé-sécurisée-256-bits
SESSION_SECRET=votre-session-sécurisée-256-bits
RESTAURANT_NAME=Mon Restaurant
RESTAURANT_ADDRESS=Votre adresse
RESTAURANT_PHONE=+225 XX XX XX XX XX
RESTAURANT_EMAIL=contact@restaurant.com
```

#### Variables optionnelles (paiements mobiles):
```env
ORANGE_MONEY_ENABLED=false
MTN_MOMO_ENABLED=false
MOOV_MONEY_ENABLED=false
WAVE_ENABLED=false
```

### 2.4 Configuration des variables
1. Allez dans **"Variables"** de votre projet
2. Ajoutez chaque variable une par une
3. Railway configurera automatiquement:
   - `PORT` (port d'écoute)
   - `DATABASE_URL` (connexion PostgreSQL)
   - `RAILWAY_PUBLIC_DOMAIN` (domaine public)

## 🗄️ Étape 3: Base de Données

### 3.1 Migration automatique
- Railway exécutera `npm run postinstall` après le build
- Cela lancera `npm run db:push` pour synchroniser le schéma

### 3.2 Données initiales
Après le premier déploiement, votre app créera automatiquement:
- ✅ Utilisateur admin par défaut (admin/admin123)
- ✅ Catégories de base
- ✅ Produits d'exemple
- ✅ Configuration système

## 🌐 Étape 4: Vérification

### 4.1 Santé de l'application
- Railway vérifiera automatiquement `/api/health`
- Consultez les logs pour vérifier le démarrage

### 4.2 Tests post-déploiement
1. **Connexion admin**: `https://votre-app.railway.app`
2. **Identifiants**: admin / admin123
3. **QR Codes**: Créez une table et testez le QR code
4. **Upload d'images**: Testez l'ajout de produits avec images

## 🔧 Étape 5: Configuration Post-Déploiement

### 5.1 Mise à jour des QR Codes
```bash
# Via l'interface admin ou API
curl -X POST https://votre-app.railway.app/api/admin/regenerate-qr-codes \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5.2 Super Admin (optionnel)
Si vous voulez accéder au portail super admin:
- URL: `https://votre-app.railway.app/super-admin`
- Utilisez les identifiants admin pour la première connexion

## 🚨 Dépannage

### Problèmes courants:

**Build échoue:**
- Vérifiez que toutes les dépendances sont dans `package.json`
- Consultez les logs de build dans Railway

**Base de données inaccessible:**
- Vérifiez que PostgreSQL est bien connecté
- Variable `DATABASE_URL` doit être automatiquement définie

**Variables d'environnement manquantes:**
- Ajoutez `JWT_SECRET` et `SESSION_SECRET`
- Vérifiez que `NODE_ENV=production`

**Images ne s'affichent pas:**
- Les images uploadées sont stockées localement
- Pour la production, considérez Cloudinary ou AWS S3

## 📊 Monitoring

### Logs disponibles:
- **Build logs**: Processus de compilation
- **Deploy logs**: Démarrage de l'application
- **Application logs**: Erreurs runtime

### Métriques:
- CPU et RAM usage
- Temps de réponse
- Erreurs 500

## 🔄 Mises à jour

Pour déployer des mises à jour:
1. **Push sur GitHub** → Déploiement automatique
2. **Variables modifiées** → Redémarrage automatique
3. **Schéma DB modifié** → `npm run db:push` manuel si nécessaire

## 💰 Coûts Estimés

- **Starter Plan**: Gratuit (500h/mois)
- **Developer Plan**: $5/mois (illimité)
- **PostgreSQL**: Inclus dans les plans

---

## 🎯 Résumé des Actions

✅ Fichiers de configuration Railway créés
✅ Guide complet fourni
✅ Variables d'environnement listées
✅ Processus de déploiement détaillé

**Prochaines étapes:**
1. Poussez le code vers GitHub
2. Créez le projet Railway
3. Ajoutez PostgreSQL
4. Configurez les variables d'environnement
5. Déployez !

Votre restaurant management system sera disponible sous un domaine comme:
`https://votre-projet.railway.app`