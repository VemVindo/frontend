'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import DetalhePedidoEntregador from '@/app/components/entregador/DetalhePedidoEntregador';
import IconeVoltar from '@/app/components/icones/IconeVoltar';
import { TELA_INICIAL } from '@/app/lib/rotas';
import { usePedidosEntregador } from '@/app/lib/usePedidosEntregador';

export default function PaginaPedidoDoEntregador() {
  const { id } = useParams<{ id: string }>();
  const { pedidos, erro } = usePedidosEntregador();
  const pedido = pedidos?.find((item) => item.id === Number(id));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Link
          href={TELA_INICIAL.ENTREGADOR}
          aria-label="Voltar para as entregas"
          className="flex size-[38px] items-center justify-center rounded-full bg-primaria-clara text-primaria-escura"
        >
          <IconeVoltar className="size-5" />
        </Link>
        <h1 className="font-titulo text-base font-bold">Pedido #{id}</h1>
      </div>

      {erro && (
        <p role="alert" className="text-[13px] text-erro">
          Não foi possível carregar o status do pedido agora.
        </p>
      )}
      {!pedidos && !erro && <p className="text-xs text-texto-apoio">Carregando pedido...</p>}
      {pedidos && !pedido && <p className="text-xs text-texto-apoio">Pedido não encontrado nas suas entregas.</p>}
      {pedido && <DetalhePedidoEntregador pedido={pedido} />}
    </div>
  );
}
