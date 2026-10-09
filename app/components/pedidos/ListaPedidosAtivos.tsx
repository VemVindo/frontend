import Link from 'next/link';
import EtiquetaStatus from '@/app/components/pedidos/EtiquetaStatus';
import { telaPedidoDoPainel } from '@/app/lib/rotas';
import type { PedidoAtivo } from '@/app/lib/tipos';

export interface ListaPedidosAtivosProps {
  pedidos: PedidoAtivo[];
  onAtribuir: (pedido: PedidoAtivo) => void;
}

const COLUNAS = 'md:grid md:grid-cols-[70px_1fr_1fr_130px_160px] md:items-center md:gap-3';
const TITULOS = ['Pedido', 'Recebedor', 'Entregador', 'Status', 'Ação'];
const ACAO = 'cursor-pointer text-xs font-semibold text-destaque hover:underline';

export default function ListaPedidosAtivos({ pedidos, onAtribuir }: ListaPedidosAtivosProps) {
  return (
    <>
      <div aria-hidden className={`hidden rounded-[8px] bg-superficie-suave px-[13px] py-[10px] text-[11px] uppercase text-texto-apoio ${COLUNAS}`}>
        {TITULOS.map((titulo) => (
          <span key={titulo}>{titulo}</span>
        ))}
      </div>

      <ul className="mt-[10px] flex flex-col gap-[10px]">
        {pedidos.map((pedido) => (
          <li key={pedido.id} className="overflow-hidden rounded-[8px] border border-borda text-xs text-texto-corpo">
            <div className={`hidden px-[13px] py-3 md:grid ${COLUNAS}`}>
              <span className="font-semibold md:font-normal">#{pedido.id}</span>
              <span>{pedido.recebedor}</span>
              <span className={pedido.entregador ? '' : 'text-texto-apoio'}>
                {pedido.entregador ?? 'Não atribuído'}
              </span>
              <span>
                <EtiquetaStatus status={pedido.status} />
              </span>
              <span className="flex items-center gap-4">
                <Link href={telaPedidoDoPainel(pedido.id)} className={ACAO}>
                  Ver detalhes
                </Link>
                {pedido.status !== 'CONCLUIDO' && pedido.status !== 'CANCELADO' && (
                  <button type="button" onClick={() => onAtribuir(pedido)} className={ACAO}>
                    {pedido.entregador ? 'Reatribuir' : 'Atribuir'}
                  </button>
                )}
              </span>
            </div>

            <div className="flex flex-col gap-2 px-[13px] py-3 md:hidden">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold">#{pedido.id}</span>
                <EtiquetaStatus status={pedido.status} />
              </div>

              <span className="text-sm font-medium text-texto-corpo">{pedido.recebedor}</span>

              <span className={pedido.entregador ? 'text-sm text-texto-apoio' : 'text-sm text-texto-apoio'}>
                Entregador: {pedido.entregador ?? 'Não atribuído'}
              </span>

              <div className="flex items-center justify-between gap-4 pt-1">
                <Link href={telaPedidoDoPainel(pedido.id)} className={ACAO}>
                  Ver detalhes
                </Link>
                {pedido.status !== 'CONCLUIDO' && pedido.status !== 'CANCELADO' && (
                  <button type="button" onClick={() => onAtribuir(pedido)} className={ACAO}>
                    {pedido.entregador ? 'Reatribuir' : 'Atribuir'}
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
