'use client';

import Link from 'next/link';
import EtapasDaEntrega from '@/app/components/pedidos/EtapasDaEntrega';
import EtiquetaStatus from '@/app/components/pedidos/EtiquetaStatus';
import { formatarDistancia, formatarReais, rotuloDoStatus } from '@/app/lib/pedidos';
import { telaPedidoDoEntregador } from '@/app/lib/rotas';
import type { PedidoDoEntregador } from '@/app/lib/tipos';
import { usePedidosEntregador } from '@/app/lib/usePedidosEntregador';

export interface EntregasDaEmpresaProps {
  empresa: string | null;
}

function finalizadoHoje(pedido: PedidoDoEntregador): boolean {
  return (
    pedido.status === 'FINALIZADO' &&
    pedido.finalizadoEm !== null &&
    new Date(pedido.finalizadoEm).toDateString() === new Date().toDateString()
  );
}

function resumoDoDia(pedidos: PedidoDoEntregador[]) {
  const deHoje = pedidos.filter(finalizadoHoje);
  const minutos = deHoje
    .filter((pedido) => pedido.iniciadoEm)
    .map((pedido) => (Date.parse(pedido.finalizadoEm!) - Date.parse(pedido.iniciadoEm!)) / 60_000);
  return {
    concluidas: deHoje.length,
    ganhos: formatarReais(deHoje.reduce((total, pedido) => total + pedido.valorEntrega, 0)),
    tempoMedio: minutos.length
      ? `${Math.round(minutos.reduce((total, valor) => total + valor, 0) / minutos.length)} min`
      : 'Sem entregas',
  };
}

export default function EntregasDaEmpresa({ empresa }: EntregasDaEmpresaProps) {
  const { pedidos, erro } = usePedidosEntregador();
  const daEmpresa = pedidos?.filter((pedido) => !empresa || pedido.empresa === empresa) ?? [];
  const entregaAtual = daEmpresa.find((pedido) => pedido.status === 'EM_ANDAMENTO');
  const encerradas = daEmpresa.filter((pedido) => pedido.status === 'FINALIZADO' || pedido.status === 'CANCELADO');
  const resumo = resumoDoDia(daEmpresa);

  if (erro) {
    return (
      <p role="alert" className="text-[13px] text-erro">
        Não foi possível carregar suas entregas agora.
      </p>
    );
  }
  if (!pedidos) {
    return <p className="text-xs text-texto-apoio">Carregando entregas...</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {entregaAtual ? (
        <Link
          href={telaPedidoDoEntregador(entregaAtual.id)}
          className="w-full rounded-[28px] bg-primaria px-6 py-6 text-left text-white shadow-sm transition-opacity hover:opacity-95 md:px-8"
        >
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-lilas">
            Entrega atual - pedido #{entregaAtual.id} - {rotuloDoStatus(entregaAtual.status)}
          </div>
          <h1 className="mt-4 text-[28px] font-bold leading-tight md:text-[34px]">{entregaAtual.recebedor}</h1>
          <p className="mt-2 text-[13px] text-lilas">
            {entregaAtual.endereco} - {formatarDistancia(entregaAtual.distancia)}
          </p>
          <div className="mt-7">
            <EtapasDaEntrega status={entregaAtual.status} />
          </div>
        </Link>
      ) : (
        <div className="rounded-[28px] bg-superficie px-6 py-6 text-sm text-texto-apoio ring-1 ring-borda">
          Nenhuma entrega em andamento{empresa ? ` para ${empresa}` : ''} no momento.
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.8fr_0.9fr]">
        <section className="rounded-[18px] bg-superficie px-4 py-4 shadow-sm ring-1 ring-borda md:px-5">
          <h2 className="text-[18px] font-bold text-texto">Entregas realizadas</h2>
          {encerradas.length === 0 && <p className="mt-4 text-xs text-texto-apoio">Nenhuma entrega encerrada ainda.</p>}
          <ul className="mt-4 flex flex-col gap-3">
            {encerradas.map((pedido) => (
              <li key={pedido.id}>
                <Link
                  href={telaPedidoDoEntregador(pedido.id)}
                  className="flex items-center justify-between gap-3 rounded-[12px] border border-borda bg-superficie-suave px-3 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="text-[11px] font-bold text-destaque">#{pedido.id}</span>
                    <span className="text-[13px] font-semibold text-texto-corpo">{pedido.recebedor}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-texto-apoio">
                    <span>{formatarDistancia(pedido.distancia)}</span>
                    <EtiquetaStatus status={pedido.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <aside className="rounded-[18px] bg-superficie px-4 py-4 shadow-sm ring-1 ring-borda md:px-5">
          <h2 className="text-[18px] font-bold text-texto">Resumo diário</h2>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between gap-3 border-b border-borda py-2 text-[13px] text-texto-apoio">
              <span>Entregas concluídas</span>
              <span className="font-semibold text-texto">{resumo.concluidas}</span>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-borda py-2 text-[13px] text-texto-apoio">
              <span>Ganhos no dia</span>
              <span className="font-semibold text-primaria">{resumo.ganhos}</span>
            </div>
            <div className="flex items-center justify-between gap-3 py-2 text-[13px] text-texto-apoio">
              <span>Tempo médio</span>
              <span className="font-semibold text-texto">{resumo.tempoMedio}</span>
            </div>
          </div>
        </aside>
      </div>

      {empresa && (
        <div className="rounded-[18px] border border-dashed border-borda bg-superficie-suave px-4 py-3 text-[12px] text-texto-apoio">
          Empresa ativa: <span className="font-semibold text-texto">{empresa}</span>
        </div>
      )}
    </div>
  );
}
