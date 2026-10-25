import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { listarAvaliacoes } from '@/app/lib/api';
import type { AvaliacaoDaEmpresa } from '@/app/lib/tipos';
import PaginaAvaliacoes from './page';

vi.mock('@/app/lib/api', async (original) => ({
  ...(await original<typeof import('@/app/lib/api')>()),
  listarAvaliacoes: vi.fn(),
}));

const AVALIACAO: AvaliacaoDaEmpresa = {
  idPedido: 7,
  nota: 4,
  comentario: 'Chegou certinho',
  data: '2026-10-20T15:00:00Z',
  entregador: 'Bruno Lima',
};

describe('PaginaAvaliacoes', () => {
  beforeEach(() => {
    vi.mocked(listarAvaliacoes).mockResolvedValue([AVALIACAO]);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('carrega as avaliações sem filtro ao abrir', async () => {
    render(<PaginaAvaliacoes />);

    expect(screen.getByText('Carregando avaliações...')).toBeTruthy();
    expect(await screen.findByText('Pedido #7')).toBeTruthy();
    expect(listarAvaliacoes).toHaveBeenCalledWith({ notas: [], de: '', ate: '' });
  });

  it('busca de novo quando a nota do filtro muda', async () => {
    render(<PaginaAvaliacoes />);
    await screen.findByText('Pedido #7');

    fireEvent.click(screen.getByRole('button', { name: 'Nota 5' }));

    expect(listarAvaliacoes).toHaveBeenLastCalledWith({ notas: [5], de: '', ate: '' });
  });

  it('não busca enquanto a data final vier antes da inicial', async () => {
    render(<PaginaAvaliacoes />);
    await screen.findByText('Pedido #7');

    fireEvent.change(screen.getByLabelText('De'), { target: { value: '2026-10-20' } });
    fireEvent.change(screen.getByLabelText('Até'), { target: { value: '2026-10-10' } });

    expect(screen.getByText('A data final precisa ser depois da inicial.')).toBeTruthy();
    expect(listarAvaliacoes).not.toHaveBeenCalledWith({ notas: [], de: '2026-10-20', ate: '2026-10-10' });
  });

  it('avisa quando não consegue carregar', async () => {
    vi.mocked(listarAvaliacoes).mockRejectedValue(new Error('rede'));

    render(<PaginaAvaliacoes />);

    expect((await screen.findByRole('alert')).textContent).toBe('Não foi possível carregar as avaliações agora.');
    expect(screen.queryByText('Carregando avaliações...')).toBeNull();
  });
});
