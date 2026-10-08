import Link from 'next/link';
import Card from '@/app/components/ui/Card';
import TituloPagina from '@/app/components/ui/TituloPagina';
import { TELA_PEDIDOS } from '@/app/lib/rotas';

export default async function PaginaDetalheDoPedido({ params }: PageProps<'/painel/pedidos/[id]'>) {
  const { id } = await params;

  return (
    <>
      <TituloPagina titulo={`Pedido #${id}`} subtitulo="Detalhe da entrega" />
      <Card titulo="Em construção" descricao="O detalhe da entrega entra em uma próxima sprint.">
        <Link href={TELA_PEDIDOS} className="text-xs font-semibold text-destaque hover:underline">
          Voltar para os pedidos ativos
        </Link>
      </Card>
    </>
  );
}
