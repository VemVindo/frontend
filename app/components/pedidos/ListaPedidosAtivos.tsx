import Link from 'next/link';
import EtiquetaStatus from '@/app/components/pedidos/EtiquetaStatus';
import { formatarDataHora } from '@/app/lib/pedidos';
import { telaPedidoDoPainel } from '@/app/lib/rotas';
import type { PedidoAtivo } from '@/app/lib/tipos';

export interface ListaPedidosAtivosProps {
  pedidos: PedidoAtivo[];
  onAtribuir: (pedido: PedidoAtivo) => void;
}

const COLUNAS = 'md:grid md:grid-cols-[70px_1fr_1fr_130px_110px_160px] md:items-center md:gap-3';
const TITULOS = ['Pedido', 'Recebedor', 'Entregador', 'Status', 'Criado em', 'Ação'];
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
          <li
            key={pedido.id}
            className={`flex flex-col gap-2 rounded-[8px] border border-borda px-[13px] py-3 text-xs text-texto-corpo ${COLUNAS}`}
          >
            <span className="font-semibold md:font-normal">#{pedido.id}</span>
            <span>{pedido.recebedor}</span>
            <span className={pedido.entregador ? '' : 'text-texto-apoio'}>
              <span className="text-texto-apoio md:hidden">Entregador: </span>
              {pedido.entregador ?? 'Não atribuído'}
            </span>
            <span>
              <EtiquetaStatus status={pedido.status} />
            </span>
            <span className="text-texto-apoio">
              <span className="md:hidden">Criado em </span>
              {formatarDataHora(pedido.criadoEm)}
            </span>
            <span className="flex gap-4">
              <Link href={telaPedidoDoPainel(pedido.id)} className={ACAO}>
                Ver detalhes
              </Link>
              {pedido.status === 'PENDENTE' && (
                <button type="button" onClick={() => onAtribuir(pedido)} className={ACAO}>
                  Atribuir
                </button>
              )}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
