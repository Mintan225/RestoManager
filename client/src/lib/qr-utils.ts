import QRCode from 'qrcode';

export interface QRCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

export async function generateQRCode(
  text: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const defaultOptions = {
    width: 256,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    ...options,
  };

  try {
    const dataUrl = await QRCode.toDataURL(text, defaultOptions);
    return dataUrl;
  } catch (error) {
    console.error('Failed to generate QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

export function generateTableQRData(tableNumber: number, baseUrl?: string): string {
  const url = baseUrl || `${window.location.origin}/table/${tableNumber}`;
  return url;
}

export async function generateTableQRCode(
  tableNumber: number,
  options?: QRCodeOptions
): Promise<string> {
  const qrData = generateTableQRData(tableNumber);
  return generateQRCode(qrData, options);
}

export function downloadQRCode(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  
  // Utiliser click() directement sans ajouter au DOM pour éviter les erreurs
  link.style.display = 'none';
  
  try {
    document.body.appendChild(link);
    link.click();
    
    // Supprimer immédiatement après le clic
    if (link.parentNode === document.body) {
      document.body.removeChild(link);
    }
  } catch (error) {
    console.warn('Error during QR code download:', error);
    // En cas d'erreur, tentative de nettoyage
    try {
      if (link.parentNode === document.body) {
        document.body.removeChild(link);
      }
    } catch (cleanupError) {
      console.warn('Error during cleanup:', cleanupError);
    }
  }
}
