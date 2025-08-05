import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QRGenerator } from "@/components/qr-generator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import  authService  from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { generateTableQRData } from "@/lib/qr-utils";
import { Plus, Download, RefreshCw } from "lucide-react";

export default function QRCodes() {
  const [open, setOpen] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState("");
  const [newTableCapacity, setNewTableCapacity] = useState("4");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tables = [], isLoading } = useQuery({
    queryKey: ["/api/tables"],
  });

  const createTableMutation = useMutation({
    mutationFn: async (tableData: any) => {
      const qrData = generateTableQRData(parseInt(tableData.number));
      
      const response = await fetch("/api/tables", {
        method: "POST",
        headers: authService.getAuthHeaders(),
        body: JSON.stringify({
          ...tableData,
          qrCode: qrData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create table");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Table créée avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tables"] });
      setOpen(false);
      setNewTableNumber("");
      setNewTableCapacity("4");
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const regenerateAllMutation = useMutation({
    mutationFn: async () => {
      // Utiliser l'API de régénération complète
      const response = await fetch("/api/admin/regenerate-qr-codes", {
        method: "PUT",
        headers: authService.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Failed to regenerate QR codes");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Succès",
        description: `${data.updated || 'Tous les'} QR codes ont été régénérés avec le bon format`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tables"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateTable = () => {
    if (!newTableNumber) {
      toast({
        title: "Erreur",
        description: "Le numéro de table est requis",
        variant: "destructive",
      });
      return;
    }

    const tableNumber = parseInt(newTableNumber);
    const capacity = parseInt(newTableCapacity);

    if (tables.some((table: any) => table.number === tableNumber)) {
      toast({
        title: "Erreur",
        description: "Ce numéro de table existe déjà",
        variant: "destructive",
      });
      return;
    }

    createTableMutation.mutate({
      number: tableNumber,
      capacity: capacity,
    });
  };

  const downloadAllQRCodes = async () => {
    try {
      for (const table of tables) {
        const { generateTableQRCode, downloadQRCode } = await import("@/lib/qr-utils");
        const qrUrl = await generateTableQRCode(table.number);
        downloadQRCode(qrUrl, `table-${table.number}-qr.png`);
        // Add a small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      toast({
        title: "Succès",
        description: "Tous les QR codes ont été téléchargés",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors du téléchargement des QR codes",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des QR Codes Tables</h1>
        <div className="flex space-x-2">
          <Button
            onClick={downloadAllQRCodes}
            variant="outline"
            disabled={tables.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Télécharger tout
          </Button>
          <Button
            onClick={() => regenerateAllMutation.mutate()}
            variant="outline"
            disabled={regenerateAllMutation.isPending || tables.length === 0}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${regenerateAllMutation.isPending ? 'animate-spin' : ''}`} />
            Régénérer tous les QR
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une table
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter une nouvelle table</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tableNumber">Numéro de table</Label>
                  <Input
                    id="tableNumber"
                    type="number"
                    value={newTableNumber}
                    onChange={(e) => setNewTableNumber(e.target.value)}
                    placeholder="1"
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tableCapacity">Capacité (nombre de personnes)</Label>
                  <Input
                    id="tableCapacity"
                    type="number"
                    value={newTableCapacity}
                    onChange={(e) => setNewTableCapacity(e.target.value)}
                    placeholder="4"
                    min="1"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Annuler
                  </Button>
                  <Button 
                    onClick={handleCreateTable}
                    disabled={createTableMutation.isPending}
                  >
                    {createTableMutation.isPending ? "Création..." : "Créer"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tables Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-32 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : tables.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tables
            .sort((a: any, b: any) => a.number - b.number)
            .map((table: any) => (
              <QRGenerator key={table.id} table={table} />
            ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              <Plus className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune table configurée
            </h3>
            <p className="text-gray-500 text-center mb-4">
              Commencez par ajouter vos premières tables pour générer les QR codes.
            </p>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter votre première table
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
