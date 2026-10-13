import { ETAPAS_DA_ENTREGA, etapaAlcancada, rotuloDoStatus } from '@/app/lib/pedidos';

export interface EtapasDaEntregaProps {
  status: string;
}

export default function EtapasDaEntrega({ status }: EtapasDaEntregaProps) {
  return (
    <ol className="flex flex-wrap gap-x-5 gap-y-2">
      {ETAPAS_DA_ENTREGA.map((etapa) => {
        const alcancada = etapaAlcancada(status, etapa);
        return (
          <li
            key={etapa}
            aria-current={etapa === status ? 'step' : undefined}
            className={`flex items-center gap-2 text-[11px] ${alcancada ? 'text-white' : 'text-lilas'}`}
          >
            <span className={`size-2.5 rounded-full border border-white ${alcancada ? 'bg-white' : ''}`} />
            {rotuloDoStatus(etapa)}
          </li>
        );
      })}
    </ol>
  );
}
