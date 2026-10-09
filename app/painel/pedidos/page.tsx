'use client';

import { useCallback, useEffect, useState } from 'react';
import ListaPedidosAtivos from '@/app/components/pedidos/ListaPedidosAtivos';
import ModalAtribuirEntregador from '@/app/components/pedidos/ModalAtribuirEntregador';
import Botao from '@/app/components/ui/Botao';
import Card from '@/app/components/ui/Card';
import TituloPagina from '@/app/components/ui/TituloPagina';
import { listarPedidosAtivos } from '@/app/lib/pedidosAtivos';
import type { PedidoAtivo } from '@/app/lib/tipos';

export default function PaginaPedidosAtivos() {
  const [pedidos, setPedidos] = useState<PedidoAtivo[] | null>(null);
  const [erro, setErro] = useState(false);
  const [pedidoParaAtribuir, setPedidoParaAtribuir] = useState<PedidoAtivo | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<'ativos' | 'finalizados'>('ativos');

  useEffect(() => {
    let cancelado = false;
    listarPedidosAtivos()
      .then((lista) => {
        if (!cancelado) setPedidos(lista);
      })
      .catch(() => {
        if (!cancelado) setErro(true);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  const pedidosFiltrados = pedidos?.filter((pedido) => {
    if (abaAtiva === 'finalizados') {
      return pedido.status === 'CONCLUIDO';
    }
    return pedido.status !== 'CONCLUIDO' && pedido.status !== 'CANCELADO';
  });

  const fecharModal = useCallback(() => setPedidoParaAtribuir(null), []);

  function registrarAtribuicao(atribuido: PedidoAtivo) {
    setPedidos((atuais) => atuais?.map((pedido) => (pedido.id === atribuido.id ? atribuido : pedido)) ?? null);
    setAviso(
      pedidoParaAtribuir?.entregador
        ? `Pedido #${atribuido.id} reatribuído a ${atribuido.entregador}.`
        : `Pedido #${atribuido.id} atribuído a ${atribuido.entregador}.`,
    );
    setPedidoParaAtribuir(null);
  }

  return (
    <>
      <TituloPagina
        titulo={abaAtiva === 'ativos' ? 'Pedidos ativos' : 'Pedidos finalizados'}
        subtitulo="Acompanhe e gerencie os pedidos do estabelecimento"
        acao={
          abaAtiva === 'ativos' ? (
            <div className="hidden md:block">
              <Botao variante="primario" className="h-11 rounded-[14px] px-5 text-sm">
                + Novo pedido
              </Botao>
            </div>
          ) : null
        }
      />

      <Card
        className="overflow-hidden"
        acao={
          <div className="flex w-full items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setAbaAtiva('ativos')}
              className={[
                'cursor-pointer rounded-full px-4 py-2 text-base font-bold',
                abaAtiva === 'ativos' ? 'bg-primaria text-white' : 'text-texto',
              ].join(' ')}
            >
              Ativos
            </button>
            <button
              type="button"
              onClick={() => setAbaAtiva('finalizados')}
              className={[
                'cursor-pointer rounded-full px-4 py-2 text-base font-bold',
                abaAtiva === 'finalizados' ? 'bg-primaria text-white' : 'text-texto',
              ].join(' ')}
            >
              Finalizados
            </button>
          </div>
        }
      >
        <p role="status" className="text-xs text-sucesso-texto">{aviso}</p>
        {erro && (
          <p role="alert" className="text-xs text-erro">
            Não foi possível carregar os pedidos agora.
          </p>
        )}
        {!pedidosFiltrados && !erro && <p className="text-xs text-texto-apoio">Carregando pedidos...</p>}
        {pedidosFiltrados?.length === 0 && (
          <p className="text-xs text-texto-apoio">
            {abaAtiva === 'ativos' ? 'Nenhum pedido ativo no momento.' : 'Nenhum pedido finalizado no momento.'}
          </p>
        )}
        {pedidosFiltrados && pedidosFiltrados.length > 0 && (
          <>
            <ListaPedidosAtivos pedidos={pedidosFiltrados} onAtribuir={setPedidoParaAtribuir} />

            {abaAtiva === 'ativos' && (
              <div className="mt-4 md:hidden">
                <Botao variante="primario" className="h-11 w-full rounded-[14px] px-5 text-sm">
                  + Novo pedido
                </Botao>
              </div>
            )}
          </>
        )}
      </Card>

      {pedidoParaAtribuir && (
        <ModalAtribuirEntregador
          pedido={pedidoParaAtribuir}
          onFechar={fecharModal}
          onAtribuido={registrarAtribuicao}
          modo={pedidoParaAtribuir.entregador ? 'reatribuir' : 'atribuir'}
        />
      )}
    </>
  );
}
