'use client';

import { useEffect, useState } from 'react';
import MapaEntrega from '@/app/components/mapa/MapaEntrega';
import BotaoWhatsapp from '@/app/components/pedidos/BotaoWhatsapp';
import EtiquetaStatus from '@/app/components/pedidos/EtiquetaStatus';
import { consultarRotaDoPedido, listarPedidosDaEmpresa } from '@/app/lib/api';
import { formatarDataHora, pedidoEmAberto } from '@/app/lib/pedidos';
import type { PedidoAtivo, VisaoDaEntrega } from '@/app/lib/tipos';

export interface DetalhePedidoPainelProps {
  idPedido: number;
}

export default function DetalhePedidoPainel({ idPedido }: DetalhePedidoPainelProps) {
  const [pedido, setPedido] = useState<PedidoAtivo | null>(null);
  const [visao, setVisao] = useState<VisaoDaEntrega | null>(null);
  const [carregandoPedido, setCarregandoPedido] = useState(true);
  const [carregandoMapa, setCarregandoMapa] = useState(false);
  const [erroPedido, setErroPedido] = useState<string | null>(null);
  const [erroMapa, setErroMapa] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    async function carregar() {
      try {
        const pedidos = await listarPedidosDaEmpresa();
        if (cancelado) return;
        setCarregandoPedido(false);

        const encontrado = pedidos.find((item) => item.id === idPedido);
        if (!encontrado) {
          setErroPedido('Pedido não encontrado no seu estabelecimento.');
          return;
        }
        setPedido(encontrado);

        if (encontrado.status !== 'EM_ANDAMENTO') return;

        setCarregandoMapa(true);
        try {
          const resposta = await consultarRotaDoPedido(idPedido);
          if (!cancelado) setVisao(resposta);
        } catch {
          if (!cancelado) setErroMapa('Não foi possível carregar o mapa agora.');
        } finally {
          if (!cancelado) setCarregandoMapa(false);
        }
      } catch {
        if (!cancelado) setErroPedido('Não foi possível carregar os detalhes do pedido agora.');
      } finally {
        if (!cancelado) setCarregandoPedido(false);
      }
    }

    void carregar();
    return () => {
      cancelado = true;
    };
  }, [idPedido]);

  if (carregandoPedido) {
    return <p role="status" className="text-xs text-texto-apoio">Carregando detalhes do pedido...</p>;
  }

  if (!pedido) {
    return (
      <p role="alert" className="text-xs text-erro">
        {erroPedido}
      </p>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.3fr_0.9fr]">
      <div>
        {pedido.status !== 'EM_ANDAMENTO' ? (
          <p className="rounded-[18px] bg-superficie p-4 text-xs text-texto-apoio ring-1 ring-borda">
            O mapa fica disponível com a entrega em andamento.
          </p>
        ) : erroMapa ? (
          <p role="alert" className="rounded-[18px] bg-superficie p-4 text-xs text-erro ring-1 ring-borda">
            {erroMapa}
          </p>
        ) : carregandoMapa ? (
          <p role="status" className="rounded-[18px] bg-superficie p-4 text-xs text-texto-apoio ring-1 ring-borda">
            Carregando mapa...
          </p>
        ) : visao && !visao.exibirMapa ? (
          <p className="rounded-[18px] bg-superficie p-4 text-xs text-texto-apoio ring-1 ring-borda">
            O mapa está desativado nas configurações do estabelecimento.
          </p>
        ) : visao ? (
          <MapaEntrega
            origem={visao.origem}
            nomeOrigem="Estabelecimento"
            destino={visao.destino}
            rotuloDestino="Recebedor"
            entregador={visao.entregador}
            rota={visao.rota}
            className="h-[279px] w-full overflow-hidden rounded-[18px] md:h-[375px]"
          />
        ) : (
          <p role="alert" className="rounded-[18px] bg-superficie p-4 text-xs text-erro ring-1 ring-borda">
            Não foi possível carregar o mapa agora.
          </p>
        )}
      </div>

      <section className="flex flex-col rounded-[18px] bg-superficie p-4 shadow-sm ring-1 ring-borda">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-[15px] font-bold text-texto md:text-[18px]">{pedido.recebedor}</h2>
          <EtiquetaStatus status={pedido.status} />
        </div>

        <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[13px]">
          <dt className="text-texto-suave">Entregador</dt>
          <dd className="font-medium text-texto">{pedido.entregador ?? 'Não atribuído'}</dd>
          <dt className="text-texto-suave">Criado em</dt>
          <dd className="font-medium text-texto">
            <time dateTime={pedido.criadoEm}>{formatarDataHora(pedido.criadoEm)}</time>
          </dd>
        </dl>

        {pedidoEmAberto(pedido.status) && (
          <div className="mt-auto flex flex-col gap-3 pt-6">
            {pedido.status === 'EM_ANDAMENTO' && <BotaoWhatsapp idPedido={pedido.id} com="entregador" />}
            <BotaoWhatsapp idPedido={pedido.id} com="recebedor" variante="claro" />
          </div>
        )}
      </section>
    </div>
  );
}
