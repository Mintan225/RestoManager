var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { generateTableQRCode, downloadQRCode } from "@/lib/qr-utils";
import { Download, QrCode } from "lucide-react";
export function QRGenerator({ table }) {
    const [qrCodeUrl, setQrCodeUrl] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    useEffect(() => {
        generateQR();
    }, [table.number]);
    const generateQR = () => __awaiter(this, void 0, void 0, function* () {
        setIsGenerating(true);
        try {
            const qrUrl = yield generateTableQRCode(table.number, {
                width: 200,
                margin: 2,
            });
            setQrCodeUrl(qrUrl);
        }
        catch (error) {
            console.error("Failed to generate QR code:", error);
        }
        finally {
            setIsGenerating(false);
        }
    });
    const handleDownload = () => {
        if (qrCodeUrl) {
            downloadQRCode(qrCodeUrl, `table-${table.number}-qr.png`);
        }
    };
    const getStatusColor = (status) => {
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
    const getStatusLabel = (status) => {
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
    return (<Card className="text-center">
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
          {isGenerating ? (<div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
              <QrCode className="h-8 w-8 text-gray-400 animate-pulse"/>
            </div>) : qrCodeUrl ? (<img src={qrCodeUrl} alt={`QR Code Table ${table.number}`} className="w-32 h-32 border rounded-lg"/>) : (<div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
              <QrCode className="h-8 w-8 text-gray-400"/>
            </div>)}

          <div className="text-sm text-gray-600">
            <p>Capacité: {table.capacity} personnes</p>
          </div>

          <div className="flex space-x-2">
            <Button size="sm" variant="outline" onClick={generateQR} disabled={isGenerating}>
              <QrCode className="h-4 w-4 mr-1"/>
              Régénérer
            </Button>
            <Button size="sm" onClick={handleDownload} disabled={!qrCodeUrl || isGenerating}>
              <Download className="h-4 w-4 mr-1"/>
              Télécharger
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>);
}
