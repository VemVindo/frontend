import { describe, expect, it } from 'vitest';
import {
  ENTREGADOR_VAZIO,
  normalizarPlaca,
  paraNovoEntregador,
  placaValida,
  semEntregador,
  telefoneValido,
  validarEntregador,
  type ValoresDoEntregador,
} from './entregadores';
import type { DadosCompartilhados } from './tipos';

const VALIDO: ValoresDoEntregador = {
  nome: '  Joana Lima ',
  cpf: '52998224725',
  telefone: '61988887777',
  tipoVeiculo: 'MOTO',
  placa: 'ABC1D23',
};

describe('validarEntregador', () => {
  it('aceita um cadastro completo', () => {
    expect(validarEntregador(VALIDO)).toEqual({});
  });

  it('aponta todos os campos vazios', () => {
    expect(validarEntregador(ENTREGADOR_VAZIO)).toEqual({
      nome: 'Preencha este campo',
      cpf: 'CPF inválido',
      telefone: 'Informe DDD e número (10 ou 11 dígitos)',
      tipoVeiculo: 'Escolha o tipo de veículo',
      placa: 'Use o formato ABC1234 ou ABC1D23',
    });
  });

  it('recusa CPF com digito verificador errado', () => {
    expect(validarEntregador({ ...VALIDO, cpf: '52998224726' }).cpf).toBe('CPF inválido');
  });

  it.each(['ABC1234', 'ABC1D23'])('aceita a placa %s', (placa) => {
    expect(validarEntregador({ ...VALIDO, placa }).placa).toBeUndefined();
  });

  it('nao pede placa para bicicleta', () => {
    expect(validarEntregador({ ...VALIDO, tipoVeiculo: 'BICICLETA', placa: '' })).toEqual({});
  });
});

describe('normalizarPlaca', () => {
  it('deixa maiuscula, sem traco e com no maximo 7 caracteres', () => {
    expect(normalizarPlaca('abc-1d234')).toBe('ABC1D23');
  });
});

describe('paraNovoEntregador', () => {
  it('manda o nome sem espacos nas pontas e a placa do veiculo', () => {
    expect(paraNovoEntregador(VALIDO)).toEqual({
      nome: 'Joana Lima',
      cpf: '52998224725',
      telefone: '61988887777',
      tipoVeiculo: 'MOTO',
      placa: 'ABC1D23',
    });
  });

  it('nao manda placa para bicicleta', () => {
    expect(paraNovoEntregador({ ...VALIDO, tipoVeiculo: 'BICICLETA', placa: 'ABC1D23' })).not.toHaveProperty('placa');
  });
});

describe('placaValida e telefoneValido', () => {
  it.each([
    ['ABC1234', true],
    ['ABC1D23', true],
    ['ABC12345', false],
    ['abc1d23', false],
  ])('placa %s: %s', (placa, esperado) => {
    expect(placaValida(placa)).toBe(esperado);
  });

  it.each([
    ['6133334444', true],
    ['61999990000', true],
    ['619999', false],
    ['(61) 99999-0000', false],
  ])('telefone %s: %s', (telefone, esperado) => {
    expect(telefoneValido(telefone)).toBe(esperado);
  });
});

describe('linhas da frota', () => {
  const ana: DadosCompartilhados = {
    nome: 'Ana',
    cpf: '11111111111',
    telefone: '61900000001',
    tipoVeiculo: 'MOTO',
    placa: 'AAA1A11',
    disponivel: true,
  };
  const bia: DadosCompartilhados = { ...ana, nome: 'Bia', cpf: '22222222222' };

  it('tira só o entregador do CPF informado', () => {
    expect(semEntregador([ana, bia], ana.cpf)).toEqual([bia]);
  });

  it('com a frota ainda carregando, continua sem lista', () => {
    expect(semEntregador(null, ana.cpf)).toBeNull();
  });
});
