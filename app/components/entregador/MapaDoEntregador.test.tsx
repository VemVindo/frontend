import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PedidoDoEntregador, VisaoDaEntrega } from '@/app/lib/tipos';
import { useCompartilharLocalizacao } from '@/app/lib/useCompartilharLocalizacao';
import MapaDoEntregador from './MapaDoEntregador';

vi.mock('@/app/lib/useCompartilharLocalizacao', () => ({ useCompartilharLocalizacao: vi.fn() }));
vi.mock('@/app/components/mapa/MapaEntrega', () => ({
  default: (props: { rotuloDestino: string; nomeOrigem: string; sobreposicao?: React.ReactNode }) => (
    <div data-testid="mapa" data-rotulo={props.rotuloDestino} data-origem={props.nomeOrigem}>
      {props.sobreposicao}
    </div>
  ),
}));

const PEDIDO: PedidoDoEntregador = {
  id: 7,
  status: 'EM_ANDAMENTO',
  empresa: 'Padaria Pao Quente',
  recebedor: 'Pedro Alves',
  endereco: 'SQS 308 Bloco C, 101 - Asa Sul, Brasilia/DF',
  valorEntrega: 1070,
  distancia: 1800,
  criadoEm: '2026-10-15T11:30:00Z',
  iniciadoEm: '2026-10-15T11:35:00Z',
  finalizadoEm: null,
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
  entregadorProximo: false,
};

const iniciar = vi.fn();
const parar = vi.fn();

function estado(parcial: Partial<ReturnType<typeof useCompartilharLocalizacao>> = {}) {
  vi.mocked(useCompartilharLocalizacao).mockReturnValue({
    estado: 'parado',
    erro: null,
    posicao: null,
    visao: VISAO,
    iniciar,
    parar,
    ...parcial,
  });
}

describe('MapaDoEntregador', () => {
  beforeEach(() => estado());

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('só compartilha depois do clique do entregador', () => {
    render(<MapaDoEntregador pedido={PEDIDO} />);

    expect(screen.getByText('Localização não compartilhada.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Compartilhar localização' }));

    expect(iniciar).toHaveBeenCalledTimes(1);
    expect(useCompartilharLocalizacao).toHaveBeenCalledWith(7, true);
  });

  it('mostra o estado, a estimativa e o botão de parar ao compartilhar', () => {
    estado({ estado: 'compartilhando' });

    render(<MapaDoEntregador pedido={PEDIDO} />);

    expect(screen.getByRole('status').textContent).toMatch(/Compartilhando/);
    expect(screen.getByText('1,8 km')).toBeTruthy();
    expect(screen.getByText('5 min · 1,8 km restantes')).toBeTruthy();
    expect(screen.getByText(/linha reta/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Parar de compartilhar' }));
    expect(parar).toHaveBeenCalledTimes(1);
  });

  it('no mapa da entregadora, o destino leva o primeiro nome do recebedor', () => {
    render(<MapaDoEntregador pedido={PEDIDO} />);

    const mapa = screen.getByTestId('mapa');
    expect(mapa.getAttribute('data-rotulo')).toBe('Pedro');
    expect(mapa.getAttribute('data-origem')).toBe('Padaria Pao Quente');
  });

  it('abre a navegação do Google Maps pela coordenada do destino', () => {
    render(<MapaDoEntregador pedido={PEDIDO} />);

    const link = screen.getByRole('link', { name: 'Abrir no Google Maps' });
    expect(link.getAttribute('href')).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=-15.8135%2C-47.9046',
    );
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('mostra o erro de localização', () => {
    estado({ erro: 'A permissão de localização foi negada.' });

    render(<MapaDoEntregador pedido={PEDIDO} />);

    expect(screen.getByRole('alert').textContent).toBe('A permissão de localização foi negada.');
  });

  it('fora de andamento não mostra mapa nem botão', () => {
    render(<MapaDoEntregador pedido={{ ...PEDIDO, status: 'FINALIZADO' }} />);

    expect(useCompartilharLocalizacao).toHaveBeenCalledWith(7, false);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByTestId('mapa')).toBeNull();
  });
});
