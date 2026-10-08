'use client';

import { useCallback, useEffect, useState } from 'react';
import ListaPedidosAtivos from '@/app/components/pedidos/ListaPedidosAtivos';
import ModalAtribuirEntregador from '@/app/components/pedidos/ModalAtribuirEntregador';
import Card from '@/app/components/ui/Card';
import TituloPagina from '@/app/components/ui/TituloPagina';
import { listarPedidosAtivos } from '@/app/lib/pedidosAtivos';
import type { PedidoAtivo } from '@/app/lib/tipos';

export default function PaginaPedidosAtivos() {
  const [pedidos, setPedidos] = useState<PedidoAtivo[] | null>(null);
  const [erro, setErro] = useState(false);
  const [pedidoParaAtribuir, setPedidoParaAtribuir] = useState<PedidoAtivo | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

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

  const fecharModal = useCallback(() => setPedidoParaAtribuir(null), []);

  function registrarAtribuicao(atribuido: PedidoAtivo) {
    setPedidos((atuais) => atuais?.map((pedido) => (pedido.id === atribuido.id ? atribuido : pedido)) ?? null);
    setAviso(`Pedido #${atribuido.id} atribuído a ${atribuido.entregador}.`);
    setPedidoParaAtribuir(null);
  }

  return (
    <>
      <TituloPagina titulo="Pedidos ativos" subtitulo="Acompanhe e gerencie os pedidos do estabelecimento" />

      <Card titulo="Ativos">
        <p role="status" className="text-xs text-sucesso-texto">{aviso}</p>
        {erro && (
          <p role="alert" className="text-xs text-erro">
            Não foi possível carregar os pedidos agora.
          </p>
        )}
        {!pedidos && !erro && <p className="text-xs text-texto-apoio">Carregando pedidos...</p>}
        {pedidos?.length === 0 && <p className="text-xs text-texto-apoio">Nenhum pedido ativo no momento.</p>}
        {pedidos && pedidos.length > 0 && (
          <ListaPedidosAtivos pedidos={pedidos} onAtribuir={setPedidoParaAtribuir} />
        )}
      </Card>

      {pedidoParaAtribuir && (
        <ModalAtribuirEntregador
          pedido={pedidoParaAtribuir}
          onFechar={fecharModal}
          onAtribuido={registrarAtribuicao}
        />
      )}
    </>
  );
}
