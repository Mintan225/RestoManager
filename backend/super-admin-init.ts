import { storage } from "./storage";
import bcrypt from "bcrypt";

export async function createDefaultSuperAdmin() {
  try {
    // Vérifier si un super admin existe déjà
    const existingSuperAdmin = await storage.getSuperAdminByUsername("superadmin");
    
    if (!existingSuperAdmin) {
      const hashedPassword = await bcrypt.hash("superadmin123", 10);
      
      await storage.createSuperAdmin({
        username: "superadmin",
        password: hashedPassword,
        fullName: "Super Administrateur",
        email: "superadmin@restaurant.com",
        phone: "",
      });
      
      console.log("✅ Super administrateur par défaut créé:");
      console.log("   Nom d'utilisateur: superadmin");
      console.log("   Mot de passe: superadmin123");
      console.log("   Accès: /super-admin/login");
    }
  } catch (error) {
    console.error("Erreur lors de la création du super admin:", error);
  }
}