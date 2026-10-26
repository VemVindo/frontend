import Link from 'next/link';
import EtiquetaStatus from '@/app/components/pedidos/EtiquetaStatus';
import { formatarDataHora, formatarReais, textoDaNota } from '@/app/lib/pedidos';
import { telaPedidoDoPainel } from '@/app/lib/rotas';
import type { PedidoAtivo } from '@/app/lib/tipos';

export interface ListaPedidosFinalizadosProps {
  pedidos: PedidoAtivo[];
}

const COLUNAS = 'md:grid md:grid-cols-[70px_1fr_1fr_90px_110px_110px_110px] md:items-center md:gap-3';
const TITULOS = ['Pedido', 'Recebedor', 'Entregador', 'Valor', 'Conclusão', 'Avaliação', 'Ação'];
const ACAO = 'cursor-pointer text-xs font-semibold text-destaque hover:underline';

function textoDaConclusao(finalizadoEm: string | null): string {
  if (finalizadoEm === null) return 'Não concluído';
  return formatarDataHora(finalizadoEm);
}

export default function ListaPedidosFinalizados({ pedidos }: ListaPedidosFinalizadosProps) {
  return (
    <>
      <div
        aria-hidden
        className={`hidden rounded-[8px] bg-superficie-suave px-[13px] py-[10px] text-[11px] uppercase text-texto-apoio ${COLUNAS}`}
      >
        {TITULOS.map((titulo) => (
          <span key={titulo}>{titulo}</span>
        ))}
      </div>

      <ul className="mt-[10px] flex flex-col gap-[10px]">
        {pedidos.map((pedido) => (
          <li key={pedido.id} className="overflow-hidden rounded-[8px] border border-borda text-xs text-texto-corpo">
            <div className={`hidden px-[13px] py-3 md:grid ${COLUNAS}`}>
              <span>#{pedido.id}</span>
              <span>{pedido.recebedor}</span>
              <span className={pedido.entregador ? '' : 'text-texto-apoio'}>
                {pedido.entregador ?? 'Não atribuído'}
              </span>
              <span>{formatarReais(pedido.valorEntrega)}</span>
              <span className="text-texto-apoio">{textoDaConclusao(pedido.finalizadoEm)}</span>
              <span className={pedido.nota === null ? 'text-texto-apoio' : ''}>{textoDaNota(pedido.nota)}</span>
              <Link href={telaPedidoDoPainel(pedido.id)} className={ACAO}>
                Ver detalhes
              </Link>
            </div>

            <div className="flex flex-col gap-2 px-[13px] py-3 md:hidden">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold">#{pedido.id}</span>
                <EtiquetaStatus status={pedido.status} />
              </div>
              <span className="text-sm font-medium text-texto-corpo">{pedido.recebedor}</span>
              <span className="text-sm text-texto-apoio">Entregador: {pedido.entregador ?? 'Não atribuído'}</span>
              <span className="text-sm text-texto-apoio">Valor: {formatarReais(pedido.valorEntrega)}</span>
              <span className="text-sm text-texto-apoio">Avaliação: {textoDaNota(pedido.nota)}</span>
              <span className="text-[11px] text-texto-apoio">Concluído em {textoDaConclusao(pedido.finalizadoEm)}</span>
              <Link href={telaPedidoDoPainel(pedido.id)} className={`pt-1 ${ACAO}`}>
                Ver detalhes
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
