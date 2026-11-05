import { describe, expect, it } from 'vitest';
import { filtrarPorConclusao, periodoDeConclusaoInvalido } from './finalizados';
import type { PedidoAtivo } from './tipos';

function pedido(id: number, finalizadoEm: string | null): PedidoAtivo {
  return {
    id,
    recebedor: 'Marina Costa',
    entregador: 'Bruno Lima',
    status: finalizadoEm ? 'FINALIZADO' : 'CANCELADO',
    criadoEm: '2026-10-01T10:00:00',
    valorEntrega: 1310,
    finalizadoEm,
    nota: null,
  };
}

const PEDIDOS = [
  pedido(1, '2026-10-05T09:00:00'),
  pedido(2, '2026-10-10T23:30:00'),
  pedido(3, '2026-10-20T00:15:00'),
  pedido(4, null),
];

describe('filtrarPorConclusao', () => {
  it.each([
    ['sem período', '', '', [1, 2, 3, 4]],
    ['só com a data inicial', '2026-10-10', '', [2, 3]],
    ['só com a data final', '', '2026-10-10', [1, 2]],
    ['com as duas datas', '2026-10-06', '2026-10-19', [2]],
    ['com o mesmo dia nas duas datas', '2026-10-20', '2026-10-20', [3]],
    ['sem nenhum pedido no período', '2026-11-01', '2026-11-30', []],
  ])('filtra %s', (_caso, de, ate, idsEsperados) => {
    const filtrados = filtrarPorConclusao(PEDIDOS, { de, ate });

    expect(filtrados.map((atual) => atual.id)).toEqual(idsEsperados);
  });
});

describe('periodoDeConclusaoInvalido', () => {
  it.each([
    ['', '', false],
    ['2026-10-10', '', false],
    ['', '2026-10-10', false],
    ['2026-10-10', '2026-10-10', false],
    ['2026-10-01', '2026-10-10', false],
    ['2026-10-10', '2026-10-01', true],
  ])('de "%s" até "%s" é inválido: %s', (de, ate, esperado) => {
    expect(periodoDeConclusaoInvalido({ de, ate })).toBe(esperado);
  });
});
