import { describe, expect, it } from 'vitest';
import {
  alteracoesDoPerfil,
  semAlteracoes,
  TAMANHO_MAXIMO_DO_NOME,
  validarPerfil,
  valoresDoPerfil,
  type ValoresDoPerfil,
} from './perfilEntregador';
import type { PerfilDoEntregador } from './tipos';

const PERFIL: PerfilDoEntregador = {
  nome: 'Joana Lima',
  cpf: '52998224725',
  telefone: '61988887777',
  tipoVeiculo: 'MOTO',
  placa: 'ABC1D23',
};

const VALORES: ValoresDoPerfil = valoresDoPerfil(PERFIL);

describe('valoresDoPerfil', () => {
  it('preenche o formulário sem o CPF e só com os dígitos do telefone', () => {
    expect(valoresDoPerfil({ ...PERFIL, telefone: '(61) 98888-7777' })).toEqual({
      nome: 'Joana Lima',
      telefone: '61988887777',
      tipoVeiculo: 'MOTO',
      placa: 'ABC1D23',
    });
  });

  it('usa placa vazia para quem não tem placa', () => {
    expect(valoresDoPerfil({ ...PERFIL, tipoVeiculo: 'BICICLETA', placa: null }).placa).toBe('');
  });
});

describe('validarPerfil', () => {
  it('aceita o perfil completo', () => {
    expect(validarPerfil(VALORES)).toEqual({});
  });

  it.each([
    ['vazio', '   ', 'Preencha este campo'],
    ['longo demais', 'a'.repeat(TAMANHO_MAXIMO_DO_NOME + 1), 'Use até 120 caracteres'],
  ])('recusa nome %s', (_caso, nome, mensagem) => {
    expect(validarPerfil({ ...VALORES, nome }).nome).toBe(mensagem);
  });

  it('aceita nome com exatamente 120 caracteres', () => {
    expect(validarPerfil({ ...VALORES, nome: 'a'.repeat(TAMANHO_MAXIMO_DO_NOME) })).toEqual({});
  });

  it('recusa telefone sem DDD', () => {
    expect(validarPerfil({ ...VALORES, telefone: '988887777' }).telefone).toBe(
      'Informe DDD e número (10 ou 11 dígitos)',
    );
  });

  it.each(['MOTO', 'CARRO'] as const)('exige placa válida para %s', (tipoVeiculo) => {
    expect(validarPerfil({ ...VALORES, tipoVeiculo, placa: 'AB12' }).placa).toBe('Use o formato ABC1234 ou ABC1D23');
  });

  it('não pede placa para bicicleta', () => {
    expect(validarPerfil({ ...VALORES, tipoVeiculo: 'BICICLETA', placa: '' })).toEqual({});
  });
});

describe('alteracoesDoPerfil', () => {
  it('não manda nada quando nada mudou', () => {
    const edicao = alteracoesDoPerfil(PERFIL, { ...VALORES, nome: '  Joana Lima ' });

    expect(edicao).toEqual({});
    expect(semAlteracoes(edicao)).toBe(true);
  });

  it('manda só o nome sem espaços nas pontas e o telefone alterados', () => {
    const edicao = alteracoesDoPerfil(PERFIL, { ...VALORES, nome: ' Joana Souza ', telefone: '6133334444' });

    expect(edicao).toEqual({ nome: 'Joana Souza', telefone: '6133334444' });
    expect(semAlteracoes(edicao)).toBe(false);
  });

  it('manda a placa quando só ela muda', () => {
    expect(alteracoesDoPerfil(PERFIL, { ...VALORES, placa: 'XYZ9876' })).toEqual({ placa: 'XYZ9876' });
  });

  it('ao trocar de moto para carro, manda o tipo e a placa', () => {
    expect(alteracoesDoPerfil(PERFIL, { ...VALORES, tipoVeiculo: 'CARRO' })).toEqual({
      tipoVeiculo: 'CARRO',
      placa: 'ABC1D23',
    });
  });

  it('ao trocar para bicicleta, manda só o tipo e deixa o back zerar a placa', () => {
    expect(alteracoesDoPerfil(PERFIL, { ...VALORES, tipoVeiculo: 'BICICLETA' })).toEqual({ tipoVeiculo: 'BICICLETA' });
  });

  it('ao sair da bicicleta, manda o tipo e a placa nova', () => {
    const ciclista: PerfilDoEntregador = { ...PERFIL, tipoVeiculo: 'BICICLETA', placa: null };

    expect(alteracoesDoPerfil(ciclista, { ...VALORES, tipoVeiculo: 'MOTO', placa: 'ABC1234' })).toEqual({
      tipoVeiculo: 'MOTO',
      placa: 'ABC1234',
    });
  });
});
