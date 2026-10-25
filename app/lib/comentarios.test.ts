import { describe, expect, it } from 'vitest';
import { alternarNota, consultaDasAvaliacoes, periodoInvalido } from './comentarios';

describe('alternarNota', () => {
  it.each([
    [[], 2, [2]],
    [[2], 1, [1, 2]],
    [[1, 2], 2, [1]],
    [[0, 5], 0, [5]],
  ])('em %j, clicar na nota %i deixa %j', (notas, nota, esperado) => {
    expect(alternarNota(notas, nota)).toEqual(esperado);
  });
});

describe('periodoInvalido', () => {
  it.each([
    ['', '', false],
    ['2026-10-01', '', false],
    ['', '2026-10-20', false],
    ['2026-10-01', '2026-10-20', false],
    ['2026-10-20', '2026-10-20', false],
    ['2026-10-21', '2026-10-20', true],
  ])('de "%s" ate "%s" e invalido: %s', (de, ate, invalido) => {
    expect(periodoInvalido({ notas: [], de, ate })).toBe(invalido);
  });
});

describe('consultaDasAvaliacoes', () => {
  const inicioDoDia = new Date('2026-10-01T00:00:00').toISOString();
  const fimDoDia = new Date('2026-10-20T23:59:59.999').toISOString();

  it.each([
    ['sem filtro', { notas: [], de: '', ate: '' }, ''],
    ['so notas', { notas: [1, 2], de: '', ate: '' }, '?notas=1%2C2'],
    ['nota zero', { notas: [0], de: '', ate: '' }, '?notas=0'],
    ['so inicio', { notas: [], de: '2026-10-01', ate: '' }, `?de=${encodeURIComponent(inicioDoDia)}`],
    [
      'tudo junto',
      { notas: [5], de: '2026-10-01', ate: '2026-10-20' },
      `?notas=5&de=${encodeURIComponent(inicioDoDia)}&ate=${encodeURIComponent(fimDoDia)}`,
    ],
  ])('%s', (_caso, filtro, esperado) => {
    expect(consultaDasAvaliacoes(filtro)).toBe(esperado);
  });
});
