import EtapasDaEntrega from '@/app/components/pedidos/EtapasDaEntrega';
import Card from '@/app/components/ui/Card';
import { formatarDataHora, rotuloDoStatus } from '@/app/lib/pedidos';
import type { PedidoDoEntregador } from '@/app/lib/tipos';

export interface DetalhePedidoEntregadorProps {
  pedido: PedidoDoEntregador;
}

export default function DetalhePedidoEntregador({ pedido }: DetalhePedidoEntregadorProps) {
  const linhas = [
    { rotulo: 'Recebedor', valor: pedido.recebedor },
    { rotulo: 'Endereço', valor: pedido.endereco },
    { rotulo: 'Estabelecimento', valor: pedido.empresa },
    { rotulo: 'Criado em', valor: formatarDataHora(pedido.criadoEm) },
    { rotulo: 'Saiu para entrega', valor: pedido.iniciadoEm && formatarDataHora(pedido.iniciadoEm) },
    { rotulo: 'Finalizado em', valor: pedido.finalizadoEm && formatarDataHora(pedido.finalizadoEm) },
  ].filter((linha) => linha.valor);

  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-start">
      <section aria-label="Status do pedido" className="flex-1 rounded-[22px] bg-primaria p-5 text-white">
        <p className="font-titulo text-[10px] font-bold uppercase text-lilas">Status do pedido</p>
        <p role="status" className="mt-3 font-titulo text-xl font-bold md:text-2xl">
          {rotuloDoStatus(pedido.status)}
        </p>
        {pedido.status !== 'CANCELADO' && (
          <div className="mt-6">
            <EtapasDaEntrega status={pedido.status} />
          </div>
        )}
      </section>

      <Card titulo="Dados da entrega" className="md:w-[470px]">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[13px]">
          {linhas.map(({ rotulo, valor }) => (
            <div key={rotulo} className="contents">
              <dt className="text-texto-suave">{rotulo}</dt>
              <dd className="font-medium text-texto">{valor}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
