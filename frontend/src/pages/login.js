var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import authService from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UtensilsCrossed } from "lucide-react";
import { useLocation } from "wouter";
const loginSchema = z.object({
    username: z.string().min(1, "Le nom d'utilisateur est requis"),
    password: z.string().min(1, "Le mot de passe est requis"),
});
export default function Login() {
    const [, setLocation] = useLocation();
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const form = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            username: "",
            password: "",
        },
    });
    const onSubmit = (data) => __awaiter(this, void 0, void 0, function* () {
        setIsLoading(true);
        try {
            yield authService.login(data.username, data.password);
            toast({
                title: "Connexion réussie",
                description: "Bienvenue dans RestoManager",
            });
            setLocation("/dashboard");
        }
        catch (error) {
            toast({
                title: "Erreur de connexion",
                description: error.message || "Identifiants incorrects",
                variant: "destructive",
            });
        }
        finally {
            setIsLoading(false);
        }
    });
    return (<div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary rounded-lg flex items-center justify-center">
            <UtensilsCrossed className="h-8 w-8 text-white"/>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">RestoManager</h2>
          <p className="mt-2 text-sm text-gray-600">
            Connectez-vous à votre compte
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Connexion</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Nom d'utilisateur</Label>
                <Input id="username" type="text" {...form.register("username")} placeholder="Votre nom d'utilisateur"/>
                {form.formState.errors.username && (<p className="text-sm text-destructive">
                    {form.formState.errors.username.message}
                  </p>)}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input id="password" type="password" {...form.register("password")} placeholder="Votre mot de passe"/>
                {form.formState.errors.password && (<p className="text-sm text-destructive">
                    {form.formState.errors.password.message}
                  </p>)}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Connexion..." : "Se connecter"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>);
}
