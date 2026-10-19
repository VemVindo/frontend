import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { consultarRotaDoPedido, listarPedidosDaEmpresa } from '@/app/lib/api';
import type { PedidoAtivo, VisaoDaEntrega } from '@/app/lib/tipos';
import DetalhePedidoPainel from './DetalhePedidoPainel';

vi.mock('@/app/lib/api', () => ({
  consultarRotaDoPedido: vi.fn(),
  listarPedidosDaEmpresa: vi.fn(),
}));
vi.mock('@/app/components/mapa/MapaEntrega', () => ({
  default: () => <div role="region" aria-label="Mapa da entrega" />,
}));

const PEDIDO: PedidoAtivo = {
  id: 7,
  recebedor: 'Pedro Alves',
  entregador: 'Carla Reis',
  status: 'EM_ANDAMENTO',
  criadoEm: '2026-10-15T11:30:00Z',
};

const VISAO: VisaoDaEntrega = {
  status: 'EM_ANDAMENTO',
  exibirMapa: true,
  origem: { lat: -15.8059, lng: -47.8935 },
  destino: { lat: -15.8135, lng: -47.9046 },
  entregador: null,
  rota: null,
  distanciaRestanteM: 1800,
  duracaoRestanteS: 300,
  estimado: true,
  atualizadaEm: null,
};

describe('DetalhePedidoPainel', () => {
  beforeEach(() => {
    vi.mocked(listarPedidosDaEmpresa).mockResolvedValue([PEDIDO]);
    vi.mocked(consultarRotaDoPedido).mockResolvedValue(VISAO);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('exibe o mapa, os dados do pedido e o botão para abrir o chat', async () => {
    render(<DetalhePedidoPainel idPedido={7} />);

    expect(await screen.findByRole('region', { name: 'Mapa da entrega' })).toBeTruthy();
    expect(screen.getByText('Pedro Alves')).toBeTruthy();
    expect(screen.getByText('Carla Reis')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Abrir chat' })).toBeTruthy();
    expect(consultarRotaDoPedido).toHaveBeenCalledWith(7);
  });

  it('não busca nem exibe o mapa antes de a entrega começar', async () => {
    vi.mocked(listarPedidosDaEmpresa).mockResolvedValue([{ ...PEDIDO, status: 'PENDENTE' }]);

    render(<DetalhePedidoPainel idPedido={7} />);

    expect(await screen.findByText('O mapa fica disponível com a entrega em andamento.')).toBeTruthy();
    expect(consultarRotaDoPedido).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Abrir chat' })).toBeTruthy();
  });

  it('informa quando o carregamento dos detalhes falha', async () => {
    vi.mocked(listarPedidosDaEmpresa).mockRejectedValue(new Error('falha de rede'));

    render(<DetalhePedidoPainel idPedido={7} />);

    const alerta = await screen.findByRole('alert');
    expect(alerta.textContent).toContain('Não foi possível carregar os detalhes do pedido agora.');
  });
});
