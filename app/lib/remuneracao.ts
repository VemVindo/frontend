import { centavosParaReais, reaisParaCentavos } from '@/app/lib/moeda';
import type { ParametrosRemuneracao, RemuneracaoDaEmpresa } from '@/app/lib/tipos';

export type CampoRemuneracao = keyof ParametrosRemuneracao;
export type ValoresRemuneracao = Record<CampoRemuneracao, string>;
export type ErrosRemuneracao = Partial<Record<CampoRemuneracao, string>>;

export interface DescricaoCampoRemuneracao {
  nome: CampoRemuneracao;
  rotulo: string;
  descricao: string;
}

export const CAMPOS_REMUNERACAO: DescricaoCampoRemuneracao[] = [
  {
    nome: 'taxaFixa',
    rotulo: 'Valor base por entrega',
    descricao: 'Valor fixo pago a cada entrega concluída',
  },
  {
    nome: 'coeficienteKm',
    rotulo: 'Adicional por quilômetro',
    descricao: 'Somado conforme a distância percorrida',
  },
];

export function paraValores(parametros: Pick<RemuneracaoDaEmpresa, CampoRemuneracao>): ValoresRemuneracao {
  return {
    taxaFixa: parametros.taxaFixa === null ? '' : centavosParaReais(parametros.taxaFixa),
    coeficienteKm: parametros.coeficienteKm === null ? '' : centavosParaReais(parametros.coeficienteKm),
  };
}

export function paraParametros(valores: ValoresRemuneracao): ParametrosRemuneracao {
  return {
    taxaFixa: reaisParaCentavos(valores.taxaFixa) ?? 0,
    coeficienteKm: reaisParaCentavos(valores.coeficienteKm) ?? 0,
  };
}

export function validarValorEmReais(texto: string): string | undefined {
  if (texto.trim() === '') return 'Preencha este campo';
  if (texto.includes('-')) return 'O valor precisa ser positivo';
  const centavos = reaisParaCentavos(texto);
  if (centavos === null) return 'Use só números, por exemplo 8,50';
  if (centavos === 0) return 'O valor precisa ser maior que zero';
  return undefined;
}

export function validarValores(valores: ValoresRemuneracao): ErrosRemuneracao {
  const erros: ErrosRemuneracao = {};
  for (const campo of CAMPOS_REMUNERACAO) {
    const erro = validarValorEmReais(valores[campo.nome]);
    if (erro) erros[campo.nome] = erro;
  }
  return erros;
}
