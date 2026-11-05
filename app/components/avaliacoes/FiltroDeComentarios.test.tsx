import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import FiltroDeComentarios from './FiltroDeComentarios';

describe('FiltroDeComentarios', () => {
  afterEach(() => cleanup());

  it.each([
    ['Nota 1', { notas: [2], de: '', ate: '' }, { notas: [1, 2], de: '', ate: '' }],
    ['Nota 2', { notas: [1, 2], de: '', ate: '' }, { notas: [1], de: '', ate: '' }],
    ['Todas', { notas: [1, 2], de: '', ate: '' }, { notas: [], de: '', ate: '' }],
  ])('clicar em "%s" muda o filtro', (botao, filtro, esperado) => {
    const onAlterar = vi.fn();
    render(<FiltroDeComentarios filtro={filtro} onAlterar={onAlterar} />);

    fireEvent.click(screen.getByRole('button', { name: botao }));

    expect(onAlterar).toHaveBeenCalledWith(esperado);
  });

  it('avisa quando a data final vem antes da inicial', () => {
    render(<FiltroDeComentarios filtro={{ notas: [], de: '2026-10-21', ate: '2026-10-20' }} onAlterar={vi.fn()} />);

    expect(screen.getByText('A data final precisa ser depois da inicial.')).toBeTruthy();
  });
});
