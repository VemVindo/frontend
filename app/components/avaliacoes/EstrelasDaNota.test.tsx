import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import EstrelasDaNota from './EstrelasDaNota';

describe('EstrelasDaNota', () => {
  afterEach(() => cleanup());

  it.each([0, 3, 5])('nota %i acende a mesma quantidade de estrelas', (nota) => {
    render(<EstrelasDaNota nota={nota} />);

    const estrelas = screen.getByRole('img', { name: `Nota ${nota} de 5` }).querySelectorAll('svg');
    const acesas = [...estrelas].filter((estrela) => estrela.classList.contains('text-primaria'));
    expect(estrelas).toHaveLength(5);
    expect(acesas).toHaveLength(nota);
  });
});
