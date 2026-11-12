import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { consultarResumoDashboard, listarAvaliacoes, listarFrota, listarPedidosDaEmpresa } from '@/app/lib/api';
import type { DadosCompartilhados, PedidoAtivo } from '@/app/lib/tipos';
import type { ResumoDoDashboard } from '@/app/lib/tiposDashboard';
import PaginaDashboard from './page';

vi.mock('@/app/lib/api', async (original) => ({
  ...(await original<typeof import('@/app/lib/api')>()),
  consultarResumoDashboard: vi.fn(),
  listarAvaliacoes: vi.fn(),
  listarFrota: vi.fn(),
  listarPedidosDaEmpresa: vi.fn(),
}));

const pedido: PedidoAtivo = {
  id: 4830,
  recebedor: 'Carla Menezes',
  entregador: null,
  status: 'PENDENTE',
  criadoEm: new Date(Date.now() - 8 * 60_000).toISOString(),
  valorEntrega: 1500,
  finalizadoEm: null,
  nota: null,
};

const pedidoDeCincoDias: PedidoAtivo = {
  ...pedido,
  id: 4831,
  recebedor: 'Rafael Nunes',
  criadoEm: new Date(Date.now() - 5 * 24 * 60 * 60_000).toISOString(),
};

const pedidoDeQuinzeDias: PedidoAtivo = {
  ...pedido,
  id: 4832,
  recebedor: 'João Pereira',
  criadoEm: new Date(Date.now() - 15 * 24 * 60 * 60_000).toISOString(),
};

const pedidoDeTrintaECincoDias: PedidoAtivo = {
  ...pedido,
  id: 4833,
  recebedor: 'Thiago Andrade',
  criadoEm: new Date(Date.now() - 35 * 24 * 60 * 60_000).toISOString(),
};

const entregador: DadosCompartilhados = {
  nome: 'Marcos Vinícius',
  cpf: '12345678901',
  telefone: '61999990000',
  tipoVeiculo: 'MOTO',
  placa: 'ABC1234',
  disponivel: true,
};

const resumoDashboard: ResumoDoDashboard = {
  idEmpresa: 1,
  totalPedidos: 15,
  totalPedidosPendentes: 3,
  totalPedidosAndamento: 2,
  totalPedidosConcluidos: 10,
  totalPedidosCancelados: 0,
  mediaAvaliacoes: 4.5,
  tempoMedioEntregaMinutos: 30,
  totalDistanciaPercorrida: 12000,
  relatorioPorEntregador: [
    {
      cpf: entregador.cpf,
      nome: entregador.nome,
      totalPedidosAndamento: 2,
      totalPedidosConcluidos: 10,
      valorMedioEntrega: 1500,
      totalPago: 18000,
    },
  ],
};

beforeEach(() => {
  vi.mocked(consultarResumoDashboard).mockResolvedValue(resumoDashboard);
  vi.mocked(listarPedidosDaEmpresa).mockResolvedValue([pedido]);
  vi.mocked(listarFrota).mockResolvedValue([entregador]);
  vi.mocked(listarAvaliacoes).mockResolvedValue([
    {
      idPedido: 4820,
      nota: 5,
      comentario: 'Entrega rápida.',
      data: new Date(Date.now() - 60 * 60_000).toISOString(),
      entregador: entregador.nome,
    },
  ]);
});

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe('Dashboard', () => {
  it('mostra dados existentes e direciona os atalhos para pedidos e frota', async () => {
    render(<PaginaDashboard />);

    expect(await screen.findByText('Carla Menezes')).toBeTruthy();
    expect(await screen.findByRole('heading', { name: /10 entregas concluídas em 7 dias/ })).toBeTruthy();
    expect(screen.getByText('30 min')).toBeTruthy();
    expect(await screen.findByText(/R\$\s?180,00 pagos/)).toBeTruthy();
    const linksVerTodos = screen.getAllByRole('link', { name: 'Ver todos →' });
    expect(linksVerTodos.map((link) => link.getAttribute('href'))).toEqual(['/painel/pedidos', '/painel/frota']);
    expect(consultarResumoDashboard).toHaveBeenCalledWith(
      expect.objectContaining({ dataInicio: expect.any(String), dataFinal: expect.any(String) }),
    );
  });

  it('filtra pedidos pendentes pelo período selecionado', async () => {
    vi.mocked(listarPedidosDaEmpresa).mockResolvedValue([
      pedido,
      pedidoDeCincoDias,
      pedidoDeQuinzeDias,
      pedidoDeTrintaECincoDias,
    ]);

    render(<PaginaDashboard />);

    expect(await screen.findByText('Carla Menezes')).toBeTruthy();
    expect(screen.getByText('Rafael Nunes')).toBeTruthy();
    expect(screen.queryByText('João Pereira')).toBeNull();
    expect(screen.queryByText('Thiago Andrade')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Hoje' }));
    expect(screen.getByText('Carla Menezes')).toBeTruthy();
    expect(screen.queryByText('Rafael Nunes')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '30 dias' }));
    expect(screen.getByText('Carla Menezes')).toBeTruthy();
    expect(screen.getByText('Rafael Nunes')).toBeTruthy();
    expect(screen.getByText('João Pereira')).toBeTruthy();
    expect(screen.queryByText('Thiago Andrade')).toBeNull();
  });
});
