import type { PassoDaLinhaDoTempo } from '@/app/lib/linhaDoTempo';

export interface LinhaDoTempoDoPedidoProps {
  passos: PassoDaLinhaDoTempo[];
}

function formatarHora(dataIso: string): string {
  return new Date(dataIso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default function LinhaDoTempoDoPedido({ passos }: LinhaDoTempoDoPedidoProps) {
  return (
    <ol aria-label="Andamento do pedido" className="flex flex-col">
      {passos.map((passo, indice) => {
        const alcancado = passo.em !== null;
        const ultimo = indice === passos.length - 1;
        return (
          <li key={passo.etapa} aria-current={passo.atual ? 'step' : undefined} className="flex gap-3">
            <span className="flex flex-col items-center">
              <span
                className={`mt-1 size-2.5 shrink-0 rounded-full border-2 ${
                  alcancado ? 'border-primaria bg-primaria' : 'border-borda bg-superficie'
                }`}
              />
              {!ultimo && <span className={`w-0.5 flex-1 ${alcancado ? 'bg-primaria' : 'bg-borda'}`} />}
            </span>
            <span className={`flex flex-1 items-baseline justify-between gap-3 ${ultimo ? '' : 'pb-4'}`}>
              <span
                className={`text-xs ${passo.atual ? 'font-semibold text-texto' : alcancado ? 'text-texto-corpo' : 'text-texto-suave'}`}
              >
                {passo.rotulo}
              </span>
              <span className="text-[11px] text-texto-apoio">
                {passo.em ? <time dateTime={passo.em}>{formatarHora(passo.em)}</time> : 'Aguardando'}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
