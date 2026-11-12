import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, listarHistoricoDeEntregadores } from '@/app/lib/api';
import type { TrocaDeEntregador } from '@/app/lib/tipos';
import HistoricoEntregadores from './HistoricoEntregadores';

vi.mock('@/app/lib/api', async (original) => ({
  ...(await original<typeof import('@/app/lib/api')>()),
  listarHistoricoDeEntregadores: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('HistoricoEntregadores', () => {
  it('mostra o carregamento enquanto o histórico não chega', () => {
    vi.mocked(listarHistoricoDeEntregadores).mockReturnValue(new Promise(() => {}));

    render(<HistoricoEntregadores idPedido={6} />);

    expect(screen.getByText('Carregando histórico...')).toBeTruthy();
    expect(listarHistoricoDeEntregadores).toHaveBeenCalledWith(6);
  });

  it('avisa quando o pedido ainda não teve entregador', async () => {
    vi.mocked(listarHistoricoDeEntregadores).mockResolvedValue([]);

    render(<HistoricoEntregadores idPedido={6} />);

    expect(await screen.findByText('O pedido ainda não teve entregador.')).toBeTruthy();
  });

  it('lista a primeira atribuição e as trocas, sem descrição no cabeçalho', async () => {
    const trocas: TrocaDeEntregador[] = [
      { anterior: null, novo: 'Carla Reis', data: '2026-11-11T22:06:00Z' },
      { anterior: 'Carla Reis', novo: 'Bruno Lima', data: '2026-11-11T22:30:00Z' },
    ];
    vi.mocked(listarHistoricoDeEntregadores).mockResolvedValue(trocas);

    render(<HistoricoEntregadores idPedido={6} />);

    const itens = await screen.findAllByRole('listitem');
    expect(itens).toHaveLength(2);
    expect(itens[0].textContent).toMatch(/Atribuído a Carla Reis/);
    expect(itens[1].textContent).toMatch(/Carla Reis para Bruno Lima/);
    expect(screen.queryByText(/Cada atribuição/)).toBeNull();
  });

  it.each([
    [new ApiError(404, 'Não encontrado'), 'Pedido não encontrado no seu estabelecimento.'],
    [new ApiError(500, 'Erro'), 'Não foi possível carregar o histórico agora.'],
    [new Error('rede caiu'), 'Não foi possível carregar o histórico agora.'],
  ])('mostra o erro adequado quando a busca falha (%s)', async (falha, mensagem) => {
    vi.mocked(listarHistoricoDeEntregadores).mockRejectedValue(falha);

    render(<HistoricoEntregadores idPedido={6} />);

    expect((await screen.findByRole('alert')).textContent).toBe(mensagem);
  });

  it.each([
    ['chega', (busca: PromiseWithResolvers<TrocaDeEntregador[]>) => busca.resolve([])],
    ['falha', (busca: PromiseWithResolvers<TrocaDeEntregador[]>) => busca.reject(new Error('falha'))],
  ])('ignora a resposta que %s depois de sair da tela', async (_, responder) => {
    const busca = Promise.withResolvers<TrocaDeEntregador[]>();
    vi.mocked(listarHistoricoDeEntregadores).mockReturnValue(busca.promise);
    const erroNoConsole = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { unmount } = render(<HistoricoEntregadores idPedido={6} />);

    unmount();
    responder(busca);
    await busca.promise.catch(() => undefined);
    await new Promise((resolver) => setTimeout(resolver, 0));

    expect(erroNoConsole).not.toHaveBeenCalled();
    erroNoConsole.mockRestore();
  });
});
