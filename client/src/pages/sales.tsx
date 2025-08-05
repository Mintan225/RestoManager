import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
// COMMENTEZ CES IMPORTS DE DIALOG
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendingUp, Euro, Calendar, Download, Plus, Trash2 } from "lucide-react";
// COMMENTEZ CES IMPORTS D'ALERTDIALOG
// import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
// Removed apiRequest import - using native fetch instead
import  authService  from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { fr } from "date-fns/locale";

const saleFormSchema = z.object({
  amount: z.string().min(1, "Le montant est requis"),
  paymentMethod: z.string().min(1, "La méthode de paiement est requise"),
  description: z.string().optional(),
});

type SaleFormData = z.infer<typeof saleFormSchema>;

function SaleForm({ onSuccess }: { onSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<SaleFormData>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      amount: "",
      paymentMethod: "",
      description: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: authService.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create sale");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/daily"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/weekly"] });
      setOpen(false);
      form.reset();
      toast({
        title: "Succès",
        description: "Vente ajoutée avec succès",
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la vente",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SaleFormData) => {
    createMutation.mutate(data);
  };

  return (
    // ENVELOPPEZ LE TOUT DANS UN FRAGMENT
    <>
      {/* COMMENTEZ Dialog et DialogTrigger */}
      {/* <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild> */}
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une vente
          </Button>
        {/* </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une vente</DialogTitle>
          </DialogHeader> */}
          {/* AFFICHEZ LE FORMULAIRE DIRECTEMENT SI 'open' EST VRAI */}
          {open && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
                <h2 className="text-xl font-bold mb-4">Ajouter une vente</h2>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="amount">Montant (FCFA)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      {...form.register("amount")}
                      placeholder="0.00"
                    />
                    {form.formState.errors.amount && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.amount.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="paymentMethod">Méthode de paiement</Label>
                    <Select
                      value={form.watch("paymentMethod")} // Assurez-vous que SelectValue est stable
                      onValueChange={(value) => form.setValue("paymentMethod", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner..." >
                          {form.watch("paymentMethod") || "Sélectionner..."}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Espèces</SelectItem>
                        <SelectItem value="orange_money">Orange Money</SelectItem>
                        <SelectItem value="mtn_momo">MTN Mobile Money</SelectItem>
                        <SelectItem value="moov_money">Moov Money</SelectItem>
                        <SelectItem value="wave">Wave</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.paymentMethod && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.paymentMethod.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="description">Description (optionnel)</Label>
                    <Input
                      id="description"
                      {...form.register("description")}
                      placeholder="Description de la vente..."
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpen(false)}
                      className="flex-1"
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending}
                      className="flex-1"
                    >
                      {createMutation.isPending ? "Ajout..." : "Ajouter"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        {/* </DialogContent>
      </Dialog> */}
    </>
  );
}

export default function Sales() {
  const [dateRange, setDateRange] = useState("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Calculate date ranges
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

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ["/api/sales", { startDate: start, endDate: end }],
    enabled: !!start && !!end,
  });

  const { data: todayStats } = useQuery({
    queryKey: ["/api/analytics/daily"],
  });

  // Calculate totals
  const totalSales = sales.reduce((sum: number, sale: any) => sum + parseFloat(sale.amount), 0);
  const cashSales = sales
    .filter((sale: any) => sale.paymentMethod === "cash")
    .reduce((sum: number, sale: any) => sum + parseFloat(sale.amount), 0);
  const mobileMoneySales = sales
    .filter((sale: any) => sale.paymentMethod === "mobile_money")
    .reduce((sum: number, sale: any) => sum + parseFloat(sale.amount), 0);

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "cash":
        return "Espèces";
      case "orange_money":
        return "Orange Money";
      case "mtn_momo":
        return "MTN Mobile Money";
      case "moov_money":
        return "Moov Money";
      case "wave":
        return "Wave";
      case "mobile_money": // Fallback for generic mobile_money if used in backend
        return "Mobile Money";
      default:
        return method;
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case "cash":
        return "bg-success";
      case "orange_money":
      case "mtn_momo":
      case "moov_money":
      case "wave":
      case "mobile_money":
        return "bg-primary";
      default:
        return "bg-gray-500";
    }
  };

  const deleteSaleMutation = useMutation({
    mutationFn: async (saleId: number) => {
      const response = await fetch(`/api/sales/${saleId}`, {
        method: "DELETE",
        headers: authService.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete sale");
      }

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/daily"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/weekly"] });
      toast({
        title: "Succès",
        description: "Vente supprimée avec succès",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteSale = (saleId: number) => {
    deleteSaleMutation.mutate(saleId);
  };

  const exportToPDF = () => {
    if (sales.length === 0) return;

    import('jspdf').then(({ default: jsPDF }) => {
      const doc = new jsPDF();
      
      // En-tête
      doc.setFontSize(20);
      doc.text('Rapport des Ventes', 20, 20);
      
      doc.setFontSize(12);
      doc.text(`Période: ${dateRange}`, 20, 35);
      doc.text(`Généré le: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: fr })}`, 20, 45);
      
      // Tableau des ventes
      const tableData = sales.map((sale: any) => [
        format(new Date(sale.createdAt), "dd/MM/yyyy HH:mm", { locale: fr }),
        `${parseFloat(sale.amount).toFixed(0)} FCFA`,
        getPaymentMethodLabel(sale.paymentMethod),
        sale.description || ""
      ]);
      
      // En-têtes du tableau
      const headers = ["Date", "Montant", "Méthode", "Description"];
      
      let yPos = 60;
      
      // Dessiner les en-têtes
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      headers.forEach((header, i) => {
        doc.text(header, 20 + (i * 45), yPos);
      });
      
      // Ligne sous les en-têtes
      doc.line(20, yPos + 2, 190, yPos + 2);
      yPos += 10;
      
      // Données du tableau
      doc.setFont(undefined, 'normal');
      tableData.forEach((row, index) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        
        row.forEach((cell, i) => {
          const maxWidth = 40;
          const text = cell.length > 20 ? cell.substring(0, 20) + '...' : cell;
          doc.text(text, 20 + (i * 45), yPos);
        });
        yPos += 8;
      });
      
      // Total
      const total = sales.reduce((sum: number, sale: any) => sum + parseFloat(sale.amount), 0);
      yPos += 10;
      doc.setFont(undefined, 'bold');
      doc.text(`Total: ${total.toFixed(0)} FCFA`, 20, yPos);
      
      // Télécharger le PDF
      doc.save(`ventes-${dateRange}-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Suivi des Ventes</h1>
        <div className="flex gap-2">
          <SaleForm />
          <Button onClick={exportToPDF} disabled={sales.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exporter PDF
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Période d'analyse</CardTitle>
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
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                  <Euro className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total des ventes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(totalSales)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-success rounded-md flex items-center justify-center">
                  <Euro className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Espèces</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(cashSales)}
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
                  <Euro className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Mobile Money</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(mobileMoneySales)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-secondary rounded-md flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Nombre de ventes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {sales.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales List */}
      <Card>
        <CardHeader>
          <CardTitle>Détail des ventes</CardTitle>
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
          ) : sales.length > 0 ? (
            <div className="space-y-4">
              {sales.map((sale: any) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between py-3 border-b last:border-b-0"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="font-medium text-gray-900">
                          {formatCurrency(parseFloat(sale.amount))}
                        </p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(sale.createdAt), "dd/MM/yyyy HH:mm", { locale: fr })}
                        </p>
                      </div>
                      <Badge className={`${getPaymentMethodColor(sale.paymentMethod)} text-white`}>
                        {getPaymentMethodLabel(sale.paymentMethod)}
                      </Badge>
                    </div>
                    {sale.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {sale.description}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    {/* COMMENTEZ AlertDialog */}
                    {/* <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer cette vente</AlertDialogTitle>
                          <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer cette vente de {formatCurrency(parseFloat(sale.amount))} ? 
                            Cette action ne peut pas être annulée.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteSale(sale.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog> */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => { /* Logique de suppression temporaire si nécessaire */ console.log("Supprimer vente", sale.id); handleDeleteSale(sale.id); }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune vente trouvée
              </h3>
              <p className="text-gray-500">
                Aucune vente n'a été enregistrée pour cette période.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
