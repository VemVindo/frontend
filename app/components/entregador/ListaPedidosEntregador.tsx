import Link from 'next/link';
import EtiquetaStatus from '@/app/components/pedidos/EtiquetaStatus';
import Card from '@/app/components/ui/Card';
import { pedidoEmAberto } from '@/app/lib/pedidos';
import { telaPedidoDoEntregador } from '@/app/lib/rotas';
import type { PedidoDoEntregador } from '@/app/lib/tipos';

export interface ListaPedidosEntregadorProps {
  pedidos: PedidoDoEntregador[];
}

interface GrupoDePedidos {
  titulo: string;
  vazio: string;
  pedidos: PedidoDoEntregador[];
}

export default function ListaPedidosEntregador({ pedidos }: ListaPedidosEntregadorProps) {
  const grupos: GrupoDePedidos[] = [
    {
      titulo: 'Entregas em aberto',
      vazio: 'Nenhuma entrega em aberto no momento.',
      pedidos: pedidos.filter((pedido) => pedidoEmAberto(pedido.status)),
    },
    {
      titulo: 'Entregas encerradas',
      vazio: 'Nenhuma entrega encerrada por enquanto.',
      pedidos: pedidos.filter((pedido) => !pedidoEmAberto(pedido.status)),
    },
  ];

  return (
    <>
      {grupos.map((grupo) => (
        <Card key={grupo.titulo} titulo={grupo.titulo}>
          {grupo.pedidos.length === 0 ? (
            <p className="text-xs text-texto-apoio">{grupo.vazio}</p>
          ) : (
            <ul className="flex flex-col gap-[10px]">
              {grupo.pedidos.map((pedido) => (
                <li key={pedido.id}>
                  <Link
                    href={telaPedidoDoEntregador(pedido.id)}
                    className="flex items-center justify-between gap-3 rounded-[10px] border border-borda p-3 transition-colors hover:bg-superficie-suave"
                  >
                    <span className="flex min-w-0 flex-col gap-1">
                      <span className="text-[11px] font-semibold text-destaque">#{pedido.id}</span>
                      <span className="text-xs font-semibold text-texto-corpo">{pedido.recebedor}</span>
                      <span className="text-[10px] text-texto-apoio">{pedido.endereco}</span>
                    </span>
                    <EtiquetaStatus status={pedido.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ))}
    </>
  );
}
