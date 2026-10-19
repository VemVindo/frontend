import Link from 'next/link';
import DetalhePedidoPainel from '@/app/components/pedidos/DetalhePedidoPainel';
import HistoricoEntregadores from '@/app/components/pedidos/HistoricoEntregadores';
import LinkDeRastreio from '@/app/components/pedidos/LinkDeRastreio';
import TituloPagina from '@/app/components/ui/TituloPagina';
import { TELA_PEDIDOS } from '@/app/lib/rotas';

export default async function PaginaDetalheDoPedido({ params }: PageProps<'/painel/pedidos/[id]'>) {
  const { id } = await params;

  return (
    <>
      <TituloPagina titulo={`Pedido #${id}`} subtitulo="Detalhe da entrega" />
      <div className="flex flex-col gap-4">
        <DetalhePedidoPainel idPedido={Number(id)} />
        <LinkDeRastreio idPedido={Number(id)} />
        <HistoricoEntregadores idPedido={Number(id)} />
        <Link href={TELA_PEDIDOS} className="text-xs font-semibold text-destaque hover:underline">
          Voltar para os pedidos ativos
        </Link>
      </div>
    </>
  );
}
