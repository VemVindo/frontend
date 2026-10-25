import EntregasDaEmpresa from '@/app/components/entregador/EntregasDaEmpresa';

export default async function PaginaPedidosDaEmpresa({ searchParams }: PageProps<'/entregador/pedidos'>) {
  const { empresa } = await searchParams;
  return <EntregasDaEmpresa empresa={typeof empresa === 'string' ? empresa : null} />;
}
