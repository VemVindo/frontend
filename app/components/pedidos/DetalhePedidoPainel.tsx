'use client';

import { useEffect, useState } from 'react';
import MapaEntrega from '@/app/components/mapa/MapaEntrega';
import ResumoTrajeto from '@/app/components/mapa/ResumoTrajeto';
import BotaoWhatsapp from '@/app/components/pedidos/BotaoWhatsapp';
import EtiquetaStatus from '@/app/components/pedidos/EtiquetaStatus';
import LinhaDoTempoDoPedido from '@/app/components/pedidos/LinhaDoTempoDoPedido';
import { buscarDetalheDoPedido, consultarRotaDoPedido } from '@/app/lib/api';
import { montarLinhaDoTempo } from '@/app/lib/linhaDoTempo';
import { formatarDataHora, formatarDistancia, formatarEndereco, formatarReais, pedidoEmAberto } from '@/app/lib/pedidos';
import { formatarTelefone, primeiroNome } from '@/app/lib/texto';
import type { DetalheDoPedido, VisaoDaEntrega } from '@/app/lib/tipos';

// Sem socket no painel: enquanto a entrega anda, o detalhe e o mapa são
// buscados de novo. A consulta não chama a Routes API (só lê o que o
// entregador já calculou), então não gera custo no Google.
export const INTERVALO_ATUALIZACAO_MS = 15_000;

export interface DetalhePedidoPainelProps {
  idPedido: number;
}

const CAIXA = 'rounded-[18px] bg-superficie p-4 text-xs ring-1 ring-borda';

// E-US13: dados do pedido, andamento com horários e, em andamento, o mapa.
export default function DetalhePedidoPainel({ idPedido }: DetalhePedidoPainelProps) {
  const [pedido, setPedido] = useState<DetalheDoPedido | null>(null);
  const [visao, setVisao] = useState<VisaoDaEntrega | null>(null);
  const [erroPedido, setErroPedido] = useState<string | null>(null);
  const [erroMapa, setErroMapa] = useState(false);

  const emAndamento = pedido?.status === 'EM_ANDAMENTO';

  useEffect(() => {
    let cancelado = false;
    buscarDetalheDoPedido(idPedido)
      .then((resposta) => {
        if (!cancelado) setPedido(resposta);
      })
      .catch(() => {
        if (!cancelado) setErroPedido('Não foi possível carregar os detalhes do pedido agora.');
      });
    return () => {
      cancelado = true;
    };
  }, [idPedido]);

  useEffect(() => {
    if (!emAndamento) return;
    let cancelado = false;

    function atualizar() {
      consultarRotaDoPedido(idPedido)
        .then((resposta) => {
          if (cancelado) return;
          setVisao(resposta);
          setErroMapa(false);
        })
        .catch(() => {
          if (!cancelado) setErroMapa(true);
        });
      buscarDetalheDoPedido(idPedido)
        .then((resposta) => {
          if (!cancelado) setPedido(resposta);
        })
        .catch(() => {
          // Mantém o que já está na tela; a próxima rodada tenta de novo.
        });
    }

    atualizar();
    const intervalo = setInterval(atualizar, INTERVALO_ATUALIZACAO_MS);
    return () => {
      cancelado = true;
      clearInterval(intervalo);
    };
  }, [idPedido, emAndamento]);

  if (erroPedido) {
    return (
      <p role="alert" className="text-xs text-erro">
        {erroPedido}
      </p>
    );
  }

  if (!pedido) {
    return (
      <p role="status" className="text-xs text-texto-apoio">
        Carregando detalhes do pedido...
      </p>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.3fr_0.9fr]">
      <div className="flex flex-col gap-3">
        {!emAndamento ? (
          <p className={`${CAIXA} text-texto-apoio`}>O mapa fica disponível com a entrega em andamento.</p>
        ) : erroMapa && !visao ? (
          <p role="alert" className={`${CAIXA} text-erro`}>
            Não foi possível carregar o mapa agora.
          </p>
        ) : !visao ? (
          <p role="status" className={`${CAIXA} text-texto-apoio`}>
            Carregando mapa...
          </p>
        ) : (
          <>
            <MapaEntrega
              origem={visao.origem}
              nomeOrigem="Estabelecimento"
              destino={visao.destino}
              rotuloDestino={primeiroNome(pedido.recebedor.nome)}
              entregador={visao.entregador}
              rota={visao.rota}
              className="h-[279px] w-full overflow-hidden rounded-[18px] md:h-[375px]"
            />
            <ResumoTrajeto
              distanciaRestanteM={visao.distanciaRestanteM}
              duracaoRestanteS={visao.duracaoRestanteS}
              estimado={visao.estimado}
            />
          </>
        )}
      </div>

      <div className="flex flex-col gap-5">
        <section className={`${CAIXA} flex flex-col gap-5`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-bold text-texto md:text-[18px]">{pedido.recebedor.nome}</h2>
              <p className="mt-1 text-texto-apoio">{pedido.descricao}</p>
            </div>
            <EtiquetaStatus status={pedido.status} />
          </div>

          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[13px]">
            <dt className="text-texto-suave">Telefone</dt>
            <dd className="text-texto">{formatarTelefone(pedido.recebedor.telefone)}</dd>
            <dt className="text-texto-suave">Endereço</dt>
            <dd className="text-texto">{formatarEndereco(pedido.endereco)}</dd>
            <dt className="text-texto-suave">Entregador</dt>
            <dd className="text-texto">{pedido.entregador ?? 'Não atribuído'}</dd>
            <dt className="text-texto-suave">Criado em</dt>
            <dd className="text-texto">
              <time dateTime={pedido.criadoEm}>{formatarDataHora(pedido.criadoEm)}</time>
            </dd>
            <dt className="text-texto-suave">Valor</dt>
            <dd className="text-texto">
              {formatarReais(pedido.valorEntrega)} ({formatarDistancia(pedido.distancia)})
            </dd>
          </dl>

          {pedidoEmAberto(pedido.status) && (
            <div className="mt-auto flex flex-col gap-3 border-t border-borda pt-4">
              {emAndamento && <BotaoWhatsapp idPedido={pedido.id} com="entregador" />}
              <BotaoWhatsapp idPedido={pedido.id} com="recebedor" variante="claro" />
            </div>
          )}
        </section>

        <section className={CAIXA}>
          <h2 className="mb-4 text-[13px] font-semibold text-texto">Andamento</h2>
          <LinhaDoTempoDoPedido passos={montarLinhaDoTempo(pedido.linhaDoTempo, [], pedido.status)} />
        </section>
      </div>
    </div>
  );
}
