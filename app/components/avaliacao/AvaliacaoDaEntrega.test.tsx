import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { consultarAvaliacao, enviarComentario, enviarNota } from '@/app/lib/api';
import type { AvaliacaoDoRecebedor, SituacaoDaAvaliacao } from '@/app/lib/tipos';
import AvaliacaoDaEntrega from './AvaliacaoDaEntrega';

vi.mock('@/app/lib/api', async (original) => ({
  ...(await original<typeof import('@/app/lib/api')>()),
  consultarAvaliacao: vi.fn(),
  enviarNota: vi.fn(),
  enviarComentario: vi.fn(),
}));

function resposta(situacao: SituacaoDaAvaliacao, comentario: string | null = null): AvaliacaoDoRecebedor {
  const avaliado = situacao === 'avaliado';
  return {
    situacao,
    avaliacao: avaliado ? { nota: 4, comentario, data: '2026-10-22T15:00:00Z' } : null,
  };
}

describe('AvaliacaoDaEntrega', () => {
  beforeEach(() => {
    vi.mocked(enviarNota).mockResolvedValue(resposta('avaliado'));
    vi.mocked(enviarComentario).mockResolvedValue(resposta('avaliado', 'Rapido'));
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it.each([
    ['disponivel', 'Pedido entregue!'],
    ['avaliado', 'Avaliação enviada!'],
    ['expirada', 'O prazo para avaliar esta entrega terminou.'],
    ['indisponivel', 'Entregas canceladas não podem ser avaliadas.'],
  ] as const)('com a situacao %s mostra "%s"', async (situacao, texto) => {
    vi.mocked(consultarAvaliacao).mockResolvedValue(resposta(situacao));

    render(<AvaliacaoDaEntrega token="abc" />);

    expect(await screen.findByText(texto)).toBeTruthy();
  });

  it('so mostra o comentario depois de escolher a nota', async () => {
    vi.mocked(consultarAvaliacao).mockResolvedValue(resposta('disponivel'));
    render(<AvaliacaoDaEntrega token="abc" />);
    await screen.findByText('Pedido entregue!');

    expect(screen.queryByLabelText('Quer contar mais alguma coisa? (opcional)')).toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: '4 de 5 estrelas' }));
    expect(screen.getByLabelText('Quer contar mais alguma coisa? (opcional)')).toBeTruthy();
  });

  it.each([
    ['sem comentario', '', false],
    ['com comentario', '  Rapido  ', true],
  ])('envia a nota %s', async (_caso, texto, enviaComentario) => {
    vi.mocked(consultarAvaliacao).mockResolvedValue(resposta('disponivel'));
    render(<AvaliacaoDaEntrega token="abc" />);
    await screen.findByText('Pedido entregue!');

    fireEvent.click(screen.getByRole('radio', { name: '4 de 5 estrelas' }));
    fireEvent.change(screen.getByLabelText('Quer contar mais alguma coisa? (opcional)'), { target: { value: texto } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar avaliação' }));

    expect(await screen.findByText('Avaliação enviada!')).toBeTruthy();
    expect(enviarNota).toHaveBeenCalledWith('abc', 4);
    if (enviaComentario) {
      expect(enviarComentario).toHaveBeenCalledWith('abc', 'Rapido');
    } else {
      expect(enviarComentario).not.toHaveBeenCalled();
    }
  });

  it('aceita nota 0', async () => {
    vi.mocked(consultarAvaliacao).mockResolvedValue(resposta('disponivel'));
    render(<AvaliacaoDaEntrega token="abc" />);
    await screen.findByText('Pedido entregue!');

    fireEvent.click(screen.getByRole('radio', { name: 'Nenhuma estrela (nota 0)' }));
    fireEvent.click(screen.getByRole('button', { name: 'Enviar avaliação' }));

    await screen.findByText('Avaliação enviada!');
    expect(enviarNota).toHaveBeenCalledWith('abc', 0);
  });
});
