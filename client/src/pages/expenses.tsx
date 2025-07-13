import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertExpenseSchema } from "@shared/schema";
import authService from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";
import { z } from "zod";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
// COMMENTEZ CES IMPORTS D'ALERTDIALOG
// import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Receipt, Calendar, Download, TrendingDown } from "lucide-react";

import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { fr } from "date-fns/locale";

const expenseFormSchema = z.object({
  description: z.string().min(1, "La description est requise"),
  amount: z.string().min(1, "Le montant est requis"),
  category: z.string().min(1, "La catégorie est requise"),
  receiptUrl: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseFormSchema>;

const expenseCategories = [
  "Ingrédients",
  "Personnel",
  "Loyer",
  "Électricité",
  "Eau",
  "Téléphone/Internet",
  "Marketing",
  "Transport",
  "Équipement",
  "Maintenance",
  "Assurance",
  "Impôts",
  "Autre",
];

interface ExpenseFormProps {
  expense?: any;
  onSuccess?: () => void;
}

function ExpenseForm({ expense, onSuccess }: ExpenseFormProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      description: expense?.description || "",
      amount: expense?.amount || "",
      category: expense?.category || "",
      receiptUrl: expense?.receiptUrl || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: authService.getAuthHeaders(),
        body: JSON.stringify({
          ...data,
          amount: parseFloat(data.amount),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create expense");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Dépense créée avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/daily"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/weekly"] });
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
      const response = await fetch(`/api/expenses/${expense.id}`, {
        method: "PUT",
        headers: authService.getAuthHeaders(),
        body: JSON.stringify({
          ...data,
          amount: parseFloat(data.amount),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update expense");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Dépense modifiée avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/daily"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/weekly"] });
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

  const onSubmit = (data: ExpenseFormData) => {
    if (expense) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    // DÉBUT DE LA CORRECTION : ENVELOPPEZ LE TOUT DANS UN FRAGMENT
    <>
        {expense ? (
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            <Edit className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une dépense
          </Button>
        )}
          {/* AFFICHEZ LE FORMULAIRE DIRECTEMENT SI 'open' EST VRAI */}
          {open && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
                <h2 className="text-xl font-bold mb-4">{expense ? "Modifier la dépense" : "Ajouter une dépense"}</h2>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      {...form.register("description")}
                      placeholder="Description de la dépense"
                    />
                    {form.formState.errors.description && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.description.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Montant (FCFA)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      {...form.register("amount")}
                      placeholder="0.00"
                    />
                    {form.formState.errors.amount && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.amount.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Catégorie</Label>
                    <Select
                      value={form.watch("category")}
                      onValueChange={(value) => form.setValue("category", value)}
                    >
                      <SelectTrigger>
                        {/* MODIFICATION ICI : Contenu explicite pour SelectValue */}
                        <SelectValue>
                          {form.watch("category") || "Sélectionner une catégorie"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {expenseCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.category && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.category.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="receiptUrl">URL du reçu (optionnel)</Label>
                    <Input
                      id="receiptUrl"
                      {...form.register("receiptUrl")}
                      placeholder="https://exemple.com/recu.jpg"
                    />
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
                      {isLoading ? "Enregistrement..." : expense ? "Modifier" : "Ajouter"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
    </> // FIN DE LA CORRECTION : FERMETURE DU FRAGMENT
  );
}

export default function Expenses() {
  const [dateRange, setDateRange] = useState("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case "today":
        return {
          start: startOfDay(now).toISOString(),
          end: endOfDay(now).toISOString(),
        };
      case "week":
        return {
          start: startOfWeek(now, { weekStartsOn: 1 }).toISOString(),
          end: endOfWeek(now, { weekStartsOn: 1 }).toISOString(),
        };
      case "month":
        return {
          start: startOfMonth(now).toISOString(),
          end: endOfMonth(now).toISOString(),
        };
      case "custom":
        return {
          start: startDate ? new Date(startDate).toISOString() : "",
          end: endDate ? new Date(endDate).toISOString() : "",
        };
      default:
        return { start: "", end: "" };
    }
  };

  const { start, end } = getDateRange();

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["/api/expenses", { startDate: start, endDate: end }],
    enabled: !!start && !!end,
  });

  const deleteMutation = useMutation({
    mutationFn: async (expenseId: number) => {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: "DELETE",
        headers: authService.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete expense");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Dépense supprimée avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/daily"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredExpenses = expenses.filter((expense: any) => 
    selectedCategory === "all" || expense.category === selectedCategory
  );

  const totalExpenses = filteredExpenses.reduce((sum: number, expense: any) => sum + parseFloat(expense.amount), 0);

  const expensesByCategory = filteredExpenses.reduce((acc: any, expense: any) => {
    if (!acc[expense.category]) {
      acc[expense.category] = 0;
    }
    acc[expense.category] += parseFloat(expense.amount);
    return acc;
  }, {});

  const exportToPDF = () => {
    if (filteredExpenses.length === 0) return;

    import('jspdf').then(({ default: jsPDF }) => {
      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.text('Rapport des Dépenses', 20, 20);
      
      doc.setFontSize(12);
      doc.text(`Période: ${dateRange}`, 20, 35);
      doc.text(`Généré le: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: fr })}`, 20, 45);
      
      const tableData = filteredExpenses.map((expense: any) => [
        format(new Date(expense.createdAt), "dd/MM/yyyy HH:mm", { locale: fr }),
        expense.description,
        `${parseFloat(expense.amount).toFixed(0)} FCFA`,
        expense.category,
        expense.receiptUrl ? "Oui" : "Non"
      ]);
      
      const headers = ["Date", "Description", "Montant", "Catégorie", "Reçu"];
      
      let yPos = 60;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      headers.forEach((header, i) => {
        doc.text(header, 20 + (i * 35), yPos);
      });
      
      doc.line(20, yPos + 2, 190, yPos + 2);
      yPos += 10;
      
      doc.setFont(undefined, 'normal');
      tableData.forEach((row, index) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        
        row.forEach((cell, i) => {
          const maxWidth = 30;
          const text = cell.length > 15 ? cell.substring(0, 15) + '...' : cell;
          doc.text(text, 20 + (i * 35), yPos);
        });
        yPos += 8;
      });
      
      const total = filteredExpenses.reduce((sum: number, expense: any) => sum + parseFloat(expense.amount), 0);
      yPos += 10;
      doc.setFont(undefined, 'bold');
      doc.text(`Total: ${total.toFixed(0)} FCFA`, 20, yPos);
      
      doc.save(`depenses-${dateRange}-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    });
  };

  const getCategoryColor = (category: string) => {
    const colors = [
      "bg-primary", "bg-success", "bg-warning", "bg-destructive",
      "bg-secondary", "bg-blue-500", "bg-green-500", "bg-yellow-500",
      "bg-red-500", "bg-purple-500", "bg-pink-500", "bg-indigo-500"
    ];
    const index = expenseCategories.indexOf(category) % colors.length;
    return colors[index];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Dépenses</h1>
        <div className="flex space-x-2">
          <Button onClick={exportToPDF} disabled={filteredExpenses.length === 0} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter PDF
          </Button>
          <ExpenseForm />
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label>Période</Label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="today">Aujourd'hui</option>
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
                <option value="custom">Période personnalisée</option>
              </select>
            </div>

            {dateRange === "custom" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="startDate">Date de début</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Date de fin</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Catégorie</Label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">Toutes les catégories</option>
                {expenseCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-destructive rounded-md flex items-center justify-center">
                  <Receipt className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total des dépenses</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(totalExpenses)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Nombre de dépenses</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredExpenses.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-warning rounded-md flex items-center justify-center">
                  <Receipt className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Moyenne par dépense</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(filteredExpenses.length > 0 ? (totalExpenses / filteredExpenses.length) : 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Summary */}
      {Object.keys(expensesByCategory).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Répartition par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(expensesByCategory).map(([category, amount]) => (
                <div key={category} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 ${getCategoryColor(category)} rounded-full`}></div>
                    <span className="text-sm font-medium">{category}</span>
                  </div>
                  <span className="font-semibold">{formatCurrency(amount as number)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expenses List */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des dépenses</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : filteredExpenses.length > 0 ? (
            <div className="space-y-4">
              {filteredExpenses.map((expense: any) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-medium text-gray-900">{expense.description}</h3>
                      <Badge className={`${getCategoryColor(expense.category)} text-white`}>
                        {expense.category}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{formatCurrency(parseFloat(expense.amount))}</span>
                      <span>
                        {format(new Date(expense.createdAt), "dd/MM/yyyy HH:mm", { locale: fr })}
                      </span>
                      {expense.receiptUrl && (
                        <a
                          href={expense.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Voir le reçu
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <ExpenseForm expense={expense} />
                    {/* COMMENTEZ AlertDialog */}
                    {/* <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer cette dépense</AlertDialogTitle>
                          <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer la dépense "{expense.description}" de {formatCurrency(parseFloat(expense.amount))} ? 
                            Cette action ne peut pas être annulée et la dépense sera archivée.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(expense.id)}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={deleteMutation.isPending}
                          >
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog> */}
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={deleteMutation.isPending}
                      onClick={() => { /* Logique de suppression temporaire si nécessaire */ console.log("Supprimer dépense", expense.id); deleteMutation.mutate(expense.id); }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune dépense trouvée
              </h3>
              <p className="text-gray-500 mb-4">
                Aucune dépense n'a été enregistrée pour cette période.
              </p>
              <ExpenseForm />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
