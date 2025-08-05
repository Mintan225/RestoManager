# Guide de Déploiement - Restaurant Management System

## 🚀 Liens d'Accès Post-Déploiement

### 1. **Interface Admin** (Personnel du restaurant)
```
https://[VOTRE-DOMAINE-REPLIT].replit.app/
```

**Comptes disponibles :**
- **Admin Principal** : `admin` / `admin123`
- **Manager** : `newmanager` / `manager123` 
- **Employé** : `newemployee` / `employee123`
- **Caissier** : `cashier1` / `cashier123`

### 2. **Super Admin** (Gestion système)
```
https://[VOTRE-DOMAINE-REPLIT].replit.app/super-admin
```

**Compte Super Admin :**
- **Username** : `superadmin`
- **Password** : `superadmin123`

### 3. **Menu Client** (QR Codes)
```
https://[VOTRE-DOMAINE-REPLIT].replit.app/menu/[NUMERO_TABLE]
```

**Tables disponibles :**
- Table 1: `https://[VOTRE-DOMAINE-REPLIT].replit.app/menu/1`
- Table 2: `https://[VOTRE-DOMAINE-REPLIT].replit.app/menu/2`
- Table 3: `https://[VOTRE-DOMAINE-REPLIT].replit.app/menu/3`
- Table 4: `https://[VOTRE-DOMAINE-REPLIT].replit.app/menu/4`
- Table 5: `https://[VOTRE-DOMAINE-REPLIT].replit.app/menu/5`
- Table 6: `https://[VOTRE-DOMAINE-REPLIT].replit.app/menu/6`
- Table 7: `https://[VOTRE-DOMAINE-REPLIT].replit.app/menu/7`
- Table 8: `https://[VOTRE-DOMAINE-REPLIT].replit.app/menu/8`

## 🔧 Fonctionnalités Vérifiées

### ✅ Système d'Authentification
- JWT tokens fonctionnels
- Permissions par rôle automatiques
- Sessions sécurisées

### ✅ Gestion des Commandes
- Création de commandes via QR codes
- Mise à jour de statuts en temps réel
- Génération automatique de ventes
- Notifications client automatiques

### ✅ Analytics et Rapports
- Métriques en temps réel
- Calculs automatiques profit/pertes
- Exports PDF disponibles

### ✅ Mobile Money Integration
- Orange Money, MTN MoMo, Moov, Wave
- Configuration via super admin

### ✅ Archives et Sauvegardes
- Système de suppression douce
- Récupération des éléments supprimés
- Reset complet via super admin

## 🔐 Sécurité

### Variables d'Environnement Requises
```
DATABASE_URL=[Fourni automatiquement par Replit]
JWT_SECRET=[Généré automatiquement]
SESSION_SECRET=[Généré automatiquement]
```

### Variables Optionnelles (Mobile Money)
```
ORANGE_MONEY_API_KEY=[À configurer si nécessaire]
ORANGE_MONEY_API_SECRET=[À configurer si nécessaire]
MTN_MOMO_API_KEY=[À configurer si nécessaire]
MTN_MOMO_SUBSCRIPTION_KEY=[À configurer si nécessaire]
MOOV_MONEY_API_KEY=[À configurer si nécessaire]
WAVE_API_KEY=[À configurer si nécessaire]
```

## 📱 Utilisation Post-Déploiement

### Pour les Clients
1. Scanner le QR code de leur table
2. Naviguer dans le menu par catégories
3. Ajouter des produits au panier
4. Passer commande avec nom et téléphone
5. Suivre l'état de leur commande en temps réel

### Pour le Personnel
1. Se connecter avec leurs identifiants
2. Gérer les commandes selon leur rôle
3. Mettre à jour les statuts de commandes
4. Consulter les analytics et rapports

### Pour le Super Admin
1. Accéder au portail super admin
2. Gérer les paramètres système
3. Configurer les méthodes de paiement
4. Effectuer un reset complet si nécessaire

## 🔄 Maintenance

- **Sauvegardes** : Automatiques via PostgreSQL
- **Logs** : Accessibles via console Replit
- **Monitoring** : Analytics intégrés au dashboard
- **Updates** : Via git push sur la branche principale

## 📞 Support

En cas de problème :
1. Vérifier les logs dans la console Replit
2. Tester les endpoints API via le dashboard
3. Utiliser le reset system si nécessaire (Super Admin)
4. Contacter le support technique

---

**Système testé et validé** ✅
**Prêt pour le déploiement en production** 🚀