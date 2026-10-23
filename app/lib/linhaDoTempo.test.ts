import { describe, expect, it } from 'vitest';
import { montarLinhaDoTempo } from './linhaDoTempo';

const CRIADO = { etapa: 'CRIADO', em: '2026-10-20T12:00:00Z' } as const;
const SAIU = { etapa: 'EM_ANDAMENTO', em: '2026-10-20T12:10:00Z' } as const;

describe('montarLinhaDoTempo', () => {
  it('pedido pendente: só a criação tem horário e é a etapa atual', () => {
    const passos = montarLinhaDoTempo([CRIADO], [], 'PENDENTE');

    expect(passos.map((p) => [p.rotulo, p.em, p.atual])).toEqual([
      ['Pedido criado', CRIADO.em, true],
      ['Saiu para entrega', null, false],
      ['Entregue', null, false],
    ]);
  });

  it('em andamento marca a saída para entrega como atual', () => {
    const passos = montarLinhaDoTempo([CRIADO, SAIU], [], 'EM_ANDAMENTO');

    expect(passos[1]).toEqual({ etapa: 'EM_ANDAMENTO', rotulo: 'Saiu para entrega', em: SAIU.em, atual: true });
  });

  it('completa com o horário que chegou pelo tempo real', () => {
    const passos = montarLinhaDoTempo(
      [CRIADO, SAIU],
      [{ etapa: 'FINALIZADO', em: '2026-10-20T12:40:00Z' }],
      'FINALIZADO',
    );

    expect(passos[2]).toEqual({ etapa: 'FINALIZADO', rotulo: 'Entregue', em: '2026-10-20T12:40:00Z', atual: true });
  });

  it('o horário do servidor prevalece sobre o do tempo real', () => {
    const passos = montarLinhaDoTempo([CRIADO, SAIU], [{ etapa: 'EM_ANDAMENTO', em: 'depois' }], 'EM_ANDAMENTO');

    expect(passos[1].em).toBe(SAIU.em);
  });

  it('cancelado antes de sair mostra só a criação e o cancelamento', () => {
    const passos = montarLinhaDoTempo([CRIADO], [{ etapa: 'CANCELADO', em: '2026-10-20T12:05:00Z' }], 'CANCELADO');

    expect(passos.map((p) => p.rotulo)).toEqual(['Pedido criado', 'Cancelado']);
    expect(passos[1].atual).toBe(true);
  });

  it('cancelado depois de sair mantém a saída para entrega', () => {
    const passos = montarLinhaDoTempo([CRIADO, SAIU], [], 'CANCELADO');

    expect(passos.map((p) => p.rotulo)).toEqual(['Pedido criado', 'Saiu para entrega', 'Cancelado']);
  });
});
