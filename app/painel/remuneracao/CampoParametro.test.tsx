import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CampoParametro from './CampoParametro';

afterEach(cleanup);

describe('CampoParametro', () => {
  it.each([
    ['8.50', '8,50'],
    ['R$ 9,999', '9,99'],
    ['dez', ''],
  ])('ao digitar %s, guarda %s', (digitado, guardado) => {
    const onChange = vi.fn();
    render(<CampoParametro id="taxa" rotulo="Valor base" descricao="Por entrega" valor="" onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Valor base'), { target: { value: digitado } });

    expect(onChange).toHaveBeenCalledWith(guardado);
  });
});
