// server/seed.ts (ou src/db/seed.ts)

// Ajustez ces chemins pour qu'ils correspondent à votre projet
import { db } from './index'; // Exemple: si votre instance 'db' est dans server/index.ts ou src/db/index.ts
import { categories, users, systemSettings } from '../shared/schema'; // Exemple: si votre schéma est dans src/shared/schema.ts
import { eq } from 'drizzle-orm'; // Nécessaire pour les requêtes de recherche (findFirst)
// Si vous utilisez bcrypt pour le hachage des mots de passe
// import bcrypt from 'bcrypt';

async function seed() {
  console.log('--- Démarrage de l\'amorçage de la base de données ---');

  try {
    // 1. Amorcer les Catégories
    console.log('Vérification et amorçage des catégories...');
    const defaultCategories = [
      { id: 1, name: 'Entrées' },
      { id: 2, name: 'Plats Principaux' },
      { id: 3, name: 'Desserts' },
      { id: 4, name: 'Boissons' },
    ];

    for (const category of defaultCategories) {
      await db.insert(categories)
        .values(category)
        .onConflictDoNothing({ target: categories.id }); // Empêche l'insertion si l'ID existe déjà
    }
    console.log('Catégories amorcées avec succès.');

    // 2. Amorcer un Super Admin par défaut
    console.log('Vérification et amorçage du super admin par défaut...');
    // Remplacez 'users' par 'super_admins' si vous avez une table séparée
    const existingAdmin = await db.query.users.findFirst({
      where: eq(users.username, 'admin')
    });

    if (!existingAdmin) {
      // *** TRÈS IMPORTANT : HACHEZ LE MOT DE PASSE EN PRODUCTION ***
      // const hashedPassword = await bcrypt.hash('votre_mot_de_passe_secure', 10);
      await db.insert(users).values({
        id: 'un-uuid-pour-admin', // Utilisez un UUID réel ou un ID généré par la base si besoin
        username: 'admin',
        email: 'admin@example.com',
        passwordHash: 'votre_mot_de_passe_temporaire', // À REMPLACER PAR UN HASH !
        role: 'super_admin',
        // Ajoutez d'autres champs requis par votre table 'users'
      });
      console.log('Super admin par défaut amorcé.');
    } else {
      console.log('Super admin par défaut déjà existant.');
    }

    // 3. Amorcer les Paramètres Système par défaut
    console.log('Vérification et amorçage des paramètres système par défaut...');
    const existingSettings = await db.query.systemSettings.findFirst();

    if (!existingSettings) {
      await db.insert(systemSettings).values({
        id: 1, // Ou un UUID
        setting_name: 'default_config',
        setting_value: '{"currency": "EUR", "tax_rate": 0.20}', // Exemple de données JSON
        // Ajoutez d'autres champs requis par votre table 'systemSettings'
      });
      console.log('Paramètres système par défaut amorcés.');
    } else {
      console.log('Paramètres système par défaut déjà existants.');
    }

    console.log('--- Amorçage de la base de données terminé avec succès ---');

  } catch (error) {
    console.error('--- ERREUR LORS DE L\'AMORÇAGE DE LA BASE DE DONNÉES : ---', error);
    // Quitte le processus avec une erreur pour indiquer un échec de déploiement
    process.exit(1);
  }
}

seed(); // Exécute la fonction d'amorçage