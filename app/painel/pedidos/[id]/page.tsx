import Link from 'next/link';
import IconeVoltar from '@/app/components/icones/IconeVoltar';
import DetalhePedidoPainel from '@/app/components/pedidos/DetalhePedidoPainel';
import HistoricoEntregadores from '@/app/components/pedidos/HistoricoEntregadores';
import LinkDeRastreio from '@/app/components/pedidos/LinkDeRastreio';
import TituloPagina from '@/app/components/ui/TituloPagina';
import { TELA_PEDIDOS } from '@/app/lib/rotas';

export default async function PaginaDetalheDoPedido({ params }: PageProps<'/painel/pedidos/[id]'>) {
  const { id } = await params;

  return (
    <>
      <div className="flex items-start gap-3">
        <Link
          href={TELA_PEDIDOS}
          aria-label="Voltar para os pedidos ativos"
          className="mt-0.5 flex size-[38px] shrink-0 items-center justify-center rounded-full bg-primaria-clara text-primaria-escura hover:bg-lilas md:mt-1"
        >
          <IconeVoltar className="size-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <TituloPagina titulo={`Pedido #${id}`} subtitulo="Detalhe da entrega" />
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <DetalhePedidoPainel key={id} idPedido={Number(id)} />
        <LinkDeRastreio idPedido={Number(id)} />
        <HistoricoEntregadores idPedido={Number(id)} />
        <Link
          href={TELA_PEDIDOS}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[14px] border border-borda bg-superficie px-6 font-titulo text-sm font-bold text-texto transition-colors hover:bg-superficie-suave sm:w-auto sm:self-start"
        >
          <IconeVoltar className="size-5" />
          Voltar para os pedidos ativos
        </Link>
      </div>
    </>
  );
}
