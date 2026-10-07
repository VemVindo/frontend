// Valores em dinheiro trafegam em centavos (inteiros), como no banco:
// R$ 8,50 -> 850. Isso evita erros de arredondamento com números decimais.

export function centavosParaReais(centavos: number): string {
  return (centavos / 100).toFixed(2).replace('.', ',');
}

// Aceita "8", "8,5", "8,50" ou "8.50". Retorna null se o texto não for um valor válido.
export function reaisParaCentavos(texto: string): number | null {
  const normalizado = texto.trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalizado)) return null;
  return Math.round(Number(normalizado) * 100);
}
