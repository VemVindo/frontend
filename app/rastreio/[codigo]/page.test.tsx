import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, buscarRastreio } from '@/app/lib/api';
import type { PaginaDoRecebedor, VisaoDaEntrega } from '@/app/lib/tipos';
import { useRastreioTempoReal } from '@/app/lib/useRastreioTempoReal';
import PaginaRastreio from './page';

vi.mock('next/navigation', () => ({ useParams: () => ({ codigo: 'token-do-link' }) }));
vi.mock('@/app/lib/api', async (original) => ({
  ...(await original<typeof import('@/app/lib/api')>()),
  buscarRastreio: vi.fn(),
}));
vi.mock('@/app/lib/useRastreioTempoReal', () => ({ useRastreioTempoReal: vi.fn() }));

const PAGINA: PaginaDoRecebedor = {
  estabelecimento: 'Padaria Pao Quente',
  exibirMapa: true,
  pedido: {
    numero: 4,
    descricao: 'Cesta de cafe da manha',
    recebedor: 'Pedro Alves',
    status: 'EM_ANDAMENTO',
    criadoEm: '2026-10-15T11:30:00Z',
    endereco: {
      logradouro: 'SQS 308 Bloco C',
      numero: 101,
      complemento: 'Apto 101',
      bairro: 'Asa Sul',
      cidade: 'Brasilia',
      uf: 'DF',
      cep: '70297400',
    },
  },
  entregador: 'Marcos',
  codigoRecebedor: '012345',
  whatsappEstabelecimento: 'https://wa.me/556133334444?text=Ol%C3%A1',
};

const VISAO: VisaoDaEntrega = {
  status: 'EM_ANDAMENTO',
  exibirMapa: true,
  origem: { lat: -15.8059, lng: -47.8935 },
  destino: { lat: -15.8135, lng: -47.9046 },
  entregador: { lat: -15.79, lng: -47.88, precisaoM: 10 },
  rota: null,
  distanciaRestanteM: 4200,
  duracaoRestanteS: 780,
  estimado: false,
  atualizadaEm: '2026-10-15T12:00:00Z',
};

function tempoReal(parcial: Partial<ReturnType<typeof useRastreioTempoReal>> = {}) {
  vi.mocked(useRastreioTempoReal).mockReturnValue({
    visao: VISAO,
    status: null,
    conexao: 'conectado',
    acessoNegado: null,
    ...parcial,
  });
}

describe('PaginaRastreio', () => {
  beforeEach(() => {
    vi.mocked(buscarRastreio).mockResolvedValue(PAGINA);
    tempoReal();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('mostra estabelecimento, mapa, distância, chegada e código', async () => {
    render(<PaginaRastreio />);

    expect(await screen.findByText('Padaria Pao Quente')).toBeTruthy();
    expect(buscarRastreio).toHaveBeenCalledWith('token-do-link');
    expect(useRastreioTempoReal).toHaveBeenLastCalledWith('token-do-link', true);
    expect(screen.getByText(/Mapa indisponível/)).toBeTruthy();
    expect(screen.getByText('13 min · 4,2 km restantes')).toBeTruthy();
    expect(screen.queryByText(/linha reta/)).toBeNull();
    expect(screen.getByText('012345')).toBeTruthy();
    expect(
      screen.getByRole('link', { name: 'Falar com o estabelecimento no WhatsApp' }).getAttribute('href'),
    ).toBe(PAGINA.whatsappEstabelecimento);
    expect(screen.getByText('Atualizando em tempo real.')).toBeTruthy();
    expect(screen.getByText(/processado pelo Google Maps/)).toBeTruthy();
  });

  it('com o mapa desligado mostra só o tempo estimado', async () => {
    tempoReal({ visao: { ...VISAO, exibirMapa: false, destino: null, entregador: null } });

    render(<PaginaRastreio />);

    expect(await screen.findByText('Acompanhe seu pedido mesmo sem o mapa.')).toBeTruthy();
    expect(screen.queryByText(/Mapa indisponível/)).toBeNull();
    // Variantes mobile e desktop do Figma ficam no DOM; o CSS mostra uma.
    expect(screen.getAllByText('13 min')).toHaveLength(2);
    expect(screen.getByText('Marcos está a caminho do seu endereço · 4,2 km restantes')).toBeTruthy();
    expect(screen.getByText('Marcos está a caminho · 4,2 km restantes')).toBeTruthy();
    expect(screen.getByText('para chegar ao seu endereço')).toBeTruthy();
  });

  it('sem entregador nomeado e sem estimativa ainda, avisa que aguarda a posição', async () => {
    vi.mocked(buscarRastreio).mockResolvedValue({ ...PAGINA, entregador: null, exibirMapa: false });
    tempoReal({ visao: { ...VISAO, exibirMapa: false, distanciaRestanteM: null, duracaoRestanteS: null } });

    render(<PaginaRastreio />);

    expect(await screen.findByText('Aguardando a localização do entregador.')).toBeTruthy();
  });

  it('marca a estimativa em linha reta embaixo do mapa', async () => {
    tempoReal({ visao: { ...VISAO, estimado: true } });

    render(<PaginaRastreio />);

    expect(await screen.findByText('Estimativa aproximada, calculada em linha reta.')).toBeTruthy();
  });

  it('antes de sair para entrega não carrega o mapa', async () => {
    vi.mocked(buscarRastreio).mockResolvedValue({ ...PAGINA, pedido: { ...PAGINA.pedido, status: 'PENDENTE' } });
    tempoReal({ visao: { ...VISAO, status: 'PENDENTE', entregador: null, distanciaRestanteM: null, duracaoRestanteS: null } });

    render(<PaginaRastreio />);

    expect(await screen.findByText('O pedido ainda não saiu para entrega.')).toBeTruthy();
    expect(screen.queryByText(/Mapa indisponível/)).toBeNull();
  });

  it('esconde o código quando o link foi revogado ou a entrega acabou', async () => {
    tempoReal({ acessoNegado: 'encerrado' });

    render(<PaginaRastreio />);

    expect(await screen.findByText('Entrega encerrada')).toBeTruthy();
    expect(screen.queryByText('012345')).toBeNull();
  });

  it('link revogado pela empresa vira link inválido', async () => {
    tempoReal({ acessoNegado: 'invalido' });

    render(<PaginaRastreio />);

    expect(await screen.findByText('Link de rastreio inválido')).toBeTruthy();
    expect(screen.queryByText('012345')).toBeNull();
  });

  it('avisa a conexão instável', async () => {
    tempoReal({ conexao: 'reconectando' });

    render(<PaginaRastreio />);

    expect(await screen.findByText(/Conexão instável/)).toBeTruthy();
  });

  it('troca o mapa pelo aviso de entrega encerrada quando o status muda', async () => {
    tempoReal({ status: 'FINALIZADO' });

    render(<PaginaRastreio />);

    expect(await screen.findByText('Entrega encerrada')).toBeTruthy();
    expect(screen.queryByText(/Mapa indisponível/)).toBeNull();
    expect(screen.queryByText('Atualizando em tempo real.')).toBeNull();
    expect(screen.queryByText('Código de recebimento')).toBeNull();
    expect(screen.queryByText('012345')).toBeNull();
    expect(screen.queryByRole('link', { name: /WhatsApp/ })).toBeNull();
  });

  it.each([
    [404, 'Link de rastreio inválido'],
    [410, 'Entrega encerrada'],
    [500, 'Não foi possível carregar o rastreio'],
  ])('trata a resposta %s do backend', async (status, titulo) => {
    vi.mocked(buscarRastreio).mockRejectedValue(new ApiError(status, 'erro'));

    render(<PaginaRastreio />);

    expect(await screen.findByText(titulo)).toBeTruthy();
    expect(useRastreioTempoReal).toHaveBeenLastCalledWith('token-do-link', false);
  });
});
