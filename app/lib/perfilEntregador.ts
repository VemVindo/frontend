import type { ErrosDoFormulario } from '@/app/lib/empresa';
import { placaValida, precisaDePlaca, telefoneValido } from '@/app/lib/entregadores';
import type { EdicaoDoPerfil, PerfilDoEntregador, TipoVeiculo } from '@/app/lib/tipos';

export const TAMANHO_MAXIMO_DO_NOME = 120;

export interface ValoresDoPerfil {
  nome: string;
  telefone: string;
  tipoVeiculo: TipoVeiculo;
  placa: string;
}

export function valoresDoPerfil(perfil: PerfilDoEntregador): ValoresDoPerfil {
  return {
    nome: perfil.nome,
    telefone: perfil.telefone.replace(/\D/g, ''),
    tipoVeiculo: perfil.tipoVeiculo,
    placa: perfil.placa ?? '',
  };
}

export function validarPerfil(valores: ValoresDoPerfil): ErrosDoFormulario<ValoresDoPerfil> {
  const erros: ErrosDoFormulario<ValoresDoPerfil> = {};
  const nome = valores.nome.trim();
  if (!nome) erros.nome = 'Preencha este campo';
  else if (nome.length > TAMANHO_MAXIMO_DO_NOME) erros.nome = `Use até ${TAMANHO_MAXIMO_DO_NOME} caracteres`;
  if (!telefoneValido(valores.telefone)) erros.telefone = 'Informe DDD e número (10 ou 11 dígitos)';
  if (precisaDePlaca(valores.tipoVeiculo) && !placaValida(valores.placa)) {
    erros.placa = 'Use o formato ABC1234 ou ABC1D23';
  }
  return erros;
}

// Manda só o que mudou. Bicicleta não leva placa: o back zera a placa sozinho.
export function alteracoesDoPerfil(antes: PerfilDoEntregador, valores: ValoresDoPerfil): EdicaoDoPerfil {
  const original = valoresDoPerfil(antes);
  const nome = valores.nome.trim();
  const trocouVeiculo = valores.tipoVeiculo !== original.tipoVeiculo;
  const mandarPlaca = precisaDePlaca(valores.tipoVeiculo) && (trocouVeiculo || valores.placa !== original.placa);
  return {
    ...(nome !== original.nome && { nome }),
    ...(valores.telefone !== original.telefone && { telefone: valores.telefone }),
    ...(trocouVeiculo && { tipoVeiculo: valores.tipoVeiculo }),
    ...(mandarPlaca && { placa: valores.placa }),
  };
}

export function semAlteracoes(edicao: EdicaoDoPerfil): boolean {
  return Object.keys(edicao).length === 0;
}
