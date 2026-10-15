import AcoesDeStatus from '@/app/components/entregador/AcoesDeStatus';
import { formatarDataHora, formatarDistancia, formatarReais, rotuloDoStatus } from '@/app/lib/pedidos';
import type { PedidoDoEntregador } from '@/app/lib/tipos';

export interface DetalhePedidoEntregadorProps {
  pedido: PedidoDoEntregador;
  onStatusAlterado: () => void;
}

export default function DetalhePedidoEntregador({ pedido, onStatusAlterado }: DetalhePedidoEntregadorProps) {
  const linhas = [
    { rotulo: 'Status', valor: rotuloDoStatus(pedido.status) },
    { rotulo: 'Recebedor', valor: pedido.recebedor },
    { rotulo: 'Endereço', valor: pedido.endereco },
    { rotulo: 'Estabelecimento', valor: pedido.empresa },
    { rotulo: 'Distância', valor: formatarDistancia(pedido.distancia) },
    { rotulo: 'Valor da entrega', valor: formatarReais(pedido.valorEntrega) },
    { rotulo: 'Criado em', valor: formatarDataHora(pedido.criadoEm) },
    { rotulo: 'Saiu para entrega', valor: pedido.iniciadoEm && formatarDataHora(pedido.iniciadoEm) },
    { rotulo: 'Finalizado em', valor: pedido.finalizadoEm && formatarDataHora(pedido.finalizadoEm) },
  ].filter((linha) => linha.valor);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 lg:grid-cols-[1.3fr_0.9fr]">
        <div className="overflow-hidden rounded-[20px] border border-borda bg-[#0a0a0c] p-0" aria-label="Mapa do percurso">
          <div className="h-[360px] w-full bg-black" />
        </div>

        <div className="flex flex-col rounded-[18px] bg-superficie p-4 shadow-sm ring-1 ring-borda">
          <h2 className="text-[15px] md:text-[18px] font-bold text-texto">{pedido.recebedor}</h2>
          <p className="mt-2 text-[14px] text-texto-apoio">{pedido.endereco}</p>

          <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[13px]">
            {linhas.map(({ rotulo, valor }) => (
              <div key={rotulo} className="contents">
                <dt className="text-texto-suave">{rotulo}</dt>
                <dd className="font-medium text-texto">{valor}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-auto pt-6">
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-[16px] bg-primaria px-4 py-3 text-[15px] font-bold text-white shadow-sm transition-colors hover:bg-primaria-escura"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px]">💬</span>
              Abrir chat
            </button>
          </div>
        </div>
      </div>

      <AcoesDeStatus idPedido={pedido.id} statusAtual={pedido.status} onAlterado={onStatusAlterado} />
    </div>
  );
}
