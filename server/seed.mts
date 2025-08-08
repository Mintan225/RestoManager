// server/seed.mts

// Les chemins sont ajustés pour qu'ils correspondent à votre projet
import { db } from "./db.js"; 
// L'importation est corrigée pour trouver le bon module
import { categories, products, users, systemSettings } from '@shared-types/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt'; 

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
        .onConflictDoNothing({ target: categories.id }); 
    }
    console.log('Catégories amorcées avec succès.');

    // 2. Amorcer les Produits (DOIT VENIR APRÈS les catégories en raison de la clé étrangère)
    console.log('Vérification et amorçage des produits...');
    const defaultProducts = [
      { name: 'Salade César', price: 9.99, categoryId: 1, description: 'Salade fraîche et copieuse avec poulet grillé et sauce César.', imageUrl: 'https://example.com/images/salade-cesar.jpg' },
      { name: 'Burger Classique', price: 14.50, categoryId: 2, description: 'Burger de bœuf, cheddar, laitue, tomate, oignon et sauce secrète, servi avec frites.', imageUrl: 'https://example.com/images/burger-classique.jpg' },
      { name: 'Tarte au Citron Meringuée', price: 6.50, categoryId: 3, description: 'Classique tarte au citron avec une meringue légère.', imageUrl: 'https://example.com/images/tarte-citron.jpg' },
      { name: 'Café Expresso', price: 2.00, categoryId: 4, description: 'Un expresso fort et aromatique.', imageUrl: 'https://example.com/images/cafe-expresso.jpg' },
      { name: 'Coca-Cola', price: 3.00, categoryId: 4, description: 'Boisson rafraîchissante.', imageUrl: 'https://example.com/images/coca-cola.jpg' },
      { name: 'Pâtes Carbonara', price: 13.00, categoryId: 2, description: 'Pâtes crémeuses aux lardons et jaune d\'œuf.', imageUrl: 'https://example.com/images/carbonara.jpg' },
    ];

    for (const product of defaultProducts) {
      await db.insert(products)
        .values(product)
        .onConflictDoNothing({ target: products.name }); 
    }
    console.log('Produits amorcés avec succès.');


    // 3. Amorcer un Super Admin par défaut
    console.log('Vérification et amorçage du super admin par défaut...');
    const existingAdmin = await db.query.users.findFirst({
      where: eq(users.username, 'admin')
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('motdepasse_tres_secret', 10); 
      await db.insert(users).values({
        id: 'clv6b42b600003b6i4e1k8q9f', 
        username: 'admin',
        email: 'admin@example.com',
        passwordHash: hashedPassword, 
        role: 'super_admin',
      });
      console.log('Super admin par défaut amorcé.');
    } else {
      console.log('Super admin par défaut déjà existant.');
    }

    // 4. Amorcer les Paramètres Système par défaut
    console.log('Vérification et amorçage des paramètres système par défaut...');
    const existingSettings = await db.query.systemSettings.findFirst();

    if (!existingSettings) {
      await db.insert(systemSettings).values({
        id: 1, 
        setting_name: 'default_config',
        setting_value: '{"currency": "EUR", "tax_rate": 0.20}', 
      });
      console.log('Paramètres système par défaut amorcés.');
    } else {
      console.log('Paramètres système par défaut déjà existants.');
    }

    console.log('--- Amorçage de la base de données terminé avec succès ---');

  } catch (error) {
    console.error('--- ERREUR LORS DE L\'AMORÇAGE DE LA BASE DE DONNÉES : ---', error);
    process.exit(1);
  }
}

seed(); 
