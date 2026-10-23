import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { io } from 'socket.io-client';
import { API_URL, buscarLocalizacaoDoRastreio } from './api';
import type { VisaoDaEntrega } from './tipos';
import { useRastreioTempoReal } from './useRastreioTempoReal';

vi.mock('socket.io-client', () => ({ io: vi.fn() }));
vi.mock('./api', async (original) => ({
  ...(await original<typeof import('./api')>()),
  buscarLocalizacaoDoRastreio: vi.fn(),
}));

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

type Ouvinte = (...argumentos: unknown[]) => void;

function socketFalso() {
  const ouvintes = new Map<string, Ouvinte>();
  return {
    ouvintes,
    on: vi.fn((evento: string, ouvinte: Ouvinte) => ouvintes.set(evento, ouvinte)),
    removeAllListeners: vi.fn(),
    disconnect: vi.fn(),
    disparar(evento: string, ...argumentos: unknown[]) {
      act(() => ouvintes.get(evento)?.(...argumentos));
    },
  };
}

describe('useRastreioTempoReal', () => {
  let socket: ReturnType<typeof socketFalso>;

  beforeEach(() => {
    socket = socketFalso();
    vi.mocked(io).mockReturnValue(socket as never);
    vi.mocked(buscarLocalizacaoDoRastreio).mockResolvedValue(VISAO);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('não conecta enquanto o rastreio não está ativo', () => {
    renderHook(() => useRastreioTempoReal('token', false));
    expect(io).not.toHaveBeenCalled();
  });

  it('entra no namespace com o token e busca a posição ao conectar', async () => {
    const { result } = renderHook(() => useRastreioTempoReal('token-do-link', true));

    expect(io).toHaveBeenCalledWith(`${API_URL}/rastreio`, { auth: { token: 'token-do-link' } });
    expect(result.current.conexao).toBe('conectando');

    socket.disparar('connect');

    expect(result.current.conexao).toBe('conectado');
    expect(buscarLocalizacaoDoRastreio).toHaveBeenCalledWith('token-do-link');
    await waitFor(() => expect(result.current.visao).toEqual(VISAO));
  });

  it('atualiza a posição e o status pelos eventos', () => {
    const { result } = renderHook(() => useRastreioTempoReal('token', true));

    socket.disparar('localizacao', { ...VISAO, distanciaRestanteM: 900 });
    expect(result.current.visao?.distanciaRestanteM).toBe(900);
    expect(result.current.status).toBe('EM_ANDAMENTO');

    socket.disparar('status', { status: 'FINALIZADO' });
    expect(result.current.status).toBe('FINALIZADO');
  });

  it('guarda o horário de cada mudança de status para a linha do tempo', () => {
    const { result } = renderHook(() => useRastreioTempoReal('token', true));

    socket.disparar('status', { status: 'FINALIZADO', em: '2026-10-20T12:40:00Z' });

    expect(result.current.marcos).toEqual([{ etapa: 'FINALIZADO', em: '2026-10-20T12:40:00Z' }]);
  });

  it('mostra reconexão quando a rede cai e encerra quando o backend fecha', () => {
    const { result } = renderHook(() => useRastreioTempoReal('token', true));

    socket.disparar('disconnect', 'transport close');
    expect(result.current.conexao).toBe('reconectando');

    socket.disparar('connect_error');
    expect(result.current.conexao).toBe('reconectando');

    socket.disparar('disconnect', 'io server disconnect');
    expect(result.current.conexao).toBe('encerrado');
  });

  it('guarda o motivo quando o link é recusado', () => {
    const { result } = renderHook(() => useRastreioTempoReal('token', true));

    socket.disparar('acesso-negado', { situacao: 'encerrado' });

    expect(result.current.acessoNegado).toBe('encerrado');
  });

  it('desconecta ao sair da tela', () => {
    const { unmount } = renderHook(() => useRastreioTempoReal('token', true));

    unmount();

    expect(socket.removeAllListeners).toHaveBeenCalled();
    expect(socket.disconnect).toHaveBeenCalled();
  });
});
