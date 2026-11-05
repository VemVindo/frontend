import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import CampoTexto from './CampoTexto';

afterEach(cleanup);

describe('CampoTexto: compatibilidade entre formulários e modal', () => {
  it.each(['padrao', 'modal'] as const)('preserva a reserva de descrição na aparência %s', (aparencia) => {
    const { container } = render(<CampoTexto rotulo="Campo de teste" reservarEspacoDescricao aparencia={aparencia} />);
    expect(container.querySelector('span[aria-hidden="true"]')).not.toBeNull();
    expect(screen.getByLabelText('Campo de teste').className).toContain(aparencia === 'modal' ? 'h-9' : 'h-10');
    expect(screen.getByLabelText('Campo de teste').hasAttribute('reservarespacodescricao')).toBe(false);
    expect(screen.getByLabelText('Campo de teste').hasAttribute('aparencia')).toBe(false);
  });

  it('mantém a aparência padrão e não reserva espaço sem solicitação', () => {
    const { container } = render(<CampoTexto rotulo="Campo padrão" />);
    expect(screen.getByLabelText('Campo padrão').className).toContain('h-10');
    expect(container.querySelector('span[aria-hidden="true"]')).toBeNull();
  });
});
