import { ListResult } from '@/services/api';

/**
 * Generates a CSV string from approved shopping list items.
 */
export function generateCsv(approvedItems: ListResult[]): string {
  const headers = ['Produto', 'Título Selecionado', 'Preço (R$)', 'Loja', 'Link'];

  const rows = approvedItems.map((item) => {
    const price =
      item.best_price != null
        ? item.best_price.toFixed(2).replace('.', ',')
        : '';
    return [
      item.original_query,
      item.best_product_title ?? '',
      price,
      item.best_store ?? '',
      item.best_product_link ?? '',
    ].map(escapeCsvField);
  });

  return [headers.map(escapeCsvField), ...rows].map((r) => r.join(';')).join('\n');
}

/**
 * Triggers a file download in the browser with the given CSV content.
 */
export function downloadCsv(content: string, filename = 'cotacao.csv'): void {
  const bom = '\uFEFF'; // UTF-8 BOM for Excel compatibility
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function escapeCsvField(value: string): string {
  if (value.includes(';') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
