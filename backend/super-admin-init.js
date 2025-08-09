var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { storage } from "./storage";
import bcrypt from "bcrypt";
export function createDefaultSuperAdmin() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Vérifier si un super admin existe déjà
            const existingSuperAdmin = yield storage.getSuperAdminByUsername("superadmin");
            if (!existingSuperAdmin) {
                const hashedPassword = yield bcrypt.hash("superadmin123", 10);
                yield storage.createSuperAdmin({
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
        }
        catch (error) {
            console.error("Erreur lors de la création du super admin:", error);
        }
    });
}
