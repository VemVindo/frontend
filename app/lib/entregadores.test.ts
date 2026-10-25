import { describe, expect, it } from 'vitest';
import {
  ENTREGADOR_VAZIO,
  entregadorEditado,
  normalizarPlaca,
  paraEdicaoDoEntregador,
  paraNovoEntregador,
  validarEntregador,
  valoresParaEditar,
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

const BRUNO: DadosCompartilhados = {
  nome: 'Bruno Lima',
  cpf: '98765432100',
  telefone: '(61) 91000-0002',
  tipoVeiculo: 'CARRO',
  placa: 'XYZ9E87',
  disponivel: true,
};

describe('valoresParaEditar', () => {
  it.each([
    ['com placa', BRUNO, '61910000002', 'XYZ9E87'],
    ['sem placa', { ...BRUNO, tipoVeiculo: 'BICICLETA', placa: null }, '61910000002', ''],
  ])('preenche o formulário do entregador %s', (_caso, entregador, telefone, placa) => {
    expect(valoresParaEditar(entregador)).toMatchObject({ cpf: '98765432100', telefone, placa });
  });
});

describe('paraEdicaoDoEntregador', () => {
  it.each([
    ['moto', 'MOTO', { placa: 'ABC1D23' }],
    ['carro', 'CARRO', { placa: 'ABC1D23' }],
    ['bicicleta', 'BICICLETA', {}],
  ] as const)('monta a edição de %s com o nome sem espaços nas pontas', (_caso, tipoVeiculo, placa) => {
    expect(paraEdicaoDoEntregador({ ...VALIDO, tipoVeiculo })).toEqual({
      cpf: '52998224725',
      nome: 'Joana Lima',
      telefone: '61988887777',
      veiculo: tipoVeiculo,
      ...placa,
    });
  });
});

describe('entregadorEditado', () => {
  it.each([
    ['troca a placa', { placa: 'ABC1234' }, 'ABC1234'],
    ['mantém a placa antiga quando não manda placa', {}, 'XYZ9E87'],
  ])('%s', (_caso, placa, placaEsperada) => {
    const edicao = { cpf: BRUNO.cpf, nome: 'Bruno L.', telefone: '61999990000', veiculo: 'MOTO' as const, ...placa };

    expect(entregadorEditado(BRUNO, edicao)).toEqual({
      ...BRUNO,
      nome: 'Bruno L.',
      telefone: '61999990000',
      tipoVeiculo: 'MOTO',
      placa: placaEsperada,
    });
  });
});
