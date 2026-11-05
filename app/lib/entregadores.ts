import { cpfValido } from '@/app/lib/cpf';
import type { ErrosDoFormulario } from '@/app/lib/empresa';
import type { NovoEntregador, TipoVeiculo } from '@/app/lib/tipos';

export const TIPOS_DE_VEICULO: TipoVeiculo[] = ['MOTO', 'CARRO', 'BICICLETA'];

const PLACA_ANTIGA_OU_MERCOSUL = /^[A-Z]{3}\d[A-Z0-9]\d{2}$/;
const TAMANHO_DA_PLACA = 7;
const TELEFONE_COM_DDD = /^\d{10,11}$/;

export interface ValoresDoEntregador {
  nome: string;
  cpf: string;
  telefone: string;
  tipoVeiculo: TipoVeiculo | '';
  placa: string;
}

export const ENTREGADOR_VAZIO: ValoresDoEntregador = {
  nome: '',
  cpf: '',
  telefone: '',
  tipoVeiculo: '',
  placa: '',
};

export function precisaDePlaca(tipoVeiculo: TipoVeiculo | ''): boolean {
  return tipoVeiculo !== 'BICICLETA';
}

export function normalizarPlaca(texto: string): string {
  return texto
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, TAMANHO_DA_PLACA);
}

export function validarEntregador(valores: ValoresDoEntregador): ErrosDoFormulario<ValoresDoEntregador> {
  const erros: ErrosDoFormulario<ValoresDoEntregador> = {};
  if (!valores.nome.trim()) erros.nome = 'Preencha este campo';
  if (!cpfValido(valores.cpf)) erros.cpf = 'CPF inválido';
  if (!TELEFONE_COM_DDD.test(valores.telefone)) erros.telefone = 'Informe DDD e número (10 ou 11 dígitos)';
  if (!valores.tipoVeiculo) erros.tipoVeiculo = 'Escolha o tipo de veículo';
  if (precisaDePlaca(valores.tipoVeiculo) && !PLACA_ANTIGA_OU_MERCOSUL.test(valores.placa)) {
    erros.placa = 'Use o formato ABC1234 ou ABC1D23';
  }
  return erros;
}

export function paraNovoEntregador(valores: ValoresDoEntregador): NovoEntregador {
  const tipoVeiculo = valores.tipoVeiculo as TipoVeiculo;
  return {
    nome: valores.nome.trim(),
    cpf: valores.cpf,
    telefone: valores.telefone,
    tipoVeiculo,
    ...(precisaDePlaca(tipoVeiculo) && { placa: valores.placa }),
  };
}
