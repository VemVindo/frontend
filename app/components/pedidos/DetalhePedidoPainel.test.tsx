import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buscarDetalheDoPedido, consultarRotaDoPedido } from '@/app/lib/api';
import type { DetalheDoPedido, VisaoDaEntrega } from '@/app/lib/tipos';
import DetalhePedidoPainel, { INTERVALO_ATUALIZACAO_MS } from './DetalhePedidoPainel';

vi.mock('@/app/components/pedidos/BotaoWhatsapp', () => ({
  default: ({ idPedido, com }: { idPedido: number; com: string }) => <a href="#">{`WhatsApp ${com} ${idPedido}`}</a>,
}));
vi.mock('@/app/lib/api', () => ({
  buscarDetalheDoPedido: vi.fn(),
  consultarRotaDoPedido: vi.fn(),
}));
vi.mock('@/app/components/mapa/MapaEntrega', () => ({
  default: ({ rotuloDestino }: { rotuloDestino: string }) => (
    <div role="region" aria-label="Mapa da entrega">
      {rotuloDestino}
    </div>
  ),
}));

const PEDIDO: DetalheDoPedido = {
  id: 7,
  status: 'EM_ANDAMENTO',
  descricao: 'Cesta de cafe da manha',
  recebedor: { nome: 'Pedro Alves', telefone: '61920000001' },
  endereco: {
    cep: '70297400',
    logradouro: 'SQS 308 Bloco C',
    numero: 101,
    complemento: null,
    bairro: 'Asa Sul',
    cidade: 'Brasilia',
    uf: 'DF',
  },
  entregador: 'Carla Reis',
  valorEntrega: 1250,
  distancia: 4200,
  criadoEm: '2026-10-15T11:30:00Z',
  linhaDoTempo: [
    { etapa: 'CRIADO', em: '2026-10-15T11:30:00Z' },
    { etapa: 'EM_ANDAMENTO', em: '2026-10-15T11:45:00Z' },
  ],
};

const VISAO: VisaoDaEntrega = {
  status: 'EM_ANDAMENTO',
  exibirMapa: false,
  origem: { lat: -15.8059, lng: -47.8935 },
  destino: { lat: -15.8135, lng: -47.9046 },
  entregador: { lat: -15.81, lng: -47.9, precisaoM: 10 },
  rota: null,
  distanciaRestanteM: 1800,
  duracaoRestanteS: 420,
  estimado: false,
  atualizadaEm: '2026-10-15T12:00:00Z',
  entregadorProximo: false,
};

describe('DetalhePedidoPainel', () => {
  beforeEach(() => {
    vi.mocked(buscarDetalheDoPedido).mockResolvedValue(PEDIDO);
    vi.mocked(consultarRotaDoPedido).mockResolvedValue(VISAO);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('mostra recebedor, endereço, entregador, valor, andamento e conversas', async () => {
    render(<DetalhePedidoPainel idPedido={7} />);

    expect(await screen.findByText('Pedro Alves')).toBeTruthy();
    expect(screen.getByText('(61) 92000-0001')).toBeTruthy();
    expect(screen.getByText(/SQS 308 Bloco C, 101/)).toBeTruthy();
    expect(screen.getByText('Carla Reis')).toBeTruthy();
    expect(screen.getByText(/4,2 km/)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'WhatsApp entregador 7' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'WhatsApp recebedor 7' })).toBeTruthy();
    const andamento = screen.getByRole('list', { name: 'Andamento do pedido' });
    expect(andamento.querySelector('[aria-current="step"]')?.textContent).toContain('Saiu para entrega');
  });

  it('em andamento mostra o mapa e a chegada, mesmo com o mapa do recebedor desligado', async () => {
    render(<DetalhePedidoPainel idPedido={7} />);

    expect((await screen.findByRole('region', { name: 'Mapa da entrega' })).textContent).toBe('Pedro');
    expect(screen.getByText('Chegada prevista')).toBeTruthy();
  });

  it('fora de andamento não busca o mapa e só oferece conversa com o recebedor', async () => {
    vi.mocked(buscarDetalheDoPedido).mockResolvedValue({
      ...PEDIDO,
      status: 'PENDENTE',
      entregador: null,
    });
    render(<DetalhePedidoPainel idPedido={7} />);

    expect(await screen.findByText(/O mapa fica disponível/)).toBeTruthy();
    expect(screen.getByText('Não atribuído')).toBeTruthy();
    expect(consultarRotaDoPedido).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'WhatsApp recebedor 7' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'WhatsApp entregador 7' })).toBeNull();
  });

  it('com o pedido encerrado não oferece conversa', async () => {
    vi.mocked(buscarDetalheDoPedido).mockResolvedValue({ ...PEDIDO, status: 'FINALIZADO' });
    render(<DetalhePedidoPainel idPedido={7} />);

    expect(await screen.findByText('Pedro Alves')).toBeTruthy();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('atualiza o mapa e o detalhe periodicamente durante a entrega', async () => {
    vi.useFakeTimers();
    render(<DetalhePedidoPainel idPedido={7} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(consultarRotaDoPedido).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(INTERVALO_ATUALIZACAO_MS);
    });

    expect(consultarRotaDoPedido).toHaveBeenCalledTimes(2);
  });

  it('avisa quando o mapa não carrega', async () => {
    vi.mocked(consultarRotaDoPedido).mockRejectedValue(new Error('falha'));
    render(<DetalhePedidoPainel idPedido={7} />);

    expect((await screen.findByRole('alert')).textContent).toContain('mapa');
  });

  it('avisa quando o pedido não carrega', async () => {
    vi.mocked(buscarDetalheDoPedido).mockRejectedValue(new Error('falha'));
    render(<DetalhePedidoPainel idPedido={7} />);

    expect((await screen.findByRole('alert')).textContent).toContain('detalhes do pedido');
  });
});
