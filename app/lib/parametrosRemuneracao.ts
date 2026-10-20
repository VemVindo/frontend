import type { ParametrosRemuneracao } from '@/app/lib/tipos';

// Simulado até o backend da E-US15 expor os parâmetros.
export const PARAMETROS_REMUNERACAO_EXEMPLO: ParametrosRemuneracao = { taxaFixa: 800, coeficienteKm: 150 };

const ATRASO_SIMULADO_MS = 400;

let parametrosSalvos: ParametrosRemuneracao = { ...PARAMETROS_REMUNERACAO_EXEMPLO };

function esperar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function buscarParametrosRemuneracao(): Promise<ParametrosRemuneracao> {
  await esperar(ATRASO_SIMULADO_MS);
  return { ...parametrosSalvos };
}

export async function salvarParametrosRemuneracao(
  parametros: ParametrosRemuneracao,
): Promise<ParametrosRemuneracao> {
  await esperar(ATRASO_SIMULADO_MS);
  parametrosSalvos = { ...parametros };
  return { ...parametrosSalvos };
}
