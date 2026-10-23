import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import FiltroDePeriodo from './FiltroDePeriodo';

describe('FiltroDePeriodo', () => {
  afterEach(cleanup);

  it.each([
    ['Concluído de', { de: '2026-10-05', ate: '' }],
    ['Até', { de: '', ate: '2026-10-05' }],
  ])('avisa a página quando muda o campo "%s"', (rotulo, esperado) => {
    const onAlterar = vi.fn();
    render(<FiltroDePeriodo periodo={{ de: '', ate: '' }} onAlterar={onAlterar} />);

    fireEvent.change(screen.getByLabelText(rotulo), { target: { value: '2026-10-05' } });

    expect(onAlterar).toHaveBeenCalledWith(esperado);
  });

  it.each([
    ['2026-10-10', '2026-10-01', true],
    ['2026-10-01', '2026-10-10', false],
  ])('com de %s e até %s mostra o erro: %s', (de, ate, temErro) => {
    render(<FiltroDePeriodo periodo={{ de, ate }} onAlterar={vi.fn()} />);

    expect(screen.queryByText('A data final precisa ser depois da inicial.') !== null).toBe(temErro);
  });
});
