import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, finalizarPedido } from '@/app/lib/api';
import FinalizarComCodigo from './FinalizarComCodigo';

vi.mock('@/app/lib/api', async (original) => ({
  ...(await original<typeof import('@/app/lib/api')>()),
  finalizarPedido: vi.fn(),
}));

function abrirEDigitar(codigo: string) {
  fireEvent.click(screen.getByRole('button', { name: 'Finalizar entrega' }));
  fireEvent.change(screen.getByLabelText('Código do recebedor'), { target: { value: codigo } });
}

function botaoFinalizar() {
  return screen.getByRole('button', { name: 'Finalizar' }) as HTMLButtonElement;
}

describe('FinalizarComCodigo', () => {
  beforeEach(() => {
    vi.mocked(finalizarPedido).mockResolvedValue({
      id: 7,
      recebedor: 'Carla',
      entregador: 'Bruno Lima',
      status: 'FINALIZADO',
      criadoEm: '2026-10-22T12:00:00-03:00',
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('só libera o envio com os 6 números e descarta o que não é número', () => {
    render(<FinalizarComCodigo idPedido={7} onFinalizado={vi.fn()} />);

    abrirEDigitar('48a29');
    expect((screen.getByLabelText('Código do recebedor') as HTMLInputElement).value).toBe('4829');
    expect(botaoFinalizar().disabled).toBe(true);

    fireEvent.change(screen.getByLabelText('Código do recebedor'), { target: { value: '482913' } });
    expect(botaoFinalizar().disabled).toBe(false);
  });

  it('envia o código e avisa que a entrega foi finalizada', async () => {
    const onFinalizado = vi.fn();
    render(<FinalizarComCodigo idPedido={7} onFinalizado={onFinalizado} />);

    abrirEDigitar('482913');
    fireEvent.click(botaoFinalizar());

    await vi.waitFor(() => expect(onFinalizado).toHaveBeenCalled());
    expect(finalizarPedido).toHaveBeenCalledWith(7, '482913');
  });

  it('mostra quantas tentativas restam quando o código está errado', async () => {
    vi.mocked(finalizarPedido).mockRejectedValue(
      new ApiError(422, 'Código incorreto', { message: 'Código incorreto', tentativasRestantes: 2 }),
    );
    const onFinalizado = vi.fn();
    render(<FinalizarComCodigo idPedido={7} onFinalizado={onFinalizado} />);

    abrirEDigitar('000000');
    fireEvent.click(botaoFinalizar());

    expect(await screen.findByText('Código incorreto. Restam 2 tentativas.')).toBeTruthy();
    expect((screen.getByLabelText('Código do recebedor') as HTMLInputElement).value).toBe('');
    expect(onFinalizado).not.toHaveBeenCalled();
  });

  it('avisa quando as tentativas acabaram', async () => {
    vi.mocked(finalizarPedido).mockRejectedValue(
      new ApiError(422, 'Código incorreto', { message: 'Código incorreto', tentativasRestantes: 0 }),
    );
    render(<FinalizarComCodigo idPedido={7} onFinalizado={vi.fn()} />);

    abrirEDigitar('000000');
    fireEvent.click(botaoFinalizar());

    expect(await screen.findByText('Código incorreto. As tentativas acabaram, espere alguns minutos.')).toBeTruthy();
  });

  it('mostra quando libera de novo depois de muitas tentativas', async () => {
    const liberaEm = new Date(2026, 9, 22, 15, 30).toISOString();
    vi.mocked(finalizarPedido).mockRejectedValue(
      new ApiError(429, 'Muitas tentativas erradas. Tente de novo mais tarde', { liberaEm }),
    );
    render(<FinalizarComCodigo idPedido={7} onFinalizado={vi.fn()} />);

    abrirEDigitar('000000');
    fireEvent.click(botaoFinalizar());

    expect((await screen.findByText(/Muitas tentativas erradas/)).textContent).toContain('Libera às 15:30');
  });

  it('volta ao botão sem enviar nada', () => {
    render(<FinalizarComCodigo idPedido={7} onFinalizado={vi.fn()} />);

    abrirEDigitar('482913');
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));

    expect(screen.getByRole('button', { name: 'Finalizar entrega' })).toBeTruthy();
    expect(finalizarPedido).not.toHaveBeenCalled();
  });
});
