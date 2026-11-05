import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { PedidoAtivo } from '@/app/lib/tipos';
import ListaPedidosFinalizados from './ListaPedidosFinalizados';

const FINALIZADO: PedidoAtivo = {
  id: 7,
  recebedor: 'Marina Costa',
  entregador: 'Bruno Lima',
  status: 'FINALIZADO',
  criadoEm: '2026-10-07T13:00:00',
  valorEntrega: 1310,
  finalizadoEm: '2026-10-07T14:02:00',
  nota: 4,
};

describe('ListaPedidosFinalizados', () => {
  afterEach(cleanup);

  it.each([
    ['avaliado e concluído', FINALIZADO, ['R$ 13,10', '07/10, 14:02', '4 de 5']],
    ['sem avaliação', { ...FINALIZADO, nota: null }, ['R$ 13,10', '07/10, 14:02', 'Sem avaliação']],
    [
      'cancelado sem entregador',
      { ...FINALIZADO, status: 'CANCELADO', entregador: null, finalizadoEm: null, nota: null },
      ['Não atribuído', 'Não concluído', 'Sem avaliação'],
    ],
  ] as [string, PedidoAtivo, string[]][])('mostra o pedido %s', (_caso, pedido, textos) => {
    render(<ListaPedidosFinalizados pedidos={[pedido]} />);

    for (const texto of textos) {
      expect(screen.getAllByText(texto, { exact: false }).length).toBeGreaterThan(0);
    }
  });

  it('leva aos detalhes do pedido', () => {
    render(<ListaPedidosFinalizados pedidos={[FINALIZADO]} />);

    expect(screen.getAllByRole('link', { name: 'Ver detalhes' })[0].getAttribute('href')).toBe('/painel/pedidos/7');
  });
});
