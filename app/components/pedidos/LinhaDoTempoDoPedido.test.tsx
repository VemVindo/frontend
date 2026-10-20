import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import LinhaDoTempoDoPedido from './LinhaDoTempoDoPedido';

describe('LinhaDoTempoDoPedido', () => {
  afterEach(cleanup);

  it('mostra o horário das etapas alcançadas e marca a atual', () => {
    render(
      <LinhaDoTempoDoPedido
        passos={[
          { etapa: 'CRIADO', rotulo: 'Pedido criado', em: '2026-10-20T12:00:00Z', atual: false },
          { etapa: 'EM_ANDAMENTO', rotulo: 'Saiu para entrega', em: '2026-10-20T12:10:00Z', atual: true },
          { etapa: 'FINALIZADO', rotulo: 'Entregue', em: null, atual: false },
        ]}
      />,
    );

    const itens = screen.getAllByRole('listitem');
    expect(itens).toHaveLength(3);
    expect(itens[1].getAttribute('aria-current')).toBe('step');
    expect(itens[0].querySelector('time')?.getAttribute('dateTime')).toBe('2026-10-20T12:00:00Z');
    expect(itens[2].textContent).toContain('Aguardando');
  });
});
