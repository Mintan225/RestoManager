import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insertProductSchema } from "@shared/schema";
import authService from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// COMMENTEZ CES IMPORTS DE DIALOG
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";

interface Category {
  id: number;
  name: string;
}

const productFormSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
  price: z.string().min(1, "Le prix est requis"),
  categoryId: z.string().min(1, "La catégorie est requise"),
  imageUrl: z.string().optional(),
  available: z.boolean().default(true),
});

type ProductFormData = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  product?: any;
  onSuccess?: () => void;
}

export function ProductForm({ product, onSuccess }: ProductFormProps) {
  const [open, setOpen] = useState(false); // Gardez l'état 'open' pour la logique interne
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      // Simulation temporaire pour le développement
      await new Promise(resolve => setTimeout(resolve, 500)); 
      return [
        { id: 1, name: "Boissons" },
        { id: 2, name: "Plat principal" },
        { id: 3, name: "Desserts" },
        { id: 4, name: "Entrées" },
      ] as Category[];
    },
    staleTime: Infinity,
    cacheTime: Infinity,
  });

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: product?.name || "",
      description: product?.description || "",
      price: product?.price ? product.price.toString() : "",
      categoryId: product?.categoryId?.toString() || "",
      imageUrl: product?.imageUrl || "",
      available: product?.available ?? true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Creating product with data:", data);
      try {
        const response = await fetch("/api/products", {
          method: "POST",
          headers: authService.getAuthHeaders(),
          body: JSON.stringify({
            ...data,
            price: parseFloat(data.price),
            categoryId: parseInt(data.categoryId),
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error("API error:", error);
          throw new Error(error.message || "Failed to create product");
        }

        const result = await response.json();
        console.log("Product created successfully:", result);
        return result;
      } catch (error) {
        console.error("Network error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Produit créé avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setOpen(false);
      form.reset();
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: authService.getAuthHeaders(),
        body: JSON.stringify({
          ...data,
          price: parseFloat(data.price),
          categoryId: parseInt(data.categoryId),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update product");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Produit modifié avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setOpen(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProductFormData) => {
    try {
      console.log("Form submission data:", data);
      if (product) {
        updateMutation.mutate(data);
      } else {
        createMutation.mutate(data);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la soumission du formulaire",
        variant: "destructive",
      });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Fonction utilitaire pour obtenir le nom de la catégorie
  const getCategoryNameById = (id: string) => {
    const foundCategory = categories.find(c => c.id.toString() === id);
    return foundCategory ? foundCategory.name : "Sélectionner une catégorie";
  };

  return (
    // DÉBUT DE LA CORRECTION : ENVELOPPEZ LE TOUT DANS UN FRAGMENT
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        {product ? "Modifier" : "Ajouter un produit"}
      </Button>
      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4">{product ? "Modifier le produit" : "Ajouter un produit"}</h2>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du produit</Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  placeholder="Nom du produit"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...form.register("description")}
                  placeholder="Description du produit"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Prix (FCFA)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  {...form.register("price")}
                  placeholder="0.00"
                />
                {form.formState.errors.price && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.price.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoryId">Catégorie</Label>
                <Select
                  value={form.watch("categoryId")}
                  onValueChange={(value) => form.setValue("categoryId", value)}
                >
                  <SelectTrigger>
                    <SelectValue>
                      {getCategoryNameById(form.watch("categoryId"))}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingCategories ? (
                      <SelectItem value="loading" disabled>Chargement des catégories...</SelectItem>
                    ) : categories.length === 0 ? (
                      <SelectItem value="no-categories" disabled>Aucune catégorie disponible.</SelectItem>
                    ) : (
                      categories.map((category: any) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {form.formState.errors.categoryId && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.categoryId.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">URL de l'image</Label>
                <Input
                  id="imageUrl"
                  {...form.register("imageUrl")}
                  placeholder="https://exemple.com/image.jpg"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="available"
                  checked={form.watch("available")}
                  onCheckedChange={(checked) => form.setValue("available", checked)}
                />
                <Label htmlFor="available">Disponible</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Enregistrement..." : product ? "Modifier" : "Ajouter"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </> // FIN DE LA CORRECTION : FERMETURE DU FRAGMENT
  );
}
