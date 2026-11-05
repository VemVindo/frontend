import { describe, expect, it } from 'vitest';
import {
  ENTREGADOR_VAZIO,
  normalizarPlaca,
  paraNovoEntregador,
  validarEntregador,
  type ValoresDoEntregador,
} from './entregadores';

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
