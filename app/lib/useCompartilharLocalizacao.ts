'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, consultarRotaDoPedido, registrarPosicao } from '@/app/lib/api';
import { deveEnviarPosicao, mensagemDeErroDeLocalizacao } from '@/app/lib/mapa';
import type { Coordenada, VisaoDaEntrega } from '@/app/lib/tipos';

export type EstadoCompartilhamento = 'parado' | 'solicitando' | 'compartilhando';

const OPCOES_GPS: PositionOptions = { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 };

const PERMISSAO_NEGADA = 1;

function chaveDoPedido(idPedido: number) {
  return `vemvindo:compartilhar:${idPedido}`;
}

// Lembra a escolha do entregador: ao voltar para a tela, o compartilhamento
// recomeça sem pedir o clique de novo (a permissão do navegador já foi dada).
function lerEscolha(idPedido: number): boolean {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem(chaveDoPedido(idPedido)) === '1';
  } catch {
    return false;
  }
}

function gravarEscolha(idPedido: number, ligado: boolean) {
  try {
    if (ligado) window.localStorage.setItem(chaveDoPedido(idPedido), '1');
    else window.localStorage.removeItem(chaveDoPedido(idPedido));
  } catch {
    // Sem armazenamento local: só não lembra a escolha.
  }
}

// EN-US02: a posição só é enviada depois do clique do entregador (que dispara o
// pedido de permissão do navegador) e só com a entrega em andamento.
export function useCompartilharLocalizacao(idPedido: number, emAndamento: boolean) {
  const [ligado, setLigado] = useState(() => lerEscolha(idPedido));
  const [estado, setEstado] = useState<EstadoCompartilhamento>(() => (lerEscolha(idPedido) ? 'solicitando' : 'parado'));
  const [erro, setErro] = useState<string | null>(null);
  const [posicao, setPosicao] = useState<Coordenada | null>(null);
  const [visao, setVisao] = useState<VisaoDaEntrega | null>(null);
  const ultimoEnvio = useRef<number | null>(null);

  // Só com a entrega em andamento: fora dela o mapa nem é mostrado.
  useEffect(() => {
    if (!emAndamento) return;
    let cancelado = false;
    consultarRotaDoPedido(idPedido)
      .then((resposta) => {
        if (!cancelado) setVisao(resposta);
      })
      .catch(() => {
        // Sem a rota inicial o mapa só espera a primeira posição.
      });
    return () => {
      cancelado = true;
    };
  }, [idPedido, emAndamento]);

  const parar = useCallback(
    (mensagem: string | null = null) => {
      setLigado(false);
      setEstado('parado');
      setErro(mensagem);
      gravarEscolha(idPedido, false);
    },
    [idPedido],
  );

  const iniciar = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setErro('Este navegador não permite compartilhar a localização.');
      return;
    }
    setErro(null);
    setEstado('solicitando');
    setLigado(true);
    gravarEscolha(idPedido, true);
  }, [idPedido]);

  const ativo = ligado && emAndamento;

  useEffect(() => {
    if (!ativo || typeof navigator === 'undefined' || !navigator.geolocation) return;
    let cancelado = false;

    const id = navigator.geolocation.watchPosition(
      (leitura) => {
        if (cancelado) return;
        const coordenada = { lat: leitura.coords.latitude, lng: leitura.coords.longitude };
        setPosicao(coordenada);
        setEstado('compartilhando');

        const agora = Date.now();
        if (!deveEnviarPosicao(ultimoEnvio.current, agora)) return;
        ultimoEnvio.current = agora;
        registrarPosicao(idPedido, { ...coordenada, precisao: leitura.coords.accuracy })
          .then((resposta) => {
            if (cancelado) return;
            setVisao(resposta);
            setErro(null);
          })
          .catch((falha: unknown) => {
            if (cancelado) return;
            if (falha instanceof ApiError && (falha.status === 404 || falha.status === 409)) {
              parar('A entrega não está mais em andamento; o compartilhamento foi encerrado.');
            } else {
              setErro('Não foi possível enviar a localização agora. Tentando de novo.');
            }
          });
      },
      (falha) => {
        if (cancelado) return;
        if (falha.code === PERMISSAO_NEGADA) {
          parar(mensagemDeErroDeLocalizacao(falha.code));
        } else {
          setErro(mensagemDeErroDeLocalizacao(falha.code));
        }
      },
      OPCOES_GPS,
    );

    return () => {
      cancelado = true;
      navigator.geolocation.clearWatch(id);
    };
  }, [ativo, idPedido, parar]);

  // Com a tela apagada o navegador para de entregar posições; o Wake Lock
  // mantém a tela acesa enquanto o compartilhamento está ligado. Ao voltar
  // para a aba, o navegador solta a trava e ela é pedida de novo.
  useEffect(() => {
    if (!ativo || typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;
    let cancelado = false;
    let trava: WakeLockSentinel | null = null;

    function travarTela() {
      navigator.wakeLock
        .request('screen')
        .then((nova) => {
          if (cancelado) void nova.release();
          else trava = nova;
        })
        .catch(() => {
          // Bateria fraca ou aba em segundo plano: segue sem a trava.
        });
    }
    function aoVoltarParaAba() {
      if (document.visibilityState === 'visible') travarTela();
    }

    travarTela();
    document.addEventListener('visibilitychange', aoVoltarParaAba);
    return () => {
      cancelado = true;
      document.removeEventListener('visibilitychange', aoVoltarParaAba);
      void trava?.release().catch(() => undefined);
    };
  }, [ativo]);

  // Entrega encerrada: a escolha lembrada deixa de valer.
  useEffect(() => {
    if (!emAndamento) gravarEscolha(idPedido, false);
  }, [emAndamento, idPedido]);

  return {
    estado: emAndamento ? estado : 'parado',
    erro,
    posicao,
    visao,
    iniciar,
    parar: () => parar(null),
  };
}
