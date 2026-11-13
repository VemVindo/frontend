import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TELA_PEDIDOS } from '@/app/lib/rotas';
import PaginaDetalheDoPedido from './page';

vi.mock('@/app/components/pedidos/DetalhePedidoPainel', () => ({ default: () => null }));
vi.mock('@/app/components/pedidos/HistoricoEntregadores', () => ({ default: () => null }));
vi.mock('@/app/components/pedidos/LinkDeRastreio', () => ({ default: () => null }));

afterEach(cleanup);

describe('PaginaDetalheDoPedido', () => {
  it('oferece voltar para os pedidos ativos no topo e no fim da página', async () => {
    render(await PaginaDetalheDoPedido({ params: Promise.resolve({ id: '6' }) } as PageProps<'/painel/pedidos/[id]'>));

    const voltar = screen.getAllByRole('link', { name: 'Voltar para os pedidos ativos' });
    expect(voltar).toHaveLength(2);
    for (const link of voltar) expect(link.getAttribute('href')).toBe(TELA_PEDIDOS);
    expect(screen.getByRole('heading', { name: 'Pedido #6' })).toBeTruthy();
  });
});
