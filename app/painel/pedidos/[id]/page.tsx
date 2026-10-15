import Link from 'next/link';
import HistoricoEntregadores from '@/app/components/pedidos/HistoricoEntregadores';
import TituloPagina from '@/app/components/ui/TituloPagina';
import { TELA_PEDIDOS } from '@/app/lib/rotas';

export default async function PaginaDetalheDoPedido({ params }: PageProps<'/painel/pedidos/[id]'>) {
  const { id } = await params;

  return (
    <>
      <TituloPagina titulo={`Pedido #${id}`} subtitulo="Detalhe da entrega" />
      <div className="flex flex-col gap-4">
        <HistoricoEntregadores idPedido={Number(id)} />
        <Link href={TELA_PEDIDOS} className="text-xs font-semibold text-destaque hover:underline">
          Voltar para os pedidos ativos
        </Link>
      </div>
    </>
  );
}
