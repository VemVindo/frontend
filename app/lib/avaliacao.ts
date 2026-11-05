export const TAMANHO_MAXIMO_COMENTARIO = 500;

export const ESTRELAS = [1, 2, 3, 4, 5];

const ROTULO_DA_NOTA: Record<number, string> = {
  0: 'Péssimo',
  1: 'Ruim',
  2: 'Regular',
  3: 'Bom',
  4: 'Muito bom',
  5: 'Excelente!',
};

export const MENSAGEM_SEM_AVALIACAO: Record<'expirada' | 'indisponivel', string> = {
  expirada: 'O prazo para avaliar esta entrega terminou.',
  indisponivel: 'Entregas canceladas não podem ser avaliadas.',
};

export function rotuloDaNota(nota: number | null): string {
  if (nota === null) return 'Toque nas estrelas para avaliar';
  return ROTULO_DA_NOTA[nota] ?? '';
}

export function comentarioParaEnviar(texto: string): string | null {
  const limpo = texto.trim();
  return limpo === '' ? null : limpo;
}
