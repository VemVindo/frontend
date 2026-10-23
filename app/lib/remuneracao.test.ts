import { describe, expect, it } from 'vitest';
import { paraParametros, paraValores, validarValorEmReais, validarValores } from './remuneracao';

describe('validarValorEmReais', () => {
  it.each([
    ['', 'Preencha este campo'],
    ['   ', 'Preencha este campo'],
    ['-3', 'O valor precisa ser positivo'],
    ['abc', 'Use só números, por exemplo 8,50'],
    ['1,005', 'Use só números, por exemplo 8,50'],
    ['0', 'O valor precisa ser maior que zero'],
    ['0,00', 'O valor precisa ser maior que zero'],
  ])('com "%s" avisa "%s"', (texto, mensagem) => {
    expect(validarValorEmReais(texto)).toBe(mensagem);
  });

  it.each(['8', '8,50', '0,01', '1.5'])('aceita "%s"', (texto) => {
    expect(validarValorEmReais(texto)).toBeUndefined();
  });
});

describe('validarValores', () => {
  it('aponta o erro de cada campo invalido', () => {
    expect(validarValores({ taxaFixa: '-1', coeficienteKm: '' })).toEqual({
      taxaFixa: 'O valor precisa ser positivo',
      coeficienteKm: 'Preencha este campo',
    });
  });

  it('nao aponta erro quando os dois campos estao certos', () => {
    expect(validarValores({ taxaFixa: '8', coeficienteKm: '1,5' })).toEqual({});
  });
});

describe('conversao entre formulario e parametros', () => {
  it('mostra os centavos como reais no formulario', () => {
    expect(paraValores({ taxaFixa: 800, coeficienteKm: 150 })).toEqual({
      taxaFixa: '8,00',
      coeficienteKm: '1,50',
    });
  });

  it('deixa o formulario vazio quando a empresa ainda nao salvou parametros', () => {
    expect(paraValores({ taxaFixa: null, coeficienteKm: null })).toEqual({ taxaFixa: '', coeficienteKm: '' });
  });

  it('envia o que foi digitado em centavos', () => {
    expect(paraParametros({ taxaFixa: '9,5', coeficienteKm: '2.1' })).toEqual({
      taxaFixa: 950,
      coeficienteKm: 210,
    });
  });
});
