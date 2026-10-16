import { formatarDistanciaRestante, formatarTempoRestante } from '@/app/lib/mapa';

export interface EtaSemMapaProps {
  nomeEntregador: string | null;
  distanciaRestanteM: number | null;
  duracaoRestanteS: number | null;
}

// R-US03, mapa desligado pela empresa: Figma "03B — Rastreio sem mapa"
// (mobile, centralizado) e "03B — Rastreio sem mapa — Web" (desktop, card).
export default function EtaSemMapa({ nomeEntregador, distanciaRestanteM, duracaoRestanteS }: EtaSemMapaProps) {
  const tempo = formatarTempoRestante(duracaoRestanteS);
  const distancia = formatarDistanciaRestante(distanciaRestanteM);
  const quem = nomeEntregador ?? 'O entregador';

  if (!tempo || !distancia) {
    return (
      <section className="rounded-[16px] bg-superficie p-[27px] md:border md:border-borda">
        <p className="text-sm text-texto-apoio">Aguardando a localização do entregador.</p>
      </section>
    );
  }

  return (
    <section aria-live="polite">
      <div className="flex flex-col items-center bg-superficie px-[52px] py-[125px] md:hidden">
        <p className="flex h-28 w-full max-w-[285px] items-center justify-center rounded-[12px] bg-destaque-fundo font-titulo text-[44px] font-bold text-primaria-escura">
          {tempo}
        </p>
        <p className="mt-[29px] max-w-[280px] text-center text-[12.5px] font-bold text-texto-suave">
          {quem} está a caminho do seu endereço · {distancia} restantes
        </p>
      </div>

      <div className="hidden min-h-[420px] rounded-[16px] border border-borda bg-superficie p-[27px] md:block">
        <span className="inline-flex h-7 items-center rounded-[14px] bg-sucesso-fundo px-3 text-[10px] font-semibold text-sucesso-texto">
          A caminho
        </span>
        <div className="mt-8 h-[124px] rounded-[12px] bg-destaque-fundo px-[15px] pt-3">
          <p className="text-[54px] font-semibold leading-none text-texto-corpo">{tempo}</p>
          <p className="mt-2 text-base text-texto-apoio">para chegar ao seu endereço</p>
        </div>
        <p className="mt-[18px] text-sm font-semibold text-texto-corpo">
          {quem} está a caminho · {distancia} restantes
        </p>
      </div>
    </section>
  );
}
