import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, gerarLinkDeRastreio } from '@/app/lib/api';
import LinkDeRastreio from './LinkDeRastreio';

vi.mock('@/app/lib/api', async (original) => ({
  ...(await original<typeof import('@/app/lib/api')>()),
  gerarLinkDeRastreio: vi.fn(),
}));

const LINK = { link: 'http://localhost:3000/rastreio/token-de-teste', codigoRecebedor: '012345' };

describe('LinkDeRastreio', () => {
  const writeText = vi.fn();

  beforeEach(() => {
    vi.mocked(gerarLinkDeRastreio).mockResolvedValue(LINK);
    writeText.mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('pede confirmação antes de gerar, porque o link anterior deixa de valer', async () => {
    render(<LinkDeRastreio idPedido={7} />);

    fireEvent.click(screen.getByRole('button', { name: 'Gerar link de rastreio' }));

    expect(screen.getByText(/para de funcionar/)).toBeTruthy();
    expect(gerarLinkDeRastreio).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByText(/para de funcionar/)).toBeNull();
  });

  it('gera, mostra o link e o código e copia', async () => {
    render(<LinkDeRastreio idPedido={7} />);
    fireEvent.click(screen.getByRole('button', { name: 'Gerar link de rastreio' }));
    fireEvent.click(screen.getByRole('button', { name: 'Gerar link' }));

    const campo = await screen.findByRole('textbox', { name: 'Link de rastreio' });
    expect(gerarLinkDeRastreio).toHaveBeenCalledWith(7);
    expect((campo as HTMLInputElement).value).toBe(LINK.link);
    expect(screen.getByText('012345')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Gerar outro link' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Copiar link' }));

    expect(await screen.findByText('Link copiado.')).toBeTruthy();
    expect(writeText).toHaveBeenCalledWith(LINK.link);
  });

  it('sem acesso à área de transferência, seleciona o link para copiar à mão', async () => {
    writeText.mockRejectedValue(new Error('negado'));
    render(<LinkDeRastreio idPedido={7} />);
    fireEvent.click(screen.getByRole('button', { name: 'Gerar link de rastreio' }));
    fireEvent.click(screen.getByRole('button', { name: 'Gerar link' }));
    await screen.findByRole('textbox', { name: 'Link de rastreio' });

    fireEvent.click(screen.getByRole('button', { name: 'Copiar link' }));

    expect(await screen.findByText(/use Ctrl\+C/)).toBeTruthy();
  });

  it('mostra a recusa do backend para pedido encerrado', async () => {
    vi.mocked(gerarLinkDeRastreio).mockRejectedValue(
      new ApiError(409, 'Pedido encerrado: o rastreio nao fica mais disponivel'),
    );
    render(<LinkDeRastreio idPedido={7} />);
    fireEvent.click(screen.getByRole('button', { name: 'Gerar link de rastreio' }));
    fireEvent.click(screen.getByRole('button', { name: 'Gerar link' }));

    expect((await screen.findByRole('alert')).textContent).toMatch(/Pedido encerrado/);
    expect(screen.queryByRole('textbox')).toBeNull();
  });
});
