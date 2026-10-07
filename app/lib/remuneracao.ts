// Parâmetros de remuneração do estabelecimento (E-US15), em centavos.
export interface ParametrosRemuneracao {
  taxaFixa: number;
  coeficienteKm: number;
}

// Mock até o endpoint do backend existir. Quando existir, as duas funções
// passam a chamar GET e PUT /remuneracao, mantendo as mesmas assinaturas.
let parametrosSalvos: ParametrosRemuneracao = { taxaFixa: 800, coeficienteKm: 150 };

function esperar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function buscarParametrosRemuneracao(): Promise<ParametrosRemuneracao> {
  await esperar(400);
  return { ...parametrosSalvos };
}

export async function salvarParametrosRemuneracao(
  parametros: ParametrosRemuneracao,
): Promise<ParametrosRemuneracao> {
  await esperar(600);
  parametrosSalvos = { ...parametros };
  return { ...parametrosSalvos };
}
