import EntregasDaEmpresa from '@/app/components/entregador/EntregasDaEmpresa';

// A empresa vem do link de ListaVinculos; sem ela, mostra as entregas de todas.
export default async function PaginaPedidosDaEmpresa({ searchParams }: PageProps<'/entregador/pedidos'>) {
  const { empresa } = await searchParams;
  return <EntregasDaEmpresa empresa={typeof empresa === 'string' ? empresa : null} />;
}
