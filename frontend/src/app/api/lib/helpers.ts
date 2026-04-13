/**
 * Normaliza uma query de busca para uso em cache e consistência.
 * Remove acentos, caracteres especiais, múltiplos espaços e converte para minúsculas.
 */
export function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s]/g, '')     // Remove caracteres especiais
    .replace(/\s+/g, ' ')             // Normaliza múltiplos espaços
    .trim();
}

/**
 * Utilitário para sleep/delay (Promise based)
 */
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
