import type { FiltroDeAvaliacoes } from '@/app/lib/tipos';

export const NOTAS_DO_FILTRO = [5, 4, 3, 2, 1, 0];

export const FILTRO_INICIAL: FiltroDeAvaliacoes = { notas: [], de: '', ate: '' };

export function alternarNota(notas: number[], nota: number): number[] {
  if (notas.includes(nota)) {
    return notas.filter((atual) => atual !== nota);
  }
  return [...notas, nota].sort((a, b) => a - b);
}

export function periodoInvalido(filtro: FiltroDeAvaliacoes): boolean {
  return filtro.de !== '' && filtro.ate !== '' && filtro.de > filtro.ate;
}

export function consultaDasAvaliacoes(filtro: FiltroDeAvaliacoes): string {
  const parametros = new URLSearchParams();
  if (filtro.notas.length > 0) {
    parametros.set('notas', filtro.notas.join(','));
  }
  if (filtro.de) {
    parametros.set('de', new Date(`${filtro.de}T00:00:00`).toISOString());
  }
  if (filtro.ate) {
    parametros.set('ate', new Date(`${filtro.ate}T23:59:59.999`).toISOString());
  }
  const texto = parametros.toString();
  return texto ? `?${texto}` : '';
}
