// client/components/ProductForm.tsx

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insertProductSchema } from "@shared/schema"; // Gardez cette ligne si vous l'utilisez ailleurs, sinon elle peut être non utilisée ici.
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
import { Switch } from "@/components/ui/switch";
import { Plus, Upload, X, Image } from "lucide-react";

interface Category {
  id: number;
  name: string;
}

// --- DÉBUT DES CORRECTIONS ZOD ---
const productFormSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
  // Utilise z.coerce.number() pour convertir la chaîne en nombre et valider
  price: z.coerce.number().min(0.01, "Le prix est requis et doit être positif"),
  // Utilise z.coerce.number() pour convertir la chaîne en nombre et valider
  categoryId: z.coerce.number().min(1, "La catégorie est requise"),
  imageUrl: z.string().url("URL d'image invalide").optional().or(z.literal('')), // Permet une chaîne vide pour optional
  available: z.boolean().default(true),
});
// --- FIN DES CORRECTIONS ZOD ---

type ProductFormData = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  product?: any;
  onSuccess?: () => void;
}

export function ProductForm({ product, onSuccess }: ProductFormProps) {
  const [open, setOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>(product?.imageUrl || "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // --- DÉBUT DE LA CORRECTION POUR LA RÉCUPÉRATION DES CATÉGORIES ---
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/categories", {
          headers: authService.getAuthHeaders(), // Assurez-vous que l'authentification est gérée si votre API la requiert
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Échec de la récupération des catégories");
        }
        return response.json();
      } catch (error) {
        console.error("Erreur lors de la récupération des catégories:", error);
        throw error; // Propagez l'erreur pour que TanStack Query puisse la gérer
      }
    },
    staleTime: 5 * 60 * 1000, // Les catégories ne changent pas souvent, 5 minutes de "stale"
    cacheTime: 10 * 60 * 1000, // Gardez en cache pendant 10 minutes
  });
  // --- FIN DE LA CORRECTION POUR LA RÉCUPÉRATION DES CATÉGORIES ---

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: product?.name || "",
      description: product?.description || "",
      // S'assure que le prix est une chaîne si initialement un nombre
      price: product?.price ? product.price.toString() : "0.00", // Définit une valeur par défaut cohérente
      categoryId: product?.categoryId?.toString() || "", // Garde en string pour la sélection initial
      imageUrl: product?.imageUrl || "",
      available: product?.available ?? true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ProductFormData) => { // Type data correctement
      console.log("Creating product with data:", data);
      try {
        const response = await fetch("/api/products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json", // Ajouté explicitement
            ...authService.getAuthHeaders(),
          },
          body: JSON.stringify(data), // Zod a déjà converti price et categoryId en nombres
        });

        if (!response.ok) {
          const error = await response.json();
          console.error("API error:", error);
          throw new Error(error.message || "Échec de la création du produit");
        }

        const result = await response.json();
        console.log("Product created successfully:", result);
        return result;
      } catch (error) {
        console.error("Erreur réseau ou API:", error);
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
    mutationFn: async (data: ProductFormData) => { // Type data correctement
      const response = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json", // Ajouté explicitement
          ...authService.getAuthHeaders(),
        },
        body: JSON.stringify(data), // Zod a déjà converti price et categoryId en nombres
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Échec de la mise à jour du produit");
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

  // Image upload handler
  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/products/upload-image', {
        method: 'POST',
        headers: {
          ...authService.getAuthHeaders(),
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Échec du téléchargement');
      }

      const result = await response.json();
      const imageUrl = result.imageUrl;
      
      form.setValue('imageUrl', imageUrl);
      setImagePreview(imageUrl);
      
      toast({
        title: "Succès",
        description: "Image téléchargée avec succès",
      });
      
      return imageUrl;
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Échec du téléchargement de l'image",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file input change
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Erreur",
          description: "Veuillez sélectionner un fichier image valide",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Erreur",
          description: "L'image ne doit pas dépasser 5MB",
          variant: "destructive",
        });
        return;
      }
      
      handleImageUpload(file);
    }
  };

  // Handle URL input
  const handleUrlChange = (url: string) => {
    form.setValue('imageUrl', url);
    setImagePreview(url);
  };

  // Remove image
  const removeImage = () => {
    form.setValue('imageUrl', '');
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = (data: ProductFormData) => {
    try {
      console.log("Données de soumission du formulaire (après Zod):", data); // Vérifiez les types ici
      if (product) {
        updateMutation.mutate(data);
      } else {
        createMutation.mutate(data);
      }
    } catch (error) {
      console.error("Erreur lors de la soumission du formulaire:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la soumission du formulaire",
        variant: "destructive",
      });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Fonction utilitaire pour obtenir le nom de la catégorie
  const getCategoryNameById = (id: string | number) => { // Accepte string ou number
    const foundCategory = categories.find(c => c.id.toString() === id.toString());
    return foundCategory ? foundCategory.name : "Sélectionner une catégorie";
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        {product ? "Modifier" : "Ajouter un produit"}
      </Button>
      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
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
                  value={form.watch("categoryId")?.toString() || ""} // S'assure que la valeur est toujours une string pour Select
                  onValueChange={(value) => form.setValue("categoryId", z.coerce.number().parse(value))} // Convertit en nombre pour le formulaire
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

              {/* Image Upload Section */}
              <div className="space-y-3">
                <Label>Image du produit</Label>
                
                {/* Image Preview */}
                {imagePreview && (
                  <div className="relative w-full h-32 border border-gray-200 rounded-lg overflow-hidden">
                    <img 
                      src={imagePreview} 
                      alt="Aperçu" 
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={removeImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                
                {/* Upload Options */}
                <div className="flex flex-col space-y-2">
                  {/* File Upload */}
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="flex items-center space-x-2"
                    >
                      {isUploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span>Téléchargement...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          <span>Télécharger</span>
                        </>
                      )}
                    </Button>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                  
                  {/* URL Input */}
                  <div className="space-y-1">
                    <Label htmlFor="imageUrl" className="text-sm text-gray-600">Ou URL d'image</Label>
                    <Input
                      id="imageUrl"
                      value={form.watch("imageUrl") || ""}
                      onChange={(e) => handleUrlChange(e.target.value)}
                      placeholder="https://exemple.com/image.jpg"
                      className="text-sm"
                    />
                  </div>
                </div>
                
                {form.formState.errors.imageUrl && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.imageUrl.message}
                  </p>
                )}
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
    </>
  );
}