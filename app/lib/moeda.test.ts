import { describe, expect, it } from 'vitest';
import { centavosParaReais, reaisParaCentavos } from './moeda';

describe('reaisParaCentavos', () => {
  it.each([
    ['8', 800],
    ['8,5', 850],
    ['8,50', 850],
    ['8.50', 850],
    [' 1,15 ', 115],
    ['0,29', 29],
    ['0', 0],
  ])('converte "%s" em %i centavos', (texto, centavos) => {
    expect(reaisParaCentavos(texto)).toBe(centavos);
  });

  it.each(['', 'abc', '-1', '1,005', '1.000,00', '8,', ',5'])('recusa "%s"', (texto) => {
    expect(reaisParaCentavos(texto)).toBeNull();
  });
});

describe('centavosParaReais', () => {
  it.each([
    [800, '8,00'],
    [150, '1,50'],
    [5, '0,05'],
    [123456, '1234,56'],
  ])('mostra %i centavos como "%s"', (centavos, texto) => {
    expect(centavosParaReais(centavos)).toBe(texto);
  });
});
