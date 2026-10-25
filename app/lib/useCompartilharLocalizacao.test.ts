import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, consultarRotaDoPedido, registrarPosicao } from './api';
import type { VisaoDaEntrega } from './tipos';
import { useCompartilharLocalizacao } from './useCompartilharLocalizacao';

vi.mock('./api', async (original) => ({
  ...(await original<typeof import('./api')>()),
  consultarRotaDoPedido: vi.fn(),
  registrarPosicao: vi.fn(),
}));

const VISAO: VisaoDaEntrega = {
  status: 'EM_ANDAMENTO',
  exibirMapa: true,
  origem: { lat: -15.8059, lng: -47.8935 },
  destino: { lat: -15.8135, lng: -47.9046 },
  entregador: null,
  rota: null,
  distanciaRestanteM: null,
  duracaoRestanteS: null,
  estimado: true,
  atualizadaEm: null,
  entregadorProximo: false,
};

type Sucesso = (leitura: GeolocationPosition) => void;
type Falha = (erro: GeolocationPositionError) => void;

function leitura(lat: number, lng: number, accuracy = 10) {
  return { coords: { latitude: lat, longitude: lng, accuracy } } as GeolocationPosition;
}

let sucesso: Sucesso | null;
let falha: Falha | null;
const watchPosition = vi.fn((ok: Sucesso, erro: Falha) => {
  sucesso = ok;
  falha = erro;
  return 1;
});
const clearWatch = vi.fn();

describe('useCompartilharLocalizacao', () => {
  beforeEach(() => {
    sucesso = null;
    falha = null;
    window.localStorage.clear();
    vi.stubGlobal('navigator', { geolocation: { watchPosition, clearWatch } });
    vi.mocked(consultarRotaDoPedido).mockResolvedValue(VISAO);
    vi.mocked(registrarPosicao).mockResolvedValue({ ...VISAO, distanciaRestanteM: 4200, duracaoRestanteS: 780 });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('carrega o destino e só pede a localização depois do clique', async () => {
    const { result } = renderHook(() => useCompartilharLocalizacao(7, true));

    await waitFor(() => expect(result.current.visao).toEqual(VISAO));
    expect(result.current.estado).toBe('parado');
    expect(watchPosition).not.toHaveBeenCalled();

    act(() => result.current.iniciar());

    expect(result.current.estado).toBe('solicitando');
    expect(watchPosition).toHaveBeenCalledTimes(1);
  });

  it('envia a posição e mostra a distância devolvida pelo backend', async () => {
    const { result } = renderHook(() => useCompartilharLocalizacao(7, true));
    act(() => result.current.iniciar());

    act(() => sucesso!(leitura(-15.79, -47.88, 12)));

    expect(result.current.estado).toBe('compartilhando');
    expect(result.current.posicao).toEqual({ lat: -15.79, lng: -47.88 });
    expect(registrarPosicao).toHaveBeenCalledWith(7, { lat: -15.79, lng: -47.88, precisao: 12 });
    await waitFor(() => expect(result.current.visao?.distanciaRestanteM).toBe(4200));
  });

  it('não envia mais de uma posição a cada cinco segundos', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-15T12:00:00Z'));
    const { result } = renderHook(() => useCompartilharLocalizacao(7, true));
    act(() => result.current.iniciar());

    act(() => sucesso!(leitura(-15.79, -47.88)));
    vi.setSystemTime(new Date('2026-10-15T12:00:03Z'));
    act(() => sucesso!(leitura(-15.791, -47.881)));
    vi.setSystemTime(new Date('2026-10-15T12:00:05Z'));
    act(() => sucesso!(leitura(-15.792, -47.882)));

    expect(registrarPosicao).toHaveBeenCalledTimes(2);
    expect(result.current.posicao).toEqual({ lat: -15.792, lng: -47.882 });
  });

  it('para e explica quando a permissão é negada', () => {
    const { result } = renderHook(() => useCompartilharLocalizacao(7, true));
    act(() => result.current.iniciar());

    act(() => falha!({ code: 1 } as GeolocationPositionError));

    expect(result.current.estado).toBe('parado');
    expect(result.current.erro).toMatch(/negada/);
    expect(clearWatch).toHaveBeenCalledWith(1);
  });

  it('continua tentando quando o GPS demora', () => {
    const { result } = renderHook(() => useCompartilharLocalizacao(7, true));
    act(() => result.current.iniciar());

    act(() => falha!({ code: 3 } as GeolocationPositionError));

    expect(result.current.estado).toBe('solicitando');
    expect(result.current.erro).toMatch(/demorou/);
    expect(clearWatch).not.toHaveBeenCalled();
  });

  it('encerra quando o backend diz que a entrega acabou', async () => {
    vi.mocked(registrarPosicao).mockRejectedValue(new ApiError(409, 'encerrada'));
    const { result } = renderHook(() => useCompartilharLocalizacao(7, true));
    act(() => result.current.iniciar());

    act(() => sucesso!(leitura(-15.79, -47.88)));

    await waitFor(() => expect(result.current.estado).toBe('parado'));
    expect(result.current.erro).toMatch(/não está mais em andamento/);
  });

  it('avisa e segue compartilhando quando o envio falha por rede', async () => {
    vi.mocked(registrarPosicao).mockRejectedValue(new Error('rede'));
    const { result } = renderHook(() => useCompartilharLocalizacao(7, true));
    act(() => result.current.iniciar());

    act(() => sucesso!(leitura(-15.79, -47.88)));

    await waitFor(() => expect(result.current.erro).toMatch(/Tentando de novo/));
    expect(result.current.estado).toBe('compartilhando');
  });

  it('lembra a escolha e retoma ao voltar para a tela', () => {
    const primeira = renderHook(() => useCompartilharLocalizacao(7, true));
    act(() => primeira.result.current.iniciar());
    primeira.unmount();

    expect(clearWatch).toHaveBeenCalled();
    renderHook(() => useCompartilharLocalizacao(7, true));

    expect(watchPosition).toHaveBeenCalledTimes(2);
  });

  it('não compartilha com a entrega fora de andamento', () => {
    window.localStorage.setItem('vemvindo:compartilhar:7', '1');

    const { result } = renderHook(() => useCompartilharLocalizacao(7, false));

    expect(result.current.estado).toBe('parado');
    expect(watchPosition).not.toHaveBeenCalled();
    expect(window.localStorage.getItem('vemvindo:compartilhar:7')).toBeNull();
  });

  it('avisa quando o navegador não tem geolocalização', () => {
    vi.stubGlobal('navigator', {});
    const { result } = renderHook(() => useCompartilharLocalizacao(7, true));

    act(() => result.current.iniciar());

    expect(result.current.estado).toBe('parado');
    expect(result.current.erro).toMatch(/não permite/);
  });

  it('não busca a rota com a entrega fora de andamento', () => {
    renderHook(() => useCompartilharLocalizacao(7, false));
    expect(consultarRotaDoPedido).not.toHaveBeenCalled();
  });

  it('mantém a tela acesa enquanto compartilha e solta ao parar', async () => {
    const release = vi.fn().mockResolvedValue(undefined);
    const request = vi.fn().mockResolvedValue({ release });
    vi.stubGlobal('navigator', { geolocation: { watchPosition, clearWatch }, wakeLock: { request } });
    const { result } = renderHook(() => useCompartilharLocalizacao(7, true));

    act(() => result.current.iniciar());
    await waitFor(() => expect(request).toHaveBeenCalledWith('screen'));

    act(() => result.current.parar());
    await waitFor(() => expect(release).toHaveBeenCalled());
  });

  it('pede a trava de novo ao voltar para a aba', async () => {
    const request = vi.fn().mockResolvedValue({ release: vi.fn().mockResolvedValue(undefined) });
    vi.stubGlobal('navigator', { geolocation: { watchPosition, clearWatch }, wakeLock: { request } });
    const { result } = renderHook(() => useCompartilharLocalizacao(7, true));
    act(() => result.current.iniciar());
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1));

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
  });
});
