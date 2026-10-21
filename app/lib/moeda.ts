export function centavosParaReais(centavos: number): string {
  return (centavos / 100).toFixed(2).replace('.', ',');
}

export function reaisParaCentavos(texto: string): number | null {
  const normalizado = texto.trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalizado)) return null;
  return Math.round(Number(normalizado) * 100);
}
