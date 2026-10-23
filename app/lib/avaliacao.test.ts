import { describe, expect, it } from 'vitest';
import { comentarioParaEnviar, rotuloDaNota } from './avaliacao';

describe('rotuloDaNota', () => {
  it.each([
    [null, 'Toque nas estrelas para avaliar'],
    [0, 'Péssimo'],
    [1, 'Ruim'],
    [2, 'Regular'],
    [3, 'Bom'],
    [4, 'Muito bom'],
    [5, 'Excelente!'],
  ])('nota %s mostra "%s"', (nota, rotulo) => {
    expect(rotuloDaNota(nota)).toBe(rotulo);
  });
});

describe('comentarioParaEnviar', () => {
  it.each([
    ['', null],
    ['   ', null],
    ['Muito rapido', 'Muito rapido'],
    ['  Chegou certinho  ', 'Chegou certinho'],
  ])('"%s" vira %j', (texto, esperado) => {
    expect(comentarioParaEnviar(texto)).toBe(esperado);
  });
});
