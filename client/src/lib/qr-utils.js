var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import QRCode from 'qrcode';
export function generateQRCode(text_1) {
    return __awaiter(this, arguments, void 0, function* (text, options = {}) {
        const defaultOptions = Object.assign({ width: 256, margin: 2, color: {
                dark: '#000000',
                light: '#FFFFFF',
            } }, options);
        try {
            const dataUrl = yield QRCode.toDataURL(text, defaultOptions);
            return dataUrl;
        }
        catch (error) {
            console.error('Failed to generate QR code:', error);
            throw new Error('Failed to generate QR code');
        }
    });
}
export function generateTableQRData(tableNumber, baseUrl) {
    const url = baseUrl || `${window.location.origin}/table/${tableNumber}`;
    return url;
}
export function generateTableQRCode(tableNumber, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const qrData = generateTableQRData(tableNumber);
        return generateQRCode(qrData, options);
    });
}
export function downloadQRCode(dataUrl, filename) {
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
    }
    catch (error) {
        console.warn('Error during QR code download:', error);
        // En cas d'erreur, tentative de nettoyage
        try {
            if (link.parentNode === document.body) {
                document.body.removeChild(link);
            }
        }
        catch (cleanupError) {
            console.warn('Error during cleanup:', cleanupError);
        }
    }
}
