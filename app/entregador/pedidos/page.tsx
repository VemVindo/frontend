'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const entregasRealizadas = [
  { id: 4835, nome: 'João Pereira', rota: 'SHIN QI 9 - 3,4 km', status: 'Concluída' },
  { id: 4831, nome: 'Rafael Nunes', rota: '706 Sul - 2,1 km', status: 'Concluída' },
];

const resumo = {
  concluidas: 4,
  ganhos: 'R$ 47,80',
  tempoMedio: '21 min',
};

export default function PaginaPedidosDaEmpresa() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const empresa = searchParams.get('empresa') ?? 'Padaria Pão Quente';
  const [mostrarModalStatus, setMostrarModalStatus] = useState(false);

  const entregaAtual = {
    id: 4830,
    nome: 'Carla Menezes',
    endereco: 'SQN 210 BL. K, apto 304 - 1,2 km restantes',
    status: 'EM ROTA',
  };

  useEffect(() => {
    const chaveModal = `entregador-status-entrega-modal-visto:${entregaAtual.id}`;
    const jaViuModal = window.localStorage.getItem(chaveModal) === 'true';
    if (!jaViuModal) {
      setMostrarModalStatus(true);
    }
  }, [entregaAtual.id]);

  function fecharModal() {
    const chaveModal = `entregador-status-entrega-modal-visto:${entregaAtual.id}`;
    window.localStorage.setItem(chaveModal, 'true');
    setMostrarModalStatus(false);
  }

  function abrirPedido() {
    const chaveModal = `entregador-status-entrega-modal-visto:${entregaAtual.id}`;
    const jaViuModal = window.localStorage.getItem(chaveModal) === 'true';

    if (jaViuModal) {
      router.push(`/entregador/pedidos/${entregaAtual.id}`);
      return;
    }

    setMostrarModalStatus(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={abrirPedido}
        className="w-full rounded-[28px] bg-primaria px-6 py-6 text-left text-white shadow-sm transition-opacity hover:opacity-95 md:px-8"
      >
        <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-lilas">
          Entrega atual - pedido #{entregaAtual.id} - {entregaAtual.status}
        </div>

        <h1 className="mt-4 text-[28px] font-bold leading-tight md:text-[34px]">{entregaAtual.nome}</h1>
        <p className="mt-2 text-[13px] text-lilas">{entregaAtual.endereco}</p>

        <div className="mt-7 flex flex-wrap items-center gap-5 text-[12px] text-white/90">
          <span className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-white" />
            Atribuído
          </span>
          <span className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-white/75" />
            A caminho
          </span>
          <span className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-white/50" />
            Chegou
          </span>
          <span className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-white/30" />
            Concluída
          </span>
        </div>
      </button>

      <div className="grid gap-5 lg:grid-cols-[1.8fr_0.9fr]">
        <section className="rounded-[18px] bg-superficie px-4 py-4 shadow-sm ring-1 ring-borda md:px-5">
          <h2 className="text-[18px] font-bold text-texto">Entregas realizadas</h2>

          <ul className="mt-4 flex flex-col gap-3">
            {entregasRealizadas.map((pedido) => (
              <li
                key={pedido.id}
                className="flex items-center justify-between gap-3 rounded-[12px] border border-borda bg-superficie-suave px-3 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="text-[11px] font-bold text-destaque">#{pedido.id}</span>
                  <span className="text-[13px] font-semibold text-texto-corpo">{pedido.nome}</span>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-texto-apoio">
                  <span>{pedido.rota}</span>
                  <span className="rounded-full bg-sucesso-fundo px-2.5 py-1 font-semibold text-sucesso-texto">
                    {pedido.status}
                  </span>
                </div>
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

      <div className="rounded-[18px] border border-dashed border-borda bg-superficie-suave px-4 py-3 text-[12px] text-texto-apoio">
        Empresa ativa: <span className="font-semibold text-texto">{empresa}</span>
      </div>

      {mostrarModalStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div aria-hidden onClick={fecharModal} className="absolute inset-0 bg-sobreposicao/55" />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-status-entrega"
            className="relative w-full max-w-[420px] rounded-[20px] bg-superficie p-6 shadow-xl"
          >
            <h2 id="titulo-status-entrega" className="font-titulo text-lg font-bold text-texto">
              Alterar status da entrega
            </h2>
            <p className="mt-3 text-sm text-texto-apoio">
              Deseja mudar o status desta entrega para <span className="font-semibold text-texto">A caminho</span>?
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={fecharModal}
                className="flex-1 cursor-pointer rounded-[12px] border border-borda bg-superficie px-4 py-3 text-sm font-semibold text-texto transition-colors hover:bg-superficie-suave"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  fecharModal();
                  router.push(`/entregador/pedidos/${entregaAtual.id}`);
                }}
                className="flex-1 cursor-pointer rounded-[12px] bg-primaria px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primaria-escura"
              >
                Sim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
