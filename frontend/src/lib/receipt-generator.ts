import jsPDF from 'jspdf';
import { formatCurrency } from './currency';

export interface ReceiptData {
  orderId: number;
  customerName: string;
  customerPhone?: string;
  tableNumber: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  total: number;
  paymentMethod: string;
  paymentDate: string;
  restaurantName?: string;
  restaurantAddress?: string;
  restaurantPhone?: string;
}

export function generateReceipt(data: ReceiptData): jsPDF {
  const doc = new jsPDF();
  
  // Configuration
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  let currentY = 30;
  
  // En-tête du restaurant
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.text(data.restaurantName || 'Restaurant', pageWidth / 2, currentY, { align: 'center' });
  
  currentY += 10;
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  if (data.restaurantAddress) {
    doc.text(data.restaurantAddress, pageWidth / 2, currentY, { align: 'center' });
    currentY += 8;
  }
  if (data.restaurantPhone) {
    doc.text(`Tél: ${data.restaurantPhone}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 8;
  }
  
  // Ligne de séparation
  currentY += 10;
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 15;
  
  // Titre du reçu
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text('REÇU DE PAIEMENT', pageWidth / 2, currentY, { align: 'center' });
  currentY += 20;
  
  // Informations de la commande
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  
  doc.text(`Commande N°: ${data.orderId}`, margin, currentY);
  currentY += 8;
  doc.text(`Date: ${data.paymentDate}`, margin, currentY);
  currentY += 8;
  doc.text(`Table N°: ${data.tableNumber}`, margin, currentY);
  currentY += 8;
  doc.text(`Client: ${data.customerName}`, margin, currentY);
  currentY += 8;
  if (data.customerPhone) {
    doc.text(`Téléphone: ${data.customerPhone}`, margin, currentY);
    currentY += 8;
  }
  doc.text(`Mode de paiement: ${data.paymentMethod}`, margin, currentY);
  currentY += 15;
  
  // Ligne de séparation
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 15;
  
  // En-têtes du tableau des articles
  doc.setFont(undefined, 'bold');
  doc.text('Article', margin, currentY);
  doc.text('Qté', margin + 80, currentY);
  doc.text('Prix Unit.', margin + 110, currentY);
  doc.text('Total', margin + 150, currentY);
  currentY += 8;
  
  // Ligne sous les en-têtes
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 10;
  
  // Articles
  doc.setFont(undefined, 'normal');
  data.items.forEach(item => {
    doc.text(item.name, margin, currentY);
    doc.text(item.quantity.toString(), margin + 80, currentY);
    doc.text(formatCurrency(item.price), margin + 110, currentY);
    doc.text(formatCurrency(item.total), margin + 150, currentY);
    currentY += 8;
  });
  
  currentY += 10;
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 15;
  
  // Total
  doc.setFont(undefined, 'bold');
  doc.setFontSize(14);
  doc.text(`TOTAL: ${formatCurrency(data.total)}`, pageWidth - margin, currentY, { align: 'right' });
  currentY += 20;
  
  // Message de remerciement
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.text('Merci pour votre visite !', pageWidth / 2, currentY, { align: 'center' });
  currentY += 8;
  doc.text('À bientôt dans notre restaurant', pageWidth / 2, currentY, { align: 'center' });
  
  // Pied de page avec QR code ou code de vérification
  currentY += 20;
  doc.setFontSize(9);
  doc.text(`Code de vérification: ${data.orderId}-${Date.now().toString().slice(-6)}`, pageWidth / 2, currentY, { align: 'center' });
  
  return doc;
}

export function downloadReceipt(data: ReceiptData): void {
  const doc = generateReceipt(data);
  const filename = `recu-commande-${data.orderId}-${Date.now()}.pdf`;
  doc.save(filename);
}

export function generateReceiptBlob(data: ReceiptData): Blob {
  const doc = generateReceipt(data);
  return doc.output('blob');
}