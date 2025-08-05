import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { generateTableQRCode, downloadQRCode } from "@/lib/qr-utils";
import { Download, QrCode } from "lucide-react";

interface Table {
  id: number;
  number: number;
  capacity: number;
  status: string;
  qrCode: string;
}

interface QRGeneratorProps {
  table: Table;
}

export function QRGenerator({ table }: QRGeneratorProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    generateQR();
  }, [table.number]);

  const generateQR = async () => {
    setIsGenerating(true);
    try {
      const qrUrl = await generateTableQRCode(table.number, {
        width: 200,
        margin: 2,
      });
      setQrCodeUrl(qrUrl);
    } catch (error) {
      console.error("Failed to generate QR code:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (qrCodeUrl) {
      downloadQRCode(qrCodeUrl, `table-${table.number}-qr.png`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-success";
      case "occupied":
        return "bg-warning";
      case "reserved":
        return "bg-primary";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "available":
        return "Disponible";
      case "occupied":
        return "Occupée";
      case "reserved":
        return "Réservée";
      default:
        return status;
    }
  };

  return (
    <Card className="text-center">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Table {table.number}</span>
          <Badge className={`${getStatusColor(table.status)} text-white`}>
            {getStatusLabel(table.status)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center space-y-4">
          {isGenerating ? (
            <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
              <QrCode className="h-8 w-8 text-gray-400 animate-pulse" />
            </div>
          ) : qrCodeUrl ? (
            <img
              src={qrCodeUrl}
              alt={`QR Code Table ${table.number}`}
              className="w-32 h-32 border rounded-lg"
            />
          ) : (
            <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
              <QrCode className="h-8 w-8 text-gray-400" />
            </div>
          )}

          <div className="text-sm text-gray-600">
            <p>Capacité: {table.capacity} personnes</p>
          </div>

          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={generateQR}
              disabled={isGenerating}
            >
              <QrCode className="h-4 w-4 mr-1" />
              Régénérer
            </Button>
            <Button
              size="sm"
              onClick={handleDownload}
              disabled={!qrCodeUrl || isGenerating}
            >
              <Download className="h-4 w-4 mr-1" />
              Télécharger
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
