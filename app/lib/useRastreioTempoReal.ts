'use client';

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { API_URL, buscarLocalizacaoDoRastreio } from '@/app/lib/api';
import type { MarcoDoPedido, StatusPedido, VisaoDaEntrega } from '@/app/lib/tipos';

export type EstadoConexao = 'conectando' | 'conectado' | 'reconectando' | 'encerrado';

export type MotivoAcessoNegado = 'invalido' | 'encerrado';

// Eventos do namespace /rastreio do backend (src/mapa/rastreio.gateway.ts).
const EVENTO_LOCALIZACAO = 'localizacao';
const EVENTO_STATUS = 'status';
const EVENTO_ACESSO_NEGADO = 'acesso-negado';

// R-US03: o recebedor recebe a posição do entregador assim que ela chega ao
// backend. A cada (re)conexão a posição atual é buscada por HTTP, porque o
// socket não guarda o que passou enquanto a conexão estava caída.
export function useRastreioTempoReal(token: string, ativo: boolean) {
  const [visao, setVisao] = useState<VisaoDaEntrega | null>(null);
  const [status, setStatus] = useState<StatusPedido | null>(null);
  const [marcos, setMarcos] = useState<MarcoDoPedido[]>([]);
  const [conexao, setConexao] = useState<EstadoConexao>('conectando');
  const [acessoNegado, setAcessoNegado] = useState<MotivoAcessoNegado | null>(null);

  useEffect(() => {
    if (!ativo) return;
    let cancelado = false;

    function atualizar() {
      buscarLocalizacaoDoRastreio(token)
        .then((resposta) => {
          if (!cancelado) setVisao(resposta);
        })
        .catch(() => {
          // A próxima posição pelo socket corrige a tela.
        });
    }

    const socket = io(`${API_URL}/rastreio`, { auth: { token } });

    socket.on('connect', () => {
      setConexao('conectado');
      atualizar();
    });
    socket.on('disconnect', (motivo) => {
      // "io server disconnect" = o backend fechou a sala (entrega encerrada ou
      // link inválido); nesse caso o socket.io não tenta reconectar.
      setConexao(motivo === 'io server disconnect' ? 'encerrado' : 'reconectando');
    });
    socket.on('connect_error', () => setConexao('reconectando'));
    socket.on(EVENTO_LOCALIZACAO, (dados: VisaoDaEntrega) => {
      setVisao(dados);
      setStatus(dados.status);
    });
    socket.on(EVENTO_STATUS, (dados: { status: StatusPedido; em?: string }) => {
      setStatus(dados.status);
      const { em } = dados;
      if (em) setMarcos((anteriores) => [...anteriores, { etapa: dados.status, em }]);
    });
    socket.on(EVENTO_ACESSO_NEGADO, (dados: { situacao: MotivoAcessoNegado }) => setAcessoNegado(dados.situacao));

    return () => {
      cancelado = true;
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [token, ativo]);

  return { visao, status, marcos, conexao, acessoNegado };
}
