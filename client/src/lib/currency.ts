// Utilitaires pour la gestion de la devise CFA

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(num)) return '0 FCFA';
  
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num) + ' FCFA';
}

export function parseCurrency(value: string): number {
  // Supprime tout sauf les chiffres et le point décimal
  const cleaned = value.replace(/[^\d.,]/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export const CURRENCY_SYMBOL = 'FCFA';
export const CURRENCY_CODE = 'XOF'; // Code ISO pour Franc CFA Ouest