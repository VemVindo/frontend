import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TEMPO_DO_AVISO_MS } from '@/app/lib/avisos';
import AvisoFlutuante from './AvisoFlutuante';

describe('AvisoFlutuante', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it.each([
    ['Seu pedido saiu para entrega!', true],
    [null, false],
  ])('com o texto %s mostra a caixa: %s', (texto, aparece) => {
    render(<AvisoFlutuante texto={texto} onFechar={vi.fn()} />);

    expect(screen.queryByRole('button', { name: 'Fechar aviso' }) !== null).toBe(aparece);
  });

  it.each([
    [TEMPO_DO_AVISO_MS - 1, 0],
    [TEMPO_DO_AVISO_MS, 1],
  ])('depois de %d ms fechou %d vez', (tempo, vezes) => {
    const onFechar = vi.fn();
    render(<AvisoFlutuante texto="Seu pedido saiu para entrega!" onFechar={onFechar} />);

    act(() => {
      vi.advanceTimersByTime(tempo);
    });

    expect(onFechar).toHaveBeenCalledTimes(vezes);
  });

  it('fecha pelo botão', () => {
    const onFechar = vi.fn();
    render(<AvisoFlutuante texto="Seu pedido saiu para entrega!" onFechar={onFechar} />);

    fireEvent.click(screen.getByRole('button', { name: 'Fechar aviso' }));

    expect(onFechar).toHaveBeenCalledTimes(1);
  });
});
