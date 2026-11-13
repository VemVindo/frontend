import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import Etiqueta from './Etiqueta';

afterEach(cleanup);

describe('Etiqueta', () => {
  it('não quebra a linha nem encolhe quando divide espaço com um texto longo', () => {
    render(<Etiqueta>Em andamento</Etiqueta>);

    const classes = screen.getByText('Em andamento').className;
    expect(classes).toContain('whitespace-nowrap');
    expect(classes).toContain('shrink-0');
  });
});
