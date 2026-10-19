import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, atualizarConfiguracoes, buscarConfiguracoes } from '@/app/lib/api';
import PaginaConfiguracoes from './page';

vi.mock('@/app/lib/api', async (original) => ({
  ...(await original<typeof import('@/app/lib/api')>()),
  buscarConfiguracoes: vi.fn(),
  atualizarConfiguracoes: vi.fn(),
}));

describe('PaginaConfiguracoes', () => {
  beforeEach(() => {
    vi.mocked(buscarConfiguracoes).mockResolvedValue({ exibirMapa: true });
    vi.mocked(atualizarConfiguracoes).mockResolvedValue({ exibirMapa: false });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('desliga o mapa do recebedor', async () => {
    render(<PaginaConfiguracoes />);
    const interruptor = await screen.findByRole('switch', { name: 'Exibir o mapa ao recebedor' });
    expect(interruptor.getAttribute('aria-checked')).toBe('true');

    fireEvent.click(interruptor);

    expect(atualizarConfiguracoes).toHaveBeenCalledWith({ exibirMapa: false });
    expect(await screen.findByText(/só o tempo estimado/)).toBeTruthy();
    expect(interruptor.getAttribute('aria-checked')).toBe('false');
  });

  it('mostra o erro do backend sem mudar o interruptor', async () => {
    vi.mocked(atualizarConfiguracoes).mockRejectedValue(new ApiError(403, 'Acesso negado para o perfil atual'));
    render(<PaginaConfiguracoes />);
    const interruptor = await screen.findByRole('switch');

    fireEvent.click(interruptor);

    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByText('Acesso negado para o perfil atual')).toBeTruthy();
    expect(interruptor.getAttribute('aria-checked')).toBe('true');
  });

  it('avisa quando não consegue carregar', async () => {
    vi.mocked(buscarConfiguracoes).mockRejectedValue(new Error('rede'));

    render(<PaginaConfiguracoes />);

    expect(await screen.findByText('Não foi possível carregar as configurações.')).toBeTruthy();
    expect(screen.queryByRole('switch')).toBeNull();
  });
});
