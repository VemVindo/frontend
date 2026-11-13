import { describe, expect, it } from 'vitest';
import { somenteLetras, somenteValorEmReais } from './entrada';

describe('somenteLetras', () => {
  it.each([
    ['Carla Menezes', 'Carla Menezes'],
    ["Maria d'Ávila", "Maria d'Ávila"],
    ['Embu-Guaçu', 'Embu-Guaçu'],
    ['J. P. Souza', 'J. P. Souza'],
    ['Pedro2 Alves!', 'Pedro Alves'],
    ['123', ''],
  ])('%s vira %s', (entrada, esperado) => {
    expect(somenteLetras(entrada)).toBe(esperado);
  });
});

describe('somenteValorEmReais', () => {
  it.each([
    ['8,50', '8,50'],
    ['8.5', '8,5'],
    ['R$ 12', '12'],
    ['-3', '3'],
    ['abc', ''],
    ['8,509', '8,50'],
    ['1,2,3', '1,23'],
    ['1234567', '12345'],
    ['10,', '10,'],
  ])('%s vira %s', (entrada, esperado) => {
    expect(somenteValorEmReais(entrada)).toBe(esperado);
  });
});
