import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { AvaliacaoDaEmpresa } from '@/app/lib/tipos';
import ListaDeComentarios from './ListaDeComentarios';

const AVALIACAO: AvaliacaoDaEmpresa = {
  idPedido: 7,
  nota: 4,
  comentario: 'Chegou certinho',
  data: '2026-10-20T15:00:00Z',
  entregador: 'Bruno Lima',
};

describe('ListaDeComentarios', () => {
  afterEach(() => cleanup());

  it('mostra nota, comentario, entregador, pedido e data', () => {
    render(<ListaDeComentarios avaliacoes={[AVALIACAO]} />);

    expect(screen.getByRole('img', { name: 'Nota 4 de 5' })).toBeTruthy();
    expect(screen.getByText('"Chegou certinho"')).toBeTruthy();
    expect(screen.getByText('Bruno Lima')).toBeTruthy();
    expect(screen.getByText('Pedido #7')).toBeTruthy();
  });

  it.each([
    ['sem comentario', { comentario: null }, 'Sem comentário escrito.'],
    ['sem entregador', { entregador: null }, 'Entregador não informado'],
  ])('%s mostra "%s"', (_caso, mudanca, texto) => {
    render(<ListaDeComentarios avaliacoes={[{ ...AVALIACAO, ...mudanca }]} />);

    expect(screen.getByText(texto)).toBeTruthy();
  });

  it('avisa quando a lista esta vazia', () => {
    render(<ListaDeComentarios avaliacoes={[]} />);

    expect(screen.getByText('Nenhuma avaliação encontrada com esses filtros.')).toBeTruthy();
  });
});
